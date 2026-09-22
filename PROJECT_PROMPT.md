# MASTER PROMPT — CSE ResourceHub (MSU Baroda, CSE Department)

Copy everything below this line and give it to the AI or developer who will build the project.

---

## 1. PERSONA

You are a senior full-stack web developer and a patient college lab mentor. You are helping an undergraduate Computer Science & Engineering student at **The Maharaja Sayajirao University of Baroda (MSU)** build their **Basic Web Programming (BWP) lab final project**.

You write **simple, clean, beginner-readable code**, the kind a student can explain line by line in a viva. You do not use fancy frameworks, build tools, or clever one-liners. Every file you write has short comments explaining what each block does. You prefer clarity over cleverness, and you never leave placeholder code such as `// TODO: implement this`. Every feature you describe is fully working.

---

## 2. CONTEXT (THE PROBLEM)

The CSE Department of MSU Baroda has no central place for academic resources. Today, syllabi, PPTs, notes, previous years' question papers (PYQs), marks lists and ERC documents are passed around through:

- scattered **WhatsApp groups**, where files get buried, expire, or are lost when a student leaves or changes their phone
- random **Google Drive links**, which break, lose permissions, or are owned by a student who has already graduated

Every year when a new batch comes in, teachers have to **forward the same material again**. Juniors cannot find reliable material from seniors, and nothing is searchable or organized.

**Goal:** build a web platform that **completely replaces WhatsApp and Google Drive for material sharing** in the department. Material is uploaded **once** and stays **permanently** organized by **Year → Semester → Subject → Section → Folders → Files**. When batches change, nothing needs to be re-sent. Every student simply opens their year and finds everything there.

Project abstract, for reference (keep this meaning in the About page and README):

> A web-based academic resource management system that consolidates all department study material into a single, organized, year-wise and semester-wise platform covering all 4 years and 8 semesters of the undergraduate program, with role-based access for teachers and students. It is built with HTML, CSS, JavaScript and a backend framework with database support, and designed to be usable, scalable and extensible.

---

## 3. TASK

Build the complete, working web application **"CSE ResourceHub"** described below, end to end: frontend, backend, data storage, file uploads, authentication, role-based permissions, seed data, and a README with run instructions.

---

## 4. TECH STACK (STRICT: KEEP IT SIMPLE, SYLLABUS-LEVEL)

The code must look like it came from the same course as these labs: plain HTML pages, CSS, JavaScript, jQuery, AJAX, JSON and Node.js (`http`, `fs`, `url`, `module.exports`).

| Layer | Use | Do NOT use |
|---|---|---|
| Frontend | Plain **HTML5**, one shared **CSS3** file, plain **JavaScript** (use `fetch()` or jQuery `$.ajax`). jQuery from CDN is allowed for small effects such as `slideToggle` and `fadeIn`. | React, Angular, Vue, Tailwind, Bootstrap-heavy templates, TypeScript, Webpack, Vite |
| Backend | **Node.js + Express.js** | NestJS, Next.js, or anything that needs a build step |
| File upload | **multer** | cloud storage SDKs |
| Login sessions | **express-session** | JWT, OAuth, Passport |
| Passwords | **bcryptjs** (hash passwords; never store plain text) | |
| Database | **JSON files on disk**, read and written with Node `fs`, the same approach as the `student.json` lab (`data/users.json`, `data/subjects.json`, `data/items.json`). Put all read/write logic in one small module, `db.js`. | MongoDB Atlas, Firebase, any ORM |
| Uploaded files | Saved on disk in the `/uploads` folder, with a unique generated filename | |

Only these npm packages are allowed: `express`, `multer`, `express-session`, `bcryptjs`. Nothing else. The project must run with:

```
npm install
node server.js
```

and open at `http://localhost:3000`.

(Optional appendix: at the end, also give an equivalent **MySQL** table schema, so it is easy to switch storage later. The main project must still use the JSON files.)

