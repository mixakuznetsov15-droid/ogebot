// ==========================================
//  ПЕРЕКЛЮЧЕНИЕ ЭКРАНОВ И РЕНДЕРИНГ (ОТЛАДКА)
// ==========================================

function goScreen(id) {
  document.querySelectorAll('.screen').forEach(function(s) {
    s.classList.remove('active');
  });
  document.getElementById(id).classList.add('active');
  window.scrollTo(0,0);

  if (id === 's-profile') {
    renderProfile();
  } else if (id === 's-home') {
    renderHomePath();
  } else if (id === 's-session-summary') {
    renderSessionSummary();
  } else if (id === 's-review') {
    renderReviewScreen();
  }
}

// ==========================================
// ТЕОРИЯ — ОТЛАДОЧНАЯ ВЕРСИЯ
// ==========================================
var currentLessonIndex = 0;
var theoryLoaded = [];

// Временная упрощённая fetchJSON
async function fetchJSON(file) {
  var response = await fetch('data/' + file);
  if (!response.ok) throw new Error('Файл не найден: ' + file);
  return await response.json();
}

async function openLessonTheory(index) {
    currentLessonIndex = index;
    var lesson = QUESTIONS_FILES[index];
    var theoryInfo = THEORY_FILES.find(t => t.key === lesson.key);
    if (!theoryInfo) {
        alert('❌ Не найдена теория для темы: ' + lesson.title);
        return;
    }
    try {
        var theory = await fetchJSON(theoryInfo.file);
        alert('✅ Теория загружена, шагов: ' + theory.length);
        // Если всё ок, запускаем микроуроки
        startTheoryCards(theoryInfo, theory, theoryInfo.key);
    } catch (e) {
        alert('❌ Ошибка при загрузке теории ' + theoryInfo.file + ': ' + e.message);
    }
}

function showTheoryScreen(theoryInfo) {
    // не используется
}

function startLessonPractice(){
    goQuizFromLoaded(currentLessonIndex);
}

