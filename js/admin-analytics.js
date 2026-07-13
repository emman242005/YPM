function getStartDate(range) {
  const now = new Date();
  if (range === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  if (range === 'week') {
    const diff = now.getDate() - now.getDay();
    return new Date(now.getFullYear(), now.getMonth(), diff).toISOString();
  }
  if (range === 'month') return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  if (range === 'year') return new Date(now.getFullYear(), 0, 1).toISOString();
  return null;
}

let signupsChartInstance = null;
let statusChartInstance = null;

async function loadAnalytics(range) {
  const startDate = getStartDate(range);

  let parentsQuery = supabaseClient.from('parents').select('*');
  let childrenQuery = supabaseClient.from('children').select('*');
  let teachersQuery = supabaseClient.from('teachers').select('*');

  if (startDate) {
    parentsQuery = parentsQuery.gte('created_at', startDate);
    childrenQuery = childrenQuery.gte('created_at', startDate);
    teachersQuery = teachersQuery.gte('created_at', startDate);
  }

  const { data: parents } = await parentsQuery;
  const { data: children } = await childrenQuery;
  const { data: teachers } = await teachersQuery;

  const parentCount = parents ? parents.length : 0;
  const childCount = children ? children.length : 0;
  const teacherCount = teachers ? teachers.length : 0;

  document.getElementById('statParents').textContent = parentCount;
  document.getElementById('statChildren').textContent = childCount;
  document.getElementById('statTeachers').textContent = teacherCount;
  document.getElementById('statTotal').textContent = parentCount + teacherCount;

  const allRecords = [...(parents || []), ...(teachers || [])];
  const pending = allRecords.filter(r => r.verification_status === 'pending').length;
  const approved = allRecords.filter(r => r.verification_status === 'approved').length;
  const rejected = allRecords.filter(r => r.verification_status === 'rejected').length;

  // Sign-ups over time (group by day, last 14 entries worth of days present in data)
  const dateCounts = {};
  [...(parents || []), ...(teachers || [])].forEach(r => {
    const day = new Date(r.created_at).toLocaleDateString();
    dateCounts[day] = (dateCounts[day] || 0) + 1;
  });
  const sortedDates = Object.keys(dateCounts).sort((a, b) => new Date(a) - new Date(b));

  const signupsCtx = document.getElementById('signupsChart').getContext('2d');
  if (signupsChartInstance) signupsChartInstance.destroy();
  signupsChartInstance = new Chart(signupsCtx, {
    type: 'line',
    data: {
      labels: sortedDates.length ? sortedDates : ['No data'],
      datasets: [{
        label: 'Sign-ups',
        data: sortedDates.length ? sortedDates.map(d => dateCounts[d]) : [0],
        borderColor: '#1B3A6B',
        backgroundColor: 'rgba(27, 58, 107, 0.1)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });

  const statusCtx = document.getElementById('statusChart').getContext('2d');
  if (statusChartInstance) statusChartInstance.destroy();
  statusChartInstance = new Chart(statusCtx, {
    type: 'doughnut',
    data: {
      labels: ['Pending', 'Approved', 'Rejected'],
      datasets: [{
        data: [pending, approved, rejected],
        backgroundColor: ['#C9A24C', '#1F5C4E', '#C1553A']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

document.querySelectorAll('.range-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadAnalytics(btn.dataset.range);
  });
});

(async () => {
  const user = await checkAdmin();
  if (!user) return;
  loadAnalytics('today');
  updateNotificationCounts();
})();