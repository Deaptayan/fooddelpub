// Firebase Configuration and Initialization
const firebaseConfig = {
    // Replace with your Firebase config
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "your-database-url",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};

// Initialize Firebase (mock implementation for demo)
let isFirebaseConnected = false;
let db = null;
let realtimeDb = null;

// Mock Firebase functions for when Firebase is not connected
const mockFirebase = {
    collection: (name) => ({
        get: () => Promise.resolve({ docs: [] }),
        add: (data) => Promise.resolve({ id: 'mock-id-' + Date.now() }),
        doc: (id) => ({
            get: () => Promise.resolve({ exists: false, data: () => null }),
            set: (data) => Promise.resolve(),
            update: (data) => Promise.resolve(),
            delete: () => Promise.resolve()
        })
    }),
    ref: (path) => ({
        on: (event, callback) => {
            // Mock real-time updates
            setTimeout(() => {
                callback({
                    val: () => null
                });
            }, 1000);
        },
        off: () => {},
        set: (data) => Promise.resolve(),
        update: (data) => Promise.resolve(),
        push: (data) => Promise.resolve({ key: 'mock-key-' + Date.now() })
    })
};

// Try to initialize Firebase
try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        realtimeDb = firebase.database();
        isFirebaseConnected = true;
        console.log('Firebase connected successfully');
    } else {
        console.warn('Firebase not loaded, using mock data');
        db = mockFirebase;
        realtimeDb = mockFirebase;
    }
} catch (error) {
    console.warn('Firebase initialization failed, using mock data:', error);
    db = mockFirebase;
    realtimeDb = mockFirebase;
}

// Sample data for when Firebase is not connected
const SAMPLE_DATA = {
    menu: [
        {
            id: '1',
            name: 'Margherita Pizza',
            category: 'pizza',
            description: 'Classic pizza with tomato sauce, mozzarella cheese, and fresh basil',
            price: 299,
            imageURL: 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=400',
            availability: true,
            isVeg: true,
            rating: 4.5,
            isPopular: true
        },
        {
            id: '2',
            name: 'Chicken Burger',
            category: 'burgers',
            description: 'Juicy grilled chicken patty with lettuce, tomato, and special sauce',
            price: 249,
            imageURL: 'https://images.pexels.com/photos/1556909/pexels-photo-1556909.jpeg?auto=compress&cs=tinysrgb&w=400',
            availability: true,
            isVeg: false,
            rating: 4.3,
            isPopular: false
        },
        {
            id: '3',
            name: 'Caesar Salad',
            category: 'starters',
            description: 'Fresh romaine lettuce with parmesan cheese, croutons, and caesar dressing',
            price: 199,
            imageURL: 'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=400',
            availability: true,
            isVeg: true,
            rating: 4.2,
            isPopular: false
        },
        {
            id: '4',
            name: 'Cold Coffee',
            category: 'drinks',
            description: 'Refreshing cold brew coffee with milk and ice',
            price: 149,
            imageURL: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=400',
            availability: true,
            isVeg: true,
            rating: 4.1,
            isPopular: true
        },
        {
            id: '5',
            name: 'Chocolate Cake',
            category: 'desserts',
            description: 'Rich and moist chocolate cake with chocolate frosting',
            price: 179,
            imageURL: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=400',
            availability: true,
            isVeg: true,
            rating: 4.7,
            isPopular: true
        },
        {
            id: '6',
            name: 'Pepperoni Pizza',
            category: 'pizza',
            description: 'Delicious pizza topped with pepperoni and mozzarella cheese',
            price: 349,
            imageURL: 'https://images.pexels.com/photos/1566837/pexels-photo-1566837.jpeg?auto=compress&cs=tinysrgb&w=400',
            availability: true,
            isVeg: false,
            rating: 4.6,
            isPopular: true
        }
    ],
    orders: [
        {
            id: 'order-001',
            userId: 'user-123',
            items: [
                { id: '1', name: 'Margherita Pizza', quantity: 2, price: 299 },
                { id: '4', name: 'Cold Coffee', quantity: 1, price: 149 }
            ],
            mode: 'delivery',
            status: 'preparing',
            total: 747,
            createdAt: new Date().toISOString(),
            deliveryAddress: '123 Main St, City, State 12345'
        }
    ],
    user: {
        id: 'user-123',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+91 9876543210',
        addresses: [
            '123 Main St, City, State 12345',
            '456 Oak Ave, City, State 12345'
        ],
        favorites: ['1', '4', '5']
    }
};

// Utility functions
const getMenuItems = async () => {
    if (isFirebaseConnected) {
        try {
            const snapshot = await db.collection('menu').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error fetching menu:', error);
            return SAMPLE_DATA.menu;
        }
    }
    return SAMPLE_DATA.menu;
};

const getUserOrders = async (userId) => {
    if (isFirebaseConnected) {
        try {
            const snapshot = await db.collection('orders')
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error fetching orders:', error);
            return SAMPLE_DATA.orders;
        }
    }
    return SAMPLE_DATA.orders;
};

const addOrder = async (orderData) => {
    if (isFirebaseConnected) {
        try {
            const docRef = await db.collection('orders').add({
                ...orderData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Add to real-time database for live tracking
            await realtimeDb.ref(`liveOrders/${docRef.id}`).set({
                status: orderData.status,
                timestamp: Date.now()
            });
            
            return docRef.id;
        } catch (error) {
            console.error('Error adding order:', error);
            return 'mock-order-' + Date.now();
        }
    }
    return 'mock-order-' + Date.now();
};

const subscribeToOrderUpdates = (orderId, callback) => {
    if (isFirebaseConnected) {
        const orderRef = realtimeDb.ref(`liveOrders/${orderId}`);
        orderRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data && callback) {
                callback(data);
            }
        });
        return () => orderRef.off();
    } else {
        // Mock real-time updates
        const mockUpdates = ['preparing', 'out-for-delivery', 'delivered'];
        let currentIndex = 0;
        
        const interval = setInterval(() => {
            if (currentIndex < mockUpdates.length && callback) {
                callback({
                    status: mockUpdates[currentIndex],
                    timestamp: Date.now()
                });
                currentIndex++;
                
                if (currentIndex >= mockUpdates.length) {
                    clearInterval(interval);
                }
            }
        }, 5000);
        
        return () => clearInterval(interval);
    }
};

// Export functions for use in other files
window.FirebaseService = {
    isConnected: () => isFirebaseConnected,
    getMenuItems,
    getUserOrders,
    addOrder,
    subscribeToOrderUpdates,
    SAMPLE_DATA
};