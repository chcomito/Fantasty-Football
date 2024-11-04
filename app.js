const express = require('express');
const http = require('http');
const crypto = require('crypto');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const userCol = require('./models/userSchema'); // Ensure this file exports a valid Mongoose model

const app = express();

// Use environment variables for sensitive information
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://chcomito:Ynt2dVJjR5Vbm8o9@cluster0.cpeyh.mongodb.net/';
const sessionSecret = process.env.SESSION_SECRET || 'shhhhh';

// Configure Mongoose
mongoose.set('bufferCommands', false);

(async () => {
  try {
    await mongoose.connect(mongoUri, { useUnifiedTopology: true, useNewUrlParser: true });
    console.log("Database connection successful");
  } catch (e) {
    console.log("Database connection error:", e.message);
    process.exit(1); // Exit the process if database connection fails
  }
})();

app.set('views', './views');
app.set('view engine', 'pug');
app.use(express.static('public'));

app.use(session({
  secret: sessionSecret,
  saveUninitialized: false,
  resave: false,
}));

app.use(express.urlencoded({ extended: false })); // Updated middleware usage

// Generate hash
function genHash(input) {
  return crypto.createHash('sha256').update(input).digest('hex').toUpperCase();
}

// Define routes
app.get('/', (req, res) => res.render('index'));
app.get('/index', (req, res) => res.render('index'));
app.get('/champions', (req, res) => res.render('champions'));
app.get('/register', (req, res) => res.render('register'));
app.get('/login', (req, res) => res.render('login'));
app.get('/draft', (req, res) => {
  if (!req.session.user) {
    console.log('Unable to access');
    res.redirect('/login');
  } else {
    console.log("Accessing draft page");
    res.render('draft');
  }
});

// Register route
app.post('/register', async (req, res) => {
  const { uname, pword, email } = req.body;
  if (uname.split(/[;:,-\s ]+/).length > 1) {
    return res.render('register', { msg: "Username must be one word" });
  }

  const hashPass = genHash(pword); // Ensure hashing
  try {
    const newUser = new userCol({ _id: uname, username: uname, password: hashPass, email });
    await newUser.save();
    res.redirect('login');
  } catch (err) {
    console.error('Error saving user:', err);
    res.status(500).render('error', { message: 'Error saving user' });
  }
});

// Login route
app.post('/login', async (req, res, next) => {
  const { uname, pword } = req.body;
  try {
    const user = await userCol.findOne({ _id: uname });
    if (user && user.password === genHash(pword)) {
      req.session.user = { username: user.username };
      console.log('Login successful');
      res.redirect('/draft');
    } else {
      console.log('Wrong password');
      res.redirect('/login');
    }
  } catch (err) {
    next(err); // Pass error to error handler
  }
});

// Error handling
app.use('*', (req, res) => {
  res.status(404).send(`<h1>ERROR 404. ${req.url} NOT FOUND</h1>`);
});

app.use((err, req, res, next) => {
  res.status(500).render('error', { message: err.message });
});

// Start the server
app.listen(1234, () => {
  console.log("Server is running on port 1234...");
});

