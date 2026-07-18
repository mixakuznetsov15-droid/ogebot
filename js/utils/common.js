// ==========================================
//  ОБЩИЕ УТИЛИТЫ (дата, предсказания, подсчёт)
// ==========================================

function getDaysUntilOGE() {
  var today = new Date();
  today.setHours(0,0,0,0);
  var currentYear = today.getFullYear();
  var ogeThisYear = new Date(currentYear, 5, 19);
  if (today <= ogeThisYear) {
    return Math.ceil((ogeThisYear - today) / 86400000);
  } else {
    var ogeNextYear = new Date(currentYear + 1, 5, 19);
    return Math.ceil((ogeNextYear - today) / 86400000);
  }
}

function getPredictedGrade() {
  if (userProgress.totalAnswered === 0) return '—';
  var acc = userProgress.totalCorrect / userProgress.totalAnswered;
  if (acc >= 0.85) return '5';
  if (acc >= 0.70) return '4';
  if (acc >= 0.55) return '3';
  return '2';
}

function getPredictedScore(grade) {
  if (grade === '5') return '28–31';
  if (grade === '4') return '19–25';
  if (grade === '3') return '12–18';
  if (grade === '2') return '0–11';
  return '—';
}

function getCorrectAnswersNeededForGrade(targetGrade) {
  var total = userProgress.totalAnswered;
  var correct = userProgress.totalCorrect;
  var target = 0;
  if (targetGrade === 3) target = 0.55;
  else if (targetGrade === 4) target = 0.70;
  else if (targetGrade === 5) target = 0.85;
  var needed = Math.ceil(target * total) - correct;
  return Math.max(0, needed);
}

function getDayWord(n) {
  if (n % 10 === 1 && n % 100 !== 11) return 'день';
  if ([2,3,4].indexOf(n % 10) !== -1 && [12,13,14].indexOf(n % 100) === -1) return 'дня';
  return 'дней';
}

// Ранги и звания (чтобы были доступны в профиле без дублирования)
function getRank(xp) {
  if (typeof xp !== 'number') return 'Новичок';
  if (xp >= 10000) return 'Легенда';
  if (xp >= 5000) return 'Мастер';
  if (xp >= 3000) return 'Эксперт';
  if (xp >= 500) return 'Ученик';
  return 'Новичок';
}

function getNextRank(xp) {
  var ranks = [
    { name: 'Ученик', min: 500 },
    { name: 'Эксперт', min: 3000 },
    { name: 'Мастер', min: 5000 },
    { name: 'Легенда', min: 10000 }
  ];
  for (var i = 0; i < ranks.length; i++) {
    if (xp < ranks[i].min) return ranks[i];
  }
  return null;
}