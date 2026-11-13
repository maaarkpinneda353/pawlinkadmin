(() => {
  'use strict';

  const PETS_KEY = 'pets';
  const INQUIRIES_KEY = 'pawlinkAdoptionInquiries';
  const PET_SEEDS = [
    { id: 'pawlink-pet-olive', name: 'Olive', species: 'Dog', breed: 'Labrador mix', age: '2 years', location: 'Portland, OR', image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=85', description: 'A gentle, sunny companion who loves long walks and meeting new friends.', status: 'Available' },
    { id: 'pawlink-pet-pepper', name: 'Pepper', species: 'Cat', breed: 'Domestic shorthair', age: '8 months', location: 'Seattle, WA', image: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=900&q=85', description: 'Curious, playful, and happiest curled up somewhere cozy after a little adventure.', status: 'Available' },
    { id: 'pawlink-pet-benny', name: 'Benny', species: 'Dog', breed: 'Beagle', age: '4 years', location: 'Austin, TX', image: 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?auto=format&fit=crop&w=900&q=85', description: 'A sweet-natured friend with excellent sniffing skills and a very waggy tail.', status: 'Pending' },
    { id: 'pawlink-pet-sage', name: 'Sage', species: 'Cat', breed: 'Tuxedo cat', age: '1 year', location: 'Denver, CO', image: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=900&q=85', description: 'An affectionate lap cat who enjoys quiet afternoons and gentle play.', status: 'Available' },
    { id: 'pawlink-pet-coco', name: 'Coco', species: 'Dog', breed: 'Terrier mix', age: '3 years', location: 'Madison, WI', image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87c?auto=format&fit=crop&w=900&q=85', description: 'Small in size and big in personality. Coco is ready to be your sidekick.', status: 'Available' },
    { id: 'pawlink-pet-maple', name: 'Maple', species: 'Cat', breed: 'Calico', age: '2 years', location: 'Raleigh, NC', image: 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=900&q=85', description: 'A calm, confident friend who would love a sunny window and a forever home.', status: 'Available' }
  ];
  const INQUIRY_SEEDS = [
    { id: 'pawlink-inquiry-104', petId: 'pawlink-pet-olive', petName: 'Olive', applicant: 'Casey Johnson', email: 'casey.j@example.com', note: 'We have a fenced yard and an older dog who would love a companion.', createdAt: '2025-03-08T13:15:00.000Z', status: 'Pending' },
    { id: 'pawlink-inquiry-103', petId: 'pawlink-pet-pepper', petName: 'Pepper', applicant: 'Riley Chen', email: 'riley.chen@example.com', note: 'I work from home and can offer plenty of company and playtime.', createdAt: '2025-03-08T10:20:00.000Z', status: 'Pending' },
    { id: 'pawlink-inquiry-102', petId: 'pawlink-pet-coco', petName: 'Coco', applicant: 'Jordan Blake', email: 'j.blake@example.com', note: 'Coco sounds like a perfect match for our active family.', createdAt: '2025-03-07T17:05:00.000Z', status: 'Pending' }
  ];

  // Wait for app.js to finish replacing the shell before binding page controls.
  function boot() {
    const page = document.querySelector('[data-adopt-page]');
    if (!page || page.dataset.adoptInitialized === 'true') return;
    if (!page.querySelector('[data-pet-grid]') || !page.querySelector('[data-inquiry-list]')) return;
    initAdoption(page);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 0), { once: true });
  } else {
    setTimeout(boot, 0);
  }
  new MutationObserver(boot).observe(document.documentElement, { childList: true, subtree: true });

  function initAdoption(page) {
    if (page.dataset.adoptInitialized === 'true') return;
    const grid = page.querySelector('[data-pet-grid]');
    const inquiryList = page.querySelector('[data-inquiry-list]');
    const dialog = page.querySelector('[data-pet-dialog]');
    const form = page.querySelector('[data-pet-form]');
    const addButton = page.querySelector('[data-add-pet]');
    if (!grid || !inquiryList || !dialog || !form || !addButton) return;
    page.dataset.adoptInitialized = 'true';

    const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    const safeImageURL = (value) => {
      if (!value) return '';
      try { const url = new URL(value, location.href); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; }
      catch { return ''; }
    };
    const dateLabel = (value) => {
      const date = new Date(value);
      return Number.isNaN(date.valueOf()) ? 'Recently' : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
    };
    function readArray(key, seed) {
      try {
        const raw = localStorage.getItem(key);
        if (raw !== null) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed.filter((item) => item && typeof item === 'object');
        }
      } catch (error) { console.warn(`Invalid ${key}; restoring sample data.`, error); }
      try { localStorage.setItem(key, JSON.stringify(seed)); } catch (error) { console.error(`Could not initialize ${key}.`, error); }
      return seed.slice();
    }
    const readPets = () => readArray(PETS_KEY, PET_SEEDS);
    const readInquiries = () => readArray(INQUIRIES_KEY, INQUIRY_SEEDS);
    function save(key, records) {
      try { localStorage.setItem(key, JSON.stringify(records)); return true; }
      catch (error) {
        console.error(`Could not save ${key}.`, error);
        const feedback = page.querySelector('[data-pet-feedback]');
        if (feedback) feedback.textContent = 'Could not save changes in browser storage. Please try again.';
        return false;
      }
    }
    if (localStorage.getItem(PETS_KEY) === null) save(PETS_KEY, PET_SEEDS);
    if (localStorage.getItem(INQUIRIES_KEY) === null) save(INQUIRIES_KEY, INQUIRY_SEEDS);

    function renderPets() {
      const records = readPets();
      const count = page.querySelector('[data-pet-count]');
      if (count) count.textContent = `${records.length} ${records.length === 1 ? 'profile' : 'profiles'}`;
      grid.innerHTML = records.length ? records.map((pet) => {
        const id = String(pet.id ?? '');
        const status = ['Available', 'Pending', 'Adopted'].includes(pet.status) ? pet.status : 'Available';
        const image = safeImageURL(pet.image);
        const accepted = pet.acceptedApplicant ? `<div class="accepted-applicant"><span class="accepted-check">✓</span><span><strong>Application accepted</strong><small>${escapeHTML(pet.acceptedApplicant)}${pet.acceptedEmail ? ` · ${escapeHTML(pet.acceptedEmail)}` : ''}</small></span></div>` : '';
        return `<article class="pet-card"><div class="pet-photo-frame">${image ? `<img class="pet-photo" src="${escapeHTML(image)}" alt="${escapeHTML(pet.name)}" loading="lazy">` : '<div class="pet-photo-placeholder">🐾</div>'}<span class="pet-status status-${status.toLowerCase()}">${status}</span><div class="pet-card-actions"><button type="button" data-edit-pet="${escapeHTML(id)}">Edit</button><button type="button" data-delete-pet="${escapeHTML(id)}">Delete</button></div></div><div class="pet-card-content"><div class="pet-title-row"><h3>${escapeHTML(pet.name || 'Unnamed pet')}</h3><span>${escapeHTML(pet.species || 'Pet')}</span></div><p class="pet-details">${escapeHTML(pet.breed || 'Breed not specified')} · ${escapeHTML(pet.age || 'Age unknown')}</p><p class="pet-location">⌖ ${escapeHTML(pet.location || 'Location not specified')}</p>${pet.description ? `<p class="pet-description">${escapeHTML(pet.description)}</p>` : ''}${accepted}</div></article>`;
      }).join('') : '<div class="pet-empty"><h2>No pet profiles yet</h2><p>Add an adoptable pet to get started.</p></div>';
    }
    function renderInquiries() {
      const pending = readInquiries().filter((item) => (item.status || 'Pending') === 'Pending').sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      const count = page.querySelector('[data-pending-count]');
      if (count) count.textContent = `${pending.length} pending`;
      inquiryList.innerHTML = pending.length ? pending.map((item) => `<article class="inquiry-card"><span class="inquiry-avatar">${escapeHTML((item.applicant || 'A').charAt(0).toUpperCase())}</span><div class="inquiry-details"><div class="inquiry-name-row"><h3>${escapeHTML(item.applicant || 'Applicant')}</h3><span class="inquiry-status">Pending</span></div><p class="inquiry-pet">Interested in <strong>${escapeHTML(item.petName || 'a PawLink pet')}</strong> · ${escapeHTML(dateLabel(item.createdAt))}</p><p class="inquiry-note">${escapeHTML(item.note || 'No message provided.')}</p><a class="inquiry-email" href="mailto:${escapeHTML(item.email || '')}">${escapeHTML(item.email || 'No email provided')}</a></div><div class="inquiry-actions"><button class="button approve-button" type="button" data-inquiry-action="approve" data-inquiry-id="${escapeHTML(item.id)}">Approve</button><button class="button decline-button" type="button" data-inquiry-action="decline" data-inquiry-id="${escapeHTML(item.id)}">Decline</button></div></article>`).join('') : '<div class="inquiry-empty"><h3>No pending adoption inquiries</h3><p>Approved applications show on pet cards. Declined inquiries are removed from the queue.</p></div>';
    }
    function showEditor(pet = null) {
      form.reset();
      form.elements.id.value = pet?.id || '';
      form.elements.name.value = pet?.name || '';
      form.elements.species.value = pet?.species || 'Dog';
      form.elements.breed.value = pet?.breed || '';
      form.elements.age.value = pet?.age || '';
      form.elements.location.value = pet?.location || '';
      form.elements.image.value = pet?.image || '';
      form.elements.description.value = pet?.description || '';
      form.elements.status.value = pet?.status || 'Available';
      page.querySelector('[data-pet-feedback]').textContent = '';
      page.querySelector('#pet-dialog-title').textContent = pet ? 'Edit pet profile' : 'Add adoptable pet';
      if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', '');
    }
    function closeEditor() { if (dialog.close && dialog.open) dialog.close(); else dialog.removeAttribute('open'); }

    addButton.addEventListener('click', () => showEditor());
    page.querySelectorAll('[data-close-pet]').forEach((button) => button.addEventListener('click', closeEditor));
    dialog.addEventListener('click', (event) => { if (event.target === dialog) closeEditor(); });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const id = String(data.get('id') || '');
      const oldRecords = readPets();
      const old = oldRecords.find((pet) => String(pet.id) === id);
      const status = String(data.get('status') || 'Available');
      const pet = { ...(old || {}), id: id || `pet-${Date.now()}`, name: String(data.get('name')).trim(), species: String(data.get('species')), breed: String(data.get('breed')).trim(), age: String(data.get('age')).trim(), location: String(data.get('location')).trim(), image: safeImageURL(String(data.get('image') || '').trim()), description: String(data.get('description') || '').trim(), status, available: status !== 'Adopted', updatedAt: new Date().toISOString() };
      const next = id ? oldRecords.map((record) => String(record.id) === id ? pet : record) : [pet, ...oldRecords];
      if (save(PETS_KEY, next)) { closeEditor(); renderPets(); }
    });

    grid.addEventListener('click', (event) => {
      const edit = event.target.closest('[data-edit-pet]');
      if (edit) { const pet = readPets().find((record) => String(record.id) === edit.dataset.editPet); if (pet) showEditor(pet); return; }
      const remove = event.target.closest('[data-delete-pet]');
      if (!remove || !confirm('Delete this pet and its related inquiries?')) return;
      const petId = remove.dataset.deletePet;
      if (save(PETS_KEY, readPets().filter((pet) => String(pet.id) !== petId))) {
        save(INQUIRIES_KEY, readInquiries().filter((inquiry) => String(inquiry.petId) !== petId));
        renderPets(); renderInquiries();
      }
    });

    inquiryList.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-inquiry-action]');
      if (!button) return;
      const id = button.dataset.inquiryId;
      const action = button.dataset.inquiryAction;
      const all = readInquiries();
      const inquiry = all.find((item) => String(item.id) === id && (item.status || 'Pending') === 'Pending');
      if (!inquiry) return;
      const remaining = all.filter((item) => String(item.id) !== id);
      if (action === 'decline') { if (save(INQUIRIES_KEY, remaining)) renderInquiries(); return; }
      if (action !== 'approve') return;
      const petRecords = readPets();
      const petIndex = petRecords.findIndex((pet) => String(pet.id) === String(inquiry.petId) || String(pet.name).toLowerCase() === String(inquiry.petName || '').toLowerCase());
      if (petIndex < 0) { page.querySelector('[data-pet-feedback]').textContent = `Pet not found for ${inquiry.petName || 'this inquiry'}.`; return; }
      const oldPet = petRecords[petIndex];
      const newPetRecords = petRecords.slice();
      newPetRecords[petIndex] = { ...oldPet, status: 'Pending', acceptedApplicant: inquiry.applicant || 'Applicant', acceptedEmail: inquiry.email || '', acceptedAt: new Date().toISOString() };
      if (!save(PETS_KEY, newPetRecords)) return;
      if (!save(INQUIRIES_KEY, remaining)) { save(PETS_KEY, petRecords); return; }
      renderPets(); renderInquiries();
    });

    window.addEventListener('storage', (event) => { if (event.key === PETS_KEY || event.key === INQUIRIES_KEY || event.key === null) { renderPets(); renderInquiries(); } });
    renderPets();
    renderInquiries();
  }
})();
