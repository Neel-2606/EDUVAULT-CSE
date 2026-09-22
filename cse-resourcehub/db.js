// db.js
// Our small "database". All data is stored in JSON files inside the /data folder,
// the same way we read student.json in the Node.js lab. Uploaded files are kept in /uploads.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const TABLES = ['users', 'subjects', 'items'];

// Full path of a JSON file, e.g. getFilePath('users') -> .../data/users.json
function getFilePath(name) {
  return path.join(DATA_DIR, name + '.json');
}

// Creates the data + uploads folders and empty JSON files if they are missing
function setupStorage() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
  TABLES.forEach(function (name) {
    if (!fs.existsSync(getFilePath(name))) fs.writeFileSync(getFilePath(name), '[]');
  });
}

// Reads a whole JSON file and returns it as an array
function readData(name) {
  const text = fs.readFileSync(getFilePath(name), 'utf8');
  if (text.trim() === '') return [];
  return JSON.parse(text);
}

// Saves the whole array back into its JSON file (pretty printed so it is readable)
function writeData(name, list) {
  fs.writeFileSync(getFilePath(name), JSON.stringify(list, null, 2));
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

// The academic year starts in July. In Sept 2026 this returns 2026, in March 2026 it returns 2025.
function getAcademicStartYear() {
  const today = new Date();
  return today.getMonth() >= 6 ? today.getFullYear() : today.getFullYear() - 1;
}

// Works out a student's current year of study (1 to 4) from their admission (batch) year.
// Because it is calculated every time, students move up automatically every July.
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
  const filePath = path.join(UPLOAD_DIR, storedName);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

// Removes the given items from items.json and also deletes their real files from /uploads
function removeItems(idList) {
  const keep = [];
  readData('items').forEach(function (item) {
    if (idList.indexOf(item.id) === -1) {
      keep.push(item);
    } else if (item.type === 'file') {
      deleteUploadedFile(item.storedName);
    }
  });
  writeData('items', keep);
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
  removeItems
};
