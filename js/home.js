// Home page functionality
let menuItems = [];
let filteredItems = [];
let currentSlide = 0;

document.addEventListener('DOMContentLoaded', async () => {
    await initializePage();
    setupEventListeners();
    startCarousel();
});

async function initializePage() {
    showLoading(document.getElementById('skeletonLoader'));
    
    try {
        // Load menu items
        menuItems = await window.FirebaseService.getMenuItems();
        filteredItems = menuItems;
        
        // Display featured items (popular items)
        displayFeaturedItems();
        
    } catch (error) {
        console.error('Error initializing page:', error);
        window.CommonUtils.showToast('Error loading menu items', 'error');
    } finally {
        hideLoading(document.getElementById('skeletonLoader'));
    }
}

function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        const debouncedSearch = window.searchManager.debounce(handleSearch, 300);
        searchInput.addEventListener('input', debouncedSearch);
    }

    // Category filter
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
        item.addEventListener('click', () => handleCategoryFilter(item));
    });

    // Carousel dots
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => goToSlide(index));
    });
}

async function handleSearch(event) {
    const query = event.target.value.trim();
    
    if (!query) {
        filteredItems = menuItems;
        displayFeaturedItems();
        return;
    }

    try {
        filteredItems = await window.searchManager.searchItems(query, menuItems);
        displaySearchResults(filteredItems, query);
    } catch (error) {
        console.error('Error searching:', error);
        window.CommonUtils.showToast('Search failed', 'error');
    }
}

function handleCategoryFilter(selectedItem) {
    // Update active state
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('active');
    });
    selectedItem.classList.add('active');

    // Filter items
    const category = selectedItem.dataset.category;
    
    if (category === 'all') {
        filteredItems = menuItems;
    } else {
        filteredItems = menuItems.filter(item => item.category === category);
    }
    
    displayFeaturedItems();
}

function displayFeaturedItems() {
    const featuredGrid = document.getElementById('featuredGrid');
    if (!featuredGrid) return;

    // Show popular items first, then others
    const popularItems = filteredItems.filter(item => item.isPopular);
    const otherItems = filteredItems.filter(item => !item.isPopular);
    const itemsToShow = [...popularItems, ...otherItems].slice(0, 8);

    featuredGrid.innerHTML = itemsToShow.map(item => createFeaturedItemHTML(item)).join('');
    
    // Add event listeners to add buttons
    featuredGrid.querySelectorAll('.add-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const itemId = btn.dataset.itemId;
            const item = menuItems.find(i => i.id === itemId);
            if (item) {
                handleAddToCart(item, btn);
            }
        });
    });
}

function displaySearchResults(results, query) {
    const featuredSection = document.querySelector('.featured-section');
    const featuredGrid = document.getElementById('featuredGrid');
    
    if (!featuredSection || !featuredGrid) return;

    // Update section title
    const sectionTitle = featuredSection.querySelector('h3');
    sectionTitle.textContent = `Search Results for "${query}"`;
    
    if (results.length === 0) {
        featuredGrid.innerHTML = `
            <div class="no-results">
                <h4>No items found</h4>
                <p>Try searching with different keywords</p>
                <button class="btn-primary" onclick="clearSearch()">Browse All Items</button>
            </div>
        `;
        return;
    }

    featuredGrid.innerHTML = results.map(item => createFeaturedItemHTML(item)).join('');
    
    // Add event listeners
    featuredGrid.querySelectorAll('.add-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const itemId = btn.dataset.itemId;
            const item = menuItems.find(i => i.id === itemId);
            if (item) {
                handleAddToCart(item, btn);
            }
        });
    });
}

function createFeaturedItemHTML(item) {
    const cartItem = window.cartManager.getItem(item.id);
    const isInCart = cartItem && cartItem.quantity > 0;

    return `
        <div class="featured-item" data-item-id="${item.id}">
            <img src="${item.imageURL}" alt="${item.name}" loading="lazy">
            <div class="featured-content">
                <h4>${item.name}</h4>
                <div class="item-details">
                    <span class="item-price">${window.CommonUtils.formatCurrency(item.price)}</span>
                    <div class="item-rating">
                        <span class="rating-star">⭐</span>
                        <span>${item.rating}</span>
                    </div>
                </div>
                <button class="add-btn" data-item-id="${item.id}">
                    ${isInCart ? 
                        `<svg viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>Added` : 
                        `<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>Add`
                    }
                </button>
            </div>
        </div>
    `;
}

async function handleAddToCart(item, button) {
    // Add loading state
    button.classList.add('loading');
    button.disabled = true;

    try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        window.cartManager.addItem(item);
        
        // Update button state
        button.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
            </svg>Added
        `;
        
        window.CommonUtils.showToast(`${item.name} added to cart`, 'success', 2000);
        
    } catch (error) {
        console.error('Error adding to cart:', error);
        window.CommonUtils.showToast('Failed to add item to cart', 'error');
    } finally {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Reset to show all featured items
    filteredItems = menuItems;
    displayFeaturedItems();
    
    // Reset section title
    const sectionTitle = document.querySelector('.featured-section h3');
    if (sectionTitle) {
        sectionTitle.textContent = 'Featured Dishes';
    }
}

// Carousel functionality
function startCarousel() {
    const track = document.getElementById('heroCarousel');
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.dot');
    
    if (!track || slides.length === 0) return;

    // Auto-advance carousel
    setInterval(() => {
        currentSlide = (currentSlide + 1) % slides.length;
        updateCarousel();
    }, 5000);

    // Touch/swipe support
    let startX = 0;
    let isDragging = false;

    track.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
    });

    track.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
    });

    track.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        
        const endX = e.changedTouches[0].clientX;
        const diff = startX - endX;
        
        if (Math.abs(diff) > 50) { // Minimum swipe distance
            if (diff > 0) {
                // Swipe left - next slide
                currentSlide = (currentSlide + 1) % slides.length;
            } else {
                // Swipe right - previous slide
                currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            }
            updateCarousel();
        }
        
        isDragging = false;
    });
}

function goToSlide(index) {
    currentSlide = index;
    updateCarousel();
}

function updateCarousel() {
    const track = document.getElementById('heroCarousel');
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.dot');
    
    if (!track || slides.length === 0) return;

    // Update track position
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    // Update slide active states
    slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === currentSlide);
    });
    
    // Update dots
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
}

// Listen for cart changes to update button states
window.addEventListener('cartChanged', () => {
    // Re-render featured items to update button states
    if (filteredItems.length > 0) {
        displayFeaturedItems();
    }
});

// Export functions for global access
window.HomePageFunctions = {
    clearSearch,
    goToSlide
};