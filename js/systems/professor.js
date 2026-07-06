// === js/systems/professor.js ===
export class ProfessorSystem {
  /**
   * @param {object} messages - объект сообщений PROFESSOR_MESSAGES
   * @param {object} images - пути к изображениям профессора:
   *   { default, happy, sad, hint }
   */
  constructor(messages, images) {
    this.messages = messages;
    this.images = images || {};
    this.hintLocked = false;
    this.speechTimer = null;
    this.widgetEl = null;
    this.speechEl = null;
    this.fabEl = null;
  }

  /**
   * Создаёт и монтирует плавающий виджет профессора (кнопка + облачко)
   * @returns {ProfessorSystem}
   */
  init() {
    if (this.widgetEl) return this;

    // ── Динамические стили виджета ──
    const style = document.createElement('style');
    style.textContent = `
      .prof-widget {
        position: fixed;
        bottom: 130px;
        right: 20px;
        z-index: 999;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 8px;
        pointer-events: none;
      }
      .prof-speech {
        background: var(--card2, #1c2333);
        border: 1px solid var(--border, rgba(255,255,255,0.05));
        border-radius: 16px;
        padding: 10px 14px;
        max-width: 220px;
        font-size: 13px;
        color: var(--text, #f0f6fc);
        box-shadow: 0 8px 20px rgba(0,0,0,0.4);
        position: relative;
        opacity: 0;
        transform: translateY(10px);
        transition: opacity 0.3s, transform 0.3s;
        pointer-events: auto;
        word-wrap: break-word;
      }
      .prof-speech.visible {
        opacity: 1;
        transform: translateY(0);
      }
      .prof-speech::after {
        content: '';
        position: absolute;
        bottom: -8px;
        right: 20px;
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid var(--card2, #1c2333);
      }
      .prof-fab {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: none;
        background: var(--card2, #1c2333);
        box-shadow: 0 6px 18px rgba(0,0,0,0.4);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        transition: transform 0.2s, box-shadow 0.2s;
        pointer-events: auto;
        padding: 0;
      }
      .prof-fab img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      /* Анимации */
      @keyframes profBounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }
      @keyframes profTilt {
        0% { transform: rotate(0); }
        25% { transform: rotate(-6deg); }
        75% { transform: rotate(6deg); }
        100% { transform: rotate(0); }
      }
      @keyframes profExplain {
        0% { transform: translateX(0); }
        25% { transform: translateX(-4px); }
        75% { transform: translateX(4px); }
        100% { transform: translateX(0); }
      }
      @keyframes profJump {
        0% { transform: scale(1); }
        50% { transform: scale(1.15); }
        100% { transform: scale(1); }
      }
      @keyframes profGlow {
        0% { box-shadow: 0 0 5px rgba(88,166,255,0.4); }
        50% { box-shadow: 0 0 18px rgba(88,166,255,0.7); }
        100% { box-shadow: 0 0 5px rgba(88,166,255,0.4); }
      }
      .prof-fab.prof-bounce { animation: profBounce 0.4s ease; }
      .prof-fab.prof-tilt { animation: profTilt 0.4s ease; }
      .prof-fab.prof-explain { animation: profExplain 0.5s ease; }
      .prof-fab.prof-jump { animation: profJump 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
      .prof-fab.prof-glow { animation: profGlow 0.8s ease; }
    `;
    document.head.appendChild(style);

    // ── Сборка DOM ──
    this.widgetEl = document.createElement('div');
    this.widgetEl.className = 'prof-widget';

    this.speechEl = document.createElement('div');
    this.speechEl.className = 'prof-speech';

    this.fabEl = document.createElement('button');
    this.fabEl.className = 'prof-fab';
    const img = document.createElement('img');
    img.src = this.images.default || '';
    img.alt = 'Профессор Гео';
    this.fabEl.appendChild(img);

    this.widgetEl.appendChild(this.speechEl);
    this.widgetEl.appendChild(this.fabEl);
    document.body.appendChild(this.widgetEl);

    // При клике на кнопку можно показывать приветствие, если нужно
    // (внешний код может переопределить или использовать своё поведение)
    this.fabEl.addEventListener('click', () => {
      // Ничего не делаем, внешний код сам управляет
    });

    return this;
  }

  /**
   * Показать ежедневное приветствие (один раз в день)
   * @returns {ProfessorSystem}
   */
  showGreeting() {
    const today = new Date().toISOString().slice(0, 10);
    const lastDate = localStorage.getItem('prof_greet_date');
    if (lastDate === today) return this;

    const text = this._randomFromArray(this.messages.greeting);
    this.showMessage(text, 'default', 'bounce', 5000);

    localStorage.setItem('prof_greet_date', today);
    return this;
  }

  /**
   * Реакция на правильный ответ
   * @param {string} topicKey - ключ темы (не используется в сообщении напрямую)
   * @returns {ProfessorSystem}
   */
  onCorrect(topicKey) {
    const text = this._randomFromArray(this.messages.correct);
    this.showMessage(text, 'happy', 'jump', 3000);
    return this;
  }

