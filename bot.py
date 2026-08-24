import asyncio
import os
import json
from datetime import datetime, timedelta
import uuid

from aiogram import Bot, Dispatcher, F
from aiogram.types import (
    Message,
    CallbackQuery,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    ReplyKeyboardMarkup,
    KeyboardButton,
    ContentType,
    BotCommand,
)
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
#  ВРЕМЕННЫЕ КОНСТАНТЫ
# ═══════════════════════════════════════════
MOSCOW_TZ_OFFSET = timedelta(hours=3)
QUIET_HOURS_START = 22
QUIET_HOURS_END = 9

def is_quiet_hours() -> bool:
    utc_now = datetime.utcnow()
    moscow_now = utc_now + MOSCOW_TZ_OFFSET
    hour = moscow_now.hour
    return hour >= QUIET_HOURS_START or hour < QUIET_HOURS_END

# ═══════════════════════════════════════════
#  ФУНКЦИЯ УВЕДОМЛЕНИЯ АДМИНИСТРАТОРА
# ═══════════════════════════════════════════
async def notify_admin(text: str):
    """Отправляет сообщение администратору, если ADMIN_ID задан."""
    if not ADMIN_ID:
        return
    try:
        await bot.send_message(ADMIN_ID, text)
    except Exception as e:
        print(f"Ошибка отправки уведомления админу: {e}")

# ═══════════════════════════════════════════
#  ХРАНИЛИЩЕ ПОЛЬЗОВАТЕЛЕЙ
# ═══════════════════════════════════════════
DB_FILE = "/data/users_db.json"

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
            "onboarding_step": "start",
            "receipt_email": None,
            "created_at": datetime.now().isoformat(),
            "is_new": True          # ← флаг для уведомления о новом пользователе
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

class PaymentFlow(StatesGroup):
    waiting_for_email = State()

# ═══════════════════════════════════════════
#  /start — обрабатывает deep-link и онбординг
# ═══════════════════════════════════════════
@dp.message(CommandStart())
async def cmd_start(message: Message, state: FSMContext):
    user = get_user(message.from_user.id)

    # Уведомление о новом пользователе (первый запуск)
    if user.get("is_new"):
        await notify_admin(
            f"👤 <b>Новый пользователь</b>\n"
            f"Имя: {message.from_user.first_name}\n"
            f"ID: <code>{message.from_user.id}</code>\n"
            f"Время: {datetime.now().strftime('%d.%m.%Y %H:%M')}"
        )
        update_user(message.from_user.id, is_new=False)

    # Проверяем deep-link параметр вида /start buy_1m
    args = message.text.split(maxsplit=1)
    if len(args) > 1 and args[1].startswith("buy_"):
        tariff_key = args[1].replace("buy_", "")
        if tariff_key in TARIFFS:
            await start_payment_from_key(message, tariff_key)
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
    trial_end = now + timedelta(days=3)   # ← 3 дня триала

    update_user(
        call.from_user.id,
        oge_date=oge_date,
        trial_start=now.isoformat(),
        trial_end=trial_end.isoformat(),
        onboarding_step="completed",
        last_active=now.isoformat()
    )

    # Уведомление админа об активации триала
    await notify_admin(
        f"🎁 <b>Активирован триал</b>\n"
        f"Имя: {call.from_user.first_name}\n"
        f"ID: <code>{call.from_user.id}</code>\n"
        f"ОГЭ: {year}\n"
        f"Триал до: {trial_end.strftime('%d.%m.%Y')}"
    )

    text = (
        f"Отлично! Настроил план подготовки под {year} год.\n\n"
        f"🎁 Дарю тебе <b>3 дня бесплатного доступа</b> ко всем темам — "
        f"попробуй, как это работает.\n\n"
        f"Жми кнопку и начинай первую тему 👇"
    )

    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🚀 Открыть ГеоПро", web_app={"url": WEBAPP_URL})],
    ])
    await call.message.edit_text(text, reply_markup=kb)
    await set_reply_keyboard(call.message)

# ═══════════════════════════════════════════
#  КЛАВИАТУРА
# ═══════════════════════════════════════════
async def set_reply_keyboard(message: Message):
    kb = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="🚀 Открыть ГеоПро", web_app={"url": WEBAPP_URL})],
            [KeyboardButton(text="💳 Подписка"), KeyboardButton(text="📊 Статус")],
            [KeyboardButton(text="❓ Помощь")]
        ],
        resize_keyboard=True,
        one_time_keyboard=False
    )
    await message.answer("Используй кнопки ниже для навигации:", reply_markup=kb)

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
                await start_payment_from_key(message, tariff_key)
            else:
                await show_tariffs(message)
    except:
        pass
    await message.delete()

