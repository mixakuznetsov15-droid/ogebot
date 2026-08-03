// ==========================================
//  ПЕРЕКЛЮЧЕНИЕ ЭКРАНОВ И РЕНДЕРИНГ
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
// ТЕОРИЯ (поддержка подтем + практика подтемы + обход кэша)
// ==========================================
var currentLessonIndex = 0;
var currentSubtopicQuestionsFile = null;
var theoryLoaded = [];

// Открывает родительскую тему по индексу в THEORY_FILES
function openTopic(index) {
  var theoryInfo = THEORY_FILES[index];
  if (theoryInfo && theoryInfo.subtopics) {
    showSubtopicsList(theoryInfo.subtopics, index);
  } else {
    alert('Тема не найдена');
  }
}

// Проверка разблокировки подтемы
function isSubtopicUnlocked(topicIndex, subtopicIndex) {
  if (subtopicIndex === 0) return true; // первая подтема всегда открыта
  var prevSubtopic = THEORY_FILES[topicIndex].subtopics[subtopicIndex - 1];
  return userProgress.completedLessons && userProgress.completedLessons[prevSubtopic.title];
}

async function openLessonTheory(index) {
    var lesson = QUESTIONS_FILES[index];
    var theoryInfo = THEORY_FILES.find(t => t.subtopics && t.subtopics.some(s => s.key === lesson.key));
    if (theoryInfo) {
        var sub = theoryInfo.subtopics.find(s => s.key === lesson.key);
        if (sub) {
            openSubtopic(THEORY_FILES.indexOf(theoryInfo), theoryInfo.subtopics.indexOf(sub));
            return;
        }
    }
    goQuizFromLoaded(index);
}

function showSubtopicsList(subtopics, parentIndex) {
    goScreen('s-topic');
    var theoryInfo = THEORY_FILES[parentIndex];
    document.getElementById('topic-title').textContent = theoryInfo.title;

    var container = document.getElementById('topic-content');
    var html = '<div class="section-title">' + ICONS.list + ' Выбери урок</div>';

    subtopics.forEach(function(sub, i) {
        var done = userProgress.completedLessons && userProgress.completedLessons[sub.title];
        var locked = !isSubtopicUnlocked(parentIndex, i);
        var icon = done ? ICONS.check : (locked ? ICONS.lock : ICONS.play);
        var cleanTitle = sub.title.replace(/^[^\wа-яё]+/i, '');
        var stateClass = locked ? 'list-row--locked' : '';
        html += '<div class="list-row ' + stateClass + '" onclick="' + (locked ? '' : 'openSubtopic(' + parentIndex + ', ' + i + ')') + '">';
        html += '<span style="margin-right:var(--space-2);">' + icon + '</span>' + cleanTitle;
        if (locked) html += '<span style="margin-left:auto;font-size:var(--text-xs);color:var(--muted)">Завершите предыдущий урок</span>';
        html += '</div>';
    });

    container.innerHTML = html;
    container.style.position = 'relative';
    container.style.zIndex = '20';
}

async function openSubtopic(parentIndex, subtopicIndex) {
    if (!isSubtopicUnlocked(parentIndex, subtopicIndex)) {
        alert('Этот урок ещё не открыт. Завершите предыдущий урок.');
        return;
    }

    var theoryInfo = THEORY_FILES[parentIndex];
    if (!theoryInfo || !theoryInfo.subtopics) {
        alert('Ошибка: нет подтем у темы');
        return;
    }
    var sub = theoryInfo.subtopics[subtopicIndex];
    if (!sub) {
        alert('Ошибка: подтема не найдена');
        return;
    }

    currentLessonIndex = parentIndex;
    currentSubtopicQuestionsFile = sub.questions;

    goScreen('s-topic');
    var container = document.getElementById('topic-content');
    container.innerHTML = '' +
      '<div class="skeleton skeleton-card" style="height:180px"></div>' +
      '<div class="skeleton skeleton-text" style="width:60%"></div>' +
      '<div class="skeleton skeleton-text" style="width:80%"></div>' +
      '<div class="skeleton skeleton-text" style="width:40%"></div>';
    
    var cleanTitle = (sub.title || 'Загрузка...').replace(/[^\p{L}\p{N}\p{P}\p{Z}]/gu, '').trim();
    var topicIcon = sub.icon && ICONS[sub.icon] ? ICONS[sub.icon] + ' ' : '';
    document.getElementById('topic-title').innerHTML = topicIcon + cleanTitle;

    var url = window.location.origin + '/data/' + sub.file + '?v=' + Date.now();

    try {
        var response = await fetch(url);
        if (!response.ok) throw new Error('HTTP ' + response.status + ' ' + response.statusText);
        var theory = await response.json();
        startTheoryCards({ title: cleanTitle, key: sub.key }, theory, sub.key);
    } catch (e) {
        alert('❌ Ошибка загрузки теории\n\nФайл: ' + sub.file + '\nURL: ' + url + '\nОшибка: ' + e.message);
        goQuizFromLoaded(parentIndex);
    }
}

