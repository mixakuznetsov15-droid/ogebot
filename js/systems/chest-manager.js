// ==========================================
//  МЕНЕДЖЕР СУНДУКОВ (ChestManager)
// ==========================================

const ChestManager = {
  // Состояние менеджера
  _isOpening: false,          // защита от повторного открытия
  _ui: null,                  // коллбэки для UI
  _getProgress: null,         // функция получения userProgress
  _saveProgress: null,        // функция сохранения

  /**
   * Инициализация менеджера.
   * @param {Object} deps - зависимости
   * @param {Function} deps.getProgress - возвращает актуальный userProgress
   * @param {Function} deps.saveProgress - сохраняет userProgress
   * @param {Object} deps.ui - коллбэки для UI
   * @param {Function} deps.ui.onOpenStart - вызов при старте открытия (для анимации)
   * @param {Function} deps.ui.onReward - вызов, когда награда определена ({ type, amount })
   * @param {Function} deps.ui.onError - вызов при ошибке (message)
   * @param {Function} deps.ui.onComplete - вызов после завершения (успех/неудача)
   */
  init(deps) {
    this._ui = deps.ui;
    this._getProgress = deps.getProgress;
    this._saveProgress = deps.saveProgress;
    return this;
  },

  /**
   * Выдать сундук определённого типа.
   * @param {string} type - 'daily','streak','achievement'
   */
  giveChest(type) {
    const p = this._getProgress();
    if (!p.chests) p.chests = [];
    p.chests.push(type);
    this._saveProgress();
  },

  /**
   * Открыть один сундук (асинхронно).
   * @returns {Promise<{type: string, reward: {type: string, amount: number}}|null>}
   */
  async open() {
    // Защита от гонки состояний
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
    this._ui?.onOpenStart?.();   // запуск анимации открытия

    try {
      // Забираем первый сундук
      const chestType = progress.chests.shift();

      // Определяем награду
      const reward = this._determineReward(chestType);
      this._validateReward(reward);

      // Применяем награду к прогрессу
      this._applyReward(reward);
      this._saveProgress();

      // Сообщаем UI о награде
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
   * Определить награду для типа сундука.
   * @param {string} chestType
   * @returns {{type: string, amount: number}}
   */
  _determineReward(chestType) {
    // Пример таблицы наград (можно расширить)
    const rewards = {
      daily:    [{ type: 'xp', amount: 20 }, { type: 'xp', amount: 50 }],
      streak:   [{ type: 'xp', amount: 100 }, { type: 'xp', amount: 200 }],
      achievement: [{ type: 'xp', amount: 150 }, { type: 'xp', amount: 300 }]
    };

    const pool = rewards[chestType] || [{ type: 'xp', amount: 20 }];
    const reward = pool[Math.floor(Math.random() * pool.length)];
    return { ...reward };  // копия, чтобы не мутировать исходный массив
  },

  /**
   * Валидация награды.
   * @param {Object} reward
   */
  _validateReward(reward) {
    if (!reward || typeof reward.type !== 'string' || typeof reward.amount !== 'number') {
      throw new Error('Некорректная награда');
    }
    if (reward.amount <= 0) {
      throw new Error('Сумма награды должна быть положительной');
    }
    // Можно добавить проверки на допустимые типы
    const allowedTypes = ['xp', 'freeze', 'cosmetic'];
    if (!allowedTypes.includes(reward.type)) {
      throw new Error(`Неизвестный тип награды: ${reward.type}`);
    }
  },

  /**
   * Применить награду к прогрессу.
   * @param {Object} reward
   */
  _applyReward(reward) {
    const p = this._getProgress();
    switch (reward.type) {
      case 'xp':
        // Используем глобальную addXP, она обновит уровень и сохранит
        if (typeof addXP === 'function') {
          addXP(reward.amount);
        } else {
          // fallback
          p.xp = (p.xp || 0) + reward.amount;
        }
        break;
      case 'freeze':
        p.freezes = (p.freezes || 0) + reward.amount;
        break;
      // другие типы...
      default:
        console.warn('Неизвестный тип награды:', reward.type);
    }
  }
};