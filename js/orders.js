// Orders page functionality
let currentTab = 'current';
let allOrders = [];

document.addEventListener('DOMContentLoaded', async () => {
    await initializePage();
    setupEventListeners();
});

async function initializePage() {
    showLoading(document.getElementById('skeletonLoader'));
    
    try {
        // Load user orders
        await loadOrders();
        updateOrdersDisplay();
        
    } catch (error) {
        console.error('Error initializing orders page:', error);
        window.CommonUtils.showToast('Error loading orders', 'error');
        
        // Load sample data on error
        loadSampleOrders();
        updateOrdersDisplay();
    } finally {
        hideLoading(document.getElementById('skeletonLoader'));
    }
}

function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
}

async function loadOrders() {
    try {
        const userId = 'user-123'; // In real app, get from auth
        allOrders = await window.FirebaseService.getUserOrders(userId);
    } catch (error) {
        console.error('Error loading orders:', error);
        loadSampleOrders();
    }
}

function loadSampleOrders() {
    // Sample orders for demonstration
    allOrders = [
        {
            id: 'ORDER-001',
            items: [
                { 
                    id: '1', 
                    name: 'Margherita Pizza', 
                    quantity: 2, 
                    price: 299,
                    imageURL: 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=400'
                },
                { 
                    id: '4', 
                    name: 'Cold Coffee', 
                    quantity: 1, 
                    price: 149,
                    imageURL: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=400'
                }
            ],
            mode: 'delivery',
            status: 'preparing',
            total: 747,
            createdAt: new Date().toISOString(),
            deliveryAddress: '123 Main St, City, State 12345'
        },
        {
            id: 'ORDER-002',
            items: [
                { 
                    id: '2', 
                    name: 'Chicken Burger', 
                    quantity: 1, 
                    price: 249,
                    imageURL: 'https://images.pexels.com/photos/1556909/pexels-photo-1556909.jpeg?auto=compress&cs=tinysrgb&w=400'
                }
            ],
            mode: 'takeaway',
            status: 'delivered',
            total: 249,
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
        },
        {
            id: 'ORDER-003',
            items: [
                { 
                    id: '5', 
                    name: 'Chocolate Cake', 
                    quantity: 2, 
                    price: 179,
                    imageURL: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=400'
                },
                { 
                    id: '3', 
                    name: 'Caesar Salad', 
                    quantity: 1, 
                    price: 199,
                    imageURL: 'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=400'
                }
            ],
            mode: 'dine-in',
            status: 'delivered',
            total: 557,
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
            tableNumber: 5
        }
    ];
}

