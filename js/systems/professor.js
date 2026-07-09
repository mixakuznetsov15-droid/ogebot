// === js/systems/professor.js ===
class ProfessorSystem {
  constructor(messages, images) {
    this.messages = messages;
    this.images = images || {};
    this.hintLocked = false;
    this.speechTimer = null;
    this.containerEl = null;
    this.characterEl = null;
    this.bubbleEl = null;

    // Конечный автомат
    this.currentState = 'idle';

    // Очередь сообщений
    this.messageQueue = [];
    this.isShowing = false;        // активно ли сообщение сейчас
  }

  init() {
    if (this.containerEl) return this;

    const style = document.createElement('style');
    style.textContent = `
      .prof-character-container {
        position: fixed;
        bottom: 0;
        right: 10px;
        z-index: 999;
        pointer-events: none;
        width: 160px;
        height: 180px;
        display: flex;
        align-items: flex-end;
        justify-content: center;
      }
      .prof-character {
        max-height: 180px;
        width: auto;
        display: block;
        pointer-events: auto;
        transform-origin: bottom center;
        transition: transform 0.3s ease;
      }
      .prof-idle {
        animation: profSway 4s ease-in-out infinite;
      }
      @keyframes profSway {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(1.5deg); }
        75% { transform: rotate(-1.5deg); }
      }
      .prof-leaning {
        animation: none !important;
        transform: rotate(-4deg) scale(1.02);
      }
      .prof-bubble {
        position: absolute;
        bottom: 160px;
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

    this.containerEl = document.createElement('div');
    this.containerEl.className = 'prof-character-container';

    this.bubbleEl = document.createElement('div');
    this.bubbleEl.className = 'prof-bubble';

    this.characterEl = document.createElement('img');
    this.characterEl.className = 'prof-character prof-idle';
    this.characterEl.src = this.images.default || '';
    this.characterEl.alt = 'Профессор Гео';
    this.characterEl.draggable = false;

    this.containerEl.appendChild(this.bubbleEl);
    this.containerEl.appendChild(this.characterEl);
    document.body.appendChild(this.containerEl);

    this.characterEl.addEventListener('click', () => {
      this.showGreeting();
    });

    return this;
  }

  // --------------------------------------------------
  //  Управление состоянием конечного автомата
  // --------------------------------------------------
  _setState(state, duration = 5000) {
    this.currentState = state;
    clearTimeout(this.stateTimer);
    if (state !== 'idle') {
      this.stateTimer = setTimeout(() => {
        this.currentState = 'idle';
      }, duration);
    }
  }

  // --------------------------------------------------
  //  Очередь сообщений
  // --------------------------------------------------
  _enqueue(text, emotion, duration, state) {
    this.messageQueue.push({ text, emotion, duration, state });
    if (!this.isShowing) {
      this._processQueue();
    }
  }

  _processQueue() {
    if (this.messageQueue.length === 0) {
      this.isShowing = false;
      this.hideSpeech();
      return;
    }

    this.isShowing = true;
    const { text, emotion, duration, state } = this.messageQueue.shift();
    this._showMessageInternal(text, emotion, duration, state, () => {
      // По завершении текущего сообщения запускаем следующее
      this._processQueue();
    });
  }

  _showMessageInternal(text, emotion, duration, state, onComplete) {
    if (!this.containerEl) {
      onComplete();
      return;
    }

    this._setState(state, duration);

    this.bubbleEl.textContent = text;
    this.bubbleEl.classList.add('visible');

    const src = this.images[emotion] || this.images.default;
    if (src) {
      this.characterEl.src = src;
    }

    this.characterEl.classList.add('prof-leaning');

    clearTimeout(this.speechTimer);
    this.speechTimer = setTimeout(() => {
      this.bubbleEl.classList.remove('visible');
      this.characterEl.classList.remove('prof-leaning');
      this.characterEl.classList.add('prof-idle');
      this.currentState = 'idle';
      onComplete();
    }, duration);
  }

  // --------------------------------------------------
  //  Публичные методы (ставят события в очередь)
  // --------------------------------------------------
  showGreeting() {
    const today = new Date().toISOString().slice(0, 10);
    const lastDate = localStorage.getItem('prof_greet_date');
    if (lastDate === today) return this;
    const text = this._randomFromArray(this.messages.greeting);
    this._enqueue(text, 'default', 5000, 'greeting');
    localStorage.setItem('prof_greet_date', today);
    return this;
  }

  onCorrect(topicKey) {
    const text = this._randomFromArray(this.messages.correct);
    this._enqueue(text, 'happy', 4000, 'success');
    return this;
  }

  onWrong(topicKey, correctAnswerText) {
    let template = this._randomFromArray(this.messages.wrong);
    const text = template.replace('{correctAnswer}', correctAnswerText);
    this._enqueue(text, 'sad', 5000, 'error');
    return this;
  }

  showExplanation(text) {
    this._enqueue(text, 'hint', 6000, 'hint');
    return this;
  }

  showHint(text) {
    this._enqueue('💡 ' + text, 'hint', 5000, 'hint');
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
    if (currentLevel === 3) this.hintLocked = true;
    return { text, level: currentLevel, hasMore };
  }

  onLevelUp(level) {
    const text = this._randomFromArray(this.messages.levelUp);
    this._enqueue(text, 'happy', 5000, 'levelUp');
    return this;
  }

  onStreak(days) {
    let template = this._randomFromArray(this.messages.streak);
    const text = template.replace('{n}', days);
    this._enqueue(text, 'happy', 5000, 'streak');
    return this;
  }

  onChestOpen() {
    const text = this._randomFromArray(this.messages.chest);
    this._enqueue(text, 'happy', 6000, 'chest');
    return this;
  }

  onTopicComplete(topicTitle) {
    let template = this._randomFromArray(this.messages.finishTopic);
    const text = template.replace('{topic}', topicTitle);
    this._enqueue(text, 'happy', 5500, 'topicComplete');
    return this;
  }

  onDailyTaskDone() {
    const text = this._randomFromArray(this.messages.dailyTaskDone);
    this._enqueue(text, 'happy', 4000, 'dailyTask');
    return this;
  }

  onAchievement(text) {
    this._enqueue(text || '🏆 Новое достижение!', 'happy', 5000, 'achievement');
    return this;
  }

  // --------------------------------------------------
  //  Вспомогательные
  // --------------------------------------------------
  hideSpeech() {
    if (!this.bubbleEl) return;
    this.bubbleEl.classList.remove('visible');
    this.characterEl.classList.remove('prof-leaning');
    this.characterEl.classList.add('prof-idle');
    clearTimeout(this.speechTimer);
    this.currentState = 'idle';
  }

  _randomFromArray(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}

window.ProfessorSystem = ProfessorSystem;