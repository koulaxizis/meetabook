// ===== PUBLIC/SCRIPT.JS - ΤΕΛΙΚΗ ΈΚΔΟΣΗ ===== //

let quotes = [];
let tags = [];
let filteredQuotes = [];
let currentIndex = 0;
let activeTagId = null;
let isDetailsVisible = false;

// ===== ΦΟΡΤΩΣΗ ΔΕΔΟΜΕΝΩΝ =====
Promise.all([
  fetch('data/quotes.json').then(res => res.json()),
  fetch('data/tags.json').then(res => res.json())
])
.then(([quotesData, tagsData]) => {
  quotes = quotesData;
  tags = tagsData;
  console.log(`✅ Φορτώθηκαν ${quotes.length} γνωμικά & ${tags.length} tags.`);
  
  renderTags();
})
.catch(err => console.error("❌ Σφάλμα φόρτωσης δεδομένων:", err));

// ===== RENDER TAGS CLOUD =====
function renderTags() {
  const container = document.getElementById('tags-container');
  container.innerHTML = '';

  if (!tags || tags.length === 0) return;

  tags.forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'tag-button';
    btn.textContent = tag.label;
    btn.dataset.tagId = tag.id;
    btn.style.color = tag.color;
    
    // Hover effect
    btn.addEventListener('mouseenter', () => {
      btn.style.backgroundColor = tag.color;
      btn.style.color = 'white';
    });
    btn.addEventListener('mouseleave', () => {
      if (btn.dataset.tagId === activeTagId) return;
      btn.style.backgroundColor = '#f0f0f0';
      btn.style.color = tag.color;
    });
    
    btn.addEventListener('click', () => filterByTag(tag.id));
    container.appendChild(btn);
  });
}

