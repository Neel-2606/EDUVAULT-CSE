// db.js
// Dual Data Layer: Supabase (PostgreSQL Cloud) + Local JSON Storage
// Seamless two-way sync: cloud-persistent data + zero-latency local fallback.

const fs = require('fs');
const path = require('path');
const config = require('./config');
const supabase = require('./supabase');

const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const TABLES = ['users', 'subjects', 'items'];

// In-memory cache to ensure zero-latency synchronous operations for Express routes
const memoryCache = {
  users: [],
  subjects: [],
  items: []
};

// Full path of a JSON file, e.g. getFilePath('users') -> .../data/users.json
function getFilePath(name) {
  return path.join(DATA_DIR, name + '.json');
}

/* ========================================================
   Mapping Helpers (PostgreSQL snake_case <-> JS camelCase)
   ======================================================== */

function userToCamel(row) {
  if (!row) return null;
  return {
    id: row.id,
    role: row.role,
    name: row.name,
    email: row.email,
    prn: row.prn || null,
    admissionYear: row.admission_year || null,
    canUploadPYQ: Boolean(row.can_upload_pyq),
    passwordHash: row.password_hash,
    createdAt: row.created_at
  };
}

function userToSnake(user) {
  return {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    prn: user.prn || null,
    admission_year: user.admissionYear ? parseInt(user.admissionYear, 10) : null,
    can_upload_pyq: Boolean(user.canUploadPYQ),
    password_hash: user.passwordHash,
    created_at: user.createdAt || new Date().toISOString()
  };
}

function subjectToCamel(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    code: row.code || '',
    year: row.year,
    semester: row.semester,
    facultyName: row.faculty_name || '',
    createdBy: row.created_by || null,
    createdAt: row.created_at
  };
}

function subjectToSnake(subject) {
  return {
    id: subject.id,
    name: subject.name,
    code: subject.code || '',
    year: parseInt(subject.year, 10),
    semester: parseInt(subject.semester, 10),
    faculty_name: subject.facultyName || '',
    created_by: subject.createdBy || null,
    created_at: subject.createdAt || new Date().toISOString()
  };
}

function itemToCamel(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    subjectId: row.subject_id,
    section: row.section,
    parentId: row.parent_id || null,
    isRoot: Boolean(row.is_root),
    storedName: row.stored_name || null,
    size: row.size ? parseInt(row.size, 10) : 0,
    mime: row.mime || null,
    uploadedBy: row.uploaded_by || null,
    uploaderName: row.uploader_name || null,
    uploaderRole: row.uploader_role || null,
    createdBy: row.created_by || null,
    createdAt: row.created_at
  };
}

function itemToSnake(item) {
  return {
    id: item.id,
    type: item.type,
    name: item.name,
    subject_id: item.subjectId,
    section: item.section,
    parent_id: item.parentId || null,
    is_root: Boolean(item.isRoot),
    stored_name: item.storedName || null,
    size: item.size ? parseInt(item.size, 10) : 0,
    mime: item.mime || null,
    uploaded_by: item.uploadedBy || null,
    uploader_name: item.uploaderName || null,
    uploader_role: item.uploaderRole || null,
    created_by: item.createdBy || null,
    created_at: item.createdAt || new Date().toISOString()
  };
}

function isSupabaseEnabled() {
  const url = process.env.SUPABASE_URL || config.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY || config.SUPABASE_KEY;
  return Boolean(url && key && supabase && typeof supabase.from === 'function');
}

/* ========================================================
   Two-Way Supabase Synchronization
   ======================================================== */

// Pulls fresh data from Supabase and merges with local data
async function syncFromSupabase() {
  if (!isSupabaseEnabled()) return false;
  try {
    const [usersRes, subjectsRes, itemsRes] = await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: true }),
      supabase.from('subjects').select('*').order('created_at', { ascending: true }),
      supabase.from('items').select('*').order('created_at', { ascending: true })
    ]);

    if (usersRes.error) throw usersRes.error;
    if (subjectsRes.error) throw subjectsRes.error;
    if (itemsRes.error) throw itemsRes.error;

    memoryCache.users = (usersRes.data || []).map(userToCamel);
    memoryCache.subjects = (subjectsRes.data || []).map(subjectToCamel);
    memoryCache.items = (itemsRes.data || []).map(itemToCamel);

    // Save snapshot to local JSON files
    TABLES.forEach(function (name) {
      fs.writeFileSync(getFilePath(name), JSON.stringify(memoryCache[name], null, 2));
    });

    console.log('[Supabase] Loaded from Cloud: ' +
      memoryCache.users.length + ' users, ' +
      memoryCache.subjects.length + ' subjects, ' +
      memoryCache.items.length + ' items.');
    return true;
  } catch (err) {
    console.error('[Supabase] syncFromSupabase error:', err.message);
    return false;
  }
}

