// ==========================================
//  СИСТЕМА ПОДПИСКИ (ТРИАЛ + ПЛАТНЫЙ ДОСТУП)
// ==========================================

const Subscription = {
  TRIAL_DAYS: 7,
  PRICE: 500, // руб/мес

  /**
   * Инициализация триала: если нет даты начала, ставим сегодня.
   */
  initTrial() {
    if (!userProgress.trialStartDate) {
      userProgress.trialStartDate = new Date().toISOString().slice(0, 10);
      saveProgress();
    }
  },

  /**
   * Возвращает статус подписки.
   * @returns {{ active: boolean, type: string, daysLeft: number, expired: boolean }}
   */
  getStatus() {
    const today = new Date();
    const trialStart = userProgress.trialStartDate ? new Date(userProgress.trialStartDate) : null;
    const subscriptionEnd = userProgress.subscriptionEndDate ? new Date(userProgress.subscriptionEndDate) : null;

    // Платная подписка
    if (subscriptionEnd && subscriptionEnd > today) {
      const daysLeft = Math.ceil((subscriptionEnd - today) / (1000 * 60 * 60 * 24));
      return { active: true, type: 'paid', daysLeft, expired: false };
    }

    // Триал
    if (trialStart) {
      const trialEnd = new Date(trialStart);
      trialEnd.setDate(trialEnd.getDate() + this.TRIAL_DAYS);
      if (today < trialEnd) {
        const daysLeft = Math.ceil((trialEnd - today) / (1000 * 60 * 60 * 24));
        return { active: true, type: 'trial', daysLeft, expired: false };
      }
    }

    // Нет активной подписки
    return { active: false, type: 'none', daysLeft: 0, expired: true };
  },

  /**
   * Проверка, можно ли пользоваться контентом.
   * @returns {boolean}
   */
  hasAccess() {
    return this.getStatus().active;
  },

  /**
   * Активировать платную подписку (заглушка).
   * В будущем здесь будет вызов Telegram Payments.
   */
  async activateSubscription() {
    // Заглушка: "оплата" на 30 дней
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 30);
    userProgress.subscriptionEndDate = endDate.toISOString().slice(0, 10);
    saveProgress();
    return true;
  }
};
