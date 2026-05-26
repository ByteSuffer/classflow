/**
 * api-bridge.js — Connects ClassFlow frontend to the real backend.
 */

// ─────────────────────────────────────────
// OVERRIDE: doLogin — use real API
// ─────────────────────────────────────────
window.doLogin = async function () {
  const email    = document.getElementById('email-input').value.trim();
  const password = document.getElementById('password-input') ? document.getElementById('password-input').value : '';
  if (!email || !email.includes('@')) {
    showToast('Please enter a valid college email', 'warning');
    return;
  }

  try {
    currentUser = await apiLogin(email, password);

    document.getElementById('login-screen').classList.remove('active');

    if (currentUser.role === 'teacher') {
      document.getElementById('teacher-app').classList.add('active');
      document.getElementById('t-user-name').textContent  = currentUser.name;
      document.getElementById('t-user-email').textContent = currentUser.email;
      if (document.getElementById('t-drawer-name'))  document.getElementById('t-drawer-name').textContent  = currentUser.name;
      if (document.getElementById('t-drawer-email')) document.getElementById('t-drawer-email').textContent = currentUser.email;
      await renderTeacherDashboardFromAPI();
    } else {
      document.getElementById('student-app').classList.add('active');
      document.getElementById('s-user-name').textContent  = currentUser.name;
      document.getElementById('s-user-email').textContent = currentUser.email;
      if (document.getElementById('s-drawer-name'))  document.getElementById('s-drawer-name').textContent  = currentUser.name;
      if (document.getElementById('s-drawer-email')) document.getElementById('s-drawer-email').textContent = currentUser.email;
      const firstName = currentUser.name.split(' ')[0];
      document.getElementById('s-greeting').textContent = 'Good morning, ' + firstName + ' 👋';
      await renderStudentDashboardFromAPI();
    }
  } catch (err) {
    showToast('Login failed: ' + err.message, 'error');
  }
};

