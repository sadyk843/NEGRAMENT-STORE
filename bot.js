const TelegramBot = require('node-telegram-bot-api');
const TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;
const bot = new TelegramBot(TOKEN, { polling: true });

// Хранилище заказов
const orders = {};
// Временное хранилище для состояний покупки
const userState = {};

// ===== КАТАЛОГ ТОВАРОВ (из твоего HTML) =====
const categories = {
    stars: {
        name: '⭐ Telegram Stars',
        items: [
            { name: '50 ⭐', price: 66.5 },
            { name: '75 ⭐', price: 99.75 },
            { name: '100 ⭐', price: 133 },
            { name: '150 ⭐', price: 199.5 },
            { name: '250 ⭐', price: 332.5 },
            { name: '350 ⭐', price: 460 },
            { name: '500 ⭐', price: 660 },
            { name: '750 ⭐', price: 990.5 },
            { name: '2500 ⭐', price: 3250 },
            { name: '10000 ⭐', price: 13000 },
            { name: '25000 ⭐', price: 32500 },
            { name: '35000 ⭐', price: 45250 }
        ]
    },
    mlbb: {
        name: '🎮 Mobile Legends',
        subcategories: {
            ru: {
                name: 'RU сервер',
                items: [
                    { name: '50 + 5', price: 105 },
                    { name: '150 + 15', price: 290 },
                    { name: '250 + 25', price: 470 },
                    { name: '500 + 65', price: 900 },
                    { name: '1000 + 155', price: 1800 },
                    { name: '1500 + 265', price: 2700 },
                    { name: '2500 + 475', price: 4500 },
                    { name: '5000 + 1000', price: 9250 },
                    { name: '50 + 50 (АКЦИЯ)', price: 110 },
                    { name: '150 + 150 (АКЦИЯ)', price: 300 },
                    { name: '250 + 250 (АКЦИЯ)', price: 520 }
                ]
            },
            global: {
                name: 'Global сервер',
                items: [
                    { name: '78 + 8', price: 120 },
                    { name: '156 + 16', price: 230 },
                    { name: '625 + 81', price: 800 },
                    { name: '1860 + 335', price: 2400 },
                    { name: '3099 + 589', price: 4000 },
                    { name: '4649 + 883', price: 6000 },
                    { name: '7740 + 548', price: 10000 }
                ]
            }
        }
    },
    genshin: {
        name: '⏳ Genshin Impact',
        subcategories: {
            time: {
                name: 'Гранулы времени',
                items: [
                    { name: '60', price: 70 },
                    { name: '300 + 30', price: 350 },
                    { name: '980 + 110', price: 1030 },
                    { name: '1980 + 260', price: 2150 },
                    { name: '3280 + 600', price: 3350 },
                    { name: '6480 + 1600', price: 6650 }
                ]
            },
            crystals: {
                name: 'Кристаллы',
                items: [
                    { name: '60', price: 60 },
                    { name: '300 + 30', price: 300 },
                    { name: '980 + 110', price: 900 },
                    { name: '1980 + 260', price: 1900 },
                    { name: '3280 + 600', price: 3100 },
                    { name: '6480 + 1600', price: 6600 }
                ]
            }
        }
    }
};

// ===== КОМАНДА /start =====
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, '🛍 Добро пожаловать в NEGRAMENT STORE!', {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🛍 Каталог товаров', callback_data: 'catalog' }],
                [{ text: '📋 Мои заказы', callback_data: 'my_orders' }]
            ]
        }
    });
});

