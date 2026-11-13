(() => {
  'use strict';

  const STORAGE_KEY = 'communityReports';
  const SEED_POSTS = [
    { id: 'pawlink-report-milo', category: 'lost', caption: 'Milo went missing near Riverside Park this afternoon. He is a friendly orange tabby wearing a blue collar. Please check garages and porches nearby—his family is waiting for him. 💙', image: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=1200&q=85', author: 'Jamie Rivera', location: 'Riverside Park', createdAt: '2025-03-08T15:40:00.000Z', status: 'Active', reunited: false, reactions: 18, comments: [{ id: 'milo-comment-1', author: 'Taylor M.', text: 'I’ll keep an eye out on my evening walk!', createdAt: '2025-03-08T16:00:00.000Z' }, { id: 'milo-comment-2', author: 'PawLink Team', text: 'We’ve shared this with nearby neighbors. Hope Milo is home soon.', createdAt: '2025-03-08T16:15:00.000Z' }] },
    { id: 'pawlink-report-beagle', category: 'found', caption: 'Found this sweet beagle wandering by Oak Street Library. Safe with me for now. If you recognize this pup, please contact the PawLink team so we can help them get home.', image: 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?auto=format&fit=crop&w=1200&q=85', author: 'Morgan Lee', location: 'Oak Street', createdAt: '2025-03-08T14:10:00.000Z', status: 'Active', reunited: false, reactions: 12, comments: [{ id: 'beagle-comment-1', author: 'Alex P.', text: 'Shared with the neighborhood group. Thank you for keeping them safe.', createdAt: '2025-03-08T14:32:00.000Z' }] },
    { id: 'pawlink-report-luna', category: 'reunion', caption: 'Wonderful news: Luna is back home! A neighbor spotted her post and helped reunite her with her family. Thank you to everyone who shared and searched. 🐾', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1200&q=85', author: 'PawLink Community', location: 'Maplewood', createdAt: '2025-03-07T18:25:00.000Z', status: 'Reunited', reunited: true, reactions: 42, comments: [{ id: 'luna-comment-1', author: 'Luna’s family', text: 'We are so grateful to this amazing community!', createdAt: '2025-03-07T18:50:00.000Z' }] },
    { id: 'pawlink-report-clinic', category: 'community', caption: 'A reminder that our neighborhood pet wellness clinic is open this Saturday from 10 AM–2 PM at the Community Center. Low-cost vaccinations and microchip checks are available.', image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=1200&q=85', author: 'PawLink Team', location: 'Community Center', createdAt: '2025-03-07T12:00:00.000Z', status: 'Community update', reunited: false, reactions: 27, comments: [{ id: 'clinic-comment-1', author: 'Sam W.', text: 'Thanks for organizing this! I’ll bring my two dogs.', createdAt: '2025-03-07T12:40:00.000Z' }] }
  ];
  const CATEGORY_LABELS = { lost: 'Lost pet', found: 'Found pet', reunion: 'Reunion', community: 'Community' };
  const page = document.querySelector('[data-reports-page]');
  if (!page) return;

  function readPosts() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      return Array.isArray(value) ? value.filter((post) => post && typeof post === 'object') : [];
    } catch { return []; }
  }
  if (localStorage.getItem(STORAGE_KEY) === null) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_POSTS));
  }
  
  const posts = () => readPosts();
  const savePosts = (entries) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    localStorage.setItem('pawlinkCommunityFeed', JSON.stringify(entries));
  };

  const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const safeImageURL = (value) => {
    if (!value) return '';
    try { const url = new URL(value, location.href); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; }
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
  let selectedCategory = 'all';

  function render() {
    const query = search.value.trim().toLowerCase();
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

      return `<article class="feed-card" data-post-id="${postId}">
        <header class="feed-card-header">
          <span class="feed-avatar" aria-hidden="true">${escapeHTML(author.trim().charAt(0).toUpperCase() || 'P')}</span>
          <div class="feed-author"><strong>${escapeHTML(author)}</strong><span>${escapeHTML(post.location || 'PawLink Community')} · ${escapeHTML(formatDate(post.createdAt))}</span></div>
          <span class="feed-category category-${escapeHTML(post.category)}">${escapeHTML(CATEGORY_LABELS[post.category] || 'Community')}</span>
          <div class="feed-admin-actions">
            <button class="feed-action" type="button" data-edit-post="${postId}">Edit</button>
            <button class="feed-action feed-delete" type="button" data-delete-post="${postId}">Delete</button>
          </div>
        </header>
        ${image ? `<img class="feed-image" src="${escapeHTML(image)}" alt="Community post by ${escapeHTML(author)}" loading="lazy">` : ''}
        <div class="feed-card-body">
          <p class="feed-caption">${escapeHTML(post.caption || '')}</p>
          ${reunited ? '<span class="reunited-badge">✓ Reunited</span>' : ''}
          <div class="feed-reaction-row">
            <button class="reaction-button" type="button" data-react-post="${postId}" aria-label="Add a reaction">♡ <span>${Number(post.reactions) || 0}</span></button>
            <span class="comment-total">${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}</span>
            ${!reunited && ['lost', 'found'].includes(post.category) ? `<button class="feed-action mark-reunited" type="button" data-reunite-post="${postId}">Mark reunited</button>` : ''}
          </div>
          <div class="comment-thread">
            ${comments.map((comment) => {
              const commentId = escapeHTML(comment.id);
              const cAuthor = escapeHTML(comment.author || 'Neighbor');
              return `<div class="comment-row">
                <span class="comment-avatar" aria-hidden="true">${escapeHTML(cAuthor.charAt(0).toUpperCase())}</span>
                <div class="comment-bubble">
                  <strong>${cAuthor}</strong>
                  <p>${escapeHTML(comment.text || '')}</p>
                  <time>${escapeHTML(formatDate(comment.createdAt))}</time>
                </div>
                <button class="comment-delete" type="button" data-delete-comment="${postId}" data-comment-id="${commentId}" aria-label="Delete comment">×</button>
              </div>`;
            }).join('')}
            <form class="comment-form" data-comment-form="${postId}">
              <input name="comment" aria-label="Write a comment" maxlength="240" placeholder="Write a supportive comment…" required>
              <button type="submit">Post</button>
            </form>
          </div>
        </div>
      </article>`;
    }).join('');
  }

  function openEditor(post) {
    if (!form || !dialog) return;
    form.reset();
    form.elements.id.value = post?.id || '';
    form.elements.category.value = post?.category || 'lost';
    form.elements.caption.value = post?.caption || '';
    form.elements.image.value = post?.image || '';
    if (form.elements.reunited) {
      form.elements.reunited.checked = Boolean(post?.reunited || post?.status === 'Reunited');
    }
    const titleEl = page.querySelector('#post-dialog-title');
    const submitEl = page.querySelector('[data-post-submit]');
    if (titleEl) titleEl.textContent = post ? 'Edit community post' : 'Create a post';
    if (submitEl) submitEl.textContent = post ? 'Save changes' : 'Publish post';
    dialog.showModal();
  }

  const createBtn = page.querySelector('[data-create-post]');
  if (createBtn) {
    createBtn.addEventListener('click', () => openEditor(null));
  }

  page.querySelectorAll('[data-close-post]').forEach((button) => {
    button.addEventListener('click', () => dialog?.close());
  });
  
  if (dialog) {
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  }

  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const id = String(data.get('id') || '');
      const existing = posts();
      const oldPost = existing.find((post) => String(post.id) === id);
      const reunited = form.elements.reunited ? form.elements.reunited.checked : false;
      const imageValue = String(data.get('image') || '').trim();
      
      const nextPost = {
        ...(oldPost || {}),
        id: id || `post-${Date.now()}`,
        category: reunited ? 'reunion' : String(data.get('category')),
        caption: String(data.get('caption') || '').trim(),
        image: safeImageURL(imageValue),
        author: oldPost?.author || 'Admin',
        location: oldPost?.location || 'PawLink Community',
        createdAt: oldPost?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: reunited ? 'Reunited' : (oldPost?.status || 'Active'),
        reunited,
        reactions: Number(oldPost?.reactions) || 0,
        comments: Array.isArray(oldPost?.comments) ? oldPost.comments : []
      };

      savePosts(id ? existing.map((post) => String(post.id) === id ? nextPost : post) : [nextPost, ...existing]);
      dialog?.close();
      render();
    });
  }

  const filterContainer = page.querySelector('[data-report-filters]');
  if (filterContainer) {
    filterContainer.addEventListener('click', (event) => {
      const button = event.target.closest('[data-report-category]');
      if (!button) return;
      selectedCategory = button.dataset.reportCategory;
      page.querySelectorAll('[data-report-category]').forEach((pill) => {
        const active = pill === button;
        pill.classList.toggle('is-selected', active);
        pill.setAttribute('aria-pressed', String(active));
      });
      render();
    });
  }

  if (search) {
    search.addEventListener('input', render);
  }

  list.addEventListener('click', (event) => {
    const edit = event.target.closest('[data-edit-post]');
    if (edit) { 
      const post = posts().find((item) => String(item.id) === edit.dataset.editPost); 
      if (post) openEditor(post); 
      return; 
    }
    
    const remove = event.target.closest('[data-delete-post]');
    if (remove) {
      if (confirm('Delete this post and all of its comments?')) {
        savePosts(posts().filter((post) => String(post.id) !== remove.dataset.deletePost));
        render();
      }
      return;
    }
    
    const deleteComment = event.target.closest('[data-delete-comment]');
    if (deleteComment) {
      const updated = posts().map((post) => {
        if (String(post.id) === deleteComment.dataset.deleteComment) {
          return { ...post, comments: (post.comments || []).filter((comment) => String(comment.id) !== deleteComment.dataset.commentId) };
        }
        return post;
      });
      savePosts(updated); 
      render(); 
      return;
    }
    
    const reaction = event.target.closest('[data-react-post]');
    if (reaction) {
      savePosts(posts().map((post) => String(post.id) === reaction.dataset.reactPost ? { ...post, reactions: (Number(post.reactions) || 0) + 1 } : post));
      render(); 
      return;
    }
    
    const reunitedButton = event.target.closest('[data-reunite-post]');
    if (reunitedButton) {
      savePosts(posts().map((post) => String(post.id) === reunitedButton.dataset.reunitePost ? { ...post, category: 'reunion', status: 'Reunited', reunited: true, updatedAt: new Date().toISOString() } : post));
      render();
    }
  });

  list.addEventListener('submit', (event) => {
    const commentForm = event.target.closest('[data-comment-form]');
    if (!commentForm) return;
    event.preventDefault();
    const inputEl = commentForm.querySelector('input');
    const text = String(inputEl?.value || '').trim();
    if (!text) return;
    
    const postId = commentForm.dataset.commentForm;
    const comment = { id: `comment-${Date.now()}`, author: 'Admin', text, createdAt: new Date().toISOString() };
    
    savePosts(posts().map((post) => String(post.id) === postId ? { ...post, comments: [...(post.comments || []), comment] } : post));
    render();
  });

  window.addEventListener('storage', (event) => { if (event.key === STORAGE_KEY) render(); });

  // Deep-link support from Global Search
  const params = new URLSearchParams(location.search);
  const editId = params.get('edit');
  if (editId) {
    const targetPost = posts().find((p) => String(p.id) === editId);
    if (targetPost) openEditor(targetPost);
  }

  render();
})();
