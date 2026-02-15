// ===== ТАБЛИЦА ЛИДЕРОВ =====
let leaderboard = [];

bot.on('web_app_data', (msg) => {
    try {
        const data = JSON.parse(msg.web_app_data.data);
        
        if (data.type === 'game_result') {
            // Сохраняем результат
            leaderboard.push({
                user: msg.from.username || 'Игрок',
                game: data.game,
                score: data.score,
                date: new Date().toLocaleString()
            });
            
            // Топ-20
            leaderboard.sort((a, b) => b.score - a.score);
            leaderboard = leaderboard.slice(0, 20);
            
            bot.sendMessage(msg.chat.id, 
                `🎮 **Игра завершена!**\n\n` +
                `🏆 Твой результат: ${data.score} очков\n` +
                `📊 Топ игроков: /top`,
                { parse_mode: 'Markdown' }
            );
        }
        
        if (data.type === 'create_league') {
            bot.sendMessage(msg.chat.id,
                `👥 **Частная лига создана!**\n\n` +
                `Пригласи друзей командой /invite`,
                { parse_mode: 'Markdown' }
            );
        }
        
        if (data.type === 'order') {
            bot.sendMessage(ADMIN_ID,
                `🆕 **НОВЫЙ ЗАКАЗ**\n\n` +
                `👤 **Покупатель:** @${msg.from.username || 'нет'}\n` +
                `📦 **Товар:** ${data.item}\n` +
                `💰 **Сумма:** ${data.price} ₽`,
                { parse_mode: 'Markdown' }
            );
            
            bot.sendMessage(msg.chat.id,
                `✅ **ЗАКАЗ ОФОРМЛЕН**\n\n` +
                `📦 ${data.item}\n💰 ${data.price} ₽\n\n` +
                `💳 **Реквизиты:** 89324035777 (Озон Банк)`,
                { parse_mode: 'Markdown' }
            );
        }
    } catch (e) {
        console.log('❌ Ошибка:', e.message);
    }
});

// Команда /top
bot.onText(/\/top/, (msg) => {
    if (leaderboard.length === 0) {
        bot.sendMessage(msg.chat.id, '🏆 Таблица лидеров пока пуста');
        return;
    }
    
    let text = '🏆 **ТОП-20 ИГРОКОВ**\n\n';
    leaderboard.forEach((player, index) => {
        let medal = '';
        if (index === 0) medal = '🥇 ';
        else if (index === 1) medal = '🥈 ';
        else if (index === 2) medal = '🥉 ';
        
        text += `${medal}${index + 1}. @${player.user} — ${player.score} очков\n`;
    });
    
    bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
});

// Команда /invite
bot.onText(/\/invite/, (msg) => {
    const inviteLink = `https://t.me/${bot.options.username}?start=invite_${msg.from.id}`;
    bot.sendMessage(msg.chat.id,
        `👥 **Пригласи друга**\n\n` +
        `🔗 Ссылка: ${inviteLink}\n\n` +
        `✨ За каждого друга +100 очков в таблицу лидеров!`,
        { parse_mode: 'Markdown' }
    );
});
