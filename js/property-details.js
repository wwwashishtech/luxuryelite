// Property Details Page JavaScript

import { 
    db, 
    propertiesCollection, 
    inquiriesCollection,
    getDoc, 
    doc, 
    addDoc,
    where
} from './firebase-config.js';

// Get property ID from URL
const urlParams = new URLSearchParams(window.location.search);
const propertyId = urlParams.get('id');

// Load property details on page load
document.addEventListener('DOMContentLoaded', () => {
    if (propertyId) {
        loadPropertyDetails(propertyId);
    } else {
        showError('Property not found');
    }
    
    setupInquiryForm();
});

async function loadPropertyDetails(id) {
    const container = document.getElementById('propertyDetail');
    if (!container) return;
    
    container.innerHTML = '<div style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-spin"></i> Loading property details...</div>';
    
    try {
        const docRef = doc(db, "properties", id);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            container.innerHTML = '<div style="text-align:center; padding:2rem;">Property not found</div>';
            return;
        }
        
        const property = { id: docSnap.id, ...docSnap.data() };
        displayPropertyDetails(property);
        
    } catch (error) {
        console.error("Error loading property:", error);
        container.innerHTML = '<div style="text-align:center; padding:2rem; color:red;">Error loading property details</div>';
    }
}

function displayPropertyDetails(property) {
    const container = document.getElementById('propertyDetail');
    
    container.innerHTML = `
        <div class="property-gallery">
            <div class="main-image">
                <img id="mainImage" src="${property.imageUrl || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'}" alt="${property.title}">
            </div>
            <div class="thumbnails">
                <img src="${property.imageUrl || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400'}" onclick="changeImage(this.src)">
                <img src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400" onclick="changeImage(this.src)">
                <img src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400" onclick="changeImage(this.src)">
                <img src="https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=400" onclick="changeImage(this.src)">
            </div>
        </div>
        <div class="property-content">
            <h1 class="property-title">${property.title}</h1>
            <div class="property-price">$${property.price?.toLocaleString()}</div>
            <div class="property-location"><i class="fas fa-map-marker-alt"></i> ${property.location}</div>
            
            <div class="features-grid">
                <div class="feature-item">
                    <i class="fas fa-bed"></i>
                    <h4>${property.bedrooms} Bedrooms</h4>
                </div>
                <div class="feature-item">
                    <i class="fas fa-bath"></i>
                    <h4>${property.bathrooms} Bathrooms</h4>
                </div>
                <div class="feature-item">
                    <i class="fas fa-vector-square"></i>
                    <h4>${property.area} sqft</h4>
                </div>
                <div class="feature-item">
                    <i class="fas fa-building"></i>
                    <h4>${property.type}</h4>
                </div>
            </div>
            
            <div class="description">
                <h3>Description</h3>
                <p>${property.description || 'This beautiful property offers modern amenities, prime location, and excellent investment potential.'}</p>
            </div>
            
            <div class="inquiry-section">
                <h3><i class="fas fa-envelope"></i> Interested in this Property?</h3>
                <p>Fill out the form below and our agent will contact you within 24 hours.</p>
                <form class="inquiry-form" id="inquiryForm">
                    <input type="text" id="customerName" placeholder="Full Name" required>
                    <input type="email" id="customerEmail" placeholder="Email Address" required>
                    <input type="tel" id="customerPhone" placeholder="Phone Number" required>
                    <select id="customerBudget">
                        <option value="">Select Budget Range</option>
                        <option value="100k-300k">$100k - $300k</option>
                        <option value="300k-500k">$300k - $500k</option>
                        <option value="500k-1M">$500k - $1M</option>
                        <option value="1M+">$1M+</option>
                    </select>
                    <select id="customerTimeline">
                        <option value="">When do you plan to buy?</option>
                        <option value="immediate">Immediately</option>
                        <option value="1-3months">Within 1-3 months</option>
                        <option value="3-6months">Within 3-6 months</option>
                        <option value="6-12months">Within 6-12 months</option>
                    </select>
                    <textarea id="customerRequirements" rows="3" placeholder="Additional requirements..."></textarea>
                    <input type="hidden" id="propertyId" value="${property.id}">
                    <button type="submit">Submit Inquiry <i class="fas fa-arrow-right"></i></button>
                </form>
            </div>
        </div>
    `;
    
    // Set up form handler
    setupInquiryForm();
}

function setupInquiryForm() {
    const form = document.getElementById('inquiryForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        
        const inquiryData = {
            name: document.getElementById('customerName')?.value,
            email: document.getElementById('customerEmail')?.value,
            phone: document.getElementById('customerPhone')?.value,
            budget: document.getElementById('customerBudget')?.value,
            timeline: document.getElementById('customerTimeline')?.value,
            requirements: document.getElementById('customerRequirements')?.value,
            propertyId: document.getElementById('propertyId')?.value,
            propertyTitle: document.querySelector('.property-title')?.textContent,
            timestamp: new Date().toISOString(),
            status: 'new',
            source: 'property_detail_page'
        };
        
        try {
            await addDoc(inquiriesCollection, inquiryData);
            alert('✅ Inquiry submitted! Our agent will contact you soon.');
            form.reset();
        } catch (error) {
            console.error("Error:", error);
            alert('❌ Error submitting inquiry. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Submit Inquiry <i class="fas fa-arrow-right"></i>';
        }
    });
}

// Global function for image gallery
window.changeImage = function(src) {
    const mainImage = document.getElementById('mainImage');
    if (mainImage) {
        mainImage.src = src;
    }
}

function showError(message) {
    const container = document.getElementById('propertyDetail');
    if (container) {
        container.innerHTML = `<div style="text-align:center; padding:2rem; color:red;">${message}</div>`;
    }
}