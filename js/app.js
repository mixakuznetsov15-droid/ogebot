// ==========================================
//  ГЛАВНАЯ ТОЧКА ВХОДА
// ==========================================

document.addEventListener('DOMContentLoaded', function () {
  loadProgress(function () {
    checkStreak();
    updateDailyTasks();
    checkAchievements();

    // Инициализация менеджера сундуков
    ChestManager.init({
      getProgress: () => userProgress,
      saveProgress: () => saveProgress(),
      ui: {
        onOpenStart: () => {
          // Показать модальное окно с анимацией открытия
          if (typeof showChestModal === 'function') {
            showChestModal();
          }
        },
        onReward: (reward) => {
          // Показать полученную награду (после анимации)
          if (typeof showRewardModal === 'function') {
            setTimeout(() => showRewardModal(reward), 1200);
          }
          // Дополнительно — текстовое уведомление
          if (typeof showToast === 'function') {
            showToast(`Получено: ${reward.amount} XP`);
          }
        },
        onError: (msg) => {
          if (typeof showToast === 'function') {
            showToast(msg);
          }
        },
        onComplete: () => {
          // Можно оставить пустым — закрытие происходит по кнопке "Забрать"
        }
      }
    });

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

// Обёртки для совместимости со старыми вызовами сундуков
window.openChest = async function() {
  await ChestManager.open();
};
window.giveChest = function(type) {
  ChestManager.giveChest(type);
};
window.closeRewardModal = function() {
  // Закрытие модального окна теперь происходит в hideChestModal
  if (typeof hideChestModal === 'function') {
    hideChestModal();
  }
};

window.inviteFriend = typeof inviteFriend === 'function' ? inviteFriend : function() {
  alert('Приглашение друзей появится позже');
};
window.nextQ = typeof nextQ === 'function' ? nextQ : function() {};
window.shareBossResult = typeof shareBossResult === 'function' ? shareBossResult : function() {
  alert('Результат сохранён');
};
window.closeProfessorModal = typeof closeProfessorModal === 'function' ? closeProfessorModal : function() {};