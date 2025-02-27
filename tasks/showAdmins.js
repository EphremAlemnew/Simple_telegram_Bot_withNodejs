import { Admin } from "../Students.js";


export const showAdminsHandler = async (ctx) => {
    try {
        const admins = await Admin.find();
        if (admins.length === 0) {
            return ctx.reply('There are no admins yet.');
        }

        let response = 'Current Admins:\n';
        for (const admin of admins) {
            const user = await ctx.telegram.getChat(admin.telegramId);
            response += `@${user.username} (ID: ${user.id})\n`;
        }

        ctx.reply(response);
    } catch (error) {
        console.error('Error fetching admins:', error);
        ctx.reply('⚠️ Failed to retrieve the admin list.');
    }
};

