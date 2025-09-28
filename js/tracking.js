// Order tracking functionality
let currentOrderId = null;
let orderData = null;
let statusUpdateInterval = null;
let unsubscribeUpdates = null;

document.addEventListener('DOMContentLoaded', () => {
    initializePage();
});

async function initializePage() {
    // Get order ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    currentOrderId = urlParams.get('orderId');

    if (!currentOrderId) {
        // Redirect to orders page if no order ID
        window.location.href = 'orders.html';
        return;
    }

    try {
        await loadOrderData();
        setupEventListeners();
        startLiveUpdates();
        
    } catch (error) {
        console.error('Error initializing tracking page:', error);
        window.CommonUtils.showToast('Error loading order details', 'error');
        
        // Show mock data after 2 seconds
        setTimeout(() => {
            loadMockOrderData();
            setupEventListeners();
            startMockUpdates();
        }, 2000);
    }
}

async function loadOrderData() {
    // In a real app, fetch order data from Firebase
    // For now, use sample data
    orderData = {
        id: currentOrderId,
        mode: 'delivery',
        status: 'preparing',
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
        total: 747,
        estimatedTime: '25-30 mins',
        deliveryAddress: '123 Main St, City, State 12345',
        phone: '+91 9876543210',
        createdAt: new Date().toISOString()
    };

    updateOrderDisplay();
}

function loadMockOrderData() {
    orderData = {
        id: 'ORDER-12345',
        mode: 'delivery',
        status: 'preparing',
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
        total: 747,
        estimatedTime: '25-30 mins',
        deliveryAddress: '123 Main St, City, State 12345',
        phone: '+91 9876543210',
        createdAt: new Date().toISOString()
    };

    updateOrderDisplay();
}

function setupEventListeners() {
    // Contact restaurant button
    const contactBtn = document.getElementById('contactRestaurant');
    if (contactBtn) {
        contactBtn.addEventListener('click', handleContactRestaurant);
    }

    // Track on map button
    const trackMapBtn = document.getElementById('trackOnMap');
    if (trackMapBtn) {
        trackMapBtn.addEventListener('click', handleTrackOnMap);
    }
}

function updateOrderDisplay() {
    if (!orderData) return;

    // Update order info
    document.getElementById('orderId').textContent = orderData.id;
    document.getElementById('orderMode').textContent = capitalizeFirst(orderData.mode);
    document.getElementById('orderTotal').textContent = window.CommonUtils.formatCurrency(orderData.total);
    document.getElementById('estimatedTime').textContent = orderData.estimatedTime;

    // Update mode icon
    const modeIcons = { delivery: '🚚', takeaway: '🛍️', 'dine-in': '🍴' };
    document.getElementById('modeIcon').textContent = modeIcons[orderData.mode] || '📋';

    // Update timeline based on current status
    updateTimeline(orderData.status);

    // Update order items
    updateOrderItems();

    // Update delivery details (if delivery mode)
    updateDeliveryDetails();
}

