// dashboard.js
// Greeting, the 4 year cards, recent uploads and the global search.

let currentUser = null;

$(async function () {
  currentUser = await requireLogin();
  if (!currentUser) return;

  renderGreeting();
  loadYears();
  loadRecent();

  $('#search-form').on('submit', function (event) {
    event.preventDefault();
    runSearch();
  });
  $('#search-clear').on('click', function () {
    $('#search-input').val('');
    $('#search-results-area').slideUp(200);
  });
});

// "Welcome, Aarav (Student · Year 2 · Batch 2025)" or "Welcome, Dr. A. Shah (Faculty)"
function renderGreeting() {
  let details = 'Faculty';
  let name = currentUser.name;
  if (currentUser.role === 'student') {
    name = currentUser.name.split(' ')[0];
    details = 'Student · ' + studentYearText(currentUser) + ' · Batch ' + currentUser.admissionYear;
  }
  $('#greeting').text('Welcome, ' + name + '!');
  $('#greeting-details').text(details);

  if (currentUser.role === 'faculty') $('#faculty-actions').removeClass('hidden');
}

// Draws the 4 year cards. The student's own year gets a "Your Year" badge.
async function loadYears() {
  $('#year-cards').html(loadingHTML());
  const result = await api('/api/years');
  if (!result.success) { $('#year-cards').html(emptyStateHTML('⚠️', result.message)); return; }

  const html = result.data.map(function (year) {
    const isMine = currentUser.role === 'student' && currentUser.currentYear === year.year;
    const semesters = year.semesters.map(function (sem) {
      return '<li>Semester ' + sem.number + ' · ' + sem.subjectCount + ' subject(s)</li>';
    }).join('');
    return '<a class="year-card' + (isMine ? ' mine' : '') + '" href="year.html?year=' + year.year + '">' +
             (isMine ? '<span class="badge badge-mine your-year">Your Year</span>' : '') +
             '<div class="year-number">' + year.year + '</div>' +
             '<h3>' + year.label + '</h3>' +
             '<ul>' + semesters + '</ul>' +
           '</a>';
  }).join('');
  $('#year-cards').html(html);
}

// Latest 10 uploaded files
async function loadRecent() {
  $('#recent-list').html(loadingHTML());
  const result = await api('/api/recent?limit=10');
  if (!result.success) { $('#recent-list').html(emptyStateHTML('⚠️', result.message)); return; }
  if (result.data.length === 0) { $('#recent-list').html(emptyStateHTML('📭', 'Nothing has been uploaded yet.')); return; }

  const html = result.data.map(function (file) {
    return '<a class="list-item" href="' + file.link + '">' +
             '<span class="item-icon">' + fileIcon(file.name) + '</span>' +
             '<span class="item-main">' +
               '<span class="item-title">' + escapeHTML(file.name) + '</span>' +
               '<span class="item-sub">' + escapeHTML(YEAR_LABELS[file.year - 1] + ' · ' + file.subjectName + ' · ' + file.sectionName) +
               ' · by ' + escapeHTML(file.uploaderName) + ' · ' + timeAgo(file.createdAt) + '</span>' +
             '</span>' +
           '</a>';
  }).join('');
  $('#recent-list').html('<div class="list">' + html + '</div>');
}

// Searches all file and folder names
async function runSearch() {
  const text = $('#search-input').val().trim();
  if (text.length < 2) { showToast('Type at least 2 letters to search.', 'error'); return; }

  $('#search-results-area').slideDown(200);
  $('#search-results').html(loadingHTML('Searching...'));
  const url = '/api/search?q=' + encodeURIComponent(text) + '&year=' + $('#search-year').val();
  const result = await api(url);
  if (!result.success) { $('#search-results').html(emptyStateHTML('⚠️', result.message)); return; }
  if (result.data.length === 0) { $('#search-results').html(emptyStateHTML('🔍', 'No files or folders match "' + text + '".')); return; }

  const html = result.data.map(function (item) {
    const icon = item.type === 'folder' ? '📁' : fileIcon(item.name);
    return '<a class="list-item" href="' + item.link + '">' +
             '<span class="item-icon">' + icon + '</span>' +
             '<span class="item-main">' +
               '<span class="item-title">' + escapeHTML(item.name) + '</span>' +
               '<span class="item-sub">' + escapeHTML(item.path) + (item.type === 'file' ? ' · ' + formatSize(item.size) : '') + '</span>' +
             '</span>' +
           '</a>';
  }).join('');
  $('#search-results').html('<div class="list">' + html + '</div>');
}
