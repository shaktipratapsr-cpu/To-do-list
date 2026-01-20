
import dotenv from 'dotenv';
dotenv.config();
console.log('ENV FILE PATH:', process.env.PWD || process.cwd());
console.log('MONGO_URI:', process.env.MONGO_URI);

import express from 'express';
import path from 'path';
import connectDB from './connectDB.js';
import mongoose from 'mongoose';
// ...existing code...


const app = express();
const publicPath = path.resolve('public');
app.use(express.static(publicPath));
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

// ...existing code...



// Connect to DB then start server
connectDB().then(() => {
	app.get('/', async (req, resp) => {
		const tasks = await mongoose.connection.collection('todolist').find().sort({ createdAt: -1 }).toArray();
		resp.render('list', { tasks });
	});

	app.get('/add', (req, resp) => {
		resp.render('add');
	});

	app.post('/add', async (req, resp) => {
		const { title, description } = req.body;
		if (!title) {
			return resp.render('add', { error: 'Title is required.' });
		}
		await mongoose.connection.collection('todolist').insertOne({ title, description, createdAt: new Date() });
		resp.redirect('/');
	});

	// Show all tasks to select for update
	app.get('/update', async (req, resp) => {
		const tasks = await mongoose.connection.collection('todolist').find().sort({ createdAt: -1 }).toArray();
		resp.render('update', { tasks: tasks || [], task: null, error: null });
	});

	// Show form to update a specific task
	app.get('/update/:id', async (req, resp) => {
		const { ObjectId } = mongoose.Types;
		const tasks = await mongoose.connection.collection('todolist').find().sort({ createdAt: -1 }).toArray();
		const task = await mongoose.connection.collection('todolist').findOne({ _id: new ObjectId(req.params.id) });
		if (!task) {
			return resp.render('update', { tasks: tasks || [], task: null, error: 'Task not found.' });
		}
		resp.render('update', { tasks: tasks || [], task, error: null });
	});

	// Handle update form submission
	app.post('/update/:id', async (req, resp) => {
		const { ObjectId } = mongoose.Types;
		const { title, description } = req.body;
		const tasks = await mongoose.connection.collection('todolist').find().sort({ createdAt: -1 }).toArray();
		try {
			const result = await mongoose.connection.collection('todolist').findOneAndUpdate(
				{ _id: new ObjectId(req.params.id) },
				{ $set: { title, description } },
				{ returnDocument: 'after' }
			);
			if (!result.value) {
				return resp.render('update', { tasks: tasks || [], task: null, error: 'Task not found.' });
			}
			resp.redirect('/');
		} catch (err) {
			const task = await mongoose.connection.collection('todolist').findOne({ _id: new ObjectId(req.params.id) });
			resp.render('update', { tasks: tasks || [], task, error: 'Update failed. Title is required.' });
		}
	});

	const PORT = process.env.PORT || 5000;
	app.listen(PORT, () => {
		console.log(`Server running on http://localhost:${PORT}`);
	});
});