// Main Website JavaScript - Handles all frontend functionality

import { 
    db, 
    propertiesCollection, 
    inquiriesCollection, 
    contactsCollection, 
    subscribersCollection,
    addDoc, 
    getDocs, 
    query, 
    where, 
    orderBy,
    serverTimestamp
} from './firebase-config.js';

// Global Variables
let currentPropertyId = null;
let allProperties = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadProperties();
    setupEventListeners();
    loadWishlistCount();
    checkURLParams();
});

// Load Properties from Firebase
async function loadProperties(filters = {}) {
    const propertyGrid = document.getElementById('propertyGrid');
    if (!propertyGrid) return;
    
    propertyGrid.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading properties...</div>';
    
    try {
        let q = propertiesCollection;
        
        // Apply filters if provided
        if (filters.type && filters.type !== '') {
            q = query(q, where("type", "==", filters.type));
        }
        
        const snapshot = await getDocs(q);
        allProperties = [];
        snapshot.forEach(doc => {
            allProperties.push({ id: doc.id, ...doc.data() });
        });
        
        // Apply client-side filters
        let filteredProperties = [...allProperties];
        
        if (filters.bedrooms && filters.bedrooms !== '') {
            filteredProperties = filteredProperties.filter(p => p.bedrooms >= parseInt(filters.bedrooms));
        }
        
        if (filters.price && filters.price !== '') {
            const [min, max] = filters.price.split('-');
            if (max) {
                filteredProperties = filteredProperties.filter(p => p.price >= parseInt(min) && p.price <= parseInt(max));
            } else if (filters.price === '1000000+') {
                filteredProperties = filteredProperties.filter(p => p.price >= 1000000);
            }
        }
        
        if (filters.search && filters.search !== '') {
            const searchTerm = filters.search.toLowerCase();
            filteredProperties = filteredProperties.filter(p => 
                p.title?.toLowerCase().includes(searchTerm) || 
                p.location?.toLowerCase().includes(searchTerm)
            );
        }
        
        displayProperties(filteredProperties);
        
    } catch (error) {
        console.error("Error loading properties:", error);
        propertyGrid.innerHTML = '<div class="loading">⚠️ Error loading properties. Please refresh.</div>';
    }
}

// Display Properties in Grid
function displayProperties(properties) {
    const propertyGrid = document.getElementById('propertyGrid');
    if (!propertyGrid) return;
    
    if (properties.length === 0) {
        propertyGrid.innerHTML = '<div class="loading">🏠 No properties found. Check back later!</div>';
        return;
    }
    
    propertyGrid.innerHTML = properties.map(property => `
        <div class="property-card" data-id="${property.id}">
            <div class="property-image">
                <img src="${property.imageUrl || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400'}" alt="${property.title}" loading="lazy">
                <div class="property-badge">${property.status || 'Available'}</div>
                <button class="wishlist-btn" onclick="event.stopPropagation(); toggleWishlist('${property.id}')">
                    <i class="fa-${isInWishlist(property.id) ? 'solid' : 'regular'} fa-heart"></i>
                </button>
            </div>
            <div class="property-info">
                <h3>${property.title}</h3>
                <div class="property-price">$${property.price?.toLocaleString() || 'N/A'}</div>
                <div class="property-location"><i class="fas fa-map-marker-alt"></i> ${property.location || 'N/A'}</div>
                <div class="property-features">
                    <span><i class="fas fa-bed"></i> ${property.bedrooms || 'N/A'} Beds</span>
                    <span><i class="fas fa-bath"></i> ${property.bathrooms || 'N/A'} Baths</span>
                    <span><i class="fas fa-vector-square"></i> ${property.area || 'N/A'} sqft</span>
                </div>
                <button class="btn-details" onclick="openInquiryModal('${property.id}', '${property.title.replace(/'/g, "\\'")}')">
                    <i class="fas fa-envelope"></i> Get Details
                </button>
            </div>
        </div>
    `).join('');
}

// Wishlist Functions
function isInWishlist(propertyId) {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    return wishlist.includes(propertyId);
}

window.toggleWishlist = function(propertyId) {
    let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    if (wishlist.includes(propertyId)) {
        wishlist = wishlist.filter(id => id !== propertyId);
        showToast('❤️ Removed from wishlist');
    } else {
        wishlist.push(propertyId);
        showToast('✅ Added to wishlist');
    }
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    loadWishlistCount();
    loadProperties(); // Refresh to update heart icons
}

function loadWishlistCount() {
    const wishlistCount = document.getElementById('wishlistCount');
    if (wishlistCount) {
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        wishlistCount.textContent = wishlist.length;
    }
}

