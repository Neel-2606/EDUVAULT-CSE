// auth.js
// Logic for the login page, the register page and the profile page.
// Each page is detected by the form it contains.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ---------- Inline form errors ---------- */

// Shows a red message under one input
function showFieldError(selector, message) {
  $(selector).addClass('input-error').closest('.form-group').find('.field-error').text(message);
}

// Removes all red messages inside a form
function clearErrors(form) {
  $(form).find('.input-error').removeClass('input-error');
  $(form).find('.field-error').text('');
  $(form).find('.form-message').removeClass('error').text('');
}

// Shows a message box at the top of a form (for errors coming from the server)
function showFormMessage(form, message) {
  $(form).find('.form-message').addClass('error').text(message);
}

// Disables the submit button while waiting for the server
function setBusy(form, busy, text) {
  const button = $(form).find('button[type="submit"]');
  if (busy) button.data('text', button.text());
  button.prop('disabled', busy).text(busy ? text : button.data('text'));
}

// Same calculation as the server: the academic year starts in July
function academicStartYear() {
  const today = new Date();
  return today.getMonth() >= 6 ? today.getFullYear() : today.getFullYear() - 1;
}

/* ---------- Login page ---------- */

async function setupLoginPage() {
  const user = await loadPublicLayout();
  if (user) { window.location.href = 'dashboard.html'; return; }

  $('#login-form').on('submit', async function (event) {
    event.preventDefault();
    const form = this;
    clearErrors(form);
    const identifier = $('#login-id').val().trim();
    const password = $('#login-password').val();

    let valid = true;
    if (!identifier) { showFieldError('#login-id', 'Please enter your email or PRN.'); valid = false; }
    if (!password) { showFieldError('#login-password', 'Please enter your password.'); valid = false; }
    if (!valid) return;

    setBusy(form, true, 'Logging in...');
    const result = await api('/api/login', 'POST', { identifier: identifier, password: password });
    if (result.success) {
      window.location.href = 'dashboard.html';
    } else {
      setBusy(form, false);
      showFormMessage(form, result.message);
    }
  });
}

/* ---------- Register page ---------- */

// Fills the admission year dropdown with the last 5 batches and shows "you will be Year X"
function fillAdmissionYears() {
  const startYear = academicStartYear();
  for (let year = startYear; year >= startYear - 4; year--) {
    const studyYear = startYear - year + 1;
    const label = studyYear > 4 ? year + ' · Alumni' : year + ' · Year ' + studyYear;
    $('#s-admission').append('<option value="' + year + '">' + label + '</option>');
  }
}

// Checks the student form in the browser before sending it. Returns true if all fields are fine.
function validateStudentForm() {
  let valid = true;
  if ($('#s-name').val().trim().length < 2) { showFieldError('#s-name', 'Please enter your full name.'); valid = false; }
  if (!/^\d{10}$/.test($('#s-prn').val().trim())) { showFieldError('#s-prn', 'PRN must be exactly 10 digits.'); valid = false; }
  if (!EMAIL_PATTERN.test($('#s-email').val().trim())) { showFieldError('#s-email', 'Please enter a valid email.'); valid = false; }
  if (!$('#s-admission').val()) { showFieldError('#s-admission', 'Please select your admission year.'); valid = false; }
  if ($('#s-password').val().length < 6) { showFieldError('#s-password', 'At least 6 characters.'); valid = false; }
  if ($('#s-confirm').val() !== $('#s-password').val()) { showFieldError('#s-confirm', 'Passwords do not match.'); valid = false; }
  return valid;
}

function validateFacultyForm() {
  let valid = true;
  if ($('#f-name').val().trim().length < 2) { showFieldError('#f-name', 'Please enter your full name.'); valid = false; }
  if (!EMAIL_PATTERN.test($('#f-email').val().trim())) { showFieldError('#f-email', 'Please enter a valid email.'); valid = false; }
  if (!$('#f-code').val().trim()) { showFieldError('#f-code', 'Faculty secret code is required.'); valid = false; }
  if ($('#f-password').val().length < 6) { showFieldError('#f-password', 'At least 6 characters.'); valid = false; }
  if ($('#f-confirm').val() !== $('#f-password').val()) { showFieldError('#f-confirm', 'Passwords do not match.'); valid = false; }
  return valid;
}

