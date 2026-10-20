// subject.js - Folder explorer, file viewer, upload and management
let currentUser = null;
let subjectData = null;
let folderData = null;
let selectedFiles = [];
let renameTarget = null; // null for new folder; { type, id } for rename

$(async () => {
  currentUser = await requireLogin();
  if (!currentUser) return;

  const res = await api('/api/subjects/' + encodeURIComponent(getParam('id') || ''));
  if (!res.success) {
    $('#subject-page').html(emptyStateHTML('⚠️', res.message));
    return;
  }
  subjectData = res.data;

  // Set subject header info
  const s = subjectData.subject;
  document.title = s.name + ' | CSE ResourceHub';
  $('#subject-name').text(s.name);
  $('#subject-code').text(s.code || '').toggle(!!s.code);
  $('#subject-info').text(`${YEAR_LABELS[s.year - 1]} · Semester ${s.semester} · Faculty: ${s.facultyName}`);

  setupEvents();
  const startId = getParam('folder') || subjectData.roots[getParam('tab')] || subjectData.roots.material;
  loadFolder(startId);
});

// Load folder contents from backend
async function loadFolder(folderId) {
  $('#entries').html(loadingHTML());
  const res = await api('/api/folders/' + encodeURIComponent(folderId) + '/contents');
  if (!res.success) {
    showToast(res.message || 'Folder not found.', 'error');
    return;
  }
  folderData = res.data;
  $('#search-box').val('');

  // Update tabs & breadcrumb navigation
  $('.section-tab').removeClass('active');
  $(`.section-tab[data-section="${folderData.folder.section}"]`).addClass('active');

  const crumbs = folderData.breadcrumb.map((c, i) => {
    if (i === folderData.breadcrumb.length - 1) return `<span class="current">${escapeHTML(c.label)}</span>`;
    return `<a href="${c.link || '#'}" ${c.folderId ? `data-folder="${c.folderId}"` : ''}>${escapeHTML(c.label)}</a>`;
  }).join('<span class="sep">›</span>');
  $('#breadcrumb').html(crumbs);

  // Toggle buttons based on permissions
  $('#new-folder-btn, #upload-btn').toggleClass('hidden', !folderData.canWrite);
  renderEntries();
}

// Render files and folders with search filter and sorting
function renderEntries() {
  const query = $('#search-box').val().trim().toLowerCase();
  const sortBy = $('#sort-select').val();

  const sortFn = (a, b) => {
    if (sortBy === 'date') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'size') return (b.size || 0) - (a.size || 0);
    return a.name.localeCompare(b.name);
  };

  const match = item => item.name.toLowerCase().includes(query);
  const folders = folderData.folders.filter(match).sort(sortFn);
  const files = folderData.files.filter(match).sort(sortFn);

  if (!folders.length && !files.length) {
    $('#entries').html(emptyStateHTML('📂', query ? 'No matching items.' : 'This folder is empty.'));
    return;
  }

  const actions = (type, id) => folderData.canManage ? `
    <button class="icon-btn rename-btn" data-type="${type}" data-id="${id}">✏️ Rename</button>
    <button class="icon-btn danger delete-btn" data-type="${type}" data-id="${id}">🗑️ Delete</button>
  ` : '';

  const foldersHTML = folders.map(f => `
    <div class="entry entry-folder" data-id="${f.id}">
      <div class="entry-icon">📁</div>
      <div class="entry-main">
        <span class="entry-name">${escapeHTML(f.name)}</span>
        <div class="entry-meta">${f.itemCount} item(s) · ${formatDate(f.createdAt)}</div>
      </div>
      <div class="entry-actions">${actions('folder', f.id)}</div>
    </div>`).join('');

  const filesHTML = files.map(f => `
    <div class="entry entry-file">
      <div class="entry-icon">${fileIcon(f.name)}</div>
      <div class="entry-main">
        <span class="entry-name">${escapeHTML(f.name)}</span>
        <div class="entry-meta">${formatSize(f.size)} · ${escapeHTML(f.uploaderName)} · ${formatDate(f.createdAt)}</div>
      </div>
      <div class="entry-actions">
        <a class="icon-btn" href="/api/files/${f.id}/view" target="_blank">👁️ View</a>
        <a class="icon-btn" href="/api/files/${f.id}/download">⬇️ Download</a>
        ${actions('file', f.id)}
      </div>
    </div>`).join('');

  $('#entries').html(foldersHTML + filesHTML);
}

// ---------------- NEW FOLDER & RENAME ----------------
function openNameModal(title, val, target) {
  renameTarget = target;
  $('#name-modal-title').text(title);
  $('#name-input').val(val);
  $('#name-error').text('');
  openModal('name-modal');
  $('#name-input').focus();
}

