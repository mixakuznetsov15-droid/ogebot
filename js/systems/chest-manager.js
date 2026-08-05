// ==========================================
//  МЕНЕДЖЕР СУНДУКОВ 2.0 (ChestManager)
// ==========================================

const ChestManager = {
  _isOpening: false,
  _ui: null,
  _getProgress: null,
  _saveProgress: null,

  // Таблица наград: для каждого типа сундука — массив с вероятностями
  REWARD_TABLE: {
    daily: [
      { type: 'xp', amount: 20, weight: 50 },
      { type: 'xp', amount: 50, weight: 30 },
      { type: 'gems', amount: 5, weight: 10 },
      { type: 'streakFreeze', weight: 5 },
      { type: 'cosmetic', itemId: 'avatar_frame_silver', weight: 5 }
    ],
    streak: [
      { type: 'xp', amount: 200, weight: 30 },
      { type: 'xp', amount: 500, weight: 20 },
      { type: 'gems', amount: 20, weight: 20 },
      { type: 'booster', duration: 1800000, weight: 10 }, // 30 минут
      { type: 'cosmetic', itemId: 'nickname_color_gold', weight: 20 }
    ],
    achievement: [
      { type: 'xp', amount: 300, weight: 30 },
      { type: 'xp', amount: 1000, weight: 10 },
      { type: 'gems', amount: 50, weight: 30 },
      { type: 'booster', duration: 3600000, weight: 20 }, // 1 час
      { type: 'cosmetic', itemId: 'avatar_frame_gold', weight: 10 }
    ]
  },

  init(deps) {
    this._ui = deps.ui;
    this._getProgress = deps.getProgress;
    this._saveProgress = deps.saveProgress;
    return this;
  },

  giveChest(type) {
    const p = this._getProgress();
    if (!p.chests) p.chests = [];
    p.chests.push(type);
    this._saveProgress();
  },

  async open() {
    if (this._isOpening) {
      this._ui?.onError?.('Сундук уже открывается');
      return null;
    }

    const progress = this._getProgress();
    if (!progress.chests || progress.chests.length === 0) {
      this._ui?.onError?.('Нет доступных сундуков');
      return null;
    }

    this._isOpening = true;
    this._ui?.onOpenStart?.();

    try {
      const chestType = progress.chests.shift();
      const reward = this._getRandomReward(chestType);
      this._validateReward(reward);
      this.applyReward(reward);
      this._saveProgress();
      this._ui?.onReward?.(reward);
      return { type: chestType, reward };
    } catch (err) {
      this._ui?.onError?.(err.message || 'Ошибка открытия сундука');
      return null;
    } finally {
      this._isOpening = false;
      this._ui?.onComplete?.();
    }
  },

  /**
   * Применить награду к прогрессу (можно вызывать отдельно, например, для бустера из магазина)
   * @param {Object} reward - объект награды: { type, amount, duration, itemId, ... }
   */
  applyReward(reward) {
    this._validateReward(reward);
    const p = this._getProgress();
    switch (reward.type) {
      case 'xp':
        if (typeof addXP === 'function') {
          addXP(reward.amount);
        } else {
          p.xp = (p.xp || 0) + reward.amount;
        }
        break;
      case 'gems':
        p.gems = (p.gems || 0) + reward.amount;
        break;
      case 'booster':
        // Если уже есть активный бустер, перезаписываем (можно изменить на продление)
        p.boosters = {
          type: 'xp2',
          expires: Date.now() + reward.duration
        };
        break;
      case 'streakFreeze':
        p.freezes = (p.freezes || 0) + 1;
        break;
      case 'cosmetic':
        if (!p.inventory) p.inventory = [];
        p.inventory.push(reward.itemId);
        break;
      default:
        console.warn('Неизвестный тип награды:', reward.type);
    }
  },

  // Приватный метод: выбор награды по весам
  _getRandomReward(chestType) {
    const rewards = this.REWARD_TABLE[chestType];
    if (!rewards || rewards.length === 0) {
      return { type: 'xp', amount: 20 }; // fallback
    }
    const totalWeight = rewards.reduce((sum, r) => sum + r.weight, 0);
    let random = Math.random() * totalWeight;
    for (const reward of rewards) {
      if (random < reward.weight) {
        return { ...reward }; // копия объекта
      }
      random -= reward.weight;
    }
    // На случай погрешности — последний элемент
    return { ...rewards[rewards.length - 1] };
  },

  _validateReward(reward) {
    if (!reward || typeof reward.type !== 'string') {
      throw new Error('Некорректная награда');
    }
    const allowedTypes = ['xp', 'gems', 'booster', 'streakFreeze', 'cosmetic'];
    if (!allowedTypes.includes(reward.type)) {
      throw new Error(`Неизвестный тип награды: ${reward.type}`);
    }
    if (reward.type === 'xp' || reward.type === 'gems') {
      if (typeof reward.amount !== 'number' || reward.amount <= 0) {
        throw new Error('Сумма награды должна быть положительным числом');
      }
    }
    if (reward.type === 'booster') {
      if (!reward.duration || reward.duration <= 0) {
        throw new Error('Некорректная длительность бустера');
      }
    }
    if (reward.type === 'cosmetic') {
      if (!reward.itemId || typeof reward.itemId !== 'string') {
        throw new Error('Некорректный идентификатор косметического предмета');
      }
    }
  }
};