// Cart page functionality
let orderMode = 'delivery';
let isProcessingOrder = false;

document.addEventListener('DOMContentLoaded', () => {
    initializePage();
    setupEventListeners();
});

function initializePage() {
    updateCartDisplay();
    updateOrderMode('delivery'); // Default mode
    updateBillSummary();
}

function setupEventListeners() {
    // Order mode selection
    document.querySelectorAll('.mode-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            const mode = pill.dataset.mode;
            updateOrderMode(mode);
        });
    });

    // Clear cart button
    const clearCartBtn = document.getElementById('clearCart');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', handleClearCart);
    }

    // Confirm order button
    const confirmBtn = document.getElementById('confirmOrderBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', handleConfirmOrder);
    }

    // Listen for cart changes
    window.addEventListener('cartChanged', () => {
        updateCartDisplay();
        updateBillSummary();
    });
}

function updateCartDisplay() {
    const cartItems = window.cartManager.items;
    const emptyCart = document.getElementById('emptyCart');
    const cartContent = document.getElementById('cartContent');

    if (cartItems.length === 0) {
        emptyCart.style.display = 'block';
        cartContent.style.display = 'none';
        return;
    }

    emptyCart.style.display = 'none';
    cartContent.style.display = 'block';

    const cartItemsContainer = document.getElementById('cartItems');
    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = cartItems.map(item => createCartItemHTML(item)).join('');
    
    // Add event listeners to cart items
    setupCartItemListeners();
}