// ===== КАТАЛОГ =====
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    
    // Категории
    if (data === 'catalog') {
        const keyboard = [
            [{ text: '⭐ Telegram Stars', callback_data: 'cat_stars' }],
            [{ text: '🎮 Mobile Legends', callback_data: 'cat_mlbb' }],
            [{ text: '⏳ Genshin Impact', callback_data: 'cat_genshin' }],
            [{ text: '◀ Назад', callback_data: 'back_main' }]
        ];
        await bot.editMessageText('Выберите категорию:', {
            chat_id: chatId,
            message_id: query.message.message_id,
            reply_markup: { inline_keyboard: keyboard }
        });
    }
    
    // Telegram Stars
    else if (data === 'cat_stars') {
        const items = categories.stars.items;
        const keyboard = items.map(item => 
            [{ text: `${item.name} — ${item.price} ₽`, callback_data: `item_stars_${item.name}_${item.price}` }]
        );
        keyboard.push([{ text: '◀ Назад', callback_data: 'catalog' }]);
        
        await bot.editMessageText('⭐ Telegram Stars:', {
            chat_id: chatId,
            message_id: query.message.message_id,
            reply_markup: { inline_keyboard: keyboard }
        });
    }
    
    // Mobile Legends
    else if (data === 'cat_mlbb') {
        const keyboard = [
            [{ text: '🇷🇺 RU сервер', callback_data: 'sub_mlbb_ru' }],
            [{ text: '🌍 Global сервер', callback_data: 'sub_mlbb_global' }],
            [{ text: '◀ Назад', callback_data: 'catalog' }]
        ];
        await bot.editMessageText('🎮 Mobile Legends — выберите сервер:', {
            chat_id: chatId,
            message_id: query.message.message_id,
            reply_markup: { inline_keyboard: keyboard }
        });
    }
    
    // Genshin
    else if (data === 'cat_genshin') {
        const keyboard = [
            [{ text: '⏳ Гранулы времени', callback_data: 'sub_genshin_time' }],
            [{ text: '💎 Кристаллы', callback_data: 'sub_genshin_crystals' }],
            [{ text: '◀ Назад', callback_data: 'catalog' }]
        ];
        await bot.editMessageText('⏳ Genshin Impact — выберите тип:', {
            chat_id: chatId,
            message_id: query.message.message_id,
            reply_markup: { inline_keyboard: keyboard }
        });
    }
    
    // Подкатегории MLBB
    else if (data === 'sub_mlbb_ru') {
        const items = categories.mlbb.subcategories.ru.items;
        const keyboard = items.map(item => 
            [{ text: `${item.name} — ${item.price} ₽`, callback_data: `item_mlbb_ru_${item.name}_${item.price}` }]
        );
        keyboard.push([{ text: '◀ Назад', callback_data: 'cat_mlbb' }]);
        
        await bot.editMessageText('🇷🇺 RU сервер:', {
            chat_id: chatId,
            message_id: query.message.message_id,
            reply_markup: { inline_keyboard: keyboard }
        });
    }
    
    else if (data === 'sub_mlbb_global') {
        const items = categories.mlbb.subcategories.global.items;
        const keyboard = items.map(item => 
            [{ text: `${item.name} — ${item.price} ₽`, callback_data: `item_mlbb_global_${item.name}_${item.price}` }]
        );
        keyboard.push([{ text: '◀ Назад', callback_data: 'cat_mlbb' }]);
        
        await bot.editMessageText('🌍 Global сервер:', {
            chat_id: chatId,
            message_id: query.message.message_id,
            reply_markup: { inline_keyboard: keyboard }
        });
    }
    
    // Подкатегории Genshin
    else if (data === 'sub_genshin_time') {
        const items = categories.genshin.subcategories.time.items;
        const keyboard = items.map(item => 
            [{ text: `${item.name} — ${item.price} ₽`, callback_data: `item_genshin_time_${item.name}_${item.price}` }]
        );
        keyboard.push([{ text: '◀ Назад', callback_data: 'cat_genshin' }]);
        
        await bot.editMessageText('⏳ Гранулы времени:', {
            chat_id: chatId,
            message_id: query.message.message_id,
            reply_markup: { inline_keyboard: keyboard }
        });
    }
    
    else if (data === 'sub_genshin_crystals') {
        const items = categories.genshin.subcategories.crystals.items;
        const keyboard = items.map(item => 
            [{ text: `${item.name} — ${item.price} ₽`, callback_data: `item_genshin_crystals_${item.name}_${item.price}` }]
        );
        keyboard.push([{ text: '◀ Назад', callback_data: 'cat_genshin' }]);
        
        await bot.editMessageText('💎 Кристаллы:', {
            chat_id: chatId,
            message_id: query.message.message_id,
            reply_markup: { inline_keyboard: keyboard }
        });
    }
    
    // Выбор товара — запрашиваем ID/username
    else if (data.startsWith('item_')) {
        const parts = data.split('_');
        const category = parts[1];
        const subcategory = parts[2];
        const name = parts.slice(3, -2).join('_');
        const price = parts[parts.length-1];
        
        // Сохраняем в состояние пользователя
        userState[chatId] = {
            step: 'awaiting_id',
            category, subcategory,
            itemName: name,
            price: parseFloat(price)
        };
        
        await bot.editMessageText(`Вы выбрали: ${name}\n💰 Сумма: ${price} ₽\n\n📝 Введите ваш ID/Username для получения товара:`, {
            chat_id: chatId,
            message_id: query.message.message_id
        });
    }
    
    // Мои заказы
    else if (data === 'my_orders') {
        const userOrders = Object.values(orders).filter(o => o.userId == chatId);
        if (userOrders.length === 0) {
            await bot.sendMessage(chatId, '📋 У вас пока нет заказов');
        } else {
            let text = '📋 **ИСТОРИЯ ЗАКАЗОВ**\n\n';
            userOrders.forEach((order, i) => {
                text += `${i+1}. ${order.item} — ${order.price} ₽\n📊 Статус: ${order.status}\n🕐 ${order.createdAt}\n\n`;
            });
            await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
        }
    }
    
    else if (data === 'back_main') {
        await bot.editMessageText('🛍 Добро пожаловать в NEGRAMENT STORE!', {
            chat_id: chatId,
            message_id: query.message.message_id,
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🛍 Каталог товаров', callback_data: 'catalog' }],
                    [{ text: '📋 Мои заказы', callback_data: 'my_orders' }]
                ]
            }
        });
    }
    
    await bot.answerCallbackQuery(query.id);
});

