// v2.0
function openJoinClassModal() {
  const overlay = document.getElementById('join-class-overlay');
  overlay.style.display = 'flex';
  document.getElementById('join-class-code').value = '';
  document.getElementById('join-class-code').focus();
}

function closeJoinClassModal() {
  document.getElementById('join-class-overlay').style.display = 'none';
}

async function submitJoinClass() {
  const code = document.getElementById('join-class-code').value.trim().toUpperCase();
  if (!code) { showToast('Please enter a class code', 'warning'); return; }
  try {
    const result = await apiJoinSubject(code);
    showToast('Joined ' + result.subject.name + ' successfully!', 'success');
    closeJoinClassModal();
    renderStudentDashboard();
  } catch (err) {
    showToast('Failed to join: ' + err.message, 'error');
  }
}
function showToast(message, type = 'info') {
  const existing = document.getElementById('cf-toast');
  if (existing) existing.remove();
  const colors = {
    error:   { bg: '#2d1a1a', border: '#E24B4A', text: '#f5a0a0', icon: '✕' },
    success: { bg: '#1a2d1a', border: '#1D9E75', text: '#a0f0c0', icon: '✓' },
    info:    { bg: '#1a2040', border: '#378ADD', text: '#a0c8f5', icon: 'ℹ' },
    warning: { bg: '#2d2410', border: '#BA7517', text: '#f5d080', icon: '⚠' }
  };
  const c = colors[type] || colors.info;
  const toast = document.createElement('div');
  toast.id = 'cf-toast';
  toast.style.cssText = `
    position:fixed; top:24px; left:50%; transform:translateX(-50%);
    background:${c.bg}; border:1.5px solid ${c.border}; color:${c.text};
    padding:14px 20px; border-radius:12px; font-size:13px; font-weight:500;
    z-index:99999; max-width:340px; width:90%; text-align:center;
    box-shadow:0 4px 24px rgba(0,0,0,0.4); display:flex; align-items:center; gap:10px;
  `;
  toast.innerHTML = `<span style="font-size:16px;">${c.icon}</span><span>${message}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => { if (toast.parentNode) toast.remove(); }, 3500);
}

function showRegister() {
  document.getElementById('login-box').style.display = 'none';
  document.getElementById('register-box').style.display = 'block';
}

function showLogin() {
  document.getElementById('register-box').style.display = 'none';
  document.getElementById('login-box').style.display = 'block';
}

async function doRegister() {
  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  if (!name || !email || !password) { showToast('Please fill in all fields', 'warning'); return; }
  if (password.length < 6)          { showToast('Password must be at least 6 characters', 'warning'); return; }
  try {
    const user = await apiRegister(name, email, password);
    launchApp(user);
  } catch (err) {
    showToast('Registration failed: ' + err.message, 'error');
  }
}

// ── DARK MODE ──
function toggleDarkMode() {
  document.body.classList.toggle('dark');
  const knob = document.getElementById('dark-knob');
  const isDark = document.body.classList.contains('dark');
  if (knob) knob.textContent = isDark ? '☀️' : '🌙';
  // Save preference
  localStorage.setItem('classflow-theme', isDark ? 'dark' : 'light');
}

// Apply saved theme on page load
(function() {
  const saved = localStorage.getItem('classflow-theme');
  if (saved === 'dark') {
    document.body.classList.add('dark');
    const knob = document.getElementById('dark-knob');
    if (knob) knob.textContent = '☀️';
  }
})();


// ── LOGIN ──

document.getElementById('email-input').addEventListener('input', function () {
  const val = this.value;
  const preview = document.getElementById('role-preview');
  if (val.includes('faculty') || val.includes('prof')) {
    preview.style.display = 'block';
    preview.style.background = '#d8f0e4';
    preview.style.color = '#1a6b40';
    preview.textContent = '👨‍🏫 Teacher account detected — Teacher dashboard will load';
  } else if (val.includes('@') && val.length > 5) {
    preview.style.display = 'block';
    preview.style.background = '#dceeff';
    preview.style.color = '#1a5a9a';
    preview.textContent = '🎓 Student account detected — Student dashboard will load';
  } else {
    preview.style.display = 'none';
  }
});

function autofill(role) {
  const input = document.getElementById('email-input');
  input.value = role === 'teacher'
    ? 'kumar@faculty.du.ac.in'
    : 'priya@student.du.ac.in';
  input.dispatchEvent(new Event('input'));
}

async function doLogin() {
  const email    = document.getElementById('email-input').value.trim();
  const password = document.getElementById('password-input') ? document.getElementById('password-input').value : '';
  if (!email || !email.includes('@')) { showToast('Please enter a valid college email', 'warning'); return; }
  try {
    const user = await apiLogin(email, password);
    launchApp(user);
  } catch (err) {
    showToast('Login failed: ' + err.message, 'error');
  }
}
function launchApp(user) {
  currentUser = user;
  document.getElementById('login-screen').classList.remove('active');
  if (user.role === 'teacher') {
    document.getElementById('teacher-app').classList.add('active');
    document.getElementById('t-user-name').textContent  = user.name;
    document.getElementById('t-user-email').textContent = user.email;
    if (document.getElementById('t-drawer-name'))  document.getElementById('t-drawer-name').textContent  = user.name;
    if (document.getElementById('t-drawer-email')) document.getElementById('t-drawer-email').textContent = user.email;
    renderTeacherDashboard();
  } else {
    document.getElementById('student-app').classList.add('active');
    document.getElementById('s-user-name').textContent  = user.name;
    document.getElementById('s-user-email').textContent = user.email;
    if (document.getElementById('s-drawer-name'))  document.getElementById('s-drawer-name').textContent  = user.name;
    if (document.getElementById('s-drawer-email')) document.getElementById('s-drawer-email').textContent = user.email;
    const firstName = user.name.split(' ')[0];
    document.getElementById('s-greeting').textContent = 'Good morning, ' + firstName + ' 👋';
    renderStudentDashboard();
  }
}

function logout() {
  apiLogout();
  currentUser = null;
  document.getElementById('student-app').classList.remove('active');
  document.getElementById('teacher-app').classList.remove('active');
  document.getElementById('login-screen').classList.add('active');
  document.getElementById('email-input').value = '';
  if (document.getElementById('password-input')) document.getElementById('password-input').value = '';
  document.getElementById('role-preview').style.display = 'none';
}


// ── NAVIGATION ──

function showStudentPage(pageId, clickedNav) {
  document.querySelectorAll('#student-app .page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('#student-sidebar .nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  if (clickedNav) clickedNav.classList.add('active');
}

function showTeacherPage(pageId, clickedNav) {
  document.querySelectorAll('#teacher-app .page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('#teacher-sidebar .nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  if (clickedNav) clickedNav.classList.add('active');
}


// ── CLASS VIEW (Student) ──

let currentClassId = null;

function openClass(subjectId) {
  currentClassId = subjectId;
  const sub = SUBJECTS.find(s => s.id === subjectId);

  // Set banner
  document.getElementById('class-banner').style.background = sub.color;
  document.getElementById('class-banner-title').textContent = sub.name;
  document.getElementById('class-banner-prof').textContent  = sub.professor;

  // Set user avatar initials
  const ini = currentUser ? currentUser.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() : 'PS';
  const avi = document.getElementById('stream-user-avatar');
  if (avi) avi.textContent = ini;

  // Switch to class view page
  showStudentPage('s-class-view', null);

  // Default to Stream tab
  switchClassTab(document.querySelector('.class-tab.active') || document.querySelector('.class-tab'), 'ct-stream');
  renderClassStream(subjectId);
  renderClasswork(subjectId);
  renderPeople(subjectId);
}

function switchClassTab(btn, tabId) {
  document.querySelectorAll('.class-tab').forEach(t => {
    t.style.color = '#888';
    t.style.borderBottom = '2px solid transparent';
  });
  document.querySelectorAll('.class-tab-content').forEach(c => c.style.display = 'none');
  btn.style.color = '#1a5a9a';
  btn.style.borderBottom = '2px solid #1a5a9a';
  const el = document.getElementById(tabId);
  if (el) el.style.display = 'block';
}

function renderClassStream(subjectId) {
  const sub   = SUBJECTS.find(s => s.id === subjectId);
  const feed  = document.getElementById('class-stream-feed');
  const upcoming = document.getElementById('class-upcoming');
  if (!feed) return;

  // Upcoming assignments for this subject
  const pendingAssigns = ASSIGNMENTS.filter(a => a.subject === subjectId && a.status === 'pending');
  if (upcoming) {
    upcoming.innerHTML = pendingAssigns.length === 0
      ? '<p style="font-size:12px;color:#bbb;">No work due soon!</p>'
      : pendingAssigns.map(a => `
        <div style="margin-bottom:8px;">
          <p style="font-size:12px;font-weight:500;margin:0;color:#1a1a1a;">${a.title}</p>
          <p style="font-size:11px;color:#888;margin:2px 0 0;">Due: ${a.due}</p>
        </div>`).join('');
  }

  // Filter stream posts for this subject only
  const sessionAnnouncements = ANNOUNCEMENTS
    .filter(a => a.class === sub.name || a.class === 'All classes')
    .map((a, i) => ({
      id: 9000 + i, subject: subjectId, type: 'announcement',
      author: currentUser ? currentUser.name : 'Teacher',
      initials: 'RK', color: sub.color,
      title: a.title, body: a.body, time: a.time, comments: []
    }));

  const subjectPosts = STREAM_POSTS.filter(p => p.subject === subjectId);
  const allPosts     = [...sessionAnnouncements, ...subjectPosts];

  if (allPosts.length === 0) {
    feed.innerHTML = '<div class="card" style="text-align:center;"><p style="color:#bbb;font-size:13px;padding:1rem 0;">No announcements yet in this class.</p></div>';
    return;
  }

  const typeLabel = { announcement:'Announcement', material:'Material posted', assignment:'Assignment' };
  const typeBadge = { announcement:'badge-blue', material:'badge-gray', assignment:'badge-amber' };

  feed.innerHTML = allPosts.map(post => {
    const sessionComments = STREAM_COMMENTS[post.id] || [];
    const allComments     = [...post.comments, ...sessionComments];
    const commentsHTML    = allComments.map(c => `
      <div style="display:flex;gap:8px;margin-top:8px;align-items:flex-start;">
        <div class="avatar" style="background:#f0ede6;color:#555;width:26px;height:26px;font-size:10px;flex-shrink:0;">${c.initials}</div>
        <div style="background:#f5f2eb;border-radius:8px;padding:6px 10px;flex:1;">
          <span style="font-size:11px;font-weight:600;">${c.author}</span>
          <span style="font-size:11px;color:#aaa;margin-left:6px;">${c.time}</span>
          <p style="font-size:12px;color:#555;margin:2px 0 0;">${c.text}</p>
        </div>
      </div>`).join('');

    return `<div class="card">
      <div style="display:flex;gap:10px;align-items:flex-start;">
        <div class="avatar" style="background:${post.color}22;color:${post.color};flex-shrink:0;">${post.initials}</div>
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="font-size:13px;font-weight:600;">${post.author}</span>
            <span class="badge ${typeBadge[post.type]||'badge-gray'}" style="font-size:10px;">${typeLabel[post.type]||post.type}</span>
          </div>
          <p style="font-size:11px;color:#aaa;margin:2px 0 8px;">${post.time}</p>
          <p style="font-size:14px;font-weight:600;color:#1a1a1a;margin:0 0 4px;">${post.title}</p>
          <p style="font-size:13px;color:#555;margin:0;line-height:1.5;">${post.body}</p>
        </div>
      </div>
      ${allComments.length > 0 ? `<div style="border-top:1px solid #f0ede6;padding-top:10px;margin-top:10px;">
        <p style="font-size:11px;color:#888;margin:0 0 4px;">💬 ${allComments.length} class comment${allComments.length>1?'s':''}</p>
        ${commentsHTML}
      </div>` : ''}
      <div style="border-top:1px solid #f0ede6;padding-top:8px;margin-top:8px;display:flex;gap:8px;align-items:center;">
        <div class="avatar" style="background:#dceeff;color:#1a5a9a;width:26px;height:26px;font-size:10px;flex-shrink:0;" id="comment-avatar-${post.id}">${ini || 'PS'}</div>
        <input type="text" id="comment-${post.id}" placeholder="Add class comment..." style="flex:1;padding:6px 10px;font-size:12px;">
        <button class="btn btn-primary btn-sm" onclick="addClassComment(${post.id})">Post</button>
      </div>
    </div>`;
  }).join('');
}

function addClassComment(postId) {
  const input = document.getElementById('comment-' + postId);
  const text  = input ? input.value.trim() : '';
  if (!text) return;
  if (!STREAM_COMMENTS[postId]) STREAM_COMMENTS[postId] = [];
  const ini = currentUser ? currentUser.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() : 'PS';
  STREAM_COMMENTS[postId].push({
    author:   currentUser ? currentUser.name : 'Priya Sharma',
    initials: ini, text, time: 'Just now'
  });
  renderClassStream(currentClassId);
}

function postClassComment() {
  const input = document.getElementById('class-comment-input');
  const text  = input ? input.value.trim() : '';
  if (!text) { showToast('Please type a comment first', 'warning'); return; }
  const posts = STREAM_POSTS.filter(p => p.subject === currentClassId);
  if (posts.length > 0) {
    if (!STREAM_COMMENTS[posts[0].id]) STREAM_COMMENTS[posts[0].id] = [];
    const ini = currentUser ? currentUser.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() : 'PS';
    STREAM_COMMENTS[posts[0].id].push({ author: currentUser ? currentUser.name : 'Priya Sharma', initials: ini, text, time: 'Just now' });
  }
  input.value = '';
  renderClassStream(currentClassId);
}

function renderClasswork(subjectId) {
  const list = document.getElementById('classwork-list');
  if (!list) return;
  const items = ASSIGNMENTS.filter(a => a.subject === subjectId);
  if (items.length === 0) {
    list.innerHTML = '<p style="font-size:13px;color:#bbb;text-align:center;padding:0.5rem 0;">No assignments yet.</p>';
    return;
  }
  const sub = SUBJECTS.find(s => s.id === subjectId);
  list.innerHTML = `<div class="card-label">Assignments</div>` + items.map(a => {
    const bc = a.status === 'graded' ? (a.score>=80?'badge-green':'badge-amber') : a.status === 'submitted' ? 'badge-blue' : a.due.includes('Today') ? 'badge-red' : 'badge-amber';
    const bl = a.status === 'graded' ? a.score+'/100' : a.status === 'submitted' ? 'Submitted' : a.due;
    return `<div class="row" onclick="openAssignment(${a.id}); showStudentPage('s-assignments',document.querySelectorAll('#student-sidebar .nav-item')[2])">
      <div class="dot" style="background:${sub.color}"></div>
      <div style="flex:1;"><p style="font-size:13px;font-weight:500;margin:0;">${a.title}</p><p style="font-size:11px;color:#888;margin:2px 0 0;">${a.due}</p></div>
      <span class="badge ${bc}">${bl}</span>
    </div>`;
  }).join('');
}

function renderPeople(subjectId) {
  const sub      = SUBJECTS.find(s => s.id === subjectId);
  const nameEl   = document.getElementById('people-teacher-name');
  const avatarEl = document.getElementById('people-teacher-avatar');
  const list     = document.getElementById('people-list');
  if (nameEl)   nameEl.textContent   = sub.professor;
  if (avatarEl) avatarEl.textContent = sub.professor.split(' ').filter(w=>w!=='Prof.').map(w=>w[0]).join('').slice(0,2);
  if (!list) return;
  list.innerHTML = STUDENTS.map(s => `
    <div class="row" style="cursor:default;">
      <div class="avatar" style="background:${s.color};color:${s.tcolor};">${s.initials}</div>
      <div><p style="font-size:13px;margin:0;">${s.name}</p></div>
    </div>`).join('') +
    `<div class="row" style="cursor:default;opacity:0.4;">
      <div class="avatar" style="background:#f0ede6;color:#aaa;">+45</div>
      <div><p style="font-size:13px;color:#aaa;margin:0;">45 more students</p></div>
    </div>`;
}


// ── CLASS VIEW (Teacher) ──

let currentTeacherClassId = null;

function openTeacherClass(subjectId) {
  currentTeacherClassId = subjectId;
  const sub = SUBJECTS.find(s => s.id === subjectId);

  document.getElementById('t-class-banner').style.background    = sub.color;
  document.getElementById('t-class-banner-title').textContent   = sub.name;
  document.getElementById('t-class-banner-section').textContent = sub.professor + ' · 50 students';

  showTeacherPage('t-class-view', null);
  switchTeacherClassTab(document.querySelector('.t-class-tab'), 'tct-stream');
  renderTeacherClassStream(subjectId);
  renderTeacherClasswork(subjectId);
  renderTeacherPeople(subjectId);
}

function switchTeacherClassTab(btn, tabId) {
  document.querySelectorAll('.t-class-tab').forEach(t => {
    t.style.color = '#888';
    t.style.borderBottom = '2px solid transparent';
  });
  document.querySelectorAll('.t-class-tab-content').forEach(c => c.style.display = 'none');
  if (btn) { btn.style.color = '#1a5a9a'; btn.style.borderBottom = '2px solid #1a5a9a'; }
  const el = document.getElementById(tabId);
  if (el) el.style.display = 'block';
}

function renderTeacherClassStream(subjectId) {
  const sub      = SUBJECTS.find(s => s.id === subjectId);
  const feed     = document.getElementById('t-class-stream-feed');
  const upcoming = document.getElementById('t-class-upcoming');
  if (!feed) return;

  const pendingAssigns = ASSIGNMENTS.filter(a => a.subject === subjectId && a.status === 'pending');
  if (upcoming) {
    upcoming.innerHTML = pendingAssigns.length === 0
      ? '<p style="font-size:12px;color:#bbb;">No work due soon!</p>'
      : pendingAssigns.map(a => `
        <div style="margin-bottom:8px;">
          <p style="font-size:12px;font-weight:500;margin:0;">${a.title}</p>
          <p style="font-size:11px;color:#888;margin:2px 0 0;">Due: ${a.due}</p>
        </div>`).join('');
  }

  const sessionPosts = ANNOUNCEMENTS
    .filter(a => a.class === sub.name || a.class === 'All classes')
    .map((a, i) => ({
      id: 9000+i, type:'announcement', author: a.author,
      initials: 'RK', color: sub.color,
      title: a.title, body: a.body, time: a.time, comments: []
    }));

  const subjectPosts = STREAM_POSTS.filter(p => p.subject === subjectId);
  const allPosts     = [...sessionPosts, ...subjectPosts];

  if (allPosts.length === 0) {
    feed.innerHTML = '<div class="card" style="text-align:center;"><p style="color:#bbb;font-size:13px;padding:1rem 0;">No announcements yet. Post your first one!</p></div>';
    return;
  }

  feed.innerHTML = allPosts.map(post => {
    const typeLabel = { announcement:'Announcement', material:'Material posted', assignment:'Assignment' };
    const typeBadge = { announcement:'badge-blue', material:'badge-gray', assignment:'badge-amber' };
    const allComments = [...post.comments, ...(STREAM_COMMENTS[post.id]||[])];
    return `<div class="card">
      <div style="display:flex;gap:10px;align-items:flex-start;">
        <div class="avatar" style="background:${post.color}22;color:${post.color};flex-shrink:0;">${post.initials}</div>
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="font-size:13px;font-weight:600;">${post.author}</span>
            <span class="badge ${typeBadge[post.type]||'badge-gray'}" style="font-size:10px;">${typeLabel[post.type]||post.type}</span>
            <span style="font-size:11px;color:#aaa;">${post.time}</span>
          </div>
          <p style="font-size:14px;font-weight:600;color:#1a1a1a;margin:6px 0 4px;">${post.title}</p>
          <p style="font-size:13px;color:#555;line-height:1.5;margin:0;">${post.body}</p>
        </div>
        <span style="font-size:11px;color:#aaa;white-space:nowrap;">💬 ${allComments.length}</span>
      </div>
    </div>`;
  }).join('');
}

function renderTeacherClasswork(subjectId) {
  const list = document.getElementById('t-classwork-list');
  if (!list) return;
  const sub   = SUBJECTS.find(s => s.id === subjectId);
  const items = ASSIGNMENTS.filter(a => a.subject === subjectId);
  list.innerHTML = `<div class="card-label">Assignments</div>` + (items.length === 0
    ? '<p style="font-size:13px;color:#bbb;">No assignments yet.</p>'
    : items.map(a => {
        const submitted = STUDENTS.filter(s => s.submitted).length;
        return `<div class="row" onclick="showTeacherPage('t-submissions',null)">
          <div class="dot" style="background:${sub.color}"></div>
          <div style="flex:1;"><p style="font-size:13px;font-weight:500;margin:0;">${a.title}</p><p style="font-size:11px;color:#888;margin:2px 0 0;">${a.due}</p></div>
          <span class="badge badge-blue">${submitted}/50 submitted</span>
        </div>`;
      }).join(''));
}

function renderTeacherPeople(subjectId) {
  const list = document.getElementById('t-people-list');
  if (!list) return;
  list.innerHTML = STUDENTS.map(s => `
    <div class="row" style="cursor:default;">
      <div class="avatar" style="background:${s.color};color:${s.tcolor};">${s.initials}</div>
      <div style="flex:1;"><p style="font-size:13px;margin:0;">${s.name}</p></div>
      <span class="badge ${s.submitted?'badge-green':'badge-red'}">${s.submitted?'Submitted':'Missing'}</span>
    </div>`).join('') +
    `<div class="row" style="cursor:default;opacity:0.4;">
      <div class="avatar" style="background:#f0ede6;color:#aaa;">+45</div>
      <div><p style="font-size:13px;color:#aaa;margin:0;">45 more students</p></div>
    </div>`;
}


// ── STREAM COMMENTS ──
const STREAM_COMMENTS = {};


// ── STUDENT RENDERS ──

function renderStudentDashboard() {
  // FIX: use correct IDs that match index.html
  const avg     = Math.round(SUBJECTS.reduce((s, sub) => s + sub.grade, 0) / SUBJECTS.length);
  const pending = ASSIGNMENTS.filter(a => a.status === 'pending').length;

  const dueEl = document.getElementById('s-due-count');
  const avgEl = document.getElementById('s-avg-grade');
  if (dueEl) dueEl.textContent = pending;
  if (avgEl) avgEl.textContent = avg + '%';

  renderDueSoon();
  renderGradedRecent();
  renderClassGrid();
  renderAssignmentList();
  renderGrades();
  renderNotifications();
  renderStream();
}

function renderDueSoon() {
  const list    = document.getElementById('due-soon-list');
  if (!list) return;
  const pending = ASSIGNMENTS.filter(a => a.status === 'pending').slice(0, 3);
  list.innerHTML = pending.map(a => {
    const sub = SUBJECTS.find(s => s.id === a.subject);
    const bc  = a.due.includes('Today') ? 'badge-red' : 'badge-amber';
    return `<div class="row" onclick="openAssignment(${a.id})">
      <div class="dot" style="background:${sub.color}"></div>
      <div style="flex:1">
        <p style="font-size:13px;font-weight:500;margin:0">${a.title}</p>
        <p style="font-size:11px;color:#888;margin:2px 0 0">${sub.name}</p>
      </div>
      <span class="badge ${bc}">${a.due}</span>
    </div>`;
  }).join('');
}

function renderGradedRecent() {
  const list   = document.getElementById('graded-list');
  if (!list) return;
  const graded = ASSIGNMENTS.filter(a => a.status === 'graded');
  list.innerHTML = graded.map(a => {
    const sub = SUBJECTS.find(s => s.id === a.subject);
    const bc  = a.score >= 80 ? 'badge-green' : a.score >= 60 ? 'badge-amber' : 'badge-red';
    return `<div class="row" onclick="showStudentPage('s-grades', null)">
      <div class="dot" style="background:${sub.color}"></div>
      <div style="flex:1">
        <p style="font-size:13px;margin:0">${a.title}</p>
        <p style="font-size:11px;color:#888;margin:2px 0 0">${sub.name}</p>
      </div>
      <span class="badge ${bc}">${a.score}/100</span>
    </div>`;
  }).join('');
}

function renderClassGrid() {
  const grid = document.getElementById('class-grid');
  if (!grid) return;
  grid.innerHTML = SUBJECTS.map(s => {
    const bc = s.pending > 0 ? 'badge-amber' : 'badge-green';
    const bl = s.pending > 0 ? s.pending + ' pending' : 'Up to date';
    return `<div class="class-card" onclick="openClass('${s.id}')">
      <div class="class-card-header" style="background:${s.color}">
        <div><h3>${s.name}</h3><p>${s.professor}</p></div>
      </div>
      <div class="class-card-body">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-size:11px;color:#888;">${bl}</span>
          <span class="badge ${bc}">${bl}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:11px;color:#888;">Grade</span>
          <div class="bar-wrap"><div class="bar" style="width:${s.grade}%;background:${s.color}"></div></div>
          <span style="font-size:11px;font-weight:500;">${s.grade}%</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

// FIX: renamed from filterAssignments → filterAssign to match HTML onclick calls
function filterAssign(btn, status) {
  document.querySelectorAll('.tab-row .tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderAssignmentList(status);
  document.getElementById('assign-detail').style.display = 'none';
}

function renderAssignmentList(filter = 'all') {
  const list = document.getElementById('assign-list');
  if (!list) return;
  const items = filter === 'all'
    ? ASSIGNMENTS
    : ASSIGNMENTS.filter(a => a.status === filter);

  if (items.length === 0) {
    list.innerHTML = '<p style="font-size:13px;color:#bbb;text-align:center;padding:0.5rem 0;">No assignments in this category.</p>';
    return;
  }

  list.innerHTML = items.map(a => {
    const sub = SUBJECTS.find(s => s.id === a.subject);
    const bc  = a.status === 'graded'    ? (a.score >= 80 ? 'badge-green' : 'badge-amber')
              : a.status === 'submitted' ? 'badge-blue'
              : a.due.includes('Today')  ? 'badge-red'
              : 'badge-amber';
    const bl  = a.status === 'graded'    ? a.score + '/100'
              : a.status === 'submitted' ? 'Submitted'
              : a.due;
    return `<div class="row" onclick="openAssignment(${a.id})">
      <div class="dot" style="background:${sub.color}"></div>
      <div style="flex:1">
        <p style="font-size:13px;font-weight:500;margin:0">${a.title}</p>
        <p style="font-size:11px;color:#888;margin:2px 0 0">${sub.name}</p>
      </div>
      <span class="badge ${bc}">${bl}</span>
    </div>`;
  }).join('');
}

function openAssignment(id) {
  const a      = ASSIGNMENTS.find(x => x.id === id);
  const sub    = SUBJECTS.find(s => s.id === a.subject);
  const detail = document.getElementById('assign-detail');
  detail.style.display = 'block';

  document.getElementById('ad-title').textContent = a.title;
  // FIX: was 'ad-subject', correct ID is 'ad-sub'
  document.getElementById('ad-sub').textContent   = sub.name + ' · ' + a.due;

  const actions = document.getElementById('ad-actions');

  if (a.status === 'pending') {
    actions.innerHTML = `
      <p style="font-size:12px;color:#888;margin:0 0 8px;">Upload your submission:</p>
      <input type="text" id="submit-link" placeholder="Paste Google Drive link or file name" style="margin-bottom:8px;">
      <button class="btn btn-dark btn-full" onclick="submitAssignment(${id})">Submit assignment →</button>`;
  } else if (a.status === 'submitted') {
    actions.innerHTML = `
      <div style="background:#dceeff;border-radius:8px;padding:10px 14px;">
        <p style="font-size:13px;color:#1a5a9a;margin:0;">Submitted — awaiting grade from professor.</p>
      </div>`;
  } else {
    const bg = a.score >= 80 ? '#dff0e6' : '#fef3dc';
    const tc = a.score >= 80 ? '#1a6b40' : '#7a4800';
    actions.innerHTML = `
      <div style="background:${bg};border-radius:8px;padding:10px 14px;">
        <p style="font-size:15px;font-weight:600;margin:0 0 4px;color:${tc}">Score: ${a.score}/100</p>
        <p style="font-size:12px;color:#888;margin:0;">Good work! Keep it up.</p>
      </div>`;
  }
  detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function submitAssignment(id) {
  const linkEl = document.getElementById('submit-link');
  const link   = linkEl ? linkEl.value.trim() : '';
  if (!link) { showToast('Please enter a file link or name', 'warning'); return; }

  const a   = ASSIGNMENTS.find(x => x.id === id);
  a.status  = 'submitted';

  renderStudentDashboard();
  document.getElementById('assign-detail').style.display = 'none';
  showToast('Assignment submitted successfully!', 'success');
}

function renderGrades() {
  const container = document.getElementById('grades-list');
  if (!container) return;
  const avg = Math.round(SUBJECTS.reduce((s, sub) => s + sub.grade, 0) / SUBJECTS.length);

  container.innerHTML = SUBJECTS.map(sub => {
    const col = sub.grade < 70 ? '#9b2020' : sub.grade >= 80 ? '#1a6b40' : '#7a4800';
    const warn = sub.grade < 70 ? ' ⚠️' : '';
    return `<div style="margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
        <div style="display:flex;align-items:center;gap:7px;">
          <div class="dot" style="background:${sub.color}"></div>
          <span style="font-size:13px;">${sub.name}</span>
        </div>
        <span style="font-size:13px;font-weight:500;color:${col};">${sub.grade}%${warn}</span>
      </div>
      <div class="bar-wrap">
        <div class="bar" style="width:${sub.grade}%;background:${sub.color};"></div>
      </div>
    </div>`;
  }).join('') +
  `<div style="margin-top:1rem;padding-top:1rem;border-top:1px solid #f0ede6;display:flex;justify-content:space-between;align-items:center;">
    <span style="font-size:13px;color:#888;">Overall average</span>
    <span style="font-size:16px;font-weight:600;color:#1a6b40;">${avg}%</span>
  </div>`;
}

function renderNotifications() {
  // FIX: correct container ID is 'notif-list'
  const container = document.getElementById('notif-list');
  if (!container) return;

  const colors = { danger: '#fceaea', warning: '#fef3dc', success: '#dff0e6' };
  container.innerHTML = NOTIFICATIONS.map(n => `
    <div class="notif-row">
      <div class="notif-icon" style="background:${colors[n.type]}">${n.icon}</div>
      <div>
        <p style="font-size:13px;font-weight:500;margin:0;">${n.title}</p>
        <p style="font-size:12px;color:#888;margin:3px 0 0;">${n.body}</p>
        <p style="font-size:11px;color:#bbb;margin:3px 0 0;">${n.time}</p>
      </div>
    </div>`).join('');

  // Update notification count badge
  const badge = document.getElementById('s-notif-count');
  if (badge) badge.textContent = NOTIFICATIONS.length;
}


// ── TEACHER RENDERS ──

// FIX: this function must exist — it's called by doLogin()
function renderTeacherDashboard() {
  renderGradeQueue();
  renderAnnouncementList();
}

function renderGradeQueue() {
  const queue    = document.getElementById('grade-queue');
  const doneBox  = document.getElementById('graded-done');
  if (!queue) return;

  const ungraded = STUDENTS.filter(s => s.submitted && !GRADED_IDS.has(s.id));

  if (ungraded.length === 0) {
    queue.style.display   = 'none';
    if (doneBox) doneBox.style.display = 'block';
    return;
  }

  if (doneBox) doneBox.style.display = 'none';
  queue.style.display = 'block';

  queue.innerHTML = ungraded.map(s => `
    <div class="sub-list-item" onclick="openTeacherGradePanel(${s.id}, 1)" id="gq-${s.id}">
      <div class="avatar" style="background:${s.color};color:${s.tcolor};">${s.initials}</div>
      <div style="flex:1;">
        <p style="font-size:13px;font-weight:500;margin:0;">${s.name} — OS Lab 3</p>
        <p style="font-size:11px;color:#888;margin:2px 0 0;">Submitted · awaiting grade</p>
      </div>
      <span class="badge badge-amber">Grade →</span>
    </div>`).join('');
}

function saveGrade(studentId) {
  const input = document.getElementById('score-' + studentId);
  const score = parseInt(input.value);
  if (!score || score < 0 || score > 100) {
    showToast('Enter a valid score between 0 and 100', 'warning');
    return;
  }

  // Mark as graded
  GRADED_IDS.add(studentId);

  const row     = document.getElementById('gq-' + studentId);
  const student = STUDENTS.find(s => s.id === studentId);

  // Update row visually
  row.innerHTML = `
    <div class="avatar" style="background:${student.color};color:${student.tcolor};">${student.initials}</div>
    <div style="flex:1;">
      <p style="font-size:13px;font-weight:500;margin:0;">${student.name} — OS Lab 3</p>
      <p style="font-size:11px;color:#888;margin:2px 0 0;">Graded</p>
    </div>
    <span class="badge badge-green">${score}/100 ✓</span>`;
  row.style.opacity = '0.5';

  // Re-render queue after short delay
  setTimeout(() => renderGradeQueue(), 600);
}


// ── ANNOUNCEMENT SYSTEM (FULLY FUNCTIONAL) ──

function postAnnouncement() {
  const title = document.getElementById('ann-title').value.trim();
  const body  = document.getElementById('ann-body').value.trim();
  const cls   = document.getElementById('ann-class').value;

  if (!title || !body) {
    showToast('Please fill in both title and message', 'warning');
    return;
  }

  // Save to announcements array
  ANNOUNCEMENTS.unshift({
    title:  title,
    body:   body,
    class:  cls,
    time:   'Just now',
    author: currentUser ? currentUser.name : 'Teacher'
  });

  // Push to student notifications immediately
  NOTIFICATIONS.unshift({
    type:  'warning',
    icon:  '📢',
    title: title,
    body:  body + ' — ' + cls,
    time:  'Just now'
  });

  // Clear form
  document.getElementById('ann-title').value = '';
  document.getElementById('ann-body').value  = '';

  // Re-render announcement list
  renderAnnouncementList();
  // Refresh teacher class stream if open
  if (currentTeacherClassId) renderTeacherClassStream(currentTeacherClassId);
  // Refresh student class stream if open
  if (currentClassId) renderClassStream(currentClassId);

  showToast('Announcement posted! Students will see it in Alerts.', 'success');
}

function renderAnnouncementList() {
  const list = document.getElementById('ann-list');
  if (!list) return;

  if (ANNOUNCEMENTS.length === 0) {
    list.innerHTML = '<p style="font-size:13px;color:#bbb;text-align:center;padding:1rem 0;">No announcements posted yet.</p>';
    return;
  }

  list.innerHTML = ANNOUNCEMENTS.map(a => `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
        <p style="font-size:13px;font-weight:600;margin:0;">${a.title}</p>
        <span class="badge badge-green">Posted</span>
      </div>
      <p style="font-size:12px;color:#888;margin:0 0 4px;">${a.body}</p>
      <p style="font-size:11px;color:#bbb;margin:0;">${a.time} · ${a.class} · ${a.author}</p>
    </div>`).join('');
}

/* ══════════════════════════════════════
   MOBILE NAV HELPERS
══════════════════════════════════════ */

function openDrawer(role) {
  const overlay = document.getElementById(role + '-drawer-overlay');
  const drawer  = document.getElementById(role + '-drawer');
  overlay.classList.add('open');
  drawer.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDrawer(role) {
  const overlay = document.getElementById(role + '-drawer-overlay');
  const drawer  = document.getElementById(role + '-drawer');
  overlay.classList.remove('open');
  drawer.classList.remove('open');
  document.body.style.overflow = '';
}

function setMobNav(role, btn) {
  const nav = document.getElementById(role + '-mobile-nav');
  nav.querySelectorAll('.mob-nav-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

/* Close drawer on Escape key */
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') { closeDrawer('s'); closeDrawer('t'); }
});

