# 🎓 CSE ResourceHub

**Academic Resource Management System — Department of Computer Science & Engineering, The Maharaja Sayajirao University of Baroda**

A web-based academic resource management system that consolidates all department study material into a single,
organized, year-wise and semester-wise platform covering all 4 years and 8 semesters of the undergraduate program,
with role-based access for teachers and students. Material is uploaded **once** and stays available **permanently**,
so when batches change nothing has to be forwarded again on WhatsApp or Google Drive.

---

## 1. Prerequisites

- **Node.js 18 or newer** (check with `node -v`)
- An internet connection in the browser (jQuery and the Poppins font load from a CDN)

## 2. How to run

```bash
npm install
node seed.js      # optional: fills demo users, subjects, folders and sample files (clears existing data!)
node server.js
```

Open **http://localhost:3000** in the browser.

## 3. Demo logins (after `node seed.js`)

| Role | Email | Password | Notes |
|---|---|---|---|
| Faculty | faculty@msu.ac.in | faculty123 | Dr. A. Shah |
| Faculty | faculty2@msu.ac.in | faculty123 | Prof. R. Mehta |
| Student | fresher@msu.ac.in | student123 | Year 1 |
| Student | student@msu.ac.in | student123 | Year 2, normal student |
| Student | senior@msu.ac.in | student123 | Year 4, **has PYQ upload permission** |

Students can also log in with their 10-digit PRN instead of the email.
**Faculty Secret Code** for registering new faculty: `CSE-MSU-2026` (change it in `config.js`).

## 4. Features

- **Two roles:** Faculty (full control) and Student (view and download).
- **Fixed structure:** Year 1–4 → Semester 1–8 → Subject → 📘 Study Material / 📝 PYQs / 📢 Other → nested folders → files.
- Creating a subject automatically creates its 3 sections.
- **Automatic year promotion:** a student's current year is calculated from their batch (admission year). The academic year starts in July, so every student moves up automatically.
- **PYQ contributors:** faculty can allow selected (senior) students to upload past papers in the PYQs section only.
- Multi-file upload with drag & drop and a live **progress bar** (XMLHttpRequest `upload.onprogress`).
- View PDFs, images and text files in the browser, or download any file with its original name.
- Clickable breadcrumb, search inside a folder, sort by name/date/size, list/grid view.
- Global search and "Recent uploads" on the dashboard.
- Recursive delete: deleting a folder or subject removes everything inside it, including the real files in `/uploads`.
- Upload rules: only `.pdf .ppt .pptx .doc .docx .xls .xlsx .txt .jpg .jpeg .png .zip .rar`, max 25 MB per file, max 10 files per upload. Duplicate names become `name (1).pdf`.
- Passwords hashed with bcrypt, login with sessions, all output escaped against XSS, responsive down to 375px.

## 5. Permissions (checked on the server)

| Action | Faculty | Student | Student with PYQ permission |
|---|---|---|---|
| View / preview / download any file | ✅ | ✅ | ✅ |
| Create / rename / delete subject | ✅ | ❌ | ❌ |
| Create / rename / delete folder in Study Material or Other | ✅ | ❌ | ❌ |
| Upload to Study Material or Other | ✅ | ❌ | ❌ |
| Create folder in PYQs | ✅ | ❌ | ✅ |
| Upload to PYQs | ✅ | ❌ | ✅ |
| Rename / delete anything in PYQs | ✅ | ❌ | ❌ |
| Grant / revoke PYQ permission | ✅ | ❌ | ❌ |

Calling a forbidden API directly (e.g. with Postman) returns **403 Forbidden**. Not logged in returns **401**.

## 6. Folder structure

```
cse-resourcehub/
├── server.js              # starts Express, sessions, static files, routes, error handler
├── config.js              # PORT, SESSION_SECRET, FACULTY_SECRET_CODE, upload limits, allowed types
├── db.js                  # JSON "database": readData, writeData, findById, year calculation, recursive delete
├── seed.js                # demo data
├── package.json
├── middleware/auth.js     # isLoggedIn, isFaculty, canWriteHere
├── routes/
│   ├── auth.js            # register, login, logout, me, change password
│   ├── browse.js          # years, subjects, folder contents, view/download, search, recent
│   └── manage.js          # subject/folder/file CRUD, upload, students & PYQ permission
├── data/                  # users.json, subjects.json, items.json
├── uploads/               # real uploaded files (stored with generated names)
└── public/
    ├── index.html  login.html  register.html  dashboard.html  year.html
    ├── subject.html  manage-students.html  profile.html  about.html
    ├── css/style.css
    └── js/common.js  auth.js  dashboard.js  year.js  subject.js  students.js
```

## 7. API summary

