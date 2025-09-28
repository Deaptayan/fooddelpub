// Menu page functionality
let menuItems = [];
let filteredItems = [];
let currentFilters = {
    category: 'all',
    dietType: 'all',
    priceRange: 'all',
    searchQuery: ''
};

document.addEventListener('DOMContentLoaded', async () => {
    await initializePage();
    setupEventListeners();
});

async function initializePage() {
    showLoading(document.getElementById('skeletonLoader'));
    
    try {
        // Load menu items
        menuItems = await window.FirebaseService.getMenuItems();
        filteredItems = menuItems;
        
        // Display all menu items
        displayMenuItems();
        
    } catch (error) {
        console.error('Error initializing menu page:', error);
        window.CommonUtils.showToast('Error loading menu items', 'error');
    } finally {
        hideLoading(document.getElementById('skeletonLoader'));
    }
}

function setupEventListeners() {
    // Search toggle
    const searchToggle = document.getElementById('searchToggle');
    const searchContainer = document.getElementById('searchContainer');
    
    if (searchToggle && searchContainer) {
        searchToggle.addEventListener('click', () => {
            searchContainer.classList.toggle('show');
            const searchInput = document.getElementById('menuSearch');
            if (searchContainer.classList.contains('show') && searchInput) {
                setTimeout(() => searchInput.focus(), 100);
            }
        });
    }

    // Search functionality
    const searchInput = document.getElementById('menuSearch');
    if (searchInput) {
        const debouncedSearch = window.searchManager.debounce(handleSearch, 300);
        searchInput.addEventListener('input', debouncedSearch);
    }

    // Filter tabs
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => handleFilterChange(tab));
    });

    // Category tabs
    const categoryTabs = document.querySelectorAll('.category-tab');
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => handleCategoryChange(tab));
    });

    // Price filter
    const priceFilter = document.getElementById('priceFilter');
    if (priceFilter) {
        priceFilter.addEventListener('change', handlePriceFilter);
    }
}

async function handleSearch(event) {
    const query = event.target.value.trim();
    currentFilters.searchQuery = query;
    
    await applyFilters();
}

function handleFilterChange(selectedTab) {
    // Update active state
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    selectedTab.classList.add('active');

    // Update filter
    currentFilters.dietType = selectedTab.dataset.filter;
    applyFilters();
}

function handleCategoryChange(selectedTab) {
    // Update active state
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    selectedTab.classList.add('active');

    // Update filter
    currentFilters.category = selectedTab.dataset.category;
    applyFilters();
}

function handlePriceFilter() {
    const priceFilter = document.getElementById('priceFilter');
    currentFilters.priceRange = priceFilter.value;
    applyFilters();
}

async function applyFilters() {
    let items = [...menuItems];

    // Apply search filter
    if (currentFilters.searchQuery) {
        items = await window.searchManager.searchItems(currentFilters.searchQuery, items);
    }

    // Apply category filter
    if (currentFilters.category !== 'all') {
        items = items.filter(item => item.category === currentFilters.category);
    }

    // Apply diet type filter
    if (currentFilters.dietType !== 'all') {
        if (currentFilters.dietType === 'veg') {
            items = items.filter(item => item.isVeg);
        } else if (currentFilters.dietType === 'non-veg') {
            items = items.filter(item => !item.isVeg);
        } else if (currentFilters.dietType === 'popular') {
            items = items.filter(item => item.isPopular);
        }
    }

    // Apply price filter
    if (currentFilters.priceRange !== 'all') {
        items = items.filter(item => {
            if (currentFilters.priceRange === 'low') return item.price < 200;
            if (currentFilters.priceRange === 'medium') return item.price >= 200 && item.price <= 500;
            if (currentFilters.priceRange === 'high') return item.price > 500;
            return true;
        });
    }

    filteredItems = items;
    displayMenuItems();
}

function displayMenuItems() {
    const menuGrid = document.getElementById('menuGrid');
    if (!menuGrid) return;

    if (filteredItems.length === 0) {
        menuGrid.innerHTML = `
            <div class="no-results">
                <h4>No items found</h4>
                <p>Try adjusting your filters or search terms</p>
                <button class="btn-primary" onclick="clearAllFilters()">Clear Filters</button>
            </div>
        `;
        return;
    }

    menuGrid.innerHTML = filteredItems.map(item => createMenuItemHTML(item)).join('');
    
    // Add event listeners
    setupMenuItemListeners();
}

