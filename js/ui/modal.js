// ==========================================
//  МОДАЛЬНЫЕ ОКНА (сундуки, профессор и общие функции)
// ==========================================

let chestModalRoot = null;
let chestAnimEl = null;
let chestRewardEl = null;

function createChestModal() {
  const template = document.getElementById('chest-modal-template');
  if (!template) {
    console.error('Template #chest-modal-template not found');
    return;
  }
  const clone = document.importNode(template.content, true);
  document.body.appendChild(clone);
  chestModalRoot = document.querySelector('.chest-modal-overlay');
  chestAnimEl = document.getElementById('chest-anim');
  chestRewardEl = document.getElementById('chest-reward');

  const btn = chestRewardEl.querySelector('.chest-reward-btn');
  btn.addEventListener('click', hideChestModal);
}

function showChestModal() {
  if (!chestModalRoot) createChestModal();
  chestAnimEl.style.display = 'block';
  chestRewardEl.classList.add('hidden');
  chestModalRoot.classList.add('show');
  startChestOpeningAnimation();
}

function hideChestModal() {
  if (!chestModalRoot) return;
  chestModalRoot.classList.remove('show');
  setTimeout(() => {
    chestAnimEl.style.display = 'none';
    chestRewardEl.classList.add('hidden');
    if (typeof ChestManager !== 'undefined') {
      ChestManager._isOpening = false;
    }
    // Обновляем счётчик сундуков в профиле
    if (typeof renderProfile === 'function') {
      renderProfile();
    }
  }, 300);
}

function startChestOpeningAnimation() {
  const lid = chestAnimEl.querySelector('.chest-lid');
  const particlesContainer = chestAnimEl.querySelector('.chest-particles');
  particlesContainer.innerHTML = '';

  lid.classList.add('open');

  for (let i = 0; i < 12; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const angle = (i / 12) * 360;
    const radius = 30 + Math.random() * 20;
    const x = Math.cos(angle * Math.PI / 180) * radius;
    const y = Math.sin(angle * Math.PI / 180) * radius - 20;
    p.style.setProperty('--x', x + 'px');
    p.style.setProperty('--y', y + 'px');
    particlesContainer.appendChild(p);
  }

  setTimeout(() => {
    lid.classList.remove('open');
    chestAnimEl.style.display = 'none';
  }, 1200);
}

function showRewardModal(reward) {
  if (!chestModalRoot) createChestModal();
  chestAnimEl.style.display = 'none';

  // Иконки для разных типов наград
  const iconMap = {
    xp: '⚡',
    gems: '💎',
    booster: '⏱️',
    streakFreeze: '❄️',
    tool_hint: '💡',
    tool_fiftyFifty: '🎲',
    cosmetic: '🎨'
  };
  chestRewardEl.querySelector('.chest-reward-icon').textContent = iconMap[reward.type] || '🎁';

  // Заголовок и сумма
  const titleMap = {
    xp: 'Опыт',
    gems: 'Кристаллы',
    booster: 'Бустер XP',
    streakFreeze: 'Заморозка серии',
    tool_hint: 'Подсказка',
    tool_fiftyFifty: 'Шанс 50/50',
    cosmetic: 'Предмет'
  };
  chestRewardEl.querySelector('.chest-reward-title').textContent = titleMap[reward.type] || 'Награда!';

  const amountText = reward.type === 'booster' 
    ? (Math.round(reward.duration / 60000) + ' мин.')
    : (reward.amount ? '+' + reward.amount : '');
  chestRewardEl.querySelector('.chest-reward-amount').textContent = amountText;

  chestRewardEl.classList.remove('hidden');
}