| Method & URL | Who | Purpose |
|---|---|---|
| POST `/api/register/student` | guest | Register a student |
| POST `/api/register/faculty` | guest + secret code | Register a faculty member |
| POST `/api/login` · POST `/api/logout` | all | Login with email/PRN, logout |
| GET `/api/me` · PUT `/api/me/password` | logged in | Current user, change password |
| GET `/api/years` | logged in | 4 years with semester subject counts |
| GET `/api/subjects?year=&semester=` · GET `/api/subjects/:id` | logged in | Subjects, one subject + section ids |
| GET `/api/folders/:id/contents` | logged in | Sub-folders, files, breadcrumb |
| GET `/api/files/:id/view` · `/download` | logged in | Open inline / download |
| GET `/api/search?q=&year=` · GET `/api/recent?limit=` | logged in | Search, recent uploads |
| POST/PUT/DELETE `/api/subjects` | faculty | Subject CRUD |
| POST `/api/folders` · POST `/api/upload` | faculty, or permitted student in PYQs | New folder, upload files |
| PUT/DELETE `/api/folders/:id`, `/api/files/:id` | faculty | Rename / delete |
| GET `/api/students` · PUT `/api/students/:id/pyq-permission` | faculty | Manage PYQ contributors |

## 8. Screenshots

_Add screenshots here: Landing page, Dashboard, Year page, Subject explorer (list & grid), Upload box, Manage Students, Mobile view._

## 9. Future scope

Announcements and notice board · event updates · placement and internship resources · discussion forum per subject ·
email alerts for new uploads · approval workflow for student uploads · MySQL/MongoDB migration · admin (HOD) role ·
file version history · download analytics.

---

## Appendix A — Equivalent MySQL schema

The project uses JSON files, but the same data fits these tables if the storage is moved to MySQL later.

```sql
CREATE TABLE users (
  id             VARCHAR(20) PRIMARY KEY,
  role           ENUM('faculty', 'student') NOT NULL,
  name           VARCHAR(60) NOT NULL,
  email          VARCHAR(120) NOT NULL UNIQUE,
  prn            CHAR(10) UNIQUE,              -- students only
  admission_year SMALLINT,                     -- students only
  can_upload_pyq BOOLEAN DEFAULT FALSE,        -- students only
  password_hash  VARCHAR(100) NOT NULL,
  created_at     DATETIME NOT NULL
);

CREATE TABLE subjects (
  id           VARCHAR(20) PRIMARY KEY,
  name         VARCHAR(60) NOT NULL,
  code         VARCHAR(15),
  year         TINYINT NOT NULL CHECK (year BETWEEN 1 AND 4),
  semester     TINYINT NOT NULL CHECK (semester BETWEEN 1 AND 8),
  faculty_name VARCHAR(60),
  created_by   VARCHAR(20) REFERENCES users(id),
  created_at   DATETIME NOT NULL
);

CREATE TABLE items (
  id            VARCHAR(20) PRIMARY KEY,
  type          ENUM('folder', 'file') NOT NULL,
  name          VARCHAR(255) NOT NULL,
  subject_id    VARCHAR(20) NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  section       ENUM('material', 'pyq', 'other') NOT NULL,
  parent_id     VARCHAR(20) NULL REFERENCES items(id) ON DELETE CASCADE,
  is_root       BOOLEAN DEFAULT FALSE,
  stored_name   VARCHAR(60),                  -- files only
  size          BIGINT,                       -- files only
  mime          VARCHAR(100),                 -- files only
  uploaded_by   VARCHAR(20) REFERENCES users(id),
  uploader_name VARCHAR(60),
  uploader_role ENUM('faculty', 'student'),
  created_at    DATETIME NOT NULL
);
```

## Appendix B — Acceptance test checklist

| # | Test | Where it is handled |
|---|---|---|
| 1 | Batch 2024 student shows Year 3 in Sept 2026 | `db.js` → `getAcademicStartYear()`, `getStudyYear()` |
| 2 | Wrong faculty secret code is refused | `routes/auth.js` → `POST /register/faculty` |
| 3 | New subject gets Study Material, PYQs, Other | `routes/manage.js` → `POST /subjects` (`SECTIONS` loop) |
| 4 | Nested folders + multi-file upload with progress | `POST /folders`, `POST /upload`; `subject.js` → `startUpload()` |
| 5 | Normal student can view/download, sees no edit buttons | `browse.js` sends `canWrite`/`canManage`; `subject.js` → `renderToolbar()`, `manageButtons()` |
| 6 | Student calling write APIs gets 403 | `middleware/auth.js` → `isFaculty`, `canWriteHere` |
| 7 | Permitted student uploads in PYQs only | `canWriteHere()` checks `section === 'pyq' && canUploadPYQ` |
| 8 | Revoked permission works immediately | `isLoggedIn` reloads the user from `users.json` on every request |
| 9 | Deleting a folder removes records and real files | `db.getDescendants()` + `db.removeItems()` |
| 10 | Deleting a subject removes everything | `DELETE /subjects/:id` |
| 11 | `.exe` or 40 MB file is rejected | `manage.js` → `fileFilter`, multer `limits`, `receiveFiles()`; also checked in `subject.js` → `addFiles()` |
| 12 | Breadcrumb, search, sort, grid/list, 375px mobile | `subject.js` → `renderBreadcrumb()`, `renderEntries()`; `style.css` media queries |
| 13 | Data survives a server restart | Everything is saved to `data/*.json` and `uploads/` on disk |
| 14 | Logged-out user is sent to login | `common.js` → `requireLogin()`; APIs return 401 |

> Note: login sessions are kept in the server's memory, so restarting the server logs everyone out. The data and files are **not** lost.

---

Developed by **Neel Prajapati** — Basic Web Programming Lab Project, CSE Department, MSU Baroda.
