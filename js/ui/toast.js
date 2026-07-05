// ==========================================
//  ВСПЛЫВАЮЩИЕ УВЕДОМЛЕНИЯ (TOAST)
// ==========================================

// Обычное уведомление (например, о награде)
function showToast(msg) {
  var toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.cssText = 'position:fixed;top:80px;right:16px;background:var(--gold);color:#000;padding:8px 16px;border-radius:20px;font-weight:700;font-size:13px;z-index:999;animation: fadeUp .3s ease;';
  document.body.appendChild(toast);
  setTimeout(function() { toast.remove(); }, 2000);
}

// Уведомление о получении опыта (стилизовано иначе)
function showXPToast(amount) {
  var toast = document.createElement('div');
  toast.textContent = amount ? '+' + amount + ' XP ⚡' : '✅ Выполнено';
  toast.style.cssText = 'position:fixed;top:80px;right:16px;background:linear-gradient(135deg,#58a6ff,#3fb950);color:#fff;padding:8px 16px;border-radius:20px;font-weight:700;font-size:13px;z-index:999;animation: fadeUp .3s ease;';
  document.body.appendChild(toast);
  setTimeout(function() { toast.remove(); }, 2000);
}