// Open Inquiry Modal
window.openInquiryModal = function(propertyId, propertyTitle) {
    currentPropertyId = propertyId;
    const modal = document.getElementById('inquiryModal');
    if (modal) {
        document.getElementById('propertyTitle').textContent = `Property: ${propertyTitle}`;
        document.getElementById('selectedPropertyId').value = propertyId;
        modal.style.display = 'block';
    }
}

function closeInquiryModal() {
    const modal = document.getElementById('inquiryModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('inquiryForm')?.reset();
    }
}

// Submit Property Inquiry
async function submitInquiry(event) {
    event.preventDefault();
    
    const submitBtn = event.target.querySelector('button');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    
    const inquiryData = {
        name: document.getElementById('customerName')?.value,
        email: document.getElementById('customerEmail')?.value,
        phone: document.getElementById('customerPhone')?.value,
        budget: document.getElementById('customerBudget')?.value,
        timeline: document.getElementById('customerTimeline')?.value,
        requirements: document.getElementById('customerRequirements')?.value,
        propertyId: currentPropertyId,
        propertyTitle: document.getElementById('propertyTitle')?.textContent?.replace('Property: ', ''),
        timestamp: new Date().toISOString(),
        status: 'new',
        source: 'website_inquiry'
    };
    
    try {
        await addDoc(inquiriesCollection, inquiryData);
        showToast('✅ Inquiry submitted! Our agent will contact you soon.');
        closeInquiryModal();
        
        // Save user email for dashboard
        localStorage.setItem('userEmail', inquiryData.email);
        
    } catch (error) {
        console.error("Error:", error);
        showToast('❌ Error submitting inquiry. Please try again.', true);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Submit Contact Form
async function submitContact(event) {
    event.preventDefault();
    
    const contactData = {
        name: document.getElementById('contactName')?.value,
        email: document.getElementById('contactEmail')?.value,
        phone: document.getElementById('contactPhone')?.value,
        message: document.getElementById('contactMessage')?.value,
        timestamp: new Date().toISOString(),
        type: 'contact'
    };
    
    try {
        await addDoc(contactsCollection, contactData);
        showToast('✅ Message sent! We\'ll get back to you soon.');
        event.target.reset();
    } catch (error) {
        showToast('❌ Error sending message', true);
    }
}

// Subscribe to Newsletter
async function subscribeNewsletter() {
    const email = document.getElementById('newsletterEmail')?.value;
    if (!email) {
        showToast('Please enter your email', true);
        return;
    }
    
    try {
        await addDoc(subscribersCollection, {
            email: email,
            timestamp: new Date().toISOString()
        });
        showToast('✅ Subscribed to newsletter!');
        document.getElementById('newsletterEmail').value = '';
    } catch (error) {
        showToast('❌ Error subscribing', true);
    }
}

// Show Toast Notification
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.style.backgroundColor = isError ? '#e74c3c' : '#27ae60';
        toast.textContent = message;
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    } else {
        alert(message);
    }
}

// Apply Filters
function applyFilters() {
    const filters = {
        type: document.getElementById('filterType')?.value || '',
        bedrooms: document.getElementById('filterBedrooms')?.value || '',
        price: document.getElementById('filterPrice')?.value || '',
        search: document.getElementById('searchInput')?.value || ''
    };
    loadProperties(filters);
}

function resetFilters() {
    const filterElements = ['filterType', 'filterBedrooms', 'filterPrice', 'searchInput'];
    filterElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
    });
    loadProperties({});
}

// Search Properties
function searchProperties() {
    const searchTerm = document.getElementById('searchInput')?.value || '';
    loadProperties({ search: searchTerm });
}

// Check URL Parameters for direct property access
function checkURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('property');
    if (propertyId) {
        openInquiryModal(propertyId, 'Property');
    }
}

// Setup all Event Listeners
function setupEventListeners() {
    // Inquiry form
    const inquiryForm = document.getElementById('inquiryForm');
    if (inquiryForm) {
        inquiryForm.addEventListener('submit', submitInquiry);
    }
    
    // Contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', submitContact);
    }
    
    // Subscribe button
    const subscribeBtn = document.getElementById('subscribeBtn');
    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', subscribeNewsletter);
    }
    
    // Search button
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', searchProperties);
    }
    
    // Search input enter key
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchProperties();
        });
    }
    
    // Filter change listeners
    const filterType = document.getElementById('filterType');
    const filterBedrooms = document.getElementById('filterBedrooms');
    const filterPrice = document.getElementById('filterPrice');
    
    if (filterType) filterType.addEventListener('change', applyFilters);
    if (filterBedrooms) filterBedrooms.addEventListener('change', applyFilters);
    if (filterPrice) filterPrice.addEventListener('change', applyFilters);
    
    // Modal close buttons
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });
    
    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// Export functions for global use
window.openInquiryModal = openInquiryModal;
window.closeInquiryModal = closeInquiryModal;
window.toggleWishlist = toggleWishlist;
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;
window.searchProperties = searchProperties;