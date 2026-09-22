// year.js
// Shows the 2 semesters of one year with their subject cards.
// Faculty can add, edit and delete subjects here.

let currentUser = null;
let yearNumber = 1;
let subjects = [];
let editingSubjectId = null;   // null = adding a new subject

$(async function () {
  currentUser = await requireLogin();
  if (!currentUser) return;

  yearNumber = parseInt(getParam('year'), 10);
  if (!(yearNumber >= 1 && yearNumber <= 4)) {
    window.location.href = 'dashboard.html';
    return;
  }

  // Page title and the two semester columns
  const semesters = [yearNumber * 2 - 1, yearNumber * 2];
  $('#year-title').text(YEAR_LABELS[yearNumber - 1]);
  document.title = YEAR_LABELS[yearNumber - 1] + ' | CSE ResourceHub';
  semesters.forEach(function (sem, index) {
    $('.sem-column').eq(index).attr('id', 'sem-' + sem).attr('data-sem', sem);
    $('.sem-column').eq(index).find('.sem-name').text('Semester ' + sem);
    $('#subject-semester').append('<option value="' + sem + '">Semester ' + sem + '</option>');
  });

  if (currentUser.role === 'faculty') $('.add-subject-btn').removeClass('hidden');
  setupEvents();
  loadSubjects();
});

// Gets all subjects of this year from the server and draws them
async function loadSubjects() {
  $('.sem-subjects').html(loadingHTML());
  const result = await api('/api/subjects?year=' + yearNumber);
  if (!result.success) { $('.sem-subjects').html(emptyStateHTML('⚠️', result.message)); return; }
  subjects = result.data;

  $('.sem-column').each(function () {
    const sem = $(this).data('sem');
    const list = subjects.filter(function (s) { return s.semester === sem; });
    const html = list.length
      ? list.map(subjectCardHTML).join('')
      : emptyStateHTML('📚', currentUser.role === 'faculty' ? 'No subjects yet. Click "+ Add Subject".' : 'No subjects added yet.');
    $(this).find('.sem-subjects').html(html);
  });

  // If the address has #sem-4, scroll to that semester
  if (window.location.hash) {
    const target = $(window.location.hash);
    if (target.length) $('html, body').animate({ scrollTop: target.offset().top - 80 }, 300);
  }
}

// HTML of one subject card
function subjectCardHTML(subject) {
  const link = 'subject.html?id=' + subject.id;
  let html = '<div class="subject-card">' +
    '<h3><a href="' + link + '">' + escapeHTML(subject.name) + '</a> ' +
      (subject.code ? '<span class="badge badge-code">' + escapeHTML(subject.code) + '</span>' : '') + '</h3>' +
    '<div class="meta">👩‍🏫 ' + escapeHTML(subject.facultyName) + ' · ' + subject.fileCount + ' file(s)</div>' +
    '<div class="subject-links">' +
      '<a class="sec-material" href="' + link + '&tab=material">📘 Study Material</a>' +
      '<a class="sec-pyq" href="' + link + '&tab=pyq">📝 PYQs</a>' +
      '<a class="sec-other" href="' + link + '&tab=other">📢 Other</a>' +
    '</div>';

  if (currentUser.role === 'faculty') {
    html += '<div class="subject-actions">' +
      '<button class="icon-btn edit-subject" data-id="' + subject.id + '">✏️ Edit</button>' +
      '<button class="icon-btn danger delete-subject" data-id="' + subject.id + '">🗑️ Delete</button>' +
    '</div>';
  }
  return html + '</div>';
}

// Opens the subject form, empty for "add" or filled for "edit"
function openSubjectModal(subject, semester) {
  editingSubjectId = subject ? subject.id : null;
  $('#subject-modal-title').text(subject ? 'Edit Subject' : 'Add Subject');
  $('#subject-name').val(subject ? subject.name : '');
  $('#subject-code').val(subject ? subject.code : '');
  $('#subject-faculty').val(subject ? subject.facultyName : currentUser.name);
  $('#subject-semester').val(subject ? subject.semester : semester);
  $('#subject-error').text('');
  openModal('subject-modal');
  $('#subject-name').focus();
}

// Saves the subject form (POST for new, PUT for edit)
async function saveSubject(event) {
  event.preventDefault();
  const data = {
    name: $('#subject-name').val().trim(),
    code: $('#subject-code').val().trim(),
    facultyName: $('#subject-faculty').val().trim(),
    semester: $('#subject-semester').val()
  };
  if (!data.name) { $('#subject-error').text('Subject name is required.'); return; }

  const result = editingSubjectId
    ? await api('/api/subjects/' + editingSubjectId, 'PUT', data)
    : await api('/api/subjects', 'POST', data);

  if (!result.success) { $('#subject-error').text(result.message); return; }
  closeModal('subject-modal');
  showToast(result.message);
  loadSubjects();
}

// Asks for confirmation and deletes a subject with everything inside it
async function deleteSubject(subject) {
  const ok = await confirmAction('Delete subject "' + subject.name + '" with all its folders and ' +
                                 subject.fileCount + ' file(s)? This cannot be undone.');
  if (!ok) return;
  const result = await api('/api/subjects/' + subject.id, 'DELETE');
  showToast(result.message, result.success ? 'success' : 'error');
  if (result.success) loadSubjects();
}

function findSubject(id) {
  return subjects.find(function (s) { return s.id === id; });
}

function setupEvents() {
  $('.add-subject-btn').on('click', function () {
    openSubjectModal(null, $(this).closest('.sem-column').data('sem'));
  });
  $(document).on('click', '.edit-subject', function () { openSubjectModal(findSubject($(this).data('id'))); });
  $(document).on('click', '.delete-subject', function () { deleteSubject(findSubject($(this).data('id'))); });
  $('#subject-form').on('submit', saveSubject);
}
