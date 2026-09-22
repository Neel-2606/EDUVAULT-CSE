// seed.js
// Fills the project with demo data so it can be shown straight away.
// Run with:  node seed.js      (WARNING: this clears all existing data and uploads)

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');

db.setupStorage();

// Remove old uploaded files (keep .gitkeep)
fs.readdirSync(db.UPLOAD_DIR).forEach(function (name) {
  if (name !== '.gitkeep') fs.unlinkSync(path.join(db.UPLOAD_DIR, name));
});

const users = [];
const subjects = [];
const items = [];
let minutesAgo = 600;   // each new record is a little newer than the previous one

// Returns a date a few minutes after the previous one, so "Recent uploads" looks natural
function nextDate() {
  minutesAgo -= 7;
  return new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
}

/* ---------- Users ---------- */

function addFaculty(name, email) {
  const user = { id: db.newId(), role: 'faculty', name: name, email: email,
                 passwordHash: bcrypt.hashSync('faculty123', 10), createdAt: nextDate() };
  users.push(user);
  return user;
}

// yearOfStudy 1..4 -> admission year is calculated from today, so the demo always works
function addStudent(name, email, yearOfStudy, prnTail, canUploadPYQ) {
  const admissionYear = db.getAcademicStartYear() - (yearOfStudy - 1);
  const user = { id: db.newId(), role: 'student', name: name,
                 prn: '80' + String(admissionYear).slice(2) + prnTail, email: email,
                 admissionYear: admissionYear, canUploadPYQ: canUploadPYQ,
                 passwordHash: bcrypt.hashSync('student123', 10), createdAt: nextDate() };
  users.push(user);
  return user;
}

const shah = addFaculty('Dr. A. Shah', 'faculty@msu.ac.in');
const mehta = addFaculty('Prof. R. Mehta', 'faculty2@msu.ac.in');
addStudent('Riya Patel', 'fresher@msu.ac.in', 1, '000101', false);
addStudent('Aarav Desai', 'student@msu.ac.in', 2, '000215', false);
const senior = addStudent('Karan Joshi', 'senior@msu.ac.in', 4, '000342', true);

/* ---------- Subjects, folders and sample files ---------- */

function addFolder(subject, section, name, parent, creator) {
  const folder = { id: db.newId(), type: 'folder', name: name, subjectId: subject.id, section: section,
                   parentId: parent ? parent.id : null, isRoot: !parent,
                   createdBy: creator.id, createdAt: nextDate() };
  items.push(folder);
  return folder;
}

// Writes a small text file into /uploads and adds its record
function addFile(folder, name, text, uploader) {
  const storedName = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.txt';
  fs.writeFileSync(path.join(db.UPLOAD_DIR, storedName), text);
  items.push({ id: db.newId(), type: 'file', name: name, storedName: storedName,
               size: Buffer.byteLength(text), mime: 'text/plain',
               subjectId: folder.subjectId, section: folder.section, parentId: folder.id,
               uploadedBy: uploader.id, uploaderName: uploader.name, uploaderRole: uploader.role,
               createdAt: nextDate() });
}

function addSubject(name, code, semester, faculty) {
  const subject = { id: db.newId(), name: name, code: code, year: Math.ceil(semester / 2),
                    semester: semester, facultyName: faculty.name, createdBy: faculty.id,
                    createdAt: nextDate() };
  subjects.push(subject);

  // The 3 fixed sections + a few sample folders inside them
  const material = addFolder(subject, 'material', 'Study Material', null, faculty);
  const pyq = addFolder(subject, 'pyq', 'PYQs', null, faculty);
  const other = addFolder(subject, 'other', 'Other', null, faculty);
  const unit1 = addFolder(subject, 'material', 'Unit 1', material, faculty);
  addFolder(subject, 'material', 'Unit 2', material, faculty);
  addFolder(subject, 'pyq', '2024', pyq, faculty);
  const pyq2025 = addFolder(subject, 'pyq', '2025', pyq, faculty);
  const marks = addFolder(subject, 'other', 'Marks', other, faculty);

  addFile(material, name + ' - Syllabus.txt',
    name + ' (' + code + ')\nSemester ' + semester + '\n\nUnit 1: Introduction\nUnit 2: Core concepts\nUnit 3: Applications\n', faculty);
  addFile(unit1, 'Unit 1 - Lecture Notes.txt', 'Unit 1 notes for ' + name + '.\nRead these before the first internal test.\n', faculty);
  addFile(pyq2025, code + ' End Sem 2025.txt', 'End Semester Exam 2025 - ' + name + '\nQ1. Explain the basics. (10 marks)\nQ2. Write a short note. (10 marks)\n', senior);
  addFile(marks, 'Internal Test 1 - Marks.txt', 'PRN, Marks\n8025000215, 18\n8026000101, 16\n', faculty);
}

addSubject('Programming in C', 'CSE1101', 1, shah);
addSubject('Basic Web Programming', 'CSE2301', 3, shah);
addSubject('Data Structures', 'CSE2302', 3, mehta);
addSubject('Operating Systems', 'CSE3501', 5, mehta);

db.writeData('users', users);
db.writeData('subjects', subjects);
db.writeData('items', items);

console.log('Demo data created:');
console.log('  Faculty : faculty@msu.ac.in / faculty123   and   faculty2@msu.ac.in / faculty123');
console.log('  Students: fresher@msu.ac.in (Year 1), student@msu.ac.in (Year 2), senior@msu.ac.in (Year 4, PYQ upload) / student123');