function startSubtopicPractice() {
    if (!currentSubtopicQuestionsFile) {
        goQuizFromLoaded(currentLessonIndex);
        return;
    }

    var url = 'data/' + currentSubtopicQuestionsFile;
    fetch(url)
        .then(function(response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        })
        .then(function(questions) {
            shuffled = questions;
            curQ = 0;
            score = 0;
            answered = false;
            lives = 3;
            hintUsed = false;
            correctStreak = 0;
            lastAnswerWasWrong = false;
            isBossMode = false;
            currentLessonIndex = 0;
            goScreen('s-quiz');
            renderQ();
        })
        .catch(function(e) {
            alert('Ошибка загрузки практики: ' + e.message);
            goQuizFromLoaded(currentLessonIndex);
        });
}

function showTheoryScreen(theoryInfo) {}
function startLessonPractice(){ goQuizFromLoaded(currentLessonIndex); }

// ==========================================
// ПРОФИЛЬ (с подпиской)
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
  html += '<div class="profile-avatar-big">' + ICONS.user + '</div>';
  html += '<div><div class="profile-name-big">Ученик ГеоПро <span style="font-size:var(--text-sm);background:var(--primary);color:#fff;padding:var(--space-1) var(--space-2);border-radius:10px;margin-left:var(--space-2)">' + rank + '</span></div>';
  html += '<div class="profile-level-big">⚡ Уровень ' + userProgress.level + ' · ' + userProgress.xp + ' XP</div>';
  var nextRank = getNextRank(userProgress.xp);
  if (nextRank) {
    var xpNeeded = nextRank.min;
    var currentXP = userProgress.xp;
    var progressPct = Math.min(100, Math.round((currentXP / xpNeeded) * 100));
    html += '<div style="margin-top:var(--space-2);font-size:var(--text-xs);color:var(--muted)">До ранга "' + nextRank.name + '" осталось ' + (xpNeeded - currentXP) + ' XP</div>';
    html += '<div class="path-progress-bar" style="height:6px;margin-top:var(--space-1)"><div class="path-progress-fill" style="width:' + progressPct + '%"></div></div>';
  }
  html += '</div></div>';

  html += '<div class="info-card" style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-3)">';
  html += '<div style="font-size:var(--text-2xl)">' + ICONS.target + '</div>';
  html += '<div><div style="font-weight:700;font-size:var(--text-base)">Прогноз на ОГЭ</div>';
  html += '<div style="font-size:var(--text-sm);color:var(--muted);margin-top:var(--space-1)">При текущей точности ты можешь получить <span style="color:var(--gold);font-weight:800">' + getPredictedScore(predictedGrade) + '</span></div></div>';
  html += '</div>';

  html += '<div class="profile-stats-grid">';
  html += '<div class="profile-stat"><div class="profile-stat-num" style="cursor:pointer" onclick="goScreen(\'s-review\')">' + completedCount + '/' + allLessons.length + '</div><div class="profile-stat-label">Тем пройдено</div></div>';
  html += '<div class="profile-stat"><div class="profile-stat-num">' + acc + '%</div><div class="profile-stat-label">Точность</div></div>';
  html += '<div class="profile-stat"><div class="profile-stat-num">' + ICONS.fire + ' ' + (userProgress.streak || 0) + '</div><div class="profile-stat-label">Дней подряд</div></div>';
  html += '</div>';

  html += '<div class="info-card" style="margin:var(--space-3) 0;display:flex;justify-content:space-between;align-items:center;' + (chestCount > 0 ? 'animation: chestGlow 2s infinite, chestPulse 1.5s infinite;' : '') + '">';
  html += '<div><div style="font-weight:700;font-size:var(--text-base)">' + ICONS.gift + ' Сундуки</div>';
  if (chestCount > 0) {
    html += '<div style="font-size:var(--text-xs);color:var(--muted);margin-top:var(--space-1)">Доступно: ' + chestCount + ' ' + (chestCount === 1 ? 'сундук' : (chestCount >= 2 && chestCount <= 4 ? 'сундука' : 'сундуков')) + '</div>';
  } else {
    html += '<div style="font-size:var(--text-xs);color:var(--muted);margin-top:var(--space-1)">Сегодня все награды уже получены. Возвращайся завтра.</div>';
  }
  html += '</div>';
  html += '<button onclick="openChest()" style="background:var(--gold);color:#000;border:none;border-radius:12px;padding:var(--space-2) var(--space-4);font-family:var(--font-b);font-size:var(--text-sm);font-weight:700;cursor:pointer;' + (chestCount > 0 ? 'animation: chestPulse 1.2s infinite;' : 'opacity:0.5;background:gray !important;color:#fff;') + '"' + (chestCount === 0 ? ' disabled' : '') + '>' + (chestCount > 0 ? 'Открыть сундук' : 'Нет сундуков') + '</button>';
  html += '</div>';

  html += '<div class="info-card" style="margin:var(--space-2) 0">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center">';
  html += '<div><div style="font-weight:700;font-size:var(--text-base)">' + ICONS.user + ' Мой класс</div><div style="font-size:var(--text-xs);color:var(--muted);margin-top:var(--space-1)">Пригласи друзей, чтобы сравнивать прогресс</div></div>';
  html += '<button onclick="inviteFriend()" class="btn-ghost" style="padding:var(--space-2) var(--space-3);font-size:var(--text-xs);">➕ Пригласить</button>';
  html += '</div><div style="margin-top:var(--space-3);font-size:var(--text-xs);color:var(--muted);text-align:center">Рейтинг класса появится позже</div>';
  html += '</div>';

  checkAchievements();
  var achievements = userProgress.achievements || {};
  html += '<div class="section-title" style="margin:var(--space-2) 0 var(--space-1)">Достижения</div>';
  html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-2)">';
  ACHIEVEMENTS_LIST.forEach(function(a) {
    var ach = achievements[a.id] || { progress: 0, unlocked: false };
    var isUnlocked = ach.unlocked;
    var progress = a.max ? ach.progress : (isUnlocked ? (a.max || 1) : 0);
    var dateStr = ach.date ? new Date(ach.date).toLocaleDateString() : '';
    html += '<div class="badge-item-p' + (isUnlocked ? '' : ' locked') + '" style="position:relative">';
    html += '<div class="badge-icon-p">' + (a.icon && a.icon.startsWith('<svg') ? a.icon : ICONS.star) + '</div>';
    html += '<div class="badge-name-p">' + a.title + '</div>';
    if (a.max) {
      html += '<div style="font-size:var(--text-xs);color:var(--muted);margin-top:var(--space-1)">' + progress + '/' + a.max + '</div>';
    }
    if (isUnlocked && dateStr) {
      html += '<div style="font-size:var(--text-xs);color:var(--primary2);margin-top:var(--space-1)">' + dateStr + '</div>';
    }
    html += '</div>';
  });
  html += '</div>';

  // Блок подписки
  var subStatus = Subscription.getStatus();
  html += '<div class="section-title" style="margin:var(--space-3) 0 var(--space-1)">Подписка</div>';

  if (subStatus.active) {
    var subTypeText = subStatus.type === 'trial' ? 'Пробный период' : 'Подписка активна';
    var subDetails = subStatus.type === 'trial'
      ? 'Осталось ' + subStatus.daysLeft + ' ' + getDayWord(subStatus.daysLeft)
      : 'Действует до ' + userProgress.subscriptionEndDate;
    html += '<div class="sub-status-card active">';
    html += '<div style="font-size:var(--text-xl)">' + ICONS.check + '</div>';
    html += '<div><div style="font-weight:700;font-size:var(--text-base)">' + subTypeText + '</div>';
    html += '<div style="font-size:var(--text-xs);color:var(--muted);margin-top:var(--space-1)">' + subDetails + '</div></div>';
    html += '</div>';
  } else {
    html += '<div class="sub-status-card" style="border-color:var(--danger);background:linear-gradient(135deg,#2a1010,#1f0808)">';
    html += '<div style="font-size:var(--text-xl)">' + ICONS.alertTriangle + '</div>';
    html += '<div><div style="font-weight:700;font-size:var(--text-base)">Пробный период истёк</div>';
    html += '<div style="font-size:var(--text-xs);color:var(--muted);margin-top:var(--space-1)">Оформите подписку за ' + Subscription.PRICE + ' ₽/мес</div></div>';
    html += '</div>';
    html += '<button class="btn-primary" style="margin-top:var(--space-2)" onclick="handleSubscribe()">Оформить подписку</button>';
  }

  container.innerHTML = html;

  // Контекстная подсказка для первого сундука (после рендера, если онбординг завершён)
  if (userProgress.onboardingCompleted) {
    setTimeout(function() {
      showContextualHint('firstChest');
    }, 300);
  }
}

