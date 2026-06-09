// ===== ART QUOTES SITE - SCRIPT.JS ===== //
// URL: https://koulaxizis.github.io/meetabook/

let quotes = [];
let tags = [];
let filteredQuotes = [];
let currentIndex = 0;
let activeTagId = null;
let isDetailsVisible = false;

// ===== LOAD DATA =====
async function loadData() {
    try {
        console.log("🔄 Προσπάθεια φόρτωσης JSON...");
        
        // ΣΧΕΤΙΚΑ PATHS για το meetabook repo
        const [quotesRes, tagsRes] = await Promise.all([
            fetch('data/quotes.json'),
            fetch('data/tags.json')
        ]);

        if (!quotesRes.ok || !tagsRes.ok) {
            throw new Error(`HTTP Error: ${!quotesRes.ok ? quotesRes.status : tagsRes.status}`);
        }

        const quotesData = await quotesRes.json();
        const tagsData = await tagsRes.json();

        quotes = quotesData;
        tags = tagsData;
        
        console.log(`✅ Επιτυχία! Φορτώθηκαν ${quotes.length} quotes & ${tags.length} tags.`);
        renderTags();
    } catch (error) {
        console.error("❌ ΣΦΑΛΜΑ ΦΟΡΤΩΣΗΣ:", error);
        
        const msg = "❌ Δεν μπόρεσα να φορτώσω τα δεδομένα.\n\n" +
                    "Παρακαλώ έλεγξε:\n" +
                    "1. Τα αρχεία data/quotes.json και data/tags.json υπάρχουν στο repo\n" +
                    "2. GitHub Pages Settings → Folder: / (root)\n" +
                    "3. Refresh της σελίδας";
        alert(msg);
        
        // Fallback για testing
        if (quotes.length === 0) {
            console.warn("⚠️ Χρήση fallback data.");
            quotes = [{
                id: "demo-1",
                quote: "Δεν βρέθηκαν δεδομένα.",
                author: "System",
                source_book: "Test",
                tags: ["demo"],
                product_tags: ["demo"],
                optional: {}
            }];
            tags = [{id: "demo", label: "Demo", color: "#333"}];
            renderTags();
        }
    }
}

loadData();

// ===== RENDER TAGS CLOUD =====
function renderTags() {
    const container = document.getElementById('tags-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!tags || tags.length === 0) {
        container.innerHTML = '<span style="color:red">Δεν βρέθηκαν Tags.</span>';
        return;
    }
    
    tags.forEach(tag => {
        const btn = document.createElement('button');
        btn.className = 'tag-button';
        btn.textContent = tag.label;
        btn.dataset.tagId = tag.id;
        btn.style.color = tag.color;
        
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
        const tColor = tags.find(t => t.id === btn.dataset.tagId)?.color || '#666';
        btn.style.color = tColor;
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
    if (targetArray.length === 0) { 
        console.error("No quotes available for random selection.");
        alert("Δεν υπάρχουν διαθέσιμα γνωμικά."); 
        return; 
    }
    const randomIndex = Math.floor(Math.random() * targetArray.length);
    showQuote(randomIndex, targetArray);
});

// ===== SHOW INITIAL QUOTE =====
function showQuote(index, sourceArray) {
    filteredQuotes = sourceArray;
    currentIndex = index;
    isDetailsVisible = false;
    updateUI(sourceArray);
}

// ===== UPDATE UI WITH REVEAL LOGIC =====
function updateUI(sourceArray) {
    if (!sourceArray || sourceArray.length === 0) return;
    
    const quoteData = sourceArray[currentIndex];

    // Ensure sections are visible
    document.getElementById('result-section').classList.remove('hidden');
    document.getElementById('intro-section').classList.add('hidden');

    // 1. Fill the PROMPT (Always visible initially)
    document.getElementById('quote-text').textContent = `"${quoteData.quote}"`;

    // 2. Fill the DETAILS (But keep them hidden until like)
    document.getElementById('author').textContent = `— ${quoteData.author}`;
    document.getElementById('source-book').textContent = `Πηγή: ${quoteData.source_book || 'Άγνωστο'}`;
    document.getElementById('price').textContent = quoteData.price || '';
    
    const coverImg = document.getElementById('cover-img');
    if (quoteData.cover_image && quoteData.cover_image !== "") {
        coverImg.src = quoteData.cover_image;
        coverImg.style.display = 'block';
    } else {
        coverImg.style.display = 'none';
    }

    document.getElementById('author-bio-short').textContent = quoteData.author_bio_short || '';
    document.getElementById('author-full-bio').textContent = quoteData.optional?.author_full_bio || 'Δεν υπάρχει αναλυτική βιογραφία.';

    const interviewLink = document.getElementById('interview-link');
    interviewLink.style.display = (quoteData.optional?.interview_link) ? 'inline-block' : 'none';
    if(quoteData.optional?.interview_link) interviewLink.href = quoteData.optional.interview_link;

    const buyLinkBtn = document.getElementById('buy-link');
    buyLinkBtn.style.display = (quoteData.buy_link) ? 'inline-block' : 'none';
    if(quoteData.buy_link) buyLinkBtn.href = quoteData.buy_link;

    // 3. RESET VISIBILITY STATE to Hidden
    applyVisibilityState(false);

    // 4. Counters & Nav
    document.getElementById('result-counter').textContent = `${sourceArray.length} αποτέλεσμα${sourceArray.length !== 1 ? 'τα' : ''}`;
    document.getElementById('page-indicator').textContent = `${currentIndex + 1} / ${sourceArray.length}`;
    
    document.getElementById('prev-btn').disabled = currentIndex === 0;
    document.getElementById('next-btn').disabled = currentIndex === sourceArray.length - 1;
}

// ===== APPLY VISIBILITY STATE =====
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
    } else {
        // Hide Details
        detailsSection.classList.add('details-hidden');
        detailsSection.classList.remove('details-visible');
        actionButtons.style.display = 'flex';
        likeBtn.disabled = false;
        likeBtn.innerHTML = '❤️ Μου αρέσει!';
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
    if (filteredQuotes.length > 1) {
        const currentQuoteId = filteredQuotes[currentIndex].id;
        const candidates = filteredQuotes.filter(q => q.id !== currentQuoteId);
        if (candidates.length > 0) {
            const newRandomIndex = Math.floor(Math.random() * candidates.length);
            const originalIndex = filteredQuotes.indexOf(candidates[newRandomIndex]);
            showQuote(originalIndex, filteredQuotes);
        }
    } else {
        alert("Δεν υπάρχουν άλλα γνωμικά!");
    }
});

// ===== NAVIGATION PREV/NEXT =====
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

// ===== SEARCH FUNCTION =====
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
    
    console.log(`Searching for: "${query}" in ${baseArray.length} items.`);
    
    filteredQuotes = baseArray.filter(q =>
        q.quote.toLowerCase().includes(query) ||
        q.author.toLowerCase().includes(query) ||
        q.tags?.some(t => t.toLowerCase().includes(query)) ||
        q.product_tags?.some(t => t.toLowerCase().includes(query)) || 
        q.source_book?.toLowerCase().includes(query)
    );

    console.log(`Found: ${filteredQuotes.length} results.`);

    if (filteredQuotes.length === 0) {
        alert("Δεν βρέθηκαν αποτελέσματα για \"" + query + "\".");
        return;
    }

    currentIndex = 0;
    isDetailsVisible = false;
    
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

// ===== CLEAR ACTIVE FILTER (Click on indicator) =====
document.getElementById('active-tag-display').addEventListener('click', () => {
    if (activeTagId) filterByTag(activeTagId);
});