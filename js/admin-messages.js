async function loadMessages() {
  const panel = document.getElementById('messagesPanel');

  const { data: messages, error } = await supabaseClient
    .from('support_messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    panel.innerHTML = `<p class="empty-note">Error loading: ${error.message}</p>`;
    return;
  }

  if (!messages || messages.length === 0) {
    panel.innerHTML = `<p class="empty-note">No messages yet.</p>`;
    return;
  }

  panel.innerHTML = '';

  messages.forEach(msg => {
    const card = document.createElement('div');
    card.className = 'registration-card';
    card.innerHTML = `
      <div class="info-row"><span class="info-label">From</span><span class="info-value">${msg.name}</span></div>
      <div class="info-row"><span class="info-label">Email</span><span class="info-value">${msg.email}</span></div>
      <div class="info-row"><span class="info-label">Message</span><span class="info-value">${msg.message}</span></div>
      <div class="info-row"><span class="info-label">Status</span><span class="info-value">${msg.status}</span></div>
      <div class="admin-actions">
        ${msg.status === 'new' ? `<button class="btn btn-approve btn-small" data-id="${msg.id}">✅ Mark as Replied</button>` : ''}
        <a href="mailto:${msg.email}" class="btn btn-secondary btn-small">✉️ Reply by Email</a>
      </div>
    `;
    panel.appendChild(card);
  });

  panel.querySelectorAll('button[data-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const { error } = await supabaseClient
        .from('support_messages')
        .update({ status: 'replied' })
        .eq('id', btn.dataset.id);
      if (error) alert('Error: ' + error.message);
      else loadMessages();
    });
  });
}

(async () => {
  const user = await checkAdmin();
  if (!user) return;
  loadMessages();
  updateNotificationCounts();
})();