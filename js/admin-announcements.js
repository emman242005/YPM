async function loadAnnouncements() {
  const list = document.getElementById('announcementsList');

  const { data: announcements, error } = await supabaseClient
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    list.innerHTML = `<p class="empty-note">Error: ${error.message}</p>`;
    return;
  }

  if (!announcements || announcements.length === 0) {
    list.innerHTML = `<p class="empty-note">No announcements posted yet.</p>`;
    return;
  }

  const audienceLabels = { parents: 'Parents', teachers: 'Teachers', both: 'Everyone' };

  list.innerHTML = '';
  announcements.forEach(a => {
    const card = document.createElement('div');
    card.className = 'announcement-card';
    const date = new Date(a.created_at).toLocaleDateString();
    card.innerHTML = `
      <h4>${a.title}<span class="announcement-audience-tag">${audienceLabels[a.audience]}</span></h4>
      <div class="announcement-meta">Posted ${date}</div>
      <p>${a.content}</p>
      <button class="announcement-delete-btn" data-id="${a.id}">🗑️ Delete</button>
    `;
    list.appendChild(card);
  });

  list.querySelectorAll('.announcement-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this announcement?')) return;
      const { error } = await supabaseClient
        .from('announcements')
        .delete()
        .eq('id', btn.dataset.id);
      if (error) alert('Error: ' + error.message);
      else loadAnnouncements();
    });
  });
}

const announcementForm = document.getElementById('announcementForm');
if (announcementForm) {
  announcementForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const note = document.getElementById('announcementNote');
    note.textContent = "Posting...";

    const title = document.getElementById('annTitle').value;
    const content = document.getElementById('annContent').value;
    const audience = document.getElementById('annAudience').value;

    const { error } = await supabaseClient
      .from('announcements')
      .insert({ title, content, audience });

    if (error) {
      note.textContent = "Error: " + error.message;
    } else {
      note.textContent = "Posted!";
      announcementForm.reset();
      loadAnnouncements();
      setTimeout(() => { note.textContent = ""; }, 2000);
    }
  });
}

(async () => {
  const user = await checkAdmin();
  if (!user) return;
  loadAnnouncements();
  updateNotificationCounts();
})();