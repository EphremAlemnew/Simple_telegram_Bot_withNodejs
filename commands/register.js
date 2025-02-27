const Student = require("../models/student");
module.exports = async (bot, msg, match) => {
    const chatId = msg.chat.id;
    const [name, age, grade] = match[1].split(",");
    const student = new Student({ name, age, grade });
    await student.save();
    bot.sendMessage(chatId, `Student ${name} registered successfully.`);
};