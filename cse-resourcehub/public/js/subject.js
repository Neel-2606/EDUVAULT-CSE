// subject.js
// The file explorer of one subject: 3 section tabs, folders, files, upload, rename and delete.

const ALLOWED_EXT = ['.pdf', '.ppt', '.pptx', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.jpg', '.jpeg', '.png', '.zip', '.rar'];
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_FILES = 10;

let currentUser = null;
let subjectData = null;     // { subject, roots: { material, pyq, other } }
let folderData = null;      // contents of the open folder, as sent by the server
let viewMode = 'list';      // 'list' or 'grid'
let selectedFiles = [];     // files chosen in the upload box
let renameTarget = null;    // { type, id } while renaming, null while creating a folder

$(async function () {
  currentUser = await requireLogin();
  if (!currentUser) return;

  const result = await api('/api/subjects/' + encodeURIComponent(getParam('id') || 'none'));
  if (!result.success) {
    $('#subject-page').html(emptyStateHTML('😕', result.message) +
      '<p style="text-align:center;margin-top:14px"><a class="btn" href="dashboard.html">Back to Dashboard</a></p>');
    return;
  }
  subjectData = result.data;
  renderSubjectHeader();
  setupEvents();

  // Open ?folder=..., or the tab from ?tab=pyq, or Study Material by default
  const startFolder = getParam('folder') || subjectData.roots[getParam('tab')] || subjectData.roots.material;
  loadFolder(startFolder);
});

/* ---------- Loading and drawing ---------- */

function renderSubjectHeader() {
  const s = subjectData.subject;
  document.title = s.name + ' | CSE ResourceHub';
  $('#subject-name').text(s.name);
  $('#subject-code').text(s.code || '').toggle(!!s.code);
  $('#subject-info').text(YEAR_LABELS[s.year - 1] + ' · Semester ' + s.semester + ' · Faculty: ' + s.facultyName);
}

// Asks the server for one folder's contents and redraws the page
async function loadFolder(folderId) {
  $('#entries').html(loadingHTML());
  const result = await api('/api/folders/' + encodeURIComponent(folderId) + '/contents');
  if (!result.success || result.data.subject.id !== subjectData.subject.id) {
    showToast(result.message || 'Folder not found.', 'error');
    if (folderId !== subjectData.roots.material) loadFolder(subjectData.roots.material);
    return;
  }
  folderData = result.data;
  $('#search-box').val('');

  // Keep the address bar updated so the page can be refreshed or shared
  history.replaceState(null, '', 'subject.html?id=' + subjectData.subject.id + '&folder=' + folderId);
  renderTabs();
  renderBreadcrumb();
  renderToolbar();
  renderEntries();
}

function renderTabs() {
  $('.section-tab').removeClass('active');
  $('.section-tab[data-section="' + folderData.folder.section + '"]').addClass('active');
}

// 2nd Year › Sem 3 › BWP › PYQs › 2024  (the last part is the open folder)
function renderBreadcrumb() {
  const crumbs = folderData.breadcrumb;
  const html = crumbs.map(function (crumb, index) {
    if (index === crumbs.length - 1) return '<span class="current">' + escapeHTML(crumb.label) + '</span>';
    if (crumb.folderId) return '<a href="#" data-folder="' + crumb.folderId + '">' + escapeHTML(crumb.label) + '</a>';
    return '<a href="' + crumb.link + '">' + escapeHTML(crumb.label) + '</a>';
  }).join('<span class="sep">›</span>');
  $('#breadcrumb').html(html);
}

// Shows "+ New Folder" / "Upload" only to people allowed to add things here
function renderToolbar() {
  const section = folderData.folder.section;
  $('#new-folder-btn, #upload-btn').toggleClass('hidden', !folderData.canWrite);

  let banner = '';
  if (section === 'pyq' && currentUser.role === 'student') {
    banner = folderData.canWrite
      ? '🎉 You have PYQ upload access. Thank you for helping your juniors!'
      : 'ℹ️ Only students permitted by faculty can upload PYQs.';
  }
  $('#info-banner').text(banner).toggleClass('hidden', banner === '');
}

// Sorts folders or files by name, date or size
function sortList(list, sortBy) {
  return list.sort(function (a, b) {
    if (sortBy === 'date') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'size') return (b.size || b.itemCount || 0) - (a.size || a.itemCount || 0);
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });
}

// Draws folders first, then files, after applying the search box and the sort option
function renderEntries() {
  const searchText = $('#search-box').val().trim().toLowerCase();
  const sortBy = $('#sort-select').val();
  const matches = function (item) { return item.name.toLowerCase().indexOf(searchText) !== -1; };

  const folders = sortList(folderData.folders.filter(matches), sortBy);
  const files = sortList(folderData.files.filter(matches), sortBy);

  $('#entries').removeClass('list-view grid-view').addClass(viewMode + '-view');
  $('.view-toggle button').removeClass('active');
  $('.view-toggle button[data-view="' + viewMode + '"]').addClass('active');

  if (folders.length + files.length === 0) {
    $('#entries').html(emptyStateHTML(searchText ? '🔍' : '📂', emptyMessage(searchText)));
    return;
  }
  $('#entries').html(folders.map(folderHTML).join('') + files.map(fileHTML).join(''));
}

