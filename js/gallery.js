async function loadGalleryPhotos() {
  const grid = document.getElementById('galleryGrid');

  const { data: files, error } = await supabaseClient.storage
    .from('gallery')
    .list('', { sortBy: { column: 'created_at', order: 'desc' } });

  if (error || !files || files.length === 0) {
    grid.innerHTML = '<p class="empty-note">No photos uploaded yet — check back soon.</p>';
    return;
  }

  grid.innerHTML = '';

  files.forEach((file, index) => {
    const { data } = supabaseClient.storage.from('gallery').getPublicUrl(file.name);
    const item = document.createElement('div');
    item.className = 'gallery-item' + (index % 5 === 0 ? ' gallery-tall' : '');
    item.innerHTML = `<img src="${data.publicUrl}" alt="Young Peacemakers gallery photo" style="width:100%; height:100%; object-fit:cover; border-radius: var(--radius-md);">`;
    grid.appendChild(item);
  });
}

loadGalleryPhotos();