# ═══════════════════════════════════════════
#  /reset — админ-сброс
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
#  /stats — статистика (только админ)
# ═══════════════════════════════════════════
@dp.message(Command("stats"))
async def cmd_stats(message: Message):
    if message.from_user.id != ADMIN_ID:
        await message.answer("Команда недоступна.")
        return
    stats_text = get_stats_text()
    await message.answer(stats_text)

def get_stats_text() -> str:
    db = load_db()
    total_users = len(db)
    trial_activated = 0
    active_trial = 0
    active_sub = 0
    onboarded = 0
    active_24h = 0

    now = datetime.now()
    last_24h = now - timedelta(hours=24)

    users_info = []
    for uid, user in db.items():
        if user.get("trial_start"):
            trial_activated += 1
            status = get_subscription_status(user)
            if status == "trial":
                active_trial += 1
            elif status == "active":
                active_sub += 1

        if user.get("onboarding_step") == "completed":
            onboarded += 1

        last_active = user.get("last_active")
        if last_active:
            try:
                last_dt = datetime.fromisoformat(last_active)
                if last_dt > last_24h:
                    active_24h += 1
            except:
                pass

        users_info.append({
            "user_id": user.get("user_id"),
            "first_name": user.get("first_name", "Без имени"),
            "created_at": user.get("created_at", "")
        })

    users_info.sort(key=lambda x: x["created_at"], reverse=True)
    recent = users_info[:5]

    text = (
        "📊 <b>Статистика ГеоПро</b>\n\n"
        f"👥 Всего пользователей: <b>{total_users}</b>\n"
        f"🚀 Активировали триал: <b>{trial_activated}</b>\n"
        f"🎁 Активных триалов: <b>{active_trial}</b>\n"
        f"✅ Активных подписок: <b>{active_sub}</b>\n"
        f"📅 Завершили онбординг: <b>{onboarded}</b>\n"
        f"🕐 Активны за 24 часа: <b>{active_24h}</b>\n"
    )

    if recent:
        text += "\n<b>Последние пользователи:</b>\n"
        for i, u in enumerate(recent, 1):
            created = u["created_at"][:10] if u["created_at"] else "—"
            text += f"{i}. {u['first_name']} (ID: {u['user_id']}) — {created}\n"

    return text

# ═══════════════════════════════════════════
#  КОМАНДЫ АДМИНА: /grant и /revoke
# ═══════════════════════════════════════════
@dp.message(Command("grant"))
async def cmd_grant(message: Message):
    if message.from_user.id != ADMIN_ID:
        await message.answer("Команда недоступна.")
        return

    args = message.text.split()
    if len(args) < 2:
        await message.answer("Использование: /grant USER_ID [DAYS]\nПо умолчанию выдаётся 3650 дней (10 лет).")
        return

    try:
        target_id = int(args[1])
        days = int(args[2]) if len(args) > 2 else 3650
    except ValueError:
        await message.answer("❌ Неверный формат. Используйте: /grant USER_ID [DAYS]")
        return

    new_end = datetime.now() + timedelta(days=days)
    update_user(target_id, subscription_until=new_end.isoformat())
    await message.answer(f"✅ Доступ для пользователя <code>{target_id}</code> выдан до <b>{new_end.strftime('%d.%m.%Y')}</b>.")

@dp.message(Command("revoke"))
async def cmd_revoke(message: Message):
    if message.from_user.id != ADMIN_ID:
        await message.answer("Команда недоступна.")
        return

    args = message.text.split()
    if len(args) < 2:
        await message.answer("Использование: /revoke USER_ID")
        return

    try:
        target_id = int(args[1])
    except ValueError:
        await message.answer("❌ Неверный формат USER_ID.")
        return

    update_user(target_id, subscription_until=None)
    await message.answer(f"🔒 Доступ для пользователя <code>{target_id}</code> отозван.")

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
    await set_reply_keyboard(message)

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
    "1m": {"label": "1 месяц", "price": 590, "days": 30},
    "3m": {"label": "3 месяца", "price": 1290, "days": 90},
    "full": {"label": "Навсегда до экзамена", "price": 1990, "days": 240},
}

