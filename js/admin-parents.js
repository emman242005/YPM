async function getSignedUrl(bucket, path) {
  if (!path) return null;
  const { data, error } = await supabaseClient.storage.from(bucket).createSignedUrl(path, 3600);
  if (error) { console.error(error); return null; }
  return data.signedUrl;
}

async function loadParents() {
  const panel = document.getElementById('parentsPanel');
  const { data: parents, error } = await supabaseClient
    .from('parents')
    .select('*, children(*)')
    .order('created_at', { ascending: false });

  if (error) {
    panel.innerHTML = `<p class="empty-note">Error loading: ${error.message}</p>`;
    return;
  }
  if (!parents || parents.length === 0) {
    panel.innerHTML = `<p class="empty-note">No parent registrations yet.</p>`;
    return;
  }

  panel.innerHTML = '';

  for (const parent of parents) {
    const child = parent.children && parent.children[0];
    const idCardUrl = await getSignedUrl('child-documents', parent.id_card_url);
    const birthCertUrl = child ? await getSignedUrl('child-documents', child.birth_certificate_url) : null;

    const card = document.createElement('div');
    card.className = 'registration-card';
    card.innerHTML = `
      <div class="info-row"><span class="info-label">Parent Name</span><span class="info-value">${parent.full_name}</span></div>
      <div class="info-row"><span class="info-label">Phone</span><span class="info-value">${parent.phone}</span></div>
      <div class="info-row"><span class="info-label">Email</span><span class="info-value">${parent.email || '—'}</span></div>
      <div class="info-row"><span class="info-label">Child</span><span class="info-value">${child ? child.full_name + ' (age ' + child.age + ')' : '—'}</span></div>
      <div class="info-row"><span class="info-label">School</span><span class="info-value">${child ? child.school : '—'}</span></div>
      <div class="info-row"><span class="info-label">Program</span><span class="info-value">${child ? child.program : '—'}</span></div>
      <div class="info-row"><span class="info-label">Status</span><span class="info-value">${parent.verification_status}</span></div>
      <div class="doc-links">
        ${idCardUrl ? `<a href="${idCardUrl}" target="_blank">View Parent ID Card</a>` : '<span class="empty-note">No ID card</span>'}
        ${birthCertUrl ? `<a href="${birthCertUrl}" target="_blank">View Birth Certificate</a>` : '<span class="empty-note">No birth certificate</span>'}
      </div>
      <div class="admin-actions">
        <button class="btn btn-approve btn-small" data-id="${parent.id}" data-action="approved">Approve</button>
        <button class="btn btn-reject btn-small" data-id="${parent.id}" data-action="rejected">Reject</button>
      </div>
    `;
    panel.appendChild(card);
  }

  panel.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const { error } = await supabaseClient
        .from('parents')
        .update({ verification_status: btn.dataset.action })
        .eq('id', btn.dataset.id);
      if (error) alert('Error: ' + error.message);
      else { loadParents(); updateNotificationCounts(); }
    });
  });
}

(async () => {
  const user = await checkAdmin();
  if (!user) return;
  loadParents();
  updateNotificationCounts();
})();