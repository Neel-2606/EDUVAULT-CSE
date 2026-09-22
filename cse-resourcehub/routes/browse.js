// routes/browse.js
// Read-only routes: anyone who is logged in (faculty or student) can use these.

const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { isLoggedIn, canWriteHere } = require('../middleware/auth');

const router = express.Router();
const YEAR_LABELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const SECTION_NAMES = { material: 'Study Material', pyq: 'PYQs', other: 'Other' };

// Counts how many files a subject has
function countFiles(subjectId, items) {
  return items.filter(function (i) { return i.subjectId === subjectId && i.type === 'file'; }).length;
}

// Returns the names of all parent folders of an item, e.g. ["PYQs", "2024"]
function getFolderChain(item, items) {
  const chain = [];
  let current = item;
  while (current) {
    chain.unshift(current);
    const parentId = current.parentId;
    current = parentId ? items.find(function (i) { return i.id === parentId; }) : null;
  }
  return chain;
}

// Builds the clickable path shown above the file list: 2nd Year › Sem 3 › BWP › PYQs › 2024
function buildBreadcrumb(folder, subject, items) {
  const crumbs = [
    { label: YEAR_LABELS[subject.year - 1], link: 'year.html?year=' + subject.year },
    { label: 'Sem ' + subject.semester, link: 'year.html?year=' + subject.year + '#sem-' + subject.semester },
    { label: subject.name, link: 'subject.html?id=' + subject.id }
  ];
  getFolderChain(folder, items).forEach(function (f) {
    crumbs.push({ label: f.name, folderId: f.id });
  });
  return crumbs;
}

// GET /api/years  -> the 4 fixed years with their 2 semesters and subject counts
router.get('/years', isLoggedIn, function (req, res) {
  const subjects = db.readData('subjects');
  const years = [];
  for (let year = 1; year <= 4; year++) {
    const semesters = [year * 2 - 1, year * 2].map(function (sem) {
      const count = subjects.filter(function (s) { return s.semester === sem; }).length;
      return { number: sem, subjectCount: count };
    });
    years.push({
      year: year,
      label: YEAR_LABELS[year - 1],
      semesters: semesters,
      subjectCount: semesters[0].subjectCount + semesters[1].subjectCount
    });
  }
  res.json({ success: true, data: years });
});

// GET /api/subjects?year=2&semester=3  -> list of subjects (with file counts)
router.get('/subjects', isLoggedIn, function (req, res) {
  const year = parseInt(req.query.year, 10);
  const semester = parseInt(req.query.semester, 10);
  const items = db.readData('items');

  const list = db.readData('subjects')
    .filter(function (s) {
      if (year && s.year !== year) return false;
      if (semester && s.semester !== semester) return false;
      return true;
    })
    .map(function (s) { return Object.assign({ fileCount: countFiles(s.id, items) }, s); })
    .sort(function (a, b) { return a.name.localeCompare(b.name); });

  res.json({ success: true, data: list });
});

// GET /api/subjects/:id  -> one subject + the ids of its 3 section folders
router.get('/subjects/:id', isLoggedIn, function (req, res) {
  const subject = db.findById('subjects', req.params.id);
  if (!subject) return res.status(404).json({ success: false, message: 'Subject not found. It may have been deleted.' });

  const items = db.readData('items');
  const roots = {};
  items.forEach(function (i) {
    if (i.subjectId === subject.id && i.isRoot) roots[i.section] = i.id;
  });

  res.json({ success: true, data: { subject: subject, roots: roots, fileCount: countFiles(subject.id, items) } });
});