// ==========================================
// ПРОФИЛЬ (без изменений)
// ==========================================
function renderProfile() {
  var container = document.getElementById('profile-content');
  if (!container) return;

  var allLessons = getAllLessons();
  var completedCount = Object.keys(userProgress.completedLessons).length;
  var acc = userProgress.totalAnswered > 0 ? Math.round((userProgress.totalCorrect / userProgress.totalAnswered) * 100) : 0;
  var predictedGrade = getPredictedGrade();
  var rank = getRank(userProgress.xp);
  var chestCount = (userProgress.chests || []).length;

  var html = '';

  html += '<div class="profile-header-card">';
  html += '<div class="profile-avatar-big">🧑‍🎓</div>';
  html += '<div><div class="profile-name-big">Ученик ГеоПро <span style="font-size:12px;background:var(--primary);color:#fff;padding:2px 8px;border-radius:10px;margin-left:6px">' + rank + '</span></div>';
  html += '<div class="profile-level-big">⚡ Уровень ' + userProgress.level + ' · ' + userProgress.xp + ' XP</div>';
  var nextRank = getNextRank(userProgress.xp);
  if (nextRank) {
    var xpNeeded = nextRank.min;
    var currentXP = userProgress.xp;
    var progressPct = Math.min(100, Math.round((currentXP / xpNeeded) * 100));
    html += '<div style="margin-top:8px;font-size:11px;color:var(--muted)">До ранга "' + nextRank.name + '" осталось ' + (xpNeeded - currentXP) + ' XP</div>';
    html += '<div class="path-progress-bar" style="height:6px;margin-top:4px"><div class="path-progress-fill" style="width:' + progressPct + '%"></div></div>';
  }
  html += '</div></div>';

  html += '<div style="background:var(--card2);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;display:flex;align-items:center;gap:12px;margin-bottom:12px">';
  html += '<div style="font-size:32px">🎯</div>';
  html += '<div><div style="font-weight:700;font-size:15px">Прогноз на ОГЭ</div>';
  html += '<div style="font-size:13px;color:var(--muted);margin-top:4px">При текущей точности ты можешь получить <span style="color:var(--gold);font-weight:800">' + predictedGrade + '</span></div></div>';
  html += '</div>';

  html += '<div class="profile-stats-grid">';
  html += '<div class="profile-stat"><div class="profile-stat-num" style="cursor:pointer" onclick="goScreen(\'s-review\')">' + completedCount + '/' + allLessons.length + '</div><div class="profile-stat-label">Тем пройдено</div></div>';
  html += '<div class="profile-stat"><div class="profile-stat-num">' + acc + '%</div><div class="profile-stat-label">Точность</div></div>';
  html += '<div class="profile-stat"><div class="profile-stat-num">🔥 ' + (userProgress.streak || 0) + '</div><div class="profile-stat-label">Дней подряд</div></div>';
  html += '</div>';

  html += '<div style="background:var(--card2);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;margin:12px 0;display:flex;justify-content:space-between;align-items:center;' + (chestCount > 0 ? 'animation: chestGlow 2s infinite, chestPulse 1.5s infinite;' : '') + '">';
  html += '<div><div style="font-weight:700;font-size:15px">🎁 Сундуки</div>';
  if (chestCount > 0) {
    html += '<div style="font-size:12px;color:var(--muted);margin-top:3px">Доступно: ' + chestCount + ' ' + (chestCount === 1 ? 'сундук' : (chestCount >= 2 && chestCount <= 4 ? 'сундука' : 'сундуков')) + '</div>';
  } else {
    html += '<div style="font-size:12px;color:var(--muted);margin-top:3px">Сегодня все награды уже получены. Возвращайся завтра.</div>';
  }
  html += '</div>';
  html += '<button onclick="openChest()" style="background:var(--gold);color:#000;border:none;border-radius:12px;padding:8px 16px;font-family:var(--font-b);font-size:13px;font-weight:700;cursor:pointer;' + (chestCount > 0 ? 'animation: chestPulse 1.2s infinite;' : 'opacity:0.5;background:gray !important;color:#fff;') + '"' + (chestCount === 0 ? ' disabled' : '') + '>' + (chestCount > 0 ? 'Открыть сундук' : 'Нет сундуков') + '</button>';
  html += '</div>';

  var notifText = isTelegram ? '✅ Подключены' : '❌ Не подключены';
  var notifDesc = isTelegram ? 'Напоминания о заданиях будут приходить в Telegram.' : 'Для получения уведомлений открой приложение через Telegram.';
  html += '<div style="background:var(--card2);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;margin:12px 0">';
  html += '<div style="font-weight:700;font-size:15px">🔔 Напоминания</div>';
  html += '<div style="font-size:13px;color:' + (isTelegram ? 'var(--primary2)' : 'var(--danger)') + ';margin-top:6px">' + notifText + '</div>';
  html += '<div style="font-size:11px;color:var(--muted);margin-top:4px">' + notifDesc + '</div>';
  html += '</div>';

  html += '<div style="background:var(--card2);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;margin:8px 0">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center">';
  html += '<div><div style="font-weight:700;font-size:14px">👥 Мой класс</div><div style="font-size:11px;color:var(--muted);margin-top:3px">Пригласи друзей, чтобы сравнивать прогресс</div></div>';
  html += '<button onclick="inviteFriend()" style="background:var(--primary);color:#fff;border:none;border-radius:12px;padding:8px 14px;font-family:var(--font-b);font-size:12px;font-weight:600;cursor:pointer">➕ Пригласить</button>';
  html += '</div><div style="margin-top:10px;font-size:11px;color:var(--muted);text-align:center">Рейтинг класса появится позже</div>';
  html += '</div>';

  checkAchievements();
  var achievements = userProgress.achievements || {};
  html += '<div class="section-label" style="font-family:var(--font-h);font-size:12px;font-weight:700;color:var(--muted);letter-spacing:.05em;text-transform:uppercase;margin:6px 0 4px">Достижения</div>';
  html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">';
  ACHIEVEMENTS_LIST.forEach(function(a) {
    var ach = achievements[a.id] || { progress: 0, unlocked: false };
    var isUnlocked = ach.unlocked;
    var progress = a.max ? ach.progress : (isUnlocked ? (a.max || 1) : 0);
    var dateStr = ach.date ? new Date(ach.date).toLocaleDateString() : '';
    html += '<div class="badge-item-p' + (isUnlocked ? '' : ' locked') + '" style="position:relative">';
    html += '<div class="badge-icon-p">' + a.icon + '</div>';
    html += '<div class="badge-name-p">' + a.title + '</div>';
    if (a.max) {
      html += '<div style="font-size:8px;color:var(--muted);margin-top:2px">' + progress + '/' + a.max + '</div>';
    }
    if (isUnlocked && dateStr) {
      html += '<div style="font-size:7px;color:var(--primary2);margin-top:2px">' + dateStr + '</div>';
    }
    html += '</div>';
  });
  html += '</div>';

  html += '<div class="section-label" style="font-family:var(--font-h);font-size:12px;font-weight:700;color:var(--muted);letter-spacing:.05em;text-transform:uppercase;margin:14px 0 4px">Подписка</div>';
  html += '<div class="sub-status-card active"><div style="font-size:28px">✅</div><div><div style="font-weight:700;font-size:14px">Активна</div><div style="font-size:11px;color:var(--muted);margin-top:2px">Полный доступ ко всем темам</div></div></div>';

  container.innerHTML = html;
}