function createMenuItemHTML(item) {
    const cartItem = window.cartManager.getItem(item.id);
    const quantity = cartItem ? cartItem.quantity : 0;

    return `
        <div class="menu-item" data-item-id="${item.id}">
            ${item.isPopular ? '<div class="popular-badge">Popular</div>' : ''}
            <div class="menu-item-content">
                <img src="${item.imageURL}" alt="${item.name}" class="menu-item-image" loading="lazy">
                <div class="menu-item-info">
                    <div class="menu-item-header">
                        <h4 class="menu-item-title">${item.name}</h4>
                        <div class="veg-indicator ${item.isVeg ? 'veg' : 'non-veg'}"></div>
                    </div>
                    <p class="menu-item-description">${item.description}</p>
                    <div class="menu-item-footer">
                        <div class="menu-item-details">
                            <span class="menu-item-price">${window.CommonUtils.formatCurrency(item.price)}</span>
                            <div class="menu-item-rating">
                                <span class="rating-star">⭐</span>
                                <span>${item.rating}</span>
                            </div>
                        </div>
                        ${quantity > 0 ? 
                            `<div class="quantity-controls">
                                <button class="qty-btn minus" data-item-id="${item.id}">-</button>
                                <span class="qty-display">${quantity}</span>
                                <button class="qty-btn plus" data-item-id="${item.id}">+</button>
                            </div>` :
                            `<button class="menu-add-btn" data-item-id="${item.id}">
                                <svg viewBox="0 0 24 24">
                                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                                </svg>Add
                            </button>`
                        }
                    </div>
                </div>
            </div>
        </div>
    `;
}

function setupMenuItemListeners() {
    const menuGrid = document.getElementById('menuGrid');
    if (!menuGrid) return;

    // Add to cart buttons
    menuGrid.querySelectorAll('.menu-add-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const itemId = btn.dataset.itemId;
            const item = menuItems.find(i => i.id === itemId);
            if (item) {
                await handleAddToCart(item, btn);
            }
        });
    });

    // Quantity controls
    menuGrid.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const itemId = btn.dataset.itemId;
            const isPlus = btn.classList.contains('plus');
            handleQuantityChange(itemId, isPlus);
        });
    });
}

async function handleAddToCart(item, button) {
    // Add loading state
    button.classList.add('loading');
    button.disabled = true;

    try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 200));
        
        window.cartManager.addItem(item);
        
        // Re-render the specific item to show quantity controls
        const menuItem = button.closest('.menu-item');
        const itemId = menuItem.dataset.itemId;
        const itemData = menuItems.find(i => i.id === itemId);
        menuItem.outerHTML = createMenuItemHTML(itemData);
        
        // Re-setup event listeners for the updated item
        setupMenuItemListeners();
        
        window.CommonUtils.showToast(`${item.name} added to cart`, 'success', 2000);
        
    } catch (error) {
        console.error('Error adding to cart:', error);
        window.CommonUtils.showToast('Failed to add item to cart', 'error');
    } finally {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

function handleQuantityChange(itemId, isIncrease) {
    const cartItem = window.cartManager.getItem(itemId);
    if (!cartItem) return;

    const newQuantity = isIncrease ? cartItem.quantity + 1 : cartItem.quantity - 1;
    
    if (newQuantity <= 0) {
        window.cartManager.removeItem(itemId);
        window.CommonUtils.showToast('Item removed from cart', 'info');
    } else {
        window.cartManager.updateQuantity(itemId, newQuantity);
    }

    // Re-render the specific item
    const menuItem = document.querySelector(`[data-item-id="${itemId}"]`);
    if (menuItem) {
        const itemData = menuItems.find(i => i.id === itemId);
        menuItem.outerHTML = createMenuItemHTML(itemData);
        setupMenuItemListeners();
    }
}

function clearAllFilters() {
    // Reset all filters
    currentFilters = {
        category: 'all',
        dietType: 'all',
        priceRange: 'all',
        searchQuery: ''
    };

    // Reset UI
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.filter === 'all');
    });
    
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.category === 'all');
    });

    const priceFilter = document.getElementById('priceFilter');
    if (priceFilter) {
        priceFilter.value = 'all';
    }

    const searchInput = document.getElementById('menuSearch');
    if (searchInput) {
        searchInput.value = '';
    }

    // Hide search container
    const searchContainer = document.getElementById('searchContainer');
    if (searchContainer) {
        searchContainer.classList.remove('show');
    }

    // Apply filters (which will show all items)
    applyFilters();
}

// Listen for cart changes to update quantity displays
window.addEventListener('cartChanged', () => {
    // Only update if we're on the menu page
    if (window.location.pathname.includes('menu.html') || window.location.pathname === '/menu.html') {
        displayMenuItems();
    }
});

// Export functions for global access
window.MenuPageFunctions = {
    clearAllFilters
};