// Profile page functionality
let userData = null;

document.addEventListener('DOMContentLoaded', () => {
    initializePage();
    setupEventListeners();
});

function initializePage() {
    loadUserData();
    updateProfileDisplay();
    updateQuickStats();
}

function setupEventListeners() {
    // Settings button
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', openSettings);
    }

    // Edit profile button
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', toggleEditProfile);
    }

    // Edit avatar button
    const editAvatarBtn = document.getElementById('editAvatar');
    if (editAvatarBtn) {
        editAvatarBtn.addEventListener('click', handleAvatarEdit);
    }

    // Menu item buttons
    setupMenuItemListeners();

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

function loadUserData() {
    // Load user data from storage or Firebase
    userData = window.CommonUtils.storage.get('user_data', {
        id: 'user-123',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+91 9876543210',
        avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
        addresses: [
            '123 Main St, City, State 12345',
            '456 Oak Ave, City, State 12345'
        ],
        favorites: ['1', '4', '5'],
        totalOrders: 24,
        totalSpent: 2340,
        joinedDate: '2023-01-15'
    });
}

function updateProfileDisplay() {
    if (!userData) return;

    // Update user info
    document.getElementById('userName').textContent = userData.name;
    document.getElementById('userEmail').textContent = userData.email;
    document.getElementById('userPhone').textContent = userData.phone;

    // Update avatar
    const avatarImg = document.querySelector('.avatar img');
    if (avatarImg && userData.avatar) {
        avatarImg.src = userData.avatar;
        avatarImg.alt = userData.name;
    }
}

function updateQuickStats() {
    if (!userData) return;

    // Calculate stats (in real app, fetch from backend)
    const stats = {
        totalOrders: userData.totalOrders || 0,
        totalSpent: userData.totalSpent || 0,
        favoriteItems: userData.favorites ? userData.favorites.length : 0
    };

    document.getElementById('totalOrders').textContent = stats.totalOrders;
    document.getElementById('totalSpent').textContent = window.CommonUtils.formatCurrency(stats.totalSpent);
    document.getElementById('favoriteItems').textContent = stats.favoriteItems;
}

function setupMenuItemListeners() {
    // Addresses
    const addressesBtn = document.getElementById('addressesBtn');
    if (addressesBtn) {
        addressesBtn.addEventListener('click', () => handleMenuAction('addresses'));
    }

    // Payment methods
    const paymentBtn = document.getElementById('paymentBtn');
    if (paymentBtn) {
        paymentBtn.addEventListener('click', () => handleMenuAction('payment'));
    }

    // Favorites
    const favoritesBtn = document.getElementById('favoritesBtn');
    if (favoritesBtn) {
        favoritesBtn.addEventListener('click', () => handleMenuAction('favorites'));
    }

    // Notifications
    const notificationsBtn = document.getElementById('notificationsBtn');
    if (notificationsBtn) {
        notificationsBtn.addEventListener('click', () => handleMenuAction('notifications'));
    }

    // Help & Support
    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) {
        helpBtn.addEventListener('click', () => handleMenuAction('help'));
    }
}

function handleMenuAction(action) {
    switch (action) {
        case 'addresses':
            showAddressesModal();
            break;
        case 'payment':
            showPaymentMethodsModal();
            break;
        case 'favorites':
            showFavoritesModal();
            break;
        case 'notifications':
            showNotificationSettings();
            break;
        case 'help':
            showHelpModal();
            break;
        default:
            window.CommonUtils.showToast(`${action} functionality would open here`, 'info');
    }
}

function toggleEditProfile() {
    const profileForm = document.querySelector('.profile-form');
    const editBtn = document.getElementById('editProfileBtn');
    
    if (!profileForm) {
        createProfileEditForm();
        return;
    }

    const isActive = profileForm.classList.contains('active');
    
    if (isActive) {
        profileForm.classList.remove('active');
        editBtn.textContent = 'Edit Profile';
    } else {
        profileForm.classList.add('active');
        editBtn.textContent = 'Cancel Edit';
        populateEditForm();
    }
}

