// ============ DATA.JS — All hardcoded data ============

const USERS = [
  { name: "Priya Sharma",   email: "priya@student.du.ac.in",  role: "student" },
  { name: "Rahul Kumar",    email: "rahul@student.du.ac.in",  role: "student" },
  { name: "Prof. R. Kumar", email: "kumar@faculty.du.ac.in",  role: "teacher" }
];

const SUBJECTS = [
  { id: "os",    name: "Operating Systems",    professor: "Prof. R. Kumar",  color: "#E24B4A", grade: 74, pending: 2 },
  { id: "dbms",  name: "Database Management",  professor: "Prof. S. Mehta",  color: "#378ADD", grade: 81, pending: 1 },
  { id: "cn",    name: "Computer Networks",    professor: "Prof. A. Sharma", color: "#1D9E75", grade: 82, pending: 0 },
  { id: "maths", name: "Engineering Maths",    professor: "Prof. D. Verma",  color: "#BA7517", grade: 61, pending: 1 },
  { id: "se",    name: "Software Engineering", professor: "Prof. M. Gupta",  color: "#7F77DD", grade: 88, pending: 1 },
  { id: "hci",   name: "HCI & Design",         professor: "Prof. N. Singh",  color: "#D4537E", grade: 90, pending: 1 }
];

const ASSIGNMENTS = [
  { id: 1, title: "OS Lab Assignment 3",  subject: "os",    due: "Today 11:59 PM",  status: "pending",   score: null },
  { id: 2, title: "DBMS Quiz 2",          subject: "dbms",  due: "Tomorrow 9 AM",   status: "pending",   score: null },
  { id: 3, title: "HCI Project Proposal", subject: "hci",   due: "19 Mar 11:59 PM", status: "pending",   score: null },
  { id: 4, title: "SE Report",            subject: "se",    due: "20 Mar",          status: "pending",   score: null },
  { id: 5, title: "CN Lab Report 2",      subject: "cn",    due: "Submitted",       status: "submitted", score: null },
  { id: 6, title: "CN Mid-term",          subject: "cn",    due: "Graded",          status: "graded",    score: 82   },
  { id: 7, title: "Maths Assignment 4",   subject: "maths", due: "Graded",          status: "graded",    score: 61   }
];

const STUDENTS = [
  { id: 1, name: "Priya Sharma", initials: "PS", color: "#dff0e6", tcolor: "#1a6b40", submitted: true  },
  { id: 2, name: "Rahul Sharma", initials: "RS", color: "#dceeff", tcolor: "#1a5a9a", submitted: true  },
  { id: 3, name: "Anjali Patel", initials: "AP", color: "#fef3dc", tcolor: "#7a4800", submitted: true  },
  { id: 4, name: "Mohit Kumar",  initials: "MK", color: "#fceaea", tcolor: "#9b2020", submitted: false },
  { id: 5, name: "Sneha Verma",  initials: "SV", color: "#ede9fe", tcolor: "#5b3fc2", submitted: true  }
];

const NOTIFICATIONS = [
  { type: "danger",  icon: "🚨", title: "OS Lab 3 due in 6 hours",      body: "Not submitted yet",          time: "Today, 6:02 PM"     },
  { type: "warning", icon: "📝", title: "DBMS Quiz 2 posted",            body: "Due tomorrow at 9 AM",       time: "Today, 2:15 PM"     },
  { type: "success", icon: "🎯", title: "CN Mid-term graded — 82/100",   body: "Prof. Sharma left feedback", time: "Yesterday, 4:30 PM" }
];

// Announcements array — starts empty, teacher fills live
const ANNOUNCEMENTS = [];

// Stream posts — pre-seeded like real Google Classroom
const STREAM_POSTS = [
  {
    id: 1, subject: 'hci', type: 'announcement',
    author: 'Prof. N. Singh', initials: 'NS', color: '#D4537E',
    title: 'Task 4 and Task 5 Demo/Evaluation',
    body: 'All students are requested to attend the Task 4 evaluation during today\'s tutorial class. Task 5 Demo/evaluation will be done on 19-03-2026 in the Tutorial class.',
    time: 'Mar 12', comments: [
      { author: 'Priya Sharma', initials: 'PS', text: 'Thank you for the update!', time: 'Mar 12' },
      { author: 'Rahul Kumar',  initials: 'RK', text: '+1', time: 'Mar 12' }
    ]
  },
  {
    id: 2, subject: 'dbms', type: 'material',
    author: 'Prof. S. Mehta', initials: 'SM', color: '#378ADD',
    title: 'W8-9: B+ Trees and Hashing',
    body: 'New study material posted for Week 8-9 covering B+ Trees and Hashing algorithms. Please review before next lecture.',
    time: 'Mar 16', comments: []
  },
  {
    id: 3, subject: 'os', type: 'assignment',
    author: 'Prof. R. Kumar', initials: 'RK', color: '#E24B4A',
    title: 'OS Lab Assignment 3 — Due Today',
    body: 'Reminder: OS Lab Assignment 3 is due today at 11:59 PM. Submit your solution file via the Assignments tab.',
    time: 'Mar 17', comments: [
      { author: 'Sneha Verma', initials: 'SV', text: 'Submitted!', time: 'Mar 17' }
    ]
  },
  {
    id: 4, subject: 'cn', type: 'material',
    author: 'Prof. A. Sharma', initials: 'AS', color: '#1D9E75',
    title: 'CN Mid-term Results Published',
    body: 'Mid-term results have been published. Class average was 78%. Check your individual score in the Grades section.',
    time: 'Mar 15', comments: []
  },
  {
    id: 5, subject: 'se', type: 'announcement',
    author: 'Prof. M. Gupta', initials: 'MG', color: '#7F77DD',
    title: 'SE Report deadline extended',
    body: 'The Software Engineering Report deadline has been extended to 20th March. Make sure your report covers all UML diagrams.',
    time: 'Mar 14', comments: [
      { author: 'Priya Sharma', initials: 'PS', text: 'Thank you sir!', time: 'Mar 14' }
    ]
  }
];

// Tracks which students have been graded in this session
const GRADED_IDS = new Set();

// Current logged in user — set on login
let currentUser = null;
