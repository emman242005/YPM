async function loadTeacherDashboard() {
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    window.location.href = "login.html";
    return;
  }

  const { data: teacher, error: teacherError } = await supabaseClient
    .from('teachers')
    .select('*')
    .eq('id', user.id)
    .single();

  if (teacherError || !teacher) {
    console.error(teacherError);
    return;
  }

  document.getElementById('welcomeHeading').textContent = `Welcome, ${teacher.full_name}`;

  const banner = document.getElementById('statusBanner');
  if (teacher.verification_status === 'pending') {
    banner.textContent = "Your registration is under review. We'll notify you once approved.";
    banner.className = "status-banner status-pending";
  } else if (teacher.verification_status === 'approved') {
    banner.textContent = "Your registration is approved!";
    banner.className = "status-banner status-approved";
  } else if (teacher.verification_status === 'rejected') {
    banner.textContent = teacher.rejection_reason
      ? `Your registration was not approved: ${teacher.rejection_reason}`
      : "Your registration was not approved. Please contact us to resolve this.";
    banner.className = "status-banner status-rejected";
  }

  document.getElementById('teacherSchool').textContent = teacher.school;
  document.getElementById('teacherGrade').textContent = teacher.grade_level || '—';

  document.getElementById('paymentStatus').textContent = teacher.payment_status === 'paid' ? 'Paid' : 'Not Paid';
  if (teacher.payment_status === 'paid') {
    document.getElementById('payNowBtn').style.display = 'none';
  }

  const { data: announcements } = await supabaseClient
    .from('announcements')
    .select('*')
    .in('audience', ['teachers', 'both'])
    .order('created_at', { ascending: false })
    .limit(5);

  const feed = document.getElementById('announcementsFeed');
  if (announcements && announcements.length > 0) {
    feed.innerHTML = announcements.map(a => `
      <div class="announcement-card">
        <h4>${a.title}</h4>
        <div class="announcement-meta">${new Date(a.created_at).toLocaleDateString()}</div>
        <p>${a.content}</p>
      </div>
    `).join('');
  } else {
    feed.innerHTML = '<p class="placeholder-note">No announcements right now — check back later.</p>';
  }
}

loadTeacherDashboard();

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
});