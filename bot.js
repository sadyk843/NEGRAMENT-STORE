const TelegramBot = require('node-telegram-bot-api');
const TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;
const bot = new TelegramBot(TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Бот работает!');
});

bot.on('web_app_data', (msg) => {
    console.log('📦 Получены данные:', msg.web_app_data.data);
    bot.sendMessage(ADMIN_ID, '✅ Данные получены!');
});

console.log('✅ Бот запущен');