// --------------------------------------------------
//  Вспомогательные вычисления (без изменений)
// --------------------------------------------------
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

// --------------------------------------------------
//  ГЛАВНЫЙ ЭКРАН — ОТЛАДОЧНАЯ ВЕРСИЯ (кликабельные темы с alert)
// --------------------------------------------------
function renderHomePath() {
  var container = document.getElementById('home-content');
  if (!container) return;

  if (typeof lessonsLoaded === 'undefined' || lessonsLoaded.length === 0) {
    container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted)">⏳ Загружаю путь...</div>';
    if (typeof loadAllLessons === 'function') {
      loadAllLessons().then(function() { renderHomePath(); });
    }
    return;
  }

  var allLessons = getAllLessons ? getAllLessons() : [];
  if (allLessons.length === 0) {
    container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--danger)">⚠️ Нет тем</div>';
    return;
  }

  var html = '<div style="font-family:var(--font-h);font-size:14px;font-weight:700;margin: 20px 0 10px 16px;">📚 Темы (отладка)</div>';

  for (var i = 0; i < allLessons.length; i++) {
    var lesson = allLessons[i];
    // Все темы кликабельны, вызываем openLessonTheory для первой, для остальных просто alert
    if (i === 0) {
      html += '<div style="padding:12px; margin:6px 0; background: #1c2333; border:1px solid #58a6ff; border-radius:12px; cursor:pointer; color:#fff; font-weight:600;" onclick="openLessonTheory(0)">';
      html += '▶ ' + lesson.title + ' (открыть теорию)';
      html += '</div>';
    } else {
      html += '<div style="padding:12px; margin:6px 0; background: #1c2333; border:1px solid #58a6ff; border-radius:12px; cursor:pointer; color:#fff; font-weight:600;" onclick="alert(\'Тема: ' + lesson.title + '\')">';
      html += '▶ ' + lesson.title;
      html += '</div>';
    }
  }

  container.innerHTML = html;
}