function createProfileEditForm() {
    const userInfo = document.querySelector('.user-info');
    const formHTML = `
        <div class="profile-form active">
            <div class="form-group">
                <label for="editName">Full Name</label>
                <input type="text" id="editName" value="${userData.name}">
            </div>
            <div class="form-group">
                <label for="editEmail">Email</label>
                <input type="email" id="editEmail" value="${userData.email}">
            </div>
            <div class="form-group">
                <label for="editPhone">Phone</label>
                <input type="tel" id="editPhone" value="${userData.phone}">
            </div>
            <div class="form-actions">
                <button class="save-btn" onclick="saveProfileChanges()">Save Changes</button>
                <button class="cancel-btn" onclick="toggleEditProfile()">Cancel</button>
            </div>
        </div>
    `;
    
    userInfo.insertAdjacentHTML('beforeend', formHTML);
    document.getElementById('editProfileBtn').textContent = 'Cancel Edit';
}

function populateEditForm() {
    const nameInput = document.getElementById('editName');
    const emailInput = document.getElementById('editEmail');
    const phoneInput = document.getElementById('editPhone');
    
    if (nameInput) nameInput.value = userData.name;
    if (emailInput) emailInput.value = userData.email;
    if (phoneInput) phoneInput.value = userData.phone;
}

