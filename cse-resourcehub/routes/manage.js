// routes/manage.js
// Routes that CHANGE data: subjects, folders, files, uploads and student permissions.

const express = require('express');
const path = require('path');
const multer = require('multer');
const db = require('../db');
const config = require('../config');
const { isLoggedIn, isFaculty, canWriteHere } = require('../middleware/auth');

const router = express.Router();
const SECTIONS = [
  { section: 'material', name: 'Study Material' },
  { section: 'pyq', name: 'PYQs' },
  { section: 'other', name: 'Other' }
];

/* ---------- Helpers ---------- */

// Cleans a subject/folder/file name. Returns { name } if valid or { error } if not.
function checkName(rawName) {
  const name = String(rawName || '').trim();
  if (name.length < 1 || name.length > 60) return { error: 'Name must be 1 to 60 characters long.' };
  if (/[\/\\<>:"|?*]/.test(name)) return { error: 'Name cannot contain / \\ < > : " | ? *' };
  return { name: name };
}

// Does this folder already have a child with the same name and type?
function nameExists(items, parentId, type, name, skipId) {
  return items.some(function (i) {
    return i.parentId === parentId && i.type === type && i.id !== skipId &&
           i.name.toLowerCase() === name.toLowerCase();
  });
}

// If "notes.pdf" already exists in the folder, returns "notes (1).pdf", "notes (2).pdf" ...
function makeUniqueName(name, parentId, items, skipId) {
  const ext = path.extname(name);
  const base = name.slice(0, name.length - ext.length);
  let finalName = name;
  let number = 1;
  while (nameExists(items, parentId, 'file', finalName, skipId)) {
    finalName = base + ' (' + number + ')' + ext;
    number++;
  }
  return finalName;
}

// Sends a JSON error reply
function sendError(res, status, message) {
  res.status(status).json({ success: false, message: message });
}

/* ---------- Subjects (faculty only) ---------- */

// POST /api/subjects  -> creates a subject AND its 3 fixed sections
router.post('/subjects', isFaculty, function (req, res) {
  const checked = checkName(req.body.name);
  const semester = parseInt(req.body.semester, 10);
  if (checked.error) return sendError(res, 400, checked.error);
  if (!(semester >= 1 && semester <= 8)) return sendError(res, 400, 'Please choose a semester from 1 to 8.');

  const subjects = db.readData('subjects');
  const duplicate = subjects.some(function (s) {
    return s.semester === semester && s.name.toLowerCase() === checked.name.toLowerCase();
  });
  if (duplicate) return sendError(res, 400, 'A subject with this name already exists in Semester ' + semester + '.');

  const subject = {
    id: db.newId(),
    name: checked.name,
    code: String(req.body.code || '').trim().toUpperCase().slice(0, 15),
    year: Math.ceil(semester / 2),
    semester: semester,
    facultyName: String(req.body.facultyName || '').trim().slice(0, 60) || req.user.name,
    createdBy: req.user.id,
    createdAt: new Date().toISOString()
  };
  subjects.push(subject);
  db.writeData('subjects', subjects);

  // Every subject automatically gets Study Material, PYQs and Other
  const items = db.readData('items');
  SECTIONS.forEach(function (s) {
    items.push({
      id: db.newId(), type: 'folder', name: s.name, subjectId: subject.id, section: s.section,
      parentId: null, isRoot: true, createdBy: req.user.id, createdAt: subject.createdAt
    });
  });
  db.writeData('items', items);

  res.json({ success: true, message: 'Subject "' + subject.name + '" created.', data: subject });
});

// PUT /api/subjects/:id  -> edit subject details
router.put('/subjects/:id', isFaculty, function (req, res) {
  const subjects = db.readData('subjects');
  const subject = subjects.find(function (s) { return s.id === req.params.id; });
  if (!subject) return sendError(res, 404, 'Subject not found.');

  const checked = checkName(req.body.name);
  const semester = parseInt(req.body.semester, 10);
  if (checked.error) return sendError(res, 400, checked.error);
  if (!(semester >= 1 && semester <= 8)) return sendError(res, 400, 'Please choose a semester from 1 to 8.');

  subject.name = checked.name;
  subject.code = String(req.body.code || '').trim().toUpperCase().slice(0, 15);
  subject.semester = semester;
  subject.year = Math.ceil(semester / 2);
  subject.facultyName = String(req.body.facultyName || '').trim().slice(0, 60) || subject.facultyName;
  db.writeData('subjects', subjects);

  res.json({ success: true, message: 'Subject updated.', data: subject });
});

// DELETE /api/subjects/:id  -> deletes the subject with ALL its folders and files
router.delete('/subjects/:id', isFaculty, function (req, res) {
  const subjects = db.readData('subjects');
  const subject = subjects.find(function (s) { return s.id === req.params.id; });
  if (!subject) return sendError(res, 404, 'Subject not found.');

  const idsToDelete = db.readData('items')
    .filter(function (i) { return i.subjectId === subject.id; })
    .map(function (i) { return i.id; });
  db.removeItems(idsToDelete);
  db.writeData('subjects', subjects.filter(function (s) { return s.id !== subject.id; }));

  res.json({ success: true, message: 'Subject "' + subject.name + '" deleted.' });
});

/* ---------- Folders ---------- */

// POST /api/folders  -> new folder (faculty anywhere, permitted students only inside PYQs)
router.post('/folders', isLoggedIn, function (req, res) {
  const items = db.readData('items');
  const parent = items.find(function (i) { return i.id === req.body.parentId && i.type === 'folder'; });
  if (!parent) return sendError(res, 404, 'Parent folder not found.');
  if (!canWriteHere(req.user, parent.section)) return sendError(res, 403, 'Permission denied. You cannot create folders here.');

  const checked = checkName(req.body.name);
  if (checked.error) return sendError(res, 400, checked.error);
  if (nameExists(items, parent.id, 'folder', checked.name)) return sendError(res, 400, 'A folder with this name already exists here.');

  const folder = {
    id: db.newId(), type: 'folder', name: checked.name, subjectId: parent.subjectId,
    section: parent.section, parentId: parent.id, isRoot: false,
    createdBy: req.user.id, createdAt: new Date().toISOString()
  };
  items.push(folder);
  db.writeData('items', items);
  res.json({ success: true, message: 'Folder "' + folder.name + '" created.', data: folder });
});

// PUT /api/folders/:id  -> rename a folder (the 3 section folders cannot be renamed)
router.put('/folders/:id', isFaculty, function (req, res) {
  const items = db.readData('items');
  const folder = items.find(function (i) { return i.id === req.params.id && i.type === 'folder'; });
  if (!folder) return sendError(res, 404, 'Folder not found.');
  if (folder.isRoot) return sendError(res, 400, 'The main sections cannot be renamed.');

  const checked = checkName(req.body.name);
  if (checked.error) return sendError(res, 400, checked.error);
  if (nameExists(items, folder.parentId, 'folder', checked.name, folder.id)) return sendError(res, 400, 'A folder with this name already exists here.');

  folder.name = checked.name;
  db.writeData('items', items);
  res.json({ success: true, message: 'Folder renamed.', data: folder });
});

// DELETE /api/folders/:id  -> deletes the folder and everything inside it
router.delete('/folders/:id', isFaculty, function (req, res) {
  const items = db.readData('items');
  const folder = items.find(function (i) { return i.id === req.params.id && i.type === 'folder'; });
  if (!folder) return sendError(res, 404, 'Folder not found.');
  if (folder.isRoot) return sendError(res, 400, 'The main sections cannot be deleted.');

  const inside = db.getDescendants(folder.id, items).map(function (i) { return i.id; });
  db.removeItems([folder.id].concat(inside));
  res.json({ success: true, message: 'Folder "' + folder.name + '" deleted.' });
});

/* ---------- Files (faculty only for rename / delete) ---------- */

// PUT /api/files/:id  -> rename a file (keeps the old extension if none is typed)
router.put('/files/:id', isFaculty, function (req, res) {
  const items = db.readData('items');
  const file = items.find(function (i) { return i.id === req.params.id && i.type === 'file'; });
  if (!file) return sendError(res, 404, 'File not found.');

  const checked = checkName(req.body.name);
  if (checked.error) return sendError(res, 400, checked.error);

  let newName = checked.name;
  if (path.extname(newName) === '') newName += path.extname(file.name);
  file.name = makeUniqueName(newName, file.parentId, items, file.id);
  db.writeData('items', items);
  res.json({ success: true, message: 'File renamed.', data: file });
});

// DELETE /api/files/:id  -> removes the record and the real file from /uploads
router.delete('/files/:id', isFaculty, function (req, res) {
  const file = db.findById('items', req.params.id);
  if (!file || file.type !== 'file') return sendError(res, 404, 'File not found.');
  db.removeItems([file.id]);
  res.json({ success: true, message: 'File "' + file.name + '" deleted.' });
});

/* ---------- Upload ---------- */

// multer saves files on disk with a generated name like "1719999999-8k2j5a.pdf".
// The user's own file name is never used as a path (prevents path traversal).
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, db.UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext);
  }
});

