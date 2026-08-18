import asyncio
import os
import json
from datetime import datetime, timedelta
import uuid

from aiogram import Bot, Dispatcher, F
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton, ContentType
from aiogram.filters import CommandStart, Command
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from yookassa import Configuration, Payment
from aiohttp import web

# ═══════════════════════════════════════════
#  НАСТРОЙКИ
# ═══════════════════════════════════════════
BOT_TOKEN = os.getenv("BOT_TOKEN")
ADMIN_ID = int(os.getenv("ADMIN_ID", "0"))
WEBAPP_URL = os.getenv("WEBAPP_URL", "http://localhost:8080")
PORT = int(os.getenv("PORT", "8080"))

Configuration.account_id = os.getenv('YOOKASSA_SHOP_ID')
Configuration.secret_key = os.getenv('YOOKASSA_SECRET_KEY')

bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
storage = MemoryStorage()
dp = Dispatcher(storage=storage)
scheduler = AsyncIOScheduler()

# ═══════════════════════════════════════════
#  ВРЕМЕННЫЕ КОНСТАНТЫ (Патч 1)
# ═══════════════════════════════════════════
MOSCOW_TZ_OFFSET = timedelta(hours=3)  # UTC+3
QUIET_HOURS_START = 22  # с 22:00 не слать
QUIET_HOURS_END = 9     # до 9:00 не слать

def is_quiet_hours() -> bool:
    """Проверяет, сейчас ли тихие часы по московскому времени"""
    utc_now = datetime.utcnow()
    moscow_now = utc_now + MOSCOW_TZ_OFFSET
    hour = moscow_now.hour
    return hour >= QUIET_HOURS_START or hour < QUIET_HOURS_END

# ═══════════════════════════════════════════
#  ХРАНИЛИЩЕ ПОЛЬЗОВАТЕЛЕЙ
# ═══════════════════════════════════════════
DB_FILE = "/data/users_db.json"  # постоянное хранилище Amvera

def load_db():
    if os.path.exists(DB_FILE):
        with open(DB_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_db(db):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False, indent=2)

def get_user(user_id: int) -> dict:
    db = load_db()
    uid = str(user_id)
    if uid not in db:
        db[uid] = {
            "user_id": user_id,
            "first_name": "",
            "oge_date": None,
            "trial_start": None,
            "trial_end": None,
            "subscription_until": None,
            "last_active": None,
            "onboarding_step": "start"
        }
        save_db(db)
    return db[uid]

def update_user(user_id: int, **kwargs):
    db = load_db()
    uid = str(user_id)
    if uid not in db:
        get_user(user_id)
        db = load_db()
    db[uid].update(kwargs)
    save_db(db)

# ═══════════════════════════════════════════
#  FSM
# ═══════════════════════════════════════════
class Onboarding(StatesGroup):
    waiting_for_oge_year = State()

# ═══════════════════════════════════════════
#  /start — обрабатывает deep-link и онбординг
# ═══════════════════════════════════════════
@dp.message(CommandStart())
async def cmd_start(message: Message, state: FSMContext):
    user = get_user(message.from_user.id)

    # Проверяем deep-link параметр вида /start buy_1m
    args = message.text.split(maxsplit=1)
    if len(args) > 1 and args[1].startswith("buy_"):
        tariff_key = args[1].replace("buy_", "")
        if tariff_key in TARIFFS:
            await start_payment(message, tariff_key)
            return

    name = message.from_user.first_name
    if user["onboarding_step"] == "completed":
        await send_app_menu(message)
        return

    update_user(message.from_user.id, first_name=name)

    text = (
        f"👋 Привет, <b>{name}</b>!\n\n"
        f"🗺 Я — Профессор Гео, твой AI-репетитор по географии.\n\n"
        f"Помогу подготовиться к ОГЭ так, чтобы было понятно и не скучно.\n\n"
        f"Для начала — скажи, в каком году у тебя ОГЭ?"
    )
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="2026", callback_data="oge_year_2026")],
        [InlineKeyboardButton(text="2027", callback_data="oge_year_2027")],
        [InlineKeyboardButton(text="2028", callback_data="oge_year_2028")],
    ])
    await message.answer(text, reply_markup=kb)
    update_user(message.from_user.id, onboarding_step="waiting_oge_year")