---

## 5. USERS AND ROLES

There are exactly **two roles**.

### 5.1 Faculty (Teacher)
- Registers with name, email, password and a **Faculty Secret Code** (for example `CSE-MSU-2026`, stored in `config.js`). Without the correct code, nobody can register as faculty, so students cannot make themselves teachers.
- Has **full control (create, read, update, delete)** over everything:
  - create, rename and delete **Subjects** in any year or semester
  - create, rename and delete **Folders** (nested to any depth) inside any section
  - upload, rename and delete **Files** anywhere
  - delete any file uploaded by a student in PYQs
  - **grant or revoke PYQ-upload permission** for any student (see 5.3)
- Deleting a subject or folder asks for confirmation and then removes **everything inside it recursively**, both the JSON records and the actual files in `/uploads`.

### 5.2 Student
- Registers with name, **PRN** (unique, 10 digits), email, password and **Admission Year** (batch, for example 2024).
- **Current year of study is calculated automatically** from the admission year and today's date. The academic year starts in **July**, and the result is capped between 1 and 4. So when batches move up every year, the student's dashboard **automatically shows their new year**, and nobody has to update anything. Show "Year 4 / Alumni" if the result is above 4.
- Can **view, preview and download everything in all 4 years**. The dashboard opens on their own year by default, but they can browse juniors' or seniors' years.
- **Cannot** create, rename or delete subjects, folders or files anywhere, and **cannot upload** in Study Material or Other.
- **PYQ exception:** only if a faculty member has given them permission (`canUploadPYQ = true`), they can **upload files** and create folders (for example `2023`, `2024`) **inside the PYQs section only**. They still cannot delete or rename anything. Only faculty can clean up.

### 5.3 PYQ Contributor Permission
- A faculty-only page, **"Manage Students"**, lists all students in a table: Name, PRN, Batch, Current Year, PYQ Permission.
- The table has a search box (by name or PRN) and a filter by year.
- A toggle or button in each row grants or revokes `canUploadPYQ`.
- The idea: senior students who have written those exams upload their papers to help juniors.

### 5.4 Permission rules (enforce on the SERVER, not only by hiding buttons)

| Action | Faculty | Student (normal) | Student (PYQ-permitted) |
|---|---|---|---|
| View / preview / download any file | ✅ | ✅ | ✅ |
| Create / rename / delete Subject | ✅ | ❌ | ❌ |
| Create / rename / delete folder in Study Material or Other | ✅ | ❌ | ❌ |
| Upload file to Study Material or Other | ✅ | ❌ | ❌ |
| Create folder in PYQs | ✅ | ❌ | ✅ |
| Upload file to PYQs | ✅ | ❌ | ✅ |
| Rename / delete anything in PYQs | ✅ | ❌ | ❌ |
| Grant / revoke PYQ permission | ✅ | ❌ | ❌ |

Every protected API route must check the session role with small middleware functions: `isLoggedIn`, `isFaculty`, and `canWriteHere(section)`. If a student calls a faculty API directly (for example with Postman), the server must return **403 Forbidden**.

---

## 6. INFORMATION STRUCTURE (THE CORE OF THE PROJECT)

```
CSE ResourceHub
├── Year 1  ── Semester 1, Semester 2
├── Year 2  ── Semester 3, Semester 4
├── Year 3  ── Semester 5, Semester 6
└── Year 4  ── Semester 7, Semester 8
        └── Subject (created by faculty, e.g. "Basic Web Programming")
              ├── 📘 Study Material   (faculty only)  → syllabus, PPTs, teacher notes, reference books
              ├── 📝 PYQs             (faculty + permitted students) → past year papers
              └── 📢 Other            (faculty only)  → marks announcement PDFs, ERC, notices
                    └── any number of nested sub-folders → files
```

