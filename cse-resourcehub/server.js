// server.js - Starts Express server at http://localhost:3000
const express = require('express');
const session = require('express-session');
const path = require('path');
const config = require('./config');
const db = require('./db');

db.setupStorage(); // Ensure /data and /uploads folders exist

const app = express();

app.use(express.json()); // Parse incoming JSON request bodies
app.use(session({
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 } // 7-day session cookie
}));

app.use(express.static(path.join(__dirname, 'public'))); // Serve HTML, CSS & JS

// API routes
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/browse'));
app.use('/api', require('./routes/manage'));

app.use('/api', (req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Server error occurred.' });
});

app.listen(config.PORT, () => console.log('CSE ResourceHub running at http://localhost:' + config.PORT));