// Pushes all local records to Supabase (e.g., users created locally that aren't in Supabase yet)
async function syncTwoWay() {
  if (!isSupabaseEnabled()) return false;
  try {
    console.log('[Supabase] Starting bidirectional sync with Supabase cloud...');

    // 1. Fetch remote records from Supabase
    const [remoteUsers, remoteSubjects, remoteItems] = await Promise.all([
      supabase.from('users').select('id, email'),
      supabase.from('subjects').select('id'),
      supabase.from('items').select('id')
    ]);

    if (remoteUsers.error) throw remoteUsers.error;

    const existingUserIds = new Set((remoteUsers.data || []).map(function (u) { return u.id; }));
    const existingUserEmails = new Set((remoteUsers.data || []).map(function (u) { return u.email.toLowerCase(); }));
    const existingSubjectIds = new Set((remoteSubjects.data || []).map(function (s) { return s.id; }));
    const existingItemIds = new Set((remoteItems.data || []).map(function (i) { return i.id; }));

    // 2. Identify local users missing in Supabase (like newly registered students)
    const localUsers = memoryCache.users || [];
    const missingUsers = localUsers.filter(function (u) {
      return !existingUserIds.has(u.id) && !existingUserEmails.has(u.email.toLowerCase());
    });

    if (missingUsers.length > 0) {
      console.log(`[Supabase] Pushing ${missingUsers.length} local user(s) to Supabase (${missingUsers.map(function (u) { return u.name; }).join(', ')})...`);
      const { error } = await supabase.from('users').upsert(missingUsers.map(userToSnake), { onConflict: 'id' });
      if (error) {
        console.error('[Supabase] Error uploading missing users:', error.message);
      } else {
        console.log('[Supabase] Missing local user(s) successfully pushed to Supabase!');
      }
    }

    // 3. Identify local subjects missing in Supabase
    const localSubjects = memoryCache.subjects || [];
    const missingSubjects = localSubjects.filter(function (s) {
      return !existingSubjectIds.has(s.id);
    });

    if (missingSubjects.length > 0) {
      console.log(`[Supabase] Pushing ${missingSubjects.length} local subject(s) to Supabase...`);
      await supabase.from('subjects').upsert(missingSubjects.map(subjectToSnake), { onConflict: 'id' });
    }

    // 4. Identify local items missing in Supabase
    const localItems = memoryCache.items || [];
    const missingItems = localItems.filter(function (i) {
      return !existingItemIds.has(i.id);
    });

    if (missingItems.length > 0) {
      console.log(`[Supabase] Pushing ${missingItems.length} local item(s) to Supabase...`);
      // Insert in dependency order: roots first, then children
      const roots = missingItems.filter(function (i) { return !i.parentId; });
      const children = missingItems.filter(function (i) { return i.parentId; });
      if (roots.length > 0) await supabase.from('items').upsert(roots.map(itemToSnake), { onConflict: 'id' });
      if (children.length > 0) await supabase.from('items').upsert(children.map(itemToSnake), { onConflict: 'id' });
    }

    // 5. Finally, reload merged data from Supabase so memoryCache and JSON are 100% in sync
    await syncFromSupabase();
    return true;
  } catch (err) {
    console.error('[Supabase] Two-way sync error:', err.message);
    return false;
  }
}

// Pushes all local records to Supabase explicitly
async function syncToSupabase() {
  if (!isSupabaseEnabled()) return false;
  try {
    const users = memoryCache.users.map(userToSnake);
    const subjects = memoryCache.subjects.map(subjectToSnake);
    const items = memoryCache.items.map(itemToSnake);

    if (users.length > 0) {
      const { error } = await supabase.from('users').upsert(users, { onConflict: 'id' });
      if (error) throw error;
    }
    if (subjects.length > 0) {
      const { error } = await supabase.from('subjects').upsert(subjects, { onConflict: 'id' });
      if (error) throw error;
    }
    if (items.length > 0) {
      const roots = items.filter(function (i) { return !i.parent_id; });
      const children = items.filter(function (i) { return i.parent_id; });
      if (roots.length > 0) await supabase.from('items').upsert(roots, { onConflict: 'id' });
      if (children.length > 0) await supabase.from('items').upsert(children, { onConflict: 'id' });
    }

    console.log('[Supabase] All local records successfully pushed to Supabase!');
    return true;
  } catch (err) {
    console.error('[Supabase] syncToSupabase error:', err.message);
    return false;
  }
}

/* ========================================================
   Storage Setup & Core CRUD Operations
   ======================================================== */

