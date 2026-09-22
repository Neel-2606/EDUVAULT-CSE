// middleware/auth.js
// Small functions that check WHO is calling an API before the route runs.
// These checks happen on the server, so hiding a button in the browser is never the only protection.

const db = require('../db');

// Allows the request only if someone is logged in.
// The user is loaded fresh from users.json every time, so if a faculty member
// revokes a student's PYQ permission, it takes effect on the very next request.
function isLoggedIn(req, res, next) {
  const user = req.session.userId ? db.findById('users', req.session.userId) : null;
  if (!user) {
    return res.status(401).json({ success: false, message: 'Please login first.' });
  }
  req.user = user;
  next();
}

// Allows the request only if the logged-in user is a faculty member
function isFaculty(req, res, next) {
  isLoggedIn(req, res, function () {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ success: false, message: 'Permission denied. Only faculty can do this.' });
    }
    next();
  });
}

// Can this user ADD folders/files in this section ("material", "pyq" or "other")?
// - Faculty: everywhere
// - Student: only in PYQs, and only if faculty gave them permission
function canWriteHere(user, section) {
  if (user.role === 'faculty') return true;
  return user.role === 'student' && section === 'pyq' && user.canUploadPYQ === true;
}

module.exports = { isLoggedIn, isFaculty, canWriteHere };
