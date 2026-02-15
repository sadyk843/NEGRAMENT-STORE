const TelegramBot = require('node-telegram-bot-api');
const TOKEN = '8542561341:AAEiHQk2tCyqdIF9dhr6GH6H7KNvbgi_-rY';
const ADMIN_ID = '5814157480'; 
const bot = new TelegramBot(TOKEN, { polling: true });

// Хранилище заказов и отзывов (в идеале потом подключить базу данных)
const orders = {};
const reviews = [];

// Стейт для отзывов
const reviewStates = {};

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, '🛍 Добро пожаловать в NEGRASTORE!', {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🛍 Открыть магазин', web_app: { url: 'https://tg-shop-sigma.vercel.app' } }],
                [{ text: '📋 Мои заказы', callback_data: 'my_orders' }],
                [{ text: '⭐️ Отзывы', callback_data: 'show_reviews' }]
            ]
        }
    });
});

// ===== ПОЛУЧЕНИЕ ЗАКАЗА ИЗ WEB APP =====
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
            game: game || 'Неизвестная игра',
            item: item || 'Неизвестный товар',
            price: price || 0,
            status: '⏳ Ожидает оплаты',
            createdAt: new Date().toLocaleString('ru-RU')
        };

        // Уведомление админу о новом заказе
        bot.sendMessage(ADMIN_ID,
            🆕 **НОВЫЙ ЗАКАЗ #${orderId}**\n\n +
            👤 **Покупатель:** @${username} (ID: ${tgUserId})\n +
            📝 **Игровой ID:** ${userIdInput}\n +
            🎮 **Игра:** ${orders[orderId].game}\n +
            📦 **Товар:** ${orders[orderId].item}\n +
            💰 **Сумма:** ${orders[orderId].price} ₽,
            { parse_mode: 'Markdown' }
        );

        // Инструкция для покупателя
        bot.sendMessage(tgUserId,
            ✅ **ЗАКАЗ #${orderId} ОФОРМЛЕН**\n\n +
            🎮 **Игра:** ${orders[orderId].game}\n +
            📦 **Товар:** ${orders[orderId].item}\n +
            💰 **Сумма к оплате:** ${orders[orderId].price} ₽\n +
            👤 **Ваш игровой ID:** ${userIdInput}\n\n +
            💳 **Реквизиты:** 89324035777 (Озон Банк)\n\n +
            📌 **После перевода средств нажмите кнопку ниже:**,
            {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[
                        { text: '✅ Я оплатил', callback_data: paid_${orderId} }
                    ]]
                }
            }
        );
    } catch (e) {
        console.log('❌ Ошибка:', e.message);
        bot.sendMessage(ADMIN_ID, `❌ Ошибка при создании заказа: ${e.message}`);
    }
});

