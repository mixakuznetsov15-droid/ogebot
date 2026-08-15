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
    if (!userProgress.trial_start) {
      userProgress.trial_start = new Date().toISOString().slice(0, 10);
      saveProgress();
    }
  },

  /**
   * Возвращает статус подписки.
   * Синхронизирует с полями из bot.py: subscription_until, trial_end
   * @returns {{ active: boolean, type: string, daysLeft: number, expired: boolean }}
   */
  getStatus() {
    const today = new Date();
    const trialEnd = userProgress.trial_end ? new Date(userProgress.trial_end) : null;
    const subscriptionEnd = userProgress.subscription_until ? new Date(userProgress.subscription_until) : null;

    // Платная подписка (приоритет выше, чем триал)
    if (subscriptionEnd && subscriptionEnd > today) {
      const daysLeft = Math.ceil((subscriptionEnd - today) / (1000 * 60 * 60 * 24));
      return { active: true, type: 'paid', daysLeft, expired: false };
    }

    // Триал
    if (trialEnd && trialEnd > today) {
      const daysLeft = Math.ceil((trialEnd - today) / (1000 * 60 * 60 * 24));
      return { active: true, type: 'trial', daysLeft, expired: false };
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
   * Получить количество дней, осталось до конца подписки
   * @returns {number}
   */
  getDaysLeft() {
    return this.getStatus().daysLeft;
  },

  /**
   * Получить тип подписки ('trial', 'paid', 'none')
   * @returns {string}
   */
  getType() {
    return this.getStatus().type;
  },

  /**
   * Получить дату конца подписки (для отображения)
   * @returns {string}
   */
  getEndDate() {
    const status = this.getStatus();
    if (status.type === 'paid' && userProgress.subscription_until) {
      return userProgress.subscription_until;
    }
    if (status.type === 'trial' && userProgress.trial_end) {
      return userProgress.trial_end;
    }
    return null;
  }
};