  /**
   * Реакция на неправильный ответ + показ правильного ответа
   * @param {string} topicKey
   * @param {string} correctAnswerText - текст правильного ответа
   * @returns {ProfessorSystem}
   */
  onWrong(topicKey, correctAnswerText) {
    let template = this._randomFromArray(this.messages.wrong);
    const text = template.replace('{correctAnswer}', correctAnswerText);
    this.showMessage(text, 'sad', 'tilt', 4000);
    return this;
  }

  /**
   * Показать объяснение (например, по кнопке «Показать объяснение»)
   * @param {string} text - текст объяснения
   * @returns {ProfessorSystem}
   */
  showExplanation(text) {
    this.showMessage(text, 'hint', 'explain', 6000);
    return this;
  }

  /**
   * Получить подсказку заданного уровня
   * @param {string} topicKey - ключ темы (может использоваться в будущем)
   * @param {number} currentLevel - уровень подсказки (1,2,3)
   * @returns {{ text: string, level: number, hasMore: boolean }}
   */
  getHint(topicKey, currentLevel) {
    // Если подсказки исчерпаны
    if (this.hintLocked) {
      return {
        text: this.messages.noMoreHints[0],
        level: currentLevel,
        hasMore: false
      };
    }

    const hintKey = `hint${currentLevel}`;
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

    // Блокируем кнопку после 3-й подсказки
    if (currentLevel === 3) {
      this.hintLocked = true;
    }

    return { text, level: currentLevel, hasMore };
  }

  /**
   * Показать сообщение в облачке с анимацией кнопки
   * @param {string} text - текст сообщения
   * @param {'default'|'happy'|'sad'|'hint'} emotion - эмоция для смены картинки
   * @param {'bounce'|'tilt'|'explain'|'jump'|'glow'} animationType - тип анимации кнопки
   * @param {number} [duration=3000] - время показа в мс
   * @returns {ProfessorSystem}
   */
  showMessage(text, emotion = 'default', animationType = 'bounce', duration = 3000) {
    if (!this.widgetEl) {
      console.warn('ProfessorSystem: виджет не инициализирован. Вызовите init()');
      return this;
    }

    // Безопасная вставка текста (textContent экранирует все HTML-теги)
    this.speechEl.textContent = text;
    this.speechEl.classList.add('visible');

    // Меняем изображение профессора
    const img = this.fabEl.querySelector('img');
    if (img) {
      const src = this.images[emotion] || this.images.default || '';
      img.src = src;
    }

    // Анимация кнопки
    this._clearAnimationClasses();
    this.fabEl.classList.add(`prof-${animationType}`);

    // Автоматическое скрытие через duration
    clearTimeout(this.speechTimer);
    this.speechTimer = setTimeout(() => {
      this.hideSpeech();
    }, duration);

    return this;
  }

  /**
   * Скрыть облачко и сбросить анимацию кнопки
   * @returns {ProfessorSystem}
   */
  hideSpeech() {
    if (!this.speechEl) return this;
    this.speechEl.classList.remove('visible');
    this._clearAnimationClasses();
    clearTimeout(this.speechTimer);
    return this;
  }

  /**
   * Событие повышения уровня
   * @param {number} level - новый уровень
   * @returns {ProfessorSystem}
   */
  onLevelUp(level) {
    const text = this._randomFromArray(this.messages.levelUp);
    this.showMessage(text, 'happy', 'jump', 4000);
    return this;
  }

  /**
   * Событие серии дней
   * @param {number} days - количество дней подряд
   * @returns {ProfessorSystem}
   */
  onStreak(days) {
    let template = this._randomFromArray(this.messages.streak);
    const text = template.replace('{n}', days);
    this.showMessage(text, 'happy', 'glow', 4000);
    return this;
  }

  /**
   * Открытие сундука
   * @returns {ProfessorSystem}
   */
  onChestOpen() {
    const text = this._randomFromArray(this.messages.chest);
    this.showMessage(text, 'happy', 'bounce', 5000);
    return this;
  }

  /**
   * Завершение темы
   * @param {string} topicTitle - название темы
   * @returns {ProfessorSystem}
   */
  onTopicComplete(topicTitle) {
    let template = this._randomFromArray(this.messages.finishTopic);
    const text = template.replace('{topic}', topicTitle);
    this.showMessage(text, 'happy', 'jump', 4500);
    return this;
  }

  /**
   * Ежедневное задание выполнено
   * @returns {ProfessorSystem}
   */
  onDailyTaskDone() {
    const text = this._randomFromArray(this.messages.dailyTaskDone);
    this.showMessage(text, 'happy', 'bounce', 4000);
    return this;
  }

  /**
   * Выбрать случайный элемент массива
   * @param {string[]} arr
   * @returns {string}
   */
  _randomFromArray(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Удалить все анимационные классы с кнопки
   */
  _clearAnimationClasses() {
    if (!this.fabEl) return;
    const animClasses = ['prof-bounce', 'prof-tilt', 'prof-explain', 'prof-jump', 'prof-glow'];
    this.fabEl.classList.remove(...animClasses);
  }
}