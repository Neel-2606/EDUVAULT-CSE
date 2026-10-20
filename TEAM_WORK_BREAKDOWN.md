# 🎓 CSE ResourceHub - Team Work Breakdown

This document outlines the division of work among our **4-person team** for the **Basics of Web Programming (BWP)** lab project. The project was divided into four distinct pillars—**Structure (HTML/CSS), Interactivity (Client JS), Server Logic (Express), and Data/Files (Node fs/Multer)**—ensuring each team member contributed equally to both syllabus requirements and advanced full-stack functionality.

---

## 👥 Team Roster & Role Assignment

| Role | Pillar & Focus Area | Team Member |
|---|---|---|
| **Member 1** | UI/UX & Frontend Architecture (HTML5 & CSS3) | **Neel** |
| **Member 2** | Frontend Interactivity & DOM (JavaScript & jQuery) | **Sumit** |
| **Member 3** | Backend Logic, Routing & Authentication (Node.js & Express) | **Krushit** |
| **Member 4** | Data Management & File Processing (JSON DB, Multer & Supabase) | **Aryan** |

---

## 🧑‍💻 Team Member 1 (Neel): UI/UX & Frontend Architecture (HTML5 & CSS3)
**Focus:** Visual design, responsive layouts, and overall user experience.
*   **Core Layouts:** Designed and developed the semantic HTML5 structure for all 9 application pages:
    *   Public & Authentication: `index.html` (Landing), `about.html`, `login.html`, `register.html`
    *   Application Core: `dashboard.html`, `year.html` (Semesters), `subject.html` (File Explorer), `manage-students.html`, `profile.html`
*   **Styling & Design System:** Implemented the complete design system in `style.css` using modern CSS Grid, Flexbox, and CSS Custom Properties (`:root` tokens for palette, shadows, radius), strictly avoiding external CSS frameworks (Bootstrap/Tailwind) to adhere to BWP core fundamentals.
*   **Mobile Responsiveness:** Built a fully responsive layout with custom media queries (down to 375px mobile screens), including a collapsing mobile navigation drawer and responsive horizontal-scroll tables.
*   **UI Components:** Designed cards, tabs, modal overlays, file drop zones, breadcrumb navigation, and grid/list explorer views.

## 🧑‍💻 Team Member 2 (Sumit): Frontend Interactivity & DOM Manipulation (JavaScript & jQuery)
**Focus:** Client-side logic, API integration, and dynamic rendering.
*   **Dynamic UI & Explorer:** Wrote the client-side JavaScript (`common.js`, `dashboard.js`, `subject.js`, `year.js`) to dynamically manipulate the DOM and update the UI without full-page reloads.
*   **API & AJAX Integration:** Handled all `fetch()` and `XMLHttpRequest` calls to communicate with Express REST endpoints, receiving JSON and dynamically generating DOM trees.
*   **Client-Side Validation:** Built robust regex and real-time form validation (`auth.js`) for login, student registration (10-digit PRN validation), and faculty registration.
*   **User Feedback & Upload Tracker:** Programmed toast notification banners, confirmation modals, search filter debounce, and the live upload progress bar via `XMLHttpRequest.upload.onprogress`.

## 🧑‍💻 Team Member 3 (Krushit): Backend Logic, Routing & Authentication (Node.js & Express.js)
**Focus:** Server setup, API endpoints, and user security.
*   **Server Architecture:** Configured `server.js` using Express.js to serve static assets, parse JSON payloads, and manage central error handling.
*   **API Routing:** Designed and developed modular RESTful API route modules (`routes/auth.js`, `routes/browse.js`) for authentication, academic browsing, and search queries.
*   **Authentication & Security:** Implemented session tracking with `express-session`, password hashing via `bcryptjs` (salt rounds: 10), and flexible login by either email or 10-digit PRN.
*   **Role-Based Access Control (RBAC):** Built server-side middleware (`middleware/auth.js`) with `isLoggedIn`, `isFaculty`, and `canWriteHere` to enforce security strictly on the backend (401 Unauthorized / 403 Forbidden).

## 🧑‍💻 Team Member 4 (Aryan): Data Management & File Processing (JSON DB, Multer & Supabase)
**Focus:** Data persistence, file upload handling, and system logic.
*   **Custom JSON & Cloud Database:** Engineered the `db.js` storage layer simulating database tables (`users.json`, `subjects.json`, `items.json`) via Node.js `fs` module, upgraded with Supabase PostgreSQL cloud synchronization.
*   **File Upload Pipeline:** Built multi-file upload processing using `multer` (`routes/manage.js`) with disk storage sanitization, MIME/extension whitelisting, and a 25MB file size limit.
*   **Cascading Deletion & Breadcrumbs:** Implemented the recursive deletion algorithm (`getDescendants()`) that removes nested folders/files from both JSON and disk storage simultaneously, along with ancestor breadcrumb resolvers.
*   **Automated Promotion & Seed Data:** Created the academic year calculation algorithm (`getStudyYear()`) that auto-promotes students every July, plus `seed.js` and `seed-supabase.js` for one-command test data generation.

---

### 📝 Summary for Evaluation
By dividing the project into these four distinct pillars—**Structure (HTML/CSS), Interactivity (Client JS), Server Logic (Express), and Data/Files (Node fs/Multer)**—our team successfully covered all critical learning outcomes of the Basics of Web Programming syllabus while delivering a fully functional, production-ready application.