function saveProfileChanges() {
    const name = document.getElementById('editName').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    
    // Validate inputs
    if (!name || !email || !phone) {
        window.CommonUtils.showToast('Please fill in all fields', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        window.CommonUtils.showToast('Please enter a valid email', 'error');
        return;
    }
    
    // Update user data
    userData.name = name;
    userData.email = email;
    userData.phone = phone;
    
    // Save to storage
    window.CommonUtils.storage.set('user_data', userData);
    
    // Update display
    updateProfileDisplay();
    
    // Hide form
    toggleEditProfile();
    
    window.CommonUtils.showToast('Profile updated successfully', 'success');
}

function handleAvatarEdit() {
    // In a real app, this would open file picker or camera
    const avatars = [
        'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
        'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
        'https://images.pexels.com/photos/874158/pexels-photo-874158.jpeg?auto=compress&cs=tinysrgb&w=150',
        'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150'
    ];
    
    // Cycle through demo avatars
    const currentIndex = avatars.indexOf(userData.avatar);
    const nextIndex = (currentIndex + 1) % avatars.length;
    
    userData.avatar = avatars[nextIndex];
    window.CommonUtils.storage.set('user_data', userData);
    updateProfileDisplay();
    
    window.CommonUtils.showToast('Avatar updated', 'success');
}

function openSettings() {
    const settingsHTML = `
        <div class="settings-overlay active" id="settingsOverlay">
            <div class="settings-modal">
                <div class="settings-header">
                    <h3>Settings</h3>
                    <button class="close-settings" onclick="closeSettings()">
                        <svg viewBox="0 0 24 24">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                <div class="settings-content">
                    <div class="settings-option">
                        <div class="settings-option-info">
                            <h4>Push Notifications</h4>
                            <p>Receive order updates and offers</p>
                        </div>
                        <div class="settings-toggle active" onclick="toggleSetting(this)"></div>
                    </div>
                    <div class="settings-option">
                        <div class="settings-option-info">
                            <h4>Email Notifications</h4>
                            <p>Receive promotional emails</p>
                        </div>
                        <div class="settings-toggle" onclick="toggleSetting(this)"></div>
                    </div>
                    <div class="settings-option">
                        <div class="settings-option-info">
                            <h4>Location Services</h4>
                            <p>For better delivery experience</p>
                        </div>
                        <div class="settings-toggle active" onclick="toggleSetting(this)"></div>
                    </div>
                    <div class="settings-option">
                        <div class="settings-option-info">
                            <h4>Dark Mode</h4>
                            <p>Switch to dark theme</p>
                        </div>
                        <div class="settings-toggle active" onclick="toggleSetting(this)"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', settingsHTML);
    
    // Close on overlay click
    document.getElementById('settingsOverlay').addEventListener('click', (e) => {
        if (e.target.id === 'settingsOverlay') {
            closeSettings();
        }
    });
}

function closeSettings() {
    const overlay = document.getElementById('settingsOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 300);
    }
}

function toggleSetting(toggle) {
    toggle.classList.toggle('active');
    
    // In a real app, save setting to backend
    window.CommonUtils.showToast('Setting updated', 'success');
}

function showAddressesModal() {
    const addresses = userData.addresses || [];
    
    const modalHTML = `
        <div class="settings-overlay active" id="addressModal">
            <div class="settings-modal">
                <div class="settings-header">
                    <h3>Saved Addresses</h3>
                    <button class="close-settings" onclick="closeModal('addressModal')">
                        <svg viewBox="0 0 24 24">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                <div class="settings-content">
                    ${addresses.map((address, index) => `
                        <div class="settings-option">
                            <div class="settings-option-info">
                                <h4>Address ${index + 1}</h4>
                                <p>${address}</p>
                            </div>
                            <button class="btn-secondary" onclick="editAddress(${index})">Edit</button>
                        </div>
                    `).join('')}
                    <button class="btn-primary" onclick="addNewAddress()" style="width: 100%; margin-top: 16px;">
                        Add New Address
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function showFavoritesModal() {
    // In a real app, fetch favorite items from menu
    const favoriteItems = [
        { name: 'Margherita Pizza', price: 299 },
        { name: 'Cold Coffee', price: 149 },
        { name: 'Chocolate Cake', price: 179 }
    ];
    
    const modalHTML = `
        <div class="settings-overlay active" id="favoritesModal">
            <div class="settings-modal">
                <div class="settings-header">
                    <h3>Favorite Items</h3>
                    <button class="close-settings" onclick="closeModal('favoritesModal')">
                        <svg viewBox="0 0 24 24">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                <div class="settings-content">
                    ${favoriteItems.map(item => `
                        <div class="settings-option">
                            <div class="settings-option-info">
                                <h4>${item.name}</h4>
                                <p>${window.CommonUtils.formatCurrency(item.price)}</p>
                            </div>
                            <button class="btn-primary" onclick="addToCartFromFavorites('${item.name}')">Add to Cart</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function showHelpModal() {
    const modalHTML = `
        <div class="settings-overlay active" id="helpModal">
            <div class="settings-modal">
                <div class="settings-header">
                    <h3>Help & Support</h3>
                    <button class="close-settings" onclick="closeModal('helpModal')">
                        <svg viewBox="0 0 24 24">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                <div class="settings-content">
                    <div class="settings-option">
                        <div class="settings-option-info">
                            <h4>Contact Support</h4>
                            <p>Get help with your orders</p>
                        </div>
                        <button class="btn-primary" onclick="contactSupport()">Contact</button>
                    </div>
                    <div class="settings-option">
                        <div class="settings-option-info">
                            <h4>FAQ</h4>
                            <p>Frequently asked questions</p>
                        </div>
                        <button class="btn-secondary" onclick="showFAQ()">View FAQ</button>
                    </div>
                    <div class="settings-option">
                        <div class="settings-option-info">
                            <h4>Report Issue</h4>
                            <p>Report a problem with your order</p>
                        </div>
                        <button class="btn-secondary" onclick="reportIssue()">Report</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    }
}

function handleLogout() {
    const confirmLogout = confirm('Are you sure you want to logout?');
    if (confirmLogout) {
        // Clear user data
        window.CommonUtils.storage.remove('user_data');
        window.cartManager.clear();
        
        window.CommonUtils.showToast('Logged out successfully', 'success');
        
        // In a real app, redirect to login page
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }
}

// Utility functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Global functions for modal interactions
window.saveProfileChanges = saveProfileChanges;
window.closeSettings = closeSettings;
window.toggleSetting = toggleSetting;
window.closeModal = closeModal;

window.editAddress = (index) => {
    window.CommonUtils.showToast('Address editing would open here', 'info');
};

window.addNewAddress = () => {
    window.CommonUtils.showToast('Add address form would open here', 'info');
};

window.addToCartFromFavorites = (itemName) => {
    window.CommonUtils.showToast(`${itemName} added to cart`, 'success');
};

window.contactSupport = () => {
    window.CommonUtils.showToast('Support chat would open here', 'info');
};

window.showFAQ = () => {
    window.CommonUtils.showToast('FAQ page would open here', 'info');
};

window.reportIssue = () => {
    window.CommonUtils.showToast('Issue reporting form would open here', 'info');
};