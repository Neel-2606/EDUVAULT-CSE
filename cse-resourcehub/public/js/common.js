// common.js
// Code shared by every page: navbar, footer, login check, toasts, modals and small helpers.

const YEAR_LABELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const SECTION_INFO = {
  material: { label: 'Study Material', icon: '📘' },
  pyq: { label: 'PYQs', icon: '📝' },
  other: { label: 'Other', icon: '📢' }
};

/* ---------- Small helpers ---------- */

// Makes user text safe to put inside HTML (stops XSS attacks)
function escapeHTML(text) {
  return String(text === undefined || text === null ? '' : text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// 2345678 -> "2.2 MB"
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ISO date -> "22 Sept 2026"
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ISO date -> "5 min ago", "3 hours ago", "2 days ago"
function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return Math.floor(seconds / 60) + ' min ago';
  if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
  if (seconds < 86400 * 7) return Math.floor(seconds / 86400) + ' days ago';
  return formatDate(dateString);
}

// Reads a value from the address bar, e.g. getParam('year') on year.html?year=2 -> "2"
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// Picks an emoji icon from the file extension
function fileIcon(fileName) {
  const ext = String(fileName).split('.').pop().toLowerCase();
  if (ext === 'pdf') return '📕';
  if (ext === 'ppt' || ext === 'pptx') return '📊';
  if (ext === 'doc' || ext === 'docx') return '📄';
  if (ext === 'xls' || ext === 'xlsx') return '📗';
  if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') return '🖼️';
  if (ext === 'zip' || ext === 'rar') return '🗜️';
  return '📃';
}

// Text shown for a student's year, e.g. "Year 2" or "Year 4 / Alumni"
function studentYearText(user) {
  return user.isAlumni ? 'Year 4 / Alumni' : 'Year ' + user.currentYear;
}

/* ---------- Talking to the server ---------- */

// Calls our API and always returns an object like { success, message, data, status }
async function api(url, method, body) {
  const options = { method: method || 'GET', headers: {} };
  if (body) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  let result;
  try {
    const response = await fetch(url, options);
    result = await response.json();
    result.status = response.status;
  } catch (error) {
    result = { success: false, message: 'Could not reach the server. Is it running?', status: 0 };
  }
  return result;
}

/* ---------- Toasts, loader, empty state ---------- */

// Small message at the bottom-right that fades away. type = 'success' or 'error'
function showToast(message, type) {
  const toast = $('<div class="toast"></div>').addClass('toast-' + (type || 'success')).text(message);
  $('#toast-area').append(toast);
  toast.hide().fadeIn(250);
  setTimeout(function () {
    toast.fadeOut(400, function () { toast.remove(); });
  }, 3200);
}

function loadingHTML(text) {
  return '<div class="loader"><div class="spinner"></div><p>' + escapeHTML(text || 'Loading...') + '</p></div>';
}

function emptyStateHTML(icon, message) {
  return '<div class="empty-state"><div class="big-icon">' + icon + '</div><p>' + escapeHTML(message) + '</p></div>';
}

/* ---------- Modals ---------- */

function openModal(id) { $('#' + id).addClass('open'); }
function closeModal(id) { $('#' + id).removeClass('open'); }

// Shows a "Are you sure?" box. Returns a Promise that gives true (OK) or false (Cancel).
function confirmAction(message, okText) {
  return new Promise(function (resolve) {
    $('#confirm-message').text(message);
    $('#confirm-ok').text(okText || 'Delete');
    openModal('confirm-modal');
    $('#confirm-ok').off('click').on('click', function () { closeModal('confirm-modal'); resolve(true); });
    $('#confirm-cancel').off('click').on('click', function () { closeModal('confirm-modal'); resolve(false); });
  });
}

// Adds the toast area and the shared confirm box to the page (only once)
function addSharedElements() {
  if ($('#toast-area').length) return;
  $('body').append('<div id="toast-area"></div>');
  $('body').append(
    '<div class="modal" id="confirm-modal"><div class="modal-box">' +
      '<div class="modal-head"><h3>Please confirm</h3></div>' +
      '<div class="modal-body"><p id="confirm-message"></p></div>' +
      '<div class="modal-foot"><button class="btn btn-grey" id="confirm-cancel">Cancel</button>' +
      '<button class="btn btn-danger" id="confirm-ok">Delete</button></div>' +
    '</div></div>'
  );
  // Any button with data-close="modal-id" closes that modal
  $(document).on('click', '[data-close]', function () { closeModal($(this).data('close')); });
}

/* ---------- Navbar & footer ---------- */

// Draws the navbar (different links for guests, students and faculty) and the footer
function renderLayout(user) {
  let links = '';
  if (user) {
    links += '<a href="dashboard.html">Dashboard</a>';
    if (user.role === 'faculty') links += '<a href="manage-students.html">Manage Students</a>';
    links += '<a href="about.html">About</a>';
    // Faculty see their full name ("Dr. A. Shah"), students their first name
    const shortName = user.role === 'faculty' ? user.name : user.name.split(' ')[0];
    links += '<a href="profile.html">👤 ' + escapeHTML(shortName) + '</a>';
    links += '<button class="btn btn-light btn-sm" id="logout-btn">Logout</button>';
  } else {
    links += '<a href="index.html">Home</a><a href="about.html">About</a><a href="login.html">Login</a>';
    links += '<a href="register.html" class="btn btn-light btn-sm">Register</a>';
  }

  $('#navbar').html(
    '<div class="nav-inner">' +
      '<a class="brand" href="' + (user ? 'dashboard.html' : 'index.html') + '">🎓 CSE <span>ResourceHub</span></a>' +
      '<button class="nav-toggle" aria-label="Menu">☰</button>' +
      '<nav class="nav-links">' + links + '</nav>' +
    '</div>'
  );

  // Highlight the link of the current page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  $('.nav-links a').each(function () {
    if ($(this).attr('href') === currentPage) $(this).addClass('active');
  });

  $('#footer').html('© ' + new Date().getFullYear() + ' CSE ResourceHub · Department of Computer Science &amp; Engineering, ' +
                    'The Maharaja Sayajirao University of Baroda');
  addSharedElements();
}

// Events for the navbar (hamburger menu + logout)
$(document).on('click', '.nav-toggle', function () { $('.nav-links').toggleClass('show'); });
$(document).on('click', '#logout-btn', async function () {
  await api('/api/logout', 'POST');
  window.location.href = 'login.html';
});

/* ---------- Login check ---------- */

// For protected pages: sends guests to login.html (and students away from faculty pages).
// Returns the logged-in user.
async function requireLogin(facultyOnly) {
  const result = await api('/api/me');
  if (!result.success) {
    window.location.href = 'login.html';
    return null;
  }
  if (facultyOnly && result.data.role !== 'faculty') {
    window.location.href = 'dashboard.html';
    return null;
  }
  renderLayout(result.data);
  return result.data;
}

// For public pages: draws the navbar for whoever is visiting (guest or logged in)
async function loadPublicLayout() {
  const result = await api('/api/me');
  const user = result.success ? result.data : null;
  renderLayout(user);
  return user;
}

// Pages marked <body data-page="public"> (home, about) only need the navbar
$(function () {
  if ($('body').data('page') === 'public') loadPublicLayout();
});
