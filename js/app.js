// ==========================================
//  ГЛАВНАЯ ТОЧКА ВХОДА
// ==========================================

document.addEventListener('DOMContentLoaded', function () {
  loadProgress(function () {
    checkStreak();
    updateDailyTasks();
    checkAchievements();
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

  // onStreak: предполагаем, что checkStreak() внутри себя вызывает professor.onStreak,
  // но если нет — добавь в streak.js
});

window.goScreen = goScreen;
window.goQuizFromLoaded = goQuizFromLoaded;
window.replayLesson = replayLesson;
window.openChest = openChest;
window.inviteFriend = inviteFriend;
window.nextQ = nextQ;
window.shareBossResult = shareBossResult;
window.closeRewardModal = closeRewardModal;
window.closeProfessorModal = closeProfessorModal;