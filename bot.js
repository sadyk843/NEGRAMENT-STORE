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
    // Проверяем, есть ли данные от WebApp
    if (msg.web_app_data && msg.web_app_data.data) {
        try {
            // Получаем JSON строку и превращаем в объект
            const data = JSON.parse(msg.web_app_data.data);
            
            const item = data.item || 'Не указан';
            const price = data.price || '0';
            const game = data.game || 'Неизвестно';
            const userId = data.userId || 'Не указан';

            // Сообщение для тебя (админа)
            const adminMessage = `
🔔 НОВЫЙ ЗАКАЗ!
━━━━━━━━━━━━━━
🛍 Товар: ${item}
🎮 Игра: ${game}
🆔 ID игрока: ${userId}
💰 К оплате: ${price} ₽
━━━━━━━━━━━━━━
👤 Покупатель: @${msg.from.username || 'скрыто'}
🆔 TG ID: ${msg.from.id}
            `;

            // 1. Отправляем уведомление тебе
            await bot.sendMessage(ADMIN_ID, adminMessage, { parse_mode: 'Markdown' });

            // 2. Отправляем подтверждение пользователю
            await bot.sendMessage(msg.chat.id, ✅ **Заказ принят!**\n\nВы выбрали: ${item}.\nОжидайте, мы свяжемся с вами для оплаты., { 
                parse_mode: 'Markdown' 
            });

            console.log(`Заказ от ${msg.from.id} успешно обработан.`);

        } catch (error) {
            console.error('Ошибка обработки данных:', error);
            bot.sendMessage(msg.chat.id, '❌ Ошибка при оформлении заказа.');
        }
    }
});

console.log('🚀 Бот на node-telegram-bot-api запущен!');

