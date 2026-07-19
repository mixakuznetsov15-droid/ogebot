// ==========================================
//  МИКРОУРОКИ (расширенная версия)
// ==========================================

var microSteps = [];
var microStepIndex = 0;
var microTopicKey = '';

function startTheoryCards(theoryInfo, data, topicKey) {
  let steps = [];

  if (data && Array.isArray(data.cards)) {
    steps = data.cards.map(card => {
      // Преобразуем новые типы в понятные движку
      if (card.type === 'image_lesson') {
        return {
          type: 'image_lesson',
          title: card.title || '',
          text: card.text || '',
          image: card.image || '',
          caption: card.caption || ''
        };
      } else if (card.type === 'image_hotspot') {
        return {
          type: 'image_hotspot',
          question: card.question,
          image: card.image,
          hotspots: card.hotspots || [],
          explanation: card.explanation || ''
        };
      }
      // ... остальные типы без изменений ...
      return card;
    });
  }

  // ... остальная логика без изменений ...
}

function renderMicroStep() {
  // ... существующий код ...

  // Добавляем рендеринг новых типов
  if (step.type === 'image_lesson') {
    html += '<div class="theory-card">';
    html += '<div class="theory-topic">' + step.title + '</div>';
    html += '<img src="' + step.image + '" style="width:100%;border-radius:12px;margin-bottom:12px;" />';
    if (step.caption) html += '<div style="font-size:12px;color:var(--muted);margin-bottom:8px;">' + step.caption + '</div>';
    html += '<div class="theory-text">' + step.text.replace(/\n/g, '<br>') + '</div>';
    html += '<button class="btn-full primary" onclick="nextMicroStep()">Продолжить →</button>';
    html += '</div>';
  } else if (step.type === 'image_hotspot') {
    html += '<div class="quiz-wrap" style="padding:0">';
    html += '<div class="q-card"><div class="q-text">' + step.question + '</div></div>';
    html += '<div style="position:relative;display:inline-block;">';
    html += '<img src="' + step.image + '" style="width:100%;border-radius:12px;" />';
    step.hotspots.forEach(function(hs, idx) {
      html += '<div style="position:absolute;left:' + hs.x + 'px;top:' + hs.y + 'px;width:' + (hs.radius*2) + 'px;height:' + (hs.radius*2) + 'px;border-radius:50%;background:rgba(255,255,255,0.3);border:2px solid var(--primary);cursor:pointer;" onclick="answerHotspot(' + idx + ')"></div>';
    });
    html += '</div>';
    html += '<div id="micro-feedback" style="margin-top:12px;"></div>';
    html += '</div>';
  }

  // ... остальной рендеринг ...
}

function answerHotspot(chosen) {
  var step = microSteps[microStepIndex];
  var isCorrect = step.hotspots[chosen].correct;
  processMicroAnswer(isCorrect, step.explanation);
}