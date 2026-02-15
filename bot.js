const TelegramBot = require('node-telegram-bot-api');
const http = require('http'); // Добавляем встроенный модуль http

// ==========================================
// НАСТРОЙКИ
// ==========================================
const token = '8542561341:AAEiHQk2tCyqdIF9dhr6GH6H7KNvbgi_-rY'; 
const ADMIN_ID = 5814157480;              
const WEB_APP_URL = 'https://tg-shop-sigma.vercel.app'; 
// ==========================================

const bot = new TelegramBot(token, { polling: true });

// --- ЗАГЛУШКА ДЛЯ ХОСТИНГА (Чтобы не было SIGTERM) ---
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Bot is running');
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`✅ Сервер прослушивает порт ${PORT}`);
});
// ---------------------------------------------------

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Привет! Магазин доступен по кнопке ниже:', {
        reply_markup: {
            keyboard: [
                [{ text: "🛍 Открыть магазин", web_app: { url: WEB_APP_URL } }]
            ],
            resize_keyboard: true
        }
    });
});

bot.on('message', async (msg) => {
    if (msg.web_app_data && msg.web_app_data.data) {
        try {
            const data = JSON.parse(msg.web_app_data.data);
            
            const adminMessage = `
🔔 НОВЫЙ ЗАКАЗ!
🛍 Товар: ${data.item}
🎮 Игра: ${data.game}
🆔 ID: ${data.userId}
💰 Цена: ${data.price} ₽
👤 От: @${msg.from.username || 'id' + msg.from.id}
            `;

            await bot.sendMessage(ADMIN_ID, adminMessage, { parse_mode: 'Markdown' });
            await bot.sendMessage(msg.chat.id, '✅ Заказ успешно отправлен администратору!');
            
        } catch (e) {
            console.error('Ошибка JSON:', e);
        }
    }
});

console.log('✅ БОТ ЗАПУЩЕН УСПЕШНО');
