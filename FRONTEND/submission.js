/* ══════════════════════════════════════
   SUBMISSION SYSTEM — submission.js
   Advanced GC-style assignment submission
══════════════════════════════════════ */

// ── SUBMISSION STATE ──
const SUBMISSION_STATE = {};
// { [assignId]: { files: [], links: [], text: '', submittedAt: null, status: 'pending'|'submitted'|'graded', score, feedback, privateComments: [] } }

// ── TEACHER GRADING STATE ──
const TEACHER_GRADES = {};
// { [studentId + '_' + assignId]: { score, feedback, returnedAt } }

// ── CURRENT OPEN ASSIGNMENT ──
let currentOpenAssignId = null;

// ── INIT state for each assignment ──
function ensureSubState(id) {
  if (!SUBMISSION_STATE[id]) {
    const a = ASSIGNMENTS.find(x => x.id === id);
    SUBMISSION_STATE[id] = {
      files: [],
      links: [],
      text: '',
      submittedAt: null,
      status: a ? a.status : 'pending',
      score: a ? a.score : null,
      feedback: a && a.status === 'graded' ? 'Good effort! Check the rubric for detailed comments.' : null,
      privateComments: a && a.status === 'graded'
        ? [{ author: 'Prof. R. Kumar', initials: 'RK', text: 'Well structured, but the memory management section needs more depth.', time: '2 days ago', role: 'teacher' }]
        : []
    };
  }
  return SUBMISSION_STATE[id];
}

// ── FILE TYPE HELPERS ──
function getFileIcon(name) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  const map = { pdf:'📄', doc:'📝', docx:'📝', ppt:'📊', pptx:'📊', xls:'📈', xlsx:'📈', zip:'🗜️', rar:'🗜️', py:'🐍', js:'📜', cpp:'⚙️', c:'⚙️', java:'☕', txt:'📃', jpg:'🖼️', jpeg:'🖼️', png:'🖼️', gif:'🖼️', mp4:'🎬', mp3:'🎵' };
  return map[ext] || '📎';
}
function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024*1024) return (bytes/1024).toFixed(0) + ' KB';
  return (bytes/(1024*1024)).toFixed(1) + ' MB';
}
function getLetterGrade(score) {
  if (score >= 90) return { letter: 'A+', color: '#1a6b40', bg: '#dff0e6' };
  if (score >= 80) return { letter: 'A',  color: '#1a6b40', bg: '#dff0e6' };
  if (score >= 70) return { letter: 'B',  color: '#7a4800', bg: '#fef3dc' };
  if (score >= 60) return { letter: 'C',  color: '#7a4800', bg: '#fef3dc' };
  if (score >= 50) return { letter: 'D',  color: '#9b2020', bg: '#fceaea' };
  return { letter: 'F', color: '#9b2020', bg: '#fceaea' };
}

