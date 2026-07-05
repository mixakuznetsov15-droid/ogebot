// ==========================================
//  ПРОФЕССОР ГЕО — ПОДСКАЗКИ
// ==========================================

var currentHintLevel = 0;

// Выбрать случайный элемент из массива
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Получить подсказку по теме и уровню
function getProfessorHint(questionId, hintLevel) {
  var topicKey = getCurrentTopicKey();
  var bank = HINT_BANK[topicKey] || HINT_BANK.default;
  var idx = Math.min(Math.max(hintLevel, 1), 3) - 1;
  return bank[idx] || bank[bank.length - 1];
}

// Открыть модальное окно профессора (кнопка "Спросить профессора")
function askProfessor() {
  if (answered) return;
  hintUsed = true;
  currentHintLevel = 1;
  renderProfessorModal();
}

// Следующий уровень подсказки
function nextProfessorHint() {
  if (currentHintLevel >= 3) return;
  currentHintLevel++;
  renderProfessorModal();
}

// Отрисовать модальное окно профессора
function renderProfessorModal() {
  var container = document.getElementById('modal-container');
  var hintText = getProfessorHint(curQ, currentHintLevel);
  var intro = pickRandom(PROFESSOR_INTROS);
  var isMax = currentHintLevel >= 3;
  var dotsHtml = '';
  for (var i = 1; i <= 3; i++) {
    dotsHtml += '<div class="prof-dot' + (i <= currentHintLevel ? ' filled' : '') + '"></div>';
  }

  container.innerHTML =
    '<div class="prof-modal-overlay" id="prof-overlay" onclick="if(event.target===this) closeProfessorModal()">' +
      '<div class="prof-modal-card">' +
        '<div class="prof-modal-header">' +
          '<div class="prof-modal-avatar">👨‍🏫</div>' +
          '<div><div class="prof-modal-name">Профессор Гео</div><div class="prof-modal-level">Подсказка ' + currentHintLevel + ' из 3</div></div>' +
        '</div>' +
        '<div class="prof-modal-text">' + intro + ' ' + hintText + '</div>' +
        '<div class="prof-modal-dots">' + dotsHtml + '</div>' +
        '<div class="prof-modal-btns">' +
          '<button class="prof-modal-btn close" onclick="closeProfessorModal()">Закрыть</button>' +
          '<button class="prof-modal-btn more" id="prof-more-btn" onclick="nextProfessorHint()"' + (isMax ? ' disabled' : '') + '>Ещё подсказка</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      var ov = document.getElementById('prof-overlay');
      if (ov) ov.classList.add('show');
    });
  });
}

// Закрыть модальное окно профессора
function closeProfessorModal() {
  var overlay = document.getElementById('prof-overlay');
  if (!overlay) return;
  overlay.classList.remove('show');
  setTimeout(function () {
    var c = document.getElementById('modal-container');
    if (c) c.innerHTML = '';
  }, 280);
}