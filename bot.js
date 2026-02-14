const TelegramBot = require('node-telegram-bot-api');
const TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;
const bot = new TelegramBot(TOKEN, { polling: true });

const orders = {};
const reviews = [];

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, '🛍 Добро пожаловать в NEGRAMENT STORE!', {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🛍 Открыть магазин', web_app: { url: 'https://tg-shop-sigma.vercel.app' } }],
                [{ text: '📋 Мои заказы', callback_data: 'my_orders' }],
                [{ text: '⭐ Отзывы', callback_data: 'show_reviews' }]
            ]
        }
    });
});

bot.on('web_app_data', (msg) => {
    console.log('📦 Данные из магазина:', msg.web_app_data.data);
    try {
        const data = JSON.parse(msg.web_app_data.data);
        const { game, item, price, userId } = data;
        const userIdInput = userId || 'не указан';
        const tgUserId = msg.from.id;
        const username = msg.from.username || 'нет_юзернейма';
        const orderId = Date.now().toString().slice(-6);

        orders[orderId] = {
            tgUserId,
            username,
            userIdInput,
            game,
            item,
            price,
            status: '⏳ Ожидает оплаты',
            createdAt: new Date().toLocaleString('ru-RU')
        };

        bot.sendMessage(ADMIN_ID,
            `🆕 **НОВЫЙ ЗАКАЗ #${orderId}**\n\n` +
            `👤 **Покупатель:** @${username} (ID: ${tgUserId})\n` +
            `📝 **Указал:** ${userIdInput}\n` +
            `🎮 **Игра:** ${game}\n` +
            `📦 **Товар:** ${item}\n` +
            `💰 **Сумма:** ${price} ₽`,
            { parse_mode: 'Markdown' }
        );

        bot.sendMessage(tgUserId,
            `✅ **ЗАКАЗ #${orderId} ОФОРМЛЕН**\n\n` +
            `🎮 **Игра:** ${game}\n` +
            `📦 **Товар:** ${item}\n` +
            `💰 **Сумма:** ${price} ₽\n` +
            `👤 **Ваш ID:** ${userIdInput}\n\n` +
            `💳 **Реквизиты:** 89324035777 (Озон Банк)\n\n` +
            `📌 **После оплаты нажмите кнопку ниже**`,
            {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[
                        { text: '✅ Я оплатил', callback_data: `paid_${orderId}` }
                    ]]
                }
            }
        );
    } catch (e) {
        console.log('❌ Ошибка:', e.message);
        bot.sendMessage(ADMIN_ID, `❌ Ошибка заказа: ${e.message}`);
    }
});

