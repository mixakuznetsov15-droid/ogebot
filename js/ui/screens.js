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
// ТЕОРИЯ (с отладочным alert)
// ==========================================
var currentLessonIndex = 0;
var theoryLoaded = [];

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
        startTheoryCards(theoryInfo, theory, theoryInfo.key);
    } catch (e) {
        alert('❌ Ошибка загрузки ' + theoryInfo.file + ': ' + e.message);
    }
}

function showTheoryScreen(theoryInfo) {}
function startLessonPractice() { goQuizFromLoaded(currentLessonIndex); }

// ==========================================
// ПРОФИЛЬ (без изменений)
// ==========================================
function renderProfile() { /* ... весь ваш текущий код профиля ... */ }

// --------------------------------------------------
//  Вспомогательные вычисления (без изменений)
// --------------------------------------------------
function getDaysUntilOGE() { /* ... */ }
function getPredictedGrade() { /* ... */ }
function getPredictedScore(grade) { /* ... */ }
function getCorrectAnswersNeededForGrade(targetGrade) { /* ... */ }
function getDayWord(n) { /* ... */ }

// --------------------------------------------------
//  ГЛАВНЫЙ ЭКРАН — ИСПРАВЛЕННАЯ ВЕРСИЯ (onclick добавлен)
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
    container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--danger)">⚠️ Нет тем</div>';
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

  // --- Карусель (без изменений) ---
  html += '<div class="carousel" id="home-carousel">';
  // ... (три карточки) ...
  html += '</div>';
  html += '<div class="carousel-dots" id="carousel-dots">...</div>';

  // --- Кнопка действия (без изменений) ---
  // ...

  // --- Вертикальный список тем с onclick ---
  html += '<div style="font-family:var(--font-h);font-size:14px;font-weight:700;margin: 20px 0 10px 16px;">📚 Темы</div>';

  for (var i = 0; i < allLessons.length; i++) {
    var lesson = allLessons[i];
    var done = userProgress.completedLessons[lesson.title];
    var perfect = done && done.score === done.total;
    var isLocked = i > 0 && !userProgress.completedLessons[allLessons[i-1].title];
    var stateIcon = perfect ? '🏆' : done ? '✅' : isLocked ? '🔒' : '▶';
    var isReview = reviewTopics.indexOf(lesson.title) !== -1;
    var bgColor = perfect ? 'rgba(63,185,80,0.1)' : done ? 'rgba(63,185,80,0.05)' : 'var(--card2)';

    // Ключевая строка: добавляем onclick, если тема не заблокирована
    html += '<div style="display:flex;align-items:center;gap:12px;padding:12px;margin:4px 0;background:' + bgColor + ';border-radius:12px;border:1px solid var(--border);' + 
      (isLocked ? 'opacity:0.45;' : 'cursor:pointer;') + '"' + 
      (isLocked ? '' : ' onclick="openLessonTheory(' + i + ')"') + '>';
    html += '<div style="font-size:24px;width:32px;text-align:center;">' + stateIcon + '</div>';
    html += '<div style="flex:1;"><div style="font-weight:600;font-size:14px;">' + lesson.title + '</div>';
    if (done) {
      html += '<div style="font-size:11px;color:var(--primary2);">' + done.score + '/' + done.total + ' верно</div>';
    } else if (isLocked) {
      html += '<div style="font-size:11px;color:var(--muted);">Заблокировано</div>';
    } else {
      html += '<div style="font-size:11px;color:var(--muted);">' + (lesson.questions ? lesson.questions.length : '?') + ' вопросов</div>';
    }
    if (isReview) {
      html += '<span style="background:#f5a623;color:#000;padding:2px 8px;border-radius:10px;font-size:11px;margin-left:8px;">🔄 Повторить</span>';
    }
    html += '</div></div>';
  }

  // Финальный босс
  html += '<div style="display:flex;align-items:center;gap:12px;padding:12px;margin-top:12px;background:' + (allDone ? 'rgba(210,153,34,0.1)' : 'var(--card2)') + ';border-radius:12px;border:1px solid ' + (allDone ? '#d29922' : 'var(--border)') + ';' + (allDone ? 'cursor:pointer;' : 'opacity:0.45;') + '"' + (allDone ? ' onclick="goBossLevel()"' : '') + '>';
  html += '<div style="font-size:32px;">👑</div>';
  html += '<div style="flex:1;"><div style="font-weight:700;font-size:15px;color:' + (allDone ? '#d29922' : 'var(--muted)') + '">Финальный босс</div>';
  html += '<div style="font-size:11px;color:var(--muted);">' + (allDone ? 'Тест по всем темам открыт' : 'Пройди все темы') + '</div></div>';
  html += '</div>';

  container.innerHTML = html;

  document.getElementById('home-streak').textContent = '🔥 ' + streak;
  document.getElementById('home-sublabel').textContent = completedCount + '/' + totalCount + ' тем пройдено';

  // Карусель (без изменений)
  var carousel = document.getElementById('home-carousel');
  if (carousel) {
    function updateCarouselActive() { /* ... */ }
    carousel.removeEventListener('scroll', carousel._scrollHandler);
    carousel.addEventListener('scroll', updateCarouselActive);
    carousel._scrollHandler = updateCarouselActive;
    updateCarouselActive();
  }
}

// ==========================================
// ИТОГИ ЗАНЯТИЯ (Session Summary)
// ==========================================
function renderSessionSummary() { /* ... ваш код ... */ }

// ==========================================
// ЦЕНТР ПОВТОРЕНИЯ (Review Screen)
// ==========================================
function renderReviewScreen() { /* ... ваш код ... */ }