// --------------------------------------------------
//  Главный экран (путь обучения) — родительские темы
// --------------------------------------------------
function renderHomePath() {
  var container = document.getElementById('home-content');
  if (!container) return;

  if (lessonsLoaded.length === 0) {
    container.innerHTML = '' +
      '<div class="skeleton skeleton-card"></div>' +
      '<div class="skeleton skeleton-list-item"></div>' +
      '<div class="skeleton skeleton-list-item"></div>' +
      '<div class="skeleton skeleton-list-item"></div>' +
      '<div class="skeleton skeleton-list-item"></div>';
    loadAllLessons().then(function() {
      renderHomePath();
    });
    return;
  }

  if (!THEORY_FILES || THEORY_FILES.length === 0) {
    container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--danger)">⚠️ Не удалось загрузить темы</div>';
    return;
  }

  updateDailyTasks();

  var completedCount = Object.keys(userProgress.completedLessons).length;
  var totalLessons = 0;
  THEORY_FILES.forEach(t => totalLessons += t.subtopics ? t.subtopics.length : 1);
  var pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  var allDone = completedCount >= totalLessons;
  var streak = userProgress.streak || 0;
  var predictedGrade = getPredictedGrade();
  var predictedScore = getPredictedScore(predictedGrade);
  var reviewTopics = getTodayReviewTopics();

  var html = '';

  html += '<div class="carousel" id="home-carousel">';
  html += '<div class="carousel-card">';
  html += '<div style="font-family:var(--font-h);font-size:var(--text-base);font-weight:700;margin-bottom:var(--space-1)">Твой прогноз ОГЭ</div>';
  if (predictedGrade !== '—') {
    html += '<div style="font-size:var(--text-3xl);font-weight:800;color:var(--gold);line-height:1">' + predictedGrade + '</div>';
    html += '<div style="font-size:var(--text-sm);color:var(--muted)">Прогноз: ' + predictedScore + ' баллов</div>';
    var currentGrade = parseInt(predictedGrade);
    if (currentGrade < 5) {
      var nextGrade = currentGrade + 1;
      var needed = getCorrectAnswersNeededForGrade(nextGrade);
      var progressPercent = userProgress.totalCorrect / (userProgress.totalCorrect + needed) * 100;
      progressPercent = Math.min(100, Math.round(progressPercent));
      html += '<div style="margin-top:var(--space-2);font-size:var(--text-xs);color:var(--muted)">До ' + nextGrade + ' ещё ' + needed + ' ' + getDayWord(needed) + '</div>';
      html += '<div class="path-progress-bar" style="height:6px;margin-top:var(--space-1)"><div class="path-progress-fill" style="width:' + progressPercent + '%"></div></div>';
    } else {
      html += '<div style="margin-top:var(--space-2);font-size:var(--text-sm);color:var(--primary2)">Ты на высшем уровне!</div>';
    }
  } else {
    html += '<div style="font-size:var(--text-base);color:var(--muted)">Недостаточно данных</div>';
  }
  html += '</div>';

  var tasks = userProgress.dailyTasks || {};
  html += '<div class="carousel-card">';
  html += '<div style="font-family:var(--font-h);font-size:var(--text-base);font-weight:700;margin-bottom:var(--space-2);display:flex;align-items:center;gap:var(--space-2);">' + ICONS.target + ' Ежедневные задания</div>';
  html += '<div style="display:flex;flex-direction:column;gap:var(--space-2);font-size:var(--text-sm)">';
  html += '<div style="display:flex;align-items:center;gap:var(--space-2)"><span style="color:' + (tasks.solve10 ? 'var(--primary2)' : 'var(--muted)') + '">' + (tasks.solve10 ? '✅' : '⬜') + '</span> 10 вопросов решено</div>';
  html += '<div style="display:flex;align-items:center;gap:var(--space-2)"><span style="color:' + (tasks.earn50XP ? 'var(--primary2)' : 'var(--muted)') + '">' + (tasks.earn50XP ? '✅' : '⬜') + '</span> 50 XP получено</div>';
  html += '<div style="display:flex;align-items:center;gap:var(--space-2)"><span style="color:' + (tasks.loginToday ? 'var(--primary2)' : 'var(--muted)') + '">' + (tasks.loginToday ? '✅' : '⬜') + '</span> Заходил сегодня</div>';
  html += '</div>';
  html += '</div>';

  html += '<div class="carousel-card">';
  html += '<div style="font-family:var(--font-h);font-size:var(--text-base);font-weight:700;margin-bottom:var(--space-1);display:flex;align-items:center;gap:var(--space-2);">' + ICONS.fire + ' Серия</div>';
  html += '<div style="font-size:var(--text-3xl);font-weight:800;color:#f85149;line-height:1">' + streak + '</div>';
  html += '<div style="font-size:var(--text-sm);color:var(--muted)">' + getDayWord(streak) + ' подряд</div>';
  html += '<div style="margin-top:var(--space-2);font-size:var(--text-sm);">' + (streak >= 7 ? 'Ты в ударе! Так держать!' : streak >= 3 ? 'Хорошая серия, продолжай!' : 'Каждый день — шаг к успеху!') + '</div>';
  html += '</div>';
  html += '</div>';

  var carouselCardsCount = 3;
  html += '<div class="carousel-dots" id="carousel-dots">';
  for (var dotIdx = 0; dotIdx < carouselCardsCount; dotIdx++) {
    html += '<div class="carousel-dot' + (dotIdx === 0 ? ' active' : '') + '"></div>';
  }
  html += '</div>';

  if (reviewTopics.length > 0) {
    var firstReviewTopic = reviewTopics[0];
    var reviewIdx = getReviewLessonIndex(firstReviewTopic);
    var reviewData = userProgress.reviewData && userProgress.reviewData[firstReviewTopic];
    var mastery = reviewData ? reviewData.mastery || 50 : 50;
    html += '<div class="continue-card" onclick="startReviewLesson(' + reviewIdx + ',' + mastery + ')">';
    html += '<div class="continue-icon">' + ICONS.arrowRight + '</div>';
    html += '<div><div class="continue-label">Повторить сегодня</div><div class="continue-title">' + firstReviewTopic + '</div></div>';
    html += '<div class="continue-arrow">' + ICONS.arrowRight + '</div></div>';
  } else {
    if (!allDone) {
      var nextTopicIndex = -1;
      for (var i = 0; i < THEORY_FILES.length; i++) {
        var topic = THEORY_FILES[i];
        if (topic.subtopics) {
          var allSubtopicDone = topic.subtopics.every(sub => userProgress.completedLessons && userProgress.completedLessons[sub.title]);
          if (!allSubtopicDone) {
            nextTopicIndex = i;
            break;
          }
        }
      }
      if (nextTopicIndex >= 0) {
        var nextTopic = THEORY_FILES[nextTopicIndex];
        html += '<div class="continue-card" onclick="openTopic(' + nextTopicIndex + ')">';
        html += '<div class="continue-icon">' + ICONS.play + '</div>';
        html += '<div><div class="continue-label">Продолжить</div><div class="continue-title">' + nextTopic.title + '</div></div>';
        html += '<div class="continue-arrow">' + ICONS.arrowRight + '</div></div>';
      }
    } else {
      html += '<div class="continue-card" onclick="goBossLevel()" style="background:linear-gradient(135deg,#3a2a0c,#2a1f08);border-color:#d2992250">';
      html += '<div class="continue-icon">' + ICONS.crown + '</div>';
      html += '<div><div class="continue-label" style="color:#d29922">Готово к финалу</div><div class="continue-title">Финальный босс</div></div>';
      html += '<div class="continue-arrow" style="color:#d29922">' + ICONS.arrowRight + '</div></div>';
    }
  }

  // --- Список родительских тем с учётом блокировок ---
  html += '<div class="section-title" style="margin:var(--space-5) 0 var(--space-3) var(--space-4);">' + ICONS.list + ' Разделы</div>';

  for (var i = 0; i < THEORY_FILES.length; i++) {
    var topic = THEORY_FILES[i];
    if (topic.comingSoon) {
      // Заглушка для будущих тем
      html += '<div class="list-row list-row--locked">';
      html += '<div class="status-badge status-badge--locked">' + ICONS.lock + '</div>';
      html += '<div style="flex:1;"><div style="font-weight:600;font-size:var(--text-base);">' + topic.title + '</div>';
      html += '<div style="font-size:var(--text-xs);color:var(--muted);margin-top:var(--space-1);">Появится позже</div>';
      html += '</div></div>';
      continue;
    }

    var totalSub = topic.subtopics ? topic.subtopics.length : 0;
    var doneSub = 0;
    var firstUnlocked = isSubtopicUnlocked(i, 0); // первая подтема определяет доступность всей темы
    var topicLocked = !firstUnlocked;

    if (topic.subtopics) {
      topic.subtopics.forEach(function(sub) {
        if (userProgress.completedLessons && userProgress.completedLessons[sub.title]) doneSub++;
      });
    }

    var stateClass = topicLocked ? 'list-row--locked' : (doneSub >= totalSub ? 'list-row--done' : 'list-row--current');
    var stateIcon = topicLocked ? ICONS.lock : (doneSub >= totalSub ? ICONS.check : ICONS.play);
    var badgeClass = topicLocked ? 'status-badge--locked' : (doneSub >= totalSub ? 'status-badge--done' : 'status-badge--current');

    html += '<div class="list-row ' + stateClass + '" onclick="' + (topicLocked ? '' : 'openTopic(' + i + ')') + '">';
    html += '<div class="status-badge ' + badgeClass + '">' + stateIcon + '</div>';
    html += '<div style="flex:1;"><div style="font-weight:600;font-size:var(--text-base);">' + topic.title + '</div>';
    html += '<div class="mini-progress"><div class="mini-progress-fill" style="width:' + (doneSub/totalSub*100) + '%;"></div></div>';
    html += '<div style="font-size:var(--text-xs);color:var(--muted);margin-top:var(--space-1);">' + doneSub + '/' + totalSub + ' уроков</div>';
    if (topicLocked) html += '<span style="font-size:var(--text-xs);color:var(--muted)">Пройдите предыдущий раздел</span>';
    html += '</div></div>';
  }

  container.innerHTML = html;

  setTimeout(function() {
    var gradeEl = container.querySelector('.carousel-card:first-child div[style*="font-size:var(--text-3xl)"]');
    if (gradeEl && predictedGrade !== '—') {
      animateNumber(gradeEl, parseInt(predictedGrade), 700);
    }
    var streakEl = container.querySelector('.carousel-card:nth-child(3) div[style*="font-size:var(--text-3xl)"]');
    if (streakEl) {
      animateNumber(streakEl, streak, 700);
    }
  }, 100);

  document.getElementById('home-streak').innerHTML = ICONS.fire + ' ' + streak;
  document.getElementById('home-sublabel').textContent = completedCount + '/' + totalLessons + ' уроков пройдено';

  var carousel = document.getElementById('home-carousel');
  if (carousel) {
    function updateCarouselActive() {
      var cards = carousel.querySelectorAll('.carousel-card');
      if (!cards.length) return;
      var scrollLeft = carousel.scrollLeft;
      var cardWidth = cards[0].offsetWidth + 12;
      var activeIndex = Math.round(scrollLeft / cardWidth);
      cards.forEach(function(card, idx) {
        if (idx === activeIndex) {
          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
      });
      var dots = document.querySelectorAll('#carousel-dots .carousel-dot');
      dots.forEach(function(d, idx) { d.classList.toggle('active', idx === activeIndex); });
    }
    carousel.removeEventListener('scroll', carousel._scrollHandler);
    carousel.addEventListener('scroll', updateCarouselActive);
    carousel._scrollHandler = updateCarouselActive;
    updateCarouselActive();
  }
}

