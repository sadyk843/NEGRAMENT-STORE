const TelegramBot = require('node-telegram-bot-api');
const http = require('http');

// ==========================================
// НАСТРОЙКИ
// ==========================================
const token = '8542561341:AAEiHQk2tCyqdIF9dhr6GH6H7KNvbgi_-rY';
const ADMIN_ID = 5814157480;
const WEB_APP_URL = 'https://sadyk843.github.io/NEGRAMENT-STORE/'; // Ссылка на твой GitHub Pages
// ==========================================

const bot = new TelegramBot(token, { polling: true });

// --- ЗАГЛУШКА ДЛЯ ХОСТИНГА ---
const server = http.createServer((req, res) => {
res.writeHead(200);
res.end('Bot is running');
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
console.log(`✅ Бот запущен на порту ${PORT}`);
});

// Команда /start
bot.onText(/\/start/, (msg) => {
bot.sendMessage(msg.chat.id, 'Привет! Магазин NEGRAMENT доступен по кнопке ниже:', {
reply_markup: {
keyboard: [
[{ text: "🛍 Открыть магазин", web_app: { url: WEB_APP_URL } }]
],
resize_keyboard: true
}
});
});

// ОБРАБОТКА ДАННЫХ ИЗ МАГАЗИНА
bot.on('message', async (msg) => {
if (msg.web_app_data && msg.web_app_data.data) {
try {
const data = JSON.parse(msg.web_app_data.data);

// Формируем сообщение для тебя (админа)
// Используем те поля, которые мы прописали в index.html
const adminMessage = `
🔔 *НОВЫЙ ЗАКАЗ!*

📦 *Товар:* ${data.item || 'Не указан'}
💰 *Цена:* ${data.price || '0'} ₽
🆔 *ID пользователя:* \`${data.userId || 'нет данных'}\`
👤 *Покупатель:* @${msg.from.username || 'id' + msg.from.id}
📅 *Дата:* ${data.date || 'только что'}
`;

// Отправка уведомления админу
await bot.sendMessage(ADMIN_ID, adminMessage, { parse_mode: 'Markdown' });

// Ответ пользователю
await bot.sendMessage(msg.chat.id, '✅ Спасибо за заказ! Администратор свяжется с вами, если возникнут вопросы.');

} catch (e) {
console.error('Ошибка при разборе данных заказа:', e);
bot.sendMessage(ADMIN_ID, "⚠️ Произошла ошибка при получении данных заказа.");
}
}
});
