# 🎓 CSE ResourceHub

**Academic Resource Management System**
Department of Computer Science & Engineering, The Maharaja Sayajirao University of Baroda

CSE ResourceHub brings all of the department's study material together in one place, organized by year and semester. It covers all 4 years and 8 semesters of the undergraduate program, and teachers and students each get the access that fits their role.

Material is uploaded **once** and stays available **permanently**. When batches change, nobody has to forward anything again on WhatsApp or Google Drive.

---

## 📑 Table of Contents

1. [What this project does](#1-what-this-project-does)
2. [What you need before starting](#2-what-you-need-before-starting)
3. [Step 1: Install Node.js](#3-step-1-install-nodejs)
4. [Step 2: Get the project folder](#4-step-2-get-the-project-folder)
5. [Step 3: Open a terminal in the project folder](#5-step-3-open-a-terminal-in-the-project-folder)
6. [Step 4: Install the packages](#6-step-4-install-the-packages)
7. [Step 5: Load the demo data (optional)](#7-step-5-load-the-demo-data-optional)
8. [Step 6: Start the server](#8-step-6-start-the-server)
9. [Step 7: Open the website](#9-step-7-open-the-website)
10. [Demo logins](#10-demo-logins)
11. [First-time walkthrough](#11-first-time-walkthrough)
12. [Stopping and restarting](#12-stopping-and-restarting)
13. [Opening the site on other devices (classroom demo)](#13-opening-the-site-on-other-devices-classroom-demo)
14. [Settings you can change](#14-settings-you-can-change)
15. [Managing data: reset, backup, move to another PC](#15-managing-data-reset-backup-move-to-another-pc)
16. [Troubleshooting](#16-troubleshooting)
17. [Features](#17-features)
18. [Roles and permissions](#18-roles-and-permissions)
19. [How it works (architecture)](#19-how-it-works-architecture)
20. [Folder structure](#20-folder-structure)
21. [Data model](#21-data-model)
22. [API reference](#22-api-reference)
23. [Tech stack](#23-tech-stack)
24. [Future scope](#24-future-scope)
25. [Appendix A: MySQL schema](#appendix-a-equivalent-mysql-schema)
26. [Appendix B: Acceptance test checklist](#appendix-b-acceptance-test-checklist)

---

## 1. What this project does

```
CSE ResourceHub
├── Year 1  ── Semester 1, Semester 2
├── Year 2  ── Semester 3, Semester 4
├── Year 3  ── Semester 5, Semester 6
└── Year 4  ── Semester 7, Semester 8
        └── Subject (created by faculty, e.g. "Basic Web Programming")
              ├── 📘 Study Material  → syllabus, PPTs, teacher notes        (faculty only)
              ├── 📝 PYQs            → previous years' question papers       (faculty + permitted students)
              └── 📢 Other           → marks lists, ERC, notices             (faculty only)
                    └── folders inside folders (any depth) → files
```

- **Faculty** create subjects and folders, upload material, rename and delete anything, and decide which students may upload PYQs.
- **Students** can view and download everything in all 4 years. Their current year is **calculated automatically** from their batch, so everyone moves up every July without anyone changing anything.
- **Senior students** who have faculty permission can upload past papers into the **PYQs** section to help juniors.

---

## 2. What you need before starting

| Requirement | Version | Why |
|---|---|---|
| **Node.js** (includes **npm**) | 18 or newer (LTS recommended) | Runs the server and installs packages |
| A web browser | Chrome, Edge or Firefox (recent) | Opens the website |
| Internet connection | Needed for `npm install`, and in the browser | Downloads packages; jQuery and the Poppins font load from a CDN |
| About 50 MB of free disk space | — | Packages plus your uploaded files |

You do **not** need MySQL, MongoDB, XAMPP, Python or any other database. All data is stored in plain JSON files.

---

## 3. Step 1: Install Node.js

Check whether Node.js is already installed. Open a terminal and run:

```bash
node -v
```

```bash
npm -v
```

If both print a version number and Node is `v18.x.x` or higher, skip to [Step 2](#4-step-2-get-the-project-folder).

Otherwise, install Node.js for your system:

### 🪟 Windows

1. Go to **https://nodejs.org** and download the **LTS** version (the `.msi` installer).
2. Run the installer and keep the default options. Make sure **"Add to PATH"** is ticked.
3. **Close and reopen** every terminal or VS Code window, so the new PATH is picked up.
4. Check it worked with `node -v` and `npm -v`.

### 🍎 macOS

- Download the LTS `.pkg` from **https://nodejs.org** and install it, **or**
- with Homebrew, run `brew install node`.

### 🐧 Linux (Ubuntu or Debian)

```bash
sudo apt update
```

```bash
sudo apt install -y nodejs npm
```

If the version this installs is older than 18, use the NodeSource instructions on nodejs.org instead.

---

## 4. Step 2: Get the project folder

Put the `cse-resourcehub` folder anywhere on your computer, for example:

```
D:\BWP PROJECT\cse-resourcehub
```

If you received it as a **.zip** file, extract it first. Do **not** run the project from inside the zip.

The folder should contain these files (`node_modules` may not exist yet, which is fine):

```
config.js   db.js   package.json   README.md   seed.js   server.js
data/   middleware/   public/   routes/   uploads/
```

---

## 5. Step 3: Open a terminal in the project folder

Pick **one** of these ways:

- **VS Code:** use *File → Open Folder…*, select `cse-resourcehub`, then open *Terminal → New Terminal*.
- **Windows Explorer:** open the folder, click the address bar, type `cmd` and press **Enter**.
- **Any terminal:** move into the folder with `cd` (keep the quotes, because the path has a space):

```bash
cd "D:\BWP PROJECT\cse-resourcehub"
```

To check you are in the right place, list the folder contents with `dir` on Windows or `ls` on Mac/Linux. You should see `server.js` and `package.json`.

---

## 6. Step 4: Install the packages

Run this **once**, the first time you set up the project:

```bash
npm install
```

This reads `package.json` and downloads the 4 packages the project uses into a new `node_modules` folder:

| Package | Used for |
|---|---|
| `express` | The web server and API routes |
| `express-session` | Remembering who is logged in |
| `multer` | Receiving uploaded files |
| `bcryptjs` | Hashing passwords, so they are never stored as plain text |

When it finishes you should see something like `added 77 packages`. Warnings (`npm WARN …`) are normal and can be ignored.

> 🪟 If Windows PowerShell says *"npm.ps1 cannot be loaded because running scripts is disabled"*, see [Troubleshooting](#16-troubleshooting).

---

## 7. Step 5: Load the demo data (optional)

To try the project straight away with sample users, subjects, folders and files, run:

```bash
node seed.js
```

Expected output:

```
Demo data created:
  Faculty : faculty@msu.ac.in / faculty123   and   faculty2@msu.ac.in / faculty123
  Students: fresher@msu.ac.in (Year 1), student@msu.ac.in (Year 2), senior@msu.ac.in (Year 4, PYQ upload) / student123
```

This creates:

- 2 faculty accounts and 3 student accounts (one each in Year 1, Year 2 and Year 4)
- 4 subjects: Programming in C (Sem 1), Basic Web Programming and Data Structures (Sem 3), and Operating Systems (Sem 5)
- In every subject, folders `Unit 1`, `Unit 2`, `2024`, `2025` and `Marks`, plus 4 sample text files

> ⚠️ **`node seed.js` deletes ALL existing data and uploaded files** before creating the demo data. Run it only on a fresh setup, or when you really want to start over.

To start with an **empty** system instead, skip this step. The server creates empty data files by itself on first start, and you can register your own accounts.

---

## 8. Step 6: Start the server

```bash
node server.js
```

You can also use `npm start`, which does the same thing.

Expected output:

```
CSE ResourceHub is running at http://localhost:3000
```

**Keep this terminal window open.** The website works only while the server is running. Closing the window stops the server.

---

## 9. Step 7: Open the website

Open your browser and go to:

### 👉 http://localhost:3000

You will see the landing page. Click **Login** and use one of the [demo logins](#10-demo-logins), or click **Register** to create a new account.

---

## 10. Demo logins

These are available after `node seed.js`.

| Role | Email | Password | What to try |
|---|---|---|---|
| 👩‍🏫 Faculty | `faculty@msu.ac.in` | `faculty123` | Dr. A. Shah: create subjects and folders, upload, delete, manage students |
| 👩‍🏫 Faculty | `faculty2@msu.ac.in` | `faculty123` | Prof. R. Mehta |
| 🎒 Student | `fresher@msu.ac.in` | `student123` | Year 1 student |
| 🎒 Student | `student@msu.ac.in` | `student123` | Year 2 student: can only view and download |
| 🎓 Senior | `senior@msu.ac.in` | `student123` | Year 4 student **with PYQ upload permission** |

- Students can also log in with their **10-digit PRN** instead of the email.
- To register a **new faculty** account you need the **Faculty Secret Code: `CSE-MSU-2026`**. You can change it in `config.js`.

> The PRNs of the demo students depend on the current date. You can see them on the faculty **Manage Students** page.

---

## 11. First-time walkthrough

Follow these steps once to see every feature working.

### A. As Faculty (`faculty@msu.ac.in`)

1. **Dashboard:** you see 4 year cards, the global search and *Recent Uploads*.
2. Click **2nd Year**. The page shows two columns, Semester 3 and Semester 4.
3. Click **+ Add Subject** under Semester 4 and enter, for example, *Computer Networks* with code *CSE2401*. Save it.
   → The subject card appears. Its 3 sections were created automatically.
4. Open the subject. In **📘 Study Material**, click **+ New Folder** and create `Unit 1`.
5. Open `Unit 1` and click **⬆ Upload Files**. Drag in a few PDFs or PPTs and click **Upload**. Watch the progress bar.
6. Try the list/grid toggle (☰ / ▦), sorting, and searching inside the folder.
7. Click **👁 View** on a PDF (it opens in a new tab) and **⬇ Download** on any file.
8. Click **✏ Rename** and **🗑 Delete** on an item. Deleting a folder asks for confirmation and removes everything inside it.
9. Go to **Manage Students** in the navbar and turn **on** the PYQ switch for *Aarav Desai*.

### B. As a Student (`student@msu.ac.in`)

1. **Dashboard:** your own year card shows a **"Your Year"** badge.
2. Open any subject. You can **view and download** everything, but there are **no** upload, new-folder, rename or delete buttons.
3. Because faculty turned on your PYQ permission in step A.9, the **📝 PYQs** tab now shows **+ New Folder** and **⬆ Upload Files**. The other two tabs still do not.
4. Upload a sample paper into PYQs. It appears with a **Student** badge next to your name.

### C. Check that access can be taken away

1. Log in as faculty again and turn the PYQ switch **off** for Aarav.
2. Log back in as the student. The upload button in PYQs is gone, and any upload attempt is refused by the server.

### D. Registering a new student

1. Log out and click **Register**. The **Student** tab is selected.
2. Enter a name, a 10-digit PRN, an email, your **Admission Year (Batch)** and a password.
3. After registering, the dashboard shows your current year, calculated from your batch. For example, batch 2024 is **Year 3** during 2026–27.

---

## 12. Stopping and restarting

- **Stop the server:** click the terminal where it is running and press **Ctrl + C**.
- **Start it again:** in the project folder, run `node server.js`.
- **You do NOT need to run `npm install` or `node seed.js` again.** Those are one-time steps.
- All subjects, folders, files and accounts stay after a restart, because they are saved on disk in `data/` and `uploads/`.
- Everyone is **logged out** after a restart, because login sessions are kept in the server's memory. Just log in again.

---

## 13. Opening the site on other devices (classroom demo)

The server accepts connections from other devices on the **same Wi-Fi or LAN**.

1. Find your computer's IP address:
   - **Windows:** run `ipconfig` and look for **IPv4 Address**, e.g. `192.168.1.25`.
   - **Mac/Linux:** run `ifconfig` or `ip addr`.
2. On the phone or other laptop, open `http://192.168.1.25:3000`, using **your** IP address.
3. On Windows, the first time you run the server a **Firewall** popup may appear. Click **Allow access** for private networks. If you missed it, allow **Node.js** in *Windows Defender Firewall → Allow an app through firewall*.

---

## 14. Settings you can change

All settings are in **`config.js`**. Restart the server after changing any of them.

| Setting | Default | Meaning |
|---|---|---|
| `PORT` | `3000` | The site runs at `http://localhost:PORT` |
| `SESSION_SECRET` | `cse-resourcehub-msu-secret` | Signs the login cookie. **Change it** before any real use. |
| `FACULTY_SECRET_CODE` | `CSE-MSU-2026` | Code needed to register as faculty. Share it only with teachers. |
| `MAX_FILE_SIZE` | `25 * 1024 * 1024` (25 MB) | Largest allowed file |
| `MAX_FILES` | `10` | Most files in one upload |
| `ALLOWED_EXT` | `.pdf .ppt .pptx .doc .docx .xls .xlsx .txt .jpg .jpeg .png .zip .rar` | Allowed file types |

> If you change `MAX_FILE_SIZE`, `MAX_FILES` or `ALLOWED_EXT`, make the same change at the top of `public/js/subject.js`, which checks files in the browser before uploading.

---

## 15. Managing data: reset, backup, move to another PC

### Where the data lives

| Folder / file | Contains |
|---|---|
| `data/users.json` | All accounts, with hashed passwords |
| `data/subjects.json` | All subjects |
| `data/items.json` | All folders and file records |
| `uploads/` | The actual uploaded files, saved with generated names like `1719999999-8k2j5a.pdf` |

### Back up

Stop the server, then copy the **`data`** and **`uploads`** folders somewhere safe. Always keep the two together, because the records in `items.json` point to the files in `uploads/`.

### Restore

Stop the server, replace `data/` and `uploads/` with your backup copies, and start the server again.

### Reset everything

- **Start over with demo data:** stop the server, run `node seed.js`, then start the server.
- **Start completely empty:** stop the server, delete the 3 JSON files in `data/` and everything in `uploads/` except `.gitkeep`, then start the server. Empty files are created automatically.

### Move the project to another PC or send it for submission

1. Copy or zip the project folder **without `node_modules`**. That folder is large and is re-created by `npm install`.
2. On the other PC, install Node.js, then run `npm install` followed by `node server.js`.

### Forgot a password?

There is no "forgot password" email feature. A logged-in user can change their password on the **Profile** page. To reset someone else's password:

1. In the project folder, generate a new password hash (here for the password `newpass123`):
   ```bash
   node -e "console.log(require('bcryptjs').hashSync('newpass123', 10))"
   ```
2. Stop the server, open `data/users.json`, find the user, and replace the value of `passwordHash` with the printed hash.
3. Save the file, start the server, and log in with `newpass123`.

---

## 16. Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| `'node' is not recognized…` or `command not found: node` | Node.js is not installed, or the terminal was opened before installing it | Install Node.js ([Step 1](#3-step-1-install-nodejs)), then **close and reopen** the terminal or VS Code |
| PowerShell: `npm.ps1 cannot be loaded because running scripts is disabled on this system` | Windows PowerShell's script policy blocks npm | Use **Command Prompt (cmd)** instead, **or** run `npm.cmd install`, **or** run once: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| `Error: Cannot find module 'express'` (or multer, bcryptjs…) | Packages are not installed | Run `npm install` in the project folder |
| `Error: Cannot find module '…\server.js'` | The terminal is in the wrong folder | `cd` into `cse-resourcehub` first ([Step 3](#5-step-3-open-a-terminal-in-the-project-folder)) |
| `Error: listen EADDRINUSE: address already in use :::3000` | The server is already running in another window, or another app uses port 3000 | Close the other server window (Ctrl + C), **or** change `PORT` in `config.js` to `3001` and open `http://localhost:3001` |
| The browser says *"This site can't be reached"* | The server is not running | Run `node server.js` and keep that window open |
| The page looks broken, buttons do nothing, and there are no toasts or modals | jQuery could not load from the CDN because there is no internet in the browser | Connect to the internet and refresh with **Ctrl + F5** |
| Font looks plain | Google Fonts could not load (offline) | Nothing to fix. It falls back to Segoe UI or Arial. |
| I keep getting sent back to the login page | You are not logged in, or the server restarted (sessions are cleared on restart) | Log in again |
| A student is sent back to the Dashboard from *Manage Students* | That page is for faculty only | Log in as faculty |
| *"Invalid Faculty Secret Code"* | The code is wrong | Use the value of `FACULTY_SECRET_CODE` in `config.js` (default `CSE-MSU-2026`) |
| *"This PRN is already registered"* or *"This email is already registered"* | The account already exists | Log in instead, or use a different PRN or email |
| *"File type not allowed"* | The extension is not in the allowed list | Convert the file (e.g. to PDF), or add the extension to `ALLOWED_EXT` in **both** `config.js` and `public/js/subject.js` |
| *"File too large. Maximum size is 25 MB per file."* | The file is over the limit | Compress or split it, or raise `MAX_FILE_SIZE` (again in both places) |
| A student cannot see the Upload button in PYQs | Faculty has not given that student permission | Faculty → **Manage Students** → turn the switch on |
| *"The main sections cannot be deleted"* | Study Material, PYQs and Other are fixed | Delete the whole subject instead, from the Year page |
| `SyntaxError: Unexpected token … in JSON` when starting | A file in `data/` was edited by hand and broken | Fix the JSON (check commas and brackets), restore a backup, or run `node seed.js` |
| Changes to HTML, CSS or JS do not show | The browser is using a cached copy | Hard refresh with **Ctrl + F5** |
| Changes to `server.js`, `routes/` or `config.js` do not apply | The server loads these only when it starts | Stop it (Ctrl + C) and start it again |

---

## 17. Features

- **Two roles:** Faculty (full control) and Student (view and download).
- **Fixed academic structure:** Year 1–4 → Semester 1–8 → Subject → 📘 Study Material / 📝 PYQs / 📢 Other → nested folders → files.
- **Automatic sections:** creating a subject creates its 3 sections. They cannot be renamed or deleted on their own.
- **Automatic year promotion:** a student's year is calculated from their admission batch. The academic year starts in **July**. Students past Year 4 are shown as "Year 4 / Alumni".
- **PYQ contributors:** faculty allow selected (usually senior) students to upload papers in PYQs only. A revoked permission takes effect on the next request.
- **Uploads:** several files at once, drag & drop, a live progress bar, file-type and size checks in the browser **and** on the server. Duplicate names become `name (1).pdf`.
- **View and download:** PDFs, images and text files open inside the browser, and every file downloads with its original name.
- **File explorer:** clickable breadcrumb (`2nd Year › Sem 3 › BWP › PYQs › 2024`), search inside the folder, sort by name, date or size, and a list/grid view.
- **Dashboard:** year cards with a "Your Year" badge, global search across all files and folders, and the 10 most recent uploads.
- **Recursive delete:** deleting a folder or subject removes everything inside it, including the real files on disk, after a confirmation box that says how many items will be lost.
- **Profile page:** shows the user's details and lets them change their password.
- **Security:** passwords hashed with bcrypt, a session cookie for login, every write action checked on the server, user text escaped against XSS, and uploaded files saved under generated names (no path tricks).
- **Responsive:** works from phones (375px) to desktops. The navbar turns into a hamburger menu and tables scroll sideways.

---

## 18. Roles and permissions

| Action | Faculty | Student | Student with PYQ permission |
|---|:-:|:-:|:-:|
| View, preview and download any file | ✅ | ✅ | ✅ |
| Browse all 4 years | ✅ | ✅ | ✅ |
| Create, edit and delete subjects | ✅ | ❌ | ❌ |
| Create, rename and delete folders in Study Material or Other | ✅ | ❌ | ❌ |
| Upload to Study Material or Other | ✅ | ❌ | ❌ |
| Create folders in PYQs | ✅ | ❌ | ✅ |
| Upload to PYQs | ✅ | ❌ | ✅ |
| Rename or delete anything in PYQs | ✅ | ❌ | ❌ |
| Manage Students (grant or revoke PYQ permission) | ✅ | ❌ | ❌ |

These rules are enforced **on the server** (`middleware/auth.js`), not just by hiding buttons:

- Not logged in → **401 Unauthorized**
- Logged in but not allowed → **403 Forbidden**, even when the API is called directly with Postman or curl

---

## 19. How it works (architecture)

```
 Browser (HTML + CSS + JS + jQuery)
      │   fetch() / XMLHttpRequest  →  JSON
      ▼
 server.js  (Express)
      ├── express.static('public')      → serves the pages
      ├── express-session               → remembers the logged-in user (cookie)
      ├── routes/auth.js                → register, login, logout, me, password
      ├── routes/browse.js              → read-only: years, subjects, folders, files, search, recent
      ├── routes/manage.js              → changes: subjects, folders, files, upload (multer), students
      │        ▲
      │        └── middleware/auth.js   → isLoggedIn, isFaculty, canWriteHere
      ▼
 db.js  →  data/*.json   (users, subjects, items)
        →  uploads/      (real files)
```

1. Every page loads `common.js`, which calls `GET /api/me`. If nobody is logged in, the browser is sent to `login.html`.
2. The page asks the API for its data and builds the HTML with JavaScript.
3. When something changes (for example an upload), the route checks the permission, updates the JSON file through `db.js`, and replies with `{ success, message, data }`.
4. The page shows a toast message and reloads the list.

---

## 20. Folder structure

```
cse-resourcehub/
├── server.js              # starts Express: JSON, sessions, static files, routes, error handler
├── config.js              # PORT, SESSION_SECRET, FACULTY_SECRET_CODE, upload limits, allowed types
├── db.js                  # JSON "database": readData, writeData, findById, newId,
│                          #   getStudyYear (auto year), getDescendants, removeItems
├── seed.js                # creates demo users, subjects, folders and sample files
├── package.json           # project info + the 4 dependencies
├── README.md
├── middleware/
│   └── auth.js            # isLoggedIn, isFaculty, canWriteHere
├── routes/
│   ├── auth.js            # /register/student, /register/faculty, /login, /logout, /me, /me/password
│   ├── browse.js          # /years, /subjects, /folders/:id/contents, /files/:id/view|download, /search, /recent
│   └── manage.js          # subject/folder/file CRUD, /upload, /students, /students/:id/pyq-permission
├── data/                  # created automatically
│   ├── users.json
│   ├── subjects.json
│   └── items.json
├── uploads/               # uploaded files (.gitkeep keeps the empty folder)
└── public/
    ├── index.html             # landing page
    ├── login.html             # login with email or PRN
    ├── register.html          # student / faculty registration tabs
    ├── dashboard.html         # year cards, search, recent uploads
    ├── year.html              # 2 semesters with subject cards (faculty: add/edit/delete)
    ├── subject.html           # the file explorer
    ├── manage-students.html   # faculty: PYQ permission switches
    ├── profile.html           # details + change password
    ├── about.html             # problem, solution, features, future scope
    ├── css/style.css          # the single stylesheet
    └── js/
        ├── common.js          # navbar, footer, login check, api(), toasts, modals, helpers
        ├── auth.js            # login, register and profile pages
        ├── dashboard.js
        ├── year.js
        ├── subject.js         # explorer, upload with progress, rename, delete
        └── students.js
```

---

## 21. Data model

**`data/users.json`**
```json
{ "id": "u2", "role": "student", "name": "Neel Prajapati", "prn": "8024055612",
  "email": "neel@example.com", "admissionYear": 2024, "canUploadPYQ": false,
  "passwordHash": "$2a$10$...", "createdAt": "2026-07-02T10:00:00.000Z" }
```
Faculty records have the same fields except `prn`, `admissionYear` and `canUploadPYQ`.

**`data/subjects.json`**
```json
{ "id": "s1", "name": "Basic Web Programming", "code": "CSE2301", "year": 2, "semester": 3,
  "facultyName": "Dr. A. Shah", "createdBy": "u1", "createdAt": "..." }
```

**`data/items.json`** holds folders and files in one list, linked by `parentId`:
```json
{ "id": "f1", "type": "folder", "name": "PYQs", "subjectId": "s1", "section": "pyq",
  "parentId": null, "isRoot": true, "createdBy": "u1", "createdAt": "..." }

{ "id": "x1", "type": "file", "name": "End Sem 2025.pdf", "storedName": "1719999999-8k2j5a.pdf",
  "size": 2345678, "mime": "application/pdf", "subjectId": "s1", "section": "pyq",
  "parentId": "f1", "uploadedBy": "u2", "uploaderName": "Neel Prajapati",
  "uploaderRole": "student", "createdAt": "..." }
```
`section` is always `"material"`, `"pyq"` or `"other"`. The 3 section folders have `isRoot: true`.

---

## 22. API reference

Every response looks like `{ "success": true/false, "message": "...", "data": ... }`.

| Method | URL | Who | Purpose |
|---|---|---|---|
| POST | `/api/register/student` | guest | Body: `name, prn, email, password, admissionYear` |
| POST | `/api/register/faculty` | guest + secret code | Body: `name, email, password, secretCode` |
| POST | `/api/login` | anyone | Body: `identifier` (email or PRN), `password` |
| POST | `/api/logout` | logged in | End the session |
| GET | `/api/me` | logged in | Current user (+ `currentYear` for students) |
| PUT | `/api/me/password` | logged in | Body: `oldPassword, newPassword` |
| GET | `/api/years` | logged in | 4 years with semester subject counts |
| GET | `/api/subjects?year=&semester=` | logged in | Subject list with file counts |
| GET | `/api/subjects/:id` | logged in | Subject + ids of its 3 section folders |
| GET | `/api/folders/:id/contents` | logged in | Sub-folders, files, breadcrumb, `canWrite`, `canManage` |
| GET | `/api/files/:id/view` | logged in | Open the file inside the browser |
| GET | `/api/files/:id/download` | logged in | Download with the original name |
| GET | `/api/search?q=&year=` | logged in | Search file and folder names (min 2 letters) |
| GET | `/api/recent?limit=10` | logged in | Newest uploads |
| POST | `/api/subjects` | faculty | Body: `name, code, semester, facultyName` |
| PUT | `/api/subjects/:id` | faculty | Edit a subject |
| DELETE | `/api/subjects/:id` | faculty | Delete a subject and everything in it |
| POST | `/api/folders` | faculty / permitted student (PYQs) | Body: `name, parentId` |
| PUT | `/api/folders/:id` | faculty | Rename a folder |
| DELETE | `/api/folders/:id` | faculty | Delete a folder and everything in it |
| POST | `/api/upload` | faculty / permitted student (PYQs) | Multipart form: `parentId` + `files` (max 10) |
| PUT | `/api/files/:id` | faculty | Rename a file |
| DELETE | `/api/files/:id` | faculty | Delete a file (also removed from disk) |
| GET | `/api/students?search=&year=` | faculty | Student list |
| PUT | `/api/students/:id/pyq-permission` | faculty | Body: `{ "allow": true }` or `false` |

---

## 23. Tech stack

| Layer | Technology |
|---|---|
| Front end | HTML5, CSS3 (Flexbox, Grid, variables, media queries), JavaScript (ES6, `fetch`, `XMLHttpRequest`), jQuery 3.7 |
| Back end | Node.js, Express 4 |
| Login | express-session, bcryptjs |
| File uploads | multer |
| Database | JSON files through Node's `fs` module |

There are no front-end frameworks, no build step and no external database.

---

## 24. Future scope

- Announcements and notice board, and event updates
- Placement and internship resources
- A discussion forum for each subject
- Email alerts for new uploads
- An approval workflow for student uploads
- Migration to MySQL or MongoDB (see Appendix A)
- An Admin (HOD) role
- File version history and download analytics

---

## Appendix A: Equivalent MySQL schema

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

---

## Appendix B: Acceptance test checklist

| # | Test | Where it is handled |
|---|---|---|
| 1 | A batch-2024 student shows Year 3 in Sept 2026 | `db.js` → `getAcademicStartYear()`, `getStudyYear()` |
| 2 | A wrong faculty secret code is refused | `routes/auth.js` → `POST /register/faculty` |
| 3 | A new subject gets Study Material, PYQs and Other | `routes/manage.js` → `POST /subjects` (`SECTIONS` loop) |
| 4 | Nested folders and multi-file upload with progress | `POST /folders`, `POST /upload`; `subject.js` → `startUpload()` |
| 5 | A normal student can view and download, and sees no edit buttons | `browse.js` sends `canWrite`/`canManage`; `subject.js` → `renderToolbar()`, `manageButtons()` |
| 6 | A student calling write APIs gets 403 | `middleware/auth.js` → `isFaculty`, `canWriteHere` |
| 7 | A permitted student uploads in PYQs only | `canWriteHere()` checks `section === 'pyq' && canUploadPYQ` |
| 8 | A revoked permission works immediately | `isLoggedIn` reloads the user from `users.json` on every request |
| 9 | Deleting a folder removes its records and real files | `db.getDescendants()` + `db.removeItems()` |
| 10 | Deleting a subject removes everything | `DELETE /subjects/:id` |
| 11 | A `.exe` or 40 MB file is rejected | `manage.js` → `fileFilter`, multer `limits`, `receiveFiles()`; also `subject.js` → `addFiles()` |
| 12 | Breadcrumb, search, sort, grid/list view and 375px mobile work | `subject.js` → `renderBreadcrumb()`, `renderEntries()`; `style.css` media queries |
| 13 | Data survives a server restart | Everything is saved to `data/*.json` and `uploads/` on disk |
| 14 | A logged-out user is sent to login | `common.js` → `requireLogin()`; APIs return 401 |

---

## ⚡ Quick start (summary)

```bash
cd "D:\BWP PROJECT\cse-resourcehub"
npm install        # first time only
node seed.js       # first time only (optional demo data; clears existing data)
node server.js     # every time
```

Then open **http://localhost:3000** and log in with `faculty@msu.ac.in` / `faculty123`.

---

Developed by **Neel Prajapati**, Basic Web Programming Lab Project, Department of Computer Science & Engineering, MSU Baroda.
