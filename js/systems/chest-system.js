// ==========================================
//  СИСТЕМА СУНДУКОВ
// ==========================================

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
  if (!userProgress.chests || userProgress.chests.length === 0) return;

  isOpeningChest = true;
  var chest = userProgress.chests.shift();
  saveProgress();

  showChestOpeningAnimation(function() {
    var reward = getRandomReward();
    applyReward(reward);
    showRewardModal(reward);
    isOpeningChest = false;
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
  renderProfile();
}