// Only allowed file types get through
function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (config.ALLOWED_EXT.indexOf(ext) === -1) {
    const error = new Error('File type not allowed: ' + file.originalname);
    error.code = 'BAD_FILE_TYPE';
    return cb(error);
  }
  cb(null, true);
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: config.MAX_FILE_SIZE, files: config.MAX_FILES }
});

// Runs multer and turns its errors into friendly messages
function receiveFiles(req, res, next) {
  upload.array('files', config.MAX_FILES)(req, res, function (err) {
    if (!err) return next();
    let message = 'Upload failed. Please try again.';
    if (err.code === 'LIMIT_FILE_SIZE') message = 'File too large. Maximum size is 25 MB per file.';
    if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') message = 'You can upload at most 10 files at a time.';
    if (err.code === 'BAD_FILE_TYPE') message = err.message + '. Allowed: ' + config.ALLOWED_EXT.join(' ');
    sendError(res, 400, message);
  });
}

// POST /api/upload  (form fields: parentId + files)
router.post('/upload', isLoggedIn, receiveFiles, function (req, res) {
  const files = req.files || [];
  const items = db.readData('items');
  const parent = items.find(function (i) { return i.id === req.body.parentId && i.type === 'folder'; });

  // Decide if the upload is allowed. If not, delete the files multer already saved.
  let status = 0;
  let message = '';
  if (!parent) { status = 404; message = 'Folder not found. It may have been deleted.'; }
  else if (!canWriteHere(req.user, parent.section)) { status = 403; message = 'Permission denied. You cannot upload here.'; }
  else if (files.length === 0) { status = 400; message = 'Please choose at least one file.'; }
  if (status) {
    files.forEach(function (f) { db.deleteUploadedFile(f.filename); });
    return sendError(res, status, message);
  }

  files.forEach(function (f) {
    // Browsers send the name as latin1, this converts it back so names like "नोट्स.pdf" stay correct
    const originalName = path.basename(Buffer.from(f.originalname, 'latin1').toString('utf8'));
    items.push({
      id: db.newId(), type: 'file',
      name: makeUniqueName(originalName, parent.id, items),
      storedName: f.filename, size: f.size, mime: f.mimetype,
      subjectId: parent.subjectId, section: parent.section, parentId: parent.id,
      uploadedBy: req.user.id, uploaderName: req.user.name, uploaderRole: req.user.role,
      createdAt: new Date().toISOString()
    });
  });
  db.writeData('items', items);
  res.json({ success: true, message: files.length + ' file(s) uploaded successfully.' });
});