// ===== FILTER BY TAG =====
function filterByTag(tagId) {
  const wasActive = activeTagId === tagId;
  
  // Clear previous active state
  document.querySelectorAll('.tag-button').forEach(btn => {
    btn.classList.remove('active');
    btn.style.backgroundColor = '#f0f0f0';
    btn.style.color = tags.find(t => t.id === btn.dataset.tagId)?.color || '#666';
  });

  if (wasActive) {
    // Deselect - show all quotes
    activeTagId = null;
    filteredQuotes = [...quotes];
    document.getElementById('active-tag-display').style.display = 'none';
  } else {
    // Select new tag
    activeTagId = tagId;
    const tagData = tags.find(t => t.id === tagId);
    
    // Highlight the button
    const activeBtn = document.querySelector(`[data-tag-id="${tagId}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
      activeBtn.style.backgroundColor = tagData.color;
      activeBtn.style.color = 'white';
    }

    // Filter quotes by BOTH regular tags AND product_tags
    filteredQuotes = quotes.filter(q => 
      q.tags?.includes(tagId) || 
      q.product_tags?.includes(tagId)
    );
    
    // Show active tag indicator
    const indicator = document.getElementById('active-tag-display');
    indicator.textContent = `${tagData.label}`;
    indicator.style.backgroundColor = `${tagData.color}20`;
    indicator.style.color = tagData.color;
    indicator.style.display = 'block';
  }

  if (filteredQuotes.length === 0) {
    alert(`Δεν βρέθηκαν γνωμικά για "${tags.find(t => t.id === tagId)?.label}".`);
    // Αν δεν υπάρχουν αποτελέσματα, επανέρχουμε στην αρχική κατάσταση αν θέλουμε
    // Εδώ απλά σταματάμε
    return;
  }

  currentIndex = 0;
  isDetailsVisible = false;
  document.getElementById('intro-section').classList.add('hidden');
  document.getElementById('result-section').classList.remove('hidden');
  updateUI(filteredQuotes);
}

// ===== RANDOM QUOTE BUTTON =====
document.getElementById('random-quote-btn').addEventListener('click', () => {
  const targetArray = activeTagId ? filteredQuotes : quotes;
  if (targetArray.length === 0) return alert("Δεν υπάρχουν διαθέσιμα γνωμικά.");

  const randomIndex = Math.floor(Math.random() * targetArray.length);
  showQuote(randomIndex, targetArray);
});

// ===== SHOW INITIAL QUOTE (Prompt Only) =====
function showQuote(index, sourceArray) {
  filteredQuotes = sourceArray;
  currentIndex = index;
  isDetailsVisible = false; // Reset visibility on new quote
  
  updateUI(sourceArray);
}

// ===== UPDATE UI WITH REVEAL LOGIC =====
function updateUI(sourceArray) {
  if (sourceArray.length === 0) return;

  const resultSection = document.getElementById('result-section');
  const quoteData = sourceArray[currentIndex];

  // Ensure section is visible and intro hidden
  resultSection.classList.remove('hidden');
  document.getElementById('intro-section').classList.add('hidden');

  // 1. Fill the PROMPT (Always visible initially)
  document.getElementById('quote-text').textContent = `"${quoteData.quote}"`;

  // 2. Fill the DETAILS (But keep them hidden until like)
  document.getElementById('author').textContent = `— ${quoteData.author}`;
  document.getElementById('source-book').textContent = `Πηγή: ${quoteData.source_book || 'Άγνωστο'}`;
  document.getElementById('price').textContent = quoteData.price || '';
  
  const coverImg = document.getElementById('cover-img');
  if (quoteData.cover_image) {
    coverImg.src = quoteData.cover_image;
    coverImg.style.display = 'block';
    coverImg.classList.remove('hidden-detail');
  } else {
    coverImg.style.display = 'none';
    coverImg.classList.add('hidden-detail');
  }

  if (quoteData.author_bio_short) {
    document.getElementById('author-bio-short').textContent = quoteData.author_bio_short;
  } else {
    document.getElementById('author-bio-short').textContent = '';
  }

  if (quoteData.optional?.author_full_bio) {
    document.getElementById('author-full-bio').textContent = quoteData.optional.author_full_bio;
  } else {
    document.getElementById('author-full-bio').textContent = 'Δεν υπάρχει αναλυτική βιογραφία.';
  }

  const interviewLink = document.getElementById('interview-link');
  if (quoteData.optional?.interview_link) {
    interviewLink.href = quoteData.optional.interview_link;
    interviewLink.style.display = 'inline-block';
  } else {
    interviewLink.style.display = 'none';
  }

  const buyLinkBtn = document.getElementById('buy-link');
  if (quoteData.buy_link) {
    buyLinkBtn.href = quoteData.buy_link;
    buyLinkBtn.style.display = 'inline-block';
  } else {
    buyLinkBtn.style.display = 'none';
  }

  // 3. RESET VISIBILITY STATE to Hidden (Initial State for New Quote)
  applyVisibilityState(false);

  // 4. Counters & Nav
  document.getElementById('result-counter').textContent = `${sourceArray.length} αποτέλεσμα${sourceArray.length !== 1 ? 'τα' : ''}`;
  document.getElementById('page-indicator').textContent = `${currentIndex + 1} / ${sourceArray.length}`;
  
  document.getElementById('prev-btn').disabled = currentIndex === 0;
  document.getElementById('next-btn').disabled = currentIndex === sourceArray.length - 1;
}

// ===== APPLY VISIBILITY STATE (Helper) =====
function applyVisibilityState(forceHidden = false) {
  const detailsSection = document.getElementById('details-section');
  const actionButtons = document.querySelector('.action-buttons');
  const likeBtn = document.getElementById('like-btn');

  if (isDetailsVisible && !forceHidden) {
    // Reveal Details
    detailsSection.classList.remove('details-hidden');
    detailsSection.classList.add('details-visible');
    
    actionButtons.style.display = 'flex';
    
    likeBtn.innerHTML = '❤️ ✅ Αποθηκεύτηκε';
    likeBtn.disabled = true;
    likeBtn.classList.add('liked');
  } else {
    // Hide Details
    detailsSection.classList.add('details-hidden');
    detailsSection.classList.remove('details-visible');
    
    actionButtons.style.display = 'flex';
    
    likeBtn.disabled = false;
    likeBtn.innerHTML = '❤️ Μου αρέσει!';
    likeBtn.classList.remove('liked');
  }
}

// ===== ACTION: LIKE BUTTON (Reveal Details) =====
document.getElementById('like-btn').addEventListener('click', () => {
  if (!isDetailsVisible) {
    isDetailsVisible = true;
    applyVisibilityState();
  }
});

// ===== ACTION: SKIP BUTTON (New Random Quote) =====
document.getElementById('skip-btn').addEventListener('click', () => {
  // If there are multiple results, pick a random one different from current
  if (filteredQuotes.length > 1) {
    const currentQuoteId = filteredQuotes[currentIndex].id;
    const candidates = filteredQuotes.filter(q => q.id !== currentQuoteId);
    
    if (candidates.length > 0) {
      const newRandomIndex = Math.floor(Math.random() * candidates.length);
      const originalIndex = filteredQuotes.indexOf(candidates[newRandomIndex]);
      
      showQuote(originalIndex, filteredQuotes);
    } else {
      // Fallback if somehow logic fails
      showQuote(0, filteredQuotes);
    }
  } else {
    // Only one quote available
    alert("Δεν υπάρχουν άλλα γνωμικά για να δεις!");
  }
});

// ===== NAVIGATION PREV/NEXT (Reset Visibility) =====
document.getElementById('prev-btn').addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
    isDetailsVisible = false;
    updateUI(filteredQuotes);
  }
});

document.getElementById('next-btn').addEventListener('click', () => {
  if (currentIndex < filteredQuotes.length - 1) {
    currentIndex++;
    isDetailsVisible = false;
    updateUI(filteredQuotes);
  }
});

// ===== SEARCH FUNCTION (Searches ALL Tags Including Product Tags) =====
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') performSearch();
});

function performSearch() {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) return alert("Παρακαλώ εισάγετε λέξη-κλειδί.");

  const baseArray = activeTagId ? filteredQuotes : quotes;
  
  // Search in: quote text, author, regular tags, PRODUCT TAGS, source book
  filteredQuotes = baseArray.filter(q =>
    q.quote.toLowerCase().includes(query) ||
    q.author.toLowerCase().includes(query) ||
    q.tags?.some(t => t.toLowerCase().includes(query)) ||
    q.product_tags?.some(t => t.toLowerCase().includes(query)) || 
    q.source_book?.toLowerCase().includes(query)
  );

  if (filteredQuotes.length === 0) {
    alert("Δεν βρέθηκαν αποτελέσματα για \"" + query + "\".");
    // Optional: Reset to all quotes or stay empty? Let's stay empty but user can click reset.
    document.getElementById('result-section').classList.remove('hidden');
    document.getElementById('result-counter').textContent = "0 αποτελέσματα";
    document.getElementById('page-indicator').textContent = "0 / 0";
    document.getElementById('quote-card').style.display = 'none';
    return;
  }

  currentIndex = 0;
  isDetailsVisible = false;
  
  // Update Indicator
  const indicator = document.getElementById('active-tag-display');
  if (activeTagId) {
    const tagData = tags.find(t => t.id === activeTagId);
    indicator.textContent = `${tagData.label} • Αναζήτηση: "${query}"`;
    indicator.style.backgroundColor = `${tagData.color}20`;
    indicator.style.color = tagData.color;
  } else {
    indicator.textContent = `Αναζήτηση: "${query}"`;
    indicator.style.backgroundColor = '#2d5a8720';
    indicator.style.color = '#2d5a87';
  }
  indicator.style.display = 'block';

  document.getElementById('intro-section').classList.add('hidden');
  document.getElementById('result-section').classList.remove('hidden');
  document.getElementById('quote-card').style.display = 'block';
  
  updateUI(filteredQuotes);
}

// ===== CLEAR ACTIVE FILTER (Optional: Click on indicator to clear if no search text) =====
document.getElementById('active-tag-display').addEventListener('click', () => {
  // If we want to allow clearing by clicking the badge
  if (activeTagId) {
    filterByTag(activeTagId); // Toggles off
  }
});