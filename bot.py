import asyncio
import os
from aiogram import Bot, Dispatcher, F
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.filters import CommandStart, Command
from aiogram.enums import ParseMode

BOT_TOKEN = os.getenv("BOT_TOKEN")
ADMIN_ID = int(os.getenv("ADMIN_ID", "0"))
WEBAPP_URL = os.getenv("WEBAPP_URL")  # твоя ссылка на Vercel

bot = Bot(token=BOT_TOKEN, parse_mode=ParseMode.HTML)
dp = Dispatcher()

# — Хранилище доступа (в памяти, для старта достаточно) —
allowed_users: set[int] = set()

# /start
@dp.message(CommandStart())
async def cmd_start(message: Message):
    user_id = message.from_user.id
    name = message.from_user.first_name

    if user_id in allowed_users or user_id == ADMIN_ID:
        await send_app_menu(message)
    else:
        await send_welcome(message, name)

async def send_welcome(message: Message, name: str):
    text = (
        f"Привет, <b>{name}</b>!\n\n"
        f"<b>TeoPro</b> - AI-репетитор для подготовки к ОГЭ по географии.\n\n"
        f"Что внутри:\n"
        f"• 847 заданий по всем темам ОГЭ\n"
        f"• Разбор каждой ошибки с объяснением\n"
        f"• Карта прогресса и геймификация\n"
        f"• AI отвечает на любые вопросы по теме\n\n"
        f"Стоимость: <b>500 руб/месяц</b>\n\n"
        f"Чтобы получить доступ - нажми кнопку ниже"
    )

    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="Получить доступ", callback_data="buy")]
    ])

    await message.answer(text, reply_markup=kb)

async def send_app_menu(message: Message):
    text = (
        f"Добро пожаловать!\n\n"
        f"Твой доступ активен. Нажми кнопку ниже чтобы открыть приложение"
    )

    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="Открыть GeoPro", web_app={"url": WEBAPP_URL})]
    ])

    await message.answer(text, reply_markup=kb)

# Кнопка "Получить доступ"
@dp.callback_query(F.data == "buy")
async def cb_buy(call: CallbackQuery):
    text = (
        f"<b>Оформление доступа</b>\n\n"
        f"Стоимость: <b>500 руб/месяц</b>\n\n"
        f"Переведи на карту:\n"
        f"<code>2200 0000 0000 0000</code> (Сбер, Михаил)\n\n"
        f"В комментарии к переводу укажи свой <b>Telegram ID</b>:\n"
        f"<code>{call.from_user.id}</code>\n\n"
        f"После оплаты нажми кнопку - мы проверим и откроем доступ в течение часа"
    )

    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="Я оплатил", callback_data="paid")],
        [InlineKeyboardButton(text="Назад", callback_data="back")],
    ])

    await call.message.edit_text(text, reply_markup=kb)

# Кнопка "Я оплатил"
@dp.callback_query(F.data == "paid")
async def cb_paid(call: CallbackQuery):
    user = call.from_user

    # Уведомление админу
    await bot.send_message(
        ADMIN_ID,
        f"<b>Новая заявка на оплату!</b>\n\n"
        f"{user.full_name}\n"
        f"ID <code>{user.id}</code>\n"
        f"@{user.username or 'нет username'}\n\n"
        f"<b>Доступ открыт!</b>\n\n"
        f"Нажми /start чтобы войти в приложение"
    )

    try:
        await call.message.edit_text("✅ Заявка отправлена! Администратор проверит оплату и откроет доступ в течение часа.")
    except:
        pass

# Кнопка "Назад"
@dp.callback_query(F.data == "back")
async def cb_back(call: CallbackQuery):
    await cmd_start(call.message)

# Команда для админа: выдать доступ
@dp.message(Command("grant"))
async def cmd_grant(message: Message):
    if message.from_user.id != ADMIN_ID:
        return
    parts = message.text.split()
    if len(parts) < 2:
        await message.answer("Использование: /grant USER_ID")
        return
    uid = int(parts[1])
    allowed_users.add(uid)
    await message.answer(f"Доступ открыт для {uid}")

# Команда для админа: закрыть доступ
@dp.message(Command("revoke"))
async def cmd_revoke(message: Message):
    if message.from_user.id != ADMIN_ID:
        return
    parts = message.text.split()
    if len(parts) < 2:
        await message.answer("Использование: /revoke USER_ID")
        return
    uid = int(parts[1])
    allowed_users.discard(uid)
    await message.answer(f"Доступ закрыт для {uid}")

# Команда для админа: список пользователей
@dp.message(Command("users"))
async def cmd_users(message: Message):
    if message.from_user.id != ADMIN_ID:
        return
    if not allowed_users:
        await message.answer("Пока нет активных пользователей")
        return
    ids = "\n".join(str(u) for u in allowed_users)
    await message.answer(f"Активные пользователи ({len(allowed_users)}):\n{ids}")

# Любое другое сообщение
@dp.message()
async def any_message(message: Message):
    user_id = message.from_user.id
    if user_id in allowed_users or user_id == ADMIN_ID:
        await send_app_menu(message)
    else:
        kb = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="Получить доступ", callback_data="buy")],
            [InlineKeyboardButton(text="Попробовать демо", callback_data="demo")]
        ])
        await message.answer(
            "Привет! Чтобы начать подготовку к ОГЭ – получи доступ",
            reply_markup=kb
        )

# Демо-кнопка (заглушка)
@dp.callback_query(F.data == "demo")
async def cb_demo(call: CallbackQuery):
    await call.answer("Демо-режим скоро появится!", show_alert=True)

async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
