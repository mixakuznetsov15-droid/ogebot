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

  // Обработчик кнопки "Забрать"
  const btn = chestRewardEl.querySelector('.chest-reward-btn');
  btn.addEventListener('click', hideChestModal);
}

function showChestModal() {
  if (!chestModalRoot) createChestModal();
  // Сброс состояний
  chestAnimEl.style.display = 'block';
  chestRewardEl.classList.add('hidden');
  chestModalRoot.classList.add('show');
  // Запуск анимации открытия
  startChestOpeningAnimation();
}

function hideChestModal() {
  if (!chestModalRoot) return;
  chestModalRoot.classList.remove('show');
}

function startChestOpeningAnimation() {
  const lid = chestAnimEl.querySelector('.chest-lid');
  const particlesContainer = chestAnimEl.querySelector('.chest-particles');
  // Очищаем старые частицы
  particlesContainer.innerHTML = '';

  // Анимация крышки
  lid.classList.add('open');

  // Генерация частиц
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

  // Через время скрываем анимацию и показываем награду
  setTimeout(() => {
    lid.classList.remove('open');
    chestAnimEl.style.display = 'none';
  }, 1200);
}

function showRewardModal(reward) {
  if (!chestModalRoot) createChestModal();
  // Скрываем анимацию
  chestAnimEl.style.display = 'none';
  // Заполняем награду
  const iconMap = {
    xp: '⚡',
    freeze: '❄️',
    cosmetic: '🎨'
  };
  chestRewardEl.querySelector('.chest-reward-icon').textContent = iconMap[reward.type] || '🎁';
  chestRewardEl.querySelector('.chest-reward-title').textContent = 'Награда!';
  chestRewardEl.querySelector('.chest-reward-amount').textContent = `+${reward.amount} XP`;
  chestRewardEl.classList.remove('hidden');
}