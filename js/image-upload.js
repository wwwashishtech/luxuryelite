// Image Upload JavaScript - Handle property images

import { 
    storage, 
    ref, 
    uploadBytes, 
    getDownloadURL, 
    deleteObject,
    listAll
} from './firebase-config.js';

// Upload multiple images
export async function uploadPropertyImages(files, propertyId) {
    const uploadedUrls = [];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imageRef = ref(storage, `properties/${propertyId}/${Date.now()}_${file.name}`);
        
        try {
            const snapshot = await uploadBytes(imageRef, file);
            const url = await getDownloadURL(snapshot.ref);
            uploadedUrls.push(url);
        } catch (error) {
            console.error("Error uploading image:", error);
        }
    }
    
    return uploadedUrls;
}

// Upload single image
export async function uploadSingleImage(file, path) {
    const imageRef = ref(storage, path);
    
    try {
        const snapshot = await uploadBytes(imageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        return url;
    } catch (error) {
        console.error("Error uploading image:", error);
        return null;
    }
}

// Delete image
export async function deleteImage(imageUrl) {
    try {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
        return true;
    } catch (error) {
        console.error("Error deleting image:", error);
        return false;
    }
}

// Get all images for a property
export async function getPropertyImages(propertyId) {
    const imagesRef = ref(storage, `properties/${propertyId}`);
    
    try {
        const result = await listAll(imagesRef);
        const urls = await Promise.all(
            result.items.map(async (item) => {
                return await getDownloadURL(item);
            })
        );
        return urls;
    } catch (error) {
        console.error("Error getting images:", error);
        return [];
    }
}

// Preview images before upload
export function previewImages(files, previewContainer) {
    previewContainer.innerHTML = '';
    
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.width = '100px';
            img.style.height = '100px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '5px';
            img.style.margin = '5px';
            previewContainer.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
}

// Setup image upload handler for admin panel
export function setupImageUpload(uploadInputId, previewContainerId, propertyId) {
    const uploadInput = document.getElementById(uploadInputId);
    const previewContainer = document.getElementById(previewContainerId);
    
    if (uploadInput) {
        uploadInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            previewImages(files, previewContainer);
            
            // Auto-upload if propertyId exists
            if (propertyId) {
                const urls = await uploadPropertyImages(files, propertyId);
                console.log('Uploaded images:', urls);
                return urls;
            }
        });
    }
}