/* ---------- Students & PYQ permission (faculty only) ---------- */

// GET /api/students?search=neel&year=2
router.get('/students', isFaculty, function (req, res) {
  const search = String(req.query.search || '').trim().toLowerCase();
  const year = parseInt(req.query.year, 10);

  const students = db.readData('users')
    .filter(function (u) { return u.role === 'student'; })
    .map(db.publicUser)
    .filter(function (s) {
      if (year && s.currentYear !== year) return false;
      return !search || s.name.toLowerCase().indexOf(search) !== -1 || s.prn.indexOf(search) !== -1;
    })
    .sort(function (a, b) { return a.currentYear - b.currentYear || a.name.localeCompare(b.name); });

  res.json({ success: true, data: students });
});

// PUT /api/students/:id/pyq-permission  body: { allow: true / false }
router.put('/students/:id/pyq-permission', isFaculty, function (req, res) {
  const users = db.readData('users');
  const student = users.find(function (u) { return u.id === req.params.id && u.role === 'student'; });
  if (!student) return sendError(res, 404, 'Student not found.');

  student.canUploadPYQ = req.body.allow === true;
  db.writeData('users', users);
  const message = student.canUploadPYQ
    ? student.name + ' can now upload PYQs.'
    : 'PYQ upload access removed for ' + student.name + '.';
  res.json({ success: true, message: message, data: db.publicUser(student) });
});

module.exports = router;