function switchTab(tab) {
    currentTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tab}Orders`);
    });
    
    updateOrdersDisplay();
}

function updateOrdersDisplay() {
    const currentOrders = getCurrentOrders();
    const orderHistory = getOrderHistory();
    
    // Update current orders
    updateOrdersList('currentOrdersList', 'emptyCurrentOrders', currentOrders, true);
    
    // Update order history
    updateOrdersList('orderHistoryList', 'emptyOrderHistory', orderHistory, false);
}

function getCurrentOrders() {
    return allOrders.filter(order => 
        ['preparing', 'out-for-delivery', 'ready'].includes(order.status)
    );
}

function getOrderHistory() {
    return allOrders.filter(order => 
        ['delivered', 'completed', 'cancelled'].includes(order.status)
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function updateOrdersList(containerId, emptyStateId, orders, isCurrent) {
    const container = document.getElementById(containerId);
    const emptyState = document.getElementById(emptyStateId);
    
    if (!container || !emptyState) return;
    
    if (orders.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    container.style.display = 'block';
    emptyState.style.display = 'none';
    
    container.innerHTML = orders.map(order => createOrderCardHTML(order, isCurrent)).join('');
    
    // Add event listeners
    setupOrderCardListeners(container);
}

function createOrderCardHTML(order, isCurrent) {
    const cardClass = isCurrent ? 'order-card current-order-card' : 'order-card history-order-card';
    const modeIcons = { delivery: '🚚', takeaway: '🛍️', 'dine-in': '🍴' };
    const modeIcon = modeIcons[order.mode] || '📋';
    
    return `
        <div class="${cardClass}" data-order-id="${order.id}">
            <div class="order-header">
                <span class="order-id">Order #${order.id}</span>
                <span class="order-status ${order.status}">${getStatusText(order.status)}</span>
            </div>
            <div class="order-body">
                <div class="order-meta">
                    <div class="order-mode">
                        <span class="mode-icon">${modeIcon}</span>
                        <span>${capitalizeFirst(order.mode)}</span>
                    </div>
                    <div class="order-date">${window.CommonUtils.formatDate(order.createdAt)}</div>
                    <div class="order-total">${window.CommonUtils.formatCurrency(order.total)}</div>
                </div>
                
                <div class="order-items">
                    ${order.items.slice(0, 3).map(item => `
                        <div class="order-item">
                            <img src="${item.imageURL || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400'}"
                                 alt="${item.name}"
                                 class="order-item-image"
                                 onerror="this.src='https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400'">
                            <div class="order-item-info">
                                <span class="order-item-name">${item.name}</span>
                                <div class="order-item-details">
                                    <span class="order-item-quantity">×${item.quantity}</span>
                                    <span class="order-item-price">${window.CommonUtils.formatCurrency(item.price)}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                    ${order.items.length > 3 ? `
                        <div class="more-items">+${order.items.length - 3} more items</div>
                    ` : ''}
                </div>
                
                <div class="order-actions">
                    ${isCurrent ? `
                        <a href="tracking.html?orderId=${order.id}" class="track-btn">
                            <svg viewBox="0 0 24 24">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                            ${getTrackButtonText(order.mode)}
                        </a>
                    ` : ''}
                    <button class="order-action-btn ${isCurrent ? '' : 'primary'}"
                            data-action="reorder" data-order-id="${order.id}">
                        Reorder
                    </button>
                    ${!isCurrent && (order.status === 'delivered' || order.status === 'completed') ? `
                        <button class="order-action-btn" data-action="review" data-order-id="${order.id}">
                            Review
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function setupOrderCardListeners(container) {
    // Reorder buttons
    container.querySelectorAll('[data-action="reorder"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const orderId = btn.dataset.orderId;
            handleReorder(orderId);
        });
    });
    
    // Review buttons
    container.querySelectorAll('[data-action="review"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const orderId = btn.dataset.orderId;
            handleReview(orderId);
        });
    });
    
    // Order card clicks (go to tracking for current orders)
    container.querySelectorAll('.current-order-card').forEach(card => {
        card.addEventListener('click', () => {
            const orderId = card.dataset.orderId;
            window.location.href = `tracking.html?orderId=${orderId}`;
        });
    });
}

function handleReorder(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    // Add all items from the order to cart
    let itemsAdded = 0;
    
    order.items.forEach(orderItem => {
        // In a real app, fetch current menu item data
        // For now, use the order item data
        const menuItem = {
            id: orderItem.id,
            name: orderItem.name,
            price: orderItem.price,
            imageURL: orderItem.imageURL,
            category: 'unknown', // Would be fetched from menu
            description: '', // Would be fetched from menu
            availability: true,
            isVeg: true, // Would be fetched from menu
            rating: 4.0
        };
        
        // Add each quantity individually to maintain cart behavior
        for (let i = 0; i < orderItem.quantity; i++) {
            window.cartManager.addItem(menuItem);
            itemsAdded++;
        }
    });
    
    window.CommonUtils.showToast(`${itemsAdded} items added to cart`, 'success');
    
    // Redirect to cart after a short delay
    setTimeout(() => {
        window.location.href = 'cart.html';
    }, 1500);
}

function handleReview(orderId) {
    // In a real app, open review modal or page
    window.CommonUtils.showToast('Review functionality would open here', 'info');
}

function getStatusText(status) {
    const statusTexts = {
        'preparing': 'Preparing',
        'out-for-delivery': 'Out for Delivery',
        'ready': 'Ready',
        'served': 'Served',
        'delivered': 'Delivered',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
    };
    
    return statusTexts[status] || 'Unknown';
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getTrackButtonText(mode) {
    switch (mode) {
        case 'delivery':
            return 'Track Order';
        case 'takeaway':
            return 'View Status';
        case 'dine-in':
            return 'View Order';
        default:
            return 'Track Order';
    }
}

// Listen for real-time order updates
if (window.FirebaseService && window.FirebaseService.isConnected()) {
    // In a real app, subscribe to order updates
    // window.FirebaseService.subscribeToUserOrders('user-123', (orders) => {
    //     allOrders = orders;
    //     updateOrdersDisplay();
    // });
}

// Refresh orders periodically
setInterval(() => {
    if (document.visibilityState === 'visible') {
        loadOrders().then(() => {
            updateOrdersDisplay();
        });
    }
}, 30000); // Refresh every 30 seconds when page is visible
