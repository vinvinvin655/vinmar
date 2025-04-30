// Navigation scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.backgroundColor = '#ffffff';
        navbar.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
    } else {
        navbar.style.backgroundColor = 'transparent';
        navbar.style.boxShadow = 'none';
    }
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Check authentication state
function checkAuthState() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' || sessionStorage.getItem('isLoggedIn') === 'true';
    const authButtons = document.querySelector('.auth-buttons');
    const profileSection = document.querySelector('.profile-section');
    
    if (isLoggedIn) {
        // Hide auth buttons and show profile section
        authButtons.style.display = 'none';
        profileSection.style.display = 'flex';
        
        // Get user information
        const userEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
        const userFullName = localStorage.getItem('userFullName') || sessionStorage.getItem('userFullName');
        const storageKey = `userProfileImage_${userEmail}`;
        const userProfileImage = localStorage.getItem(storageKey) || sessionStorage.getItem(storageKey);
        
        // Update profile information
        const userFullnameSpan = profileSection.querySelector('.user-fullname');
        if (userFullName) {
            userFullnameSpan.textContent = userFullName;
        } else {
            // If no full name is available, try to get it from registered users
            const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            const user = registeredUsers.find(user => user.email === userEmail);
            if (user) {
                userFullnameSpan.textContent = user.fullName;
                // Store it for future use
                localStorage.setItem('userFullName', user.fullName);
            } else {
                userFullnameSpan.textContent = userEmail;
            }
        }
        
        // Update profile icon if image is available, otherwise use default icon
        if (userProfileImage) {
            updateProfileIcon(userProfileImage);
        } else {
            // Set default profile icon
            const profileIcon = document.querySelector('.profile-icon');
            profileIcon.innerHTML = '<i class="fas fa-user-circle"></i>';
        }
        
        // Add logout event listener
        const logoutBtn = profileSection.querySelector('.logout-btn');
        logoutBtn.addEventListener('click', handleLogout);
        
        // Add profile dropdown functionality
        setupProfileDropdown();
    } else {
        // Show auth buttons and hide profile section
        authButtons.style.display = 'flex';
        profileSection.style.display = 'none';
    }
}

// Handle logout
function handleLogout() {
    // Clear authentication state
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userFullName');
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userFullName');
    
    // Redirect to login page
    window.location.href = 'login.html';
}

// Call checkAuthState when the page loads
document.addEventListener('DOMContentLoaded', checkAuthState);

// Course enrollment
document.querySelectorAll('.enroll-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const courseName = this.parentElement.querySelector('h3').textContent;
        alert(`Enrolled in ${courseName}!`);
    });
});

// Forum topic selection
document.querySelectorAll('.forum-topics li').forEach(topic => {
    topic.addEventListener('click', function() {
        document.querySelectorAll('.forum-topics li').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        // Add your forum topic filtering logic here
    });
});

// E-book download
document.querySelectorAll('.download-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const bookName = this.parentElement.querySelector('h3').textContent;
        alert(`Downloading ${bookName}...`);
        // Add your download logic here
    });
});

// Add animation to feature cards
const featureCards = document.querySelectorAll('.feature-card');
const observerOptions = {
    threshold: 0.5
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

featureCards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.5s ease-out';
    observer.observe(card);
});

// Add styles for modal
const style = document.createElement('style');
style.textContent = `
    .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
        z-index: 1000;
    }

    .modal-content {
        background-color: white;
        margin: 15% auto;
        padding: 20px;
        border-radius: 10px;
        width: 80%;
        max-width: 500px;
        position: relative;
    }

    .close {
        position: absolute;
        right: 20px;
        top: 10px;
        font-size: 28px;
        cursor: pointer;
    }

    .modal form {
        display: flex;
        flex-direction: column;
        gap: 15px;
        margin-top: 20px;
    }

    .modal input {
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 5px;
    }

    .modal button {
        padding: 10px;
        background-color: #3498db;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }

    .modal button:hover {
        background-color: #2980b9;
    }

    /* Profile Section Styles */
    .profile-section {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-left: 20px;
    }

    .profile-icon {
        font-size: 2.5em;
        color: #343a40;
        cursor: pointer;
        transition: transform 0.3s ease;
    }

    .profile-icon:hover {
        transform: scale(1.1);
    }

    .profile-info {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }

    .user-fullname {
        font-weight: 600;
        color: #343a40;
        font-size: 0.9em;
    }

    .logout-btn {
        background: none;
        border: none;
        color: #6c757d;
        font-size: 0.8em;
        cursor: pointer;
        padding: 0;
        margin-top: 2px;
    }

    .logout-btn:hover {
        color: #343a40;
        text-decoration: underline;
    }
`;

document.head.appendChild(style);

// Setup profile dropdown functionality
function setupProfileDropdown() {
    const profileDropdown = document.querySelector('.profile-dropdown');
    const dropdownContent = document.querySelector('.dropdown-content');
    
    // Toggle dropdown on click
    profileDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        dropdownContent.style.display = 'none';
    });
    
    // Prevent dropdown from closing when clicking inside it
    dropdownContent.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // Handle logout button
    const logoutBtn = document.querySelector('.logout-btn');
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
    });
}

// Update profile icon with custom image
function updateProfileIcon(imageUrl) {
    const profileIcon = document.querySelector('.profile-icon');
    
    // Clear existing content
    profileIcon.innerHTML = '';
    
    // Create and append image element
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = 'Profile Image';
    
    // Add specific styling for the profile icon image
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '50%';
    
    // Handle image load error
    img.onerror = function() {
        // If image fails to load, revert to default icon
        profileIcon.innerHTML = '<i class="fas fa-user-circle"></i>';
    };
    
    profileIcon.appendChild(img);
}