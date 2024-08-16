const express = require('express');
const app = express();
const http = require('http');
const querystring = require('querystring');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const crypto = require('crypto');
const userCol = require('./models/userSchema');

mongoose.set('bufferCommands', false);

function genHash(input) {
  return Buffer.from(crypto.createHash('sha256').update(input).digest('base32')).toString('hex').toUpperCase();
}

app.set('views', './views');
app.set('view engine', 'pug');
app.use(express.static('public'));

app.use(session({
  secret: 'shhhhh',
  saveUninitialized: false,
  resave: false
}));

app.listen(1234, async () => {
    try {
      await mongoose.connect('mongodb://127.0.0.1:27017/BPW', { useUnifiedTopology: true });
      console.log("Database connection successful");
    } catch (e) {
      console.log("Database connection error:", e.message);
    }
    console.log("Server is running...");
  });
function docifyUser(params) {
  let doc = new userCol({
    _id: params._id,
    username: params.username,
    email: params.email,
    password: params.password
  });
  return doc;
}

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/index', (req, res) => {
  res.render('index');
});

app.get('/champions', (req, res) => {
  res.render('champions');
});

app.get('/register', (req, res) => {
    res.render('register');
  });

app.get('/login', (req, res) => {
    res.render('login');
  });

app.get('/draft', (req, res) => {
  if (!req.session.user) {
    console.log('unable to access');
    res.redirect('/login');
  } else {
    console.log("Accessing draft page");
    res.render('draft');
  }
});

app.post('/register', express.urlencoded({ extended: false }), async (req, res) => {
  console.log(req.body.user);
  if (req.body.uname.split(/[;:,-\s ]+/).length > 1) {
    res.render('register', { msg: "Username must be one word" });
  }
  let hashPass = req.body.pword;
  let newUser = docifyUser({ _id: req.body.uname, username: req.body.uname, password: hashPass, email: req.body.email });
  await newUser.save();
  res.redirect('login');
});

app.post('/login', express.urlencoded({ extended: false }), async (req, res) => {
  let untrusted = { user: req.body.uname, password: req.body.pword };
  console.log(untrusted.password);
  try {
    let result = await userCol.findOne({ _id: req.body.uname });
    if (untrusted.password.toString().toUpperCase() == result.password.toString().toUpperCase()) {
      let trusted = { username: result.username.toString() };
      req.session.user = trusted;
      console.log('got it right');
      res.redirect('/draft');
    } else {
      console.log('wrong password');
      res.redirect('/login');
    }
  } catch (err) {
    next(err);
  }
});

app.use('*', (req, res) => {
  res.writeHead(404);
  res.end(`<h1> ERROR 404. ${req.url} NOT FOUND</h1><br><br>`);
});

app.use((err, req, res, next) => {
  res.status(500).render('error', { message: err.message });
});
