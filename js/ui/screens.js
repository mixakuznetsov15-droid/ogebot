// ==========================================
//  МОДАЛЬНОЕ ОКНО ВЫБОРА ТАРИФА (Paywall)
// ==========================================
function showPaywallModal() {
  var container = document.getElementById('modal-container');
  if (!container) return;
  
  container.innerHTML = `
    <div class="chest-modal-overlay show" onclick="closePaywallModal(event)">
      <div class="chest-modal-card" style="max-width: 360px;" onclick="event.stopPropagation()">
        <div style="text-align:center; margin-bottom: var(--space-4);">
          <div style="font-family:var(--font-h); font-size:var(--text-xl); font-weight:800; color:var(--text); margin-bottom: var(--space-2);">
            Выбери тариф
          </div>
          <div style="font-size:var(--text-sm); color:var(--muted);">
            Полный доступ ко всем темам, финальному боссу и AI-объяснениям.
          </div>
        </div>
        <div style="display:flex; flex-direction:column; gap: var(--space-3);">
          <div class="tariff-card" onclick="selectTariff('1m')">
            <div class="tariff-name">1 месяц</div>
            <div class="tariff-price">499 ₽</div>
            <div class="tariff-desc">Доступ на 30 дней</div>
          </div>
          <div class="tariff-card" onclick="selectTariff('3m')" style="border-color: var(--primary2);">
            <div class="tariff-name">3 месяца</div>
            <div class="tariff-price">899 ₽</div>
            <div class="tariff-desc">Экономия 598 ₽</div>
          </div>
          <div class="tariff-card" onclick="selectTariff('full')">
            <div class="tariff-name">До ОГЭ</div>
            <div class="tariff-price">2990 ₽</div>
            <div class="tariff-desc">Доступ до экзамена (240 дней)</div>
          </div>
        </div>
        <button class="btn-ghost" style="margin-top: var(--space-4); width: 100%;" onclick="closePaywallModal()">Отмена</button>
      </div>
    </div>`;
}

function closePaywallModal(event) {
  if (event && event.target !== event.currentTarget) return;
  var container = document.getElementById('modal-container');
  if (container) container.innerHTML = '';
}

function selectTariff(tariffKey) {
  var container = document.getElementById('modal-container');
  if (container) container.innerHTML = '';
  
  // Открываем бота с deep-link параметром
  if (isTelegram && tgApp && tgApp.openTelegramLink) {
    tgApp.openTelegramLink('https://t.me/TestOgeEge_bot?start=buy_' + tariffKey);
  } else {
    // Для браузера или если Telegram API не доступен
    window.open('https://t.me/TestOgeEge_bot?start=buy_' + tariffKey, '_blank');
  }
}