// ==========================================
// ИТОГИ ЗАНЯТИЯ (Session Summary)
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

  html += '<div class="res-stats" style="margin-top:var(--space-3)">';
  html += '<div class="res-stat"><div class="res-num g">' + totalQuestions + '</div><div class="res-label">Решено вопросов</div></div>';
  html += '<div class="res-stat"><div class="res-num y">+' + xpGain + '</div><div class="res-label">XP</div></div>';
  html += '<div class="res-stat"><div class="res-num" style="color:#f85149">' + ICONS.fire + ' ' + streak + '</div><div class="res-label">Серия дней</div></div>';
  html += '</div>';

  if (levelUp) {
    html += '<div class="res-stat" style="background:rgba(63,185,80,0.15);border-color:var(--primary2);margin-top:var(--space-2)">';
    html += '<div class="res-num g">' + ICONS.trophy + '</div><div class="res-label">Новый уровень!</div>';
    html += '</div>';
  }
  if (chestReceived) {
    html += '<div class="res-stat" style="background:rgba(210,153,34,0.2);border-color:var(--gold);margin-top:var(--space-2)">';
    html += '<div class="res-num y">' + ICONS.gift + '</div><div class="res-label">Получен сундук!</div>';
    html += '</div>';
  }

  html += '<div style="background:var(--card2);border:1px solid var(--border);border-radius:var(--radius);padding:var(--space-3);margin-top:var(--space-4);text-align:left">';
  html += '<div style="font-weight:700;margin-bottom:var(--space-1)">🧑‍🏫 Профессор Гео:</div>';
  html += '<div style="font-size:var(--text-base);line-height:1.5;color:var(--text)">' + professorComment + '</div>';
  html += '</div>';

  html += '<div style="margin-top:var(--space-5);font-size:var(--text-base);font-weight:600;color:var(--muted)">📌 Рекомендация</div>';
  html += '<div class="continue-card" style="margin-top:var(--space-2)" onclick="executeNextAction()">';
  html += '<div class="continue-icon">' + ICONS.play + '</div>';
  html += '<div><div class="continue-label">Следующий шаг</div><div class="continue-title">' + (nextAction && nextAction.text ? nextAction.text : 'Продолжить обучение') + '</div></div>';
  html += '<div class="continue-arrow">' + ICONS.arrowRight + '</div>';
  html += '</div>';

  html += '<div class="res-btns" style="margin-top:var(--space-5)">';
  html += '<button class="btn-primary" onclick="executeNextAction()">Продолжить обучение</button>';
  html += '<button class="btn-secondary" onclick="goScreen(\'s-home\')">🏠 На главный экран</button>';
  html += '</div>';

  container.innerHTML = html;
}

