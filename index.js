// require("dotenv").config();
// const TelegramBot = require("node-telegram-bot-api");
// const mongoose = require("mongoose");
// const Student = require("./models/Students");

// const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// // Connect to MongoDB
// mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });
// console.log("Connected to MongoDB");

// // Registration flow state
// const userStates = {};

// // Start command
// bot.onText(/\/start/, (msg) => {
//   bot.sendMessage(msg.chat.id, "Welcome! Use /register to register as a student.");
// });

// // Register command
// bot.onText(/\/register/, (msg) => {
//   const chatId = msg.chat.id;
//   userStates[chatId] = { step: "firstName" };
//   bot.sendMessage(chatId, "Please enter your first name:");
// });

// // Handle messages based on user registration flow
// bot.on("message", async (msg) => {
//   const chatId = msg.chat.id;
//   const userState = userStates[chatId];

//   if (!userState) return;

//   if (userState.step === "firstName") {
//     userState.firstName = msg.text;
//     userState.step = "lastName";
//     bot.sendMessage(chatId, "Great! Now enter your last name:");
//   } else if (userState.step === "lastName") {
//     userState.lastName = msg.text;
//     userState.step = "age";
//     bot.sendMessage(chatId, "Now enter your age:");
//   } else if (userState.step === "age") {
//     if (!Number(msg.text)) {
//       bot.sendMessage(chatId, "Please enter a valid number for age.");
//       return;
//     }
//     userState.age = Number(msg.text);
//     userState.step = "photo";
//     bot.sendMessage(chatId, "Finally, upload your personal photo:");
//   } else if (userState.step === "photo" && msg.photo) {
//     const photoId = msg.photo[msg.photo.length - 1].file_id;

//     // Save student data to MongoDB
//     const newStudent = new Student({
//       firstName: userState.firstName,
//       lastName: userState.lastName,
//       age: userState.age,
//       photoId: photoId,
//     });

//     await newStudent.save();

//     delete userStates[chatId]; // Clear state
//     bot.sendMessage(chatId, "Registration complete! Your details have been saved.");
//   }
// });

// // List registered students (Admin command)
// bot.onText(/\/students_list/, async (msg) => {
//   const chatId = msg.chat.id;
//   const students = await Student.find();

//   if (students.length === 0) {
//     bot.sendMessage(chatId, "No students registered yet.");
//     return;
//   }

//   for (const student of students) {
//     bot.sendMessage(
//       chatId,
//       `👤 Name: ${student.firstName} ${student.lastName}\n📅 Age: ${student.age}`
//     );
//     bot.sendPhoto(chatId, student.photoId);
//   }
// });

// console.log("Bot is running...");
const { Telegraf, session, Scenes, Markup } = require('telegraf');
const mongoose = require('mongoose');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const SUPER_ADMIN_ID = process.env.SUPER_ADMIN_ID; // Set your Telegram ID in .env

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Define Mongoose Schemas
const studentSchema = new mongoose.Schema({
    studentId: { type: String, required: true, unique: true },
    firstName: String,
    lastName: String,
    age: Number,
    photo: String
});

const Student = mongoose.model('Student', studentSchema);

