// students.js - Faculty student list & PYQ upload permission toggle
let searchTimer = null;

$(async () => {
  const user = await requireLogin(true); // true = faculty only
  if (!user) return;

  loadStudents();
  $('#year-filter').on('change', loadStudents);

  // Debounced search (300ms delay)
  $('#student-search').on('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadStudents, 300);
  });

  // Live toggle PYQ upload permission
  $('#students-body').on('change', '.pyq-toggle', async function () {
    const allow = this.checked;
    const res = await api('/api/students/' + $(this).data('id') + '/pyq-permission', 'PUT', { allow });
    showToast(res.message, res.success ? 'success' : 'error');
    if (!res.success) this.checked = !allow; // Roll back on failure
  });
});

async function loadStudents() {
  const q = $('#student-search').val().trim();
  const yr = $('#year-filter').val();
  const res = await api(`/api/students?search=${encodeURIComponent(q)}&year=${yr}`);
  if (!res.success) return showToast(res.message, 'error');

  const list = res.data;
  $('#student-count').text(list.length + ' student(s)');
  if (!list.length) {
    return $('#students-body').html('<tr><td colspan="6" class="muted" style="text-align:center">No students found.</td></tr>');
  }

  const rows = list.map(s => `
    <tr>
      <td>${escapeHTML(s.name)}</td>
      <td>${escapeHTML(s.prn)}</td>
      <td>${escapeHTML(s.email)}</td>
      <td>${s.admissionYear}</td>
      <td>Year ${s.currentYear}</td>
      <td>
        <label class="switch">
          <input type="checkbox" class="pyq-toggle" data-id="${s.id}" ${s.canUploadPYQ ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
      </td>
    </tr>`).join('');
  $('#students-body').html(rows);
}
