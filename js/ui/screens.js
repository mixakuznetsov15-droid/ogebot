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

  // Автоматически наполняем контентом нужные экраны
  if (id === 's-profile') {
    renderProfile();
  } else if (id === 's-home') {
    renderHomePath();   // на случай, если нужно обновить главный экран
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
        showTheoryScreen(theoryInfo);
    } catch (e) {
        console.error(e);
        goQuizFromLoaded(index);
    }
}

function showTheoryScreen(theoryInfo) {
    goScreen('s-topic');
    document.getElementById('topic-title').textContent = theoryInfo.title;
    var html = '';
    theoryLoaded.forEach(function(item){
        html += `
        <div class="theory-card">
            <div class="theory-topic">${item.topic}</div>
            <div class="theory-text">${item.content.replace(/\n/g,"<br>")}</div>
        </div>`;
    });
    html += `
    <button class="btn-full primary" onclick="startLessonPractice()">
        🚀 Начать практику
    </button>`;
    document.getElementById("topic-content").innerHTML = html;
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

  // Заголовок профиля
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

  // Прогноз на ОГЭ
  html += '<div style="background:var(--card2);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;display:flex;align-items:center;gap:12px;margin-bottom:12px">';
  html += '<div style="font-size:32px">🎯</div>';
  html += '<div><div style="font-weight:700;font-size:15px">Прогноз на ОГЭ</div>';
  html += '<div style="font-size:13px;color:var(--muted);margin-top:4px">При текущей точности ты можешь получить <span style="color:var(--gold);font-weight:800">' + predictedGrade + '</span></div></div>';
  html += '</div>';

  // Статистика
  html += '<div class="profile-stats-grid">';
  html += '<div class="profile-stat"><div class="profile-stat-num">' + completedCount + '/' + allLessons.length + '</div><div class="profile-stat-label">Тем пройдено</div></div>';
  html += '<div class="profile-stat"><div class="profile-stat-num">' + acc + '%</div><div class="profile-stat-label">Точность</div></div>';
  html += '<div class="profile-stat"><div class="profile-stat-num">🔥 ' + (userProgress.streak || 0) + '</div><div class="profile-stat-label">Дней подряд</div></div>';
  html += '</div>';

  // Сундуки
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

  // Напоминания (Telegram)
  var notifText = isTelegram ? '✅ Подключены' : '❌ Не подключены';
  var notifDesc = isTelegram ? 'Напоминания о заданиях будут приходить в Telegram.' : 'Для получения уведомлений открой приложение через Telegram.';
  html += '<div style="background:var(--card2);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;margin:12px 0">';
  html += '<div style="font-weight:700;font-size:15px">🔔 Напоминания</div>';
  html += '<div style="font-size:13px;color:' + (isTelegram ? 'var(--primary2)' : 'var(--danger)') + ';margin-top:6px">' + notifText + '</div>';
  html += '<div style="font-size:11px;color:var(--muted);margin-top:4px">' + notifDesc + '</div>';
  html += '</div>';

  // Мой класс (заглушка)
  html += '<div style="background:var(--card2);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;margin:8px 0">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center">';
  html += '<div><div style="font-weight:700;font-size:14px">👥 Мой класс</div><div style="font-size:11px;color:var(--muted);margin-top:3px">Пригласи друзей, чтобы сравнивать прогресс</div></div>';
  html += '<button onclick="inviteFriend()" style="background:var(--primary);color:#fff;border:none;border-radius:12px;padding:8px 14px;font-family:var(--font-b);font-size:12px;font-weight:600;cursor:pointer">➕ Пригласить</button>';
  html += '</div><div style="margin-top:10px;font-size:11px;color:var(--muted);text-align:center">Рейтинг класса появится позже</div>';
  html += '</div>';

  // Достижения
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

  // Подписка
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
  var ogeThisYear = new Date(currentYear, 5, 19); // 19 июня
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

  // Если уроки ещё не загружены — запускаем загрузку и показываем заглушку
  if (lessonsLoaded.length === 0) {
    container.innerHTML = '<div style="padding:40px 20px;text-align:center;color:var(--muted)">⏳ Загружаю путь...</div>';
    loadAllLessons().then(function() {
      renderHomePath(); // повторно после загрузки
    });
    return;
  }

  var allLessons = getAllLessons();
  if (allLessons.length === 0) {
    container.innerHTML = '<div style="padding:40px 20px;text-align:center;color:var(--danger)">⚠️ Не удалось загрузить задания. Проверь интернет.</div>';
    return;
  }

  updateDailyTasks();

  // Определяем следующий незавершённый урок
  var nextIdx = 0;
  for (var i = 0; i < allLessons.length; i++) {
    var key = allLessons[i].title;
    if (!userProgress.completedLessons[key]) { nextIdx = i; break; }
    if (i === allLessons.length - 1) nextIdx = allLessons.length;
  }

  var completedCount = Object.keys(userProgress.completedLessons).length;
  var totalCount = allLessons.length;
  var pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  var allDone = completedCount >= totalCount;

  var daysLeft = getDaysUntilOGE();
  var predictedGrade = getPredictedGrade();
  var streak = userProgress.streak || 0;
  var predictedScore = getPredictedScore(predictedGrade);

  var html = '';

  // --- Карточка прогноза ---
  html += '<div class="path-progress-card">';
  html += '<div style="font-family:var(--font-h);font-size:14px;font-weight:700;margin-bottom:6px">Твой прогноз ОГЭ</div>';
  if (predictedGrade !== '—') {
    var currentGrade = parseInt(predictedGrade);
    html += '<div style="font-size:42px;font-weight:800;color:var(--gold);line-height:1">' + predictedGrade + '</div>';
    html += '<div style="font-size:13px;color:var(--muted);margin-bottom:8px">Прогноз: ' + predictedScore + ' баллов</div>';
    if (currentGrade < 5) {
      var nextGrade = currentGrade + 1;
      var needed = getCorrectAnswersNeededForGrade(nextGrade);
      html += '<div style="font-size:13px;color:var(--muted);margin-bottom:8px">До ' + nextGrade + ' осталось ' + needed + ' ' + getDayWord(needed) + '</div>';
      var progressPercent = userProgress.totalCorrect / (userProgress.totalCorrect + needed) * 100;
      progressPercent = Math.min(100, Math.round(progressPercent));
      html += '<div class="path-progress-bar" style="height:8px"><div class="path-progress-fill" style="width:' + progressPercent + '%"></div></div>';
    } else {
      html += '<div style="font-size:13px;color:var(--primary2);margin-bottom:8px">Ты на высшем уровне!</div>';
    }
  } else {
    html += '<div style="font-size:16px;color:var(--muted)">Недостаточно данных</div>';
  }
  html += '<div style="font-size:11px;color:var(--muted);margin-top:10px">Подготовка: ' + streak + ' ' + getDayWord(streak) + ' подряд · До ОГЭ ' + daysLeft + ' ' + getDayWord(daysLeft) + '</div>';
  html += '</div>';

  // --- Прогресс по темам ---
  html += '<div class="path-progress-card">';
  html += '<div class="path-progress-top"><span class="path-progress-label">📈 Прогресс по темам</span><span class="path-progress-pct">' + pct + '%</span></div>';
  html += '<div class="path-progress-bar"><div class="path-progress-fill" style="width:' + pct + '%"></div></div>';
  html += '</div>';

  // --- Ежедневные задания ---
  var tasks = userProgress.dailyTasks || {};
  var dailyQ = userProgress.dailyQuestions || 0;
  var dailyXP = userProgress.dailyXP || 0;
  html += '<div class="path-progress-card">';
  html += '<div style="font-family:var(--font-h);font-size:14px;font-weight:700;margin-bottom:8px">🎯 Ежедневные задания</div>';
  html += '<div style="display:flex;flex-direction:column;gap:6px;font-size:13px">';
  html += '<div style="display:flex;align-items:center;gap:8px"><span style="color:' + (tasks.solve10 ? 'var(--primary2)' : 'var(--muted)') + '">' + (tasks.solve10 ? '✅' : '⬜') + '</span> Решить 10 вопросов <span style="margin-left:auto;font-size:11px;color:var(--muted)">' + Math.min(dailyQ, 10) + '/10</span></div>';
  html += '<div style="display:flex;align-items:center;gap:8px"><span style="color:' + (tasks.earn50XP ? 'var(--primary2)' : 'var(--muted)') + '">' + (tasks.earn50XP ? '✅' : '⬜') + '</span> Получить 50 XP <span style="margin-left:auto;font-size:11px;color:var(--muted)">' + Math.min(dailyXP, 50) + '/50</span></div>';
  html += '<div style="display:flex;align-items:center;gap:8px"><span style="color:' + (tasks.loginToday ? 'var(--primary2)' : 'var(--muted)') + '">' + (tasks.loginToday ? '✅' : '⬜') + '</span> Зайти сегодня</div>';
  html += '</div>';
  if (userProgress.allDailyTasksDone) {
    html += '<div style="margin-top:8px;font-size:13px;color:var(--primary2)">🎉 Все задания выполнены! +100 XP и сундук</div>';
  } else {
    html += '<div style="margin-top:8px;font-size:12px;color:var(--muted)">За каждое задание +20 XP</div>';
  }
  html += '</div>';

  // --- Кнопка "Продолжить" или Финальный босс ---
  if (!allDone) {
    var nextLesson = allLessons[nextIdx];
    html += '<div class="continue-card" onclick="goQuizFromLoaded(' + nextIdx + ')">';
    html += '<div class="continue-icon">' + (nextLesson.title.match(/^\S+/) ? nextLesson.title.match(/^\S+/)[0] : '▶') + '</div>';
    html += '<div><div class="continue-label">Продолжить</div><div class="continue-title">' + nextLesson.title.replace(/^\S+\s*/, '') + '</div></div>';
    html += '<div class="continue-arrow">→</div></div>';
  } else {
    html += '<div class="continue-card" onclick="goBossLevel()" style="background:linear-gradient(135deg,#3a2a0c,#2a1f08);border-color:#d2992250">';
    html += '<div class="continue-icon">👑</div>';
    html += '<div><div class="continue-label" style="color:#d29922">Готово к финалу</div><div class="continue-title">Финальный босс — все темы</div></div>';
    html += '<div class="continue-arrow" style="color:#d29922">→</div></div>';
  }

  // --- Узлы пути (темы) ---
  html += '<div style="display:flex;flex-direction:column;align-items:center;gap:0;padding:8px 0 0">';
  allLessons.forEach(function(l, i) {
    var done = userProgress.completedLessons[l.title];
    var prevKey = i > 0 ? allLessons[i-1].title : null;
    var prevDone = i === 0 || userProgress.completedLessons[prevKey];
    var isLocked = !prevDone && i > 0;
    var isCurrent = !isLocked && !done;
    var perfect = done && done.score === done.total;

    var stateClass = perfect ? 'perfect' : done ? 'done' : isLocked ? 'locked' : 'current';
    var nodeIcon = perfect ? '🏆' : done ? '✅' : isLocked ? '🔒' : '▶';
    var onclk = isLocked
      ? '' 
      : ' onclick="openLessonTheory(' + i + ')"';

    if (i > 0) {
      var connDone = userProgress.completedLessons[allLessons[i-1].title];
      html += '<div class="path-connector" style="background:' + (connDone ? 'var(--primary2)' : 'var(--border)') + '"></div>';
    }

    var isRight = i % 2 === 1;
    html += '<div class="path-node-row" style="flex-direction:' + (isRight ? 'row-reverse' : 'row') + ';opacity:' + (isLocked ? '0.45' : '1') + '">';
    html += '<div class="node-circle ' + stateClass + '"' + onclk + ' style="cursor:' + (isLocked ? 'default' : 'pointer') + '">' + nodeIcon + '</div>';
    html += '<div style="flex:1"><div style="font-weight:700;font-size:14px">' + l.title + '</div>';
    if (done) {
      html += '<div style="font-size:11px;color:var(--primary2);margin-top:3px">' + done.score + '/' + done.total + ' верно</div>';
    } else {
      html += '<div style="font-size:11px;color:var(--muted);margin-top:3px">' + (l.questions ? l.questions.length : 0) + ' вопр.' + (l.tasks ? ' · ' + l.tasks : '') + '</div>';
    }
    html += '</div></div>';
  });

  // --- Узел финального босса ---
  html += '<div class="path-connector" style="background:' + (allDone ? 'var(--primary2)' : 'var(--border)') + '"></div>';
  html += '<div class="path-node-row">';
  html += '<div class="boss-node' + (allDone ? '' : ' locked') + '"' + (allDone ? ' onclick="goBossLevel()"' : '') + ' style="cursor:' + (allDone ? 'pointer' : 'default') + '">' + (allDone ? '👑' : '🔒') + '</div>';
  html += '<div style="flex:1"><div style="font-weight:800;font-size:15px;color:' + (allDone ? '#d29922' : 'var(--muted)') + '">Финальный босс</div>';
  html += '<div style="font-size:11px;color:var(--muted);margin-top:3px">' + (allDone ? 'Тест по всем темам — открыт!' : 'Пройди все темы чтобы открыть') + '</div></div>';
  html += '</div>';

  html += '</div>';
  container.innerHTML = html;

  // Обновляем шапку
  document.getElementById('home-streak').textContent = '🔥 ' + (userProgress.streak || 0);
  document.getElementById('home-sublabel').textContent = completedCount + '/' + totalCount + ' тем пройдено';
}