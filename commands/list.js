const Student = require("../models/student");
module.exports = async (bot, msg) => {
    const chatId = msg.chat.id;
    const students = await Student.find();
    const response = students.map(s => `${s.name} - ${s.age} - ${s.grade}`).join("\n");
    bot.sendMessage(chatId, response || "No students found.");
};