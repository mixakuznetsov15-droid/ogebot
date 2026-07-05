// ==========================================
//  КОНФИГУРАЦИЯ ПРИЛОЖЕНИЯ
// ==========================================

// Прокси для AI-запросов
const PROXY = 'https://yandex-proxy.mixakuznetsov15.workers.dev';

// Базовый путь к файлам с вопросами и теорией
const GITHUB_RAW = 'https://raw.githubusercontent.com/mixakuznetsov15-droid/ogebot/main/theory/';

// Telegram WebApp
const tgApp = window.Telegram?.WebApp;
const isTelegram = !!tgApp && typeof tgApp.initData !== 'undefined';

if (isTelegram) {
  tgApp.ready();
  tgApp.expand();
}