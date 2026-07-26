// ==========================================
//  АНИМАЦИИ
// ==========================================

/**
 * Плавно увеличивает число от 0 до target внутри элемента el
 * за duration миллисекунд (использует easeOutExpo).
 * @param {Element} el - DOM-элемент, в котором меняется textContent
 * @param {number} target - конечное значение
 * @param {number} duration - длительность анимации в мс
 */
function animateNumber(el, target, duration) {
  if (!el || isNaN(target)) return;
  const start = 0;
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // easeOutExpo: плавное замедление в конце
    const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    const current = Math.round(start + (target - start) * eased);
    el.textContent = current;
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = target; // финальное точное значение
    }
  }

  requestAnimationFrame(update);
}