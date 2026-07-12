// ==========================================
//  ПЕРЕКЛЮЧЕНИЕ ЭКРАНОВ И РЕНДЕРИНГ
// ==========================================

// --------------------------------------------------
//  Переключение экранов
// --------------------------------------------------
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
  }
}

// ==========================================
// ТЕОРИЯ
// ==========================================
var currentLessonIndex = 0;
var theoryLoaded = [];

async function openLessonTheory(index) {
    currentLessonIndex = index;
    var lesson = QUESTIONS_FILES[index];
    var theoryInfo = THEORY_FILES.find(t => t.key === lesson.key);
    if (!theoryInfo) {
        goQuizFromLoaded(index);
        return;
    }
    try {
        var theory = await fetchJSON(theoryInfo.file);
        theoryLoaded = theory;
        startTheoryCards(theoryInfo, theory);
    } catch (e) {
        console.error(e);
        goQuizFromLoaded(index);
    }
}

function showTheoryScreen(theoryInfo) {
    // не используется, оставлена для совместимости
}

function startLessonPractice(){
    goQuizFromLoaded(currentLessonIndex);
}

// ==========================================
// ПРОФИЛЬ
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
  html += '<div class="profile-stat"><div class="profile-stat-num">' + completedCount + '/' + allLessons.length + '</div><div class="profile-stat-label">Тем пройдено</div></div>';
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
//  Вспомогательные вычисления
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
//  Главный экран (путь обучения)
// --------------------------------------------------
function renderHomePath() {
  var container = document.getElementById('home-content');
  if (!container) return;

  if (lessonsLoaded.length === 0) {
    container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted)">⏳ Загружаю путь...</div>';
    loadAllLessons().then(function() { renderHomePath(); });
    return;
  }

  var allLessons = getAllLessons();
  if (allLessons.length === 0) {
    container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--danger)">⚠️ Не удалось загрузить задания</div>';
    return;
  }

  updateDailyTasks();

  var completedCount = Object.keys(userProgress.completedLessons).length;
  var totalCount = allLessons.length;
  var pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  var allDone = completedCount >= totalCount;
  var streak = userProgress.streak || 0;
  var predictedGrade = getPredictedGrade();
  var predictedScore = getPredictedScore(predictedGrade);
  var reviewTopics = getTodayReviewTopics();

  var html = '';

  // --- Карусель ---
  html += '<div class="carousel" id="home-carousel">';

  // Карточка 1: Прогноз ОГЭ
  html += '<div class="carousel-card">';
  html += '<div style="font-family:var(--font-h);font-size:14px;font-weight:700;margin-bottom:4px">Твой прогноз ОГЭ</div>';
  if (predictedGrade !== '—') {
    html += '<div style="font-size:42px;font-weight:800;color:var(--gold);line-height:1">' + predictedGrade + '</div>';
    html += '<div style="font-size:13px;color:var(--muted)">Прогноз: ' + predictedScore + ' баллов</div>';
    var currentGrade = parseInt(predictedGrade);
    if (currentGrade < 5) {
      var nextGrade = currentGrade + 1;
      var needed = getCorrectAnswersNeededForGrade(nextGrade);
      var progressPercent = userProgress.totalCorrect / (userProgress.totalCorrect + needed) * 100;
      progressPercent = Math.min(100, Math.round(progressPercent));
      html += '<div style="margin-top:8px;font-size:11px;color:var(--muted)">До ' + nextGrade + ' ещё ' + needed + ' ' + getDayWord(needed) + '</div>';
      html += '<div class="path-progress-bar" style="height:6px;margin-top:4px"><div class="path-progress-fill" style="width:' + progressPercent + '%"></div></div>';
    } else {
      html += '<div style="margin-top:8px;font-size:13px;color:var(--primary2)">Ты на высшем уровне!</div>';
    }
  } else {
    html += '<div style="font-size:16px;color:var(--muted)">Недостаточно данных</div>';
  }
  html += '</div>';

  // Карточка 2: Ежедневные задания
  var tasks = userProgress.dailyTasks || {};
  var dailyQ = userProgress.dailyQuestions || 0;
  var dailyXP = userProgress.dailyXP || 0;
  html += '<div class="carousel-card">';
  html += '<div style="font-family:var(--font-h);font-size:14px;font-weight:700;margin-bottom:8px">🎯 Ежедневные задания</div>';
  html += '<div style="display:flex;flex-direction:column;gap:6px;font-size:13px">';
  html += '<div style="display:flex;align-items:center;gap:8px"><span style="color:' + (tasks.solve10 ? 'var(--primary2)' : 'var(--muted)') + '">' + (tasks.solve10 ? '✅' : '⬜') + '</span> 10 вопросов <span style="margin-left:auto;font-size:11px;color:var(--muted)">' + Math.min(dailyQ,10) + '/10</span></div>';
  html += '<div style="display:flex;align-items:center;gap:8px"><span style="color:' + (tasks.earn50XP ? 'var(--primary2)' : 'var(--muted)') + '">' + (tasks.earn50XP ? '✅' : '⬜') + '</span> 50 XP <span style="margin-left:auto;font-size:11px;color:var(--muted)">' + Math.min(dailyXP,50) + '/50</span></div>';
  html += '<div style="display:flex;align-items:center;gap:8px"><span style="color:' + (tasks.loginToday ? 'var(--primary2)' : 'var(--muted)') + '">' + (tasks.loginToday ? '✅' : '⬜') + '</span> Зайти сегодня</div>';
  html += '</div>';
  html += '</div>';

  // Карточка 3: Стрик
  html += '<div class="carousel-card">';
  html += '<div style="font-family:var(--font-h);font-size:14px;font-weight:700;margin-bottom:4px">🔥 Серия</div>';
  html += '<div style="font-size:42px;font-weight:800;color:#f85149;line-height:1">' + streak + '</div>';
  html += '<div style="font-size:13px;color:var(--muted)">' + getDayWord(streak) + ' подряд</div>';
  html += '<div style="margin-top:8px;font-size:13px;">' + (streak >= 7 ? 'Ты в ударе! Так держать!' : streak >= 3 ? 'Хорошая серия, продолжай!' : 'Каждый день — шаг к успеху!') + '</div>';
  html += '</div>';

  html += '</div>'; // .carousel

  // Точки-индикаторы
  html += '<div class="carousel-dots" id="carousel-dots">';
  html += '<div class="carousel-dot active"></div>';
  html += '<div class="carousel-dot"></div>';
  html += '<div class="carousel-dot"></div>';
  html += '</div>';

  // --- Кнопка действия ---
  if (reviewTopics.length > 0) {
    var firstReviewTopic = reviewTopics[0];
    var reviewIdx = getReviewLessonIndex(firstReviewTopic);
    html += '<div class="continue-card" onclick="goQuizFromLoaded(' + reviewIdx + ')">';
    html += '<div class="continue-icon">🔄</div>';
    html += '<div><div class="continue-label">Повторить сегодня</div><div class="continue-title">' + firstReviewTopic + '</div></div>';
    html += '<div class="continue-arrow">→</div></div>';
  } else {
    if (!allDone) {
      var nextIdx = 0;
      for (var i = 0; i < allLessons.length; i++) {
        if (!userProgress.completedLessons[allLessons[i].title]) { nextIdx = i; break; }
      }
      var nextLesson = allLessons[nextIdx];
      html += '<div class="continue-card" onclick="goQuizFromLoaded(' + nextIdx + ')">';
      html += '<div class="continue-icon">' + (nextLesson.title.match(/^\S+/) ? nextLesson.title.match(/^\S+/)[0] : '▶') + '</div>';
      html += '<div><div class="continue-label">Продолжить</div><div class="continue-title">' + nextLesson.title.replace(/^\S+\s*/, '') + '</div></div>';
      html += '<div class="continue-arrow">→</div></div>';
    } else {
      html += '<div class="continue-card" onclick="goBossLevel()" style="background:linear-gradient(135deg,#3a2a0c,#2a1f08);border-color:#d2992250">';
      html += '<div class="continue-icon">👑</div>';
      html += '<div><div class="continue-label" style="color:#d29922">Готово к финалу</div><div class="continue-title">Финальный босс</div></div>';
      html += '<div class="continue-arrow" style="color:#d29922">→</div></div>';
    }
  }

  // --- Путь-змейка ---
  html += '<div style="font-family:var(--font-h);font-size:14px;font-weight:700;margin: 20px 0 10px 16px;">📚 Темы</div>';
  html += '<div class="path-zigzag">';

  function getZigzagOffset(i) {
    var pattern = [0, -40, -80, -40, 0, 40, 80, 40];
    return pattern[i % pattern.length];
  }

  for (var i = 0; i < allLessons.length; i++) {
    var lesson = allLessons[i];
    var done = userProgress.completedLessons[lesson.title];
    var perfect = done && done.score === done.total;
    var isLocked = i > 0 && !userProgress.completedLessons[allLessons[i-1].title];
    var stateClass = perfect ? 'perfect' : done ? 'done' : isLocked ? 'locked' : 'current';
    var nodeIcon = perfect ? '🏆' : done ? '✅' : isLocked ? '🔒' : '▶';
    var isReview = reviewTopics.indexOf(lesson.title) !== -1;
    var offset = getZigzagOffset(i);

    html += '<div class="zigzag-node" style="transform: translateX(' + offset + 'px); opacity: ' + (isLocked ? '0.45' : '1') + ';">';
    if (isReview) {
      html += '<div class="review-badge">🔄</div>';
    }
    html += '<div class="node-circle ' + stateClass + '"' + (isLocked ? '' : ' onclick="openLessonTheory(' + i + ')"') + ' style="cursor:' + (isLocked ? 'default' : 'pointer') + '">' + nodeIcon + '</div>';
    html += '<div style="flex:1; margin-left:12px;">';
    html += '<div style="font-weight:700;font-size:14px;">' + lesson.title + '</div>';
    if (done) {
      html += '<div style="font-size:11px;color:var(--primary2);">' + done.score + '/' + done.total + ' верно</div>';
    } else {
      html += '<div style="font-size:11px;color:var(--muted);">' + (lesson.questions ? lesson.questions.length : '?') + ' вопр.</div>';
    }
    html += '</div></div>';

    if (i < allLessons.length - 1) {
      html += '<div class="zigzag-connector" style="transform: rotate(15deg) translateX(' + (offset * 0.7) + 'px);"></div>';
    }
  }

  // Финальный босс
  html += '<div class="zigzag-connector" style="background:' + (allDone ? 'var(--primary2)' : 'var(--border)') + ';"></div>';
  html += '<div class="zigzag-node" style="transform: translateX(0px);">';
  html += '<div class="boss-node' + (allDone ? '' : ' locked') + '"' + (allDone ? ' onclick="goBossLevel()"' : '') + ' style="cursor:' + (allDone ? 'pointer' : 'default') + '">' + (allDone ? '👑' : '🔒') + '</div>';
  html += '<div style="flex:1; margin-left:12px;">';
  html += '<div style="font-weight:800;font-size:15px;color:' + (allDone ? '#d29922' : 'var(--muted)') + '">Финальный босс</div>';
  html += '<div style="font-size:11px;color:var(--muted);">' + (allDone ? 'Открыт!' : 'Пройди все темы') + '</div>';
  html += '</div></div>';

  html += '</div>'; // .path-zigzag

  container.innerHTML = html;

  document.getElementById('home-streak').textContent = '🔥 ' + streak;
  document.getElementById('home-sublabel').textContent = completedCount + '/' + totalCount + ' тем пройдено';

  // Слушатель прокрутки карусели для точек
  var carousel = document.getElementById('home-carousel');
  var dots = document.querySelectorAll('#carousel-dots .carousel-dot');
  if (carousel && dots.length) {
    carousel.addEventListener('scroll', function() {
      var scrollLeft = carousel.scrollLeft;
      var cardWidth = carousel.querySelector('.carousel-card').offsetWidth + 12;
      var activeIndex = Math.round(scrollLeft / cardWidth);
      dots.forEach(function(d, idx) { d.classList.toggle('active', idx === activeIndex); });
    });
  }
}