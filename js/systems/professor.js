// === js/systems/professor.js ===
class ProfessorSystem {
  constructor(messages, images) {
    this.messages = messages;
    this.images = images || {};
    this.hintLocked = false;
    this.speechTimer = null;
    this.widgetEl = null;
    this.speechEl = null;
    this.fabEl = null;
  }

  init() {
    if (this.widgetEl) return this;

    // Стили для виджета
    const style = document.createElement('style');
    style.textContent = `
      .prof-widget { position: fixed; bottom: 130px; right: 20px; z-index: 999; display: flex; flex-direction: column; align-items: flex-end; gap: 8px; pointer-events: none; }
      .prof-speech { background: var(--card2, #1c2333); border: 1px solid var(--border, rgba(255,255,255,0.05)); border-radius: 16px; padding: 10px 14px; max-width: 220px; font-size: 13px; color: var(--text, #f0f6fc); box-shadow: 0 8px 20px rgba(0,0,0,0.4); position: relative; opacity: 0; transform: translateY(10px); transition: opacity 0.3s, transform 0.3s; pointer-events: auto; word-wrap: break-word; }
      .prof-speech.visible { opacity: 1; transform: translateY(0); }
      .prof-speech::after { content: ''; position: absolute; bottom: -8px; right: 20px; width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 8px solid var(--card2, #1c2333); }
      .prof-fab { width: 56px; height: 56px; border-radius: 50%; border: none; background: var(--card2, #1c2333); box-shadow: 0 6px 18px rgba(0,0,0,0.4); cursor: pointer; display: flex; align-items: center; justify-content: center; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s; pointer-events: auto; padding: 0; }
      .prof-fab img { width: 100%; height: 100%; object-fit: cover; }
      @keyframes profBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      @keyframes profTilt { 0% { transform: rotate(0); } 25% { transform: rotate(-6deg); } 75% { transform: rotate(6deg); } 100% { transform: rotate(0); } }
      @keyframes profExplain { 0% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } 100% { transform: translateX(0); } }
      @keyframes profJump { 0% { transform: scale(1); } 50% { transform: scale(1.15); } 100% { transform: scale(1); } }
      @keyframes profGlow { 0% { box-shadow: 0 0 5px rgba(88,166,255,0.4); } 50% { box-shadow: 0 0 18px rgba(88,166,255,0.7); } 100% { box-shadow: 0 0 5px rgba(88,166,255,0.4); } }
      .prof-fab.prof-bounce { animation: profBounce 0.4s ease; }
      .prof-fab.prof-tilt { animation: profTilt 0.4s ease; }
      .prof-fab.prof-explain { animation: profExplain 0.5s ease; }
      .prof-fab.prof-jump { animation: profJump 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
      .prof-fab.prof-glow { animation: profGlow 0.8s ease; }
    `;
    document.head.appendChild(style);

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

    this.fabEl.addEventListener('click', () => {});
    return this;
  }

  showGreeting() {
    const today = new Date().toISOString().slice(0, 10);
    const lastDate = localStorage.getItem('prof_greet_date');
    if (lastDate === today) return this;
    const text = this._randomFromArray(this.messages.greeting);
    this.showMessage(text, 'default', 'bounce', 5000);
    localStorage.setItem('prof_greet_date', today);
    return this;
  }

  onCorrect(topicKey) {
    const text = this._randomFromArray(this.messages.correct);
    this.showMessage(text, 'happy', 'jump', 3000);
    return this;
  }

  onWrong(topicKey, correctAnswerText) {
    let template = this._randomFromArray(this.messages.wrong);
    const text = template.replace('{correctAnswer}', correctAnswerText);
    this.showMessage(text, 'sad', 'tilt', 4000);
    return this;
  }

  showExplanation(text) {
    this.showMessage(text, 'hint', 'explain', 6000);
    return this;
  }

  getHint(topicKey, currentLevel) {
    if (this.hintLocked) {
      return { text: this.messages.noMoreHints[0], level: currentLevel, hasMore: false };
    }
    const hintKey = 'hint' + currentLevel;
    const hints = this.messages[hintKey];
    if (!hints || hints.length === 0) {
      return { text: 'Нет подсказок этого уровня.', level: currentLevel, hasMore: false };
    }
    const text = this._randomFromArray(hints);
    const hasMore = currentLevel < 3;
    if (currentLevel === 3) this.hintLocked = true;
    return { text, level: currentLevel, hasMore };
  }

  showMessage(text, emotion = 'default', animationType = 'bounce', duration = 3000) {
    if (!this.widgetEl) return this;
    this.speechEl.textContent = text;
    this.speechEl.classList.add('visible');
    const img = this.fabEl.querySelector('img');
    if (img) img.src = this.images[emotion] || this.images.default || '';
    this._clearAnimationClasses();
    this.fabEl.classList.add('prof-' + animationType);
    clearTimeout(this.speechTimer);
    this.speechTimer = setTimeout(() => this.hideSpeech(), duration);
    return this;
  }

  hideSpeech() {
    if (!this.speechEl) return this;
    this.speechEl.classList.remove('visible');
    this._clearAnimationClasses();
    clearTimeout(this.speechTimer);
    return this;
  }

  onLevelUp(level) {
    this.showMessage(this._randomFromArray(this.messages.levelUp), 'happy', 'jump', 4000);
    return this;
  }

  onStreak(days) {
    let template = this._randomFromArray(this.messages.streak);
    this.showMessage(template.replace('{n}', days), 'happy', 'glow', 4000);
    return this;
  }

  onChestOpen() {
    this.showMessage(this._randomFromArray(this.messages.chest), 'happy', 'bounce', 5000);
    return this;
  }

  onTopicComplete(topicTitle) {
    let template = this._randomFromArray(this.messages.finishTopic);
    this.showMessage(template.replace('{topic}', topicTitle), 'happy', 'jump', 4500);
    return this;
  }

  onDailyTaskDone() {
    this.showMessage(this._randomFromArray(this.messages.dailyTaskDone), 'happy', 'bounce', 4000);
    return this;
  }

  _randomFromArray(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  _clearAnimationClasses() {
    if (!this.fabEl) return;
    const animClasses = ['prof-bounce', 'prof-tilt', 'prof-explain', 'prof-jump', 'prof-glow'];
    this.fabEl.classList.remove(...animClasses);
  }
}

// Важно: делаем класс доступным везде
window.ProfessorSystem = ProfessorSystem;