async function loadParentDashboard() {
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    window.location.href = "login.html";
    return;
  }

  // Get parent record
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

  // Status banner
  const banner = document.getElementById('statusBanner');
  if (parent.verification_status === 'pending') {
    banner.textContent = "Your registration is under review. We'll notify you once approved.";
    banner.className = "status-banner status-pending";
  } else if (parent.verification_status === 'approved') {
    banner.textContent = "Your registration is approved!";
    banner.className = "status-banner status-approved";
  } else if (parent.verification_status === 'rejected') {
    banner.textContent = "Your registration was not approved. Please contact us to resolve this.";
    banner.className = "status-banner status-rejected";
  }

  // Payment status
  document.getElementById('paymentStatus').textContent = parent.payment_status === 'paid' ? 'Paid' : 'Not Paid';
  if (parent.payment_status === 'paid') {
    document.getElementById('payNowBtn').style.display = 'none';
  }

  // Get child record linked to this parent
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
}

loadParentDashboard();

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
});