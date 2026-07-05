// ==========================================
//  ЗАГРУЗКА ТЕОРИИ И ВОПРОСОВ
// ==========================================

// Загруженные уроки (вопросы)
var lessonsLoaded = [];

// Загрузка JSON-файла
async function fetchJSON(filename) {
  var url = GITHUB_RAW + filename + '?nocache=' + Date.now();
  var r = await fetch(url);
  if (!r.ok) throw new Error('Ошибка загрузки: ' + filename);
  return await r.json();
}

// Загрузка всех уроков из QUESTIONS_FILES
async function loadAllLessons() {
  lessonsLoaded = [];
  for (var i = 0; i < QUESTIONS_FILES.length; i++) {
    var f = QUESTIONS_FILES[i];
    try {
      var data = await fetchJSON(f.file);
      var questions = [];
      if (Array.isArray(data)) {
        data.forEach(function(item) {
          if (item.tag && item.text && item.answers) {
            questions.push(item);
          }
        });
      }
      if (questions.length > 0) {
        lessonsLoaded.push({
          key: f.key,
          title: f.title,
          tasks: f.tasks,
          questions: questions
        });
      }
    } catch(e) {
      console.warn('Не удалось загрузить', f.file, e);
    }
  }
  return lessonsLoaded;
}

// Получить все загруженные уроки (если ещё не загружены — вернуть пустой массив)
function getAllLessons() {
  return lessonsLoaded.length > 0 ? lessonsLoaded : [];
}