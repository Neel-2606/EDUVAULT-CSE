// auth.js - Login, Registration and Profile password change

// Helper to show field error under input
function showErr(selector, msg) {
  $(selector).addClass('input-error').closest('.form-group').find('.field-error').text(msg);
}

// Clears all form errors
function clearErr(form) {
  $(form).find('.input-error').removeClass('input-error');
  $(form).find('.field-error, .form-message').text('').removeClass('error');
}

// ---------------- LOGIN PAGE ----------------
async function setupLoginPage() {
  const user = await loadPublicLayout();
  if (user) { window.location.href = 'dashboard.html'; return; }

  $('#login-form').on('submit', async function (e) {
    e.preventDefault();
    clearErr(this);
    const identifier = $('#login-id').val().trim();
    const password = $('#login-password').val();

    if (!identifier || !password) {
      if (!identifier) showErr('#login-id', 'Enter email or PRN.');
      if (!password) showErr('#login-password', 'Enter password.');
      return;
    }

    const res = await api('/api/login', 'POST', { identifier, password });
    if (res.success) {
      window.location.href = 'dashboard.html';
    } else {
      $(this).find('.form-message').addClass('error').text(res.message);
    }
  });
}

// ---------------- REGISTER PAGE ----------------
async function setupRegisterPage() {
  const user = await loadPublicLayout();
  if (user) { window.location.href = 'dashboard.html'; return; }

  // Populate admission year dropdown (current year and 4 past years)
  const y = new Date().getFullYear();
  for (let b = y; b >= y - 4; b--) {
    const yr = y - b + 1;
    $('#s-admission').append(`<option value="${b}">${b} · ${yr <= 4 ? 'Year ' + yr : 'Alumni'}</option>`);
  }

  // Tab switching: Student vs Faculty
  $('.section-tab').on('click', function () {
    $('.section-tab').removeClass('active');
    $(this).addClass('active');
    $('.register-form').addClass('hidden');
    $('#' + $(this).data('form')).removeClass('hidden');
  });

  if (getParam('role') === 'faculty') $('.section-tab[data-form="faculty-form"]').click();

  // Student registration
  $('#student-form').on('submit', async function (e) {
    e.preventDefault();
    clearErr(this);
    const data = {
      name: $('#s-name').val().trim(),
      prn: $('#s-prn').val().trim(),
      email: $('#s-email').val().trim(),
      admissionYear: $('#s-admission').val(),
      password: $('#s-password').val()
    };

    if (!data.name) return showErr('#s-name', 'Name is required.');
    if (!/^\d{10}$/.test(data.prn)) return showErr('#s-prn', 'PRN must be 10 digits.');
    if (!data.email.includes('@')) return showErr('#s-email', 'Enter a valid email.');
    if (data.password.length < 6) return showErr('#s-password', 'Min 6 characters required.');
    if (data.password !== $('#s-confirm').val()) return showErr('#s-confirm', 'Passwords do not match.');

    const res = await api('/api/register/student', 'POST', data);
    if (res.success) window.location.href = 'dashboard.html';
    else $(this).find('.form-message').addClass('error').text(res.message);
  });

  // Faculty registration
  $('#faculty-form').on('submit', async function (e) {
    e.preventDefault();
    clearErr(this);
    const data = {
      name: $('#f-name').val().trim(),
      email: $('#f-email').val().trim(),
      secretCode: $('#f-code').val().trim(),
      password: $('#f-password').val()
    };

    if (!data.name) return showErr('#f-name', 'Name is required.');
    if (!data.email.includes('@')) return showErr('#f-email', 'Enter a valid email.');
    if (!data.secretCode) return showErr('#f-code', 'Secret code is required.');
    if (data.password.length < 6) return showErr('#f-password', 'Min 6 characters required.');
    if (data.password !== $('#f-confirm').val()) return showErr('#f-confirm', 'Passwords do not match.');

    const res = await api('/api/register/faculty', 'POST', data);
    if (res.success) window.location.href = 'dashboard.html';
    else $(this).find('.form-message').addClass('error').text(res.message);
  });
}

// ---------------- PROFILE PAGE ----------------
async function setupProfilePage() {
  const user = await requireLogin();
  if (!user) return;

  const rows = [
    `<tr><td>Name</td><td>${escapeHTML(user.name)}</td></tr>`,
    `<tr><td>Role</td><td>${user.role === 'faculty' ? 'Faculty' : 'Student'}</td></tr>`,
    `<tr><td>Email</td><td>${escapeHTML(user.email)}</td></tr>`
  ];
  if (user.role === 'student') {
    rows.push(`<tr><td>PRN</td><td>${escapeHTML(user.prn)}</td></tr>`);
    rows.push(`<tr><td>Batch</td><td>${user.admissionYear}</td></tr>`);
    rows.push(`<tr><td>PYQ Access</td><td>${user.canUploadPYQ ? 'Allowed ✅' : 'Not Allowed ❌'}</td></tr>`);
  }
  $('#profile-details').html(`<table>${rows.join('')}</table>`);

  // Password change
  $('#password-form').on('submit', async function (e) {
    e.preventDefault();
    clearErr(this);
    const oldPassword = $('#old-password').val();
    const newPassword = $('#new-password').val();

    if (!oldPassword) return showErr('#old-password', 'Enter current password.');
    if (newPassword.length < 6) return showErr('#new-password', 'Min 6 characters required.');
    if (newPassword !== $('#confirm-password').val()) return showErr('#confirm-password', 'Passwords do not match.');

    const res = await api('/api/me/password', 'PUT', { oldPassword, newPassword });
    if (res.success) {
      this.reset();
      showToast(res.message);
    } else {
      $(this).find('.form-message').addClass('error').text(res.message);
    }
  });
}

$(() => {
  if ($('#login-form').length) setupLoginPage();
  if ($('#student-form').length) setupRegisterPage();
  if ($('#password-form').length) setupProfilePage();
});