window.executeNextAction = function() {
    if (currentSubtopicQuestionsFile) {
        var parentLesson = THEORY_FILES.find(function(t) {
            return t.subtopics && t.subtopics.some(function(s) { return s.questions === currentSubtopicQuestionsFile; });
        });
        if (parentLesson) {
            var parentIndex = THEORY_FILES.indexOf(parentLesson);
            showSubtopicsList(parentLesson.subtopics, parentIndex);
            return;
        }
    }
    goScreen('s-home');
};

// ==========================================
// ЦЕНТР ПОВТОРЕНИЯ (Review Screen)
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

  html += '<div class="section-title">' + ICONS.chart + ' Статус тем</div>';

  ['red', 'yellow', 'green'].forEach(function(status) {
    var list = statuses[status];
    if (list.length === 0) return;
    var emoji = status === 'red' ? '🔴' : status === 'yellow' ? '🟡' : '🟢';
    var label = status === 'red' ? 'Требует повторения' : status === 'yellow' ? 'Пора повторить' : 'Изучено';

    list.forEach(function(item) {
      html += '<div class="path-progress-card" style="margin-bottom:var(--space-3); display:flex; justify-content:space-between; align-items:center;">';
      html += '<div><div style="font-weight:600;">' + item.title + '</div>';
      html += '<div style="font-size:var(--text-xs); color:var(--muted);">' + emoji + ' ' + label + ' · ' + item.mastery + '% усвоения</div></div>';
      html += '<button class="btn-primary" style="padding:var(--space-2) var(--space-4); width:auto;" onclick="startReviewLesson(' + getReviewLessonIndex(item.title) + ',' + item.mastery + ')">' + ICONS.arrowRight + ' Повторить</button>';
      html += '</div>';
    });
  });

  if (html.indexOf('path-progress-card') === -1) {
    html += '<div style="text-align:center; color:var(--muted); padding:40px;">Нет данных для повторения. Пройдите несколько тем!</div>';
  }

  container.innerHTML = html;
}