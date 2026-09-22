// students.js
// Faculty-only page: list of students with a switch to allow / block PYQ uploads.

let searchTimer = null;

$(async function () {
  const user = await requireLogin(true);   // true = faculty only (students are sent away)
  if (!user) return;

  loadStudents();
  $('#year-filter').on('change', loadStudents);

  // Wait until the user stops typing for 300 ms before searching
  $('#student-search').on('input', function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadStudents, 300);
  });

  $('#students-body').on('change', '.pyq-toggle', function () { changePermission(this); });
});

async function loadStudents() {
  const url = '/api/students?search=' + encodeURIComponent($('#student-search').val().trim()) +
              '&year=' + $('#year-filter').val();
  const result = await api(url);
  if (!result.success) { showToast(result.message, 'error'); return; }

  $('#student-count').text(result.data.length + ' student(s)');
  if (result.data.length === 0) {
    $('#students-body').html('<tr><td colspan="6" class="muted" style="text-align:center">No students found.</td></tr>');
    return;
  }

  const rows = result.data.map(function (s) {
    return '<tr>' +
      '<td>' + escapeHTML(s.name) + '</td>' +
      '<td>' + escapeHTML(s.prn) + '</td>' +
      '<td>' + escapeHTML(s.email) + '</td>' +
      '<td>' + s.admissionYear + '</td>' +
      '<td>' + studentYearText(s) + '</td>' +
      '<td><label class="switch" title="Allow PYQ uploads">' +
        '<input type="checkbox" class="pyq-toggle" data-id="' + s.id + '"' + (s.canUploadPYQ ? ' checked' : '') + '>' +
        '<span class="slider"></span></label></td>' +
    '</tr>';
  }).join('');
  $('#students-body').html(rows);
}

// Saves the switch. If the server refuses, the switch goes back to how it was.
async function changePermission(checkbox) {
  const allow = checkbox.checked;
  const result = await api('/api/students/' + $(checkbox).data('id') + '/pyq-permission', 'PUT', { allow: allow });
  showToast(result.message, result.success ? 'success' : 'error');
  if (!result.success) checkbox.checked = !allow;
}
