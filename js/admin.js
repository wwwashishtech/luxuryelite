// Admin Panel JavaScript - Complete Property Management

import { 
    db, 
    storage,
    auth,
    propertiesCollection, 
    inquiriesCollection, 
    contactsCollection, 
    subscribersCollection,
    addDoc, 
    getDocs, 
    getDoc, 
    doc, 
    updateDoc, 
    deleteDoc,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
    signOut,
    onAuthStateChanged
} from './firebase-config.js';

// Authentication Check
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Redirect to login if not authenticated
        if (!window.location.href.includes('login.html')) {
            window.location.href = 'login.html';
        }
    } else {
        // Load admin data
        loadDashboard();
        loadProperties();
        loadInquiries();
        loadContacts();
        loadSubscribers();
    }
});

// Tab Navigation
window.showTab = function(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName + 'Tab');
    if (selectedTab) selectedTab.classList.add('active');
    
    // Update active menu item
    document.querySelectorAll('.sidebar-menu li').forEach(li => {
        li.classList.remove('active');
    });
    
    // Load tab data
    if (tabName === 'dashboard') loadDashboard();
    if (tabName === 'properties') loadProperties();
    if (tabName === 'inquiries') loadInquiries();
    if (tabName === 'contacts') loadContacts();
    if (tabName === 'subscribers') loadSubscribers();
}

// Load Dashboard Stats
async function loadDashboard() {
    try {
        const properties = await getDocs(propertiesCollection);
        const inquiries = await getDocs(inquiriesCollection);
        const contacts = await getDocs(contactsCollection);
        const subscribers = await getDocs(subscribersCollection);
        
        const totalProperties = document.getElementById('totalProperties');
        const totalInquiries = document.getElementById('totalInquiries');
        const totalContacts = document.getElementById('totalContacts');
        const totalSubscribers = document.getElementById('totalSubscribers');
        
        if (totalProperties) totalProperties.textContent = properties.size;
        if (totalInquiries) totalInquiries.textContent = inquiries.size;
        if (totalContacts) totalContacts.textContent = contacts.size;
        if (totalSubscribers) totalSubscribers.textContent = subscribers.size;
        
    } catch (error) {
        console.error("Error loading dashboard:", error);
    }
}

