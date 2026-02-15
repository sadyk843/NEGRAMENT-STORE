const TelegramBot = require('node-telegram-bot-api');

// ==========================================
// НАСТРОЙКИ (ЗАПОЛНИ СВОИ ДАННЫЕ)
// ==========================================
const token = '8542561341:AAEiHQk2tCyqdIF9dhr6GH6H7KNvbgi_-rY'; // Вставь токен
const ADMIN_ID = 5814157480;              // Вставь свой цифровой ID
const WEB_APP_URL = 'https://tg-shop-sigma.vercel.app'; // Ссылка на магазин
// ==========================================

// Создаем бота
const bot = new TelegramBot(token, { polling: true });

// Команда /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, 'Привет! Нажми на кнопку ниже, чтобы открыть магазин:', {
        reply_markup: {
            keyboard: [
                // ВАЖНО: Только нижняя кнопка (KeyboardButton) позволяет использовать tg.sendData
                [{ text: "🛍 Открыть магазин", web_app: { url: WEB_APP_URL } }]
            ],
            resize_keyboard: true
        }
    });
});

// ОБРАБОТЧИК ЗАКАЗОВ (ловит данные из WebApp)
bot.on('message', async (msg) => {
    // 1. Проверка: пришло ли вообще сообщение от WebApp?
    if (msg.web_app_data) {
        console.log('Получены данные из WebApp:', msg.web_app_data.data);
        
        try {
            const data = JSON.parse(msg.web_app_data.data);
            
            const adminMessage = `
📦 НОВЫЙ ЗАКАЗ!
🛍 Товар: ${data.item}
🎮 Игра: ${data.game}
🆔 ID: ${data.userId}
💰 Цена: ${data.price} ₽
👤 От: @${msg.from.username || 'id' + msg.from.id}
            `;

            await bot.sendMessage(ADMIN_ID, adminMessage, { parse_mode: 'Markdown' });
            await bot.sendMessage(msg.chat.id, '✅ Заказ получен!');
            
        } catch (e) {
            // Если данные пришли, но они не в формате JSON
            await bot.sendMessage(ADMIN_ID, `⚠️ Данные пришли, но ошибка в формате: ${msg.web_app_data.data}`);
        }
    } else {
        // Это обычное текстовое сообщение (не из магазина)
        console.log('Обычное сообщение от:', msg.from.id);
    }
});

            console.log(`Заказ от ${msg.from.id} успешно обработан.`);

        } catch (error) {
            console.error('Ошибка обработки данных:', error);
            bot.sendMessage(msg.chat.id, '❌ Ошибка при оформлении заказа.');
        }
    }
});

console.log('🚀 Бот на node-telegram-bot-api запущен!');


