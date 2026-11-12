(() => {
  'use strict';

  const PRODUCTS_KEY = 'shopListings';
  const SEED_PRODUCTS = [
    { id: 'pawlink-shop-treats', title: 'Salmon & Sweet Potato Bites', category: 'Treats', description: 'Small-batch, oven-baked training treats made with simple, wholesome ingredients.', price: 14.5, stock: 28, seller: 'Bark & Biscuit Co.', image: 'https://images.unsplash.com/photo-1589924691995-400dc9ECC?auto=format&fit=crop&w=900&q=85', rating: 4.8, reviews: [{ id: 'review-treat-1', author: 'Mia R.', rating: 5, text: 'My pup loves these. Great size for training!' }, { id: 'review-treat-2', author: 'Devon K.', rating: 4, text: 'Smell fresh and the ingredients are simple.' }] },
    { id: 'pawlink-shop-toy', title: 'Tug & Toss Rope Set', category: 'Toys', description: 'A durable cotton rope duo for interactive tug sessions and joyful play.', price: 19, stock: 16, seller: 'Happy Tails Studio', image: 'https://images.unsplash.com/photo-1535294435445-d7249524ef2e?auto=format&fit=crop&w=900&q=85', rating: 4.6, reviews: [{ id: 'review-toy-1', author: 'Alex P.', rating: 5, text: 'A new favorite for our weekend park trips.' }] },
    { id: 'pawlink-shop-bed', title: 'Cloud Nine Pet Bed', category: 'Home', description: 'A plush, washable resting spot with a supportive cushion and soft raised sides.', price: 58, stock: 7, seller: 'Northstar Pet Home', image: 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?auto=format&fit=crop&w=900&q=85', rating: 4.9, reviews: [{ id: 'review-bed-1', author: 'Sam W.', rating: 5, text: 'Soft, sturdy, and easy to wash. Worth every penny.' }, { id: 'review-bed-2', author: 'Nina L.', rating: 5, text: 'Our senior dog finally has a bed he loves.' }] },
    { id: 'pawlink-shop-leash', title: 'Everyday Walk Kit', category: 'Essentials', description: 'A comfortable padded leash with a matching waste-bag holder for daily walks.', price: 32, stock: 21, seller: 'Good Walk Goods', image: 'https://images.unsplash.com/photo-1551717743-49959800b1f6?auto=format&fit=crop&w=900&q=85', rating: 4.7, reviews: [{ id: 'review-leash-1', author: 'Jordan B.', rating: 5, text: 'Comfortable to hold and the clip feels secure.' }] },
    { id: 'pawlink-shop-catnip', title: 'Garden Catnip Trio', category: 'Treats', description: 'Three hand-sewn catnip toys filled with organically grown local catnip.', price: 17, stock: 34, seller: 'Whisker & Leaf', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=85', rating: 4.5, reviews: [{ id: 'review-catnip-1', author: 'Taylor M.', rating: 5, text: 'Instant zoomies, then the best nap. Perfect.' }] },
    { id: 'pawlink-shop-bowl', title: 'Slow-Sip Ceramic Bowl', category: 'Essentials', description: 'A handmade, tip-resistant ceramic water bowl in a timeless, easy-clean glaze.', price: 26, stock: 11, seller: 'Clay Paws Workshop', image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=900&q=85', rating: 4.8, reviews: [{ id: 'review-bowl-1', author: 'Casey J.', rating: 5, text: 'Beautiful quality and just the right size.' }, { id: 'review-bowl-2', author: 'Morgan L.', rating: 4, text: 'Lovely bowl. Arrived carefully packed.' }] }
  ];
  const CATEGORIES = ['Treats', 'Toys', 'Home', 'Essentials'];
  const page = document.querySelector('[data-shop-page]');
  if (!page) return;

  function readProducts() {
    try {
      const value = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || 'null');
      if (Array.isArray(value)) return value.filter((product) => product && typeof product === 'object');
    } catch { /* Invalid local state will be replaced with initial products. */ }
    const seeded = SEED_PRODUCTS.map((product) => ({ ...product, image: product.image.replace('photo-1589924691995-400dc9ECC', 'photo-1589924691995-400dc9ecc') }));
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(seeded));
    return seeded;
  }
  const saveProducts = (products) => localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const safeImageURL = (value) => {
    if (!value) return '';
    try { const url = new URL(value, location.href); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; }
    catch { return ''; }
  };
  const formatPrice = (value) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(value) || 0);
  const ratingMarkup = (rating) => {
    const value = Math.max(0, Math.min(5, Number(rating) || 0));
    return `<span class="star-display" aria-label="Rated ${value.toFixed(1)} out of 5">${'★'.repeat(Math.round(value))}${'☆'.repeat(5 - Math.round(value))}</span>`;
  };
  const grid = page.querySelector('[data-product-grid]');
  const search = page.querySelector('[data-product-search]');
  const dialog = page.querySelector('[data-product-dialog]');
  const form = page.querySelector('[data-product-form]');
  const reviewDialog = page.querySelector('[data-review-dialog]');
  let selectedCategory = 'all';

  function renderReviews(product) {
    const reviews = Array.isArray(product.reviews) ? product.reviews : [];
    const reviewMarkup = reviews.map((review) => `<div class="review-row"><span class="review-avatar" aria-hidden="true">${escapeHTML((review.author || 'N').trim().charAt(0).toUpperCase())}</span><div class="review-copy"><div class="review-author-line"><strong>${escapeHTML(review.author || 'Customer')}</strong>${ratingMarkup(review.rating)}</div><p>${escapeHTML(review.text || '')}</p></div><button class="review-delete" type="button" data-delete-review="${escapeHTML(product.id)}" data-review-id="${escapeHTML(review.id)}" aria-label="Delete review">×</button></div>`).join('');
    return reviewMarkup || '<p class="no-reviews">No customer reviews yet.</p>';
  }
  function render() {
    const products = readProducts();
    const query = search.value.trim().toLowerCase();
    const visible = products.filter((product) => (selectedCategory === 'all' || product.category === selectedCategory) && `${product.title} ${product.description} ${product.category} ${product.seller}`.toLowerCase().includes(query));
    page.querySelector('[data-product-count]').textContent = `${visible.length} ${visible.length === 1 ? 'item' : 'items'}`;
    if (!visible.length) { grid.innerHTML = '<div class="shop-empty"><span aria-hidden="true">🛍️</span><h2>No items found</h2><p>Try a different search or category filter.</p></div>'; return; }
    grid.innerHTML = visible.map((product) => {
      const image = safeImageURL(product.image);
      const reviews = Array.isArray(product.reviews) ? product.reviews : [];
      const average = reviews.length ? reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / reviews.length : Number(product.rating) || 0;
      return `<article class="product-card" data-product-id="${escapeHTML(product.id)}"><div class="product-photo-wrap">${image ? `<img class="product-photo" src="${escapeHTML(image)}" alt="${escapeHTML(product.title)}" loading="lazy">` : '<div class="product-photo-placeholder" aria-hidden="true">🐾</div>'}<span class="product-category category-${escapeHTML(product.category.toLowerCase())}">${escapeHTML(product.category)}</span><div class="product-admin-actions"><button type="button" data-edit-product="${escapeHTML(product.id)}" aria-label="Edit ${escapeHTML(product.title)}">Edit</button><button type="button" data-delete-product="${escapeHTML(product.id)}" aria-label="Delete ${escapeHTML(product.title)}">Delete</button></div></div><div class="product-card-body"><div class="product-title-row"><h3>${escapeHTML(product.title)}</h3><span class="product-price">${formatPrice(product.price)}</span></div><p class="product-description">${escapeHTML(product.description)}</p><div class="product-rating-row">${ratingMarkup(average)}<button type="button" class="review-link" data-open-reviews="${escapeHTML(product.id)}">${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'}</button></div><div class="product-card-footer"><span>Sold by <strong>${escapeHTML(product.seller)}</strong></span><span class="stock-label">${Number(product.stock) || 0} in stock</span></div></div></article>`;
    }).join('');
  }

  function openProductEditor(product) {
    form.reset();
    form.elements.id.value = product?.id || '';
    form.elements.title.value = product?.title || '';
    form.elements.category.value = product?.category || CATEGORIES[0];
    form.elements.price.value = product?.price ?? '';
    form.elements.stock.value = product?.stock ?? '';
    form.elements.seller.value = product?.seller || 'PawLink Community';
    form.elements.description.value = product?.description || '';
    form.elements.image.value = product?.image || '';
    page.querySelector('#product-dialog-title').textContent = product ? 'Edit listing' : 'Add an item';
    dialog.showModal();
  }

  page.querySelector('[data-add-product]').addEventListener('click', () => openProductEditor());
  page.querySelectorAll('[data-close-product]').forEach((button) => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const id = String(data.get('id') || '');
    const products = readProducts();
    const old = products.find((product) => String(product.id) === id);
    const product = { ...(old || {}), id: id || `product-${Date.now()}`, title: String(data.get('title')).trim(), category: String(data.get('category')), price: Number(data.get('price')), stock: Number(data.get('stock')), seller: String(data.get('seller')).trim(), description: String(data.get('description')).trim(), image: safeImageURL(String(data.get('image') || '').trim()), reviews: Array.isArray(old?.reviews) ? old.reviews : [], updatedAt: new Date().toISOString() };
    saveProducts(id ? products.map((item) => String(item.id) === id ? product : item) : [product, ...products]);
    dialog.close(); render();
  });
  page.querySelectorAll('[data-close-reviews]').forEach((button) => button.addEventListener('click', () => reviewDialog.close()));
  reviewDialog.addEventListener('click', (event) => { if (event.target === reviewDialog) reviewDialog.close(); });
  page.querySelector('[data-shop-filters]').addEventListener('click', (event) => {
    const button = event.target.closest('[data-shop-category]');
    if (!button) return;
    selectedCategory = button.dataset.shopCategory;
    page.querySelectorAll('[data-shop-category]').forEach((pill) => { const active = pill === button; pill.classList.toggle('is-selected', active); pill.setAttribute('aria-pressed', String(active)); });
    render();
  });
  search.addEventListener('input', render);
  grid.addEventListener('click', (event) => {
    const edit = event.target.closest('[data-edit-product]');
    if (edit) { const product = readProducts().find((item) => String(item.id) === edit.dataset.editProduct); if (product) openProductEditor(product); return; }
    const remove = event.target.closest('[data-delete-product]');
    if (remove) { if (confirm('Delete this product listing and its reviews?')) saveProducts(readProducts().filter((item) => String(item.id) !== remove.dataset.deleteProduct)); render(); return; }
    const openReviews = event.target.closest('[data-open-reviews]');
    if (openReviews) {
      const product = readProducts().find((item) => String(item.id) === openReviews.dataset.openReviews);
      if (product) { page.querySelector('#review-dialog-title').textContent = `Reviews · ${product.title}`; page.querySelector('[data-moderation-reviews]').innerHTML = renderReviews(product); reviewDialog.showModal(); }
    }
  });
  page.querySelector('[data-moderation-reviews]').addEventListener('click', (event) => {
    const remove = event.target.closest('[data-delete-review]');
    if (!remove || !confirm('Remove this customer review?')) return;
    const products = readProducts().map((product) => String(product.id) === remove.dataset.deleteReview ? { ...product, reviews: (product.reviews || []).filter((review) => String(review.id) !== remove.dataset.reviewId) } : product);
    saveProducts(products);
    const updated = products.find((product) => String(product.id) === remove.dataset.deleteReview);
    if (updated) page.querySelector('[data-moderation-reviews]').innerHTML = renderReviews(updated);
    render();
  });
  window.addEventListener('storage', (event) => { if (event.key === PRODUCTS_KEY) render(); });
  render();
})();
