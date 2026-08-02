// ==========================================
//  ОНБОРДИНГ: PRODUCT TOUR + CONTEXTUAL HINTS
// ==========================================

// ---------- ЧАСТЬ 1: Product Tour ----------
const ONBOARDING_STEPS = [
  {
    title: 'Привет! Я Профессор Гео 👋',
    text: 'Помогу тебе подготовиться к ОГЭ по географии. Покажу как здесь всё устроено за 30 секунд.',
    btnLabel: 'Показать →',
    illustration: '👋' // заменим на ICONS при необходимости
  },
  {
    title: 'Твой путь обучения',
    text: 'Проходи темы по порядку — от простого к сложному. Каждая тема открывается после предыдущей.',
    btnLabel: 'Дальше →',
    illustration: ICONS.list
  },
  {
    title: 'Собирай награды',
    text: 'За прохождение тем получай XP, сундуки с бонусами и достижения. Не теряй серию дней подряд!',
    btnLabel: 'Начать обучение 🚀',
    illustration: `<div style="display:flex;gap:12px;justify-content:center;">${ICONS.gift} ${ICONS.fire} ${ICONS.trophy}</div>`
  }
];

let currentOnboardingStep = 0;
let onboardingOverlay = null;
let onboardingCard = null;
let onboardingDots = null;

function createOnboardingUI() {
  // Оверлей
  onboardingOverlay = document.createElement('div');
  onboardingOverlay.className = 'prof-modal-overlay onboarding-overlay';
  onboardingOverlay.style.zIndex = '3000';

  // Карточка
  onboardingCard = document.createElement('div');
  onboardingCard.className = 'prof-modal-card onboarding-card';
  onboardingCard.innerHTML = `
    <div class="onboarding-dots" id="onboarding-dots">
      <div class="onboarding-dot active"></div>
      <div class="onboarding-dot"></div>
      <div class="onboarding-dot"></div>
    </div>
    <button class="onboarding-skip" id="onboarding-skip">Пропустить</button>
    <div class="onboarding-illustration" id="onboarding-illustration"></div>
    <div class="onboarding-title" id="onboarding-title"></div>
    <div class="onboarding-text" id="onboarding-text"></div>
    <button class="btn-primary onboarding-next" id="onboarding-next"></button>
  `;
  onboardingOverlay.appendChild(onboardingCard);
  document.body.appendChild(onboardingOverlay);

  // Обработчики
  document.getElementById('onboarding-next').addEventListener('click', nextOnboardingStep);
  document.getElementById('onboarding-skip').addEventListener('click', skipOnboarding);
}

function updateOnboardingStep(stepIndex) {
  const step = ONBOARDING_STEPS[stepIndex];
  document.getElementById('onboarding-title').textContent = step.title;
  document.getElementById('onboarding-text').textContent = step.text;
  document.getElementById('onboarding-next').textContent = step.btnLabel;
  document.getElementById('onboarding-illustration').innerHTML = typeof step.illustration === 'string' ? step.illustration : '';
  
  // Обновить точки
  const dots = document.querySelectorAll('.onboarding-dot');
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === stepIndex);
  });

  // Показать/скрыть кнопку пропуска (только на первом шаге)
  const skipBtn = document.getElementById('onboarding-skip');
  skipBtn.style.display = stepIndex === 0 ? 'block' : 'none';
}

function showOnboarding() {
  if (!onboardingOverlay) createOnboardingUI();
  currentOnboardingStep = 0;
  updateOnboardingStep(0);
  onboardingOverlay.classList.add('show');
}

function hideOnboarding() {
  if (onboardingOverlay) {
    onboardingOverlay.classList.remove('show');
  }
  // Завершение онбординга
  userProgress.onboardingCompleted = true;
  saveProgress();
  
  // Показать приветствие профессора
  if (typeof professor !== 'undefined' && professor.showGreeting) {
    setTimeout(() => professor.showGreeting(), 300);
  }
  
  // Удалить со страницы через время
  setTimeout(() => {
    if (onboardingOverlay && onboardingOverlay.parentNode) {
      onboardingOverlay.parentNode.removeChild(onboardingOverlay);
      onboardingOverlay = null;
      onboardingCard = null;
    }
  }, 500);
}

