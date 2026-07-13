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

let revenueChartInstance = null;
let paidChartInstance = null;

async function loadPayments(range) {
  const startDate = getStartDate(range);

  let parentsQuery = supabaseClient.from('parents').select('*');
  let teachersQuery = supabaseClient.from('teachers').select('*');

  if (startDate) {
    parentsQuery = parentsQuery.gte('created_at', startDate);
    teachersQuery = teachersQuery.gte('created_at', startDate);
  }

  const { data: parents } = await parentsQuery;
  const { data: teachers } = await teachersQuery;

  const paidParents = parents ? parents.filter(p => p.payment_status === 'paid').length : 0;
  const paidTeachers = teachers ? teachers.filter(t => t.payment_status === 'paid').length : 0;
  const totalRecords = (parents ? parents.length : 0) + (teachers ? teachers.length : 0);
  const unpaidTotal = totalRecords - (paidParents + paidTeachers);
  const revenue = (paidParents + paidTeachers) * 1000;

  document.getElementById('statPaidParents').textContent = paidParents;
  document.getElementById('statPaidTeachers').textContent = paidTeachers;
  document.getElementById('statUnpaid').textContent = unpaidTotal;
  document.getElementById('statRevenue').textContent = revenue.toLocaleString() + ' XAF';

  // Revenue over time
  const paidRecords = [...(parents || []), ...(teachers || [])].filter(r => r.payment_status === 'paid');
  const dateRevenue = {};
  paidRecords.forEach(r => {
    const day = new Date(r.created_at).toLocaleDateString();
    dateRevenue[day] = (dateRevenue[day] || 0) + 1000;
  });
  const sortedDates = Object.keys(dateRevenue).sort((a, b) => new Date(a) - new Date(b));

  const revenueCtx = document.getElementById('revenueChart').getContext('2d');
  if (revenueChartInstance) revenueChartInstance.destroy();
  revenueChartInstance = new Chart(revenueCtx, {
    type: 'bar',
    data: {
      labels: sortedDates.length ? sortedDates : ['No data'],
      datasets: [{
        label: 'Revenue (XAF)',
        data: sortedDates.length ? sortedDates.map(d => dateRevenue[d]) : [0],
        backgroundColor: '#C9A24C'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });

  const paidCtx = document.getElementById('paidChart').getContext('2d');
  if (paidChartInstance) paidChartInstance.destroy();
  paidChartInstance = new Chart(paidCtx, {
    type: 'doughnut',
    data: {
      labels: ['Paid', 'Unpaid'],
      datasets: [{
        data: [paidParents + paidTeachers, unpaidTotal],
        backgroundColor: ['#1F5C4E', '#C1553A']
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
    loadPayments(btn.dataset.range);
  });
});

(async () => {
  const user = await checkAdmin();
  if (!user) return;
  loadPayments('today');
  updateNotificationCounts();
})();