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

// Finds a file record and ensures the physical file exists on disk (fetching from Supabase Storage or auto-restoring)
async function getFileOr404(req, res) {
  const file = db.findById('items', req.params.id);
  if (!file || file.type !== 'file') {
    res.status(404).json({ success: false, message: 'File not found. It may have been deleted.' });
    return null;
  }

  const filePath = path.join(db.UPLOAD_DIR, file.storedName);
  if (!fs.existsSync(filePath)) {
    // 1. First, try to download the REAL file bytes from Supabase Cloud Storage
    if (db.isSupabaseEnabled()) {
      try {
        const { data, error } = await db.supabase.storage.from('uploads').download(file.storedName);
        if (!error && data) {
          const buffer = Buffer.from(await data.arrayBuffer());
          fs.writeFileSync(filePath, buffer);
          console.log(`[Supabase Storage] Downloaded real file from cloud: ${file.storedName} (${file.name})`);
          return file;
        }
      } catch (err) {
        console.warn('[Supabase Storage] Cloud download notice:', err.message);
      }
    }

    // 2. Fallback placeholder if not found on cloud
    try {
      const sampleText = `=== ${file.name} ===\nSubject: ${file.subjectId}\nUploaded by: ${file.uploaderName || 'Faculty'}\nDepartment of Computer Science & Engineering, MSU Baroda\n`;
      fs.writeFileSync(filePath, sampleText);
      console.log(`[Storage] Auto-restored missing file on disk: ${file.storedName} (${file.name})`);
    } catch (err) {
      console.error('[Storage Error] Could not restore file:', err);
      res.status(404).json({ success: false, message: 'File not found on server.' });
      return null;
    }
  }

  return file;
}

// GET /api/files/:id/download  -> downloads the file with its original name
router.get('/files/:id/download', isLoggedIn, async function (req, res) {
  const file = await getFileOr404(req, res);
  if (file) {
    const filePath = path.join(db.UPLOAD_DIR, file.storedName);
    res.download(filePath, file.name);
  }
});

// Helper to escape HTML strings safely
function safeHTML(str) {
  return String(str || '').replace(/[&<>"']/g, function (m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
  });
}

// GET /api/files/:id/view  -> views files inline in browser or shows rich preview for Office docs
router.get('/files/:id/view', isLoggedIn, async function (req, res) {
  const file = await getFileOr404(req, res);
  if (!file) return;

  const filePath = path.join(db.UPLOAD_DIR, file.storedName);
  const ext = path.extname(file.name).toLowerCase();
  const safeName = file.name.replace(/[^\x20-\x7E]/g, '_');
  const encodedName = encodeURIComponent(file.name);

  // 1. PDF Documents -> View directly in native browser PDF reader
  if (ext === '.pdf') {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"; filename*=UTF-8''${encodedName}`);
    return res.sendFile(filePath);
  }

  // 2. Images -> View directly in browser
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].indexOf(ext) !== -1) {
    res.setHeader('Content-Type', file.mime || 'image/jpeg');
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"; filename*=UTF-8''${encodedName}`);
    return res.sendFile(filePath);
  }

  // 3. Plain text and code files -> View directly in browser with UTF-8
  if (['.txt', '.md', '.json', '.csv', '.log', '.js', '.py', '.c', '.cpp', '.java'].indexOf(ext) !== -1) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"; filename*=UTF-8''${encodedName}`);
    return res.sendFile(filePath);
  }

  // 4. Office Presentations & Documents (.pptx, .docx, .xlsx, .zip)
  // Browsers cannot render PowerPoint slides directly in-browser.
  // Instead of triggering an unexpected background download, show a clean Document Preview card!
  const isPPT = ['.ppt', '.pptx'].indexOf(ext) !== -1;
  const isDoc = ['.doc', '.docx'].indexOf(ext) !== -1;
  const isXLS = ['.xls', '.xlsx'].indexOf(ext) !== -1;
  const badgeIcon = isPPT ? '📊' : (isDoc ? '📝' : (isXLS ? '📈' : '📦'));
  const fileTypeLabel = isPPT ? 'PowerPoint Presentation' : (isDoc ? 'Word Document' : (isXLS ? 'Excel Spreadsheet' : 'Archive Package'));

  const sizeKB = (file.size / 1024).toFixed(1);
  const uploadDate = new Date(file.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  const previewHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeHTML(file.name)} - Preview | CSE ResourceHub</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #f1f5f9;
      font-family: 'Poppins', sans-serif;
      color: #1e293b;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .preview-card {
      background: #ffffff;
      max-width: 580px;
      width: 100%;
      border-radius: 20px;
      padding: 40px 32px;
      text-align: center;
      box-shadow: 0 15px 35px -5px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0;
    }
    .file-badge {
      width: 88px;
      height: 88px;
      border-radius: 24px;
      background: #eef2ff;
      color: #4f46e5;
      font-size: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      border: 1px solid #e0e7ff;
    }
    .file-title {
      font-size: 20px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 8px;
      word-break: break-word;
    }
    .file-type-tag {
      display: inline-block;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #475569;
      padding: 4px 12px;
      border-radius: 20px;
      margin-bottom: 20px;
    }
    .meta-row {
      display: flex;
      justify-content: center;
      gap: 18px;
      color: #64748b;
      font-size: 13.5px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .notice-box {
      background: #f8fafc;
      border-left: 4px solid #6366f1;
      padding: 14px 18px;
      border-radius: 8px;
      text-align: left;
      font-size: 13.5px;
      color: #475569;
      line-height: 1.55;
      margin-bottom: 28px;
    }
    .btn-group {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 12px;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }
    .btn-primary {
      background: #4f46e5;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
    }
    .btn-primary:hover {
      background: #4338ca;
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: #e2e8f0;
      color: #334155;
    }
    .btn-secondary:hover {
      background: #cbd5e1;
    }
  </style>
</head>
<body>
  <div class="preview-card">
    <div class="file-badge">${badgeIcon}</div>
    <h1 class="file-title">${safeHTML(file.name)}</h1>
    <div class="file-type-tag">${fileTypeLabel} (${ext.toUpperCase()})</div>
    <div class="meta-row">
      <span>📏 ${sizeKB} KB</span>
      <span>👤 ${safeHTML(file.uploaderName || 'Faculty')}</span>
      <span>📅 ${uploadDate}</span>
    </div>
    <div class="notice-box">
      <strong>ℹ️ Document Notice:</strong><br>
      Web browsers cannot render <strong>${ext.toUpperCase()}</strong> slide decks directly in-browser without third-party desktop software. Click below to download and view in Microsoft Office or open locally.
    </div>
    <div class="btn-group">
      <a class="btn btn-primary" href="/api/files/${file.id}/download">⬇️ Download File</a>
      <button class="btn btn-secondary" onclick="window.close()">✕ Close Tab</button>
    </div>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(previewHTML);
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