// ─────────────────────────────────────────
// STUDENT DASHBOARD — from API
// ─────────────────────────────────────────
async function renderStudentDashboardFromAPI() {
  try {
    const [dash, subjects, assignments, notifications] = await Promise.all([
      apiStudentDashboard(),
      apiGetSubjects(),
      apiGetAssignments(),
      apiGetNotifications()
    ]);

    window.SUBJECTS      = subjects;
    window.ASSIGNMENTS   = assignments;
    window.NOTIFICATIONS = notifications;

    const dueEl = document.getElementById('s-due-count');
    const avgEl = document.getElementById('s-avg-grade');
    const clsEl = document.getElementById('s-classes-count');
    if (dueEl) dueEl.textContent = dash.due_this_week || 0;
    if (avgEl) avgEl.textContent = (dash.avg_grade || '--') + '%';
    if (clsEl) clsEl.textContent = dash.classes_joined || 0;

    const dueSoonEl = document.getElementById('due-soon-list');
    if (dueSoonEl && dash.due_soon) {
      dueSoonEl.innerHTML = dash.due_soon.map(a => {
        const sub = subjects.find(s => s.id === a.subject) || {};
        const bc  = a.due.includes('Today') ? 'badge-red' : 'badge-amber';
        return `<div class="row" onclick="openAssignment(${a.id})">
          <div class="dot" style="background:${sub.color||'#888'}"></div>
          <div style="flex:1"><p style="font-size:13px;font-weight:500;margin:0">${a.title}</p>
          <p style="font-size:11px;color:#888;margin:2px 0 0">${sub.name||''}</p></div>
          <span class="badge ${bc}">${a.due}</span></div>`;
      }).join('');
    }

    const gradedEl = document.getElementById('graded-list');
    if (gradedEl && dash.recently_graded) {
      gradedEl.innerHTML = dash.recently_graded.map(a => {
        const sub = subjects.find(s => s.id === a.subject) || {};
        const bc  = a.score >= 80 ? 'badge-green' : a.score >= 60 ? 'badge-amber' : 'badge-red';
        return `<div class="row" onclick="showStudentPage('s-grades', null)">
          <div class="dot" style="background:${sub.color||'#888'}"></div>
          <div style="flex:1"><p style="font-size:13px;margin:0">${a.title}</p>
          <p style="font-size:11px;color:#888;margin:2px 0 0">${sub.name||''}</p></div>
          <span class="badge ${bc}">${a.score}/100</span></div>`;
      }).join('');
    }

    const grid = document.getElementById('class-grid');
    if (grid) {
      if (subjects.length === 0) {
        grid.innerHTML = `
          <div style="grid-column:1/-1;text-align:center;padding:3rem 1rem;">
            <div style="font-size:48px;margin-bottom:12px;">🏫</div>
            <p style="font-size:15px;font-weight:600;margin:0 0 6px;">No classes yet</p>
            <p style="font-size:13px;color:#888;margin:0 0 16px;">Ask your teacher for a class code and click + Join class</p>
          </div>`;
      } else {
        grid.innerHTML = subjects.map(s => {
          const bc = s.pending > 0 ? 'badge-amber' : 'badge-green';
          const bl = s.pending > 0 ? s.pending + ' pending' : 'Up to date';
          return `<div class="class-card" onclick="openClass(${s.id})" style="position:relative;">
            <button onclick="event.stopPropagation();unenrollClass(${s.id},'${s.name}')" style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.3);border:none;color:white;border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;z-index:1;">Leave</button>
            <div class="class-card-header" style="background:${s.color||'#378ADD'}">
              <div><h3>${s.name}</h3><p>${s.professor||''}</p></div>
            </div>
            <div class="class-card-body">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-size:11px;color:#888;">${bl}</span>
                <span class="badge ${bc}">${bl}</span>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:11px;color:#888;">Grade</span>
                <div class="bar-wrap"><div class="bar" style="width:${s.grade||0}%;background:${s.color||'#378ADD'}"></div></div>
                <span style="font-size:11px;font-weight:500;">${s.grade||'--'}%</span>
              </div>
            </div>
          </div>`;
        }).join('');
      }
    }
    const pageTitleEl = document.querySelector('#s-classes .page-title');
    if (pageTitleEl) pageTitleEl.textContent = `My Classes (${subjects.length})`;

    // Update sidebar with real classes
    const sidebarClassesSection = document.querySelector('#student-sidebar .nav-section');
    if (sidebarClassesSection) {
      // Remove all existing class nav items after the nav-section
      let next = sidebarClassesSection.nextElementSibling;
      while (next && next.classList.contains('nav-item')) {
        const toRemove = next;
        next = next.nextElementSibling;
        toRemove.remove();
      }
      // Add real classes
      subjects.forEach(s => {
        const div = document.createElement('div');
        div.className = 'nav-item';
        div.style.gap = '6px';
        div.innerHTML = `<div class="nav-dot" style="background:${s.color||'#378ADD'}"></div>${s.name}`;
        div.onclick = () => openClass(s.id);
        sidebarClassesSection.insertAdjacentElement('afterend', div);
      });
    }
    renderAssignmentList();
    renderGrades();
    renderNotifications();

  } catch (err) {
    console.error('Dashboard load failed:', err);
  }
}