// GET /api/folders/:id/contents  -> sub-folders, files and breadcrumb of one folder
router.get('/folders/:id/contents', isLoggedIn, function (req, res) {
  const items = db.readData('items');
  const folder = items.find(function (i) { return i.id === req.params.id && i.type === 'folder'; });
  if (!folder) return res.status(404).json({ success: false, message: 'Folder not found. It may have been deleted.' });

  const subject = db.findById('subjects', folder.subjectId);
  const children = items.filter(function (i) { return i.parentId === folder.id; });

  // For each sub-folder also send how many things are inside it (used in the delete warning)
  const folders = children
    .filter(function (i) { return i.type === 'folder'; })
    .map(function (f) { return Object.assign({ itemCount: db.getDescendants(f.id, items).length }, f); });
  const files = children.filter(function (i) { return i.type === 'file'; });

  res.json({
    success: true,
    data: {
      folder: folder,
      subject: subject,
      folders: folders,
      files: files,
      breadcrumb: buildBreadcrumb(folder, subject, items),
      canWrite: canWriteHere(req.user, folder.section),   // may add folders / upload here
      canManage: req.user.role === 'faculty'              // may rename / delete
    }
  });
});

// Finds a file record and checks the real file exists. Sends a 404 reply if not.
function getFileOr404(req, res) {
  const file = db.findById('items', req.params.id);
  if (!file || file.type !== 'file' || !fs.existsSync(path.join(db.UPLOAD_DIR, file.storedName))) {
    res.status(404).json({ success: false, message: 'File not found. It may have been deleted.' });
    return null;
  }
  return file;
}

// GET /api/files/:id/download  -> downloads the file with its original name
router.get('/files/:id/download', isLoggedIn, function (req, res) {
  const file = getFileOr404(req, res);
  if (file) res.download(path.join(db.UPLOAD_DIR, file.storedName), file.name);
});

// GET /api/files/:id/view  -> opens the file inside the browser (PDF, images, text)
router.get('/files/:id/view', isLoggedIn, function (req, res) {
  const file = getFileOr404(req, res);
  if (!file) return;
  res.setHeader('Content-Type', file.mime);
  res.setHeader('Content-Disposition', "inline; filename*=UTF-8''" + encodeURIComponent(file.name));
  res.sendFile(path.join(db.UPLOAD_DIR, file.storedName));
});

// GET /api/search?q=unit&year=2  -> files and folders whose name contains the text
router.get('/search', isLoggedIn, function (req, res) {
  const text = String(req.query.q || '').trim().toLowerCase();
  const year = parseInt(req.query.year, 10);
  if (text.length < 2) return res.status(400).json({ success: false, message: 'Type at least 2 letters to search.' });

  const items = db.readData('items');
  const subjects = db.readData('subjects');
  const results = [];

  items.forEach(function (item) {
    if (item.isRoot || item.name.toLowerCase().indexOf(text) === -1) return;
    const subject = subjects.find(function (s) { return s.id === item.subjectId; });
    if (!subject || (year && subject.year !== year)) return;

    // Path shown under the result, e.g. "2nd Year › BWP › PYQs › 2024"
    const parentNames = getFolderChain(item, items).slice(0, -1).map(function (f) { return f.name; });
    results.push({
      id: item.id,
      type: item.type,
      name: item.name,
      size: item.size,
      path: [YEAR_LABELS[subject.year - 1], subject.name].concat(parentNames).join(' › '),
      link: 'subject.html?id=' + subject.id + '&folder=' + (item.type === 'folder' ? item.id : item.parentId)
    });
  });

  res.json({ success: true, data: results.slice(0, 50) });
});

// GET /api/recent?limit=10  -> newest uploaded files (for the dashboard)
router.get('/recent', isLoggedIn, function (req, res) {
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const subjects = db.readData('subjects');

  const files = db.readData('items')
    .filter(function (i) { return i.type === 'file'; })
    .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); })
    .slice(0, limit)
    .map(function (f) {
      const subject = subjects.find(function (s) { return s.id === f.subjectId; }) || {};
      return {
        id: f.id, name: f.name, size: f.size, createdAt: f.createdAt,
        uploaderName: f.uploaderName, uploaderRole: f.uploaderRole,
        subjectName: subject.name, year: subject.year,
        sectionName: SECTION_NAMES[f.section],
        link: 'subject.html?id=' + f.subjectId + '&folder=' + f.parentId
      };
    });

  res.json({ success: true, data: files });
});

module.exports = router;