// Load Properties for Admin
async function loadProperties() {
    const propertiesList = document.getElementById('propertiesList');
    if (!propertiesList) return;
    
    propertiesList.innerHTML = '<div style="padding:1rem;">Loading properties...</div>';
    
    try {
        const snapshot = await getDocs(propertiesCollection);
        const properties = [];
        snapshot.forEach(doc => {
            properties.push({ id: doc.id, ...doc.data() });
        });
        
        if (properties.length === 0) {
            propertiesList.innerHTML = '<p style="padding:1rem;">No properties yet. Click "Add Property" to get started.</p>';
            return;
        }
        
        propertiesList.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Title</th>
                        <th>Price</th>
                        <th>Location</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${properties.map(p => `
                        <tr>
                            <td><img src="${p.imageUrl || 'https://via.placeholder.com/50'}" style="width:50px;height:50px;object-fit:cover;border-radius:5px;"></td>
                            <td>${p.title}</td>
                            <td>$${p.price?.toLocaleString()}</td>
                            <td>${p.location}</td>
                            <td>${p.type}</td>
                            <td><span class="status-badge status-${p.status}">${p.status}</span></td>
                            <td>
                                <button class="btn-edit" onclick="editProperty('${p.id}')">Edit</button>
                                <button class="btn-delete" onclick="deleteProperty('${p.id}')">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
    } catch (error) {
        console.error("Error loading properties:", error);
        propertiesList.innerHTML = '<p style="padding:1rem;color:red;">Error loading properties.</p>';
    }
}

// Load Inquiries/Leads
async function loadInquiries() {
    const inquiriesList = document.getElementById('inquiriesList');
    if (!inquiriesList) return;
    
    inquiriesList.innerHTML = '<div style="padding:1rem;">Loading inquiries...</div>';
    
    try {
        const snapshot = await getDocs(inquiriesCollection);
        const inquiries = [];
        snapshot.forEach(doc => {
            inquiries.push({ id: doc.id, ...doc.data() });
        });
        
        inquiries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        if (inquiries.length === 0) {
            inquiriesList.innerHTML = '<p style="padding:1rem;">No inquiries yet.</p>';
            return;
        }
        
        inquiriesList.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Property</th>
                        <th>Budget</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${inquiries.map(i => `
                        <tr>
                            <td>${new Date(i.timestamp).toLocaleDateString()}</td>
                            <td>${i.name}</td>
                            <td>${i.phone}</td>
                            <td>${i.email}</td>
                            <td>${i.propertyTitle || 'N/A'}</td>
                            <td>${i.budget || 'N/A'}</td>
                            <td>
                                <select class="status-select" data-id="${i.id}" data-status="${i.status}">
                                    <option value="new" ${i.status === 'new' ? 'selected' : ''}>New</option>
                                    <option value="contacted" ${i.status === 'contacted' ? 'selected' : ''}>Contacted</option>
                                    <option value="converted" ${i.status === 'converted' ? 'selected' : ''}>Converted</option>
                                </select>
                            </td>
                            <td>
                                <button onclick="callCustomer('${i.phone}')" style="background:#27ae60;color:white;border:none;padding:0.3rem 0.6rem;border-radius:3px;cursor:pointer;">📞 Call</button>
                                <button onclick="whatsappCustomer('${i.phone}', '${i.name}')" style="background:#25D366;color:white;border:none;padding:0.3rem 0.6rem;border-radius:3px;cursor:pointer;">💬 WhatsApp</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        // Add status change listeners
        document.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', async (e) => {
                const id = select.dataset.id;
                const newStatus = select.value;
                await updateDoc(doc(db, "inquiries", id), { status: newStatus });
                showAlert('Status updated!', 'success');
            });
        });
        
    } catch (error) {
        console.error("Error loading inquiries:", error);
        inquiriesList.innerHTML = '<p style="padding:1rem;color:red;">Error loading inquiries.</p>';
    }
}