// ─────────────────────────────────────────
// TEACHER DASHBOARD — from API
// ─────────────────────────────────────────
async function renderTeacherDashboardFromAPI() {
  try {
    const [dash, subjects, assignments] = await Promise.all([
      apiTeacherDashboard(),
      apiGetSubjects(),
      apiGetAssignments()
    ]);

    window.SUBJECTS    = subjects;
    window.ASSIGNMENTS = assignments;

    const grid = document.querySelector('#t-dashboard .metrics-grid');
    if (grid) {
      const cards = grid.querySelectorAll('.metric-card .mvalue');
      if (cards[0]) cards[0].textContent = dash.total_students    || 0;
      if (cards[1]) cards[1].textContent = dash.pending_grading   || 0;
      if (cards[2]) cards[2].textContent = (dash.submission_rate  || 0) + '%';
    }

    const queueEl = document.getElementById('grade-queue');
    if (queueEl && dash.needs_grading) {
      queueEl.innerHTML = dash.needs_grading.map(s => `
        <div class="sub-list-item" onclick="openTeacherGradePanel(${s.student_id}, ${s.assignment_id})">
          <div class="avatar" style="background:#dceeff;color:#1a5a9a;">${s.initials||'??'}</div>
          <div style="flex:1;">
            <p style="font-size:13px;font-weight:500;margin:0;">${s.student_name} — ${assignments.find(a=>a.id===s.assignment_id)?.title||'Assignment'}</p>
            <p style="font-size:11px;color:#888;margin:2px 0 0;">Submitted ${s.submitted_at}</p>
          </div>
          <span class="badge badge-amber">Grade →</span>
        </div>`).join('');
    }

    renderAnnouncementList();

  } catch (err) {
    console.error('Teacher dashboard load failed:', err);
  }
}

// ─────────────────────────────────────────
// OVERRIDE: renderStudentDashboard
// ─────────────────────────────────────────
window.renderStudentDashboard = function () {
  renderStudentDashboardFromAPI();
};

window.renderTeacherDashboard = function () {
  renderTeacherDashboardFromAPI();
};

// ─────────────────────────────────────────
// OVERRIDE: finalSubmit — use real API
// ─────────────────────────────────────────
window.finalSubmit = async function (id) {
  closeSubmitConfirm();
  const st = SUBMISSION_STATE[id];

  try {
    const allLinks = [
      ...st.files.map(f => f.name),
      ...st.links
    ].join(',');

    const result = await apiSubmitAssignment(id, allLinks, st.text || '');

    st.backendId   = result.submission.id;
    st.status      = 'submitted';
    st.submittedAt = result.submission.submitted_at;

    const a = ASSIGNMENTS.find(x => x.id === id);
    if (a) a.status = 'submitted';

    NOTIFICATIONS.unshift({
      type: 'success', icon: '✅',
      title: `${a ? a.title : 'Assignment'} submitted`,
      body: 'Your assignment was handed in successfully.',
      time: 'Just now'
    });

    const sub = SUBJECTS.find(s => s.id === (a ? a.subject : null));
    renderAssignDetailPage(a, sub, st);
    renderStudentDashboard();
    showToast('Assignment submitted successfully!', 'success');

  } catch (err) {
    showToast('Submission failed: ' + err.message, 'error');
  }
};

// ─────────────────────────────────────────
// OVERRIDE: unsubmitAssignment — use real API
// ─────────────────────────────────────────
window.unsubmitAssignment = async function (id) {
  const st = SUBMISSION_STATE[id];
  if (!st || !st.backendId) {
    showToast('Cannot unsubmit — submission ID not found', 'error');
    return;
  }
  try {
    await apiUnsubmit(st.backendId);
    st.status      = 'pending';
    st.submittedAt = null;
    st.backendId   = null;
    const a   = ASSIGNMENTS.find(x => x.id === id);
    if (a) a.status = 'pending';
    const sub = SUBJECTS.find(s => s.id === (a ? a.subject : null));
    renderAssignDetailPage(a, sub, st);
    renderStudentDashboard();
    showToast('Submission recalled. You can edit and resubmit.', 'warning');
  } catch (err) {
    showToast('Unsubmit failed: ' + err.message, 'error');
  }
};

