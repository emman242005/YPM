// Notification dropdown toggle
const notifToggle = document.getElementById('notifToggle');
const notifDropdown = document.getElementById('notifDropdown');

if (notifToggle) {
  notifToggle.addEventListener('click', () => {
    notifDropdown.classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    if (!notifToggle.contains(e.target) && !notifDropdown.contains(e.target)) {
      notifDropdown.classList.remove('open');
    }
  });
}

async function updateNotificationCounts() {
  const { count: pendingParents } = await supabaseClient
    .from('parents')
    .select('*', { count: 'exact', head: true })
    .eq('verification_status', 'pending');

  const { count: pendingTeachers } = await supabaseClient
    .from('teachers')
    .select('*', { count: 'exact', head: true })
    .eq('verification_status', 'pending');

  const total = (pendingParents || 0) + (pendingTeachers || 0);

  const badge = document.getElementById('notifBadge');
  badge.textContent = total;
  badge.classList.toggle('zero', total === 0);

  document.getElementById('countParents').textContent = pendingParents || 0;
  document.getElementById('countTeachers').textContent = pendingTeachers || 0;
}

let currentAdminName = "Support Team";

async function checkAdmin() {
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    window.location.href = "login.html";
    return null;
  }
  const { data: admin, error: adminError } = await supabaseClient
    .from('admins')
    .select('id, full_name')
    .eq('id', user.id)
    .single();
  if (adminError || !admin) {
    alert("You do not have admin access.");
    window.location.href = "login.html";
    return null;
  }
  currentAdminName = admin.full_name || "Support Team";
  return user;
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "login.html";
  });
}