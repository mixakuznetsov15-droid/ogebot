// === js/systems/professor.js ===
class ProfessorSystem {
  constructor(messages, images) {
    this.messages = messages;
    this.images = images || {};
    this.hintLocked = false;
    this.speechTimer = null;
    this.containerEl = null;   // главный контейнер (фиксированный)
    this.characterEl = null;   // изображение профессора
    this.bubbleEl = null;      // облачко с текстом
  }

  /**
   * Создаёт большого персонажа внизу экрана (как Duo в Duolingo)
   */
  init() {
    if (this.containerEl) return this;

    // ── Стили ──
    const style = document.createElement('style');
    style.textContent = `
      /* Фиксированный контейнер в правом нижнем углу */
      .prof-character-container {
        position: fixed;
        bottom: 0;
        right: 10px;
        z-index: 999;
        pointer-events: none;   /* сквозь персонажа можно кликать */
        width: 160px;           /* ширина области, картинка может быть уже */
        height: 180px;          /* часть персонажа уйдёт за экран */
        display: flex;
        align-items: flex-end;
        justify-content: center;
      }

      /* Изображение профессора */
      .prof-character {
        max-height: 180px;
        width: auto;
        display: block;
        pointer-events: auto;   /* по самой картинке кликать можно */
        transform-origin: bottom center;
        transition: transform 0.3s ease;
      }

      /* Покачивание в покое */
      .prof-idle {
        animation: profSway 4s ease-in-out infinite;
      }
      @keyframes profSway {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(1.5deg); }
        75% { transform: rotate(-1.5deg); }
      }

      /* Наклон при сообщении */
      .prof-leaning {
        animation: none !important;          /* убираем покачивание */
        transform: rotate(-4deg) scale(1.02);
      }

      /* Облачко с текстом */
      .prof-bubble {
        position: absolute;
        bottom: 160px;                      /* над головой персонажа */
        right: 0;
        margin-right: 10px;
        background: #ffffff;
        color: #1a1a1a;
        padding: 10px 15px;
        border-radius: 18px 18px 6px 18px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-family: 'Onest', sans-serif;
        font-size: 14px;
        line-height: 1.5;
        max-width: 220px;
        pointer-events: auto;
        opacity: 0;
        transform: translateY(10px);
        transition: opacity 0.3s, transform 0.3s;
        z-index: 1000;
      }
      .prof-bubble.visible {
        opacity: 1;
        transform: translateY(0);
      }
      /* Хвостик облачка (указывает на профессора) */
      .prof-bubble::after {
        content: '';
        position: absolute;
        bottom: -10px;
        right: 24px;
        width: 0;
        height: 0;
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        border-top: 10px solid #ffffff;
      }
    `;
    document.head.appendChild(style);

    // ── Сборка DOM ──
    this.containerEl = document.createElement('div');
    this.containerEl.className = 'prof-character-container';

    // Облачко
    this.bubbleEl = document.createElement('div');
    this.bubbleEl.className = 'prof-bubble';

    // Изображение профессора
    this.characterEl = document.createElement('img');
    this.characterEl.className = 'prof-character prof-idle';
    this.characterEl.src = this.images.default || '';
    this.characterEl.alt = 'Профессор Гео';
    this.characterEl.draggable = false;

    // Собираем: сначала облачко (позже будет абсолютно позиционировано),
    // потом картинка персонажа
    this.containerEl.appendChild(this.bubbleEl);
    this.containerEl.appendChild(this.characterEl);
    document.body.appendChild(this.containerEl);

    // Обработчик клика по профессору (можно повторить приветствие)
    this.characterEl.addEventListener('click', () => {
      this.showGreeting();
    });

    return this;
  }

  // ── Основные методы ──

  showGreeting() {
    const today = new Date().toISOString().slice(0, 10);
    const lastDate = localStorage.getItem('prof_greet_date');
    if (lastDate === today) return this;

    const text = this._randomFromArray(this.messages.greeting);
    this.showMessage(text, 'default', 5000);

    localStorage.setItem('prof_greet_date', today);
    return this;
  }

  onCorrect(topicKey) {
    const text = this._randomFromArray(this.messages.correct);
    this.showMessage(text, 'happy', 4000);
    return this;
  }

  onWrong(topicKey, correctAnswerText) {
    let template = this._randomFromArray(this.messages.wrong);
    const text = template.replace('{correctAnswer}', correctAnswerText);
    this.showMessage(text, 'sad', 5000);
    return this;
  }

  showExplanation(text) {
    this.showMessage(text, 'hint', 6000);
    return this;
  }

  getHint(topicKey, currentLevel) {
    if (this.hintLocked) {
      return {
        text: this.messages.noMoreHints[0],
        level: currentLevel,
        hasMore: false
      };
    }

    const hintKey = 'hint' + currentLevel;
    const hints = this.messages[hintKey];
    if (!hints || hints.length === 0) {
      return {
        text: 'Нет подсказок этого уровня.',
        level: currentLevel,
        hasMore: false
      };
    }

    const text = this._randomFromArray(hints);
    const hasMore = currentLevel < 3;

    if (currentLevel === 3) {
      this.hintLocked = true;
    }

    return { text, level: currentLevel, hasMore };
  }

  /**
   * Показать сообщение в облачке
   * @param {string} text
   * @param {'default'|'happy'|'sad'|'hint'} emotion
   * @param {number} [duration=3000] мс
   */
  showMessage(text, emotion = 'default', duration = 3000) {
    if (!this.containerEl) return this;

    // Текст облачка (безопасно)
    this.bubbleEl.textContent = text;
    this.bubbleEl.classList.add('visible');

    // Меняем эмоцию (картинку)
    const src = this.images[emotion] || this.images.default;
    if (src) {
      this.characterEl.src = src;
    }

    // Наклоняем профессора
    this.characterEl.classList.add('prof-leaning');

    // Автоматически скрываем через duration
    clearTimeout(this.speechTimer);
    this.speechTimer = setTimeout(() => {
      this.hideSpeech();
    }, duration);

    return this;
  }

  hideSpeech() {
    if (!this.bubbleEl) return this;
    this.bubbleEl.classList.remove('visible');
    // Убираем наклон, возвращаем покачивание
    this.characterEl.classList.remove('prof-leaning');
    this.characterEl.classList.add('prof-idle');
    clearTimeout(this.speechTimer);
    return this;
  }

  // ── События прогресса ──

  onLevelUp(level) {
    const text = this._randomFromArray(this.messages.levelUp);
    this.showMessage(text, 'happy', 5000);
    return this;
  }

  onStreak(days) {
    let template = this._randomFromArray(this.messages.streak);
    const text = template.replace('{n}', days);
    this.showMessage(text, 'happy', 5000);
    return this;
  }

  onChestOpen() {
    const text = this._randomFromArray(this.messages.chest);
    this.showMessage(text, 'happy', 6000);
    return this;
  }

  onTopicComplete(topicTitle) {
    let template = this._randomFromArray(this.messages.finishTopic);
    const text = template.replace('{topic}', topicTitle);
    this.showMessage(text, 'happy', 5500);
    return this;
  }

  onDailyTaskDone() {
    const text = this._randomFromArray(this.messages.dailyTaskDone);
    this.showMessage(text, 'happy', 4000);
    return this;
  }

  // ── Вспомогательные ──

  _randomFromArray(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}

// Глобальный доступ
window.ProfessorSystem = ProfessorSystem;