// ===== ОБРАБОТКА КНОПОК =====
bot.on('callback_query', async (query) => {
    const data = query.data;
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const msgId = query.message.message_id;

    if (data.startsWith('paid_')) {
        const orderId = data.split('_')[1];
        const order = orders[orderId];
        if (!order) return await bot.answerCallbackQuery(query.id, { text: '❌ Не найдено' });
        order.status = '🔄 Проверяется';
        await bot.editMessageText(
            query.message.text + '\n\n✅ Заявка отправлена! Админ проверит оплату.',
            { chat_id: chatId, message_id: msgId, reply_markup: {} }
        );
        await bot.sendMessage(ADMIN_ID,
            `💰 **ЗАЯВКА ОБ ОПЛАТЕ #${orderId}**\n\n` +
            `👤 **Покупатель:** @${order.username}\n` +
            `📝 **Указал:** ${order.userIdInput}\n` +
            `💵 **Сумма:** ${order.price} ₽`,
            {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '✅ Подтвердить', callback_data: `confirm_${orderId}` }],
                        [{ text: '❌ Отменить', callback_data: `cancel_${orderId}` }]
                    ]
                }
            }
        );
        await bot.answerCallbackQuery(query.id, { text: '✅ Заявка отправлена' });
        return;
    }

    if (data.startsWith('confirm_')) {
        const orderId = data.split('_')[1];
        const order = orders[orderId];
        if (!order) return;
        order.status = '✅ Выдан';
        await bot.sendMessage(order.tgUserId,
            `✅ **ОПЛАЧЕНО И ПОДТВЕРЖДЕНО #${orderId}**\n\n` +
            `📊 **Статус:** ✅ Выдан\n` +
            `🎮 **Товар:** ${order.game}\n` +
            `📦 **${order.item}**\n` +
            `👤 **Ваш ID:** ${order.userIdInput}\n\n` +
            `🔹 Товар выдан! Спасибо за покупку! 🎮\n\n` +
            `✏️ Оставьте отзыв:`,
            {
                reply_markup: {
                    inline_keyboard: [[
                        { text: '⭐ Написать отзыв', callback_data: `write_review_${orderId}` }
                    ]]
                }
            }
        );
        await bot.editMessageText(
            query.message.text + '\n\n✅ Товар выдан',
            { chat_id: query.message.chat.id, message_id: msgId, reply_markup: {} }
        );
        await bot.answerCallbackQuery(query.id, { text: '✅ Подтверждено' });
        return;
    }

    if (data.startsWith('cancel_')) {
        const orderId = data.split('_')[1];
        const order = orders[orderId];
        if (!order) return;
        order.status = '❌ Отменён';
        await bot.sendMessage(order.tgUserId, `❌ **ЗАКАЗ #${orderId} ОТМЕНЁН**\n\nПлатёж не подтверждён.`);
        await bot.editMessageText(
            query.message.text + '\n\n❌ Заказ отменён',
            { chat_id: query.message.chat.id, message_id: msgId, reply_markup: {} }
        );
        await bot.answerCallbackQuery(query.id, { text: '❌ Отменён' });
        return;
    }

    if (data.startsWith('write_review_')) {
        const orderId = data.split('_')[2];
        const order = orders[orderId];
        if (!order || order.tgUserId != userId) return;
        await bot.sendMessage(chatId,
            `✏️ **НАПИШИТЕ ОТЗЫВ**\n\n` +
            `🎮 **Игра:** ${order.game}\n` +
            `📦 **Товар:** ${order.item}\n` +
            `👤 **Ваш ID:** ${order.userIdInput}\n\n` +
            `📝 Отправьте текст отзыва одним сообщением.\n` +
            `❌ Отмена: /cancel_review`,
            { parse_mode: 'Markdown' }
        );
        bot.reviewState = { userId, orderId, game: order.game, userIdInput: order.userIdInput };
        await bot.answerCallbackQuery(query.id);
        return;
    }

    if (data === 'my_orders') {
        const userOrders = Object.entries(orders)
            .filter(([_, o]) => o.tgUserId == userId)
            .sort((a, b) => b[0] - a[0])
            .slice(0, 10);
        if (userOrders.length === 0) {
            await bot.sendMessage(chatId, '📋 У вас пока нет заказов');
        } else {
            let text = '📋 **ИСТОРИЯ ЗАКАЗОВ**\n\n';
            userOrders.forEach(([id, o]) => {
                text += `🔹 **#${id}**\n` +
                        `🎮 ${o.game}\n` +
                        `📦 ${o.item}\n` +
                        `💰 ${o.price} ₽\n` +
                        `📊 Статус: ${o.status}\n` +
                        `🕐 ${o.createdAt.split(',')[0]}\n\n`;
            });
            await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
        }
        await bot.answerCallbackQuery(query.id);
        return;
    }

    if (data === 'show_reviews') {
        if (reviews.length === 0) {
            await bot.sendMessage(chatId, '⭐ Пока нет отзывов');
        } else {
            let text = '⭐ **ОТЗЫВЫ ПОКУПАТЕЛЕЙ** ⭐\n\n';
            reviews.slice(-10).reverse().forEach((r, i) => {
                text += `**${i+1}. ${r.username}**\n` +
                        `🎮 ${r.game}\n` +
                        `"${r.text}"\n` +
                        `🕐 ${r.date.split(',')[0]}\n\n`;
            });
            await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
        }
        await bot.answerCallbackQuery(query.id);
        return;
    }
});

