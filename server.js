// server.js (Root entry point)
// Allows running `node server.js` directly from the repository root directory.

const path = require('path');
process.chdir(path.join(__dirname, 'cse-resourcehub'));
require('./cse-resourcehub/server');
