const albumLabels = {
  'peace-clubs': 'Peace Clubs',
  'summer-camps': 'Summer Camps',
  'teacher-training': 'Teacher Training',
  'community-events': 'Community Events'
};

async function loadAlbums() {
  const albumGrid = document.getElementById('albumGrid');

  const { data: folders, error } = await supabaseClient.storage
    .from('gallery')
    .list('', { sortBy: { column: 'name', order: 'asc' } });

  if (error || !folders) {
    albumGrid.innerHTML = '<p class="empty-note">Could not load albums.</p>';
    return;
  }

  // Folders show up as entries with id === null
  const albumFolders = folders.filter(f => f.id === null);

  if (albumFolders.length === 0) {
    albumGrid.innerHTML = '<p class="empty-note">No albums yet — check back soon.</p>';
    return;
  }

  albumGrid.innerHTML = '';

  for (const folder of albumFolders) {
    const { data: photos } = await supabaseClient.storage
      .from('gallery')
      .list(folder.name, { limit: 1 });

    let thumbUrl = '';
    if (photos && photos.length > 0) {
      const { data } = supabaseClient.storage.from('gallery').getPublicUrl(`${folder.name}/${photos[0].name}`);
      thumbUrl = data.publicUrl;
    }

    const card = document.createElement('div');
    card.className = 'album-card';
    card.innerHTML = `
      ${thumbUrl ? `<img src="${thumbUrl}" class="album-card-thumb" alt="${folder.name}">` : `<div class="album-card-thumb"></div>`}
      <div class="album-card-info">
        <h3>${albumLabels[folder.name] || folder.name}</h3>
        <p>Tap to view photos</p>
      </div>
    `;
    card.addEventListener('click', () => openAlbum(folder.name));
    albumGrid.appendChild(card);
  }
}

async function openAlbum(folderName) {
  document.getElementById('albumView').style.display = 'none';
  document.getElementById('photoView').style.display = 'block';
  document.getElementById('currentAlbumTitle').textContent = albumLabels[folderName] || folderName;

  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = '<p class="empty-note">Loading photos...</p>';

  const { data: files, error } = await supabaseClient.storage
    .from('gallery')
    .list(folderName, { sortBy: { column: 'created_at', order: 'desc' } });

  if (error || !files || files.length === 0) {
    grid.innerHTML = '<p class="empty-note">No photos in this album yet.</p>';
    return;
  }

  grid.innerHTML = '';

  files.forEach((file, index) => {
    const { data } = supabaseClient.storage.from('gallery').getPublicUrl(`${folderName}/${file.name}`);
    const item = document.createElement('div');
    item.className = 'gallery-item' + (index % 5 === 0 ? ' gallery-tall' : '');
    item.innerHTML = `<img src="${data.publicUrl}" alt="Cameroon Young Peacemakers gallery photo" style="width:100%; height:100%; object-fit:cover; border-radius: var(--radius-md);">`;
    grid.appendChild(item);
  });
}

document.getElementById('backToAlbumsBtn').addEventListener('click', () => {
  document.getElementById('photoView').style.display = 'none';
  document.getElementById('albumView').style.display = 'block';
});

loadAlbums();