function emptyMessage(searchText) {
  if (searchText) return 'Nothing here matches "' + searchText + '".';
  if (folderData.folder.section === 'pyq' && folderData.folder.isRoot) {
    return 'No PYQs uploaded yet. Seniors, ask your faculty for upload access!';
  }
  return 'This folder is empty.';
}

// Rename + Delete buttons (faculty only)
function manageButtons(type, item) {
  if (!folderData.canManage) return '';
  return '<button class="icon-btn rename-btn" data-type="' + type + '" data-id="' + item.id + '" title="Rename">✏️<span> Rename</span></button>' +
         '<button class="icon-btn danger delete-btn" data-type="' + type + '" data-id="' + item.id + '" title="Delete">🗑️<span> Delete</span></button>';
}

function folderHTML(folder) {
  return '<div class="entry entry-folder" data-id="' + folder.id + '">' +
           '<div class="entry-icon">📁</div>' +
           '<div class="entry-main">' +
             '<span class="entry-name">' + escapeHTML(folder.name) + '</span>' +
             '<div class="entry-meta">' + folder.itemCount + ' item(s) · ' + formatDate(folder.createdAt) + '</div>' +
           '</div>' +
           '<div class="entry-actions">' + manageButtons('folder', folder) + '</div>' +
         '</div>';
}

function fileHTML(file) {
  const canPreview = /\.(pdf|jpg|jpeg|png|txt)$/i.test(file.storedName);
  const roleBadge = file.uploaderRole === 'faculty'
    ? '<span class="badge badge-faculty">Faculty</span>'
    : '<span class="badge badge-student">Student</span>';

  return '<div class="entry entry-file">' +
           '<div class="entry-icon">' + fileIcon(file.name) + '</div>' +
           '<div class="entry-main">' +
             '<span class="entry-name" title="' + escapeHTML(file.name) + '">' + escapeHTML(file.name) + '</span>' +
             '<div class="entry-meta">' + formatSize(file.size) + ' · ' + escapeHTML(file.uploaderName) + ' ' + roleBadge +
               ' · ' + formatDate(file.createdAt) + '</div>' +
           '</div>' +
           '<div class="entry-actions">' +
             (canPreview ? '<a class="icon-btn" href="/api/files/' + file.id + '/view" target="_blank" title="View">👁️<span> View</span></a>' : '') +
             '<a class="icon-btn" href="/api/files/' + file.id + '/download" title="Download">⬇️<span> Download</span></a>' +
             manageButtons('file', file) +
           '</div>' +
         '</div>';
}

/* ---------- New folder / rename / delete ---------- */

function findItem(type, id) {
  const list = type === 'folder' ? folderData.folders : folderData.files;
  return list.find(function (item) { return item.id === id; });
}

// One small form is used for both "New Folder" and "Rename"
function openNameModal(title, value, target) {
  renameTarget = target;
  $('#name-modal-title').text(title);
  $('#name-input').val(value);
  $('#name-error').text('');
  openModal('name-modal');
  $('#name-input').focus().select();
}

async function saveName(event) {
  event.preventDefault();
  const name = $('#name-input').val().trim();
  if (!name) { $('#name-error').text('Please enter a name.'); return; }

  let result;
  if (renameTarget) {
    result = await api('/api/' + renameTarget.type + 's/' + renameTarget.id, 'PUT', { name: name });
  } else {
    result = await api('/api/folders', 'POST', { name: name, parentId: folderData.folder.id });
  }
  if (!result.success) { $('#name-error').text(result.message); return; }
  closeModal('name-modal');
  showToast(result.message);
  loadFolder(folderData.folder.id);
}

async function deleteItem(type, id) {
  const item = findItem(type, id);
  let message = 'Delete file "' + item.name + '"? This cannot be undone.';
  if (type === 'folder') {
    message = item.itemCount > 0
      ? 'Delete folder "' + item.name + '" and all ' + item.itemCount + ' item(s) inside? This cannot be undone.'
      : 'Delete the empty folder "' + item.name + '"?';
  }
  if (!(await confirmAction(message))) return;

  const result = await api('/api/' + type + 's/' + id, 'DELETE');
  showToast(result.message, result.success ? 'success' : 'error');
  loadFolder(folderData.folder.id);
}

/* ---------- Upload ---------- */