@dp.callback_query(F.data.startswith("oge_year_"))
async def cb_oge_year(call: CallbackQuery):
    year = call.data.replace("oge_year_", "")
    oge_date = f"{year}-06-19"

    now = datetime.now()
    trial_end = now + timedelta(days=7)

    update_user(
        call.from_user.id,
        oge_date=oge_date,
        trial_start=now.isoformat(),
        trial_end=trial_end.isoformat(),
        onboarding_step="completed",
        last_active=now.isoformat()
    )

    text = (
        f"Отлично! Настроил план подготовки под {year} год.\n\n"
        f"🎁 Дарю тебе <b>7 дней бесплатного доступа</b> ко всем темам — "
        f"попробуй, как это работает.\n\n"
        f"Жми кнопку и начинай первую тему 👇"
    )
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🚀 Открыть ГеоПро", web_app={"url": WEBAPP_URL})],
    ])
    await call.message.edit_text(text, reply_markup=kb)

# ═══════════════════════════════════════════
#  Heartbeat через WebApp.sendData
# ═══════════════════════════════════════════
@dp.message(F.content_type == ContentType.WEB_APP_DATA)
async def handle_web_app_data(message: Message):
    try:
        data = json.loads(message.web_app_data.data)
        if data.get('action') == 'heartbeat':
            update_user(message.from_user.id, last_active=datetime.now().isoformat())
        elif data.get('action') == 'subscribe':
            tariff_key = data.get('tariff')
            if tariff_key and tariff_key in TARIFFS:
                await start_payment(message, tariff_key)
            else:
                await show_tariffs(message)
    except:
        pass
    await message.delete()

# ═══════════════════════════════════════════
#  /reset — только для администратора (Патч 3)
# ═══════════════════════════════════════════
@dp.message(Command("reset"))
async def cmd_reset(message: Message):
    if message.from_user.id != ADMIN_ID:
        await message.answer("Команда недоступна.")
        return

    args = message.text.split(maxsplit=1)
    if len(args) < 2:
        await message.answer("Использование: /reset USER_ID")
        return

    target_id = args[1].strip()
    db = load_db()
    if target_id in db:
        del db[target_id]
        save_db(db)
        await message.answer(f"♻️ Пользователь {target_id} сброшен.")
    else:
        await message.answer("Пользователь не найден.")

# ═══════════════════════════════════════════
#  Вспомогательные функции
# ═══════════════════════════════════════════
async def send_app_menu(message: Message):
    user = get_user(message.from_user.id)
    status = get_subscription_status(user)

    if status == "trial":
        trial_end = datetime.fromisoformat(user["trial_end"])
        days_left = max(0, (trial_end - datetime.now()).days)
        sub_text = f"🎁 Пробный период: осталось {days_left} дн."
    elif status == "active":
        sub_end = datetime.fromisoformat(user["subscription_until"])
        sub_text = f"✅ Подписка активна до {sub_end.strftime('%d.%m.%Y')}"
    else:
        sub_text = "⚠️ Подписка не активна"

    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🚀 Открыть ГеоПро", web_app={"url": WEBAPP_URL})],
        [InlineKeyboardButton(text="💳 Подписка", callback_data="show_tariffs")],
    ])
    await message.answer(f"{sub_text}\n\nПродолжай подготовку 👇", reply_markup=kb)

def get_subscription_status(user: dict) -> str:
    now = datetime.now()
    if user.get("subscription_until"):
        sub_end = datetime.fromisoformat(user["subscription_until"])
        if sub_end > now:
            return "active"
    if user.get("trial_end"):
        trial_end = datetime.fromisoformat(user["trial_end"])
        if trial_end > now:
            return "trial"
    return "expired"

# ═══════════════════════════════════════════
#  ТАРИФЫ И ОПЛАТА
# ═══════════════════════════════════════════
TARIFFS = {
    "1m": {"label": "1 месяц", "price": 499, "days": 30},
    "3m": {"label": "3 месяца", "price": 899, "days": 90},
    "full": {"label": "До ОГЭ (выгодно)", "price": 2990, "days": 240},
}

@dp.message(Command("subscribe"))
async def cmd_subscribe(message: Message):
    await show_tariffs(message)

@dp.callback_query(F.data == "show_tariffs")
async def cb_show_tariffs(call: CallbackQuery):
    await show_tariffs(call.message)

