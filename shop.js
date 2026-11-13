(() => {
  'use strict';

  const PRODUCTS_KEY = 'shopListings';
  const CATEGORIES = ['Treats', 'Toys', 'Home', 'Essentials'];
  const SEED_PRODUCTS = [
    { id: 'pawlink-shop-treats', title: 'Salmon & Sweet Potato Bites', category: 'Treats', description: 'Small-batch, oven-baked training treats made with simple, wholesome ingredients.', price: 14, stock: 28, seller: 'PawLink Pantry', image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc', rating: 4.8, reviews: [{ id: 'review-treats-1', author: 'Mia R.', rating: 5, text: 'Perfect little training treats. My dog loves them!', createdAt: '2025-03-08T10:00:00.000Z' }] },
    { id: 'pawlink-shop-toy', title: 'Tug & Toss Rope Set', category: 'Toys', description: 'A durable cotton rope duo for interactive tug sessions and joyful play.', price: 19, stock: 16, seller: 'Good Dog Goods', image: 'https://images.unsplash.com/photo-1535294435445-d7249524ef2e?auto=format&fit=crop&w=900&q=85', rating: 4.6, reviews: [{ id: 'review-toy-1', author: 'Noah K.', rating: 5, text: 'Sturdy and fun. Great quality.', createdAt: '2025-03-07T10:00:00.000Z' }] },
    { id: 'pawlink-shop-bed', title: 'Cloud Nine Pet Bed', category: 'Home', description: 'A plush, washable resting spot with a supportive cushion and soft raised sides.', price: 58, stock: 7, seller: 'Cozy Paws Studio', image: 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?auto=format&fit=crop&w=900&q=85', rating: 4.9, reviews: [] },
    { id: 'pawlink-shop-leash', title: 'Everyday Walk Kit', category: 'Essentials', description: 'A comfortable padded leash with a matching waste-bag holder for daily walks.', price: 32, stock: 21, seller: 'Trail Tails', image: 'https://images.unsplash.com/photo-1551717743-49959800b1f6?auto=format&fit=crop&w=900&q=85', rating: 4.7, reviews: [] },
    { id: 'pawlink-shop-catnip', title: 'Garden Catnip Trio', category: 'Treats', description: 'Three hand-sewn catnip toys filled with organically grown local catnip.', price: 17, stock: 34, seller: 'PawLink Pantry', image: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=900&q=85', rating: 4.5, reviews: [] },
    { id: 'pawlink-shop-bowl', title: 'Slow-Sip Ceramic Bowl', category: 'Essentials', description: 'A handmade, tip-resistant ceramic water bowl in a timeless, easy-clean glaze.', price: 26, stock: 12, seller: 'Clay & Collar', image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc?auto=format&fit=crop&w=900&q=85', rating: 4.8, reviews: [] }
  ];

  // app.js rebuilds the shell at DOMContentLoaded; attach after its render.
  function boot() {
    const page = document.querySelector('[data-shop-page]');
    if (!page || page.dataset.shopInitialized === 'true') return;
    if (page.querySelector('[data-product-grid]') && page.querySelector('[data-add-product]')) initShop(page);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 0), { once: true });
  else setTimeout(boot, 0);
  new MutationObserver(boot).observe(document.documentElement, { childList: true, subtree: true });

  function initShop(page) {
    if (page.dataset.shopInitialized === 'true') return;
    const grid = page.querySelector('[data-product-grid]');
    const search = page.querySelector('[data-product-search]');
    const filters = page.querySelector('[data-shop-filters]');
    const dialog = page.querySelector('[data-product-dialog]');
    const form = page.querySelector('[data-product-form]');
    const reviewDialog = page.querySelector('[data-review-dialog]');
    const reviewForm = page.querySelector('[data-review-form]');
    const reviewList = page.querySelector('[data-moderation-reviews]');
    if (!grid || !search || !filters || !dialog || !form || !reviewDialog || !reviewForm || !reviewList) return;
    page.dataset.shopInitialized = 'true';

    const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    const safeImageURL = (value) => { if (!value) return ''; try { const url = new URL(value, location.href); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } };
    const money = (value) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(value) || 0);
    const stars = (value) => { const rating = Math.max(0, Math.min(5, Math.round(Number(value) || 0))); return `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`; };
    function readProducts() {
      try {
        const raw = localStorage.getItem(PRODUCTS_KEY);
        if (raw !== null) { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed.filter((item) => item && typeof item === 'object'); }
      } catch (error) { console.warn('Invalid saved shop catalog.', error); }
      try { localStorage.setItem(PRODUCTS_KEY, JSON.stringify(SEED_PRODUCTS)); } catch (error) { console.error('Unable to initialize shop catalog.', error); }
      return SEED_PRODUCTS.slice();
    }
    function saveProducts(products) {
      try { localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products)); return true; }
      catch (error) { console.error('Unable to save shop catalog.', error); const feedback = page.querySelector('[data-shop-feedback]'); if (feedback) feedback.textContent = 'Could not save. Browser storage may be full.'; return false; }
    }
    if (localStorage.getItem(PRODUCTS_KEY) === null) saveProducts(SEED_PRODUCTS);

    let selectedCategory = 'all';
    let activeReviewProductId = null;
    function reviewsFor(product) { return Array.isArray(product.reviews) ? product.reviews : []; }
    function productRating(product) {
      const reviews = reviewsFor(product);
      return reviews.length ? reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / reviews.length : Number(product.rating) || 0;
    }
    function render() {
      const query = search.value.trim().toLowerCase();
      const products = readProducts();
      const visible = products.filter((product) => (selectedCategory === 'all' || product.category === selectedCategory) && `${product.title || ''} ${product.description || ''} ${product.category || ''} ${product.seller || ''}`.toLowerCase().includes(query));
      const count = page.querySelector('[data-product-count]');
      if (count) count.textContent = `${visible.length} ${visible.length === 1 ? 'item' : 'items'}`;
      if (!visible.length) { grid.innerHTML = '<div class="shop-empty"><span aria-hidden="true">🛍️</span><h2>No items found</h2><p>Try a different search or category filter.</p></div>'; return; }
      grid.innerHTML = visible.map((product) => {
        const id = escapeHTML(product.id);
        const image = safeImageURL(product.image);
        const reviews = reviewsFor(product);
        const average = productRating(product);
        return `<article class="product-card"><div class="product-photo-wrap">${image ? `<img class="product-photo" src="${escapeHTML(image)}" alt="${escapeHTML(product.title)}" loading="lazy">` : '<div class="product-placeholder" aria-hidden="true">🐾</div>'}<span class="product-category">${escapeHTML(product.category || 'Essentials')}</span><div class="product-admin-actions"><button type="button" data-edit-product="${id}">Edit</button><button type="button" data-delete-product="${id}">Delete</button></div></div><div class="product-card-body"><div class="product-title-row"><h3>${escapeHTML(product.title || 'Untitled item')}</h3><strong>${money(product.price)}</strong></div><p class="product-description">${escapeHTML(product.description || '')}</p><div class="product-meta"><span>${escapeHTML(product.seller || 'PawLink Community')}</span><span>${Number(product.stock) || 0} in stock</span></div><div class="product-review-summary"><span class="star-display" aria-label="Rated ${average.toFixed(1)} out of 5">${stars(average)}</span><span>${average ? average.toFixed(1) : 'No rating'} · ${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'}</span><button type="button" data-open-reviews="${id}">View / manage reviews</button></div><button class="add-review-button" type="button" data-add-review="${id}">＋ Add review</button></div></article>`;
      }).join('');
    }
    function setDialogOpen(target) { if (typeof target.showModal === 'function') target.showModal(); else target.setAttribute('open', ''); }
    function closeDialog(target) { if (typeof target.close === 'function' && target.open) target.close(); else target.removeAttribute('open'); }
    function openProductEditor(product = null) {
      form.reset();
      form.elements.id.value = product?.id || '';
      form.elements.title.value = product?.title || '';
      form.elements.category.value = product?.category || CATEGORIES[0];
      form.elements.price.value = product?.price ?? '';
      form.elements.stock.value = product?.stock ?? '';
      form.elements.seller.value = product?.seller || 'PawLink Community';
      form.elements.description.value = product?.description || '';
      form.elements.image.value = product?.image || '';
      page.querySelector('#product-dialog-title').textContent = product ? 'Edit item' : 'Add an item';
      setDialogOpen(dialog);
    }
    function renderReviews(product) {
      const reviews = reviewsFor(product);
      reviewList.innerHTML = reviews.length ? reviews.map((review, index) => `<article class="moderation-review"><div class="review-row"><span class="review-avatar" aria-hidden="true">${escapeHTML((review.author || 'N').trim().charAt(0).toUpperCase())}</span><div class="review-content"><div class="review-head"><strong>${escapeHTML(review.author || 'Neighbor')}</strong><span class="star-display">${stars(review.rating)}</span></div><p>${escapeHTML(review.text || '')}</p><time>${escapeHTML(review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recently')}</time></div><div class="review-actions"><button type="button" data-edit-review="${escapeHTML(review.id ?? index)}">Edit</button><button type="button" data-delete-review="${escapeHTML(review.id ?? index)}">Delete</button></div></div></article>`).join('') : '<p class="no-reviews">No customer reviews yet. Add the first review below.</p>';
    }
    function openReviews(productId, review = null) {
      const product = readProducts().find((item) => String(item.id) === String(productId));
      if (!product) return;
      activeReviewProductId = String(product.id);
      page.querySelector('#review-dialog-title').textContent = `Reviews · ${product.title}`;
      renderReviews(product);
      reviewForm.reset();
      reviewForm.elements.reviewId.value = review?.id || '';
      reviewForm.elements.author.value = review?.author || '';
      reviewForm.elements.rating.value = String(review?.rating || 5);
      reviewForm.elements.text.value = review?.text || '';
      page.querySelector('[data-review-form-title]').textContent = review ? 'Edit review' : 'Add a review';
      reviewForm.querySelector('[type=submit]').textContent = review ? 'Save review' : 'Add review';
      setDialogOpen(reviewDialog);
    }

    page.querySelector('[data-add-product]').addEventListener('click', () => openProductEditor());
    page.querySelectorAll('[data-close-product]').forEach((button) => button.addEventListener('click', () => closeDialog(dialog)));
    dialog.addEventListener('click', (event) => { if (event.target === dialog) closeDialog(dialog); });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const id = String(data.get('id') || '');
      const oldProducts = readProducts();
      const previous = oldProducts.find((item) => String(item.id) === id);
      const item = { ...(previous || {}), id: id || `product-${Date.now()}`, title: String(data.get('title') || '').trim(), category: String(data.get('category')), price: Number(data.get('price')), stock: Number(data.get('stock')), seller: String(data.get('seller') || '').trim() || 'PawLink Community', description: String(data.get('description') || '').trim(), image: safeImageURL(String(data.get('image') || '').trim()), updatedAt: new Date().toISOString(), reviews: reviewsFor(previous || {}) };
      const next = id ? oldProducts.map((old) => String(old.id) === id ? item : old) : [item, ...oldProducts];
      if (saveProducts(next)) { closeDialog(dialog); render(); }
    });

    filters.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-shop-category]');
      if (!button || !filters.contains(button)) return;
      selectedCategory = button.dataset.shopCategory;
      filters.querySelectorAll('[data-shop-category]').forEach((pill) => { const active = pill === button; pill.classList.toggle('is-selected', active); pill.setAttribute('aria-pressed', String(active)); });
      render();
    });
    search.addEventListener('input', render);
    grid.addEventListener('click', (event) => {
      const edit = event.target.closest('[data-edit-product]');
      if (edit) { const item = readProducts().find((product) => String(product.id) === edit.dataset.editProduct); if (item) openProductEditor(item); return; }
      const remove = event.target.closest('[data-delete-product]');
      if (remove) { if (confirm('Delete this item and its reviews?')) { const next = readProducts().filter((item) => String(item.id) !== remove.dataset.deleteProduct); if (saveProducts(next)) render(); } return; }
      const view = event.target.closest('[data-open-reviews]');
      if (view) { openReviews(view.dataset.openReviews); return; }
      const addReview = event.target.closest('[data-add-review]');
      if (addReview) openReviews(addReview.dataset.addReview);
    });

    page.querySelectorAll('[data-close-reviews]').forEach((button) => button.addEventListener('click', () => closeDialog(reviewDialog)));
    reviewDialog.addEventListener('click', (event) => { if (event.target === reviewDialog) closeDialog(reviewDialog); });
    page.querySelector('[data-reset-review]').addEventListener('click', () => {
      reviewForm.reset(); reviewForm.elements.reviewId.value = ''; reviewForm.elements.rating.value = '5';
      page.querySelector('[data-review-form-title]').textContent = 'Add a review';
      reviewForm.querySelector('[type=submit]').textContent = 'Add review';
    });
    reviewList.addEventListener('click', (event) => {
      const edit = event.target.closest('[data-edit-review]');
      if (edit) {
        const product = readProducts().find((item) => String(item.id) === activeReviewProductId);
        const review = reviewsFor(product || {}).find((item, index) => String(item.id ?? index) === edit.dataset.editReview);
        if (product && review) openReviews(product.id, review);
        return;
      }
      const remove = event.target.closest('[data-delete-review]');
      if (!remove || !confirm('Delete this review?')) return;
      const products = readProducts().map((product) => String(product.id) === activeReviewProductId ? { ...product, reviews: reviewsFor(product).filter((review, index) => String(review.id ?? index) !== remove.dataset.deleteReview) } : product);
      if (saveProducts(products)) { const updated = products.find((item) => String(item.id) === activeReviewProductId); if (updated) renderReviews(updated); render(); }
    });
    reviewForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!reviewForm.reportValidity()) return;
      const data = new FormData(reviewForm);
      const reviewId = String(data.get('reviewId') || '');
      const products = readProducts();
      const product = products.find((item) => String(item.id) === activeReviewProductId);
      if (!product) return;
      const oldReviews = reviewsFor(product);
      const oldReview = oldReviews.find((item) => String(item.id) === reviewId);
      const nextReview = { ...(oldReview || {}), id: reviewId || `review-${Date.now()}`, author: String(data.get('author') || '').trim(), rating: Number(data.get('rating')), text: String(data.get('text') || '').trim(), createdAt: oldReview?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
      const nextReviews = reviewId ? oldReviews.map((item) => String(item.id) === reviewId ? nextReview : item) : [nextReview, ...oldReviews];
      const updatedProducts = products.map((item) => String(item.id) === activeReviewProductId ? { ...item, reviews: nextReviews } : item);
      if (saveProducts(updatedProducts)) { const updated = updatedProducts.find((item) => String(item.id) === activeReviewProductId); renderReviews(updated); reviewForm.reset(); reviewForm.elements.reviewId.value = ''; reviewForm.elements.rating.value = '5'; page.querySelector('[data-review-form-title]').textContent = 'Add a review'; reviewForm.querySelector('[type=submit]').textContent = 'Add review'; render(); }
    });

    window.addEventListener('storage', (event) => { if (event.key === PRODUCTS_KEY || event.key === null) render(); });
    render();
  }
})();