// ===== ОБРАБОТКА ИНЛАЙН КНОПОК =====
bot.on('callback_query', async (query) => {
    const data = query.data;
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const msgId = query.message.message_id;

    // --- 1. Клиент нажал "Я оплатил" ---
    if (data.startsWith('paid_')) {
        const orderId = data.split('_')[1];
        const order = orders[orderId];
        if (!order) return bot.answerCallbackQuery(query.id, { text: '❌ Заказ не найден', show_alert: true });
        
        order.status = '🔄 Проверяется оплата';
        
        // Меняем сообщение клиенту
        await bot.editMessageText(
            query.message.text + '\n\n✅ Заявка отправлена! Ожидайте подтверждения оплаты от администратора.',
            { chat_id: chatId, message_id: msgId, entities: query.message.entities }
        );
        
        // Отправляем админу кнопку подтверждения
        await bot.sendMessage(ADMIN_ID,
            💰 **ПРОВЕРКА ОПЛАТЫ #${orderId}**\n\n +
            👤 **Покупатель:** @${order.username}\n +📝 **Игровой ID:** ${order.userIdInput}\n +
            🎮 **Игра:** ${order.game}\n +
            📦 **Товар:** ${order.item}\n +
            💵 **Ожидаемая сумма:** ${order.price} ₽,
            {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '✅ Подтвердить оплату', callback_data: payok_${orderId} }],
                        [{ text: '❌ Отменить заказ', callback_data: cancel_${orderId} }]
                    ]
                }
            }
        );
        return bot.answerCallbackQuery(query.id, { text: '✅ Отправлено на проверку' });
    }

    // --- 2. Админ подтвердил оплату (Открывается меню управления статусом) ---
    if (data.startsWith('payok_')) {
        const orderId = data.split('_')[1];
        const order = orders[orderId];
        if (!order) return bot.answerCallbackQuery(query.id, { text: '❌ Заказ не найден' });
        
        order.status = '⏳ В очереди / Подтвержден';
        
        // Уведомляем клиента
        await bot.sendMessage(order.tgUserId, ✅ **Оплата по заказу #${orderId} получена!**\nВаш заказ принят в работу., { parse_mode: 'Markdown' });
        
        // Открываем панель управления админу
        await bot.editMessageText(
            ⚙️ **УПРАВЛЕНИЕ ЗАКАЗОМ #${orderId}**\n\n +
            👤 **Покупатель:** @${order.username}\n +
            📝 **Игровой ID:** ${order.userIdInput}\n +
            🎮 **Игра:** ${order.game}\n +
            📦 **Товар:** ${order.item}\n +
            💵 **Сумма:** ${order.price} ₽\n\n +
            📊 **Текущий статус:** ✅ Оплата подтверждена,
            {
                chat_id: chatId,
                message_id: msgId,
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🟡 Изменить на "Выполняется"', callback_data: prog_${orderId} }],
                        [{ text: '🟢 Изменить на "Готов"', callback_data: ready_${orderId} }]
                    ]
                }
            }
        );
        return bot.answerCallbackQuery(query.id);
    }

    // --- 3. Админ меняет статус на "Выполняется" ---
    if (data.startsWith('prog_')) {
        const orderId = data.split('_')[1];
        const order = orders[orderId];
        if (!order) return;
        
        order.status = '🟡 Выполняется';
        await bot.sendMessage(order.tgUserId, 🟡 **Заказ #${orderId} начал выполняться!**\nПроцесс запущен, ожидайте завершения., { parse_mode: 'Markdown' });
        
        await bot.editMessageText(
            query.message.text.replace(/Текущий статус: .*/, `Текущий статус: 🟡 Выполняется`),
            {
                chat_id: chatId, 
                message_id: msgId, 
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[{ text: '🟢 Изменить на "Готов"', callback_data: ready_${orderId} }]]
                }
            }
        );
        return bot.answerCallbackQuery(query.id, { text: 'Статус изменен на Выполняется' });
    }

    // --- 4. Админ меняет статус на "Готов" ---
    if (data.startsWith('ready_')) {
        const orderId = data.split('_')[1];
        const order = orders[orderId];
        if (!order) return;
        
        order.status = '✅ Готов / Выдан';
        
        // Уведомляем клиента и просим отзыв
        await bot.sendMessage(order.tgUserId,
            🎉 **ЗАКАЗ #${orderId} УСПЕШНО ВЫПОЛНЕН!**\n\n +
            🎮 **Игра:** ${order.game}\n +
            📦 **Товар:** ${order.item}\n\n +
            Спасибо за покупку! Будем рады вашему отзыву. ⭐️,
            {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[{ text: '⭐️ Написать отзыв', callback_data: review_${orderId} }]]
                }
            }
        );
        
        // Закрываем панель админа
        await bot.editMessageText(
            query.message.text.replace(/Текущий статус: .*/, `Текущий статус: 🟢 ЗАВЕРШЕН`),{ chat_id: chatId, message_id: msgId, parse_mode: 'Markdown', reply_markup: {} }
        );
        return bot.answerCallbackQuery(query.id, { text: 'Заказ завершен' });
    }

    // --- 5. Админ отменил заказ ---
    if (data.startsWith('cancel_')) {
        const orderId = data.split('_')[1];
        const order = orders[orderId];
        if (!order) return;
        
        order.status = '❌ Отменён';
        await bot.sendMessage(order.tgUserId, `❌ **ЗАКАЗ #${orderId} ОТМЕНЁН**\n\nПлатёж не подтверждён или возникла ошибка. Обратитесь в поддержку.`);
        
        await bot.editMessageText(
            query.message.text + '\n\n❌ **ЗАКАЗ ОТМЕНЕН**',
            { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown', reply_markup: {} }
        );
        return bot.answerCallbackQuery(query.id);
    }

    // --- 6. Клиент хочет написать отзыв ---
    if (data.startsWith('review_')) {
        const orderId = data.split('_')[1];
        const order = orders[orderId];
        if (!order || order.tgUserId != userId) return bot.answerCallbackQuery(query.id, { text: 'Ошибка доступа' });
        
        await bot.sendMessage(chatId,
            ✏️ **НАПИШИТЕ ОТЗЫВ**\n\n +
            Отправьте текст вашего отзыва одним сообщением прямо сюда.\n +
            (Чтобы отменить, введите команду /cancel_review),
            { parse_mode: 'Markdown' }
        );
        reviewStates[userId] = { orderId, game: order.game, userIdInput: order.userIdInput };
        return bot.answerCallbackQuery(query.id);
    }

    // --- 7. Мои заказы (Клиент) ---
    if (data === 'my_orders') {
        const userOrders = Object.entries(orders)
            .filter(([_, o]) => o.tgUserId == userId)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .slice(0, 5);
            
        if (userOrders.length === 0) {
            await bot.sendMessage(chatId, '📋 У вас пока нет заказов');
        } else {
            let text = '📋 **ВАШИ ПОСЛЕДНИЕ ЗАКАЗЫ:**\n\n';
            userOrders.forEach(([id, o]) => {
                text += 🔹 **#${id}** | ${o.game} - ${o.item}\n +
                        💰 ${o.price} ₽ | Стейт: ${o.status}\n\n;
            });
            await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
        }
        return bot.answerCallbackQuery(query.id);
    }

    // --- 8. Показать отзывы ---
    if (data === 'show_reviews') {
        if (reviews.length === 0) {
            await bot.sendMessage(chatId, '⭐️ Пока нет отзывов');
        } else {
            let text = '⭐️ ОТЗЫВЫ ПОКУПАТЕЛЕЙ ⭐️\n\n';
            reviews.slice(-10).reverse().forEach((r, i) => {
                text += **${i+1}. @${r.username}**\n +
                        🎮 ${r.game}\n +
                        💬 _"${r.text}"_\n +
                        🕐 ${r.date.split(',')[0]}\n\n;
            });
            await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
        }
        return bot.answerCallbackQuery(query.id);
    }
});

