// Home page functionality
let menuItems = [];
let filteredItems = [];
let currentSlide = 0;

document.addEventListener('DOMContentLoaded', async () => {
    await initializePage();
    setupEventListeners();
    setupLocationSelector();
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

    // Filter button
    const filterBtn = document.getElementById('filterBtn');
    if (filterBtn) {
        filterBtn.addEventListener('click', showQuickFilters);
    }
}

function setupLocationSelector() {
    const locationSelector = document.getElementById('locationSelector');
    if (locationSelector) {
        locationSelector.addEventListener('click', showLocationModal);
    }

    // Load saved location
    const savedLocation = window.CommonUtils.storage.get('user_location', 'Select Location');
    const locationAddress = document.getElementById('currentLocation');
    if (locationAddress) {
        locationAddress.textContent = savedLocation;
    }
}

function showLocationModal() {
    const savedLocations = window.CommonUtils.storage.get('saved_locations', [
        'Home - 123 Main St, City, State 12345',
        'Work - 456 Business Ave, City, State 12345',
        'Mom\'s Place - 789 Family St, City, State 12345'
    ]);

    const modalHTML = `
        <div class="location-overlay active" id="locationOverlay">
            <div class="location-modal">
                <div class="location-header">
                    <h3>Select Delivery Location</h3>
                    <button class="close-location" onclick="closeLocationModal()">
                        <svg viewBox="0 0 24 24">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                <div class="location-content">
                    <div class="current-location-btn" onclick="useCurrentLocation()">
                        <svg viewBox="0 0 24 24">
                            <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
                        </svg>
                        <span>Use Current Location</span>
                    </div>
                    <div class="saved-locations">
                        <h4>Saved Locations</h4>
                        ${savedLocations.map((location, index) => `
                            <div class="location-item" onclick="selectLocation('${location}')">
                                <svg viewBox="0 0 24 24">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                </svg>
                                <span>${location}</span>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn-primary" onclick="addNewLocation()" style="width: 100%; margin-top: 16px;">
                        Add New Location
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Close on overlay click
    document.getElementById('locationOverlay').addEventListener('click', (e) => {
        if (e.target.id === 'locationOverlay') {
            closeLocationModal();
        }
    });
}

function showQuickFilters() {
    const filterHTML = `
        <div class="filter-overlay active" id="filterOverlay">
            <div class="filter-modal">
                <div class="filter-header">
                    <h3>Quick Filters</h3>
                    <button class="close-filter" onclick="closeFilterModal()">
                        <svg viewBox="0 0 24 24">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                <div class="filter-content">
                    <div class="filter-section">
                        <h4>Diet Preference</h4>
                        <div class="filter-options">
                            <button class="filter-option active" data-filter="all">All</button>
                            <button class="filter-option" data-filter="veg">Veg Only</button>
                            <button class="filter-option" data-filter="non-veg">Non-Veg</button>
                        </div>
                    </div>
                    <div class="filter-section">
                        <h4>Price Range</h4>
                        <div class="filter-options">
                            <button class="filter-option active" data-filter="all">All Prices</button>
                            <button class="filter-option" data-filter="low">Under ₹200</button>
                            <button class="filter-option" data-filter="medium">₹200-₹500</button>
                            <button class="filter-option" data-filter="high">Above ₹500</button>
                        </div>
                    </div>
                    <div class="filter-section">
                        <h4>Sort By</h4>
                        <div class="filter-options">
                            <button class="filter-option active" data-filter="popular">Popular</button>
                            <button class="filter-option" data-filter="rating">Rating</button>
                            <button class="filter-option" data-filter="price-low">Price: Low to High</button>
                            <button class="filter-option" data-filter="price-high">Price: High to Low</button>
                        </div>
                    </div>
                </div>
                <div class="filter-actions">
                    <button class="btn-secondary" onclick="clearFilters()">Clear All</button>
                    <button class="btn-primary" onclick="applyFilters()">Apply Filters</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', filterHTML);

    // Setup filter option listeners
    document.querySelectorAll('.filter-option').forEach(option => {
        option.addEventListener('click', (e) => {
            const section = e.target.closest('.filter-section');
            section.querySelectorAll('.filter-option').forEach(opt => opt.classList.remove('active'));
            e.target.classList.add('active');
        });
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

// Global functions for modals
window.closeLocationModal = () => {
    const overlay = document.getElementById('locationOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 300);
    }
};

window.selectLocation = (location) => {
    const locationAddress = document.getElementById('currentLocation');
    if (locationAddress) {
        locationAddress.textContent = location.split(' - ')[1] || location;
    }
    window.CommonUtils.storage.set('user_location', location);
    window.CommonUtils.showToast('Location updated', 'success');
    window.closeLocationModal();
};

window.useCurrentLocation = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location = 'Current Location';
                window.selectLocation(location);
            },
            (error) => {
                window.CommonUtils.showToast('Unable to get current location', 'error');
            }
        );
    } else {
        window.CommonUtils.showToast('Geolocation not supported', 'error');
    }
};

window.addNewLocation = () => {
    window.CommonUtils.showToast('Add location form would open here', 'info');
    window.closeLocationModal();
};

window.closeFilterModal = () => {
    const overlay = document.getElementById('filterOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 300);
    }
};

window.clearFilters = () => {
    document.querySelectorAll('.filter-option').forEach(option => {
        option.classList.remove('active');
    });
    document.querySelectorAll('.filter-section').forEach(section => {
        section.querySelector('.filter-option').classList.add('active');
    });
};

window.applyFilters = () => {
    window.CommonUtils.showToast('Filters applied', 'success');
    window.closeFilterModal();
};
