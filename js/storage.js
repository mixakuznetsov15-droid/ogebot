// ==========================================
//  ХРАНИЛИЩЕ ПРОГРЕССА
// ==========================================

var defaultProgress = {
  xp: 0,
  level: 1,
  streak: 0,
  lastDate: '',
  freezes: 0,
  lastFreezeMonday: '',
  completedLessons: {},
  theoryRead: {},
  totalAnswered: 0,
  totalCorrect: 0,
  chests: [],
  achievements: {},
  dailyTasks: {},
  dailyTasksDate: '',
  dailyTasksCollected: {},
  dailyXP: 0,
  dailyQuestions: 0,
  reviewData: {},
  onboardingCompleted: false,
  hintsShown: {},

  // Поля подписки (унифицированы с bot.py)
  trial_start: '',
  trial_end: '',
  subscription_until: '',

  // Дублирующие поля для обратной совместимости
  trialStartDate: '',
  subscriptionEndDate: '',

  // Новые поля для системы наград
  gems: 0,
  inventory: [],
  boosters: { type: null, expires: 0 },
  tools: {
    hints: 0,       // бесплатные подсказки
    fiftyFifty: 0   // убрать два неверных ответа
  }
};

var userProgress = JSON.parse(JSON.stringify(defaultProgress));

function saveProgress() {
  localStorage.setItem('geoProProgress', JSON.stringify(userProgress));
}

function loadProgress(callback) {
  var saved = localStorage.getItem('geoProProgress');
  if (saved) {
    try {
      var parsed = JSON.parse(saved);
      // Слияние с defaultProgress, чтобы добавить отсутствующие поля
      userProgress = Object.assign({}, defaultProgress, parsed);
      // Для вложенных объектов делаем глубокое слияние
      userProgress.completedLessons = Object.assign({}, defaultProgress.completedLessons, parsed.completedLessons || {});
      userProgress.theoryRead = Object.assign({}, defaultProgress.theoryRead, parsed.theoryRead || {});
      userProgress.achievements = Object.assign({}, defaultProgress.achievements, parsed.achievements || {});
      userProgress.dailyTasks = Object.assign({}, defaultProgress.dailyTasks, parsed.dailyTasks || {});
      userProgress.dailyTasksCollected = Object.assign({}, defaultProgress.dailyTasksCollected, parsed.dailyTasksCollected || {});
      userProgress.reviewData = Object.assign({}, defaultProgress.reviewData, parsed.reviewData || {});
      userProgress.hintsShown = Object.assign({}, defaultProgress.hintsShown, parsed.hintsShown || {});
      userProgress.boosters = Object.assign({}, defaultProgress.boosters, parsed.boosters || {});
      userProgress.tools = Object.assign({}, defaultProgress.tools, parsed.tools || {});
      // inventory — массив, если нет, берём default
      userProgress.inventory = Array.isArray(parsed.inventory) ? parsed.inventory : [];
    } catch(e) {
      userProgress = JSON.parse(JSON.stringify(defaultProgress));
    }
  } else {
    userProgress = JSON.parse(JSON.stringify(defaultProgress));
  }
  if (callback) callback();
}

// Безопасное обновление любого поля userProgress с автосохранением
function updateProgress(key, value) {
  if (userProgress.hasOwnProperty(key)) {
    userProgress[key] = value;
    saveProgress();
  } else {
    console.warn('Попытка обновить несуществующее поле userProgress:', key);
  }
}