// ==========================================
//  СИСТЕМА СУНДУКОВ
// ==========================================

// Добавляем стили для модальных окон (центрирование)
(function addChestStyles() {
  var style = document.createElement('style');
  style.textContent = `
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }
    .modal-card {
      background: var(--card2, #1c2333);
      border: 1px solid var(--border, rgba(255,255,255,0.05));
      border-radius: var(--radius, 18px);
      padding: 24px;
      text-align: center;
      max-width: 320px;
      width: 90%;
      box-shadow: 0 12px 40px rgba(0,0,0,0.5);
      animation: scaleIn 0.25s cubic-bezier(0.34, 1.3, 0.64, 1);
    }
    .modal-title {
      font-family: var(--font-h, 'Unbounded', sans-serif);
      font-size: 18px;
      font-weight: 800;
      margin-bottom: 8px;
    }
    .modal-sub {
      font-size: 14px;
      color: var(--muted, #8b949e);
      margin-bottom: 12px;
    }
    .modal-reward {
      font-size: 28px;
      font-weight: 800;
      color: var(--gold, #d29922);
      margin: 16px 0;
    }
    .modal-btn {
      width: 100%;
      padding: 14px;
      border-radius: 14px;
      background: linear-gradient(135deg, var(--primary, #58a6ff), var(--primary2, #3fb950));
      color: #fff;
      border: none;
      font-family: var(--font-b, 'Onest', sans-serif);
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      margin-top: 8px;
      transition: transform 0.15s;
    }
    .modal-btn:active { transform: scale(0.97); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
  `;
  document.head.appendChild(style);
})();

var isOpeningChest = false;

// Выдать сундук
function giveChest(type) {
  if (!userProgress.chests) userProgress.chests = [];
  userProgress.chests.push({ type: type || 'daily', rewardType: 'xp' });
  saveProgress();
}

// Случайная награда из пула
function getRandomReward() {
  var idx = Math.floor(Math.random() * REWARD_POOL.length);
  return REWARD_POOL[idx];
}

// Открыть сундук (вызывается из UI)
function openChest() {
  if (isOpeningChest) return;
  if (!userProgress.chests || userProgress.chests.length === 0) {
    showToast('🎁 Нет доступных сундуков');
    return;
  }

  isOpeningChest = true;
  var chest = userProgress.chests.shift();
  saveProgress();

  showChestOpeningAnimation(function() {
    var reward = getRandomReward();
    applyReward(reward);
    showRewardModal(reward);
    isOpeningChest = false;
    // Обновляем интерфейс (если открыт профиль, он обновится при закрытии награды)
  });
}

// Анимация открытия сундука
function showChestOpeningAnimation(callback) {
  var container = document.getElementById('modal-container');
  var particlesHtml = '';
  for (var i = 0; i < 12; i++) {
    var angle = (i / 12) * Math.PI * 2;
    var x = Math.cos(angle) * 40 + 'px';
    var y = Math.sin(angle) * 40 + 'px';
    particlesHtml += '<div class="particle" style="--x:' + x + '; --y:' + y + '; animation-delay:' + (i * 0.03) + 's"></div>';
  }

  var html = `
    <div class="modal-overlay" id="chest-opening">
      <div class="modal-card" style="background:transparent; box-shadow:none; border:none;">
        <div class="chest-open-anim">
          <div class="chest-body">🎁</div>
          <div class="chest-lid" id="chestLid"></div>
          ${particlesHtml}
        </div>
        <div style="color:var(--text); margin-top:16px; font-weight:700;">Открываем сундук...</div>
      </div>
    </div>`;

  container.innerHTML = html;

  setTimeout(function() {
    var lid = document.getElementById('chestLid');
    if (lid) lid.classList.add('open');
  }, 400);

  setTimeout(function() {
    container.innerHTML = '';
    if (callback) callback();
  }, 1200);
}

// Применить награду
function applyReward(reward) {
  switch(reward.type) {
    case 'xp':
      addXP(reward.value);
      break;
    case 'streak_day':
      showToast('🎁 +1 день серии (будет доступно позже)');
      break;
    case 'boost_x2':
      userProgress.doubleXPUntil = new Date(Date.now() + reward.duration * 60000).toISOString();
      saveProgress();
      showToast('⚡ Бустер x2 XP активирован на 15 минут!');
      break;
    case 'free_hint':
      userProgress.freeHints = (userProgress.freeHints || 0) + 1;
      saveProgress();
      showToast('💡 Бесплатная подсказка доступна!');
      break;
    case 'badge':
      if (!userProgress.rareBadges) userProgress.rareBadges = [];
      userProgress.rareBadges.push(reward.id);
      saveProgress();
      showToast('🏅 Получен редкий бейдж!');
      break;
    default: break;
  }
}

// Показать модальное окно с наградой
function showRewardModal(reward) {
  var container = document.getElementById('modal-container');
  var html = `
    <div class="modal-overlay" id="reward-modal">
      <div class="modal-card">
        <div class="modal-title">🎉 Поздравляем!</div>
        <div class="modal-sub">Ты получил:</div>
        <div class="modal-reward">${reward.label}</div>
        <button class="modal-btn" onclick="closeRewardModal()">Продолжить обучение</button>
      </div>
    </div>`;
  container.innerHTML = html;
}

// Закрыть модальное окно награды и обновить профиль
function closeRewardModal() {
  document.getElementById('modal-container').innerHTML = '';
  // Обновляем профиль, если он сейчас открыт
  var profileScreen = document.getElementById('s-profile');
  if (profileScreen && profileScreen.classList.contains('active')) {
    renderProfile();
  }
}