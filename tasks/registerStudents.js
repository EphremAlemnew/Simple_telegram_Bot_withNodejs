const { Counter, Student } = require("../models/Students");

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
        ctx.wizard.state.photo = ctx.message.photo[0].file_id;

        const { firstName, lastName, age } = ctx.wizard.state;

        // Display confirmation message
        await ctx.reply(
            `Please confirm your details:\n\n` +
            `📌 *First Name:* ${firstName}\n` +
            `📌 *Last Name:* ${lastName}\n` +
            `📌 *Age:* ${age}\n\n` +
            `✅ Click "Save" to confirm or ❌ "Cancel" to discard.`,
            Markup.inlineKeyboard([
                [Markup.button.callback('✅ Save', 'confirm_registration')],
                [Markup.button.callback('❌ Cancel', 'cancel_registration')]
            ])
        );

        return ctx.wizard.next();
    },
    async (ctx) => {
        if (!ctx.callbackQuery) return;

        const action = ctx.callbackQuery.data;
        if (action === 'confirm_registration') {
            const { firstName, lastName, age, photo } = ctx.wizard.state;
            const studentId = await generateStudentId();

            const newStudent = new Student({ firstName, lastName, age, photo, studentId });
            await newStudent.save();

            await ctx.reply(`🎉 You have been registered successfully!\nYour student ID is: ${studentId}`);
            return ctx.scene.leave();
        } else if (action === 'cancel_registration') {
            await ctx.reply('❌ Registration has been cancelled.');
            return ctx.scene.leave();
        }
    }
);



// Create Scene Manager
const stage = new Scenes.Stage([registrationWizard]);


bot.use(session());
bot.use(stage.middleware());

// Command: /register (Start Registration Wizard)
bot.hears('Register', (ctx) => ctx.scene.enter('Register'));