- The 4 years and 8 semesters are **fixed** and built into the app. They are not created by users.
- **Subjects** are created by faculty under a specific semester. Fields: subject name, subject code (optional, for example `CSE2301`), and faculty-in-charge name (automatically the creator, and editable).
- When a subject is created, the server **automatically creates its 3 fixed sections**: Study Material, PYQs and Other. These 3 cannot be deleted or renamed. They are deleted only when the whole subject is deleted.
- Inside each section, faculty can create **unlimited nested folders**, for example `Study Material/Unit 1/PPTs`, `PYQs/2024/Mid-Sem`, or `Other/Marks/Internal Test 1`.
- Each **file record** stores: original name, stored filename, file size, MIME type, uploaded-by name and role, upload date, and parent folder id.

---

## 7. DATA MODEL (JSON FILES)

Use this exact shape, or something very close to it.

**data/users.json**
```json
[
  { "id": "u1", "role": "faculty", "name": "Dr. A. Shah", "email": "ashah@msubaroda.ac.in",
    "passwordHash": "$2a$10$...", "createdAt": "2026-07-01T10:00:00Z" },
  { "id": "u2", "role": "student", "name": "Neel Prajapati", "prn": "8024055612",
    "email": "neel@example.com", "admissionYear": 2024, "canUploadPYQ": false,
    "passwordHash": "$2a$10$...", "createdAt": "2026-07-02T10:00:00Z" }
]
```

**data/subjects.json**
```json
[
  { "id": "s1", "name": "Basic Web Programming", "code": "CSE2301", "year": 2, "semester": 3,
    "facultyName": "Dr. A. Shah", "createdBy": "u1", "createdAt": "..." }
]
```

**data/items.json** (folders and files in one list, linked by `parentId`)
```json
[
  { "id": "f1", "type": "folder", "name": "Study Material", "subjectId": "s1", "section": "material",
    "parentId": null, "isRoot": true, "createdBy": "u1", "createdAt": "..." },
  { "id": "f2", "type": "folder", "name": "Unit 1", "subjectId": "s1", "section": "material",
    "parentId": "f1", "isRoot": false, "createdBy": "u1", "createdAt": "..." },
  { "id": "x1", "type": "file", "name": "Unit1_HTML_Basics.pdf", "storedName": "1719999999-8k2j.pdf",
    "size": 2345678, "mime": "application/pdf", "subjectId": "s1", "section": "material",
    "parentId": "f2", "uploadedBy": "u1", "uploaderName": "Dr. A. Shah", "uploaderRole": "faculty",
    "createdAt": "..." }
]
```

`section` is always one of `"material"`, `"pyq"` or `"other"`.

Generate ids with `Date.now().toString(36) + Math.random().toString(36).slice(2, 6)`. No extra package is needed.

`db.js` must export simple functions: `readData(name)`, `writeData(name, array)`, `findById(...)`, and so on. Write with `fs.writeFileSync` so the logic stays simple. Create the files with `[]` if they are missing.

---

## 8. BACKEND: REST API (Express)

All routes return JSON in the form `{ success: true/false, message, data }`.

**Auth**
- `POST /api/register/student`: name, prn, email, password, admissionYear. Validate that the PRN is 10 digits and unique, the email is unique, and the password has at least 6 characters.
- `POST /api/register/faculty`: name, email, password, secretCode.
- `POST /api/login`: email or PRN, and password. Creates the session.
- `POST /api/logout`
- `GET  /api/me`: current user plus the calculated `currentYear`. The frontend uses it on every page to know who is logged in.

**Browse (any logged-in user)**
- `GET /api/years`: the 4 years with their semesters and subject counts.
- `GET /api/subjects?year=2&semester=3`
- `GET /api/subjects/:id`: the subject plus the ids of its 3 root section folders.
- `GET /api/folders/:id/contents`: child folders and files, plus the **breadcrumb** path from the subject down to this folder.
- `GET /api/files/:id/download`: sends the file with its original name (`res.download`).
- `GET /api/files/:id/view`: opens the file inline in the browser (PDFs and images).
- `GET /api/search?q=...&year=...`: searches file and folder names, returning the path to each result.
- `GET /api/recent?limit=10`: the latest uploads, for the dashboard.

