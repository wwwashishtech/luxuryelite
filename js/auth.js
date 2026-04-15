// Authentication JavaScript - Login & Registration

import { 
    auth, 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    onAuthStateChanged
} from './firebase-config.js';

// Check authentication state
onAuthStateChanged(auth, (user) => {
    const loginBtn = document.getElementById('loginBtn');
    const userInfo = document.getElementById('userInfo');
    
    if (user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (userInfo) {
            userInfo.style.display = 'block';
            userInfo.innerHTML = `<i class="fas fa-user"></i> ${user.email} | <a href="#" onclick="logout()">Logout</a>`;
        }
    } else {
        if (loginBtn) loginBtn.style.display = 'block';
        if (userInfo) userInfo.style.display = 'none';
    }
});

// Login function
window.login = async function(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        showMessage('Login successful!', 'success');
        window.location.href = 'admin.html';
        return userCredential.user;
    } catch (error) {
        showMessage(error.message, 'error');
        return null;
    }
}

// Register function
window.register = async function(email, password, name) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        showMessage('Registration successful!', 'success');
        window.location.href = 'login.html';
        return userCredential.user;
    } catch (error) {
        showMessage(error.message, 'error');
        return null;
    }
}

// Reset password
window.resetPassword = async function(email) {
    try {
        await sendPasswordResetEmail(auth, email);
        showMessage('Password reset email sent!', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// Logout function
window.logout = async function() {
    try {
        await auth.signOut();
        showMessage('Logged out successfully!', 'success');
        window.location.href = 'index.html';
    } catch (error) {
        showMessage('Error logging out', 'error');
    }
}

// Show message helper
function showMessage(message, type) {
    const msgDiv = document.getElementById('authMessage');
    if (msgDiv) {
        msgDiv.textContent = message;
        msgDiv.style.color = type === 'success' ? 'green' : 'red';
        setTimeout(() => {
            msgDiv.textContent = '';
        }, 3000);
    } else {
        alert(message);
    }
}

// Handle login form
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    if (email && password) {
        await login(email, password);
    }
});

// Handle register form
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name')?.value;
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    
    if (password !== confirmPassword) {
        showMessage('Passwords do not match!', 'error');
        return;
    }
    
    if (name && email && password) {
        await register(email, password, name);
    }
});