// ===== ОБРАБОТКА ВВОДА ID/USERNAME =====
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    // Проверяем, ожидаем ли мы ввод ID
    if (userState[chatId] && userState[chatId].step === 'awaiting_id') {
        const state = userState[chatId];
        const userIdInput = text || 'не указан';
        const orderId = Date.now().toString().slice(-6);
        
        // Сохраняем заказ
        orders[orderId] = {
            userId: chatId,
            username: msg.from.username || 'нет_юзернейма',
            userInput: userIdInput,
            item: state.itemName,
            price: state.price,
            status: '⏳ Ожидает оплаты',
            createdAt: new Date().toLocaleString('ru-RU')
        };
        
        // Уведомление админу
        bot.sendMessage(ADMIN_ID,
            `🆕 **НОВЫЙ ЗАКАЗ #${orderId}**\n\n` +
            `👤 **Покупатель:** @${msg.from.username || 'нет'}\n` +
            `📝 **Указал:** ${userIdInput}\n` +
            `📦 **Товар:** ${state.itemName}\n` +
            `💰 **Сумма:** ${state.price} ₽`,
            { parse_mode: 'Markdown' }
        );
        
        // Подтверждение покупателю
        bot.sendMessage(chatId,
            `✅ **ЗАКАЗ #${orderId} ОФОРМЛЕН**\n\n` +
            `📦 **Товар:** ${state.itemName}\n` +
            `💰 **Сумма:** ${state.price} ₽\n` +
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
        
        // Очищаем состояние
        delete userState[chatId];
    }
});

// ===== ОБРАБОТКА ОПЛАТЫ =====
bot.on('callback_query', async (query) => {
    const data = query.data;
    
    if (data.startsWith('paid_')) {
        const orderId = data.split('_')[1];
        const order = orders[orderId];
        if (!order) return await bot.answerCallbackQuery(query.id, { text: '❌ Заказ не найден' });
        
        order.status = '🔄 Проверяется';
        await bot.editMessageText(
            query.message.text + '\n\n✅ Заявка отправлена! Админ проверит оплату.',
            { chat_id: query.message.chat.id, message_id: query.message.message_id, reply_markup: {} }
        );
        
        bot.sendMessage(ADMIN_ID,
            `💰 **ЗАЯВКА ОБ ОПЛАТЕ #${orderId}**\n\n` +
            `👤 **Покупатель:** @${order.username}\n` +
            `📝 **Указал:** ${order.userInput}\n` +
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
    }
    
    else if (data.startsWith('confirm_')) {
        const orderId = data.split('_')[1];
        const order = orders[orderId];
        if (!order) return;
        
        order.status = '✅ Выдан';
        bot.sendMessage(order.userId, `✅ **ОПЛАЧЕНО #${orderId}**\n\nТовар выдан! Спасибо за покупку! 🎮`);
        
        await bot.editMessageText(
            query.message.text + '\n\n✅ Товар выдан',
            { chat_id: query.message.chat.id, message_id: query.message.message_id, reply_markup: {} }
        );
        await bot.answerCallbackQuery(query.id, { text: '✅ Подтверждено' });
    }
    
    else if (data.startsWith('cancel_')) {
        const orderId = data.split('_')[1];
        const order = orders[orderId];
        if (!order) return;
        
        order.status = '❌ Отменён';
        bot.sendMessage(order.userId, `❌ **ЗАКАЗ #${orderId} ОТМЕНЁН**\n\nПлатёж не подтверждён.`);
        
        await bot.editMessageText(
            query.message.text + '\n\n❌ Заказ отменён',
            { chat_id: query.message.chat.id, message_id: query.message.message_id, reply_markup: {} }
        );
        await bot.answerCallbackQuery(query.id, { text: '❌ Отменён' });
    }
});

console.log('✅ БОТ С КАТАЛОГОМ ЗАПУЩЕН');