// Adds chosen/dropped files to the list, skipping wrong types, big files and extras
function addFiles(fileList) {
  const skipped = [];
  Array.from(fileList).forEach(function (file) {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (ALLOWED_EXT.indexOf(ext) === -1) skipped.push(file.name + ' (type not allowed)');
    else if (file.size > MAX_FILE_SIZE) skipped.push(file.name + ' (bigger than 25 MB)');
    else if (selectedFiles.length >= MAX_FILES) skipped.push(file.name + ' (max 10 files)');
    else selectedFiles.push(file);
  });
  if (skipped.length) showToast('Skipped: ' + skipped.join(', '), 'error');
  renderSelectedFiles();
}

function renderSelectedFiles() {
  const html = selectedFiles.map(function (file, index) {
    return '<li><span>' + fileIcon(file.name) + ' ' + escapeHTML(file.name) + '</span>' +
           '<span>' + formatSize(file.size) + ' <button class="remove-file" data-index="' + index + '" title="Remove">✖</button></span></li>';
  }).join('');
  $('#selected-files').html(html);
  $('#start-upload').prop('disabled', selectedFiles.length === 0)
    .text(selectedFiles.length ? 'Upload ' + selectedFiles.length + ' file(s)' : 'Upload');
}

function openUploadModal() {
  selectedFiles = [];
  renderSelectedFiles();
  $('#upload-target').text(folderData.breadcrumb.slice(2).map(function (c) { return c.label; }).join(' › '));
  $('#progress-area').addClass('hidden');
  $('#progress-bar').css('width', '0');
  openModal('upload-modal');
}

function setUploading(isUploading) {
  $('#start-upload, #cancel-upload, #file-input').prop('disabled', isUploading);
  $('#progress-area').toggleClass('hidden', !isUploading);
}

// Sends the files with XMLHttpRequest so we can show a progress bar (like in the AJAX lab)
function startUpload() {
  if (selectedFiles.length === 0) return;
  const formData = new FormData();
  formData.append('parentId', folderData.folder.id);
  selectedFiles.forEach(function (file) { formData.append('files', file); });

  const xhr = new XMLHttpRequest();
  xhr.upload.onprogress = function (event) {
    if (!event.lengthComputable) return;
    const percent = Math.round((event.loaded / event.total) * 100);
    $('#progress-bar').css('width', percent + '%');
    $('#progress-text').text(percent + '%');
  };
  xhr.onload = function () {
    let result;
    try { result = JSON.parse(xhr.responseText); } catch (e) { result = { success: false, message: 'Upload failed.' }; }
    setUploading(false);
    showToast(result.message, result.success ? 'success' : 'error');
    if (result.success) {
      closeModal('upload-modal');
      loadFolder(folderData.folder.id);
    }
  };
  xhr.onerror = function () {
    setUploading(false);
    showToast('Network error. Upload failed.', 'error');
  };

  setUploading(true);
  xhr.open('POST', '/api/upload');
  xhr.send(formData);
}

/* ---------- Events ---------- */

function setupEvents() {
  // Tabs and breadcrumb
  $('.section-tab').on('click', function () { loadFolder(subjectData.roots[$(this).data('section')]); });
  $('#breadcrumb').on('click', 'a[data-folder]', function (event) {
    event.preventDefault();
    loadFolder($(this).data('folder'));
  });

  // Open a folder by clicking its row (but not when clicking its buttons)
  $('#entries').on('click', '.entry-folder', function (event) {
    if ($(event.target).closest('.entry-actions').length) return;
    loadFolder($(this).data('id'));
  });
  $('#entries').on('click', '.rename-btn', function () {
    const type = $(this).data('type');
    const item = findItem(type, $(this).data('id'));
    openNameModal('Rename ' + type, item.name, { type: type, id: item.id });
  });
  $('#entries').on('click', '.delete-btn', function () { deleteItem($(this).data('type'), $(this).data('id')); });

  // Toolbar
  $('#search-box').on('input', renderEntries);
  $('#sort-select').on('change', renderEntries);
  $('.view-toggle button').on('click', function () {
    viewMode = $(this).data('view');
    renderEntries();
  });
  $('#new-folder-btn').on('click', function () { openNameModal('New Folder', '', null); });
  $('#name-form').on('submit', saveName);

  // Upload box: click to choose, or drag and drop
  $('#upload-btn').on('click', openUploadModal);
  $('#drop-zone').on('click', function () { $('#file-input').click(); });
  $('#file-input').on('change', function () {
    addFiles(this.files);
    this.value = '';
  });
  $('#drop-zone').on('dragover', function (event) {
    event.preventDefault();
    $(this).addClass('dragging');
  });
  $('#drop-zone').on('dragleave drop', function () { $(this).removeClass('dragging'); });
  $('#drop-zone').on('drop', function (event) {
    event.preventDefault();
    addFiles(event.originalEvent.dataTransfer.files);
  });
  $('#selected-files').on('click', '.remove-file', function () {
    selectedFiles.splice($(this).data('index'), 1);
    renderSelectedFiles();
  });
  $('#start-upload').on('click', startUpload);
}