// ─────────────────────────────────────────
// OVERRIDE: returnGradeToStudent — use real API
// ─────────────────────────────────────────
window.returnGradeToStudent = async function (key, studentId, assignId) {
  const score    = TEACHER_GRADES[key] ? TEACHER_GRADES[key].score : null;
  const feedback = (document.getElementById('grade-feedback-' + key) || {}).value || '';
  if (!score && score !== 0) { showToast('Please enter a grade first', 'warning'); return; }

  try {
    const subData = await apiGetSubmissions(assignId);
    const sub     = subData.submissions.find(s => s.student_id === studentId);
    if (!sub) { showToast('Submission not found in database', 'error'); return; }

    await apiGradeSubmission(sub.id, score, feedback);

    GRADED_IDS.add(studentId);
    ensureSubState(assignId);
    SUBMISSION_STATE[assignId].status   = 'graded';
    SUBMISSION_STATE[assignId].score    = score;
    SUBMISSION_STATE[assignId].feedback = feedback || 'Good work!';

    const a = ASSIGNMENTS.find(x => x.id === assignId);
    if (a) { a.status = 'graded'; a.score = score; }

    const student = { name: sub.student_name };
    NOTIFICATIONS.unshift({
      type: 'success', icon: '🎯',
      title: `${a ? a.title : 'Assignment'} graded — ${score}/100`,
      body:  `${student.name}: ${getLetterGrade(score).letter}`,
      time:  'Just now'
    });

    document.getElementById('teacher-grade-panel').style.display = 'none';
    showToast('Grade returned to ' + student.name + '!', 'success');
    renderGradeQueue();

  } catch (err) {
    showToast('Grading failed: ' + err.message, 'error');
  }
};

