// dashboard.js - User greeting, 4 Year cards, recent uploads and search
let currentUser = null;

$(async () => {
  currentUser = await requireLogin();
  if (!currentUser) return;

  // Render greeting
  const info = currentUser.role === 'student'
    ? 'Student · ' + studentYearText(currentUser) + ' · Batch ' + currentUser.admissionYear
    : 'Faculty';
  $('#greeting').text('Welcome, ' + currentUser.name + '!');
  $('#greeting-details').text(info);
  if (currentUser.role === 'faculty') $('#faculty-actions').removeClass('hidden');

  loadYears();
  loadRecent();

  // Search handlers
  $('#search-form').on('submit', e => { e.preventDefault(); runSearch(); });
  $('#search-clear').on('click', () => {
    $('#search-input').val('');
    $('#search-results-area').slideUp(200);
  });
});

// Loads the 4 Year cards and highlights student's current year
async function loadYears() {
  const res = await api('/api/years');
  if (!res.success) return $('#year-cards').html(emptyStateHTML('⚠️', res.message));

  const cards = res.data.map(y => {
    const isMine = currentUser.role === 'student' && currentUser.currentYear === y.year;
    const sems = y.semesters.map(s => `<li>Semester ${s.number} · ${s.subjectCount} subject(s)</li>`).join('');
    return `
      <a class="year-card ${isMine ? 'mine' : ''}" href="year.html?year=${y.year}">
        ${isMine ? '<span class="badge badge-mine your-year">Your Year</span>' : ''}
        <div class="year-number">${y.year}</div>
        <h3>${y.label}</h3>
        <ul>${sems}</ul>
      </a>`;
  }).join('');
  $('#year-cards').html(cards);
}

// Loads the 10 newest uploaded files
async function loadRecent() {
  const res = await api('/api/recent?limit=10');
  if (!res.success || !res.data.length) {
    return $('#recent-list').html(emptyStateHTML('📭', 'Nothing uploaded yet.'));
  }

  const list = res.data.map(f => `
    <a class="list-item" href="${f.link}">
      <span class="item-icon">${fileIcon(f.name)}</span>
      <span class="item-main">
        <span class="item-title">${escapeHTML(f.name)}</span>
        <span class="item-sub">${escapeHTML(f.subjectName)} · by ${escapeHTML(f.uploaderName)} · ${timeAgo(f.createdAt)}</span>
      </span>
    </a>`).join('');
  $('#recent-list').html(`<div class="list">${list}</div>`);
}

// Global search across all files and folders
async function runSearch() {
  const query = $('#search-input').val().trim();
  const year = $('#search-year').val();
  if (query.length < 2) return showToast('Type at least 2 letters.', 'error');

  $('#search-results-area').slideDown(200);
  $('#search-results').html(loadingHTML('Searching...'));

  const res = await api(`/api/search?q=${encodeURIComponent(query)}&year=${year}`);
  if (!res.success || !res.data.length) {
    return $('#search-results').html(emptyStateHTML('🔍', 'No matches found.'));
  }

  const list = res.data.map(item => `
    <a class="list-item" href="${item.link}">
      <span class="item-icon">${item.type === 'folder' ? '📁' : fileIcon(item.name)}</span>
      <span class="item-main">
        <span class="item-title">${escapeHTML(item.name)}</span>
        <span class="item-sub">${escapeHTML(item.path)} ${item.type === 'file' ? '· ' + formatSize(item.size) : ''}</span>
      </span>
    </a>`).join('');
  $('#search-results').html(`<div class="list">${list}</div>`);
}