@dp.message(Command("subscribe"))
async def cmd_subscribe(message: Message):
    await show_tariffs(message)

@dp.message(F.text == "💳 Подписка")
async def cmd_subscribe_text(message: Message):
    await show_tariffs(message)

@dp.message(F.text == "📊 Статус")
async def cmd_status_text(message: Message):
    user = get_user(message.from_user.id)
    status = get_subscription_status(user)
    status_text = {"trial": "🎁 Пробный период", "active": "✅ Активная подписка", "expired": "⚠️ Доступ истёк"}
    await message.answer(f"Твой статус: {status_text.get(status, 'неизвестно')}")

@dp.message(F.text == "❓ Помощь")
async def cmd_help_text(message: Message):
    help_text = (
        "Что я умею:\n\n"
        "• 🚀 Открыть ГеоПро – запустить тренажёр\n"
        "• 💳 Подписка – выбрать тариф и оплатить\n"
        "• 📊 Статус – проверить доступ\n"
        "• /reset – сброс (только администратор)\n\n"
        "По любым вопросам пиши сюда."
    )
    await message.answer(help_text)

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

# ── Обработчик buy_ ──
@dp.callback_query(F.data.startswith("buy_"))
async def cb_buy(call: CallbackQuery, state: FSMContext):
    await call.answer("Обрабатываю...")
    tariff_key = call.data.replace("buy_", "")
    user = get_user(call.from_user.id)

    if user.get("receipt_email"):
        await start_payment(call.message, tariff_key, user["receipt_email"])
        return

    await state.update_data(pending_tariff=tariff_key)
    await state.set_state(PaymentFlow.waiting_for_email)
    await call.message.edit_text(
        "📧 Для оформления чека (по закону РФ) укажи свой email.\n\n"
        "Он нужен только для отправки чека об оплате, никакой рекламы "
        "и рассылок не будет.\n\n"
        "Просто напиши email следующим сообщением:"
    )

@dp.message(PaymentFlow.waiting_for_email)
async def process_email(message: Message, state: FSMContext):
    email = message.text.strip()
    if "@" not in email or "." not in email.split("@")[-1]:
        await message.answer("Похоже, это не email. Попробуй ещё раз.")
        return

    data = await state.get_data()
    tariff_key = data.get("pending_tariff")
    update_user(message.from_user.id, receipt_email=email)
    await state.clear()
    await start_payment(message, tariff_key, email)

# ── Создание платежа с чеком ──
async def start_payment(message: Message, tariff_key: str, email: str):
    tariff = TARIFFS[tariff_key]
    user_id = message.from_user.id

    idempotence_key = str(uuid.uuid4())
    try:
        payment = Payment.create({
            "amount": {
                "value": f"{tariff['price']}.00",
                "currency": "RUB"
            },
            "confirmation": {
                "type": "redirect",
                "return_url": f"https://t.me/{(await bot.get_me()).username}"
            },
            "capture": True,
            "description": f"ГеоПро — {tariff['label']}",
            "metadata": {
                "user_id": str(user_id),
                "tariff": tariff_key,
                "days": tariff["days"]
            },
            "receipt": {
                "customer": {
                    "email": email
                },
                "items": [
                    {
                        "description": f"Доступ к сервису ГеоПро — {tariff['label']}",
                        "quantity": "1.00",
                        "amount": {
                            "value": f"{tariff['price']}.00",
                            "currency": "RUB"
                        },
                        "vat_code": "1",
                        "payment_subject": "service",
                        "payment_mode": "full_payment"
                    }
                ]
            }
        }, idempotence_key)

        update_user(user_id, pending_payment_id=payment.id, pending_tariff=tariff_key)

        kb = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="💳 Перейти к оплате", url=payment.confirmation.confirmation_url)],
            [InlineKeyboardButton(text="✅ Я оплатил", callback_data=f"check_{payment.id}")],
        ])
        await message.answer(
            f"Тариф: <b>{tariff['label']}</b>\nСумма: <b>{tariff['price']}₽</b>\n\n"
            f"Чек придёт на <b>{email}</b>\n\n"
            f"Нажми кнопку ниже для оплаты",
            reply_markup=kb
        )
    except Exception as e:
        print(f"Ошибка создания платежа: {e}")
        await message.answer(
            "⚠️ Не получилось создать платёж. Попробуй ещё раз через минуту "
            "или напиши в поддержку."
        )