// Sends a registration form to the server
async function submitRegistration(form, url, data) {
  setBusy(form, true, 'Creating account...');
  const result = await api(url, 'POST', data);
  if (result.success) {
    window.location.href = 'dashboard.html';
  } else {
    setBusy(form, false);
    showFormMessage(form, result.message);
  }
}

async function setupRegisterPage() {
  const user = await loadPublicLayout();
  if (user) { window.location.href = 'dashboard.html'; return; }
  fillAdmissionYears();

  // Student / Faculty tabs
  $('.section-tab').on('click', function () {
    $('.section-tab').removeClass('active');
    $(this).addClass('active');
    $('.register-form').addClass('hidden');
    $('#' + $(this).data('form')).removeClass('hidden');
  });
  if (getParam('role') === 'faculty') $('.section-tab[data-form="faculty-form"]').click();

  $('#student-form').on('submit', function (event) {
    event.preventDefault();
    clearErrors(this);
    if (!validateStudentForm()) return;
    submitRegistration(this, '/api/register/student', {
      name: $('#s-name').val().trim(),
      prn: $('#s-prn').val().trim(),
      email: $('#s-email').val().trim(),
      admissionYear: $('#s-admission').val(),
      password: $('#s-password').val()
    });
  });

  $('#faculty-form').on('submit', function (event) {
    event.preventDefault();
    clearErrors(this);
    if (!validateFacultyForm()) return;
    submitRegistration(this, '/api/register/faculty', {
      name: $('#f-name').val().trim(),
      email: $('#f-email').val().trim(),
      secretCode: $('#f-code').val().trim(),
      password: $('#f-password').val()
    });
  });
}

/* ---------- Profile page ---------- */

// Shows the user's details in a small table
function renderProfile(user) {
  const rows = [['Name', user.name], ['Role', user.role === 'faculty' ? 'Faculty' : 'Student'], ['Email', user.email]];
  if (user.role === 'student') {
    rows.push(['PRN', user.prn]);
    rows.push(['Batch (Admission Year)', user.admissionYear]);
    rows.push(['Current Year', studentYearText(user)]);
    rows.push(['PYQ Upload Access', user.canUploadPYQ ? '✅ Allowed' : '❌ Not allowed']);
  }
  rows.push(['Member Since', formatDate(user.createdAt)]);

  const html = rows.map(function (row) {
    return '<tr><td>' + escapeHTML(row[0]) + '</td><td>' + escapeHTML(row[1]) + '</td></tr>';
  }).join('');
  $('#profile-details').html('<table>' + html + '</table>');
}

async function setupProfilePage() {
  const user = await requireLogin();
  if (!user) return;
  renderProfile(user);

  $('#password-form').on('submit', async function (event) {
    event.preventDefault();
    const form = this;
    clearErrors(form);
    const oldPassword = $('#old-password').val();
    const newPassword = $('#new-password').val();

    let valid = true;
    if (!oldPassword) { showFieldError('#old-password', 'Enter your current password.'); valid = false; }
    if (newPassword.length < 6) { showFieldError('#new-password', 'At least 6 characters.'); valid = false; }
    if ($('#confirm-password').val() !== newPassword) { showFieldError('#confirm-password', 'Passwords do not match.'); valid = false; }
    if (!valid) return;

    setBusy(form, true, 'Saving...');
    const result = await api('/api/me/password', 'PUT', { oldPassword: oldPassword, newPassword: newPassword });
    setBusy(form, false);
    if (result.success) {
      form.reset();
      showToast(result.message);
    } else {
      showFormMessage(form, result.message);
    }
  });
}

/* ---------- Start the right page ---------- */
$(function () {
  if ($('#login-form').length) setupLoginPage();
  if ($('#student-form').length) setupRegisterPage();
  if ($('#password-form').length) setupProfilePage();
});
