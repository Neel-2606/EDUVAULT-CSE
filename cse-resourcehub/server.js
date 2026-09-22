// server.js
// Starting point of CSE ResourceHub. Run with:  node server.js

const express = require('express');
const session = require('express-session');
const path = require('path');
const config = require('./config');
const db = require('./db');

// Make sure /data and /uploads exist before anything else
db.setupStorage();

const app = express();

// Read JSON sent by the browser (req.body)
app.use(express.json());

// Login sessions: the browser keeps a cookie, the server remembers who it belongs to
app.use(session({
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 }   // stay logged in for 7 days
}));

// The HTML, CSS and JS pages
app.use(express.static(path.join(__dirname, 'public')));

// All API routes start with /api
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/browse'));
app.use('/api', require('./routes/manage'));

// Unknown API address
app.use('/api', function (req, res) {
  res.status(404).json({ success: false, message: 'API route not found.' });
});

// Central error handler, so the server never crashes on bad input
app.use(function (err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid data sent to the server.' });
  }
  console.error(err);
  res.status(500).json({ success: false, message: 'Something went wrong on the server.' });
});

app.listen(config.PORT, function () {
  console.log('CSE ResourceHub is running at http://localhost:' + config.PORT);
});
