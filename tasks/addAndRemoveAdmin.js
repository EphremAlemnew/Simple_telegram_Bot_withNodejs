const { Telegraf, session, Markup } = require('telegraf');
const { Admin } = require('../models/Students');
const bot = new Telegraf(process.env.BOT_TOKEN);
const SUPER_ADMIN_ID = process.env.SUPER_ADMIN_ID; 
bot.use(session()); // Ensure session middleware is used

// ADD ADMIN FUNCTION
bot.hears('Add Admin', async (ctx) => {
    if (ctx.from.id.toString() !== SUPER_ADMIN_ID) {
        return ctx.reply('🚫 You are not allowed to do this.');
    }

    ctx.session = ctx.session || {}; // Ensure session object exists
    ctx.session.waitingForAdminId = 'add'; // Mark session for adding admin

    await ctx.reply('🔹 Please enter the Telegram ID of the user you want to make an admin.');
});

// REMOVE ADMIN FUNCTION
bot.hears('Remove Admin', async (ctx) => {
    if (ctx.from.id.toString() !== SUPER_ADMIN_ID) {
        return ctx.reply('🚫 You are not allowed to do this.');
    }

    ctx.session = ctx.session || {}; // Ensure session object exists
    ctx.session.waitingForAdminId = 'remove'; // Mark session for removing admin

    await ctx.reply('🔹 Please enter the Telegram ID of the admin you want to remove.');
});

// Handle Admin Addition or Removal
bot.on('text', async (ctx) => {
    if (!ctx.session || !ctx.session.waitingForAdminId) return; // Ignore if no action expected

    const userId = ctx.message.text.trim();
    const action = ctx.session.waitingForAdminId;
    ctx.session.waitingForAdminId = false; // Reset session flag

    if (!/^\d+$/.test(userId)) {
        return ctx.reply('⚠️ Invalid ID. Please enter a numeric Telegram ID.');
    }

    if (action === 'add') {
        // ADD ADMIN LOGIC
        try {
            const user = await bot.telegram.getChat(userId);
            if (!user || !user.id) {
                return ctx.reply('❌ User not found. Make sure they have messaged the bot first.');
            }

            const existingAdmin = await Admin.findOne({ telegramId: user.id.toString() });
            if (existingAdmin) {
                return ctx.reply('❗ This user is already an admin.');
            }

            await new Admin({ telegramId: user.id.toString() }).save();
            ctx.reply(`✅ Admin with ID ${userId} added successfully.`);
        } catch (error) {
            console.error('Error adding admin:', error);
            ctx.reply('⚠️ Could not add this user. Ensure they have interacted with the bot.');
        }
    } else if (action === 'remove') {
        // REMOVE ADMIN LOGIC
        try {
            const existingAdmin = await Admin.findOne({ telegramId: userId });
            if (!existingAdmin) {
                return ctx.reply('❌ This user is not an admin.');
            }

            await Admin.deleteOne({ telegramId: userId });
            ctx.reply(`✅ Admin with ID ${userId} has been removed.`);
        } catch (error) {
            console.error('Error removing admin:', error);
            ctx.reply('⚠️ Could not remove this admin. Please try again.');
        }
    }
});
