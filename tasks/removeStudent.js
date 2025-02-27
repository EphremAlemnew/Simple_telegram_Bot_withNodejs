import { Markup } from 'telegraf';
import {Student} from '../Students.js'

export const removeStudentHandler = async (ctx) => { 
    // Ensure ctx.session exists
    if (!ctx.session) {
        ctx.session = {}; // Initialize session if it's not present
    }

    ctx.reply('📌 Please send the ID of the student you want to remove.');
    ctx.session.waitingForStudentID = true; // Now this works
};

export const confirmRemoveStudentHandler = async (ctx) => {
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
};

export const cancelRemoveStudentHandler = (ctx) => {
    ctx.reply('❌ Student removal has been canceled.');
    ctx.session.studentIdToRemove = null; // Clear session
};

// module.exports = {
//     removeStudentHandler,
//     confirmRemoveStudentHandler,
//     cancelRemoveStudentHandler
// };
