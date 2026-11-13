(() => {
  'use strict';

  // app.js rebuilds the admin shell on DOMContentLoaded. Initialize this page
  // afterward so its controls and delegated listeners aren't discarded.
  document.addEventListener('DOMContentLoaded', initReports);

  const STORAGE_KEY = 'communityReports';
  const SEED_POSTS = [
    { id: 'pawlink-report-milo', category: 'lost', caption: 'Milo went missing near Riverside Park this afternoon. He is a friendly orange tabby wearing a blue collar. Please check garages and porches nearby—his family is waiting for him. 💙', image: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=1200&q=85', author: 'Jamie Rivera', location: 'Riverside Park', createdAt: '2025-03-08T15:40:00.000Z', status: 'Active', reunited: false, reactions: 18, comments: [{ id: 'milo-comment-1', author: 'Taylor M.', text: 'I’ll keep an eye out on my evening walk!', createdAt: '2025-03-08T16:00:00.000Z' }, { id: 'milo-comment-2', author: 'PawLink Team', text: 'We’ve shared this with nearby neighbors. Hope Milo is home soon.', createdAt: '2025-03-08T16:15:00.000Z' }] },
    { id: 'pawlink-report-beagle', category: 'found', caption: 'Found this sweet beagle wandering by Oak Street Library. Safe with me for now. If you recognize this pup, please contact the PawLink team so we can help them get home.', image: 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?auto=format&fit=crop&w=1200&q=85', author: 'Morgan Lee', location: 'Oak Street', createdAt: '2025-03-08T14:10:00.000Z', status: 'Active', reunited: false, reactions: 12, comments: [{ id: 'beagle-comment-1', author: 'Alex P.', text: 'Shared with the neighborhood group. Thank you for keeping them safe.', createdAt: '2025-03-08T14:32:00.000Z' }] },
    { id: 'pawlink-report-luna', category: 'reunion', caption: 'Wonderful news: Luna is back home! A neighbor spotted her post and helped reunite her with her family. Thank you to everyone who shared and searched. 🐾', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1200&q=85', author: 'PawLink Community', location: 'Maplewood', createdAt: '2025-03-07T18:25:00.000Z', status: 'Reunited', reunited: true, reactions: 42, comments: [{ id: 'luna-comment-1', author: 'Luna’s family', text: 'We are so grateful to this amazing community!', createdAt: '2025-03-07T18:50:00.000Z' }] },
    { id: 'pawlink-report-clinic', category: 'community', caption: 'A reminder that our neighborhood pet wellness clinic is open this Saturday from 10 AM–2 PM at the Community Center. Low-cost vaccinations and microchip checks are available.', image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=1200&q=85', author: 'PawLink Team', location: 'Community Center', createdAt: '2025-03-07T12:00:00.000Z', status: 'Community update', reunited: false, reactions: 27, comments: [{ id: 'clinic-comment-1', author: 'Sam W.', text: 'Thanks for organizing this! I’ll bring my two dogs.', createdAt: '2025-03-07T12:40:00.000Z' }] }
  ];
  const CATEGORY_LABELS = { lost: 'Lost pet', found: 'Found pet', reunion: 'Reunion', community: 'Community' };
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

  function initReports() {
    const page = document.querySelector('[data-reports-page]');
    if (!page || page.dataset.reportsInitialized === 'true') return;
    page.dataset.reportsInitialized = 'true';

    function readPosts() {
      try {
        const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        if (Array.isArray(value)) return value.filter((post) => post && typeof post === 'object');
      } catch { /* Restore seed data only if the stored JSON is invalid. */ }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_POSTS));
      return SEED_POSTS.slice();
    }
    if (localStorage.getItem(STORAGE_KEY) === null) localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_POSTS));
    const posts = () => readPosts();
    const savePosts = (entries) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
        return true;
      } catch (error) {
        console.error('Could not save PawLink community reports.', error);
        return false;
      }
    };
    const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    const safeImageURL = (value) => {
      if (!value) return '';
      try { const url = new URL(value, location.href); return ['http:', 'https:', 'data:'].includes(url.protocol) ? url.href : ''; }
      catch { return ''; }
    };
    const formatDate = (value) => {
      const date = new Date(value);
      if (Number.isNaN(date.valueOf())) return 'Recently';
      return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
    };

    const list = page.querySelector('[data-report-list]');
    const search = page.querySelector('[data-report-search]');
    const dialog = page.querySelector('[data-post-dialog]');
    const form = page.querySelector('[data-post-form]');
    const dropZone = page.querySelector('[data-image-drop-zone]');
    const fileInput = page.querySelector('[data-image-file]');
    const preview = page.querySelector('[data-image-preview]');
    const uploadFeedback = page.querySelector('[data-upload-feedback]');
    let selectedCategory = 'all';
    let uploadedImage = '';

    function setUploadFeedback(message, error = false) {
      if (!uploadFeedback) return;
      uploadFeedback.textContent = message;
      uploadFeedback.classList.toggle('is-error', error);
    }
    function updatePreview(src) {
      if (!preview) return;
      preview.src = src || '';
      preview.hidden = !src;
      dropZone?.classList.toggle('has-image', Boolean(src));
      const removeButton = page.querySelector('[data-remove-image]');
      if (removeButton) removeButton.hidden = !src;
    }
    function resetImage() {
      uploadedImage = '';
      if (fileInput) fileInput.value = '';
      updatePreview('');
      setUploadFeedback('');
    }
    function prepareImage(file) {
      if (!file) return;
      if (!file.type.startsWith('image/')) { setUploadFeedback('Choose an image file to upload.', true); return; }
      if (file.size > MAX_IMAGE_BYTES) { setUploadFeedback('This image is over 5 MB. Choose a smaller image.', true); return; }
      const reader = new FileReader();
      reader.onerror = () => setUploadFeedback('The image could not be read. Please try another file.', true);
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => setUploadFeedback('That image could not be opened. Please try another file.', true);
        image.onload = () => {
          const scale = Math.min(1, 1400 / Math.max(image.naturalWidth, image.naturalHeight));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          const context = canvas.getContext('2d');
          if (!context) { setUploadFeedback('Image processing is unavailable in this browser.', true); return; }
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          uploadedImage = canvas.toDataURL('image/jpeg', 0.78);
          updatePreview(uploadedImage);
          setUploadFeedback('Image ready. It will be saved with your post.');
        };
        image.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    }

    function render() {
      const query = (search?.value || '').trim().toLowerCase();
      const visiblePosts = posts().filter((post) => {
        const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
        const searchable = `${post.caption || ''} ${post.location || ''} ${post.author || ''} ${post.category || ''}`.toLowerCase();
        return matchesCategory && searchable.includes(query);
      }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      const countNode = page.querySelector('[data-report-count]');
      if (countNode) countNode.textContent = `${visiblePosts.length} ${visiblePosts.length === 1 ? 'post' : 'posts'}`;
      if (!visiblePosts.length) {
        list.innerHTML = '<div class="report-empty"><span aria-hidden="true">🐾</span><h2>No updates found</h2><p>Try a different search or category filter.</p></div>';
        return;
      }
      list.innerHTML = visiblePosts.map((post) => {
        const comments = Array.isArray(post.comments) ? post.comments : [];
        const image = safeImageURL(post.image);
        const reunited = Boolean(post.reunited || post.status === 'Reunited' || post.category === 'reunion');
        const author = post.author || 'PawLink Admin';
        const postId = escapeHTML(post.id);
        return `<article class="feed-card" data-post-id="${postId}"><header class="feed-card-header"><span class="feed-avatar" aria-hidden="true">${escapeHTML(author.trim().charAt(0).toUpperCase() || 'P')}</span><div class="feed-author"><strong>${escapeHTML(author)}</strong><span>${escapeHTML(post.location || 'PawLink Community')} · ${escapeHTML(formatDate(post.createdAt))}</span></div><span class="feed-category category-${escapeHTML(post.category)}">${escapeHTML(CATEGORY_LABELS[post.category] || 'Community')}</span><div class="feed-admin-actions"><button class="feed-action" type="button" data-edit-post="${postId}">Edit</button><button class="feed-action feed-delete" type="button" data-delete-post="${postId}">Delete</button></div></header>${image ? `<img class="feed-image" src="${escapeHTML(image)}" alt="Community post by ${escapeHTML(author)}" loading="lazy">` : ''}<div class="feed-card-body"><p class="feed-caption">${escapeHTML(post.caption || '')}</p>${reunited ? '<span class="reunited-badge">✓ Reunited</span>' : ''}<div class="feed-reaction-row"><button class="reaction-button" type="button" data-react-post="${postId}" aria-label="Add a reaction">♡ <span>${Number(post.reactions) || 0}</span></button><span class="comment-total">${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}</span>${!reunited && ['lost', 'found'].includes(post.category) ? `<button class="feed-action mark-reunited" type="button" data-reunite-post="${postId}">Mark reunited</button>` : ''}</div><div class="comment-thread">${comments.map((comment) => `<div class="comment-row"><span class="comment-avatar" aria-hidden="true">${escapeHTML((comment.author || 'N').trim().charAt(0).toUpperCase())}</span><div class="comment-bubble"><strong>${escapeHTML(comment.author || 'Neighbor')}${comment.isAdmin ? ' <span class="admin-comment-tag">ADMIN</span>' : ''}</strong><p>${escapeHTML(comment.text || '')}</p><time>${escapeHTML(formatDate(comment.createdAt))}</time></div><button class="comment-delete" type="button" data-delete-comment="${postId}" data-comment-id="${escapeHTML(comment.id)}" aria-label="Delete comment">×</button></div>`).join('')}<form class="comment-form" data-comment-form="${postId}"><input name="comment" aria-label="Write an admin comment" maxlength="240" placeholder="Add an admin comment…" required><button type="submit">Comment</button></form></div></div></article>`;
      }).join('');
    }

    function openEditor(post = null) {
      form.reset();
      form.elements.id.value = post?.id || '';
      form.elements.category.value = post?.category || 'lost';
      form.elements.caption.value = post?.caption || '';
      const imageInput = form.elements.image;
      imageInput.value = post?.image && !post.image.startsWith('data:') ? post.image : '';
      uploadedImage = post?.image?.startsWith('data:') ? post.image : '';
      updatePreview(uploadedImage || safeImageURL(post?.image));
      setUploadFeedback(uploadedImage ? 'Saved uploaded image. Drop a new one to replace it.' : '');
      form.elements.reunited.checked = Boolean(post?.reunited || post?.status === 'Reunited');
      page.querySelector('#post-dialog-title').textContent = post ? 'Edit community post' : 'Create a post';
      page.querySelector('[data-post-submit]').textContent = post ? 'Save changes' : 'Publish post';
      dialog.showModal();
    }

    page.querySelector('[data-create-post]').addEventListener('click', () => openEditor());
    page.querySelectorAll('[data-close-post]').forEach((button) => button.addEventListener('click', () => dialog.close()));
    page.querySelector('[data-remove-image]').addEventListener('click', () => { uploadedImage = ''; form.elements.image.value = ''; updatePreview(''); setUploadFeedback('Image removed.'); });
    dropZone.addEventListener('click', (event) => { if (!event.target.closest('[data-remove-image]')) fileInput.click(); });
    dropZone.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); fileInput.click(); } });
    fileInput.addEventListener('change', () => prepareImage(fileInput.files?.[0]));
    ['dragenter', 'dragover'].forEach((type) => dropZone.addEventListener(type, (event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; dropZone.classList.add('is-dragging'); }));
    ['dragleave', 'dragend'].forEach((type) => dropZone.addEventListener(type, (event) => { event.preventDefault(); if (!dropZone.contains(event.relatedTarget)) dropZone.classList.remove('is-dragging'); }));
    dropZone.addEventListener('drop', (event) => { event.preventDefault(); dropZone.classList.remove('is-dragging'); prepareImage(event.dataTransfer.files?.[0]); });
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const id = String(data.get('id') || '');
      const existing = posts();
      const oldPost = existing.find((post) => String(post.id) === id);
      const reunited = form.elements.reunited.checked;
      const nextPost = { ...(oldPost || {}), id: id || `post-${Date.now()}`, category: reunited ? 'reunion' : String(data.get('category')), caption: String(data.get('caption') || '').trim(), image: uploadedImage || safeImageURL(String(data.get('image') || '').trim()), author: oldPost?.author || 'Admin', location: oldPost?.location || 'PawLink Community', createdAt: oldPost?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(), status: reunited ? 'Reunited' : (oldPost?.status || 'Active'), reunited, reactions: Number(oldPost?.reactions) || 0, comments: Array.isArray(oldPost?.comments) ? oldPost.comments : [] };
      const updated = id ? existing.map((post) => String(post.id) === id ? nextPost : post) : [nextPost, ...existing];
      if (!savePosts(updated)) { setUploadFeedback('Could not save. Remove the uploaded image or use a smaller file, then try again.', true); return; }
      dialog.close(); resetImage(); render();
    });

    page.querySelector('[data-report-filters]').addEventListener('click', (event) => {
      const button = event.target.closest('[data-report-category]');
      if (!button) return;
      selectedCategory = button.dataset.reportCategory;
      page.querySelectorAll('[data-report-category]').forEach((pill) => { const active = pill === button; pill.classList.toggle('is-selected', active); pill.setAttribute('aria-pressed', String(active)); });
      render();
    });
    search.addEventListener('input', render);

    list.addEventListener('click', (event) => {
      const edit = event.target.closest('[data-edit-post]');
      if (edit) { const post = posts().find((item) => String(item.id) === edit.dataset.editPost); if (post) openEditor(post); return; }
      const remove = event.target.closest('[data-delete-post]');
      if (remove) { if (confirm('Delete this post and all of its comments?')) { savePosts(posts().filter((post) => String(post.id) !== remove.dataset.deletePost); render(); } return; }
      const deleteComment = event.target.closest('[data-delete-comment]');
      if (deleteComment) { const updated = posts().map((post) => String(post.id) === deleteComment.dataset.deleteComment ? { ...post, comments: (post.comments || []).filter((comment) => String(comment.id) !== deleteComment.dataset.commentId) } : post); savePosts(updated); render(); return; }
      const reaction = event.target.closest('[data-react-post]');
      if (reaction) { savePosts(posts().map((post) => String(post.id) === reaction.dataset.reactPost ? { ...post, reactions: (Number(post.reactions) || 0) + 1 } : post)); render(); return; }
      const reunitedButton = event.target.closest('[data-reunite-post]');
      if (reunitedButton) { savePosts(posts().map((post) => String(post.id) === reunitedButton.dataset.reunitePost ? { ...post, category: 'reunion', status: 'Reunited', reunited: true, updatedAt: new Date().toISOString() } : post)); render(); }
    });
    list.addEventListener('submit', (event) => {
      const commentForm = event.target.closest('[data-comment-form]');
      if (!commentForm) return;
      event.preventDefault();
      const text = String(new FormData(commentForm).get('comment') || '').trim();
      if (!text) return;
      const postId = commentForm.dataset.commentForm;
      const comment = { id: `comment-${Date.now()}`, author: 'Admin', isAdmin: true, text, createdAt: new Date().toISOString() };
      const updated = posts().map((post) => String(post.id) === postId ? { ...post, comments: [...(post.comments || []), comment] } : post);
      if (savePosts(updated)) render();
    });
    window.addEventListener('storage', (event) => { if (event.key === STORAGE_KEY) render(); });
    const editId = new URLSearchParams(location.search).get('edit');
    if (editId) { const target = posts().find((post) => String(post.id) === editId); if (target) openEditor(target); }
    render();
  }
})();
