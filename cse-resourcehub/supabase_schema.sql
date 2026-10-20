-- ==============================================================================
-- 🎓 CSE ResourceHub - Complete Supabase PostgreSQL Schema & Seed Data Script
-- ==============================================================================
-- INSTRUCTIONS:
-- 1. Open your Supabase Project: https://supabase.com/dashboard
-- 2. Go to the "SQL Editor" tab on the left sidebar.
-- 3. Click "+ New query", paste this entire script, and click "Run".
-- 4. All tables (users, subjects, items) will be created with primary keys,
--    foreign keys, indexes, and full demo data populated!
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. DROP EXISTING TABLES (Clean Slate)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ------------------------------------------------------------------------------
-- 2. CREATE TABLE: users
-- ------------------------------------------------------------------------------
CREATE TABLE users (
  id              TEXT PRIMARY KEY,
  role            TEXT NOT NULL CHECK (role IN ('faculty', 'student')),
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  prn             TEXT UNIQUE,                                    -- Students only (10 digits)
  admission_year  INTEGER,                                        -- Students only
  can_upload_pyq  BOOLEAN DEFAULT FALSE,                          -- Senior students granted PYQ access
  password_hash   TEXT NOT NULL,                                  -- bcrypt hash
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. CREATE TABLE: subjects
-- ------------------------------------------------------------------------------
CREATE TABLE subjects (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  code            TEXT,
  year            SMALLINT NOT NULL CHECK (year BETWEEN 1 AND 4),
  semester        SMALLINT NOT NULL CHECK (semester BETWEEN 1 AND 8),
  faculty_name    TEXT,
  created_by      TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. CREATE TABLE: items (Folders and Uploaded Files)
-- ------------------------------------------------------------------------------
CREATE TABLE items (
  id              TEXT PRIMARY KEY,
  type            TEXT NOT NULL CHECK (type IN ('folder', 'file')),
  name            TEXT NOT NULL,
  subject_id      TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  section         TEXT NOT NULL CHECK (section IN ('material', 'pyq', 'other')),
  parent_id       TEXT REFERENCES items(id) ON DELETE CASCADE,     -- Recursive folder tree
  is_root         BOOLEAN DEFAULT FALSE,
  stored_name     TEXT,                                            -- Unique timestamped name on disk/storage
  size            BIGINT DEFAULT 0,                                -- In bytes
  mime            TEXT,                                            -- e.g. application/pdf, text/plain
  uploaded_by     TEXT REFERENCES users(id) ON DELETE SET NULL,
  uploader_name   TEXT,
  uploader_role   TEXT CHECK (uploader_role IN ('faculty', 'student')),
  created_by      TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_prn ON users(prn);
CREATE INDEX idx_subjects_semester ON subjects(semester);
CREATE INDEX idx_subjects_year ON subjects(year);
CREATE INDEX idx_items_subject_id ON items(subject_id);
CREATE INDEX idx_items_parent_id ON items(parent_id);
CREATE INDEX idx_items_section ON items(section);
CREATE INDEX idx_items_type ON items(type);
CREATE INDEX idx_items_created_at ON items(created_at DESC);

-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Grant access for anon/authenticated (since authentication & authorization is verified by the Express server)
CREATE POLICY "Allow all operations on users" ON users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on subjects" ON subjects FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on items" ON items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- 7. INSERT SEED DATA
-- ==============================================================================

-- 7.1 Users (Faculty & Students)
-- Passwords:
--   faculty: faculty123
--   students: student123
INSERT INTO users (id, role, name, email, prn, admission_year, can_upload_pyq, password_hash, created_at) VALUES
('mucm9zv9etn4', 'faculty', 'Dr. A. Shah', 'faculty@msu.ac.in', NULL, NULL, FALSE, '$2a$10$qH.i8fivMi3nCoUKO9Oz3.RkiCf3jI7.5qVTrTfsf9Vypr9Nqs1Ty', '2026-09-22 02:01:52.331+00'),
('mucm9zxobidi', 'faculty', 'Prof. R. Mehta', 'faculty2@msu.ac.in', NULL, NULL, FALSE, '$2a$10$nzsm0AQDa2xgGtA3lmnGTeLrKobbep0h3xE/M8yYBW8hbt7sj8Gwy', '2026-09-22 02:08:52.413+00'),
('mucm9zzxhfqp', 'student', 'Riya Patel', 'fresher@msu.ac.in', '8026000101', 2026, FALSE, '$2a$10$okHk1fFUR5FnYNx5sLhoO.BDIlL0lD/csTd2U71dtoxnN1cIgMMIi', '2026-09-22 02:15:52.499+00'),
('mucma02brdm5', 'student', 'Aarav Desai', 'student@msu.ac.in', '8025000215', 2025, FALSE, '$2a$10$gMBnTasCpGBjJyjzxwfImuf5A.5O0GnGm5f98B3Qpy5MPvjwXCOFC', '2026-09-22 02:22:52.579+00'),
('mucma04jm3nq', 'student', 'Karan Joshi', 'senior@msu.ac.in', '8023000342', 2023, TRUE, '$2a$10$exHfOhTnsQ6VXidEa.XSpepA0Grp/ZKM2o4.F/WY06vQsH2viQjKe', '2026-09-22 02:29:52.661+00');

-- 7.2 Subjects
INSERT INTO subjects (id, name, code, year, semester, faculty_name, created_by, created_at) VALUES
('mucma06t5cuz', 'Programming in C', 'CSE1101', 1, 1, 'Dr. A. Shah', 'mucm9zv9etn4', '2026-09-22 02:36:52.661+00'),
('mucma06uqpil', 'Basic Web Programming', 'CSE2301', 2, 3, 'Dr. A. Shah', 'mucm9zv9etn4', '2026-09-22 04:07:52.662+00'),
('mucma06wiy9o', 'Data Structures', 'CSE2302', 2, 3, 'Prof. R. Mehta', 'mucm9zxobidi', '2026-09-22 05:38:52.664+00'),
('mucma06xw54t', 'Operating Systems', 'CSE3501', 3, 5, 'Prof. R. Mehta', 'mucm9zxobidi', '2026-09-22 07:09:52.665+00');

-- 7.3 Items: Root Folders (Study Material, PYQs, Other for each subject)
INSERT INTO items (id, type, name, subject_id, section, parent_id, is_root, stored_name, size, mime, uploaded_by, uploader_name, uploader_role, created_by, created_at) VALUES
('mucma06tfbpa', 'folder', 'Study Material', 'mucma06t5cuz', 'material', NULL, TRUE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zv9etn4', '2026-09-22 02:43:52.661+00'),
('mucma06tp0qp', 'folder', 'PYQs', 'mucma06t5cuz', 'pyq', NULL, TRUE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zv9etn4', '2026-09-22 02:50:52.661+00'),
('mucma06tseu8', 'folder', 'Other', 'mucma06t5cuz', 'other', NULL, TRUE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zv9etn4', '2026-09-22 02:57:52.661+00'),
('mucma06uhw0n', 'folder', 'Study Material', 'mucma06uqpil', 'material', NULL, TRUE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zv9etn4', '2026-09-22 04:14:52.662+00'),
('mucma06uq4t5', 'folder', 'PYQs', 'mucma06uqpil', 'pyq', NULL, TRUE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zv9etn4', '2026-09-22 04:21:52.662+00'),
('mucma06uc1dp', 'folder', 'Other', 'mucma06uqpil', 'other', NULL, TRUE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zv9etn4', '2026-09-22 04:28:52.662+00'),
('mucma06wc0de', 'folder', 'Study Material', 'mucma06wiy9o', 'material', NULL, TRUE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zxobidi', '2026-09-22 05:45:52.664+00'),
('mucma06wol3n', 'folder', 'PYQs', 'mucma06wiy9o', 'pyq', NULL, TRUE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zxobidi', '2026-09-22 05:52:52.664+00'),
('mucma06wpelw', 'folder', 'Other', 'mucma06wiy9o', 'other', NULL, TRUE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zxobidi', '2026-09-22 05:59:52.664+00'),
('mucma06xgwyc', 'folder', 'Study Material', 'mucma06xw54t', 'material', NULL, TRUE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zxobidi', '2026-09-22 07:16:52.665+00'),
('mucma06xlo46', 'folder', 'PYQs', 'mucma06xw54t', 'pyq', NULL, TRUE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zxobidi', '2026-09-22 07:23:52.665+00'),
('mucma06x7d42', 'folder', 'Other', 'mucma06xw54t', 'other', NULL, TRUE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zxobidi', '2026-09-22 07:30:52.665+00');

-- 7.4 Items: Subfolders (Level 1)
INSERT INTO items (id, type, name, subject_id, section, parent_id, is_root, stored_name, size, mime, uploaded_by, uploader_name, uploader_role, created_by, created_at) VALUES
('mucma06tfdfm', 'folder', 'Unit 1', 'mucma06t5cuz', 'material', 'mucma06tfbpa', FALSE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zv9etn4', '2026-09-22 03:04:52.661+00'),
('mucma06tis7w', 'folder', 'Unit 2', 'mucma06t5cuz', 'material', 'mucma06tfbpa', FALSE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zv9etn4', '2026-09-22 03:11:52.661+00'),
('mucma06thuvh', 'folder', '2024', 'mucma06t5cuz', 'pyq', 'mucma06tp0qp', FALSE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zv9etn4', '2026-09-22 03:18:52.661+00'),
('mucma06trj96', 'folder', '2025', 'mucma06t5cuz', 'pyq', 'mucma06tp0qp', FALSE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zv9etn4', '2026-09-22 03:25:52.661+00'),
('mucma06ttifs', 'folder', 'Marks', 'mucma06t5cuz', 'other', 'mucma06tseu8', FALSE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zv9etn4', '2026-09-22 03:32:52.661+00'),
('mucmed6cghjg', 'folder', 'Neel', 'mucma06t5cuz', 'other', 'mucma06tseu8', FALSE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zv9etn4', '2026-09-22 11:58:16.116+00'),

('mucma06u60tx', 'folder', 'Unit 1', 'mucma06uqpil', 'material', 'mucma06uhw0n', FALSE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zv9etn4', '2026-09-22 04:35:52.662+00'),
('mucma06u10c3', 'folder', 'Unit 2', 'mucma06uqpil', 'material', 'mucma06uhw0n', FALSE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zv9etn4', '2026-09-22 04:42:52.662+00'),
('mucma06u2xl0', 'folder', '2024', 'mucma06uqpil', 'pyq', 'mucma06uq4t5', FALSE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zv9etn4', '2026-09-22 04:49:52.662+00'),
('mucma06u3vwt', 'folder', '2025', 'mucma06uqpil', 'pyq', 'mucma06uq4t5', FALSE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zv9etn4', '2026-09-22 04:56:52.662+00'),
('mucma06ub5zo', 'folder', 'Marks', 'mucma06uqpil', 'other', 'mucma06uc1dp', FALSE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zv9etn4', '2026-09-22 05:03:52.662+00'),

('mucma06wio1g', 'folder', 'Unit 1', 'mucma06wiy9o', 'material', 'mucma06wc0de', FALSE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zxobidi', '2026-09-22 06:06:52.664+00'),
('mucma06w0i8l', 'folder', 'Unit 2', 'mucma06wiy9o', 'material', 'mucma06wc0de', FALSE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zxobidi', '2026-09-22 06:13:52.664+00'),
('mucma06wmt3p', 'folder', '2024', 'mucma06wiy9o', 'pyq', 'mucma06wol3n', FALSE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zxobidi', '2026-09-22 06:20:52.664+00'),
('mucma06w87k4', 'folder', '2025', 'mucma06wiy9o', 'pyq', 'mucma06wol3n', FALSE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zxobidi', '2026-09-22 06:27:52.664+00'),
('mucma06w8z18', 'folder', 'Marks', 'mucma06wiy9o', 'other', 'mucma06wpelw', FALSE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zxobidi', '2026-09-22 06:34:52.664+00'),

('mucma06xio90', 'folder', 'Unit 1', 'mucma06xw54t', 'material', 'mucma06xgwyc', FALSE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zxobidi', '2026-09-22 07:37:52.665+00'),
('mucma06xv5ai', 'folder', 'Unit 2', 'mucma06xw54t', 'material', 'mucma06xgwyc', FALSE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zxobidi', '2026-09-22 07:44:52.665+00'),
('mucma06xk38u', 'folder', '2024', 'mucma06xw54t', 'pyq', 'mucma06xlo46', FALSE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zxobidi', '2026-09-22 07:51:52.665+00'),
('mucma06xq7re', 'folder', '2025', 'mucma06xw54t', 'pyq', 'mucma06xlo46', FALSE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zxobidi', '2026-09-22 07:58:52.665+00'),
('mucma06xmuzd', 'folder', 'Marks', 'mucma06xw54t', 'other', 'mucma06x7d42', FALSE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zxobidi', '2026-09-22 08:05:52.665+00');

-- 7.5 Items: Nested Folders (Level 2)
INSERT INTO items (id, type, name, subject_id, section, parent_id, is_root, stored_name, size, mime, uploaded_by, uploader_name, uploader_role, created_by, created_at) VALUES
('mucmei3ntwoh', 'folder', 'Neel', 'mucma06t5cuz', 'other', 'mucmed6cghjg', FALSE, NULL, 0, NULL, NULL, NULL, NULL, 'mucm9zv9etn4', '2026-09-22 11:58:22.499+00');

-- 7.6 Items: Files
INSERT INTO items (id, type, name, subject_id, section, parent_id, is_root, stored_name, size, mime, uploaded_by, uploader_name, uploader_role, created_by, created_at) VALUES
('mucma06uwvrw', 'file', 'Unit 1 - Lecture Notes.txt', 'mucma06t5cuz', 'material', 'mucma06tfdfm', FALSE, '1790078092661-fb4nbg.txt', 78, 'text/plain', 'mucm9zv9etn4', 'Dr. A. Shah', 'faculty', NULL, '2026-09-22 03:46:52.662+00'),
('mucma06u6ob1', 'file', 'CSE1101 End Sem 2025.txt', 'mucma06t5cuz', 'pyq', 'mucma06trj96', FALSE, '1790078092662-54mxex.txt', 112, 'text/plain', 'mucma04jm3nq', 'Karan Joshi', 'student', NULL, '2026-09-22 03:53:52.662+00'),
('mucma06u0rp1', 'file', 'Internal Test 1 - Marks.txt', 'mucma06t5cuz', 'other', 'mucma06ttifs', FALSE, '1790078092662-2bfms2.txt', 41, 'text/plain', 'mucm9zv9etn4', 'Dr. A. Shah', 'faculty', NULL, '2026-09-22 04:00:52.662+00'),

('mucma06vnqks', 'file', 'Basic Web Programming - Syllabus.txt', 'mucma06uqpil', 'material', 'mucma06uhw0n', FALSE, '1790078092662-bczcf8.txt', 108, 'text/plain', 'mucm9zv9etn4', 'Dr. A. Shah', 'faculty', NULL, '2026-09-22 05:10:52.663+00'),
('mucma06vctmz', 'file', 'Unit 1 - Lecture Notes.txt', 'mucma06uqpil', 'material', 'mucma06u60tx', FALSE, '1790078092663-0crfum.txt', 83, 'text/plain', 'mucm9zv9etn4', 'Dr. A. Shah', 'faculty', NULL, '2026-09-22 05:17:52.663+00'),
('mucma06v4auo', 'file', 'CSE2301 End Sem 2025.txt', 'mucma06uqpil', 'pyq', 'mucma06u3vwt', FALSE, '1790078092663-j6yy6b.txt', 117, 'text/plain', 'mucma04jm3nq', 'Karan Joshi', 'student', NULL, '2026-09-22 05:24:52.663+00'),
('mucma06w6b0e', 'file', 'Internal Test 1 - Marks.txt', 'mucma06uqpil', 'other', 'mucma06ub5zo', FALSE, '1790078092663-exngaq.txt', 41, 'text/plain', 'mucm9zv9etn4', 'Dr. A. Shah', 'faculty', NULL, '2026-09-22 05:31:52.664+00'),

('mucma06w9mth', 'file', 'Data Structures - Syllabus.txt', 'mucma06wiy9o', 'material', 'mucma06wc0de', FALSE, '1790078092664-8pscwz.txt', 102, 'text/plain', 'mucm9zxobidi', 'Prof. R. Mehta', 'faculty', NULL, '2026-09-22 06:41:52.664+00'),
('mucma06wdh3b', 'file', 'Unit 1 - Lecture Notes.txt', 'mucma06wiy9o', 'material', 'mucma06wio1g', FALSE, '1790078092664-za2jef.txt', 77, 'text/plain', 'mucm9zxobidi', 'Prof. R. Mehta', 'faculty', NULL, '2026-09-22 06:48:52.664+00'),
('mucma06xo09t', 'file', 'CSE2302 End Sem 2025.txt', 'mucma06wiy9o', 'pyq', 'mucma06w87k4', FALSE, '1790078092664-a5361m.txt', 111, 'text/plain', 'mucma04jm3nq', 'Karan Joshi', 'student', NULL, '2026-09-22 06:55:52.665+00'),
('mucma06x50f3', 'file', 'Internal Test 1 - Marks.txt', 'mucma06wiy9o', 'other', 'mucma06w8z18', FALSE, '1790078092665-0eww6a.txt', 41, 'text/plain', 'mucm9zxobidi', 'Prof. R. Mehta', 'faculty', NULL, '2026-09-22 07:02:52.665+00'),

('mucma06x1ldf', 'file', 'Operating Systems - Syllabus.txt', 'mucma06xw54t', 'material', 'mucma06xgwyc', FALSE, '1790078092665-eaftc2.txt', 104, 'text/plain', 'mucm9zxobidi', 'Prof. R. Mehta', 'faculty', NULL, '2026-09-22 08:12:52.665+00'),
('mucma06xe43u', 'file', 'Unit 1 - Lecture Notes.txt', 'mucma06xw54t', 'material', 'mucma06xio90', FALSE, '1790078092665-xqrjcv.txt', 79, 'text/plain', 'mucm9zxobidi', 'Prof. R. Mehta', 'faculty', NULL, '2026-09-22 08:19:52.665+00'),
('mucma06ym0dt', 'file', 'CSE3501 End Sem 2025.txt', 'mucma06xw54t', 'pyq', 'mucma06xq7re', FALSE, '1790078092666-05jdlq.txt', 113, 'text/plain', 'mucma04jm3nq', 'Karan Joshi', 'student', NULL, '2026-09-22 08:26:52.666+00'),
('mucma06yaoah', 'file', 'Internal Test 1 - Marks.txt', 'mucma06xw54t', 'other', 'mucma06xmuzd', FALSE, '1790078092666-n84h8b.txt', 41, 'text/plain', 'mucm9zxobidi', 'Prof. R. Mehta', 'faculty', NULL, '2026-09-22 08:33:52.666+00');

-- ==============================================================================
-- ✅ SUCCESS! Verification Query
-- ==============================================================================
SELECT 'Users count:' AS table_name, count(*) FROM users
UNION ALL
SELECT 'Subjects count:' AS table_name, count(*) FROM subjects
UNION ALL
SELECT 'Items count (folders + files):' AS table_name, count(*) FROM items;