function updateTimeline(currentStatus) {
    const timeline = document.getElementById('orderTimeline');
    if (!timeline) return;

    const statuses = getStatusFlow(orderData.mode);
    const currentIndex = statuses.findIndex(s => s.key === currentStatus);

    timeline.innerHTML = statuses.map((status, index) => {
        let itemClass = 'timeline-item';
        
        if (index < currentIndex) {
            itemClass += ' completed';
        } else if (index === currentIndex) {
            itemClass += ' active';
        }

        return `
            <div class="${itemClass}">
                <div class="timeline-icon">${status.icon}</div>
                <div class="timeline-content">
                    <h4>${status.title}</h4>
                    <p>${status.description}</p>
                    ${index <= currentIndex ? `<p class="timeline-time">${getCurrentTime()}</p>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function getStatusFlow(mode) {
    const baseFlow = [
        { key: 'confirmed', title: 'Order Confirmed', description: 'Your order has been received', icon: '✓' },
        { key: 'preparing', title: 'Preparing', description: 'Your food is being prepared', icon: '👨‍🍳' }
    ];

    switch (mode) {
        case 'delivery':
            return [
                ...baseFlow,
                { key: 'out-for-delivery', title: 'Out for Delivery', description: 'Your order is on the way', icon: '🚚' },
                { key: 'delivered', title: 'Delivered', description: 'Order delivered successfully', icon: '🎉' }
            ];
        case 'takeaway':
            return [
                ...baseFlow,
                { key: 'ready', title: 'Ready for Pickup', description: 'Your order is ready', icon: '✅' },
                { key: 'completed', title: 'Order Complete', description: 'Order picked up successfully', icon: '🎉' }
            ];
        case 'dine-in':
            return [
                ...baseFlow,
                { key: 'served', title: 'Served', description: 'Your order has been served', icon: '🍽️' },
                { key: 'completed', title: 'Order Complete', description: 'Enjoy your meal!', icon: '🎉' }
            ];
        default:
            return baseFlow;
    }
}

function updateOrderItems() {
    const orderItemsContainer = document.getElementById('orderItems');
    if (!orderItemsContainer || !orderData.items) return;

    orderItemsContainer.innerHTML = orderData.items.map(item => `
        <div class="order-item">
            <img src="${item.imageURL}" alt="${item.name}" class="order-item-image">
            <div class="order-item-info">
                <h4 class="order-item-name">${item.name}</h4>
                <div class="order-item-details">
                    <span class="order-item-quantity">Qty: ${item.quantity}</span>
                    <span class="order-item-price">${window.CommonUtils.formatCurrency(item.price * item.quantity)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function updateDeliveryDetails() {
    const deliveryDetailsSection = document.getElementById('deliveryDetails');
    if (!deliveryDetailsSection) return;

    if (orderData.mode !== 'delivery') {
        deliveryDetailsSection.style.display = 'none';
        return;
    }

    deliveryDetailsSection.style.display = 'block';
    document.getElementById('deliveryAddress').textContent = orderData.deliveryAddress || 'Address not provided';
    document.getElementById('contactPhone').textContent = orderData.phone || 'Phone not provided';

    // Show track on map button for delivery
    const trackMapBtn = document.getElementById('trackOnMap');
    if (trackMapBtn && orderData.status === 'out-for-delivery') {
        trackMapBtn.style.display = 'block';
    }
}

function startLiveUpdates() {
    if (!window.FirebaseService.isConnected()) {
        startMockUpdates();
        return;
    }

    // Subscribe to real-time updates from Firebase
    unsubscribeUpdates = window.FirebaseService.subscribeToOrderUpdates(
        currentOrderId, 
        handleStatusUpdate
    );
}

function startMockUpdates() {
    // Simulate status updates for demo
    const statusFlow = ['preparing', 'out-for-delivery', 'delivered'];
    let currentIndex = 0;

    statusUpdateInterval = setInterval(() => {
        if (currentIndex < statusFlow.length - 1) {
            currentIndex++;
            const newStatus = statusFlow[currentIndex];
            
            handleStatusUpdate({
                status: newStatus,
                timestamp: Date.now()
            });
        } else {
            clearInterval(statusUpdateInterval);
        }
    }, 10000); // Update every 10 seconds for demo
}

function handleStatusUpdate(update) {
    if (!update || !orderData) return;

    const previousStatus = orderData.status;
    orderData.status = update.status;

    // Update timeline
    updateTimeline(orderData.status);

    // Update delivery details if status changed to out-for-delivery
    if (orderData.status === 'out-for-delivery' && orderData.mode === 'delivery') {
        const trackMapBtn = document.getElementById('trackOnMap');
        if (trackMapBtn) {
            trackMapBtn.style.display = 'block';
        }
    }

    // Show notification for status changes
    if (previousStatus !== orderData.status) {
        const statusMessages = {
            'preparing': 'Your order is being prepared',
            'out-for-delivery': 'Your order is out for delivery',
            'ready': 'Your order is ready for pickup',
            'served': 'Your order has been served',
            'delivered': 'Your order has been delivered',
            'completed': 'Order completed successfully'
        };

        const message = statusMessages[orderData.status] || 'Order status updated';
        window.CommonUtils.showToast(message, 'success');
    }
}

function handleContactRestaurant() {
    // In a real app, this could open a chat or call functionality
    const phone = '+91 98765 43210'; // Restaurant phone
    
    if (confirm(`Call restaurant at ${phone}?`)) {
        window.open(`tel:${phone}`);
    }
}

function handleTrackOnMap() {
    // In a real app, this would open a map with live tracking
    window.CommonUtils.showToast('Live tracking would open here', 'info');
    
    // Mock implementation - could integrate with Google Maps, etc.
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(orderData.deliveryAddress)}`;
    window.open(mapUrl, '_blank');
}

function getCurrentTime() {
    return new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (statusUpdateInterval) {
        clearInterval(statusUpdateInterval);
    }
    if (unsubscribeUpdates) {
        unsubscribeUpdates();
    }
});