bot.on('message', (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;
    if (bot.reviewState && bot.reviewState.userId === msg.from.id) {
        const review = {
            username: msg.from.username || 'Аноним',
            game: bot.reviewState.game,
            userIdInput: bot.reviewState.userIdInput,
            text: msg.text,
            date: new Date().toLocaleString('ru-RU')
        };
        reviews.push(review);
        bot.sendMessage(msg.chat.id, '✅ Спасибо, отзыв опубликован!');
        bot.sendMessage(ADMIN_ID,
            `⭐ **НОВЫЙ ОТЗЫВ**\n\n` +
            `👤 **${review.username}**\n` +
            `🎮 **${review.game}**\n` +
            `📝 "${review.text}"\n` +
            `👤 **Указал:** ${review.userIdInput}`
        );
        bot.reviewState = null;
    }
});

bot.onText(/\/order (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const orderId = match[1];
    const order = orders[orderId];
    if (!order) return bot.sendMessage(chatId, '❌ Заказ не найден');
    if (msg.from.id != order.tgUserId && msg.from.id != ADMIN_ID)
        return bot.sendMessage(chatId, '❌ У вас нет прав');
    bot.sendMessage(chatId,
        `📋 **ЗАКАЗ #${orderId}**\n\n` +
        `🎮 **Игра:** ${order.game}\n` +
        `📦 **Товар:** ${order.item}\n` +
        `👤 **Указал:** ${order.userIdInput}\n` +
        `💰 **Сумма:** ${order.price} ₽\n` +
        `📊 **Статус:** ${order.status}\n` +
        `🕐 **Создан:** ${order.createdAt}`,
        { parse_mode: 'Markdown' }
    );
});

bot.onText(/\/reviews/, (msg) => {
    if (reviews.length === 0) return bot.sendMessage(msg.chat.id, '⭐ Пока нет отзывов');
    let text = '⭐ **ВСЕ ОТЗЫВЫ** ⭐\n\n';
    reviews.slice(-10).reverse().forEach((r, i) => {
        text += `**${i+1}. ${r.username}**\n` +
                `🎮 ${r.game}\n` +
                `"${r.text}"\n` +
                `🕐 ${r.date.split(',')[0]}\n\n`;
    });
    bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
});

bot.onText(/\/orders/, (msg) => {
    if (msg.from.id != ADMIN_ID) return;
    const allOrders = Object.entries(orders).sort((a, b) => b[0] - a[0]).slice(0, 20);
    if (allOrders.length === 0) return bot.sendMessage(msg.chat.id, '📋 Нет заказов');
    let text = '📋 **ПОСЛЕДНИЕ ЗАКАЗЫ**\n\n';
    allOrders.forEach(([id, o]) => {
        text += `🔹 **#${id}**\n👤 @${o.username}\n📝 ${o.userIdInput}\n💰 ${o.price}₽\n📊 ${o.status}\n🕐 ${o.createdAt.split(',')[0]}\n\n`;
    });
    bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
});

bot.onText(/\/admin_reviews/, (msg) => {
    if (msg.from.id != ADMIN_ID) return;
    if (reviews.length === 0) return bot.sendMessage(msg.chat.id, '⭐ Нет отзывов');
    let text = '⭐ **ВСЕ ОТЗЫВЫ (АДМИН)** ⭐\n\n';
    reviews.slice().reverse().forEach((r, i) => {
        text += `**${i+1}. ${r.username}** (${r.userIdInput})\n"${r.text}"\n🕐 ${r.date}\n\n`;
    });
    bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
});

bot.onText(/\/cancel_review/, (msg) => {
    if (bot.reviewState && bot.reviewState.userId === msg.from.id) {
        bot.reviewState = null;
        bot.sendMessage(msg.chat.id, '❌ Написание отзыва отменено');
    }
});

console.log('✅ БОТ ЗАПУЩЕН НА RENDER');