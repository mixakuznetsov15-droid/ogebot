function goBossLevel() {
  // ★ ИСПРАВЛЕНИЕ: Проверка подписки перед доступом к финальному боссу
  if (!Subscription.hasAccess()) {
    showPaywallModal();
    return;
  }

  var allLessons = getAllLessons();
  var allQuestions = [];
  allLessons.forEach(function(l) {
    if (l.questions) allQuestions = allQuestions.concat(l.questions);
  });
  allQuestions = allQuestions.sort(function() { return Math.random() - 0.5; }).slice(0, 30);
  isBossMode = true;
  shuffled = allQuestions;
  curLesson = -1;
  curQ = 0;
  score = 0;
  answered = false;
  lives = 999;
  hintUsed = false;
  correctStreak = 0;
  lastAnswerWasWrong = false;
  goScreen('s-quiz');
  renderQ();
}
