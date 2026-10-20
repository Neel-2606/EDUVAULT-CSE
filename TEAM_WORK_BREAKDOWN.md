# 🎓 CSE ResourceHub - Team Work Breakdown

This document outlines the division of work among our 4-person team for the **Basics of Web Programming** lab project. The work has been equally divided to ensure each team member contributed significantly to both the core requirements of the subject and the advanced features of the project.

---

## 🧑‍💻 Team Member 1: UI/UX & Frontend Architecture (HTML5 & CSS3)
**Focus:** Visual design, responsive layouts, and overall user experience.
*   **Core Layouts:** Designed and developed the HTML structure for all main pages (`index.html`, `login.html`, `dashboard.html`, `year.html`).
*   **Styling & CSS:** Implemented the entire design system in `style.css` using modern CSS Grid and Flexbox techniques, avoiding the need for external CSS frameworks to strictly adhere to "Basics of Web Programming" principles.
*   **Responsiveness:** Ensured the web application is fully responsive and works flawlessly on mobile devices (down to 375px) using CSS media queries.
*   **UI Components:** Designed the interactive elements like the file explorer grid/list views, navigation bar, and custom cards for subjects.

## 🧑‍💻 Team Member 2: Frontend Interactivity & DOM Manipulation (JavaScript & jQuery)
**Focus:** Client-side logic, API integration, and dynamic rendering.
*   **Dynamic UI:** Wrote the client-side JavaScript (`common.js`, `dashboard.js`, `subject.js`) to dynamically manipulate the DOM and update the UI without reloading the page.
*   **API Integration:** Handled all `fetch()` and AJAX requests to communicate with the backend, fetching JSON data and rendering it dynamically into HTML tables and lists.
*   **Client-Side Validation:** Implemented robust form validation for the registration and login forms to ensure correct data is sent to the server.
*   **User Feedback:** Programmed the interactive elements like Toast notifications, modal popups, and the live progress bar for file uploads.

## 🧑‍💻 Team Member 3: Backend Logic, Routing & Authentication (Node.js & Express.js)
**Focus:** Server setup, API endpoints, and user security.
*   **Server Setup:** Configured the `server.js` file using Express.js to serve static files and handle incoming HTTP requests.
*   **API Routing:** Designed and developed the RESTful API routes (`routes/auth.js`, `routes/browse.js`) for data retrieval and user actions.
*   **Authentication & Security:** Implemented user login and registration logic, utilizing `express-session` for session tracking and `bcryptjs` for secure password hashing.
*   **Role-Based Access Control:** Wrote the custom middleware (`middleware/auth.js`) to ensure students cannot access faculty privileges, enforcing strict security on the server side.

## 🧑‍💻 Team Member 4: Data Management & File Processing (JSON DB & Multer)
**Focus:** Data persistence, file upload handling, and system logic.
*   **Custom JSON Database:** Engineered the `db.js` module to use plain JSON files (`users.json`, `subjects.json`, `items.json`) for data storage, bypassing the need for an external SQL database while maintaining relationships.
*   **File Upload System:** Implemented backend file uploading using the `multer` package (`routes/manage.js`), including complex logic to handle multiple files, check file types, and validate sizes.
*   **Core System Logic:** Built the algorithms for the file explorer (e.g., generating breadcrumbs, nested folder structures, and recursive deletion of folders/subjects).
*   **Seed Data:** Developed the `seed.js` script to automatically generate demo users, folders, and files for project presentation and testing.

---

### 📝 Summary for Evaluation
By dividing the project into these four distinct pillars—**Structure (HTML/CSS), Interactivity (Client JS), Server Logic (Express), and Data/Files (Node fs/Multer)**—our team successfully covered all critical learning outcomes of the Basics of Web Programming syllabus while delivering a fully functional, production-ready application.