function createCartItemHTML(item) {
    const itemTotal = item.price * item.quantity;
    
    return `
        <div class="cart-item" data-item-id="${item.id}">
            <img src="${item.imageURL}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-info">
                <h4 class="cart-item-name">${item.name}</h4>
                <p class="cart-item-price">${window.CommonUtils.formatCurrency(item.price)} each</p>
            </div>
            <div class="cart-item-controls">
                <div class="cart-quantity-controls">
                    <button class="cart-qty-btn minus" data-item-id="${item.id}">-</button>
                    <span class="cart-qty-display">${item.quantity}</span>
                    <button class="cart-qty-btn plus" data-item-id="${item.id}">+</button>
                </div>
                <div class="cart-item-total">${window.CommonUtils.formatCurrency(itemTotal)}</div>
                <button class="remove-item-btn" data-item-id="${item.id}">
                    <svg viewBox="0 0 24 24">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
}

function setupCartItemListeners() {
    const cartContainer = document.getElementById('cartItems');
    if (!cartContainer) return;

    // Quantity controls
    cartContainer.querySelectorAll('.cart-qty-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const itemId = btn.dataset.itemId;
            const isPlus = btn.classList.contains('plus');
            handleQuantityChange(itemId, isPlus);
        });
    });

    // Remove item buttons
    cartContainer.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const itemId = btn.dataset.itemId;
            handleRemoveItem(itemId);
        });
    });
}

function handleQuantityChange(itemId, isIncrease) {
    const cartItem = window.cartManager.getItem(itemId);
    if (!cartItem) return;

    const newQuantity = isIncrease ? cartItem.quantity + 1 : cartItem.quantity - 1;
    
    if (newQuantity <= 0) {
        handleRemoveItem(itemId);
    } else {
        window.cartManager.updateQuantity(itemId, newQuantity);
    }
}

function handleRemoveItem(itemId) {
    const cartItem = window.cartManager.getItem(itemId);
    if (!cartItem) return;

    // Add remove animation
    const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
    if (itemElement) {
        itemElement.classList.add('removing');
        setTimeout(() => {
            window.cartManager.removeItem(itemId);
            window.CommonUtils.showToast('Item removed from cart', 'info');
        }, 300);
    } else {
        window.cartManager.removeItem(itemId);
        window.CommonUtils.showToast('Item removed from cart', 'info');
    }
}

function handleClearCart() {
    if (window.cartManager.items.length === 0) return;

    const confirmClear = confirm('Are you sure you want to clear your cart?');
    if (confirmClear) {
        window.cartManager.clear();
        window.CommonUtils.showToast('Cart cleared', 'info');
    }
}

function updateOrderMode(mode) {
    orderMode = mode;
    
    // Update active pill
    document.querySelectorAll('.mode-pill').forEach(pill => {
        pill.classList.toggle('active', pill.dataset.mode === mode);
    });

    // Update checkout form
    updateCheckoutForm();
    
    // Update bill summary (delivery fee)
    updateBillSummary();
}

function updateCheckoutForm() {
    const checkoutForm = document.getElementById('checkoutForm');
    if (!checkoutForm) return;

    let formHTML = '';

    switch (orderMode) {
        case 'delivery':
            formHTML = createDeliveryForm();
            break;
        case 'takeaway':
            formHTML = createTakeawayForm();
            break;
        case 'dine-in':
            formHTML = createDineInForm();
            break;
    }

    checkoutForm.innerHTML = formHTML;
    setupFormListeners();
}

function createDeliveryForm() {
    const savedAddresses = window.CommonUtils.storage.get('user_addresses', []);
    
    return `
        <div class="form-section">
            <h4>Delivery Address</h4>
            <div class="form-group">
                <label>Select Address</label>
                <select id="addressSelect">
                    <option value="">Select saved address</option>
                    ${savedAddresses.map((addr, index) => 
                        `<option value="${index}">${addr}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Street Address</label>
                <input type="text" id="streetAddress" placeholder="Enter your street address" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>City</label>
                    <input type="text" id="city" placeholder="City" required>
                </div>
                <div class="form-group">
                    <label>Pincode</label>
                    <input type="text" id="pincode" placeholder="Pincode" required>
                </div>
            </div>
            <div class="form-group">
                <label>Delivery Instructions (Optional)</label>
                <textarea id="deliveryInstructions" placeholder="Special instructions for delivery..."></textarea>
            </div>
        </div>
        <div class="form-section">
            <h4>Contact Information</h4>
            <div class="form-row">
                <div class="form-group">
                    <label>Phone Number</label>
                    <input type="tel" id="phone" placeholder="+91 9876543210" required>
                </div>
                <div class="form-group">
                    <label>Alternate Phone</label>
                    <input type="tel" id="altPhone" placeholder="+91 9876543210">
                </div>
            </div>
        </div>
        <div class="form-section">
            <h4>Payment Method</h4>
            <div class="form-group">
                <label>
                    <input type="radio" name="payment" value="cod" checked> Cash on Delivery
                </label>
                <label>
                    <input type="radio" name="payment" value="online"> Pay Online
                </label>
            </div>
        </div>
    `;
}

function createTakeawayForm() {
    const now = new Date();
    const timeSlots = generateTimeSlots(now);
    
    return `
        <div class="form-section">
            <h4>Pickup Details</h4>
            <div class="form-group">
                <label>Pickup Time</label>
                <div class="time-slots">
                    ${timeSlots.map(slot => `
                        <div class="time-slot ${slot.disabled ? 'disabled' : ''}" 
                             data-time="${slot.value}" 
                             ${slot.disabled ? '' : 'onclick="selectTimeSlot(this)"'}>
                            ${slot.label}
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="form-group">
                <label>Special Instructions (Optional)</label>
                <textarea id="pickupInstructions" placeholder="Any special requests..."></textarea>
            </div>
        </div>
        <div class="form-section">
            <h4>Contact Information</h4>
            <div class="form-group">
                <label>Phone Number</label>
                <input type="tel" id="phone" placeholder="+91 9876543210" required>
            </div>
        </div>
        <div class="form-section">
            <h4>Payment Method</h4>
            <div class="form-group">
                <label>
                    <input type="radio" name="payment" value="online" checked> Pay Online
                </label>
                <label>
                    <input type="radio" name="payment" value="counter"> Pay at Counter
                </label>
            </div>
        </div>
    `;
}

function createDineInForm() {
    const tables = generateTableOptions();
    
    return `
        <div class="form-section">
            <h4>Table Reservation</h4>
            <div class="form-group">
                <label>Select Table</label>
                <div class="table-grid">
                    ${tables.map(table => `
                        <div class="table-option ${table.occupied ? 'occupied' : ''}" 
                             data-table="${table.number}"
                             ${table.occupied ? '' : 'onclick="selectTable(this)"'}>
                            <div class="table-number">${table.number}</div>
                            <div class="table-capacity">${table.capacity} seats</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="form-group">
                <label>Number of Guests</label>
                <select id="guestCount" required>
                    <option value="">Select guests</option>
                    <option value="1">1 Person</option>
                    <option value="2">2 People</option>
                    <option value="3">3 People</option>
                    <option value="4">4 People</option>
                    <option value="5">5+ People</option>
                </select>
            </div>
            <div class="form-group">
                <label>Special Requests (Optional)</label>
                <textarea id="dineInRequests" placeholder="Special seating requests, celebrations, etc..."></textarea>
            </div>
        </div>
        <div class="form-section">
            <h4>Contact Information</h4>
            <div class="form-group">
                <label>Phone Number</label>
                <input type="tel" id="phone" placeholder="+91 9876543210" required>
            </div>
        </div>
        <div class="form-section">
            <h4>Payment Method</h4>
            <div class="form-group">
                <label>
                    <input type="radio" name="payment" value="table" checked> Pay at Table
                </label>
                <label>
                    <input type="radio" name="payment" value="online"> Pay Online
                </label>
            </div>
        </div>
    `;
}

function setupFormListeners() {
    // Address selection
    const addressSelect = document.getElementById('addressSelect');
    if (addressSelect) {
        addressSelect.addEventListener('change', (e) => {
            const selectedIndex = e.target.value;
            if (selectedIndex !== '') {
                const savedAddresses = window.CommonUtils.storage.get('user_addresses', []);
                const selectedAddress = savedAddresses[selectedIndex];
                if (selectedAddress) {
                    document.getElementById('streetAddress').value = selectedAddress;
                }
            }
        });
    }
}

function generateTimeSlots(startTime) {
    const slots = [];
    const start = new Date(startTime);
    start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15); // Round to next 15 min
    start.setMinutes(start.getMinutes() + 30); // Add 30 min prep time

    for (let i = 0; i < 12; i++) {
        const time = new Date(start.getTime() + i * 15 * 60 * 1000);
        const isDisabled = time.getHours() >= 22 || time.getHours() < 10; // Restaurant hours
        
        slots.push({
            value: time.toISOString(),
            label: time.toLocaleTimeString('en-IN', { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: true 
            }),
            disabled: isDisabled
        });
    }
    
    return slots;
}

function generateTableOptions() {
    const tables = [];
    
    // Generate random table availability
    for (let i = 1; i <= 12; i++) {
        tables.push({
            number: i,
            capacity: i <= 4 ? 2 : i <= 8 ? 4 : 6,
            occupied: Math.random() < 0.3 // 30% chance of being occupied
        });
    }
    
    return tables;
}

function updateBillSummary() {
    const subtotal = window.cartManager.getTotal();
    const tax = Math.round(subtotal * 0.05); // 5% tax
    const deliveryFee = orderMode === 'delivery' ? 40 : 0;
    const total = subtotal + tax + deliveryFee;

    document.getElementById('subtotal').textContent = window.CommonUtils.formatCurrency(subtotal);
    document.getElementById('tax').textContent = window.CommonUtils.formatCurrency(tax);
    document.getElementById('deliveryFee').textContent = window.CommonUtils.formatCurrency(deliveryFee);
    document.getElementById('total').textContent = window.CommonUtils.formatCurrency(total);

    // Show/hide delivery fee
    const deliveryFeeItem = document.getElementById('deliveryFeeItem');
    if (deliveryFeeItem) {
        deliveryFeeItem.style.display = orderMode === 'delivery' ? 'flex' : 'none';
    }
}

async function handleConfirmOrder() {
    if (isProcessingOrder || window.cartManager.items.length === 0) return;

    // Validate form
    if (!validateOrderForm()) {
        return;
    }

    isProcessingOrder = true;
    const confirmBtn = document.getElementById('confirmOrderBtn');
    confirmBtn.classList.add('loading');
    confirmBtn.disabled = true;

    try {
        // Prepare order data
        const orderData = {
            userId: 'user-123', // In real app, get from auth
            items: window.cartManager.items,
            mode: orderMode,
            status: 'confirmed',
            total: window.cartManager.getTotal() + Math.round(window.cartManager.getTotal() * 0.05) + (orderMode === 'delivery' ? 40 : 0),
            orderDetails: getOrderDetails()
        };

        // Submit order
        const orderId = await window.FirebaseService.addOrder(orderData);
        
        // Clear cart
        window.cartManager.clear();
        
        // Show success message
        window.CommonUtils.showToast('Order confirmed successfully!', 'success');
        
        // Redirect to tracking page
        setTimeout(() => {
            window.location.href = `tracking.html?orderId=${orderId}`;
        }, 1500);

    } catch (error) {
        console.error('Error confirming order:', error);
        window.CommonUtils.showToast('Failed to confirm order. Please try again.', 'error');
    } finally {
        isProcessingOrder = false;
        confirmBtn.classList.remove('loading');
        confirmBtn.disabled = false;
    }
}

function validateOrderForm() {
    const requiredFields = document.querySelectorAll('input[required], select[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = 'var(--error)';
            isValid = false;
        } else {
            field.style.borderColor = 'var(--border)';
        }
    });

    if (!isValid) {
        window.CommonUtils.showToast('Please fill in all required fields', 'error');
        return false;
    }

    // Mode-specific validations
    if (orderMode === 'takeaway') {
        const selectedTimeSlot = document.querySelector('.time-slot.selected');
        if (!selectedTimeSlot) {
            window.CommonUtils.showToast('Please select a pickup time', 'error');
            return false;
        }
    } else if (orderMode === 'dine-in') {
        const selectedTable = document.querySelector('.table-option.selected');
        if (!selectedTable) {
            window.CommonUtils.showToast('Please select a table', 'error');
            return false;
        }
    }

    return true;
}

function getOrderDetails() {
    const details = { mode: orderMode };

    switch (orderMode) {
        case 'delivery':
            details.deliveryAddress = document.getElementById('streetAddress').value;
            details.city = document.getElementById('city').value;
            details.pincode = document.getElementById('pincode').value;
            details.phone = document.getElementById('phone').value;
            details.instructions = document.getElementById('deliveryInstructions').value;
            break;
            
        case 'takeaway':
            const selectedTimeSlot = document.querySelector('.time-slot.selected');
            details.pickupTime = selectedTimeSlot ? selectedTimeSlot.dataset.time : null;
            details.phone = document.getElementById('phone').value;
            details.instructions = document.getElementById('pickupInstructions').value;
            break;
            
        case 'dine-in':
            const selectedTable = document.querySelector('.table-option.selected');
            details.tableNumber = selectedTable ? selectedTable.dataset.table : null;
            details.guestCount = document.getElementById('guestCount').value;
            details.phone = document.getElementById('phone').value;
            details.requests = document.getElementById('dineInRequests').value;
            break;
    }

    // Payment method
    const paymentMethod = document.querySelector('input[name="payment"]:checked');
    details.paymentMethod = paymentMethod ? paymentMethod.value : 'cod';

    return details;
}

// Global functions for form interactions
window.selectTimeSlot = (element) => {
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected');
    });
    element.classList.add('selected');
};

window.selectTable = (element) => {
    document.querySelectorAll('.table-option').forEach(table => {
        table.classList.remove('selected');
    });
    element.classList.add('selected');
};