// ==========================================
// ИТОГИ ЗАНЯТИЯ (Session Summary) — без изменений
// ==========================================
function renderSessionSummary() {
  var container = document.getElementById('session-summary-content');
  if (!container) return;

  var data = window._sessionData || {};
  var totalQuestions = data.total || 0;
  var score = data.score || 0;
  var xpGain = data.xpGain || 0;
  var streak = userProgress.streak || 0;
  var topicTitle = data.topicTitle || 'занятие';
  var topicKey = data.topicKey || '';
  var accuracy = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  var levelUp = data.levelUp || false;
  var chestReceived = data.chestReceived || false;

  var nextAction = getNextAction();

  var professorComment = '';
  if (typeof professor !== 'undefined' && professor.generateSessionComment) {
    professorComment = professor.generateSessionComment(topicTitle, accuracy, streak, topicKey);
  } else {
    professorComment = 'Продолжай в том же духе!';
  }

  var html = '';

  html += '<div class="result-emoji">🎉</div>';
  html += '<div class="result-title">Отличная работа!</div>';

  html += '<div class="res-stats" style="margin-top:12px">';
  html += '<div class="res-stat"><div class="res-num g">' + totalQuestions + '</div><div class="res-label">Решено вопросов</div></div>';
  html += '<div class="res-stat"><div class="res-num y">+' + xpGain + '</div><div class="res-label">XP</div></div>';
  html += '<div class="res-stat"><div class="res-num" style="color:#f85149">🔥 ' + streak + '</div><div class="res-label">Серия дней</div></div>';
  html += '</div>';

  if (levelUp) {
    html += '<div class="res-stat" style="background:rgba(63,185,80,0.15);border-color:var(--primary2);margin-top:8px">';
    html += '<div class="res-num g">🏆</div><div class="res-label">Новый уровень!</div>';
    html += '</div>';
  }
  if (chestReceived) {
    html += '<div class="res-stat" style="background:rgba(210,153,34,0.2);border-color:var(--gold);margin-top:8px">';
    html += '<div class="res-num y">🎁</div><div class="res-label">Получен сундук!</div>';
    html += '</div>';
  }

  html += '<div style="background:var(--card2);border:1px solid var(--border);border-radius:var(--radius);padding:14px;margin-top:16px;text-align:left">';
  html += '<div style="font-weight:700;margin-bottom:4px">🧑‍🏫 Профессор Гео:</div>';
  html += '<div style="font-size:14px;line-height:1.5;color:var(--text)">' + professorComment + '</div>';
  html += '</div>';

  html += '<div style="margin-top:20px;font-size:15px;font-weight:600;color:var(--muted)">📌 Рекомендация</div>';
  html += '<div class="continue-card" style="margin-top:8px" onclick="executeNextAction()">';
  if (nextAction && nextAction.action) {
    html += '<div class="continue-icon">▶</div>';
    html += '<div><div class="continue-label">Следующий шаг</div><div class="continue-title">' + nextAction.text + '</div></div>';
    html += '<div class="continue-arrow">→</div>';
  } else {
    html += '<div class="continue-icon">🌟</div>';
    html += '<div><div class="continue-title">Отдохнуть. Сегодня план выполнен.</div></div>';
  }
  html += '</div>';

  html += '<div class="res-btns" style="margin-top:20px">';
  html += '<button class="btn-full primary" onclick="executeNextAction()">Продолжить обучение</button>';
  html += '<button class="btn-full sec" onclick="goScreen(\'s-home\')">🏠 На главный экран</button>';
  html += '</div>';

  container.innerHTML = html;
}

// Выполнить рекомендованное действие (из learning-path)
window.executeNextAction = function() {
  var action = getNextAction();
  if (action && action.action) {
    action.action();
  } else {
    goScreen('s-home');
  }
};

// ==========================================
// ЦЕНТР ПОВТОРЕНИЯ (Review Screen) — без изменений
// ==========================================
function renderReviewScreen() {
  var container = document.getElementById('review-content');
  if (!container) return;

  var allLessons = getAllLessons();
  var reviewData = userProgress.reviewData || {};
  var html = '';

  var statuses = { red: [], yellow: [], green: [] };
  var today = new Date().toISOString().slice(0,10);

  allLessons.forEach(function(lesson) {
    var rd = reviewData[lesson.title];
    if (!rd) return;
    var mastery = rd.mastery || 0;
    var nextDate = rd.nextReviewDate || '';
    if (nextDate && nextDate < today) {
      statuses.red.push({ title: lesson.title, mastery: mastery, nextDate: nextDate });
    } else if (nextDate && nextDate === today) {
      statuses.yellow.push({ title: lesson.title, mastery: mastery, nextDate: nextDate });
    } else {
      statuses.green.push({ title: lesson.title, mastery: mastery, nextDate: nextDate });
    }
  });

  html += '<div style="font-family:var(--font-h);font-size:14px;font-weight:700;margin-bottom:12px;">📊 Статус тем</div>';

  ['red', 'yellow', 'green'].forEach(function(status) {
    var list = statuses[status];
    if (list.length === 0) return;
    var emoji = status === 'red' ? '🔴' : status === 'yellow' ? '🟡' : '🟢';
    var label = status === 'red' ? 'Требует повторения' : status === 'yellow' ? 'Пора повторить' : 'Изучено';

    list.forEach(function(item) {
      html += '<div class="path-progress-card" style="margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">';
      html += '<div><div style="font-weight:600;">' + item.title + '</div>';
      html += '<div style="font-size:12px; color:var(--muted);">' + emoji + ' ' + label + ' · ' + item.mastery + '% усвоения</div></div>';
      html += '<button class="btn-full primary" style="padding:8px 16px; width:auto;" onclick="startReviewLesson(' + getReviewLessonIndex(item.title) + ',' + item.mastery + ')">Повторить</button>';
      html += '</div>';
    });
  });

  if (html.indexOf('path-progress-card') === -1) {
    html += '<div style="text-align:center; color:var(--muted); padding:40px;">Нет данных для повторения. Пройдите несколько тем!</div>';
  }

  container.innerHTML = html;
}