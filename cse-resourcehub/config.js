const path = require('path');

try {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
} catch (e) {
  // dotenv will be loaded once npm install completes
}


module.exports = {
  // Port on which the website runs -> http://localhost:3000
  PORT: process.env.PORT || 3000,

  // Secret used by express-session to sign the login cookie
  SESSION_SECRET: process.env.SESSION_SECRET || 'cse-resourcehub-msu-secret',

  // Only people who know this code can register as faculty
  FACULTY_SECRET_CODE: process.env.FACULTY_SECRET_CODE || 'CSE-MSU-2026',

  // Upload limits: 25 MB per file, 10 files per upload
  MAX_FILE_SIZE: 25 * 1024 * 1024,
  MAX_FILES: 10,

  // File types that can be uploaded
  ALLOWED_EXT: ['.pdf', '.ppt', '.pptx', '.doc', '.docx', '.xls', '.xlsx',
                '.txt', '.jpg', '.jpeg', '.png', '.zip', '.rar'],

  // Supabase cloud database configuration
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_KEY: process.env.SUPABASE_KEY || '',
  USE_SUPABASE: process.env.USE_SUPABASE === 'true' || Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_KEY)
};

