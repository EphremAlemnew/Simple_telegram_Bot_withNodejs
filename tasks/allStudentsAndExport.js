const { Telegraf, session, Markup } = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);
const fs = require('fs');
const { Parser } = require('json2csv');
const { Student } = require('../models/Students');
bot.hears('List All Students', isAdmin, async (ctx) => {
    const students = await Student.find();
    if (students.length === 0) return ctx.reply('No students found.');

    for (const student of students) {
        const studentId = student.studentId || 'Not Set'; // If studentId is null, set it to 'Not Set'
        const firstName = student.firstName || 'Not Set';  // If firstName is null, set it to 'Not Set'
        const lastName = student.lastName || 'Not Set';    // If lastName is null, set it to 'Not Set'
        const age = student.age || 'Not Set';              // If age is null, set it to 'Not Set'

        if (student.photo) {
            await ctx.replyWithPhoto(student.photo, {
                caption: `🆔 *Student ID:* ${studentId}
📌 *Name:* ${firstName} ${lastName}
📅 *Age:* ${age}`,
                parse_mode: "Markdown"
            });
        } else {
            // If no photo, send text-only message
            await ctx.reply(`🆔 *Student ID:* ${studentId}
📌 *Name:* ${firstName} ${lastName}
📅 *Age:* ${age}`);
        }
    }
});





// Convert file_id to a Telegram image URL
const getImageUrl = (fileId) => {
    return `https://api.telegram.org/bot${process.env.BOT_TOKEN}/getFile?file_id=${fileId}`;
};

// Command: /export (Admins & Super Admin)
bot.hears('Export Students', isAdmin, async (ctx) => {
    try {
        const students = await Student.find();
        if (students.length === 0) return ctx.reply('No students found to export.');

        // Convert photos to Telegram file URLs
        const studentsWithImages = students.map(student => ({
            firstName: student.firstName,
            lastName: student.lastName,
            age: student.age,
            photo: getImageUrl(student.photo) // Convert file_id to URL
        }));

        // Convert to CSV
        const fields = ['firstName', 'lastName', 'age', 'photo'];
        const opts = { fields };
        const parser = new Parser(opts);
        const csv = parser.parse(studentsWithImages);

        // Save CSV file
        const filePath = `students_export_${Date.now()}.csv`;
        fs.writeFileSync(filePath, csv);

        // Send CSV file
        await ctx.replyWithDocument({ source: filePath, filename: 'students_list.csv' });

        // Delete file after sending
        fs.unlinkSync(filePath);
    } catch (error) {
        console.error('Error exporting students:', error);
        ctx.reply('An error occurred while exporting student data.');
    }
});