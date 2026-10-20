// common.js - Shared helpers, API calls, navbar and modals
const YEAR_LABELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

// Converts unsafe characters to safe HTML entities using jQuery
function escapeHTML(text) {
  return $('<div>').text(text || '').html();
}

// Formats bytes into readable KB or MB
function formatSize(bytes) {
  return bytes >= 1048576 ? (bytes / 1048576).toFixed(1) + ' MB' : (bytes / 1024).toFixed(1) + ' KB';
}

// Formats date into readable string (e.g. "17 Oct 2026")
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Relative time for recent uploads (e.g. "5 min ago")
function timeAgo(dateStr) {
  const min = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return min + ' min ago';
  if (min < 1440) return Math.floor(min / 60) + ' hours ago';
  return formatDate(dateStr);
}

// Reads query parameter from URL (e.g. "?year=2" -> "2")
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// Returns appropriate emoji for file extension
function fileIcon(name) {
  const ext = String(name).split('.').pop().toLowerCase();
  const icons = { pdf: '📕', ppt: '📊', pptx: '📊', doc: '📄', docx: '📄', xls: '📗', xlsx: '📗', jpg: '🖼️', png: '🖼️', zip: '🗜️' };
  return icons[ext] || '📄';
}

function studentYearText(user) {
  return user.isAlumni ? 'Year 4 / Alumni' : 'Year ' + user.currentYear;
}

// Central helper for all backend HTTP requests
async function api(url, method = 'GET', body) {
  const opts = { method, headers: {} };
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  try {
    const res = await fetch(url, opts);
    return await res.json();
  } catch (err) {
    return { success: false, message: 'Server is unreachable.' };
  }
}

// Displays quick feedback popup
function showToast(message, type) {
  if (!$('#toast-area').length) $('body').append('<div id="toast-area"></div>');
  const toast = $('<div class="toast"></div>').text(message).addClass(type === 'error' ? 'toast-error' : 'toast-success');
  $('#toast-area').append(toast);
  setTimeout(() => toast.fadeOut(300, () => toast.remove()), 3000);
}

function loadingHTML(text) {
  return `<div class="loader"><div class="spinner"></div><p>${escapeHTML(text || 'Loading...')}</p></div>`;
}

function emptyStateHTML(icon, msg) {
  return `<div class="empty-state"><div class="big-icon">${icon}</div><p>${escapeHTML(msg)}</p></div>`;
}

function openModal(id) { $('#' + id).addClass('open'); }
function closeModal(id) { $('#' + id).removeClass('open'); }
$(document).on('click', '[data-close]', function () { closeModal($(this).data('close')); });

// Standard confirm dialog for deletions
function confirmAction(message) {
  return window.confirm(message);
}

// Renders the responsive navbar and footer
function renderLayout(user) {
  const links = user
    ? `<a href="dashboard.html">Dashboard</a>` +
      (user.role === 'faculty' ? '<a href="manage-students.html">Manage Students</a>' : '') +
      `<a href="about.html">About</a>
       <a href="profile.html">👤 ${escapeHTML(user.name.split(' ')[0])}</a>
       <button class="btn btn-light btn-sm" id="logout-btn">Logout</button>`
    : `<a href="index.html">Home</a><a href="about.html">About</a><a href="login.html">Login</a><a href="register.html" class="btn btn-light btn-sm">Register</a>`;

  $('#navbar').html(`
    <div class="nav-inner">
      <a class="brand" href="${user ? 'dashboard.html' : 'index.html'}">🎓 CSE <span>ResourceHub</span></a>
      <button class="nav-toggle">☰</button>
      <nav class="nav-links">${links}</nav>
    </div>`);

  const cur = window.location.pathname.split('/').pop() || 'index.html';
  $(`.nav-links a[href="${cur}"]`).addClass('active');
  $('#footer').html('© ' + new Date().getFullYear() + ' CSE ResourceHub · Department of CSE, MSU Baroda');
}

$(document).on('click', '.nav-toggle', () => $('.nav-links').toggleClass('show'));
$(document).on('click', '#logout-btn', async () => {
  await api('/api/logout', 'POST');
  window.location.href = 'login.html';
});

// Route guards: protect private pages and check auth
async function requireLogin(facultyOnly) {
  const res = await api('/api/me');
  if (!res.success) { window.location.href = 'login.html'; return null; }
  if (facultyOnly && res.data.role !== 'faculty') { window.location.href = 'dashboard.html'; return null; }
  renderLayout(res.data);
  return res.data;
}

async function loadPublicLayout() {
  const res = await api('/api/me');
  const user = res.success ? res.data : null;
  renderLayout(user);
  return user;
}

$(() => {
  if ($('body').data('page') === 'public') loadPublicLayout();
});
