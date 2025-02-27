import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

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
 export const Student = mongoose.model('Student', studentSchema);

// Counter Schema for generating student IDs
 const counterSchema = new mongoose.Schema({
    year: String,
    sequence: { type: Number, default: 0 }
});
 const Counter = mongoose.model('Counter', counterSchema);

 const adminSchema = new mongoose.Schema({
    telegramId: String
});
 export const Admin = mongoose.model('Admin', adminSchema);

 const supportSchema = new mongoose.Schema({
    userId: String,
    question: String
});
 const Support = mongoose.model('Support', supportSchema);

// module.exports = {
// Student, Admin, Counter, Support, 
// }