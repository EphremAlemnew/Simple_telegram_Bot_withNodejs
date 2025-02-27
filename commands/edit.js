const Student = require("../models/student");
module.exports = async (bot, msg, match) => {
    const chatId = msg.chat.id;
    const [name, newAge, newGrade] = match[1].split(",");
    await Student.findOneAndUpdate({ name }, { age: newAge, grade: newGrade });
    bot.sendMessage(chatId, `Student ${name} updated.`);
};