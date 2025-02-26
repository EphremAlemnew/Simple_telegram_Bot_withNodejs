const { Telegraf, session, Markup } = require('telegraf');
const { Admin, Support } = require('../models/Students');
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(session()); // Enable session support

bot.hears('Ask a Question.', async (ctx) => {
    ctx.session = {}; // Reset session data
    await ctx.reply('📝 Please enter your question.');
});

// Capture user's question
bot.on('text', async (ctx) => {
    if (!ctx.session || ctx.session.questionConfirmed) return; // Ignore if session not started or already confirmed
    
    ctx.session.question = ctx.message.text;
    
    await ctx.reply(
        `❓ *Your Question:*\n"${ctx.session.question}"\n\nWhat do you want to do?`,
        Markup.inlineKeyboard([
            [Markup.button.callback('✅ Send', 'send_question')],
            [Markup.button.callback('✏️ Edit', 'edit_question')],
            [Markup.button.callback('❌ Cancel', 'cancel_question')]
        ])
    );
});

// Handle Send button
bot.action('send_question', async (ctx) => {
    if (!ctx.session.question) return;
    
    ctx.session.questionConfirmed = true; // Mark question as confirmed
    const question = ctx.session.question;

    // Save to database
    await new Support({ userId: ctx.from.id, question }).save();

    // Send to first admin in database (replace this logic as needed)
    const admin = await Admin.findOne();
    if (admin) {
        await bot.telegram.sendMessage(admin.telegramId, `📩 New question from user ${ctx.from.id}:\n\n"${question}"`);
    }

    await ctx.reply('✅ Your question has been sent to an admin.');
    ctx.session = {}; // Clear session after sending
});

// Handle Edit button
bot.action('edit_question', async (ctx) => {
    if (!ctx.session.question) return;
    
    await ctx.reply('✏️ Please enter your revised question.');
    ctx.session.questionConfirmed = false; // Allow editing
});

// Handle Cancel button
bot.action('cancel_question', async (ctx) => {
    await ctx.reply('❌ Your question has been cancelled.');
    ctx.session = {}; // Clear session
});