function nextOnboardingStep() {
  currentOnboardingStep++;
  if (currentOnboardingStep >= ONBOARDING_STEPS.length) {
    hideOnboarding();
  } else {
    updateOnboardingStep(currentOnboardingStep);
  }
}

function skipOnboarding() {
  currentOnboardingStep = ONBOARDING_STEPS.length; // чтобы nextOnboardingStep завершил
  hideOnboarding();
}

// ---------- ЧАСТЬ 2: Contextual Hints ----------
const CONTEXTUAL_HINTS = {
  firstChest: {
    trigger: 'chestCountChanged',
    condition: () => (userProgress.chests || []).length === 1 && !(userProgress.hintsShown && userProgress.hintsShown.firstChest),
    selector: '#chest-button',
    text: 'Нажми, чтобы открыть первый сундук!',
    position: 'top'
  },
  firstQuizHint: {
    trigger: 'quizStarted',
    condition: () => !(userProgress.hintsShown && userProgress.hintsShown.firstQuizHint),
    selector: '#btn-hint',
    text: 'Застрял? Профессор подскажет — нажми сюда',
    position: 'top'
  },
  firstWrongAnswer: {
    trigger: 'answeredWrong',
    condition: () => !(userProgress.hintsShown && userProgress.hintsShown.firstWrongAnswer),
    selector: '#btn-ask-ai',
    text: 'Не расстраивайся — попроси объяснение у профессора',
    position: 'top'
  }
};

function showContextualHint(hintKey) {
  const hint = CONTEXTUAL_HINTS[hintKey];
  if (!hint || !hint.condition()) return;
  
  const target = document.querySelector(hint.selector);
  if (!target) return;
  
  // Убедимся, что элемент видим
  const rect = target.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;
  
  // Создаём spotlight-оверлей
  const overlay = document.createElement('div');
  overlay.className = 'contextual-hint-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 2500;
    background: transparent;
    pointer-events: none;
  `;
  
  // Создаём подсветку элемента
  const spotlight = document.createElement('div');
  spotlight.style.cssText = `
    position: fixed;
    z-index: 2501;
    border-radius: 12px;
    box-shadow: 0 0 0 9999px rgba(0,0,0,0.75);
    left: ${rect.left - 4}px;
    top: ${rect.top - 4}px;
    width: ${rect.width + 8}px;
    height: ${rect.height + 8}px;
    pointer-events: none;
  `;
  
  // Создаём подсказку
  const tooltip = document.createElement('div');
  tooltip.className = 'prof-geo-speech contextual-hint-tooltip';
  tooltip.textContent = hint.text;
  tooltip.style.cssText = `
    position: fixed;
    z-index: 2502;
    max-width: 220px;
    text-align: center;
    animation: pulse-hint 1.5s infinite;
  `;
  
  // Позиционирование подсказки
  if (hint.position === 'top') {
    tooltip.style.left = `${rect.left + rect.width/2}px`;
    tooltip.style.top = `${rect.top - 12}px`;
    tooltip.style.transform = 'translate(-50%, -100%)';
  } else {
    tooltip.style.left = `${rect.left + rect.width/2}px`;
    tooltip.style.top = `${rect.bottom + 12}px`;
    tooltip.style.transform = 'translate(-50%, 0)';
  }
  
  document.body.appendChild(overlay);
  document.body.appendChild(spotlight);
  document.body.appendChild(tooltip);
  
  // Закрытие по клику на целевой элемент
  function dismissHint(e) {
    overlay.remove();
    spotlight.remove();
    tooltip.remove();
    if (!userProgress.hintsShown) userProgress.hintsShown = {};
    userProgress.hintsShown[hintKey] = true;
    saveProgress();
    target.removeEventListener('click', dismissHint);
  }
  
  target.addEventListener('click', dismissHint, { once: true });
}

// ---------- ЧАСТЬ 3: Инициализация ----------
function startOnboarding() {
  if (!userProgress.onboardingCompleted) {
    showOnboarding();
  }
}

// Функция для вызова подсказок в нужных местах
function triggerOnboardingHints(hintKey) {
  if (!userProgress.onboardingCompleted) return; // только после тура
  setTimeout(() => {
    showContextualHint(hintKey);
  }, 500); // небольшая задержка для рендера
}
