// ==========================================
//  ГЛАВНАЯ ТОЧКА ВХОДА
// ==========================================

document.addEventListener('DOMContentLoaded', function () {
  loadProgress(function () {
    // Heartbeat-сигнал активности
    if (isTelegram && typeof tgApp.sendData === 'function') {
      tgApp.sendData(JSON.stringify({ action: 'heartbeat' }));
    }

    // Инициализация менеджера сундуков (ChestManager 2.0)
    ChestManager.init({
      getProgress: () => userProgress,
      saveProgress: () => saveProgress(),
      ui: {
        onOpenStart: () => {
          if (typeof showChestModal === 'function') showChestModal();
        },
        onReward: (reward) => {
          if (typeof showRewardModal === 'function') {
            setTimeout(() => showRewardModal(reward), 1200);
          }
          let toastMsg = '';
          switch (reward.type) {
            case 'xp':
              toastMsg = `Получено: ${reward.amount} XP`;
              break;
            case 'gems':
              toastMsg = `Получено: ${reward.amount} кристаллов`;
              break;
            case 'booster':
              toastMsg = `Бустер XP на ${Math.round(reward.duration / 60000)} мин.`;
              break;
            case 'streakFreeze':
              toastMsg = 'Получена заморозка серии!';
              break;
            case 'tool_hint':
              toastMsg = 'Получена бесплатная подсказка!';
              break;
            case 'tool_fiftyFifty':
              toastMsg = 'Получен шанс 50/50!';
              break;
            case 'cosmetic':
              toastMsg = 'Новый предмет в коллекции!';
              break;
            default:
              toastMsg = 'Награда получена!';
          }
          if (typeof showToast === 'function') showToast(toastMsg);
        },
        onError: (msg) => {
          if (typeof showToast === 'function') showToast(msg);
        },
        onComplete: () => {}
      }
    });

    checkStreak();
    updateDailyTasks();
    checkAchievements();
    Subscription.initTrial();

    if (typeof startOnboarding === 'function') startOnboarding();
    renderHomePath();
  });

  var professor = new ProfessorSystem(PROFESSOR_MESSAGES, {
    default: 'images/professor_default.png',
    happy: 'images/professor_happy.png',
    sad: 'images/professor_sad.png',
    hint: 'images/professor_hint.png'
  });
  professor.init();
  professor.showGreeting();
  window.professor = professor;

  // idle timer (20 сек)
  var idleTimer;
  function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function() {
      if (professor && professor.currentState === 'idle') {
        professor.showMessage('Не застрял? Если нужна помощь — я рядом.', 'hint', 5000, 'hint');
      }
    }, 20000);
  }
  document.addEventListener('mousemove', resetIdleTimer);
  document.addEventListener('keydown', resetIdleTimer);
  document.addEventListener('click', resetIdleTimer);
  resetIdleTimer();
});

// Безопасная привязка глобальных функций
window.goScreen = typeof goScreen === 'function' ? goScreen : function() {};
window.goQuizFromLoaded = typeof goQuizFromLoaded === 'function' ? goQuizFromLoaded : function() {};
window.replayLesson = typeof replayLesson === 'function' ? replayLesson : function() {};

window.openChest = async function() { await ChestManager.open(); };
window.giveChest = function(type) { ChestManager.giveChest(type); };
window.closeRewardModal = function() {
  if (typeof hideChestModal === 'function') hideChestModal();
};

window.handleSubscribe = function() {
  if (typeof showToast === 'function') showToast('Оплата появится позже');
};

window.inviteFriend = typeof inviteFriend === 'function' ? inviteFriend : function() {
  alert('Приглашение друзей появится позже');
};
window.nextQ = typeof nextQ === 'function' ? nextQ : function() {};
window.shareBossResult = typeof shareBossResult === 'function' ? shareBossResult : function() {
  alert('Результат сохранён');
};
window.closeProfessorModal = typeof closeProfessorModal === 'function' ? closeProfessorModal : function() {};