**Faculty only**
- `POST   /api/subjects` · `PUT /api/subjects/:id` · `DELETE /api/subjects/:id` (recursive)
- `PUT    /api/folders/:id` (rename) · `DELETE /api/folders/:id` (recursive; refuse if `isRoot`)
- `PUT    /api/files/:id` (rename) · `DELETE /api/files/:id` (also removes the file from `/uploads`)
- `GET    /api/students?search=&year=` · `PUT /api/students/:id/pyq-permission` with `{ allow: true/false }`

**Faculty, or a PYQ-permitted student in the PYQ section only**
- `POST /api/folders`: `{ name, parentId }`. The server looks up the parent's section to decide whether this user is allowed.
- `POST /api/upload`: multipart upload (`files[]` for multiple files, plus `parentId`). The server checks permission from the parent folder's section.

**Upload rules**
- Allowed extensions: `.pdf .ppt .pptx .doc .docx .xls .xlsx .txt .jpg .jpeg .png .zip .rar`
- Maximum **25 MB per file**, and up to 10 files per upload.
- Stored name is `Date.now() + random + ext`. Never use the user's filename as the path, to prevent path traversal.
- If a file with the same name already exists in the folder, add ` (1)`, ` (2)` and so on to the display name.
- Show clear error messages for a wrong file type, a file that is too large, or a missing folder.

**Other server requirements**
- Serve `/public` as static files. Visiting a protected page without being logged in redirects to `login.html`. The frontend checks this with `/api/me`.
- Folder and subject names: trim them, allow 1–60 characters, and reject `/ \ < > : " | ? *`.
- Handle errors in one central error handler. The server must never crash on bad input.
- Keep `server.js` short. Split code into `routes/auth.js`, `routes/browse.js`, `routes/manage.js`, `middleware/auth.js`, `db.js` and `config.js`.

---

## 9. FRONTEND: PAGES AND BEHAVIOUR

All pages share one `css/style.css` and a common header or navbar, injected by `js/common.js`. Use plain HTML files:

1. **index.html (Landing):** hero section with the project name and tagline ("One place for every CSE resource, uploaded once and available forever"), the problem vs. solution in 3 cards (No more WhatsApp forwards / No broken Drive links / Organized year-wise), and Login and Register buttons. Include the MSU CSE Department name.
2. **login.html:** one form for email or PRN and a password. After login, faculty and students both go to `dashboard.html`.
3. **register.html:** two tabs, **Student** and **Faculty**. The faculty tab shows the Secret Code field. Validate on the client side too (PRN length, password match, required fields), and show inline error messages.
4. **dashboard.html:**
   - Greeting: "Welcome, Neel (Student · Year 2 · Batch 2024)" or "Welcome, Dr. Shah (Faculty)".
   - **4 large Year cards** (1st–4th Year). A student's own year is highlighted with a "Your Year" badge. Each card shows its semesters and the number of subjects.
   - A **Recent Uploads** list with the latest 10 files: file name, subject, section, uploader, and time ago.
   - A global **Search** bar.
   - Faculty also see a quick link to **Manage Students**.
