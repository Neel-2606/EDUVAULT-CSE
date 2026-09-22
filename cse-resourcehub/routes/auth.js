// routes/auth.js
// Register, login, logout, "who am I" and change password.

const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const config = require('../config');
const { isLoggedIn } = require('../middleware/auth');

const router = express.Router();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Checks the fields that both registration forms have. Returns an error message, or '' if all good.
function checkCommonFields(name, email, password) {
  if (name.length < 2 || name.length > 60) return 'Please enter your full name.';
  if (!EMAIL_PATTERN.test(email)) return 'Please enter a valid email address.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  const emailTaken = db.readData('users').some(function (u) { return u.email === email; });
  if (emailTaken) return 'This email is already registered.';
  return '';
}

// Saves a new user, logs them in straight away and sends the reply
function saveNewUser(req, res, user) {
  user.id = db.newId();
  user.createdAt = new Date().toISOString();
  const users = db.readData('users');
  users.push(user);
  db.writeData('users', users);

  req.session.userId = user.id;
  res.json({ success: true, message: 'Registration successful. Welcome, ' + user.name + '!', data: db.publicUser(user) });
}

// POST /api/register/student
router.post('/register/student', function (req, res) {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const prn = String(req.body.prn || '').trim();
  const password = String(req.body.password || '');
  const admissionYear = parseInt(req.body.admissionYear, 10);
  const thisYear = db.getAcademicStartYear();

  let error = checkCommonFields(name, email, password);
  if (!error && !/^\d{10}$/.test(prn)) error = 'PRN must be exactly 10 digits.';
  if (!error && db.readData('users').some(function (u) { return u.prn === prn; })) {
    error = 'This PRN is already registered.';
  }
  if (!error && (isNaN(admissionYear) || admissionYear < thisYear - 6 || admissionYear > thisYear)) {
    error = 'Please select a valid admission year.';
  }
  if (error) return res.status(400).json({ success: false, message: error });

  saveNewUser(req, res, {
    role: 'student', name: name, prn: prn, email: email,
    admissionYear: admissionYear, canUploadPYQ: false,
    passwordHash: bcrypt.hashSync(password, 10)
  });
});

// POST /api/register/faculty  (needs the secret faculty code)
router.post('/register/faculty', function (req, res) {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const secretCode = String(req.body.secretCode || '').trim();

  let error = checkCommonFields(name, email, password);
  if (!error && secretCode !== config.FACULTY_SECRET_CODE) {
    error = 'Invalid Faculty Secret Code. Please get the correct code from the department.';
  }
  if (error) return res.status(400).json({ success: false, message: error });

  saveNewUser(req, res, {
    role: 'faculty', name: name, email: email,
    passwordHash: bcrypt.hashSync(password, 10)
  });
});

// POST /api/login  (identifier can be the email or the PRN)
router.post('/login', function (req, res) {
  const identifier = String(req.body.identifier || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  const user = db.readData('users').find(function (u) {
    return u.email === identifier || (u.prn && u.prn === identifier);
  });
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ success: false, message: 'Wrong email/PRN or password.' });
  }

  req.session.userId = user.id;
  res.json({ success: true, message: 'Welcome back, ' + user.name + '!', data: db.publicUser(user) });
});

// POST /api/logout
router.post('/logout', function (req, res) {
  req.session.destroy(function () {
    res.json({ success: true, message: 'Logged out successfully.' });
  });
});

// GET /api/me  -> the logged-in user (every page uses this to know who is logged in)
router.get('/me', isLoggedIn, function (req, res) {
  res.json({ success: true, data: db.publicUser(req.user) });
});

// PUT /api/me/password  -> change own password
router.put('/me/password', isLoggedIn, function (req, res) {
  const oldPassword = String(req.body.oldPassword || '');
  const newPassword = String(req.body.newPassword || '');

  if (!bcrypt.compareSync(oldPassword, req.user.passwordHash)) {
    return res.status(400).json({ success: false, message: 'Current password is wrong.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
  }

  const users = db.readData('users');
  const user = users.find(function (u) { return u.id === req.user.id; });
  user.passwordHash = bcrypt.hashSync(newPassword, 10);
  db.writeData('users', users);
  res.json({ success: true, message: 'Password changed successfully.' });
});

module.exports = router;
