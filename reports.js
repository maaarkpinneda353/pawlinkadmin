(() => {
  'use strict';

  const STORAGE_KEY = 'communityReports';
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
  const CATEGORY_LABELS = { lost: 'Lost pet', found: 'Found pet', reunion: 'Reunion', community: 'Community' };
  const SEED_POSTS = [
    { id: 'pawlink-report-milo', category: 'lost', caption: 'Milo went missing near Riverside Park this afternoon. He is a friendly orange tabby wearing a blue collar. Please check garages and porches nearby—his family is waiting for him. 💙', image: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=1200&q=85', author: 'Jamie Rivera', location: 'Riverside Park', createdAt: '2025-03-08T15:40:00.000Z', status: 'Active', reunited: false, reactions: 18, comments: [{ id: 'milo-comment-1', author: 'Taylor M.', text: 'I’ll keep an eye out on my evening walk!', createdAt: '2025-03-08T16:00:00.000Z' }, { id: 'milo-comment-2', author: 'PawLink Team', text: 'We’ve shared this with nearby neighbors. Hope Milo is home soon.', createdAt: '2025-03-08T16:15:00.000Z' }] },
    { id: 'pawlink-report-beagle', category: 'found', caption: 'Found this sweet beagle wandering by Oak Street Library. Safe with me for now. If you recognize this pup, please contact the PawLink team so we can help them get home.', image: 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?auto=format&fit=crop&w=1200&q=85', author: 'Morgan Lee', location: 'Oak Street', createdAt: '2025-03-08T14:10:00.000Z', status: 'Active', reunited: false, reactions: 12, comments: [{ id: 'beagle-comment-1', author: 'Alex P.', text: 'Shared with the neighborhood group. Thank you for keeping them safe.', createdAt: '2025-03-08T14:32:00.000Z' }] },
    { id: 'pawlink-report-luna', category: 'reunion', caption: 'Wonderful news: Luna is back home! A neighbor spotted her post and helped reunite her with her family. Thank you to everyone who shared and searched. 🐾', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1200&q=85', author: 'PawLink Community', location: 'Maplewood', createdAt: '2025-03-07T18:25:00.000Z', status: 'Reunited', reunited: true, reactions: 42, comments: [{ id: 'luna-comment-1', author: 'Luna’s family', text: 'We are so grateful to this amazing community!', createdAt: '2025-03-07T18:50:00.000Z' }] },
    { id: 'pawlink-report-clinic', category: 'community', caption: 'A reminder that our neighborhood pet wellness clinic is open this Saturday from 10 AM–2 PM at the Community Center. Low-cost vaccinations and microchip checks are available.', image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=1200&q=85', author: 'PawLink Team', location: 'Community Center', createdAt: '2025-03-07T12:00:00.000Z', status: 'Community update', reunited: false, reactions: 27, comments: [{ id: 'clinic-comment-1', author: 'Sam W.', text: 'Thanks for organizing this! I’ll bring my two dogs.', createdAt: '2025-03-07T12:40:00.000Z' }] }
  ];

  // app.js renders the shared shell first on DOMContentLoaded. Initialize this
  // page afterwards, otherwise shell rendering can replace the controls.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initReports, { once: true });
  else if (document.readyState === 'complete') initReports();
  else document.addEventListener('DOMContentLoaded', initReports, { once: true });

  function initReports() {
    const page = document.querySelector('[data-reports-page]');
    if (!page || page.dataset.reportsInitialized === 'true') return;
    const list = page.querySelector('[data-report-list]');
    const search = page.querySelector('[data-report-search]');
    const filters = page.querySelector('[data-report-filters]');
    const dialog = page.querySelector('[data-post-dialog]');
    const form = page.querySelector('[data-post-form]');
    const dropZone = page.querySelector('[data-image-drop-zone]');
    const fileInput = page.querySelector('[data-image-file]');
    const preview = page.querySelector('[data-image-preview]');
    const feedback = page.querySelector('[data-upload-feedback]');
    if (!list || !search || !filters || !dialog || !form || !dropZone || !fileInput || !preview) {
      console.error('Community Reports page is missing required controls.');
      return;
    }
    page.dataset.reportsInitialized = 'true';

    const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    function safeImageURL(value) {
      if (!value) return '';
      try { const url = new URL(value, location.href); return ['http:', 'https:', 'data:'].includes(url.protocol) ? url.href : ''; }
      catch { return ''; }
    }
    function readPosts() {
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        if (Array.isArray(stored)) return stored.filter((post) => post && typeof post === 'object');
      } catch (error) { console.warn('Invalid saved community reports; restoring examples.', error); }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_POSTS));
      return SEED_POSTS.slice();
    }
    function savePosts(next) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); return true; }
      catch (error) {
        console.error('Unable to persist community reports in localStorage.', error);
        if (feedback) { feedback.textContent = 'Could not save. Storage may be full; remove a large uploaded image and try again.'; feedback.classList.add('is-error'); }
        return false;
      }
    }
    function dateLabel(value) {
      const date = new Date(value);
      return Number.isNaN(date.valueOf()) ? 'Recently' : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
    }
    if (localStorage.getItem(STORAGE_KEY) === null) savePosts(SEED_POSTS);

    let selectedCategory = 'all';
    let uploadedImage = '';
    function uploadMessage(message, isError = false) {
      if (!feedback) return;
      feedback.textContent = message;
      feedback.classList.toggle('is-error', isError);
    }
    function showPreview(src) {
      preview.src = src || '';
      preview.hidden = !src;
      dropZone.classList.toggle('has-image', Boolean(src));
      const removeButton = page.querySelector('[data-remove-image]');
      if (removeButton) removeButton.hidden = !src;
    }
    function clearUpload() {
      uploadedImage = '';
      fileInput.value = '';
      showPreview('');
      uploadMessage('');
    }
    function processImage(file) {
      if (!file) return;
      if (!file.type.startsWith('image/')) { uploadMessage('Please choose an image file.', true); return; }
      if (file.size > MAX_IMAGE_BYTES) { uploadMessage('Image must be 5 MB or smaller.', true); return; }
      const reader = new FileReader();
      reader.onerror = () => uploadMessage('Could not read that image. Please try another.', true);
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => uploadMessage('That image could not be opened. Please choose another.', true);
        image.onload = () => {
          const scale = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          const context = canvas.getContext('2d');
          if (!context) { uploadMessage('Image preview is unavailable in this browser.', true); return; }
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          uploadedImage = canvas.toDataURL('image/jpeg', 0.72);
          showPreview(uploadedImage);
          uploadMessage('Image is ready and will be saved with this post.');
        };
        image.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    }

    function render() {
      const query = search.value.trim().toLocaleLowerCase();
      const allPosts = readPosts();
      const visible = allPosts.filter((post) => {
        const category = String(post.category || '').toLocaleLowerCase();
        const matchesCategory = selectedCategory === 'all' || category === selectedCategory;
        const searchable = `${post.caption || ''} ${post.location || ''} ${post.author || ''} ${category}`.toLocaleLowerCase();
        return matchesCategory && searchable.includes(query);
      }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      const count = page.querySelector('[data-report-count]');
      if (count) count.textContent = `${visible.length} ${visible.length === 1 ? 'post' : 'posts'}`;
      if (!visible.length) {
        list.innerHTML = '<div class="report-empty"><span aria-hidden="true">🐾</span><h2>No updates found</h2><p>Try a different search or category filter.</p></div>';
        return;
      }
      list.innerHTML = visible.map((post) => {
        const comments = Array.isArray(post.comments) ? post.comments : [];
        const author = post.author || 'PawLink Admin';
        const postId = escapeHTML(post.id);
        const category = String(post.category || 'community').toLocaleLowerCase();
        const reunited = Boolean(post.reunited || post.status === 'Reunited' || category === 'reunion');
        const image = safeImageURL(post.image);
        const commentRows = comments.map((comment, index) => {
          const commentId = escapeHTML(comment.id ?? `${post.id}-comment-${index}`);
          return `<div class="comment-row"><span class="comment-avatar" aria-hidden="true">${escapeHTML((comment.author || 'N').trim().charAt(0).toUpperCase())}</span><div class="comment-bubble"><strong>${escapeHTML(comment.author || 'Neighbor')}${comment.isAdmin ? ' <span class="admin-comment-tag">ADMIN</span>' : ''}</strong><p>${escapeHTML(comment.text || '')}</p><time>${escapeHTML(dateLabel(comment.createdAt))}</time></div><button class="comment-delete" type="button" data-delete-comment="${postId}" data-comment-id="${commentId}" aria-label="Delete comment">×</button></div>`;
        }).join('');
        return `<article class="feed-card"><header class="feed-card-header"><span class="feed-avatar" aria-hidden="true">${escapeHTML(author.trim().charAt(0).toUpperCase() || 'P')}</span><div class="feed-author"><strong>${escapeHTML(author)}</strong><span>${escapeHTML(post.location || 'PawLink Community')} · ${escapeHTML(dateLabel(post.createdAt))}</span></div><span class="feed-category category-${escapeHTML(category)}">${escapeHTML(CATEGORY_LABELS[category] || 'Community')}</span><div class="feed-admin-actions"><button class="feed-action" type="button" data-edit-post="${postId}">Edit</button><button class="feed-action feed-delete" type="button" data-delete-post="${postId}">Delete</button></div></header>${image ? `<img class="feed-image" src="${escapeHTML(image)}" alt="Community post by ${escapeHTML(author)}" loading="lazy">` : ''}<div class="feed-card-body"><p class="feed-caption">${escapeHTML(post.caption || '')}</p>${reunited ? '<span class="reunited-badge">✓ Reunited</span>' : ''}<div class="feed-reaction-row"><button class="reaction-button" type="button" data-react-post="${postId}" aria-label="Add a reaction">♡ <span>${Number(post.reactions) || 0}</span></button><span class="comment-total">${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}</span>${!reunited && ['lost', 'found'].includes(category) ? `<button class="feed-action mark-reunited" type="button" data-reunite-post="${postId}">Mark reunited</button>` : ''}</div><div class="comment-thread">${commentRows}<form class="comment-form" data-comment-form="${postId}"><input name="comment" aria-label="Add an admin comment" maxlength="240" placeholder="Add an admin comment…" required><button type="submit">Comment</button></form></div></div></article>`;
      }).join('');
    }

    function openEditor(post = null) {
      form.reset();
      uploadedImage = post?.image?.startsWith('data:') ? post.image : '';
      form.elements.id.value = post?.id || '';
      form.elements.category.value = post?.category || 'lost';
      form.elements.caption.value = post?.caption || '';
      form.elements.image.value = post?.image && !post.image.startsWith('data:') ? post.image : '';
      form.elements.reunited.checked = Boolean(post?.reunited || post?.status === 'Reunited');
      showPreview(uploadedImage || safeImageURL(post?.image));
      uploadMessage(uploadedImage ? 'Saved uploaded image. Add a new image to replace it.' : '');
      page.querySelector('#post-dialog-title').textContent = post ? 'Edit community post' : 'Create a post';
      page.querySelector('[data-post-submit]').textContent = post ? 'Save changes' : 'Publish post';
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    }
    function closeDialog() { if (typeof dialog.close === 'function' && dialog.open) dialog.close(); else dialog.removeAttribute('open'); }

    page.querySelector('[data-create-post]').addEventListener('click', () => openEditor());
    page.querySelectorAll('[data-close-post]').forEach((button) => button.addEventListener('click', closeDialog));
    page.querySelector('[data-remove-image]')?.addEventListener('click', (event) => { event.stopPropagation(); uploadedImage = ''; form.elements.image.value = ''; showPreview(''); uploadMessage('Image removed.'); });
    dropZone.addEventListener('click', (event) => { if (!event.target.closest('[data-remove-image]')) fileInput.click(); });
    dropZone.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); fileInput.click(); } });
    fileInput.addEventListener('change', () => processImage(fileInput.files?.[0]));
    ['dragenter', 'dragover'].forEach((type) => dropZone.addEventListener(type, (event) => { event.preventDefault(); dropZone.classList.add('is-dragging'); if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'; }));
    ['dragleave', 'dragend'].forEach((type) => dropZone.addEventListener(type, (event) => { event.preventDefault(); if (!dropZone.contains(event.relatedTarget)) dropZone.classList.remove('is-dragging'); }));
    dropZone.addEventListener('drop', (event) => { event.preventDefault(); dropZone.classList.remove('is-dragging'); processImage(event.dataTransfer?.files?.[0]); });
    dialog.addEventListener('click', (event) => { if (event.target === dialog) closeDialog(); });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const id = String(data.get('id') || '');
      const allPosts = readPosts();
      const old = allPosts.find((post) => String(post.id) === id);
      const reunited = form.elements.reunited.checked;
      const post = { ...(old || {}), id: id || `post-${Date.now()}`, category: reunited ? 'reunion' : String(data.get('category')).toLocaleLowerCase(), caption: String(data.get('caption') || '').trim(), image: uploadedImage || safeImageURL(String(data.get('image') || '').trim()), author: old?.author || 'Admin', location: old?.location || 'PawLink Community', createdAt: old?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(), status: reunited ? 'Reunited' : (old?.status || 'Active'), reunited, reactions: Number(old?.reactions) || 0, comments: Array.isArray(old?.comments) ? old.comments : [] };
      const next = id ? allPosts.map((item) => String(item.id) === id ? post : item) : [post, ...allPosts];
      if (!savePosts(next)) return;
      closeDialog();
      fileInput.value = '';
      uploadedImage = '';
      render();
    });

    filters.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-report-category]');
      if (!button || !filters.contains(button)) return;
      selectedCategory = String(button.dataset.reportCategory || 'all').toLocaleLowerCase();
      filters.querySelectorAll('button[data-report-category]').forEach((pill) => {
        const active = pill === button;
        pill.classList.toggle('is-selected', active);
        pill.setAttribute('aria-pressed', String(active));
      });
      render();
    });
    search.addEventListener('input', render);

    list.addEventListener('click', (event) => {
      const edit = event.target.closest('[data-edit-post]');
      if (edit) { const post = readPosts().find((item) => String(item.id) === edit.dataset.editPost); if (post) openEditor(post); return; }
      const remove = event.target.closest('[data-delete-post]');
      if (remove) {
        if (confirm('Delete this post and all of its comments?')) {
          const remaining = readPosts().filter((post) => String(post.id) !== remove.dataset.deletePost);
          if (savePosts(remaining)) render();
        }
        return;
      }
      const deleteComment = event.target.closest('[data-delete-comment]');
      if (deleteComment) {
        const postId = deleteComment.dataset.deleteComment;
        const commentId = deleteComment.dataset.commentId;
        if (!confirm('Remove this comment?')) return;
        const updated = readPosts().map((post) => String(post.id) === postId ? { ...post, comments: (post.comments || []).filter((comment, index) => String(comment.id ?? `${post.id}-comment-${index}`) !== commentId) } : post);
        if (savePosts(updated)) render();
        return;
      }
      const reaction = event.target.closest('[data-react-post]');
      if (reaction) {
        const updated = readPosts().map((post) => String(post.id) === reaction.dataset.reactPost ? { ...post, reactions: (Number(post.reactions) || 0) + 1 } : post);
        if (savePosts(updated)) render();
        return;
      }
      const reunited = event.target.closest('[data-reunite-post]');
      if (reunited) {
        const updated = readPosts().map((post) => String(post.id) === reunited.dataset.reunitePost ? { ...post, category: 'reunion', status: 'Reunited', reunited: true, updatedAt: new Date().toISOString() } : post);
        if (savePosts(updated)) render();
      }
    });
    list.addEventListener('submit', (event) => {
      const commentForm = event.target.closest('form[data-comment-form]');
      if (!commentForm) return;
      event.preventDefault();
      const text = String(new FormData(commentForm).get('comment') || '').trim();
      if (!text) return;
      const postId = commentForm.dataset.commentForm;
      const comment = { id: `comment-${Date.now()}`, author: 'Admin', isAdmin: true, text, createdAt: new Date().toISOString() };
      const updated = readPosts().map((post) => String(post.id) === postId ? { ...post, comments: [...(Array.isArray(post.comments) ? post.comments : []), comment] } : post);
      if (savePosts(updated)) render();
    });
    window.addEventListener('storage', (event) => { if (event.key === STORAGE_KEY || event.key === null) render(); });
    render();
  }
})();
