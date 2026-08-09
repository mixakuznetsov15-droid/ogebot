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

# ═══════════════════════════════════════════
#  НАСТРОЙКИ
# ═══════════════════════════════════════════
BOT_TOKEN = os.getenv("BOT_TOKEN")
ADMIN_ID = int(os.getenv("ADMIN_ID", "0"))
WEBAPP_URL = os.getenv("WEBAPP_URL", "http://localhost:8080")

Configuration.account_id = os.getenv('YOOKASSA_SHOP_ID')
Configuration.secret_key = os.getenv('YOOKASSA_SECRET_KEY')

bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
storage = MemoryStorage()
dp = Dispatcher(storage=storage)
scheduler = AsyncIOScheduler()

# ═══════════════════════════════════════════
#  ХРАНИЛИЩЕ ПОЛЬЗОВАТЕЛЕЙ
# ═══════════════════════════════════════════
DB_FILE = "users_db.json"

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
#  /start
# ═══════════════════════════════════════════
@dp.message(CommandStart())
async def cmd_start(message: Message, state: FSMContext):
    user = get_user(message.from_user.id)
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
    except:
        pass
    await message.delete()

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
#  ПЛАТЕЖИ
# ═══════════════════════════════════════════
TARIFFS = {
    "1m": {"label": "1 месяц", "price": 349, "days": 30},
    "3m": {"label": "3 месяца", "price": 899, "days": 90},
    "full": {"label": "До ОГЭ (выгодно)", "price": 1490, "days": 240},
}

@dp.message(Command("subscribe"))
async def cmd_subscribe(message: Message):
    await show_tariffs(message)

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
    tariff = TARIFFS[tariff_key]
    user_id = call.from_user.id

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

    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="💳 Перейти к оплате", url=payment.confirmation.confirmation_url)],
        [InlineKeyboardButton(text="✅ Я оплатил", callback_data=f"check_{payment.id}")],
    ])
    await call.message.edit_text(
        f"Тариф: <b>{tariff['label']}</b>\nСумма: <b>{tariff['price']}₽</b>\n\n"
        f"Нажми кнопку ниже для оплаты, потом вернись и нажми «Я оплатил»",
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
    else:
        await call.answer("⏳ Оплата ещё не прошла, попробуй через минуту", show_alert=True)

# ═══════════════════════════════════════════
#  НАПОМИНАНИЯ (планировщик)
# ═══════════════════════════════════════════
async def check_and_send_reminders():
    db = load_db()
    now = datetime.now()

    for uid, user in db.items():
        if user["onboarding_step"] != "completed":
            continue

        user_id = user["user_id"]
        status = get_subscription_status(user)
        last_active = datetime.fromisoformat(user["last_active"]) if user.get("last_active") else None
        hours_inactive = (now - last_active).total_seconds() / 3600 if last_active else 999

        last_reminder = user.get("last_reminder_date")
        today_str = now.strftime("%Y-%m-%d")
        if last_reminder == today_str:
            continue

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
                print(f"Не удалось отправить напоминание {user_id}: {e}")

scheduler.add_job(check_and_send_reminders, "interval", hours=1)

@dp.message(Command("status"))
async def cmd_status(message: Message):
    user = get_user(message.from_user.id)
    status = get_subscription_status(user)
    status_text = {"trial": "🎁 Пробный период", "active": "✅ Активная подписка", "expired": "⚠️ Доступ истёк"}
    await message.answer(f"Твой статус: {status_text.get(status, 'неизвестно')}")

# ═══════════════════════════════════════════
#  ЗАПУСК
# ═══════════════════════════════════════════
async def main():
    scheduler.start()
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