async function saveName(e) {
  e.preventDefault();
  const name = $('#name-input').val().trim();
  if (!name) return $('#name-error').text('Name is required.');

  const url = renameTarget
    ? (renameTarget.type === 'folder' ? '/api/folders/' + renameTarget.id : '/api/files/' + renameTarget.id)
    : '/api/folders';
  const method = renameTarget ? 'PUT' : 'POST';
  const payload = renameTarget ? { name } : { name, parentId: folderData.folder.id };

  const res = await api(url, method, payload);
  if (!res.success) return $('#name-error').text(res.message);

  closeModal('name-modal');
  showToast(res.message);
  loadFolder(folderData.folder.id);
}

async function deleteItem(type, id) {
  if (!confirmAction(`Delete this ${type}?`)) return;
  const url = (type === 'folder' ? '/api/folders/' : '/api/files/') + id;
  const res = await api(url, 'DELETE');
  showToast(res.message, res.success ? 'success' : 'error');
  loadFolder(folderData.folder.id);
}

// ---------------- FILE UPLOAD & PROGRESS ----------------
function addFiles(files) {
  for (const f of files) {
    if (f.size > 25 * 1024 * 1024) { showToast(f.name + ' exceeds 25 MB limit.', 'error'); continue; }
    if (selectedFiles.length >= 10) { showToast('Max 10 files per upload.', 'error'); break; }
    selectedFiles.push(f);
  }
  $('#selected-files').html(selectedFiles.map((f, i) => `
    <li>
      <span>${fileIcon(f.name)} ${escapeHTML(f.name)}</span>
      <span>${formatSize(f.size)} <button class="remove-file" data-index="${i}">✖</button></span>
    </li>`).join(''));
  $('#start-upload').prop('disabled', !selectedFiles.length);
}

function startUpload() {
  if (!selectedFiles.length) return;
  const fd = new FormData();
  fd.append('parentId', folderData.folder.id);
  selectedFiles.forEach(f => fd.append('files', f));

  const xhr = new XMLHttpRequest();
  xhr.upload.onprogress = e => {
    const pct = Math.round((e.loaded / e.total) * 100);
    $('#progress-bar').css('width', pct + '%');
    $('#progress-text').text(pct + '%');
  };
  xhr.onload = () => {
    const res = JSON.parse(xhr.responseText || '{}');
    showToast(res.message, res.success ? 'success' : 'error');
    if (res.success) { closeModal('upload-modal'); loadFolder(folderData.folder.id); }
  };
  $('#progress-area').removeClass('hidden');
  xhr.open('POST', '/api/upload');
  xhr.send(fd);
}

// ---------------- EVENT HANDLERS ----------------
function setupEvents() {
  $('.section-tab').on('click', function () { loadFolder(subjectData.roots[$(this).data('section')]); });
  $('#breadcrumb').on('click', 'a[data-folder]', function (e) { e.preventDefault(); loadFolder($(this).data('folder')); });

  $('#entries').on('click', '.entry-folder', function (e) {
    if ($(e.target).closest('.entry-actions').length) return;
    loadFolder($(this).data('id'));
  });

  $('#entries').on('click', '.rename-btn', function () {
    const type = $(this).data('type');
    const items = type === 'folder' ? folderData.folders : folderData.files;
    const item = items.find(i => i.id === $(this).data('id'));
    openNameModal('Rename ' + type, item.name, { type, id: item.id });
  });

  $('#entries').on('click', '.delete-btn', function () {
    deleteItem($(this).data('type'), $(this).data('id'));
  });

  $('#search-box').on('input', renderEntries);
  $('#sort-select').on('change', renderEntries);
  $('.view-toggle button').on('click', function () {
    const mode = $(this).data('view');
    $('#entries').removeClass('list-view grid-view').addClass(mode + '-view');
    $('.view-toggle button').removeClass('active');
    $(this).addClass('active');
  });

  $('#new-folder-btn').on('click', () => openNameModal('New Folder', '', null));
  $('#name-form').on('submit', saveName);

  $('#upload-btn').on('click', () => {
    selectedFiles = [];
    $('#selected-files').html('');
    $('#upload-target').text(folderData.folder.name);
    $('#progress-area').addClass('hidden');
    $('#start-upload').prop('disabled', true);
    openModal('upload-modal');
  });

  $('#drop-zone').on('click', () => $('#file-input').click());
  $('#file-input').on('change', function () { addFiles(this.files); this.value = ''; });
  $('#drop-zone').on('dragover drop', e => {
    e.preventDefault();
    if (e.type === 'drop') addFiles(e.originalEvent.dataTransfer.files);
  });

  $('#selected-files').on('click', '.remove-file', function () {
    selectedFiles.splice($(this).data('index'), 1);
    addFiles([]);
  });

  $('#start-upload').on('click', startUpload);
}
