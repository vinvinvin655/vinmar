document.addEventListener('DOMContentLoaded', () => {
    // Check and fix any users missing IDs
    fixUsersMissingIds();
    
    // Check if user is already logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' || sessionStorage.getItem('isLoggedIn') === 'true';
    const sessionExpiration = localStorage.getItem('sessionExpiration');
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    const userEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
    const userFullName = localStorage.getItem('userFullName') || sessionStorage.getItem('userFullName');
    
    // Log authentication state for debugging
    console.log('Auth state:', {
        isLoggedIn,
        sessionExpiration,
        userId,
        userEmail,
        userFullName
    });

    if (isLoggedIn) {
        // Check if session has expired
        if (sessionExpiration && new Date(sessionExpiration) < new Date()) {
            // Session expired, clear storage
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'login.html';
            return;
        }
        
        // User is signed in
        if (window.location.pathname.includes('login.html') || 
            window.location.pathname.includes('signup.html')) {
            // Redirect to home page if already logged in
            window.location.href = 'index.html';
        }
        
        // Update UI for logged-in state
        const authButtons = document.querySelector('.auth-buttons');
        const profileSection = document.querySelector('.profile-section');
        const userFullnameSpan = document.querySelector('.user-fullname');
        
        if (authButtons) authButtons.style.display = 'none';
        if (profileSection) profileSection.style.display = 'flex';
        if (userFullnameSpan) userFullnameSpan.textContent = userFullName;
    } else {
        // User is signed out
        if (!window.location.pathname.includes('login.html') && 
            !window.location.pathname.includes('signup.html') &&
            !window.location.pathname.includes('index.html')) {
            // Only redirect to login if not on public pages
            window.location.href = 'login.html';
        }
        
        // Update UI for logged-out state
        const authButtons = document.querySelector('.auth-buttons');
        const profileSection = document.querySelector('.profile-section');
        
        if (authButtons) authButtons.style.display = 'flex';
        if (profileSection) profileSection.style.display = 'none';
    }

    // Get the forms
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    // Handle password visibility toggle
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent form submission
            const targetId = this.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);
            
            if (!passwordInput) {
                console.error('Password input not found:', targetId);
                return;
            }
            
            // Toggle password visibility
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            } else {
                passwordInput.type = 'password';
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            }
        });
    });

    // Handle Login Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const rememberMe = document.getElementById('rememberMe').checked;

            // Show loading state
            const loginButton = document.querySelector('.auth-button');
            loginButton.disabled = true;

            // Show loading alert
            Swal.fire({
                title: 'Logging in...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Get registered users from localStorage
            const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            
            // Find user with matching email and password
            const user = registeredUsers.find(u => u.email === email && u.password === password);
            
            if (user) {
                // User found, login successful
                
                // Generate a unique user ID if not already present
                if (!user.id) {
                    user.id = 'user_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                    // Update user in registeredUsers
                    const userIndex = registeredUsers.findIndex(u => u.email === user.email);
                    if (userIndex !== -1) {
                        registeredUsers[userIndex] = user;
                        localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
                    }
                }
                
                // Store user data in localStorage or sessionStorage based on remember me
                if (rememberMe) {
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('userId', user.id);
                    localStorage.setItem('userEmail', user.email);
                    localStorage.setItem('userFullName', user.fullName);
                    localStorage.setItem('rememberMe', 'true');
                    
                    // Set expiration date (30 days from now)
                    const expirationDate = new Date();
                    expirationDate.setDate(expirationDate.getDate() + 30);
                    localStorage.setItem('sessionExpiration', expirationDate.toISOString());
                } else {
                    sessionStorage.setItem('isLoggedIn', 'true');
                    sessionStorage.setItem('userId', user.id);
                    sessionStorage.setItem('userEmail', user.email);
                    sessionStorage.setItem('userFullName', user.fullName);
                    sessionStorage.setItem('rememberMe', 'false');
                }
                
                // Update last login time
                user.lastLogin = new Date().toISOString();
                localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
                
                Swal.close();
                showNotification('Login successful! Redirecting...', 'success');
                
                // Redirect to home page after success
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                // User not found or password incorrect
                Swal.close();
                showNotification('Invalid email or password', 'error');
                loginButton.disabled = false;
            }
        });
    }

    // Handle Signup Form Submission
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const termsAccepted = document.getElementById('termsAccepted').checked;

            // Validate passwords match
            if (password !== confirmPassword) {
                showNotification('Passwords do not match', 'error');
                return;
            }

            // Validate terms acceptance
            if (!termsAccepted) {
                showNotification('Please accept the Terms & Conditions', 'error');
                return;
            }

            // Show loading state
            const signupButton = document.querySelector('.auth-button');
            signupButton.disabled = true;

            // Show loading alert
            Swal.fire({
                title: 'Creating account...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Get registered users from localStorage
            const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            
            // Check if email already exists
            if (registeredUsers.some(u => u.email === email)) {
                Swal.close();
                showNotification('Email already registered', 'error');
                signupButton.disabled = false;
                return;
            }

            // Create new user
            const newUser = {
                id: 'user_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
                fullName: fullName,
                email: email,
                password: password,
                profileImage: "",
                graduationYear: "",
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            };
            
            // Add user to registered users
            registeredUsers.push(newUser);
            localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
            
            Swal.close();
            showNotification('Account created successfully! Please login.', 'success');
            
            // Redirect to login page after success
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        });
    }

    // Handle Forgot Password
    const forgotPasswordLink = document.getElementById('forgotPassword');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            
            if (!email) {
                showNotification('Please enter your email address', 'error');
                return;
            }

            // Show loading alert
            Swal.fire({
                title: 'Processing...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            
            // Get registered users from localStorage
            const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            
            // Check if email exists
            if (registeredUsers.some(u => u.email === email)) {
                Swal.close();
                showNotification('Password reset instructions sent to your email (simulated).', 'success');
            } else {
                Swal.close();
                showNotification('Email not found in our records', 'error');
            }
        });
    }

    // Handle Social Login Buttons
    const socialButtons = document.querySelectorAll('.social-btn');
    socialButtons.forEach(button => {
        button.addEventListener('click', () => {
            const provider = button.classList.contains('google') ? 'Google' : 'Facebook';
            console.log(`${provider} login clicked`);
            // Here you would implement the OAuth flow for the respective provider
        });
    });
});