5. **year.html?year=2:** two columns or tabs, one for each semester (Sem 3 | Sem 4), showing **Subject cards** (name, code, faculty, number of files). Faculty see **"+ Add Subject"** (opens a modal: name, code, semester), and **Edit** and **Delete** on each card.
6. **subject.html?id=...:** the main file-explorer page.
   - Subject header (name, code, faculty, year and semester).
   - **3 tabs:** 📘 Study Material | 📝 PYQs | 📢 Other.
   - A **breadcrumb** (`2nd Year › Sem 3 › BWP › PYQs › 2024`) where every part can be clicked.
   - **Folders shown first, then files**, as a list or grid, with a toggle between the two views.
   - Each file row shows: an icon by type (PDF, PPT, DOC, image, ZIP), name, size (for example "2.3 MB"), uploaded by (with a "Faculty" or "Student" badge), date, a **View** button (PDF and images open in a new tab), and a **Download** button.
   - A toolbar with search inside the current folder and sorting (name, date, size), both done on the client side.
   - **Toolbar buttons appear only if allowed:** "+ New Folder" and "⬆ Upload Files" for faculty (all tabs) and for permitted students (PYQs tab only). Rename and Delete icons appear on each row for faculty only.
   - An **upload modal** with multi-file select and drag-and-drop, showing the list of chosen files with their sizes and a **progress bar** (use `XMLHttpRequest` `upload.onprogress`, which matches the AJAX lab).
   - A **delete confirmation modal**, for example: "Delete folder 'Unit 1' and all 12 items inside? This cannot be undone."
   - **Empty states**, for example "No PYQs uploaded yet. Seniors, ask your faculty for upload access!"
   - PYQs tab info banner for normal students: "Only students permitted by faculty can upload PYQs."
7. **manage-students.html (faculty only):** the student table with search, a year filter and PYQ permission toggles. A student opening this page is redirected away.
8. **profile.html:** shows the user's details and has a change-password form.
9. **about.html:** the problem, the solution, the features, the future scope and the team or credits.

**UX details**
- **Toast notifications** (bottom-right, fade in and out using jQuery) for success and error messages such as "File uploaded", "Folder deleted" or "Permission denied".
- A loading spinner while data is being fetched.
- Escape all user-provided text before putting it into the page, to prevent XSS (use a small `escapeHTML()` helper, or use `textContent`).
- A **fully responsive** layout: cards stack on mobile, the navbar becomes a hamburger menu, and tables scroll horizontally.

---

## 10. DESIGN AND LOOK

- Clean, modern and academic. Primary colour **deep maroon `#7a1c1c`** (MSU feel), with navy `#1e2a44`, a light grey background `#f4f6f9`, white cards, soft shadows and `border-radius: 10px`.
- Section colours: Study Material **blue**, PYQs **green**, Other **orange**. Use them for tab underlines and icons.
- Font: `"Poppins"` or `"Segoe UI"`, sans-serif. Use Unicode or emoji icons (📁 📄 📘 📝 📢 ⬇ 🗑 ✏) so no icon library is needed.
- CSS must use Flexbox or Grid, `:root` CSS variables for colours, hover effects and small transitions. Keep it in a single `style.css` with commented sections (Navbar, Cards, Tables, Modals, Toasts, Responsive).

---

## 11. PROJECT FOLDER STRUCTURE (produce exactly this)

```
cse-resourcehub/
├── server.js
├── config.js              # PORT, SESSION_SECRET, FACULTY_SECRET_CODE, MAX_FILE_SIZE, ALLOWED_EXT
├── db.js                  # JSON read/write helpers
├── seed.js                # creates demo users, subjects, folders
├── package.json
├── README.md
├── middleware/
│   └── auth.js            # isLoggedIn, isFaculty, canWriteHere
├── routes/
│   ├── auth.js
│   ├── browse.js
│   └── manage.js
├── data/
│   ├── users.json
│   ├── subjects.json
│   └── items.json
├── uploads/               # actual uploaded files (with .gitkeep)
└── public/
    ├── index.html  login.html  register.html  dashboard.html
    ├── year.html   subject.html  manage-students.html  profile.html  about.html
    ├── css/style.css
    └── js/
        ├── common.js      # navbar, /api/me check, toast, escapeHTML, formatSize, timeAgo
        ├── auth.js        # login + register pages
        ├── dashboard.js
        ├── year.js
        ├── subject.js     # file explorer logic
        └── students.js    # manage students page
```

---

## 12. SEED DATA (`node seed.js`)

