(() => {
  'use strict';

  const PETS_KEY = 'pets';
  const INQUIRIES_KEY = 'pawlinkAdoptionInquiries';
  const PET_SEEDS = [
    { id: 'pawlink-pet-olive', name: 'Olive', species: 'Dog', breed: 'Labrador mix', age: '2 years', location: 'Portland, OR', image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=85', description: 'A gentle, sunny companion who loves long walks and meeting new friends.', status: 'Available', available: true },
    { id: 'pawlink-pet-pepper', name: 'Pepper', species: 'Cat', breed: 'Domestic shorthair', age: '8 months', location: 'Seattle, WA', image: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=900&q=85', description: 'Curious, playful, and happiest curled up somewhere cozy after a little adventure.', status: 'Available', available: true },
    { id: 'pawlink-pet-benny', name: 'Benny', species: 'Dog', breed: 'Beagle', age: '4 years', location: 'Austin, TX', image: 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?auto=format&fit=crop&w=900&q=85', description: 'A sweet-natured friend with excellent sniffing skills and a very waggy tail.', status: 'Pending', available: true },
    { id: 'pawlink-pet-sage', name: 'Sage', species: 'Cat', breed: 'Tuxedo cat', age: '1 year', location: 'Denver, CO', image: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=900&q=85', description: 'An affectionate lap cat who enjoys quiet afternoons and gentle play.', status: 'Available', available: true },
    { id: 'pawlink-pet-coco', name: 'Coco', species: 'Dog', breed: 'Terrier mix', age: '3 years', location: 'Madison, WI', image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87c?auto=format&fit=crop&w=900&q=85', description: 'Small in size and big in personality. Coco is ready to be your sidekick.', status: 'Available', available: true },
    { id: 'pawlink-pet-maple', name: 'Maple', species: 'Cat', breed: 'Calico', age: '2 years', location: 'Raleigh, NC', image: 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=900&q=85', description: 'A calm, confident friend who would love a sunny window and a forever home.', status: 'Available', available: true }
  ];
  const INQUIRY_SEEDS = [
    { id: 'pawlink-inquiry-104', petId: 'pawlink-pet-olive', petName: 'Olive', applicant: 'Casey Johnson', email: 'casey.j@example.com', note: 'We have a fenced yard and an older dog who would love a companion.', createdAt: '2025-03-08T13:15:00.000Z', status: 'Pending' },
    { id: 'pawlink-inquiry-103', petId: 'pawlink-pet-pepper', petName: 'Pepper', applicant: 'Riley Chen', email: 'riley.chen@example.com', note: 'I work from home and can offer plenty of company and playtime.', createdAt: '2025-03-08T10:20:00.000Z', status: 'Pending' },
    { id: 'pawlink-inquiry-102', petId: 'pawlink-pet-coco', petName: 'Coco', applicant: 'Jordan Blake', email: 'j.blake@example.com', note: 'Coco sounds like a perfect match for our active family.', createdAt: '2025-03-07T17:05:00.000Z', status: 'Pending' }
  ];

  // app.js replaces the shell at DOMContentLoaded; initialize after it so the
  // page controls remain in the DOM and receive their listeners.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAdoption, { once: true });
  else initAdoption();

  function initAdoption() {
    const page = document.querySelector('[data-adopt-page]');
    if (!page || page.dataset.adoptInitialized === 'true') return;
    const grid = page.querySelector('[data-pet-grid]');
    const inquiryList = page.querySelector('[data-inquiry-list]');
    const dialog = page.querySelector('[data-pet-dialog]');
    const form = page.querySelector('[data-pet-form]');
    if (!grid || !inquiryList || !dialog || !form) {
      console.error('Adoption page is missing required controls.');
      return;
    }
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
        const value = JSON.parse(localStorage.getItem(key) || 'null');
        if (Array.isArray(value)) return value.filter((item) => item && typeof item === 'object');
      } catch (error) { console.warn(`Invalid ${key} data; restoring starter data.`, error); }
      localStorage.setItem(key, JSON.stringify(seed));
      return seed.slice();
    }
    const pets = () => readArray(PETS_KEY, PET_SEEDS);
    const inquiries = () => readArray(INQUIRIES_KEY, INQUIRY_SEEDS);
    function save(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); return true; }
      catch (error) {
        console.error(`Unable to save ${key}.`, error);
        const feedback = page.querySelector('[data-pet-feedback]');
        if (feedback) feedback.textContent = 'Could not save your changes. Check available browser storage and try again.';
        return false;
      }
    }
    if (localStorage.getItem(PETS_KEY) === null) save(PETS_KEY, PET_SEEDS);
    if (localStorage.getItem(INQUIRIES_KEY) === null) save(INQUIRIES_KEY, INQUIRY_SEEDS);

    function renderPets() {
      const entries = pets();
      const count = page.querySelector('[data-pet-count]');
      if (count) count.textContent = `${entries.length} ${entries.length === 1 ? 'profile' : 'profiles'}`;
      if (!entries.length) {
        grid.innerHTML = '<div class="pet-empty"><span aria-hidden="true">🐾</span><h2>No pet profiles yet</h2><p>Add an adoptable pet to get started.</p></div>';
        return;
      }
      grid.innerHTML = entries.map((pet) => {
        const image = safeImageURL(pet.image);
        const status = ['Available', 'Pending', 'Adopted'].includes(pet.status) ? pet.status : 'Available';
        const slug = status.toLowerCase();
        const id = escapeHTML(pet.id);
        return `<article class="pet-card" data-pet-id="${id}"><div class="pet-photo-frame">${image ? `<img class="pet-photo" src="${escapeHTML(image)}" alt="${escapeHTML(pet.name)}" loading="lazy">` : '<div class="pet-photo-placeholder" aria-hidden="true">🐾</div>'}<span class="pet-status status-${slug}">${status}</span><div class="pet-card-actions"><button type="button" data-edit-pet="${id}" aria-label="Edit ${escapeHTML(pet.name)}">Edit</button><button type="button" data-delete-pet="${id}" aria-label="Delete ${escapeHTML(pet.name)}">Delete</button></div></div><div class="pet-card-content"><div class="pet-title-row"><h3>${escapeHTML(pet.name)}</h3><span>${escapeHTML(pet.species)}</span></div><p class="pet-details">${escapeHTML(pet.breed)} <span>·</span> ${escapeHTML(pet.age)}</p><p class="pet-location"><span aria-hidden="true">⌖</span> ${escapeHTML(pet.location)}</p>${pet.description ? `<p class="pet-description">${escapeHTML(pet.description)}</p>` : ''}${pet.acceptedApplicant ? `<div class="accepted-applicant"><span class="accepted-check" aria-hidden="true">✓</span><span><strong>Application accepted</strong><small>${escapeHTML(pet.acceptedApplicant)} · ${escapeHTML(pet.acceptedAt ? dateLabel(pet.acceptedAt) : 'Recently')}</small></span></div>` : ''}</div></article>`;
      }).join('');
    }

    function renderInquiries() {
      const all = inquiries().slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      const pending = all.filter((item) => item.status === 'Pending');
      const count = page.querySelector('[data-pending-count]');
      if (count) count.textContent = `${pending.length} pending`;
      if (!pending.length) {
        inquiryList.innerHTML = '<div class="inquiry-empty"><span aria-hidden="true">✉</span><h3>No pending adoption inquiries</h3><p>Approved applications appear on their pet cards. Declined inquiries are removed from this queue.</p></div>';
        return;
      }
      inquiryList.innerHTML = pending.map((inquiry) => `<article class="inquiry-card"><span class="inquiry-avatar" aria-hidden="true">${escapeHTML((inquiry.applicant || 'A').trim().charAt(0).toUpperCase())}</span><div class="inquiry-details"><div class="inquiry-name-row"><h3>${escapeHTML(inquiry.applicant || 'Applicant')}</h3><span class="inquiry-status inquiry-pending">Pending</span></div><p class="inquiry-pet">Interested in <strong>${escapeHTML(inquiry.petName || 'a PawLink pet')}</strong> · ${escapeHTML(dateLabel(inquiry.createdAt))}</p><p class="inquiry-note">${escapeHTML(inquiry.note || 'No message provided.')}</p><a class="inquiry-email" href="mailto:${escapeHTML(inquiry.email || '')}">${escapeHTML(inquiry.email || 'No email provided')}</a></div><div class="inquiry-actions"><button class="button approve-button" type="button" data-inquiry-action="Approved" data-inquiry-id="${escapeHTML(inquiry.id)}">Approve</button><button class="button decline-button" type="button" data-inquiry-action="Declined" data-inquiry-id="${escapeHTML(inquiry.id)}">Decline</button></div></article>`).join('');
    }

    function openPetEditor(pet = null) {
      form.reset();
      form.elements.id.value = pet?.id || '';
      form.elements.name.value = pet?.name || '';
      form.elements.species.value = pet?.species || 'Dog';
      form.elements.breed.value = pet?.breed || '';
      form.elements.age.value = pet?.age || '';
      form.elements.location.value = pet?.location || '';
      form.elements.image.value = pet?.image && !pet.image.startsWith('data:') ? pet.image : '';
      form.elements.description.value = pet?.description || '';
      form.elements.status.value = pet?.status || 'Available';
      const feedback = page.querySelector('[data-pet-feedback]');
      if (feedback) feedback.textContent = '';
      page.querySelector('#pet-dialog-title').textContent = pet ? 'Edit pet profile' : 'Add adoptable pet';
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    }
    function closePetDialog() {
      if (typeof dialog.close === 'function' && dialog.open) dialog.close();
      else dialog.removeAttribute('open');
    }

    page.querySelector('[data-add-pet]').addEventListener('click', () => openPetEditor());
    page.querySelectorAll('[data-close-pet]').forEach((button) => button.addEventListener('click', closePetDialog));
    dialog.addEventListener('click', (event) => { if (event.target === dialog) closePetDialog(); });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const id = String(data.get('id') || '');
      const current = pets();
      const existing = current.find((pet) => String(pet.id) === id);
      const status = String(data.get('status') || 'Available');
      const updatedPet = { ...(existing || {}), id: id || `pet-${Date.now()}`, name: String(data.get('name') || '').trim(), species: String(data.get('species') || 'Other'), breed: String(data.get('breed') || '').trim(), age: String(data.get('age') || '').trim(), location: String(data.get('location') || '').trim(), image: safeImageURL(String(data.get('image') || '').trim()), description: String(data.get('description') || '').trim(), status, available: status !== 'Adopted', updatedAt: new Date().toISOString() };
      const next = id ? current.map((pet) => String(pet.id) === id ? updatedPet : pet) : [updatedPet, ...current];
      if (save(PETS_KEY, next)) { closePetDialog(); renderPets(); }
    });

    grid.addEventListener('click', (event) => {
      const edit = event.target.closest('[data-edit-pet]');
      if (edit) { const pet = pets().find((item) => String(item.id) === edit.dataset.editPet); if (pet) openPetEditor(pet); return; }
      const remove = event.target.closest('[data-delete-pet]');
      if (!remove || !confirm('Delete this pet profile? Related inquiries will also be removed.')) return;
      const petId = remove.dataset.deletePet;
      const keptPets = pets().filter((pet) => String(pet.id) !== petId);
      const keptInquiries = inquiries().filter((inquiry) => String(inquiry.petId) !== petId);
      if (save(PETS_KEY, keptPets)) save(INQUIRIES_KEY, keptInquiries);
      renderPets(); renderInquiries();
    });

    inquiryList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-inquiry-action]');
      if (!button) return;
      const inquiryId = button.dataset.inquiryId;
      const action = button.dataset.inquiryAction;
      const currentInquiries = inquiries();
      const inquiry = currentInquiries.find((item) => String(item.id) === inquiryId && item.status === 'Pending');
      if (!inquiry) return;
      if (action === 'Declined') {
        // Declined applications are removed from the review queue and storage.
        if (save(INQUIRIES_KEY, currentInquiries.filter((item) => String(item.id) !== inquiryId))) renderInquiries();
        return;
      }
      if (action !== 'Approved') return;
      const currentPets = pets();
      const pet = currentPets.find((item) => String(item.id) === String(inquiry.petId));
      const nextPets = pet ? currentPets.map((item) => String(item.id) === String(inquiry.petId) ? { ...item, status: 'Pending', available: true, acceptedApplicant: inquiry.applicant || 'Applicant', acceptedEmail: inquiry.email || '', acceptedAt: new Date().toISOString() } : item) : currentPets;
      const nextInquiries = currentInquiries.filter((item) => String(item.id) !== inquiryId);
      // Persist both sides of approval: pet card gets the accepted application,
      // and the resolved inquiry leaves the pending queue.
      if (save(PETS_KEY, nextPets) && save(INQUIRIES_KEY, nextInquiries)) { renderPets(); renderInquiries(); }
    });

    window.addEventListener('storage', (event) => {
      if (event.key === PETS_KEY || event.key === INQUIRIES_KEY || event.key === null) { renderPets(); renderInquiries(); }
    });
    window.addEventListener('focus', () => { renderPets(); renderInquiries(); });
    renderPets();
    renderInquiries();
  }
})();
