const { Telegraf, session, Markup } = require('telegraf');
const { Admin } = require('../models/Students');
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(session()); // Ensure session middleware is used
bot.hears('Show Admins', async (ctx) => {
    if (ctx.from.id.toString() !== SUPER_ADMIN_ID) {
        return ctx.reply('🚫 You are not allowed to do this.');
    }

    try {
        const admins = await Admin.find();
        if (admins.length === 0) {
            return ctx.reply('❗ There are no admins yet.');
        }

        let response = '👥 Current Admins:\n';

        for (const admin of admins) {
            try {
                const user = await bot.telegram.getChat(Number(admin.telegramId)); // Ensure numeric ID
                const username = user.username ? `@${user.username}` : '(No username)';
                response += `🔹 ${username} (ID: ${user.id})\n`;
            } catch (error) {
                console.error(`Error fetching user ${admin.telegramId}:`, error);
                response += `⚠️ Admin ID: ${admin.telegramId} (User not found)\n`;
            }
        }

        ctx.reply(response);
    } catch (error) {
        console.error('Error fetching admins:', error);
        ctx.reply('⚠️ Failed to retrieve the admin list.');
    }
});