function setupStorage() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

  // Initialize local JSON files if missing, and load into memoryCache
  TABLES.forEach(function (name) {
    const filePath = getFilePath(name);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]');
    }
    try {
      const text = fs.readFileSync(filePath, 'utf8');
      memoryCache[name] = text.trim() === '' ? [] : JSON.parse(text);
    } catch (e) {
      memoryCache[name] = [];
    }
  });

  // If Supabase is configured, run bidirectional sync
  if (isSupabaseEnabled()) {
    syncTwoWay().catch(function (err) {
      console.warn('[Supabase] Initial sync warning:', err.message);
    });
  }
}

// Reads data synchronously from memory cache
function readData(name) {
  if (memoryCache[name] && memoryCache[name].length > 0) {
    return memoryCache[name];
  }
  try {
    const text = fs.readFileSync(getFilePath(name), 'utf8');
    if (text.trim() === '') return [];
    const list = JSON.parse(text);
    memoryCache[name] = list;
    return list;
  } catch (e) {
    return [];
  }
}

// Saves data into memory cache, writes to local JSON, and pushes to Supabase in real time
function writeData(name, list) {
  memoryCache[name] = list;
  fs.writeFileSync(getFilePath(name), JSON.stringify(list, null, 2));

  // Sync to Supabase in the background
  if (isSupabaseEnabled()) {
    let payload = [];
    if (name === 'users') payload = list.map(userToSnake);
    else if (name === 'subjects') payload = list.map(subjectToSnake);
    else if (name === 'items') payload = list.map(itemToSnake);

    if (payload.length > 0) {
      supabase.from(name).upsert(payload, { onConflict: 'id' })
        .then(function (res) {
          if (res.error) console.error('[Supabase] writeData error for ' + name + ':', res.error.message);
          else console.log('[Supabase] ' + name + ' updated in Supabase cloud (' + payload.length + ' rows).');
        })
        .catch(function (err) {
          console.error('[Supabase] writeData failed for ' + name + ':', err.message);
        });
    }
  }
}

// Finds one record by its id, or returns null
function findById(name, id) {
  const record = readData(name).find(function (row) { return row.id === id; });
  return record || null;
}

// Makes a short unique id like "lx2k9a3f"
function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// The academic year starts in July
function getAcademicStartYear() {
  const today = new Date();
  return today.getMonth() >= 6 ? today.getFullYear() : today.getFullYear() - 1;
}

// Works out a student's current year of study (1 to 4) from their admission year
function getStudyYear(admissionYear) {
  const year = getAcademicStartYear() - admissionYear + 1;
  return {
    currentYear: Math.min(Math.max(year, 1), 4),
    isAlumni: year > 4
  };
}

// Returns a copy of the user that is safe to send to the browser (no password hash)
function publicUser(user) {
  const copy = Object.assign({}, user);
  delete copy.passwordHash;
  if (user.role === 'student') {
    const info = getStudyYear(user.admissionYear);
    copy.currentYear = info.currentYear;
    copy.isAlumni = info.isAlumni;
  }
  return copy;
}

// Returns every folder and file that is somewhere inside the given folder (all levels)
function getDescendants(folderId, items) {
  let result = [];
  items.forEach(function (item) {
    if (item.parentId === folderId) {
      result.push(item);
      if (item.type === 'folder') {
        result = result.concat(getDescendants(item.id, items));
      }
    }
  });
  return result;
}

// Deletes one real file from the /uploads folder
function deleteUploadedFile(storedName) {
  if (!storedName) return;
  const filePath = path.join(UPLOAD_DIR, storedName);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

// Removes items from database and deletes their physical files
function removeItems(idList) {
  const keep = [];
  readData('items').forEach(function (item) {
    if (idList.indexOf(item.id) === -1) {
      keep.push(item);
    } else if (item.type === 'file') {
      deleteUploadedFile(item.storedName);
    }
  });

  memoryCache.items = keep;
  fs.writeFileSync(getFilePath('items'), JSON.stringify(keep, null, 2));

  // Also delete from Supabase
  if (isSupabaseEnabled() && idList.length > 0) {
    supabase.from('items').delete().in('id', idList)
      .then(function (res) {
        if (res.error) console.error('[Supabase] delete error:', res.error.message);
        else console.log('[Supabase] Deleted ' + idList.length + ' item(s) from Supabase.');
      })
      .catch(function (err) {
        console.error('[Supabase] delete failed:', err.message);
      });
  }
}

module.exports = {
  UPLOAD_DIR,
  setupStorage,
  readData,
  writeData,
  findById,
  newId,
  getAcademicStartYear,
  getStudyYear,
  publicUser,
  getDescendants,
  deleteUploadedFile,
  removeItems,
  syncFromSupabase,
  syncToSupabase,
  syncTwoWay,
  isSupabaseEnabled,
  supabase
};