// ─────────────────────────────────────────
// OVERRIDE: postAnnouncement — use real API
// ─────────────────────────────────────────
window.postAnnouncement = async function () {
  const title = document.getElementById('ann-title').value.trim();
  const body  = document.getElementById('ann-body').value.trim();
  const cls   = document.getElementById('ann-class').value;
  if (!title || !body) { showToast('Please fill in both title and message', 'warning'); return; }

  try {
    const ann = await apiPostAnnouncement(title, body, cls === 'All classes' ? null : cls);

    ANNOUNCEMENTS.unshift({
      title:  ann.title,
      body:   ann.body,
      class:  cls,
      time:   'Just now',
      author: currentUser ? currentUser.name : 'Teacher'
    });

    NOTIFICATIONS.unshift({
      type: 'warning', icon: '📢',
      title: title,
      body:  body + ' — ' + cls,
      time:  'Just now'
    });

    document.getElementById('ann-title').value = '';
    document.getElementById('ann-body').value  = '';

    renderAnnouncementList();
    // Update teacher sidebar with real classes
  const teacherNavSection = document.querySelector('#teacher-sidebar .nav-section');
  if (teacherNavSection) {
    let next = teacherNavSection.nextElementSibling;
    while (next && next.classList.contains('nav-item')) {
      const toRemove = next;
      next = next.nextElementSibling;
      toRemove.remove();
    }
    subjects.forEach(s => {
      const div = document.createElement('div');
      div.className = 'nav-item';
      div.style.gap = '6px';
      div.innerHTML = `<div class="nav-dot" style="background:${s.color||'#378ADD'}"></div>${s.name}`;
      div.onclick = () => openTeacherClassFromAPI(s);
      sidebarSection.insertAdjacentElement('afterend', div);
    });
  }

  // Update My Classes page with real subjects + Create Class button
  const tClassesPage = document.getElementById('t-classes');
  if (tClassesPage) {
    tClassesPage.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
        <div class="page-title">My Classes (${subjects.length})</div>
        <button class="btn btn-dark btn-sm" onclick="openCreateClassModal()">+ Create class</button>
      </div>
      <div class="class-grid">
        ${subjects.length === 0 ? `
          <div style="grid-column:1/-1;text-align:center;padding:3rem 1rem;">
            <div style="font-size:48px;margin-bottom:12px;">🏫</div>
            <p style="font-size:15px;font-weight:600;margin:0 0 6px;">No classes yet</p>
            <p style="font-size:13px;color:#888;">Click + Create class to get started</p>
          </div>` :
        subjects.map(s => `
          <div class="class-card" onclick="openTeacherClassFromAPI(${JSON.stringify(s).replace(/"/g, '&quot;')})">
            <div class="class-card-header" style="background:${s.color||'#378ADD'}">
              <div><h3>${s.name}</h3><p>Code: ${s.code}</p></div>
            </div>
            <div class="class-card-body">
              <p style="font-size:12px;color:#888;margin:0;">Click to manage class</p>
            </div>
          </div>`).join('')}
      </div>`;
  }
      if (currentTeacherClassId) renderTeacherClassStream(currentTeacherClassId);
      if (currentClassId)        renderClassStream(currentClassId);

      showToast('Announcement posted! Students will see it in Alerts.', 'success');

    } catch (err) {
      showToast('Failed to post announcement: ' + err.message, 'error');
    }
  };

// ─────────────────────────────────────────
// OVERRIDE: addClassComment — use real API
// ─────────────────────────────────────────
window.addClassComment = async function (postId) {
  const input = document.getElementById('comment-' + postId);
  const text  = input ? input.value.trim() : '';
  if (!text) return;

  try {
    const comment = await apiAddStreamComment(postId, text);
    if (!STREAM_COMMENTS[postId]) STREAM_COMMENTS[postId] = [];
    STREAM_COMMENTS[postId].push(comment);
    renderClassStream(currentClassId);
  } catch (err) {
    showToast('Comment failed: ' + err.message, 'error');
  }
};

// ─────────────────────────────────────────
// OVERRIDE: addPrivateComment — use real API
// ─────────────────────────────────────────
window.addPrivateComment = async function (id) {
  const input = document.getElementById('private-comment-input');
  const text  = input ? input.value.trim() : '';
  if (!text) return;
  const st = SUBMISSION_STATE[id];
  if (!st || !st.backendId) {
    const ini = currentUser ? currentUser.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() : 'PS';
    st.privateComments.push({ author: currentUser ? currentUser.name : 'Priya Sharma', initials: ini, text, time: 'Just now', role: 'student' });
    const list = document.getElementById('private-comments-list');
    if (list) list.innerHTML = renderPrivateComments(st);
    if (input) input.value = '';
    return;
  }
  try {
    const comment = await apiAddPrivateComment(st.backendId, text);
    st.privateComments.push(comment);
    const list = document.getElementById('private-comments-list');
    if (list) list.innerHTML = renderPrivateComments(st);
    if (input) input.value = '';
  } catch (err) {
    showToast('Comment failed: ' + err.message, 'error');
  }
};

// ─────────────────────────────────────────
// AUTO RESTORE SESSION on page load
// ─────────────────────────────────────────
(async function restoreSession() {
  const token = getToken();
  if (!token) return;
  try {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 5000)
    );
    currentUser = await Promise.race([apiGetMe(), timeout]);

    document.getElementById('login-screen').classList.remove('active');
    if (currentUser.role === 'teacher') {
      document.getElementById('teacher-app').classList.add('active');
      document.getElementById('t-user-name').textContent  = currentUser.name;
      document.getElementById('t-user-email').textContent = currentUser.email;
      await renderTeacherDashboardFromAPI();
    } else {
      document.getElementById('student-app').classList.add('active');
      document.getElementById('s-user-name').textContent  = currentUser.name;
      document.getElementById('s-user-email').textContent = currentUser.email;
      const firstName = currentUser.name.split(' ')[0];
      const greetEl   = document.getElementById('s-greeting');
      if (greetEl) greetEl.textContent = 'Good morning, ' + firstName + ' 👋';
      await renderStudentDashboardFromAPI();
    }
  } catch (err) {
    removeToken();
  }
})();