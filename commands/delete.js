const Student = require("../models/student");
module.exports = async (bot, msg, match) => {
    const chatId = msg.chat.id;
    const name = match[1];
    await Student.findOneAndDelete({ name });
    bot.sendMessage(chatId, `Student ${name} deleted.`);
};