async def show_tariffs(message: Message):
    kb_buttons = []
    for key, t in TARIFFS.items():
        kb_buttons.append([InlineKeyboardButton(
            text=f"{t['label']} — {t['price']}₽",
            callback_data=f"buy_{key}"
        )])
    kb = InlineKeyboardMarkup(inline_keyboard=kb_buttons)
    await message.answer(
        "💳 <b>Выбери тариф</b>\n\n"
        "Полный доступ ко всем темам, финальному боссу и AI-объяснениям.",
        reply_markup=kb
    )

@dp.callback_query(F.data.startswith("buy_"))
async def cb_buy(call: CallbackQuery):
    tariff_key = call.data.replace("buy_", "")
    await start_payment(call.message, tariff_key)

async def start_payment(message: Message, tariff_key: str):
    tariff = TARIFFS[tariff_key]
    user_id = message.from_user.id

    idempotence_key = str(uuid.uuid4())
    payment = Payment.create({
        "amount": {"value": f"{tariff['price']}.00", "currency": "RUB"},
        "confirmation": {
            "type": "redirect",
            "return_url": f"https://t.me/{(await bot.get_me()).username}"
        },
        "capture": True,
        "description": f"ГеоПро — {tariff['label']}",
        "metadata": {"user_id": str(user_id), "tariff": tariff_key, "days": tariff["days"]}
    }, idempotence_key)

    update_user(user_id, pending_payment_id=payment.id, pending_tariff=tariff_key)

    # Основной сценарий — webhook, кнопка "Я оплатил" как fallback
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="💳 Перейти к оплате", url=payment.confirmation.confirmation_url)],
        [InlineKeyboardButton(text="🔄 Я оплатил (если не открылось)", callback_data=f"check_{payment.id}")],
    ])
    await message.answer(
        f"Тариф: <b>{tariff['label']}</b>\nСумма: <b>{tariff['price']}₽</b>\n\n"
        f"Нажми кнопку ниже для оплаты. Доступ откроется автоматически после подтверждения платежа.",
        reply_markup=kb
    )

@dp.callback_query(F.data.startswith("check_"))
async def cb_check_payment(call: CallbackQuery):
    payment_id = call.data.replace("check_", "")
    payment = Payment.find_one(payment_id)

    if payment.status == "succeeded":
        user_id = call.from_user.id
        user = get_user(user_id)
        days = int(payment.metadata.get("days", 30))

        base_date = datetime.now()
        if user.get("trial_end") and not user.get("subscription_until"):
            trial_end = datetime.fromisoformat(user["trial_end"])
            if trial_end > base_date:
                base_date = trial_end

        if user.get("subscription_until"):
            existing_end = datetime.fromisoformat(user["subscription_until"])
            if existing_end > base_date:
                base_date = existing_end

        new_end = base_date + timedelta(days=days)
        update_user(user_id, subscription_until=new_end.isoformat())

        await call.message.edit_text(
            f"🎉 Оплата прошла!\n\n"
            f"Доступ открыт до <b>{new_end.strftime('%d.%m.%Y')}</b>\n\n"
            f"Возвращайся к подготовке 👇"
        )
        kb = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="🚀 Открыть ГеоПро", web_app={"url": WEBAPP_URL})],
        ])
        await call.message.answer("Погнали дальше!", reply_markup=kb)

    elif payment.status == "canceled":
        await call.answer(
            "❌ Платёж отменён. Попробуй оформить подписку заново.",
            show_alert=True
        )
        kb = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="🔄 Выбрать тариф заново", callback_data="show_tariffs")]
        ])
        await call.message.edit_text("Платёж не прошёл. Выбери тариф ещё раз:", reply_markup=kb)

    elif payment.status == "pending":
        await call.answer(
            "⏳ Платёж обрабатывается, подожди немного и нажми снова",
            show_alert=True
        )

    else:
        await call.answer(
            f"Статус платежа: {payment.status}. Обратись в поддержку.",
            show_alert=True
        )

# ═══════════════════════════════════════════
#  НАПОМИНАНИЯ (с учётом тихих часов и защитой от падений)
# ═══════════════════════════════════════════
async def check_and_send_reminders():
    if is_quiet_hours():
        return

    db = load_db()
    now = datetime.utcnow() + MOSCOW_TZ_OFFSET

    for uid, user in db.items():
        try:
            await process_single_user_reminder(user, now)
        except Exception as e:
            print(f"Ошибка обработки напоминания для {uid}: {e}")
            continue

