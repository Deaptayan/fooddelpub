// Common utility functions and shared components

// Cart Management
class CartManager {
    constructor() {
        this.items = this.loadCart();
        this.updateCartBadge();
    }

    loadCart() {
        const saved = localStorage.getItem('restaurant_cart');
        return saved ? JSON.parse(saved) : [];
    }

    saveCart() {
        localStorage.setItem('restaurant_cart', JSON.stringify(this.items));
        this.updateCartBadge();
        this.notifyCartChange();
    }

    addItem(item) {
        const existingIndex = this.items.findIndex(cartItem => cartItem.id === item.id);
        
        if (existingIndex > -1) {
            this.items[existingIndex].quantity += 1;
        } else {
            this.items.push({
                ...item,
                quantity: 1,
                addedAt: Date.now()
            });
        }
        
        this.saveCart();
        this.showAddToCartAnimation();
    }

    removeItem(itemId) {
        this.items = this.items.filter(item => item.id !== itemId);
        this.saveCart();
    }

    updateQuantity(itemId, quantity) {
        if (quantity <= 0) {
            this.removeItem(itemId);
            return;
        }

        const item = this.items.find(item => item.id === itemId);
        if (item) {
            item.quantity = quantity;
            this.saveCart();
        }
    }

    getItem(itemId) {
        return this.items.find(item => item.id === itemId);
    }

    getTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getItemCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }

    clear() {
        this.items = [];
        this.saveCart();
    }

    updateCartBadge() {
        const badges = document.querySelectorAll('#cartBadge');
        const count = this.getItemCount();
        
        badges.forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        });
    }

    showAddToCartAnimation() {
        // Create floating animation for add to cart
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.textContent = 'Added to cart!';
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--gradient);
            color: white;
            padding: 12px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
            z-index: 9999;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }

    notifyCartChange() {
        // Dispatch custom event for cart changes
        window.dispatchEvent(new CustomEvent('cartChanged', {
            detail: { items: this.items, total: this.getTotal() }
        }));
    }
}

// Initialize global cart manager
window.cartManager = new CartManager();

// Search functionality
class SearchManager {
    constructor() {
        this.searchCache = new Map();
        this.searchDelay = 300;
    }

    async searchItems(query, items) {
        if (!query.trim()) return items;

        const cacheKey = query.toLowerCase();
        if (this.searchCache.has(cacheKey)) {
            return this.searchCache.get(cacheKey);
        }

        const results = items.filter(item => {
            const searchText = `${item.name} ${item.description} ${item.category}`.toLowerCase();
            return searchText.includes(cacheKey);
        });

        this.searchCache.set(cacheKey, results);
        return results;
    }

    debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
}

window.searchManager = new SearchManager();

// Loading utilities
const showLoading = (element) => {
    if (element) {
        element.classList.add('show');
    }
};

const hideLoading = (element) => {
    if (element) {
        element.classList.remove('show');
    }
};

// Toast notifications
const showToast = (message, type = 'info', duration = 3000) => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--error)' : 'var(--accent-primary)'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 9999;
        animation: slideInDown 0.3s ease-out;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutUp 0.3s ease-out forwards';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, duration);
};

// Format currency
const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
};

// Format date
const formatDate = (date) => {
    const options = { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(date).toLocaleDateString('en-IN', options);
};

// Format time
const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Image lazy loading
const setupLazyLoading = () => {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
};

// Smooth scroll utility
const smoothScrollTo = (element, offset = 0) => {
    const elementPosition = element.offsetTop - offset;
    window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
    });
};

// Local storage utilities
const storage = {
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    },
    
    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    },
    
    remove: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing from localStorage:', error);
        }
    }
};

// Animation utilities
const animateElement = (element, animation, duration = 300) => {
    element.style.animation = `${animation} ${duration}ms ease-out`;
    
    return new Promise(resolve => {
        setTimeout(() => {
            element.style.animation = '';
            resolve();
        }, duration);
    });
};

// Device detection
const isMobile = () => {
    return window.innerWidth <= 768;
};

const isTablet = () => {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
};

const isDesktop = () => {
    return window.innerWidth > 1024;
};

// Network status
const checkNetworkStatus = () => {
    return navigator.onLine;
};

window.addEventListener('online', () => {
    showToast('Connection restored', 'success');
});

window.addEventListener('offline', () => {
    showToast('No internet connection', 'error');
});

// Add CSS animations if not already present
const addAnimationCSS = () => {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInDown {
            from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
            to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        
        @keyframes slideOutUp {
            from { transform: translateX(-50%) translateY(0); opacity: 1; }
            to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
        }
        
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .lazy {
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .lazy.loaded {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
};

// Initialize common functionality
document.addEventListener('DOMContentLoaded', () => {
    addAnimationCSS();
    setupLazyLoading();
    
    // Update cart badge on page load
    window.cartManager.updateCartBadge();
});

// Export utilities
window.CommonUtils = {
    showLoading,
    hideLoading,
    showToast,
    formatCurrency,
    formatDate,
    formatTime,
    setupLazyLoading,
    smoothScrollTo,
    storage,
    animateElement,
    isMobile,
    isTablet,
    isDesktop,
    checkNetworkStatus
};