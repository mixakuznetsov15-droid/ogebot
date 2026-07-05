// ==========================================
//  КОМПОНЕНТЫ: AI-чат и другие UI-элементы
// ==========================================

// Инициализация AI-чата (Профессор Гео)
function initAI(cid, ctx, prompts, autoOpen) {
  var el = document.getElementById(cid);
  if (!el) return;

  prompts = prompts || [];
  autoOpen = autoOpen || false;

  var escCtx = ctx.replace(/'/g, "\\'").replace(/"/g, '&quot;');

  el.innerHTML = `
    <div class="ai-header" onclick="toggleAI(this)">
      <div class="ai-header-left">
        <div class="ai-avatar">🎓</div>
        <div><div class="ai-name">Профессор Гео</div><div class="ai-tagline">Спроси — объясню как наставник</div></div>
      </div>
      <div class="ai-toggle ${autoOpen ? 'open' : ''}">▼</div>
    </div>
    <div class="ai-body ${autoOpen ? 'open' : ''}">
      <div class="ai-context">📌 ${ctx}</div>
      <div class="ai-prompts">${prompts.map(function(p) {
        return '<button class="ai-prompt-btn" onclick="sendP(\'' + cid + '\',\'' + escCtx + '\',\'' + p.replace(/'/g, "\\'") + '\')">' + p + '</button>';
      }).join('')}</div>
      <div class="ai-messages" id="msgs-${cid}"></div>
      <div class="ai-input-row">
        <textarea class="ai-input" id="inp-${cid}" placeholder="Спроси Профессора..." rows="1"
          onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendM('${cid}','${escCtx}');}"></textarea>
        <button class="ai-send" id="snd-${cid}" onclick="sendM('${cid}','${escCtx}')">➤</button>
      </div>
    </div>
  `;
}

// Переключение видимости AI-панели
function toggleAI(header) {
  var body = header.nextElementSibling;
  var toggle = header.querySelector('.ai-toggle');
  body.classList.toggle('open');
  toggle.classList.toggle('open');
}

// Отправка готового промпта (из кнопок-подсказок)
function sendP(cid, ctx, text) {
  var inp = document.getElementById('inp-' + cid);
  if (inp) inp.value = text;
  sendM(cid, ctx);
}

// Отправка сообщения в AI-чат
async function sendM(cid, ctx) {
  var inp = document.getElementById('inp-' + cid);
  var snd = document.getElementById('snd-' + cid);
  var msgs = document.getElementById('msgs-' + cid);
  if (!inp || !snd || !msgs) return;

  var text = inp.value.trim();
  if (!text) return;

  inp.value = '';
  snd.disabled = true;

  // Сообщение пользователя
  msgs.innerHTML += '<div class="msg user">' + text + '</div>';

  // Заглушка загрузки
  var lid = 'l' + Date.now();
  msgs.innerHTML += '<div class="msg ai loading" id="' + lid + '">⏳ Профессор Гео думает...</div>';
  msgs.scrollTop = msgs.scrollHeight;

  try {
    var r = await fetch(PROXY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: text, context: ctx })
    });
    var d = await r.json();
    var ans = d.answer || 'Не удалось получить ответ';

    var loadingEl = document.getElementById(lid);
    if (loadingEl) loadingEl.remove();

    msgs.innerHTML += '<div class="msg ai">' + ans.replace(/\n/g, '<br>') + '</div>';
  } catch(e) {
    var loadingEl = document.getElementById(lid);
    if (loadingEl) loadingEl.remove();

    msgs.innerHTML += '<div class="msg ai" style="color:var(--danger)">⚠️ Ошибка соединения</div>';
  }

  snd.disabled = false;
  msgs.scrollTop = msgs.scrollHeight;
}

// Открыть AI-чат в режиме викторины
function openAIChat() {
  var aiPanel = document.getElementById('ai-quiz');
  if (!aiPanel) return;

  var topic = getCurrentTopicTitle ? getCurrentTopicTitle() : 'Текущая тема';
  var ctx = 'Вопрос ОГЭ: ' + (shuffled && shuffled[curQ] ? shuffled[curQ].text : '');

  if (!aiPanel.dataset.initialized) {
    initAI('ai-quiz', ctx, [], false);
    aiPanel.dataset.initialized = '1';
  }

  aiPanel.style.display = 'block';
  var body = aiPanel.querySelector('.ai-body');
  if (body) {
    body.classList.add('open');
    var msgs = document.getElementById('msgs-ai-quiz');
    if (msgs && typeof lastExplainText !== 'undefined' && lastExplainText.trim()) {
      msgs.innerHTML = '';
      msgs.innerHTML += '<div class="msg ai">' + lastExplainText.replace(/\n/g, '<br>') + '</div>';
    }
  }

  var toggle = aiPanel.querySelector('.ai-toggle');
  if (toggle) toggle.classList.add('open');
}