// Show notification using SweetAlert2
function showNotification(message, type = 'success') {
    // Check if the message is related to enrollment
    const isEnrollmentNotification = message.includes('enrollment request');
    
    // Use different settings for enrollment notifications
    if (isEnrollmentNotification) {
        // For enrollment notifications, use a more prominent modal instead of a toast
        Swal.fire({
            title: message.includes('approved') ? 'Enrollment Request Approved!' : 'Enrollment Request Rejected',
            text: message,
            icon: type,
            confirmButtonText: 'View Course',
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: true,
            showCloseButton: false,
            timer: 10000, // Longer display time
            timerProgressBar: true,
            didOpen: () => {
                // Play a sound or show animation to draw attention
                const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3');
                audio.play().catch(e => console.log('Audio play failed:', e));
            }
        }).then((result) => {
            if (result.isConfirmed) {
                // If it's an approval notification, redirect to courses page
                if (type === 'success' && message.includes('approved')) {
                    window.location.href = 'index.html#courses';
                }
            }
        });
    } else {
        // Regular notification
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer)
                toast.addEventListener('mouseleave', Swal.resumeTimer)
            }
        });

        Toast.fire({
            icon: type,
            title: message,
            background: type === 'success' ? '#4CAF50' : '#f44336',
            color: '#fff',
            iconColor: '#fff',
            customClass: {
                popup: 'animated fadeInDown'
            }
        });
    }
}

// Function to check and fix any users missing IDs
function fixUsersMissingIds() {
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    let usersFixed = false;
    
    // Check each user and add an ID if missing
    const updatedUsers = registeredUsers.map(user => {
        if (!user.id) {
            usersFixed = true;
            return {
                ...user,
                id: 'user_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
            };
        }
        return user;
    });
    
    // If any users were fixed, update localStorage
    if (usersFixed) {
        localStorage.setItem('registeredUsers', JSON.stringify(updatedUsers));
        console.log('Fixed users missing IDs');
    }
} 