// Load Contacts
async function loadContacts() {
    const contactsList = document.getElementById('contactsList');
    if (!contactsList) return;
    
    contactsList.innerHTML = '<div style="padding:1rem;">Loading messages...</div>';
    
    try {
        const snapshot = await getDocs(contactsCollection);
        const contacts = [];
        snapshot.forEach(doc => {
            contacts.push({ id: doc.id, ...doc.data() });
        });
        
        contacts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        if (contacts.length === 0) {
            contactsList.innerHTML = '<p style="padding:1rem;">No messages yet.</p>';
            return;
        }
        
        contactsList.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Message</th>
                    </tr>
                </thead>
                <tbody>
                    ${contacts.map(c => `
                        <tr>
                            <td>${new Date(c.timestamp).toLocaleDateString()}</td>
                            <td>${c.name}</td>
                            <td>${c.email}</td>
                            <td>${c.phone}</td>
                            <td>${c.message?.substring(0, 100) || 'N/A'}...</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
    } catch (error) {
        console.error("Error loading contacts:", error);
        contactsList.innerHTML = '<p style="padding:1rem;color:red;">Error loading messages.</p>';
    }
}

// Load Subscribers
async function loadSubscribers() {
    const subscribersList = document.getElementById('subscribersList');
    if (!subscribersList) return;
    
    subscribersList.innerHTML = '<div style="padding:1rem;">Loading subscribers...</div>';
    
    try {
        const snapshot = await getDocs(subscribersCollection);
        const subscribers = [];
        snapshot.forEach(doc => {
            subscribers.push({ id: doc.id, ...doc.data() });
        });
        
        if (subscribers.length === 0) {
            subscribersList.innerHTML = '<p style="padding:1rem;">No subscribers yet.</p>';
            return;
        }
        
        subscribersList.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Subscribed Date</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${subscribers.map(s => `
                        <tr>
                            <td>${s.email}</td>
                            <td>${new Date(s.timestamp).toLocaleDateString()}</td>
                            <td><button onclick="deleteSubscriber('${s.id}')" class="btn-delete">Delete</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
    } catch (error) {
        console.error("Error loading subscribers:", error);
        subscribersList.innerHTML = '<p style="padding:1rem;color:red;">Error loading subscribers.</p>';
    }
}

// Property CRUD Operations
window.openPropertyModal = function(property = null) {
    const modal = document.getElementById('propertyModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('propertyForm');
    
    if (modal) modal.style.display = 'block';
    if (modalTitle) modalTitle.textContent = property ? 'Edit Property' : 'Add New Property';
    
    if (property) {
        document.getElementById('propertyId').value = property.id;
        document.getElementById('propTitle').value = property.title || '';
        document.getElementById('propPrice').value = property.price || '';
        document.getElementById('propLocation').value = property.location || '';
        document.getElementById('propType').value = property.type || 'Apartment';
        document.getElementById('propBedrooms').value = property.bedrooms || '';
        document.getElementById('propBathrooms').value = property.bathrooms || '';
        document.getElementById('propArea').value = property.area || '';
        document.getElementById('propImageUrl').value = property.imageUrl || '';
        document.getElementById('propDescription').value = property.description || '';
        document.getElementById('propStatus').value = property.status || 'available';
    } else {
        if (form) form.reset();
        document.getElementById('propertyId').value = '';
    }
}

window.closePropertyModal = function() {
    const modal = document.getElementById('propertyModal');
    if (modal) modal.style.display = 'none';
    document.getElementById('propertyForm')?.reset();
}

window.editProperty = async function(id) {
    const docRef = doc(db, "properties", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        openPropertyModal({ id, ...docSnap.data() });
    }
}

window.deleteProperty = async function(id) {
    if (confirm('Are you sure you want to delete this property?')) {
        try {
            await deleteDoc(doc(db, "properties", id));
            showAlert('Property deleted successfully!', 'success');
            loadProperties();
        } catch (error) {
            showAlert('Error deleting property', 'error');
        }
    }
}

window.deleteSubscriber = async function(id) {
    if (confirm('Delete this subscriber?')) {
        await deleteDoc(doc(db, "subscribers", id));
        loadSubscribers();
        showAlert('Subscriber deleted!', 'success');
    }
}

// Save Property
document.getElementById('propertyForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const propertyId = document.getElementById('propertyId').value;
    const propertyData = {
        title: document.getElementById('propTitle').value,
        price: parseInt(document.getElementById('propPrice').value),
        location: document.getElementById('propLocation').value,
        type: document.getElementById('propType').value,
        bedrooms: parseInt(document.getElementById('propBedrooms').value),
        bathrooms: parseInt(document.getElementById('propBathrooms').value),
        area: parseInt(document.getElementById('propArea').value),
        imageUrl: document.getElementById('propImageUrl').value,
        description: document.getElementById('propDescription').value,
        status: document.getElementById('propStatus').value,
        updatedAt: new Date().toISOString()
    };
    
    try {
        if (propertyId) {
            await updateDoc(doc(db, "properties", propertyId), propertyData);
            showAlert('Property updated successfully!', 'success');
        } else {
            propertyData.createdAt = new Date().toISOString();
            await addDoc(propertiesCollection, propertyData);
            showAlert('Property added successfully!', 'success');
        }
        closePropertyModal();
        loadProperties();
    } catch (error) {
        console.error("Error saving property:", error);
        showAlert('Error saving property', 'error');
    }
});

// Helper Functions
window.callCustomer = function(phone) {
    window.location.href = `tel:${phone}`;
}

window.whatsappCustomer = function(phone, name) {
    const msg = `Hello ${name}, this is from Elite Estate. I'm following up on your property inquiry.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
}

function showAlert(message, type) {
    alert(message);
}

window.logout = async function() {
    await signOut(auth);
    window.location.href = 'login.html';
}