# ── Обработчик для deep-link ──
async def start_payment_from_key(message: Message, tariff_key: str):
    user = get_user(message.from_user.id)
    if user.get("receipt_email"):
        await start_payment(message, tariff_key, user["receipt_email"])
    else:
        # Сохраняем tariff_key и переходим в состояние ожидания email
        await message.answer(
            "📧 Для оформления чека укажи свой email.\n"
            "Он нужен только для отправки чека об оплате."
        )
        await dp.storage.set_state(chat=message.chat.id, user=message.from_user.id,
                                   state=PaymentFlow.waiting_for_email)
        await dp.storage.set_data(chat=message.chat.id, user=message.from_user.id,
                                  data={"pending_tariff": tariff_key})

# ═══════════════════════════════════════════
#  ПОДТВЕРЖДЕНИЕ ОПЛАТЫ (check_)
# ═══════════════════════════════════════════
@dp.callback_query(F.data.startswith("check_"))
async def cb_check_payment(call: CallbackQuery):
    payment_id = call.data.replace("check_", "")
    payment = Payment.find_one(payment_id)

    if payment.status == "succeeded":
        user_id = call.from_user.id
        user = get_user(user_id)
        days = int(payment.metadata.get("days", 30))
        tariff_key = payment.metadata.get("tariff", "unknown")

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

        # Уведомление админа об оплате
        await notify_admin(
            f"💳 <b>Оплата подтверждена (кнопка)</b>\n"
            f"Имя: {call.from_user.first_name}\n"
            f"ID: <code>{user_id}</code>\n"
            f"Тариф: {tariff_key} ({days} дн.)\n"
            f"Доступ до: {new_end.strftime('%d.%m.%Y')}"
        )

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
        await call.answer("❌ Платёж отменён. Попробуй оформить подписку заново.", show_alert=True)
        kb = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="🔄 Выбрать тариф заново", callback_data="show_tariffs")]
        ])
        await call.message.edit_text("Платёж не прошёл. Выбери тариф ещё раз:", reply_markup=kb)

    elif payment.status == "pending":
        await call.answer("⏳ Платёж обрабатывается, подожди немного и нажми снова", show_alert=True)

    else:
        await call.answer(f"Статус платежа: {payment.status}. Обратись в поддержку.", show_alert=True)

# ═══════════════════════════════════════════
#  НАПОМИНАНИЯ
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
            message_to_send = "⏰ Завтра последний день пробного периода! Успей пройти ещё пару тем."
        elif hours_inactive > 20:
            message_to_send = "📚 Профессор Гео ждёт тебя! Продолжим подготовку к ОГЭ."
    elif status == "expired":
        message_to_send = "🔓 Твой доступ закончился. Оформи подписку, чтобы продолжить. /subscribe"
    elif status == "active" and hours_inactive > 20 and hours_inactive < 48:
        message_to_send = "🔥 Не теряй серию дней! Зайди сегодня и реши хотя бы один вопрос."

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
#  ВЕБ-СЕРВЕР ДЛЯ WEBHOOK ЮKASSA
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
            tariff_key = metadata.get("tariff", "unknown")

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

            # Уведомление админа об оплате через webhook
            await notify_admin(
                f"💳 <b>Оплата через Webhook</b>\n"
                f"User ID: <code>{user_id}</code>\n"
                f"Имя: {user.get('first_name', '—')}\n"
                f"Тариф: {tariff_key} ({days} дн.)\n"
                f"Доступ до: {new_end.strftime('%d.%m.%Y')}"
            )

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
    await bot.set_my_commands([
        BotCommand(command="start", description="Главное меню"),
        BotCommand(command="subscribe", description="Выбрать тариф и оплатить"),
        BotCommand(command="status", description="Статус подписки"),
        BotCommand(command="help", description="Помощь"),
        BotCommand(command="stats", description="Статистика (только админ)"),
        BotCommand(command="grant", description="Выдать доступ (только админ)"),
        BotCommand(command="revoke", description="Отозвать доступ (только админ)"),
        BotCommand(command="reset", description="Сброс пользователя (только админ)"),
    ])

    scheduler.start()
    await asyncio.gather(
        start_web_server(),
        dp.start_polling(bot)
    )

if __name__ == "__main__":
    asyncio.run(main())