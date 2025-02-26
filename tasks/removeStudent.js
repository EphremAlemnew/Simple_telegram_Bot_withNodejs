const { Telegraf, session, Markup } = require('telegraf');
const { Admin, Student } = require('../models/Students');
const bot = new Telegraf(process.env.BOT_TOKEN);
const SUPER_ADMIN_ID = process.env.SUPER_ADMIN_ID; 
const isAdmin = async (ctx, next) => {
    if (ctx.from.id.toString() === SUPER_ADMIN_ID) return next(); // Allow Super Admin
    const admin = await Admin.findOne({ telegramId: ctx.from.id.toString() });
    if (admin) return next();
    ctx.reply('You are not an admin.');
};
bot.hears('Remove Student', isAdmin, async (ctx) => { 
    // Ensure ctx.session exists
    if (!ctx.session) {
        ctx.session = {}; // Initialize session if it's not present
    }

    ctx.reply('📌 Please send the ID of the student you want to remove.');
    ctx.session.waitingForStudentID = true; // Now this works
});

bot.on('text', async (ctx) => {
    if (!ctx.session.waitingForStudentID) return;

    const studentId = ctx.message.text.trim();

    // Validate studentId format (if necessary, depending on your ID format)
    if (!/^FSSS\/\d+\/\d{4}$/.test(studentId)) { // Example pattern for FSSS/1/2025
        return ctx.reply('⚠️ Invalid Student ID format. Please provide a valid ID.');
    }

    ctx.session.waitingForStudentID = false;
    ctx.session.studentIdToRemove = studentId; // Store studentId temporarily

    // Ask for confirmation
    ctx.reply(
        `❗ Are you sure you want to remove student with ID: ${studentId}?`,
        Markup.inlineKeyboard([
            [Markup.button.callback('✅ Yes, Remove', 'confirm_remove')],
            [Markup.button.callback('❌ No, Cancel', 'cancel_remove')]
        ])
    );
});

// Handle Confirmation
bot.action('confirm_remove', async (ctx) => {
    const studentId = ctx.session.studentIdToRemove;
    if (!studentId) {
        return ctx.reply('⚠️ No student ID found. Please try again.');
    }

    try {
        // Delete student by studentId
        const result = await Student.findOneAndDelete({ studentId });
        if (!result) {
            return ctx.reply('❌ Student not found. Please check the ID and try again.');
        }

        ctx.reply(`✅ Student with ID ${studentId} has been removed.`);
    } catch (error) {
        console.error('❌ Error removing student:', error);
        ctx.reply('⚠️ An error occurred while removing the student.');
    }

    ctx.session.studentIdToRemove = null; // Clear session
});

// Handle Cancellation
bot.action('cancel_remove', (ctx) => {
    ctx.reply('❌ Student removal has been canceled.');
    ctx.session.studentIdToRemove = null; // Clear session
});