Create:
- 2 faculty accounts, for example `faculty@msu.ac.in` / `faculty123`
- 3 students from different batches (so they land in Year 1, Year 2 and Year 4), one of them with `canUploadPYQ: true`, for example `student@msu.ac.in` / `student123`
- 2–3 subjects in several semesters (for example Year 1 Sem 1 "Programming in C", Year 2 Sem 3 "Basic Web Programming", Year 2 Sem 3 "Data Structures", Year 3 Sem 5 "Operating Systems"), each with its 3 sections and a few sample sub-folders (`Unit 1`, `Unit 2`, `2024`, `2025`, `Marks`)

List all demo logins in the README.

---

## 13. CODE-QUALITY RULES

1. Simple and readable: descriptive variable names, and small functions of fewer than about 40 lines.
2. **Comments on every function and every major block**, written so a student can explain them in a viva.
3. No unused code, no `console.log` spam, and no placeholders. Everything must work.
4. Use `async/await` with `fetch` on the frontend, or jQuery AJAX. Pick one style and use it everywhere.
5. Check permissions on the server for every write action, even if the button is hidden on the client.
6. Validate inputs on both the client and the server.
7. Keep each file under about 300 lines where possible.

---

## 14. ACCEPTANCE TESTS (the app must pass all of these)

1. A student registers with admission year 2024 and, in Sept 2026, the dashboard shows **Year 3**.
2. Registering as faculty with a wrong secret code fails with a clear message.
3. A faculty member creates the subject "BWP" in Year 2 → Sem 3, and the Study Material, PYQs and Other sections appear automatically.
4. A faculty member creates `Study Material/Unit 1/PPTs`, uploads 3 files with a progress bar, and they appear with size, uploader and date.
5. A normal student opens the same subject, can view and download every file, and sees **no** upload, new-folder, rename or delete buttons.
6. A normal student sends `DELETE /api/files/:id` or `POST /api/upload` directly and gets **403**.
7. A faculty member grants PYQ permission to a student. That student can now create a folder `2025` and upload a paper **inside PYQs only**. In the Study Material and Other tabs, the upload button is still hidden, and the API still returns 403.
8. A faculty member revokes the permission, and the student's next PYQ upload is refused.
9. A faculty member deletes the folder `Unit 1`. Everything inside it is removed from `items.json` **and** from the `/uploads` folder.
10. Deleting a subject removes all its folders and files.
11. Uploading a `.exe` or a 40 MB file is rejected with a friendly error.
12. The breadcrumb, search, sorting and the grid/list toggle all work, and the layout works at 375px mobile width.
13. After a server restart, all data and files are still there (permanent storage).
14. A logged-out user who opens `subject.html` is redirected to login.

---

## 15. FUTURE SCOPE (mention in the About page and README; do not build)

Announcements and notice board · event updates · placement and internship resources · discussion forum per subject · email alerts for new uploads · approval workflow for student uploads · MySQL/MongoDB migration · admin (HOD) role · file version history · download analytics.

---

## 16. OUTPUT FORMAT (how to deliver)

Deliver in this order, with **every file given in full** (no "rest remains same" or "...").

1. Short overview of the architecture (5–8 lines) and the folder tree.
2. `package.json`, `config.js`, `db.js`, `seed.js`
3. `middleware/auth.js`, then `routes/auth.js`, `routes/browse.js`, `routes/manage.js`, then `server.js`
4. `public/css/style.css`
5. `public/js/common.js`, then each page's JS file
6. Each HTML page
7. `README.md`: prerequisites (Node 18+), install and run steps, demo logins, feature list, the permission table, the folder structure, screenshots placeholders, and future scope
8. Optional appendix: the equivalent MySQL schema (`users`, `subjects`, `items` tables)
9. A final checklist mapping each acceptance test in section 14 to the code that satisfies it

If the response gets too long, stop at a clean file boundary and say **"Type CONTINUE for the next part"**. Never cut a file in half.