async def process_single_user_reminder(user: dict, now: datetime):
    if user.get("onboarding_step") != "completed":
        return

    user_id = user["user_id"]
    status = get_subscription_status(user)
    last_active = datetime.fromisoformat(user["last_active"]) if user.get("last_active") else None
    hours_inactive = (now - last_active).total_seconds() / 3600 if last_active else 999

    last_reminder = user.get("last_reminder_date")
    today_str = now.strftime("%Y-%m-%d")
    if last_reminder == today_str:
        return

    message_to_send = None

    if status == "trial":
        trial_end = datetime.fromisoformat(user["trial_end"])
        days_left = (trial_end - now).days

        if days_left == 1 and hours_inactive > 12:
            message_to_send = (
                "⏰ Завтра последний день пробного периода!\n\n"
                "Успей пройти ещё пару тем, пока доступ бесплатный."
            )
        elif hours_inactive > 20:
            message_to_send = (
                "📚 Профессор Гео ждёт тебя!\n\n"
                "Загляни в приложение — продолжим подготовку к ОГЭ."
            )

    elif status == "expired":
        message_to_send = (
            "🔓 Твой доступ закончился.\n\n"
            "Не теряй набранный прогресс — оформи подписку и продолжай подготовку.\n\n"
            "/subscribe — посмотреть тарифы"
        )

    elif status == "active" and hours_inactive > 20 and hours_inactive < 48:
        message_to_send = (
            "🔥 Не теряй серию дней!\n\n"
            "Зайди сегодня и реши хотя бы один вопрос, чтобы сохранить streak."
        )

    if message_to_send:
        try:
            await bot.send_message(user_id, message_to_send)
            update_user(user_id, last_reminder_date=today_str)
        except Exception as e:
            print(f"Не удалось отправить сообщение {user_id}: {e}")

scheduler.add_job(check_and_send_reminders, "interval", minutes=30)

@dp.message(Command("status"))
async def cmd_status(message: Message):
    user = get_user(message.from_user.id)
    status = get_subscription_status(user)
    status_text = {"trial": "🎁 Пробный период", "active": "✅ Активная подписка", "expired": "⚠️ Доступ истёк"}
    await message.answer(f"Твой статус: {status_text.get(status, 'неизвестно')}")

# ═══════════════════════════════════════════
#  ВЕБ-СЕРВЕР ДЛЯ WEBHOOK ЮKASSA (Патч 5)
# ═══════════════════════════════════════════
async def handle_yookassa_webhook(request):
    try:
        data = await request.json()
        event = data.get("event")
        payment_object = data.get("object", {})

        if event == "payment.succeeded":
            metadata = payment_object.get("metadata", {})
            user_id = int(metadata.get("user_id"))
            days = int(metadata.get("days", 30))

            user = get_user(user_id)
            base_date = datetime.utcnow() + MOSCOW_TZ_OFFSET

            if user.get("subscription_until"):
                existing_end = datetime.fromisoformat(user["subscription_until"])
                if existing_end > base_date:
                    base_date = existing_end
            elif user.get("trial_end"):
                trial_end = datetime.fromisoformat(user["trial_end"])
                if trial_end > base_date:
                    base_date = trial_end

            new_end = base_date + timedelta(days=days)
            update_user(user_id, subscription_until=new_end.isoformat())

            # Автоматически уведомляем пользователя
            await bot.send_message(
                user_id,
                f"🎉 Оплата подтверждена!\n\n"
                f"Доступ открыт до <b>{new_end.strftime('%d.%m.%Y')}</b>\n\n"
                f"Возвращайся к подготовке 👇",
                reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                    [InlineKeyboardButton(text="🚀 Открыть ГеоПро", web_app={"url": WEBAPP_URL})]
                ])
            )

        return web.json_response({"ok": True})
    except Exception as e:
        print(f"Ошибка webhook ЮKassa: {e}")
        return web.json_response({"ok": False}, status=500)

async def start_web_server():
    app = web.Application()
    app.router.add_post("/yookassa-webhook", handle_yookassa_webhook)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', PORT)
    await site.start()
    print(f"Webhook server started on port {PORT}")

# ═══════════════════════════════════════════
#  ЗАПУСК
# ═══════════════════════════════════════════
async def main():
    scheduler.start()
    await asyncio.gather(
        start_web_server(),
        dp.start_polling(bot)
    )

if __name__ == "__main__":
    asyncio.run(main())