// ===== ПРИЕМ ТЕКСТА ОТЗЫВА =====
bot.on('message', (msg) => {
    const userId = msg.from.id;
    if (!msg.text || msg.text.startsWith('/')) return;
    
    if (reviewStates[userId]) {
        const review = {
            username: msg.from.username  msg.from.first_name  'Аноним',
            game: reviewStates[userId].game,
            userIdInput: reviewStates[userId].userIdInput,
            text: msg.text,
            date: new Date().toLocaleString('ru-RU')
        };
        reviews.push(review);
        
        bot.sendMessage(msg.chat.id, '✅ Спасибо, ваш отзыв успешно опубликован!');
        bot.sendMessage(ADMIN_ID,
            ⭐️ **ПОСТУПИЛ НОВЫЙ ОТЗЫВ**\n\n +
            👤 **@${review.username}** (ID: ${review.userIdInput})\n +
            🎮 **${review.game}**\n +
            💬 "${review.text}",
            { parse_mode: 'Markdown' }
        );
        delete reviewStates[userId];
    }
});

// ===== ДОП КОМАНДЫ =====
bot.onText(/\/cancel_review/, (msg) => {
    if (reviewStates[msg.from.id]) {
        delete reviewStates[msg.from.id];
        bot.sendMessage(msg.chat.id, '❌ Написание отзыва отменено.');
    }
});

console.log('✅ БОТ МАГАЗИНА УСПЕШНО ЗАПУЩЕН');
