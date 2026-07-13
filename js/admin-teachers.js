async function getSignedUrl(bucket, path) {
  if (!path) return null;
  const { data, error } = await supabaseClient.storage.from(bucket).createSignedUrl(path, 3600);
  if (error) { console.error(error); return null; }
  return data.signedUrl;
}

async function loadTeachers() {
  const panel = document.getElementById('teachersPanel');
  const { data: teachers, error } = await supabaseClient
    .from('teachers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    panel.innerHTML = `<p class="empty-note">Error loading: ${error.message}</p>`;
    return;
  }
  if (!teachers || teachers.length === 0) {
    panel.innerHTML = `<p class="empty-note">No teacher registrations yet.</p>`;
    return;
  }

  panel.innerHTML = '';

  for (const teacher of teachers) {
    const proofUrl = await getSignedUrl('teacher-documents', teacher.proof_of_teaching_url);
    const cvUrl = await getSignedUrl('teacher-documents', teacher.cv_url);

    const card = document.createElement('div');
    card.className = 'registration-card';
    card.innerHTML = `
      <div class="info-row"><span class="info-label">Name</span><span class="info-value">${teacher.full_name}</span></div>
      <div class="info-row"><span class="info-label">Phone</span><span class="info-value">${teacher.phone}</span></div>
      <div class="info-row"><span class="info-label">Email</span><span class="info-value">${teacher.email || '—'}</span></div>
      <div class="info-row"><span class="info-label">School</span><span class="info-value">${teacher.school}</span></div>
      <div class="info-row"><span class="info-label">Grade/Subject</span><span class="info-value">${teacher.grade_level || '—'}</span></div>
      <div class="info-row"><span class="info-label">Status</span><span class="info-value">${teacher.verification_status}</span></div>
      <div class="doc-links">
        ${proofUrl ? `<a href="${proofUrl}" target="_blank">View Proof of Teaching</a>` : '<span class="empty-note">No proof uploaded</span>'}
        ${cvUrl ? `<a href="${cvUrl}" target="_blank">View CV</a>` : '<span class="empty-note">No CV uploaded</span>'}
      </div>
      <div class="admin-actions">
        <button class="btn btn-approve btn-small" data-id="${teacher.id}" data-action="approved">Approve</button>
        <button class="btn btn-reject btn-small" data-id="${teacher.id}" data-action="rejected">Reject</button>
      </div>
    `;
    panel.appendChild(card);
  }

  panel.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const { error } = await supabaseClient
        .from('teachers')
        .update({ verification_status: btn.dataset.action })
        .eq('id', btn.dataset.id);
      if (error) alert('Error: ' + error.message);
      else { loadTeachers(); updateNotificationCounts(); }
    });
  });
}

(async () => {
  const user = await checkAdmin();
  if (!user) return;
  loadTeachers();
  updateNotificationCounts();
})();