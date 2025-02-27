import { Admin } from "../Students.js";

export const addAdminHandler = async (ctx) => {
    const userId = ctx.message.text.split(' ')[1];
    if (!userId) return ctx.reply('Please provide a user ID.');

    try {
        const user = await ctx.telegram.getChat(userId);
        if (!user || !user.id) {
            return ctx.reply('User not found.');
        }

        const existingAdmin = await Admin.findOne({ telegramId: user.id.toString() });
        if (existingAdmin) {
            return ctx.reply('This user is already an admin.');
        }

        await new Admin({ telegramId: user.id.toString() }).save();
        ctx.reply(`✅ Admin with ID ${userId} added successfully.`);
    } catch (error) {
        console.error('Error adding admin:', error);
        ctx.reply('⚠️ Could not find this user.');
    }
};


