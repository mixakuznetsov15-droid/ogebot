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

    this.currentState = 'idle';
    this.messageQueue = [];
    this.isShowing = false;

    // Счётчики для персонализации
    this.consecutiveCorrect = 0;
    this.consecutiveErrors = 0;
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
      .prof-bubble .btn-study-theory {
        display: inline-block;
        margin-top: 8px;
        background: var(--primary, #58a6ff);
        color: #fff;
        border: none;
        border-radius: 12px;
        padding: 6px 14px;
        font-family: 'Onest', sans-serif;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        pointer-events: auto;
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

  // Определение уровня пользователя
  getUserLevel() {
    const xp = userProgress.xp || 0;
    if (xp < 100) return 'beginner';
    if (xp < 500) return 'intermediate';
    return 'advanced';
  }

  // Персонализированное сообщение для правильных/неправильных ответов
  getPersonalizedMessage(type, correctAnswerText = '') {
    const level = this.getUserLevel();
    const basePool = this.messages[level] && this.messages[level][type];
    if (basePool && basePool.length > 0) {
      let msg = this._randomFromArray(basePool);
      if (correctAnswerText) {
        msg = msg.replace('{correctAnswer}', correctAnswerText);
      }
      return msg;
    }
    let fallback = this._randomFromArray(this.messages[type] || []);
    if (correctAnswerText) {
      fallback = fallback.replace('{correctAnswer}', correctAnswerText);
    }
    return fallback;
  }

  // Отслеживание ответов и возврат особых флагов
  trackAnswer(isCorrect) {
    if (isCorrect) {
      this.consecutiveCorrect++;
      this.consecutiveErrors = 0;
    } else {
      this.consecutiveErrors++;
      this.consecutiveCorrect = 0;
    }

    const flags = {
      fiveCorrect: this.consecutiveCorrect >= 5,
      threeErrors: this.consecutiveErrors >= 3
    };

    if (flags.fiveCorrect) {
      this.consecutiveCorrect = 0;
    }
    if (flags.threeErrors) {
      this.consecutiveErrors = 0;
    }

    return flags;
  }

  // Основные методы (с персонализацией)
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
    const text = this.getPersonalizedMessage('correct');
    this._enqueue(text, 'happy', 4000, 'success');
    return this;
  }

  onWrong(topicKey, correctAnswerText) {
    const text = this.getPersonalizedMessage('wrong', correctAnswerText);
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

  // Особые события
  showThreeErrorsMessage(skill) {
    const msg = skill 
      ? 'Три ошибки подряд по навыку «' + skill + '». Давай повторим теорию?' 
      : this.messages.threeErrorsInRow;
    this._enqueueWithButton(msg, 'Изучить теорию', () => {
      if (typeof openLessonTheory === 'function' && typeof currentLessonIndex !== 'undefined') {
        openLessonTheory(currentLessonIndex);
      }
    }, 'sad', 6000, 'error');
    return this;
  }

  showFiveCorrectMessage() {
    const msg = this.messages.fiveCorrectInRow;
    this._enqueue(msg, 'happy', 5000, 'success');
    return this;
  }

  // Новый метод: диагноз по навыку
  showDiagnosis(skill) {
    const msg = 'Похоже, нужно подтянуть навык «' + skill + '». Давай уделим ему внимание?';
    this._enqueue(msg, 'hint', 5000, 'diagnosis');
    return this;
  }

  // Обновлённый сессионный комментарий с анализом навыков
  generateSessionComment(topicTitle, accuracy, streak, topicKey) {
    const level = this.getUserLevel();
    let base = '';

    if (accuracy === 100) {
      base = 'Идеально! Ты справился со всеми вопросами без единой ошибки. ';
    } else if (accuracy >= 80) {
      base = 'Отличный результат! Видно, что ты хорошо подготовился. ';
    } else if (accuracy >= 60) {
      base = 'Хорошая работа, но есть куда расти. ';
    } else {
      base = 'Неплохо для начала, но стоит ещё повторить материал. ';
    }

    base += 'Тема «' + topicTitle + '» ' + (accuracy >= 80 ? 'далась тебе уверенно.' : 'потребует дополнительного внимания.');

    // Анализ навыков
    if (topicKey && userProgress.skillStats) {
      const prefix = topicKey + '_';
      const skillStats = Object.entries(userProgress.skillStats)
        .filter(([key]) => key.startsWith(prefix))
        .map(([key, val]) => ({ skill: key.replace(prefix, ''), ...val }));

      if (skillStats.length > 0) {
        let weakest = null;
        let maxWeakness = -1;
        for (const s of skillStats) {
          const total = s.correct + s.wrong;
          if (total === 0) continue;
          const weakness = s.wrong / total;
          if (weakness > maxWeakness) {
            maxWeakness = weakness;
            weakest = s.skill;
          }
        }
        if (weakest && maxWeakness > 0.5) {
          base += ' Особенно стоит подтянуть навык «' + weakest + '».';
        } else if (weakest && maxWeakness > 0.3) {
          base += ' Немного внимания навыку «' + weakest + '» — и будет отлично.';
        }
      }
    }

    if (streak >= 7) {
      base += ' Твоя серия впечатляет — продолжай в том же духе!';
    } else if (streak >= 3) {
      base += ' Не прерывай серию, ты на правильном пути.';
    }

    if (level === 'beginner') {
      base += ' Помни, что каждая ошибка — это шаг к знаниям.';
    } else if (level === 'advanced') {
      base += ' Ты уже почти эксперт, осталось лишь немного отточить навыки.';
    }

    return base;
  }

  // Очередь с кнопкой
  _enqueueWithButton(text, buttonText, onClick, emotion, duration, state) {
    const messageObj = { text, emotion, duration, state, button: { text: buttonText, onClick } };
    this.messageQueue.push(messageObj);
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
    const { text, emotion, duration, state, button } = this.messageQueue.shift();
    this._showMessageInternal(text, emotion, duration, state, () => {
      this._processQueue();
    }, button);
  }

  _showMessageInternal(text, emotion, duration, state, onComplete, button) {
    if (!this.containerEl) {
      onComplete();
      return;
    }

    this._setState(state, duration);

    this.bubbleEl.innerHTML = '';
    this.bubbleEl.appendChild(document.createTextNode(text));

    if (button) {
      const btn = document.createElement('button');
      btn.className = 'btn-study-theory';
      btn.textContent = button.text;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (button.onClick) button.onClick();
      });
      this.bubbleEl.appendChild(btn);
    }

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

  _enqueue(text, emotion, duration, state) {
    this.messageQueue.push({ text, emotion, duration, state });
    if (!this.isShowing) {
      this._processQueue();
    }
  }

  _setState(state, duration = 5000) {
    this.currentState = state;
    clearTimeout(this.stateTimer);
    if (state !== 'idle') {
      this.stateTimer = setTimeout(() => {
        this.currentState = 'idle';
      }, duration);
    }
  }

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