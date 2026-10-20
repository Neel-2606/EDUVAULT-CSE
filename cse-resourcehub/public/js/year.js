// year.js - Displays semesters and subjects for a chosen year
let currentUser = null;
let yearNumber = 1;
let subjects = [];
let editingSubjectId = null;

$(async () => {
  currentUser = await requireLogin();
  if (!currentUser) return;

  yearNumber = parseInt(getParam('year'), 10) || 1;
  const sems = [yearNumber * 2 - 1, yearNumber * 2];
  $('#year-title').text(YEAR_LABELS[yearNumber - 1]);
  document.title = YEAR_LABELS[yearNumber - 1] + ' | CSE ResourceHub';

  sems.forEach((sem, idx) => {
    const col = $('.sem-column').eq(idx);
    col.attr('data-sem', sem);
    col.find('.sem-name').text('Semester ' + sem);
    $('#subject-semester').append(`<option value="${sem}">Semester ${sem}</option>`);
  });

  if (currentUser.role === 'faculty') $('.add-subject-btn').removeClass('hidden');

  loadSubjects();
  setupEvents();
});

// Load and display subjects for the two semesters
async function loadSubjects() {
  const res = await api('/api/subjects?year=' + yearNumber);
  if (!res.success) return $('.sem-subjects').html(emptyStateHTML('⚠️', res.message));
  subjects = res.data;

  $('.sem-column').each(function () {
    const sem = $(this).data('sem');
    const list = subjects.filter(s => s.semester === sem);
    const html = list.length
      ? list.map(subjectCardHTML).join('')
      : emptyStateHTML('📚', 'No subjects added yet.');
    $(this).find('.sem-subjects').html(html);
  });
}

function subjectCardHTML(s) {
  const link = 'subject.html?id=' + s.id;
  const actions = currentUser.role === 'faculty' ? `
    <div class="subject-actions">
      <button class="icon-btn edit-subject" data-id="${s.id}">✏️ Edit</button>
      <button class="icon-btn danger delete-subject" data-id="${s.id}">🗑️ Delete</button>
    </div>` : '';

  return `
    <div class="subject-card">
      <h3><a href="${link}">${escapeHTML(s.name)}</a> ${s.code ? `<span class="badge badge-code">${escapeHTML(s.code)}</span>` : ''}</h3>
      <div class="meta">👩‍🏫 ${escapeHTML(s.facultyName)} · ${s.fileCount} file(s)</div>
      <div class="subject-links">
        <a class="sec-material" href="${link}&tab=material">📘 Material</a>
        <a class="sec-pyq" href="${link}&tab=pyq">📝 PYQs</a>
        <a class="sec-other" href="${link}&tab=other">📢 Other</a>
      </div>
      ${actions}
    </div>`;
}

function openSubjectModal(subject, defaultSem) {
  editingSubjectId = subject ? subject.id : null;
  $('#subject-modal-title').text(subject ? 'Edit Subject' : 'Add Subject');
  $('#subject-name').val(subject ? subject.name : '');
  $('#subject-code').val(subject ? subject.code : '');
  $('#subject-faculty').val(subject ? subject.facultyName : currentUser.name);
  $('#subject-semester').val(subject ? subject.semester : defaultSem);
  $('#subject-error').text('');
  openModal('subject-modal');
}

async function saveSubject(e) {
  e.preventDefault();
  const name = $('#subject-name').val().trim();
  if (!name) return $('#subject-error').text('Subject name is required.');

  const payload = {
    name,
    code: $('#subject-code').val().trim(),
    facultyName: $('#subject-faculty').val().trim(),
    semester: $('#subject-semester').val()
  };

  const url = editingSubjectId ? '/api/subjects/' + editingSubjectId : '/api/subjects';
  const res = await api(url, editingSubjectId ? 'PUT' : 'POST', payload);
  if (!res.success) return $('#subject-error').text(res.message);

  closeModal('subject-modal');
  showToast(res.message);
  loadSubjects();
}

async function deleteSubject(s) {
  if (!confirmAction(`Delete "${s.name}" and all its files?`)) return;
  const res = await api('/api/subjects/' + s.id, 'DELETE');
  showToast(res.message, res.success ? 'success' : 'error');
  if (res.success) loadSubjects();
}

function setupEvents() {
  $('.add-subject-btn').on('click', function () {
    openSubjectModal(null, $(this).closest('.sem-column').data('sem'));
  });
  $(document).on('click', '.edit-subject', function () {
    openSubjectModal(subjects.find(s => s.id === $(this).data('id')));
  });
  $(document).on('click', '.delete-subject', function () {
    deleteSubject(subjects.find(s => s.id === $(this).data('id')));
  });
  $('#subject-form').on('submit', saveSubject);
}