// ── TOAST NOTIFICATION ──
function showToast(msg, color='#1a6b40') {
  const toast = document.getElementById('sub-toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.style.background = color;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── OPEN ASSIGNMENT DETAIL PAGE ──
function openAssignmentDetail(id) {
  currentOpenAssignId = id;
  ensureSubState(id);
  const a   = ASSIGNMENTS.find(x => x.id === id);
  const sub = SUBJECTS.find(s => s.id === a.subject);
  const st  = SUBMISSION_STATE[id];

  const page = document.getElementById('assign-detail-page');
  page.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Render the page
  renderAssignDetailPage(a, sub, st);
}

function closeAssignmentDetail() {
  const page = document.getElementById('assign-detail-page');
  page.classList.remove('open');
  document.body.style.overflow = '';
  currentOpenAssignId = null;
}

// ── RENDER FULL DETAIL PAGE ──
function renderAssignDetailPage(a, sub, st) {
  const isLate     = a.due.includes('Today') && st.status === 'pending';
  const isGraded   = st.status === 'graded';
  const isSubmitted= st.status === 'submitted';
  const isPending  = st.status === 'pending';

  // Status bar
  const statusMap = {
    pending:   { dot: '#E24B4A', text: 'Not submitted yet', badge: '<span class="badge badge-red">Missing</span>' },
    submitted: { dot: '#378ADD', text: 'Submitted — awaiting grade', badge: '<span class="badge badge-blue">Turned in</span>' },
    graded:    { dot: '#1D9E75', text: `Graded — ${st.score}/100`, badge: `<span class="badge badge-green">${st.score}/100</span>` }
  };
  const sm = statusMap[st.status] || statusMap.pending;

  // Instructions by subject type
  const instructionMap = {
    1: `<p>Implement a Round Robin CPU scheduling algorithm in C/C++. Your program should:</p>
        <ul style="padding-left:1.2rem;margin-top:8px;color:var(--text-secondary);font-size:13px;line-height:1.8;">
          <li>Accept N processes with burst times from the user</li>
          <li>Accept time quantum Q as input</li>
          <li>Output: Gantt chart, average waiting time, average turnaround time</li>
          <li>Handle edge cases: Q larger than burst time, single process, etc.</li>
        </ul>
        <p style="margin-top:12px;"><strong>Submission format:</strong> Upload .c or .cpp file + a PDF report with screenshots.</p>`,
    2: `<p>Complete Quiz 2 covering B+ Trees, Hashing, and Indexing. Open notes. Time limit: 45 minutes once started.</p>`,
    3: `<p>Submit your HCI Project Proposal as a PDF. It should include user research plan, problem statement, and proposed solution outline (1000-1500 words).</p>`,
    4: `<p>Submit the Software Engineering Report covering system design with UML diagrams: use-case, class diagram, and sequence diagram.</p>`,
  };

  const rubricMap = {
    1: [
      ['Algorithm implementation', '50 pts', 'Correct Round Robin logic, handles edge cases'],
      ['Code quality',             '20 pts', 'Clean code, comments, variable naming'],
      ['Report & screenshots',     '20 pts', 'Gantt chart, sample output clearly shown'],
      ['On-time submission',       '10 pts', 'Full marks if submitted before deadline'],
    ],
    3: [
      ['Problem statement clarity','30 pts', 'Well-defined problem with user evidence'],
      ['Research methodology',     '30 pts', 'Appropriate methods for HCI research'],
      ['Proposed solution',        '25 pts', 'Creative, feasible, user-centered design'],
      ['Writing quality',          '15 pts', 'Clear, concise, well-structured writing'],
    ]
  };

  const rubric = rubricMap[a.id];

  // Teacher materials attached
  const materials = [
    { name: 'Assignment_3_Instructions.pdf', size: '245 KB', icon: '📄', color: '#fceaea' },
    { name: 'RoundRobin_Template.cpp',       size: '3.4 KB', icon: '⚙️', color: '#dceeff' },
  ];

  document.getElementById('assign-detail-page').innerHTML = `
    <!-- Header -->
    <div class="adp-header">
      <div class="adp-banner">
        <button class="adp-back" onclick="closeAssignmentDetail()">←</button>
        <div class="adp-meta">
          <div class="adp-subject-pill" style="background:${sub.color}">${sub.name}</div>
          <h1 class="adp-title">${a.title}</h1>
          <div class="adp-info-row">
            <span class="adp-info-chip">📅 ${a.due}</span>
            <span class="adp-info-chip">👤 ${sub.professor}</span>
            <span class="adp-info-chip">📌 100 points</span>
          </div>
        </div>
      </div>
      <div class="adp-status-bar">
        <div class="adp-status-dot" style="background:${sm.dot}"></div>
        <span class="adp-status-text">${sm.text}</span>
        ${sm.badge}
      </div>
    </div>

    <!-- Body -->
    <div class="adp-body">
      <!-- LEFT: Instructions -->
      <div class="adp-left">
        ${isLate ? `<div class="late-banner">⚠️ This assignment is due today — submit as soon as possible to avoid late penalty.</div>` : ''}

        <div class="adp-section-label">Instructions</div>
        <div class="adp-instructions">
          ${instructionMap[a.id] || `<p>${a.title} — please refer to the attached document for full instructions.</p>`}
        </div>

        ${rubric ? `
        <div class="adp-section-label">Grading rubric</div>
        <table class="adp-rubric-table">
          <tr><th>Criteria</th><th>Points</th><th>Description</th></tr>
          ${rubric.map(r=>`<tr><td><strong>${r[0]}</strong></td><td style="white-space:nowrap;font-weight:600;">${r[1]}</td><td>${r[2]}</td></tr>`).join('')}
        </table>` : ''}

        <div class="adp-section-label">Materials from teacher</div>
        <div class="adp-attachments">
          ${materials.map(m=>`
            <div class="adp-attachment-chip">
              <div class="adp-attach-icon" style="background:${m.color}">${m.icon}</div>
              <div>
                <div class="adp-attach-name">${m.name}</div>
                <div class="adp-attach-size">${m.size}</div>
              </div>
              <span style="margin-left:auto;font-size:11px;color:#6aabf7;">Download</span>
            </div>`).join('')}
        </div>

        ${isGraded && st.feedback ? `
        <div class="adp-section-label">Teacher feedback</div>
        <div class="card" style="border-left:3px solid ${sub.color};margin-bottom:0;">
          <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin:0;">${st.feedback}</p>
        </div>` : ''}
      </div>

      <!-- RIGHT: Submission panel -->
      <div class="adp-right">

        ${isGraded ? renderGradePanel(st, sub) : ''}

        <!-- SUBMISSION CARD -->
        <div class="sub-panel">
          <div class="sub-panel-header">
            📤 Your submission
            ${isSubmitted ? '<span class="badge badge-blue" style="margin-left:auto;font-size:10px;">Turned in</span>' : ''}
            ${isGraded   ? '<span class="badge badge-green" style="margin-left:auto;font-size:10px;">Returned</span>' : ''}
          </div>
          <div class="sub-panel-body" id="sub-panel-body">
            ${renderSubmissionBody(a, st, sub)}
          </div>
        </div>

        <!-- PRIVATE COMMENTS -->
        <div class="sub-panel">
          <div class="sub-panel-header">💬 Private comments</div>
          <div class="sub-panel-body">
            <div class="private-comments-list" id="private-comments-list">
              ${renderPrivateComments(st)}
            </div>
            <div style="display:flex;gap:6px;">
              <input type="text" id="private-comment-input" placeholder="Add private comment..." style="flex:1;font-size:12px;">
              <button class="btn btn-gray btn-sm" onclick="addPrivateComment(${a.id})">Send</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  // Attach file drop zone events after render
  initDropZone(a.id, st);
}

function renderGradePanel(st, sub) {
  const g = getLetterGrade(st.score);
  return `
    <div class="sub-panel" style="margin-bottom:12px;">
      <div class="sub-panel-header">🎯 Your grade</div>
      <div class="score-display">
        <div class="score-circle" style="border-color:${g.color};">
          <span class="score-number" style="color:${g.color};">${st.score}</span>
          <span class="score-denom">/100</span>
        </div>
        <div class="score-grade" style="color:${g.color};">${g.letter}</div>
        <div class="score-feedback">${st.score >= 80 ? 'Great work! 🎉' : st.score >= 60 ? 'Good effort — review feedback.' : 'Needs improvement — see feedback.'}</div>
      </div>
    </div>`;
}

function renderSubmissionBody(a, st, sub) {
  const isPending  = st.status === 'pending';
  const isSubmitted= st.status === 'submitted';
  const isGraded   = st.status === 'graded';

  if (isGraded || isSubmitted) {
    // Show submitted files + unsubmit option
    const submittedFiles = st.files.length > 0 ? st.files : [
      { name: 'submission.pdf', size: '1.2 MB', fakeName: true }
    ];
    return `
      <div class="file-list">
        ${submittedFiles.map(f=>`
          <div class="file-item">
            <span class="file-item-icon">${getFileIcon(f.name)}</span>
            <span class="file-item-name">${f.name}</span>
            <span class="file-item-size">${f.fakeName ? '' : formatSize(f.size)}</span>
          </div>`).join('')}
        ${st.links.map(l=>`
          <div class="file-item">
            <span class="file-item-icon">🔗</span>
            <span class="file-item-name">${l}</span>
          </div>`).join('')}
      </div>
      ${st.submittedAt ? `<p style="font-size:11px;color:var(--text-muted);margin:0 0 10px;">Submitted ${st.submittedAt}</p>` : ''}
      ${isSubmitted ? `<button class="btn btn-gray btn-full btn-sm" onclick="unsubmitAssignment(${a.id})" style="font-size:12px;">Unsubmit</button>` : ''}
      ${isGraded ? `<p style="font-size:11px;color:var(--text-muted);text-align:center;margin:4px 0 0;">This assignment has been graded and returned.</p>` : ''}`;
  }

  // Pending — show upload zone
  return `
    <div id="drop-zone-${a.id}" class="drop-zone" onclick="document.getElementById('file-input-${a.id}').click()">
      <input type="file" id="file-input-${a.id}" style="display:none;" multiple onchange="handleFileInput(${a.id}, this)">
      <div class="drop-zone-icon">📁</div>
      <div class="drop-zone-text">Drop files here or click to browse</div>
      <div class="drop-zone-hint">PDF, DOC, PPT, images, ZIP • Max 100 MB each</div>
    </div>
    <div class="file-list" id="file-list-${a.id}"></div>
    <div class="adp-section-label" style="margin-top:8px;">Or add a link</div>
    <div class="link-input-row">
      <input type="text" id="link-input-${a.id}" placeholder="Paste Google Drive, GitHub link..." style="font-size:12px;">
      <button class="btn btn-gray btn-sm" onclick="addLink(${a.id})">Add</button>
    </div>
    <div class="adp-section-label">Or type your answer</div>
    <textarea id="text-input-${a.id}" placeholder="Type your answer here..." style="font-size:13px;min-height:80px;" oninput="SUBMISSION_STATE[${a.id}].text=this.value">${st.text || ''}</textarea>
    <button class="btn btn-dark btn-full" style="margin-top:12px;" onclick="promptSubmit(${a.id})">
      Hand in →
    </button>`;
}

function renderPrivateComments(st) {
  if (!st.privateComments || st.privateComments.length === 0) {
    return '<p style="font-size:12px;color:var(--text-hint);text-align:center;padding:8px 0;">No private comments yet.</p>';
  }
  return st.privateComments.map(c => `
    <div class="private-comment">
      <div class="avatar" style="width:28px;height:28px;font-size:10px;background:${c.role==='teacher'?'#fef3dc':'#dceeff'};color:${c.role==='teacher'?'#7a4800':'#1a5a9a'};flex-shrink:0;">${c.initials}</div>
      <div class="private-comment-bubble">
        <span class="private-comment-author">${c.author}</span>
        <span class="private-comment-time">${c.time}</span>
        <p class="private-comment-text">${c.text}</p>
      </div>
    </div>`).join('');
}

// ── DROP ZONE EVENTS ──
function initDropZone(id, st) {
  const zone = document.getElementById('drop-zone-' + id);
  if (!zone) return;
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files);
    addFiles(id, files);
  });
}

function handleFileInput(id, input) {
  addFiles(id, Array.from(input.files));
  input.value = '';
}

function addFiles(id, files) {
  const st = SUBMISSION_STATE[id];
  files.forEach(f => {
    if (!st.files.find(x => x.name === f.name)) {
      st.files.push({ name: f.name, size: f.size });
    }
  });
  refreshFileList(id, st);
}

function refreshFileList(id, st) {
  const list = document.getElementById('file-list-' + id);
  if (!list) return;
  list.innerHTML = st.files.map((f, i) => `
    <div class="file-item">
      <span class="file-item-icon">${getFileIcon(f.name)}</span>
      <span class="file-item-name">${f.name}</span>
      <span class="file-item-size">${formatSize(f.size)}</span>
      <button class="file-item-remove" onclick="removeFile(${id},${i})">✕</button>
    </div>`).join('') +
    st.links.map((l, i) => `
    <div class="file-item">
      <span class="file-item-icon">🔗</span>
      <span class="file-item-name">${l}</span>
      <button class="file-item-remove" onclick="removeLink(${id},${i})">✕</button>
    </div>`).join('');
}

function removeFile(id, i) {
  SUBMISSION_STATE[id].files.splice(i, 1);
  refreshFileList(id, SUBMISSION_STATE[id]);
}
function removeLink(id, i) {
  SUBMISSION_STATE[id].links.splice(i, 1);
  refreshFileList(id, SUBMISSION_STATE[id]);
}

function addLink(id) {
  const input = document.getElementById('link-input-' + id);
  const val   = input.value.trim();
  if (!val) return;
  SUBMISSION_STATE[id].links.push(val);
  input.value = '';
  refreshFileList(id, SUBMISSION_STATE[id]);
}

// ── SUBMIT FLOW ──
function promptSubmit(id) {
  const st = SUBMISSION_STATE[id];
  const hasContent = st.files.length > 0 || st.links.length > 0 || st.text.trim();
  if (!hasContent) {
    showToast('Please add at least one file, link, or answer text', '#E24B4A');
    return;
  }
  // Show confirmation overlay
  const overlay = document.getElementById('submit-confirm-overlay');
  const a  = ASSIGNMENTS.find(x => x.id === id);
  document.getElementById('submit-confirm-title').textContent = 'Hand in ' + a.title + '?';
  document.getElementById('submit-confirm-sub').textContent =
    `You're about to submit ${st.files.length} file(s)${st.links.length?', '+st.links.length+' link(s)':''} to ${SUBJECTS.find(s=>s.id===a.subject).professor}. You can unsubmit until graded.`;
  document.getElementById('submit-confirm-btn').onclick = () => finalSubmit(id);
  overlay.classList.add('open');
}

function closeSubmitConfirm() {
  document.getElementById('submit-confirm-overlay').classList.remove('open');
}

function finalSubmit(id) {
  closeSubmitConfirm();
  const st = SUBMISSION_STATE[id];
  const a  = ASSIGNMENTS.find(x => x.id === id);

  // Update state
  st.status      = 'submitted';
  st.submittedAt = 'Just now';
  a.status       = 'submitted';

  // Add a notification
  NOTIFICATIONS.unshift({
    type: 'success', icon: '✅',
    title: `${a.title} submitted`,
    body: 'Your assignment was handed in successfully.',
    time: 'Just now'
  });

  // Re-render the detail page with new state
  const sub = SUBJECTS.find(s => s.id === a.subject);
  renderAssignDetailPage(a, sub, st);

  // Refresh lists behind the page
  renderStudentDashboard();

  showToast('✅ Assignment submitted!');
}

function unsubmitAssignment(id) {
  const st = SUBMISSION_STATE[id];
  const a  = ASSIGNMENTS.find(x => x.id === id);
  st.status      = 'pending';
  st.submittedAt = null;
  a.status       = 'pending';
  const sub = SUBJECTS.find(s => s.id === a.subject);
  renderAssignDetailPage(a, sub, st);
  renderStudentDashboard();
  showToast('Submission recalled. You can edit and resubmit.', '#7a4800');
}

// ── PRIVATE COMMENTS ──
function addPrivateComment(id) {
  const input = document.getElementById('private-comment-input');
  const text  = input ? input.value.trim() : '';
  if (!text) return;
  const st  = SUBMISSION_STATE[id];
  const ini = currentUser ? currentUser.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() : 'PS';
  st.privateComments.push({
    author: currentUser ? currentUser.name : 'Priya Sharma',
    initials: ini, text, time: 'Just now', role: 'student'
  });
  const list = document.getElementById('private-comments-list');
  if (list) list.innerHTML = renderPrivateComments(st);
  input.value = '';
}

// ── TEACHER: ADVANCED GRADING PANEL ──
function openTeacherGradePanel(studentId, assignId) {
  const student = STUDENTS.find(s => s.id === studentId);
  const a       = ASSIGNMENTS.find(x => x.id === assignId) || ASSIGNMENTS[0];
  const key     = studentId + '_' + assignId;
  if (!TEACHER_GRADES[key]) {
    TEACHER_GRADES[key] = { score: '', feedback: '', returned: false };
  }
  const tg = TEACHER_GRADES[key];

  const panel = document.getElementById('teacher-grade-panel');
  if (!panel) return;

  // Fake student submission
  const fakeFiles = [
    { name: 'RoundRobin_Solution.cpp', size: '4.2 KB' },
    { name: 'Lab3_Report.pdf',         size: '890 KB' },
  ];

  panel.style.display = 'block';
  panel.innerHTML = `
    <div class="grading-panel">
      <div class="grading-panel-header">
        <div>
          <h3>${student.name}</h3>
          <p style="font-size:11px;color:var(--text-muted);margin:2px 0 0;">${a.title}</p>
        </div>
        <button class="btn btn-gray btn-sm" onclick="document.getElementById('teacher-grade-panel').style.display='none'">✕ Close</button>
      </div>

      <!-- Submitted files -->
      <div class="submission-files-preview">
        <p class="adp-section-label">Student submitted</p>
        <div class="file-list">
          ${fakeFiles.map(f=>`
            <div class="file-item">
              <span class="file-item-icon">${getFileIcon(f.name)}</span>
              <span class="file-item-name">${f.name}</span>
              <span class="file-item-size">${f.size}</span>
              <span style="margin-left:auto;font-size:11px;color:#6aabf7;cursor:pointer;">View</span>
            </div>`).join('')}
        </div>
      </div>

      <!-- Grade input -->
      <div class="grade-input-section">
        <p class="adp-section-label">Grade</p>
        <div class="grade-slider-wrap">
          <input type="range" class="grade-slider" id="grade-slider-${key}" min="0" max="100" value="${tg.score||0}"
            oninput="syncGradeInputs('${key}', this.value)">
          <input type="number" class="grade-number-input" id="grade-num-${key}" min="0" max="100" value="${tg.score||''}" placeholder="—"
            oninput="syncGradeInputs('${key}', this.value)">
          <div class="grade-letter" id="grade-letter-${key}" style="color:${tg.score?getLetterGrade(tg.score).color:'var(--text-hint)'};">
            ${tg.score ? getLetterGrade(tg.score).letter : '—'}
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-hint);margin-top:2px;">
          <span>0</span><span>50</span><span>100</span>
        </div>
      </div>

      <!-- Feedback -->
      <div class="feedback-section">
        <p class="adp-section-label">Written feedback (optional)</p>
        <textarea id="grade-feedback-${key}" placeholder="Leave feedback for the student..." style="min-height:100px;font-size:13px;">${tg.feedback||''}</textarea>
        <p class="adp-section-label" style="margin-top:12px;">Private comment to student</p>
        <div style="display:flex;gap:6px;">
          <input type="text" id="teacher-private-comment-${key}" placeholder="Add a private comment..." style="flex:1;font-size:12px;">
          <button class="btn btn-gray btn-sm" onclick="addTeacherPrivateComment('${key}', ${studentId}, ${assignId})">Send</button>
        </div>
      </div>

      <!-- Actions -->
      <div style="padding:12px 18px;display:flex;gap:8px;border-top:1px solid var(--border-card);">
        <button class="btn btn-gray" style="flex:1;" onclick="saveGradeOnly('${key}')">Save draft</button>
        <button class="btn btn-dark" style="flex:1;" onclick="returnGradeToStudent('${key}', ${studentId}, ${assignId})">Return to student</button>
      </div>
    </div>`;
}

function syncGradeInputs(key, val) {
  val = Math.max(0, Math.min(100, parseInt(val)||0));
  const slider = document.getElementById('grade-slider-' + key);
  const num    = document.getElementById('grade-num-'    + key);
  const letter = document.getElementById('grade-letter-' + key);
  if (slider) slider.value = val;
  if (num)    num.value    = val;
  if (letter) {
    const g = getLetterGrade(val);
    letter.textContent = g.letter;
    letter.style.color = g.color;
  }
  TEACHER_GRADES[key].score = val;
}

function saveGradeOnly(key) {
  const feedbackEl = document.getElementById('grade-feedback-' + key);
  if (feedbackEl) TEACHER_GRADES[key].feedback = feedbackEl.value;
  showToast('Draft saved', '#378ADD');
}

function returnGradeToStudent(key, studentId, assignId) {
  const score    = TEACHER_GRADES[key].score;
  const feedback = (document.getElementById('grade-feedback-' + key)||{}).value || '';
  if (!score && score !== 0) { showToast('Please enter a grade first', '#E24B4A'); return; }

  // Update teacher grades
  TEACHER_GRADES[key].feedback = feedback;
  TEACHER_GRADES[key].returned = true;

  // Mark student as graded in GRADED_IDS (existing system)
  GRADED_IDS.add(studentId);

  // Push into SUBMISSION_STATE for student view
  const subKey = assignId;
  ensureSubState(subKey);
  SUBMISSION_STATE[subKey].status   = 'graded';
  SUBMISSION_STATE[subKey].score    = score;
  SUBMISSION_STATE[subKey].feedback = feedback || 'Good work! See rubric for breakdown.';

  // Update ASSIGNMENTS array too
  const a = ASSIGNMENTS.find(x => x.id === assignId);
  if (a) { a.status = 'graded'; a.score = score; }

  // Notify student
  const student = STUDENTS.find(s => s.id === studentId);
  NOTIFICATIONS.unshift({
    type: 'success', icon: '🎯',
    title: `${a ? a.title : 'Assignment'} graded — ${score}/100`,
    body: `${student.name}: ${getLetterGrade(score).letter} — ${feedback.slice(0,60)||'Feedback returned'}`,
    time: 'Just now'
  });

  document.getElementById('teacher-grade-panel').style.display = 'none';
  showToast(`✅ Grade returned to ${student.name}!`);
  renderGradeQueue();
}

function addTeacherPrivateComment(key, studentId, assignId) {
  const input = document.getElementById('teacher-private-comment-' + key);
  const text  = input ? input.value.trim() : '';
  if (!text) return;

  // Push into student's private comments
  ensureSubState(assignId);
  const ini = currentUser ? currentUser.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() : 'RK';
  SUBMISSION_STATE[assignId].privateComments.push({
    author: currentUser ? currentUser.name : 'Prof. R. Kumar',
    initials: ini, text, time: 'Just now', role: 'teacher'
  });
  if (input) input.value = '';
  showToast('Private comment sent to student', '#378ADD');
}

// ── OVERRIDE openAssignment (from script.js) ──
// Replace the old simple openAssignment with the new one
window.openAssignment = function(id) {
  openAssignmentDetail(id);
};
