async function loadParentDashboard() {
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    window.location.href = "login.html";
    return;
  }

  const { data: parent, error: parentError } = await supabaseClient
    .from('parents')
    .select('*')
    .eq('id', user.id)
    .single();

  if (parentError || !parent) {
    console.error(parentError);
    return;
  }

  document.getElementById('welcomeHeading').textContent = `Welcome, ${parent.full_name}`;

  const banner = document.getElementById('statusBanner');
  if (parent.verification_status === 'pending') {
    banner.textContent = "Your registration is under review. We'll notify you once approved.";
    banner.className = "status-banner status-pending";
  } else if (parent.verification_status === 'approved') {
    banner.textContent = "Your registration is approved!";
    banner.className = "status-banner status-approved";
  } else if (parent.verification_status === 'rejected') {
    banner.textContent = parent.rejection_reason
      ? `Your registration was not approved: ${parent.rejection_reason}`
      : "Your registration was not approved. Please contact us to resolve this.";
    banner.className = "status-banner status-rejected";
  }

  document.getElementById('paymentStatus').textContent = parent.payment_status === 'paid' ? 'Paid' : 'Not Paid';
  if (parent.payment_status === 'paid') {
    document.getElementById('payNowBtn').style.display = 'none';
  }

  const { data: child, error: childError } = await supabaseClient
    .from('children')
    .select('*')
    .eq('parent_id', user.id)
    .single();

  if (child && !childError) {
    document.getElementById('childName').textContent = child.full_name;
    document.getElementById('childAge').textContent = child.age;
    document.getElementById('childSchool').textContent = child.school;
    document.getElementById('childProgram').textContent = child.program;
  }

  const { data: announcements } = await supabaseClient
    .from('announcements')
    .select('*')
    .in('audience', ['parents', 'both'])
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

loadParentDashboard();

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
});