// Counter Schema for generating student IDs
const counterSchema = new mongoose.Schema({
    year: String,
    sequence: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);


const adminSchema = new mongoose.Schema({
    telegramId: String
});
const Admin = mongoose.model('Admin', adminSchema);

const supportSchema = new mongoose.Schema({
    userId: String,
    question: String
});
const Support = mongoose.model('Support', supportSchema);

// Middleware to check if user is admin or super admin
const isAdmin = async (ctx, next) => {
    if (ctx.from.id.toString() === SUPER_ADMIN_ID) return next(); // Allow Super Admin
    const admin = await Admin.findOne({ telegramId: ctx.from.id.toString() });
    if (admin) return next();
    ctx.reply('You are not an admin.');
};

// Super Admin Command: /make_admin (Super Admin only)
 // Replace with your Telegram ID

 // Replace with your Telegram ID

 bot.command('start', (ctx) => {
    ctx.reply('Welcome to the Admin Management Bot! Choose an action below:', Markup.keyboard([
        ['Register', 'Ask a Question.'],
        ['Add Admin', 'Show Admins'],
        ['Remove Admin', 'Remove Student'],
        ['Export Students','List All Students' ]
    ])
    .oneTime(false) // Keyboard remains open after use
    .resize() // Resizes the keyboard
    );
});


 bot.hears('Add Admin', async (ctx) => {
     if (ctx.from.id.toString() !== SUPER_ADMIN_ID) {
         console.log(`Unauthorized attempt by ${ctx.from.id}`);
         return ctx.reply('You are not allowed to do this.');
     }
 
     const userId = ctx.message.text.split(' ')[1];
     if (!userId) return ctx.reply('Please provide a user ID.');
 
     try {
         console.log(`Looking up user with ID: ${userId}`);
 
         // Check if the user exists by their user ID
         const user = await bot.telegram.getChat(userId);
         if (!user || !user.id) {
             console.log(`User with ID ${userId} not found.`);
             return ctx.reply('User not found.');
         }
 
         console.log(`User found: ${user.id}`);
 
         const existingAdmin = await Admin.findOne({ telegramId: user.id.toString() });
         if (existingAdmin) {
             console.log(`User with ID ${userId} is already an admin.`);
             return ctx.reply('This user is already an admin.');
         }
 
         await new Admin({ telegramId: user.id.toString() }).save();
         console.log(`Admin added: ${user.id}`);
         ctx.reply(`✅ Admin with ID ${userId} added successfully.`);
     } catch (error) {
         console.error('Error adding admin:', error);
         ctx.reply('⚠️ Could not find this user. Ensure they have messaged the bot before.');
     }
 });
 




// Super Admin Command: /remove_admin (Super Admin only)
bot.hears('Remove Admin', async (ctx) => {
    if (ctx.from.id.toString() !== SUPER_ADMIN_ID) return ctx.reply('You are not allowed to do this.');

    const removeAdminId = ctx.message.text.split(' ')[1];
    if (!removeAdminId) return ctx.reply('Please provide a Telegram ID.');

    await Admin.deleteOne({ telegramId: removeAdminId });
    ctx.reply(`Admin (ID: ${removeAdminId}) removed successfully.`);
});

bot.hears('Show Admins', async (ctx) => {
    if (ctx.from.id.toString() !== SUPER_ADMIN_ID) {
        return ctx.reply('You are not allowed to do this.');
    }

    try {
        const admins = await Admin.find();
        if (admins.length === 0) {
            return ctx.reply('There are no admins yet.');
        }

        // If you want to display Telegram IDs
        // let response = 'Current Admins:\n';
        // admins.forEach(admin => {
        //     response += `ID: ${admin.telegramId}\n`;
        // });

        // If you want to display usernames instead (if available)
        let response = 'Current Admins:\n';
        for (const admin of admins) {
            const user = await bot.telegram.getChat(admin.telegramId);
            response += `@${user.username} (ID: ${user.id})\n`;
        }

        ctx.reply(response);
    } catch (error) {
        console.error('Error fetching admins:', error);
        ctx.reply('⚠️ Failed to retrieve the admin list.');
    }
});


// Command: /students_list (Admin & Super Admin)
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



// Student Registration Wizard

// Function to generate student ID
async function generateStudentId() {
    const year = new Date().getFullYear().toString();
    const counter = await Counter.findOne({ year });

    if (!counter) {
        // If counter for the year doesn't exist, create one
        const newCounter = new Counter({ year, sequence: 1 });
        await newCounter.save();
        return `FSSS/1/${year}`;
    }

    // Increment the sequence and update the counter
    counter.sequence++;
    await counter.save();

    return `FSSS/${counter.sequence}/${year}`;
}



const registrationWizard = new Scenes.WizardScene(
    'Register',
    async (ctx) => {
        ctx.reply('Please enter your first name.');
        return ctx.wizard.next();
    },
    async (ctx) => {
        ctx.wizard.state.firstName = ctx.message.text;
        ctx.reply('Now enter your last name.');
        return ctx.wizard.next();
    },
    async (ctx) => {
        ctx.wizard.state.lastName = ctx.message.text;
        ctx.reply('Enter your age.');
        return ctx.wizard.next();
    },
    async (ctx) => {
        const age = parseInt(ctx.message.text);
        if (isNaN(age)) {
            ctx.reply('Please enter a valid number for age.');
            return;
        }
        ctx.wizard.state.age = age;
        ctx.reply('Now send your photo.');
        return ctx.wizard.next();
    },
    async (ctx) => {
        if (!ctx.message.photo) {
            ctx.reply('Please send a valid photo.');
            return;
        }
        const photo = ctx.message.photo[0].file_id;
        const { firstName, lastName, age } = ctx.wizard.state;

        // Generate Student ID
        const studentId = await generateStudentId();

        const newStudent = new Student({ firstName, lastName, age, photo, studentId });
        await newStudent.save();
        ctx.reply(`You have been registered successfully! Your student ID is: ${studentId}`);

        return ctx.scene.leave();
    }
);

// Create Scene Manager
const stage = new Scenes.Stage([registrationWizard]);


bot.use(session());
bot.use(stage.middleware());

// Command: /start
bot.start((ctx) => {
    ctx.reply('Welcome to Student Registration Bot! Use /register to sign up.');
});

// Command: /register (Start Registration Wizard)
bot.hears('Register', (ctx) => ctx.scene.enter('Register'));

bot.hears('List All Students', isAdmin, async (ctx) => {
    const students = await Student.find();
    let response = students.map(s => `${s.firstName} ${s.lastName}, Age: ${s.age}`).join('\n');
    ctx.reply(response || 'No students found.');
});

// Command: /support
bot.hears('Ask a Question.', (ctx) => {
    ctx.reply('Please enter your question.');
    bot.on('text', async (ctx) => {
        const question = ctx.message.text;
        await new Support({ userId: ctx.from.id, question }).save();
        const admins = await Admin.find();
        admins.forEach(admin => {
            bot.telegram.sendMessage(admin.telegramId, `New question: ${question}`);
        });
        ctx.reply('Your question has been sent to the admins.');
    });
});
const fs = require('fs');
const { Parser } = require('json2csv');


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

// ✅ Step 1: Ask for Student ID
bot.hears('Remove Student', isAdmin, async (ctx) => {
    ctx.reply('📌 Please send the ID of the student you want to remove.');
    ctx.session.waitingForStudentID = true;
});

// ✅ Step 2: Capture and remove the student by ID
bot.on('text', async (ctx) => {
    if (!ctx.session.waitingForStudentID) return;

    const studentId = ctx.message.text.trim();
    ctx.session.waitingForStudentID = false;

    if (!/^[0-9a-fA-F]{24}$/.test(studentId)) { // Check if it's a valid MongoDB ObjectId
        return ctx.reply('⚠️ Invalid Student ID format. Please provide a valid ID.');
    }

    try {
        const result = await Student.findByIdAndDelete(studentId);
        if (!result) {
            return ctx.reply('❌ Student not found. Please check the ID and try again.');
        }
        ctx.reply(`✅ Student with ID ${studentId} has been removed.`);
    } catch (error) {
        console.error('❌ Error removing student:', error);
        ctx.reply('⚠️ An error occurred while removing the student.');
    }
});

const PORT = process.env.PORT || 3000;  // Default to 3000 if no PORT is set
bot.launch().then(() => {
    console.log(`Bot is running on port ${PORT}`);
}).catch(error => {
    console.error('Error launching bot:', error);
});


