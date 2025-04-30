// Teacher Dashboard JavaScript

// Global variables
let enrollmentRequests = [];
let filteredEnrollmentRequests = [];

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in and is a teacher
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    const userRole = sessionStorage.getItem('userRole');
    const session = JSON.parse(sessionStorage.getItem('userSession') || 'null');
    
    console.log('Auth Check:', { isLoggedIn, userRole, session });
    
    if (!isLoggedIn || userRole !== 'teacher' || !session) {
        console.log('Authentication failed, redirecting to login');
        window.location.href = 'teacher-login.html';
        return;
    }
    
    // Set teacher name
    const teacherName = session.name || sessionStorage.getItem('userFullName');
    document.getElementById('teacher-name').textContent = teacherName;
    
    // Load teacher's courses
    loadTeacherCourses();
    
    // Load teacher's students
    loadTeacherStudents();
    
    // Load enrollment requests
    loadEnrollmentRequests();
    
    // Initialize materials
    loadMaterials();
    
    // Setup event listeners for modals
    setupModalHandlers();
    
    // Setup file upload handlers
    setupFileUploadHandlers();
    
    // Setup logout handler
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Setup form submission handlers
    setupFormSubmissionHandlers();
    
    // Setup enrollment request handlers
    setupEnrollmentRequestHandlers();
    
    // Setup real-time updates for enrollment requests
    setupEnrollmentRequestUpdates();
    
    // Listen for custom enrollment request events
    window.addEventListener('enrollmentRequestCreated', (event) => {
        console.log('Enrollment request created event detected:', event.detail);
        loadEnrollmentRequests();
    });
    
    // Listen for storage events
    window.addEventListener('storage', (e) => {
        if (e.key === 'enrollmentRequests' || e.key === 'lastEnrollmentUpdate') {
            console.log('Storage event detected in main event listener:', e.key);
            loadEnrollmentRequests();
        }
    });
});

// Function to load teacher's courses
function loadTeacherCourses() {
    const teacherId = JSON.parse(sessionStorage.getItem('userSession')).id;
    const allCourses = JSON.parse(localStorage.getItem('courses') || '[]');
    const teacherCourses = allCourses.filter(course => course.teacherId === teacherId);
    
    // Populate courses table
    const tableBody = document.getElementById('courses-table-body');
    if (tableBody) {
        if (teacherCourses.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">No courses found. Create your first course to get started.</td>
                </tr>
            `;
        } else {
            tableBody.innerHTML = teacherCourses.map(course => `
                <tr>
                    <td>${course.title}</td>
                    <td>${course.category}</td>
                    <td>${course.enrolledStudents ? course.enrolledStudents.length : 0}</td>
                    <td>${course.progress || '0%'}</td>
                    <td><span class="status-badge status-${course.status}">${course.status}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-primary btn-sm" onclick="editCourse('${course.id}')">Edit</button>
                            <button class="btn btn-success btn-sm" onclick="uploadMaterials('${course.id}')">Upload</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteCourse('${course.id}')">Delete</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    }
    
    // Populate course filter dropdown
    const courseFilter = document.getElementById('course-filter');
    if (courseFilter) {
        courseFilter.innerHTML = '<option value="">All Courses</option>' + 
            teacherCourses.map(course => `<option value="${course.id}">${course.title}</option>`).join('');
    }
    
    // Populate course select in material upload form
    const materialCourseSelect = document.getElementById('material-course');
    if (materialCourseSelect) {
        materialCourseSelect.innerHTML = teacherCourses.map(course => 
            `<option value="${course.id}">${course.title}</option>`
        ).join('');
    }
    
    // Update stats cards
    updateStatsCards(teacherCourses);
}

// Function to update stats cards with accurate data
function updateStatsCards(courses) {
    // Calculate total courses
    const totalCourses = courses.length;
    
    // Calculate total students (unique students across all courses)
    const uniqueStudents = new Set();
    courses.forEach(course => {
        if (course.enrolledStudents && Array.isArray(course.enrolledStudents)) {
            course.enrolledStudents.forEach(studentId => uniqueStudents.add(studentId));
        }
    });
    const totalStudents = uniqueStudents.size;
    
    // Calculate pending reviews (pending enrollment requests)
    const enrollmentRequests = JSON.parse(localStorage.getItem('enrollmentRequests') || '[]');
    const teacherId = JSON.parse(sessionStorage.getItem('userSession')).id;
    const teacherCourseIds = courses.map(course => course.id);
    const pendingRequests = enrollmentRequests.filter(request => 
        teacherCourseIds.includes(request.courseId) && 
        request.status === 'pending'
    ).length;
    
    // Calculate course issues (courses with no materials)
    const coursesWithIssues = courses.filter(course => 
        !course.materials || course.materials.length === 0
    ).length;
    
    // Update stats cards
    const statsCards = document.querySelectorAll('.stats-card h3');
    if (statsCards.length >= 4) {
        statsCards[0].textContent = totalCourses;
        statsCards[1].textContent = totalStudents;
        statsCards[2].textContent = pendingRequests;
        statsCards[3].textContent = coursesWithIssues;
    }
}

// Function to load teacher's students
function loadTeacherStudents() {
    console.log('Loading teacher students...');
    
    // Get current teacher ID
    const teacherId = JSON.parse(sessionStorage.getItem('userSession')).id;
    console.log('Teacher ID:', teacherId);
    
    // Get all courses for this teacher
    const allCourses = JSON.parse(localStorage.getItem('courses') || '[]');
    const teacherCourses = allCourses.filter(course => course.teacherId === teacherId);
    console.log('Teacher courses:', teacherCourses);
    
    // Get all students from courses
    const allStudents = [];
    const studentMap = new Map(); // To track unique students
    
    teacherCourses.forEach(course => {
        console.log('Processing course:', course.title);
        
        // Check if course has students array
        if (!course.students) {
            console.log('Course has no students array:', course.title);
            // Check if course has enrolledStudents array instead
            if (course.enrolledStudents && Array.isArray(course.enrolledStudents)) {
                console.log('Using enrolledStudents array instead');
                course.students = course.enrolledStudents.map(studentId => {
                    // Try to find student details from users
                    const users = JSON.parse(localStorage.getItem('users') || '[]');
                    const student = users.find(user => user.id === studentId);
                    
                    if (student) {
                        return {
                            id: student.id,
                            name: student.name || student.fullName,
                            email: student.email,
                            enrollmentDate: new Date().toISOString() // Default date
                        };
                    } else {
                        // Create a basic student object if details not found
                        return {
                            id: studentId,
                            name: 'Student ' + studentId,
                            email: 'student' + studentId + '@example.com',
                            enrollmentDate: new Date().toISOString()
                        };
                    }
                });
            } else {
                console.log('Course has no enrolledStudents array either');
                course.students = []; // Initialize empty students array
            }
        }
        
        if (course.students && Array.isArray(course.students)) {
            console.log('Course students:', course.students);
            course.students.forEach(student => {
                if (!studentMap.has(student.id)) {
                    studentMap.set(student.id, {
                        id: student.id,
                        name: student.name,
                        email: student.email,
                        enrolledCourses: [course.title],
                        progress: calculateStudentProgress(student.id, course.id),
                        lastActive: student.enrollmentDate || new Date().toISOString()
                    });
                } else {
                    // Add course to existing student's enrolled courses
                    const existingStudent = studentMap.get(student.id);
                    if (!existingStudent.enrolledCourses.includes(course.title)) {
                        existingStudent.enrolledCourses.push(course.title);
                    }
                }
            });
        } else {
            console.log('Course students is not an array or is empty');
        }
    });
    
    // Convert map to array
    const students = Array.from(studentMap.values());
    console.log('Total students found:', students.length);
    
    // Populate students table
    const tableBody = document.getElementById('students-table-body');
    if (tableBody) {
        if (students.length === 0) {
            console.log('No students found, showing empty message');
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">No students enrolled in your courses yet.</td>
                </tr>
            `;
        } else {
            console.log('Rendering students table');
            tableBody.innerHTML = students.map(student => `
                <tr>
                    <td>${student.name}</td>
                    <td>${student.email}</td>
                    <td>${student.enrolledCourses.join(', ')}</td>
                    <td>${student.progress}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-primary btn-sm" onclick="viewStudentDetails('${student.id}')">View</button>
                            <button class="btn btn-success btn-sm" onclick="sendMessage('${student.id}')">Message</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    } else {
        console.error('Students table body element not found');
    }
    
    // Store students in localStorage for reference
    localStorage.setItem('teacherStudents', JSON.stringify(students));
}

// Helper function to calculate student progress
function calculateStudentProgress(studentId, courseId) {
    // This is a simplified calculation - in a real app, you would track actual progress
    // For now, we'll generate a random progress value between 0% and 100%
    return Math.floor(Math.random() * 100) + '%';
}

// Enrollment Requests Management
function loadEnrollmentRequests() {
    const currentTeacher = JSON.parse(sessionStorage.getItem('userSession'));
    if (!currentTeacher) {
        console.error('No teacher session found');
        return;
    }

    // Initialize enrollmentRequests if not already defined
    if (typeof enrollmentRequests === 'undefined') {
        enrollmentRequests = JSON.parse(localStorage.getItem('enrollmentRequests') || '[]');
    } else {
        // Always get the latest enrollment requests from localStorage
        enrollmentRequests = JSON.parse(localStorage.getItem('enrollmentRequests') || '[]');
    }
    
    // Get all courses for this teacher
    const allCourses = JSON.parse(localStorage.getItem('courses') || '[]');
    const teacherCourses = allCourses.filter(course => course.teacherId === currentTeacher.id);
    const teacherCourseIds = teacherCourses.map(course => course.id);
    
    // Filter requests for this teacher's courses
    filteredEnrollmentRequests = enrollmentRequests.filter(request => 
        teacherCourseIds.includes(request.courseId)
    );
    
    console.log('Teacher courses:', teacherCourseIds);
    console.log('All enrollment requests:', enrollmentRequests);
    console.log('Filtered enrollment requests:', filteredEnrollmentRequests);

    updateEnrollmentRequestsTable();
    updateEnrollmentCourseFilter();
}

function updateEnrollmentRequestsTable() {
    const tableBody = document.getElementById('enrollment-requests-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    
    filteredEnrollmentRequests.forEach(request => {
        // Format the date safely
        let formattedDate = 'N/A';
        try {
            if (request.requestDate) {
                formattedDate = new Date(request.requestDate).toLocaleDateString();
            } else if (request.createdAt) {
                formattedDate = new Date(request.createdAt).toLocaleDateString();
            }
        } catch (e) {
            console.error('Error formatting date:', e);
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${request.studentName || 'Unknown'}</td>
            <td>${request.studentEmail || 'Unknown'}</td>
            <td>${request.courseTitle || request.courseName || 'Unknown Course'}</td>
                    <td>${formattedDate}</td>
            <td><span class="status-badge status-${request.status.toLowerCase()}">${request.status}</span></td>
            <td class="action-buttons">
                            ${request.status === 'pending' ? `
                    <button class="btn btn-success btn-sm" onclick="acceptEnrollmentRequest('${request.id}')">Accept</button>
                    <button class="btn btn-danger btn-sm" onclick="rejectEnrollmentRequest('${request.id}')">Reject</button>
                            ` : ''}
                    </td>
        `;
        tableBody.appendChild(row);
    });
}

function updateEnrollmentCourseFilter() {
    const filter = document.getElementById('enrollment-course-filter');
    if (!filter) return;

    // Get current teacher from sessionStorage instead of currentTeacher
    const currentTeacher = JSON.parse(sessionStorage.getItem('userSession'));
    if (!currentTeacher) return;

    // Get all courses and filter by teacherId
    const courses = JSON.parse(localStorage.getItem('courses')) || [];
    const teacherCourses = courses.filter(course => course.teacherId === currentTeacher.id);

    filter.innerHTML = '<option value="">All Courses</option>';
    teacherCourses.forEach(course => {
        filter.innerHTML += `<option value="${course.id}">${course.title}</option>`;
    });
}

function acceptEnrollmentRequest(requestId) {
    const request = enrollmentRequests.find(r => r.id === requestId);
    if (!request) {
        console.error('Enrollment request not found:', requestId);
        return;
    }

    console.log('Accepting enrollment request:', request);
    
    // Update request status
    request.status = 'approved';
    request.approvalDate = new Date().toISOString();

    // Add student to course
    const courses = JSON.parse(localStorage.getItem('courses')) || [];
    const courseIndex = courses.findIndex(c => c.id === request.courseId);
    
    if (courseIndex !== -1) {
        console.log('Found course at index:', courseIndex);
        
        // Add to students array for teacher's view
        if (!courses[courseIndex].students) {
            courses[courseIndex].students = [];
        }
        
        // Check if student is already in the students array
        const studentExists = courses[courseIndex].students.some(s => s.id === request.studentId);
        if (!studentExists) {
            courses[courseIndex].students.push({
                id: request.studentId,
                name: request.studentName,
                email: request.studentEmail,
                enrollmentDate: new Date().toISOString()
            });
        }

        // Add to enrolledStudents array for student's access control
        if (!courses[courseIndex].enrolledStudents) {
            courses[courseIndex].enrolledStudents = [];
        }
        
        // Check if student is already in the enrolledStudents array
        if (!courses[courseIndex].enrolledStudents.includes(request.studentId)) {
            courses[courseIndex].enrolledStudents.push(request.studentId);
        }
        
        // Update the students count property to match the length of enrolledStudents array
        courses[courseIndex].students = courses[courseIndex].enrolledStudents.length;
        
        console.log('Updated course students:', courses[courseIndex].students);
        console.log('Updated course enrolledStudents:', courses[courseIndex].enrolledStudents);
    } else {
        console.error('Course not found:', request.courseId);
    }

    // Update local storage
    localStorage.setItem('enrollmentRequests', JSON.stringify(enrollmentRequests));
    localStorage.setItem('courses', JSON.stringify(courses));

    // Set a flag to notify the student's page
    localStorage.setItem('enrollmentStatusChanged', JSON.stringify({
        studentId: request.studentId,
        courseId: request.courseId,
        status: 'approved',
        timestamp: new Date().toISOString()
    }));

    // Refresh the enrollment requests table
    loadEnrollmentRequests();
    
    // Refresh the courses display to update student counts
    loadTeacherCourses();
    
    showNotification('Enrollment request accepted successfully', 'success');
}

function rejectEnrollmentRequest(requestId) {
    const request = enrollmentRequests.find(r => r.id === requestId);
    if (!request) {
        console.error('Enrollment request not found:', requestId);
        return;
    }

    console.log('Rejecting enrollment request:', request);
    
    // Update request status
    request.status = 'rejected';
    request.rejectionDate = new Date().toISOString();

    // Update local storage
    localStorage.setItem('enrollmentRequests', JSON.stringify(enrollmentRequests));

    // Set a flag to notify the student's page
    localStorage.setItem('enrollmentStatusChanged', JSON.stringify({
        studentId: request.studentId,
        courseId: request.courseId,
        status: 'rejected',
        timestamp: new Date().toISOString()
    }));

    // Refresh the enrollment requests table
    loadEnrollmentRequests();
    
    // Refresh the courses display to update student counts
    loadTeacherCourses();
    
    showNotification('Enrollment request rejected', 'info');
}

// Function to setup enrollment request handlers
function setupEnrollmentRequestHandlers() {
    const enrollmentRequestsBtn = document.getElementById('enrollment-requests-btn');
    const enrollmentRequestsModal = document.getElementById('enrollment-requests-modal');
    const closeEnrollmentModal = enrollmentRequestsModal?.querySelector('.close-modal');
    const enrollmentSearch = document.getElementById('enrollment-search');
    const enrollmentCourseFilter = document.getElementById('enrollment-course-filter');

    // Open enrollment requests modal
    enrollmentRequestsBtn?.addEventListener('click', () => {
        if (enrollmentRequestsModal) {
            enrollmentRequestsModal.style.display = 'block';
            loadEnrollmentRequests();
        }
    });

    // Close enrollment requests modal
    closeEnrollmentModal?.addEventListener('click', () => {
        if (enrollmentRequestsModal) {
                enrollmentRequestsModal.style.display = 'none';
            }
        });
        
    // Search enrollment requests
    enrollmentSearch?.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filteredEnrollmentRequests = enrollmentRequests.filter(request => 
            request.studentName.toLowerCase().includes(searchTerm) ||
            request.studentEmail.toLowerCase().includes(searchTerm)
        );
        updateEnrollmentRequestsTable();
    });

    // Filter enrollment requests by course
    enrollmentCourseFilter?.addEventListener('change', (e) => {
        const courseId = e.target.value;
        filteredEnrollmentRequests = enrollmentRequests.filter(request => 
            !courseId || request.courseId === courseId
        );
        updateEnrollmentRequestsTable();
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === enrollmentRequestsModal) {
            enrollmentRequestsModal.style.display = 'none';
        }
    });
}

// Function to check for new enrollment requests
function checkForNewEnrollmentRequests() {
    const lastCheck = localStorage.getItem('lastEnrollmentCheck') || '0';
    const currentTime = new Date().getTime();
    
    // Check if there's a new enrollment update since our last check
    const lastUpdate = localStorage.getItem('lastEnrollmentUpdate');
    if (lastUpdate && new Date(lastUpdate).getTime() > parseInt(lastCheck)) {
        console.log('New enrollment request detected, refreshing...');
        loadEnrollmentRequests();
        
        // Show notification if there are new pending requests
        const pendingRequests = filteredEnrollmentRequests.filter(req => req.status === 'pending');
        if (pendingRequests.length > 0) {
            Swal.fire({
                icon: 'info',
                title: 'New Enrollment Requests',
                text: `You have ${pendingRequests.length} new enrollment request(s) to review.`,
                confirmButtonText: 'View Requests',
                showCancelButton: true,
                cancelButtonText: 'Later'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Open the enrollment requests modal
                    const modal = document.getElementById('enrollment-requests-modal');
                    if (modal) {
                        modal.style.display = 'block';
                    }
                }
            });
        }
    }
    
    // Update the last check time
    localStorage.setItem('lastEnrollmentCheck', currentTime.toString());
}

// Update the setupEnrollmentRequestUpdates function
function setupEnrollmentRequestUpdates() {
    // Check for updates every 5 seconds
    setInterval(() => {
        const lastUpdate = localStorage.getItem('lastEnrollmentUpdate');
        const currentRequests = JSON.parse(localStorage.getItem('enrollmentRequests') || '[]');
        
        // Get current teacher ID
        const currentTeacher = JSON.parse(sessionStorage.getItem('userSession'));
        if (!currentTeacher) return;
        
        // Get all courses for this teacher
        const allCourses = JSON.parse(localStorage.getItem('courses') || '[]');
        const teacherCourses = allCourses.filter(course => course.teacherId === currentTeacher.id);
        const teacherCourseIds = teacherCourses.map(course => course.id);
        
        // Filter requests for this teacher's courses
        const currentFilteredRequests = currentRequests.filter(request => 
            teacherCourseIds.includes(request.courseId)
        );
        
        // If there are new requests or the requests have changed
        if (currentFilteredRequests.length !== filteredEnrollmentRequests.length || 
            JSON.stringify(currentFilteredRequests) !== JSON.stringify(filteredEnrollmentRequests)) {
            
            console.log('Enrollment requests changed, updating UI');
            
            // Update the enrollment requests
            enrollmentRequests = currentRequests;
            filteredEnrollmentRequests = currentFilteredRequests;
            
            // Reload the enrollment requests table
            updateEnrollmentRequestsTable();
            
            // Update the stats cards
            updateStatsCards(teacherCourses);
            
            // Show notification if there are new pending requests
            const newPendingRequests = currentFilteredRequests.filter(request => 
                request.status === 'pending' && 
                (!filteredEnrollmentRequests.find(r => r.id === request.id) || 
                 filteredEnrollmentRequests.find(r => r.id === request.id)?.status !== 'pending')
            );
            
            if (newPendingRequests.length > 0) {
                showNotification(`You have ${newPendingRequests.length} new enrollment request(s)`, 'info');
            }
        }
    }, 5000); // Check every 5 seconds
    
    // Also listen for storage events (updates from other tabs/windows)
    window.addEventListener('storage', (e) => {
        if (e.key === 'enrollmentRequests' || e.key === 'lastEnrollmentUpdate') {
            console.log('Storage event detected in setupEnrollmentRequestUpdates:', e.key);
            loadEnrollmentRequests();
        }
    });
}

// Function to setup modal handlers
function setupModalHandlers() {
    // Get all modals
    const modals = {
        createCourse: document.getElementById('create-course-modal'),
        editCourse: document.getElementById('edit-course-modal'),
        uploadMaterials: document.getElementById('upload-materials-modal'),
        students: document.getElementById('students-modal'),
        studentDetails: document.getElementById('student-details-modal'),
        sendMessage: document.getElementById('send-message-modal'),
        enrollmentRequests: document.getElementById('enrollment-requests-modal')
    };
    
    // Get all buttons that open modals
    const buttons = {
        createCourse: document.getElementById('create-course-btn'),
        students: document.getElementById('students-btn'),
        enrollmentRequests: document.getElementById('enrollment-requests-btn')
    };
    
    // Open modals
    if (buttons.createCourse) {
        buttons.createCourse.addEventListener('click', () => {
            modals.createCourse.style.display = 'block';
        });
    }
    
    if (buttons.students) {
        buttons.students.addEventListener('click', () => {
            modals.students.style.display = 'block';
            // Load students when the modal is opened
            loadTeacherStudents();
            
            // Setup event listeners for student filtering
            const studentSearch = document.getElementById('student-search');
            const courseFilter = document.getElementById('course-filter');
            
            if (studentSearch) {
                studentSearch.addEventListener('input', (e) => {
                    filterStudents(e.target.value.toLowerCase());
                });
            }
            
            if (courseFilter) {
                courseFilter.addEventListener('change', (e) => {
                    filterStudentsByCourse(e.target.value);
                });
            }
        });
    }
    
    if (buttons.enrollmentRequests) {
        buttons.enrollmentRequests.addEventListener('click', () => {
            modals.enrollmentRequests.style.display = 'block';
        });
    }
    
    // Close modals
    const closeModalBtns = document.querySelectorAll('.close-modal');
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            Object.values(modals).forEach(modal => {
                if (modal) modal.style.display = 'none';
            });
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        Object.values(modals).forEach(modal => {
            if (modal && e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

// Function to setup file upload handlers
function setupFileUploadHandlers() {
    // Handle course image upload
    const courseImageUpload = document.getElementById('course-image-upload');
    if (courseImageUpload) {
        courseImageUpload.addEventListener('click', () => {
            const fileInput = courseImageUpload.querySelector('input[type="file"]');
            fileInput.click();
        });
        
        const fileInput = courseImageUpload.querySelector('input[type="file"]');
        fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                handleFileUpload(files, 'course-image-upload');
            }
        });
    }
    
    // Handle course materials upload in create course form
    const courseMaterialsUpload = document.getElementById('course-materials-upload');
    if (courseMaterialsUpload) {
        courseMaterialsUpload.addEventListener('click', () => {
            const fileInput = courseMaterialsUpload.querySelector('input[type="file"]');
            fileInput.click();
        });
        
        const fileInput = courseMaterialsUpload.querySelector('input[type="file"]');
        fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                handleCourseMaterialsUpload(files);
            }
        });
    }
    
    // Handle course materials upload in edit course form
    const editCourseMaterialsUpload = document.getElementById('edit-course-materials-upload');
    if (editCourseMaterialsUpload) {
        editCourseMaterialsUpload.addEventListener('click', () => {
            const fileInput = editCourseMaterialsUpload.querySelector('input[type="file"]');
            fileInput.click();
        });
        
        const fileInput = editCourseMaterialsUpload.querySelector('input[type="file"]');
        fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                handleFileUpload(files, 'edit-course-materials-upload');
            }
        });
    }
    
    // Handle course video upload
    const courseVideoUpload = document.getElementById('edit-course-video-upload');
    if (courseVideoUpload) {
        courseVideoUpload.addEventListener('click', () => {
            const fileInput = courseVideoUpload.querySelector('input[type="file"]');
            fileInput.click();
        });
        
        const fileInput = courseVideoUpload.querySelector('input[type="file"]');
        fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                handleFileUpload(files, 'edit-course-video-upload');
            }
        });
    }
}

// Function to handle file uploads
function handleFileUpload(files, uploadId) {
    const fileList = document.getElementById('edit-course-materials-list');
    const videoPreview = document.getElementById('edit-course-video-preview');
    
    if (uploadId === 'edit-course-materials-upload' && fileList) {
        fileList.innerHTML = '';
        
        Array.from(files).forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <i class="fas fa-file"></i>
                <span class="file-name">${file.name}</span>
                <div class="file-actions">
                    <button type="button" onclick="removeFile(this)">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            fileList.appendChild(fileItem);
        });
    } else if (uploadId === 'edit-course-video-upload' && videoPreview) {
        videoPreview.innerHTML = '';
        
        const video = document.createElement('video');
        video.controls = true;
        video.style.width = '100%';
        video.style.maxHeight = '300px';
        
        const source = document.createElement('source');
        source.src = URL.createObjectURL(files[0]);
        source.type = files[0].type;
        
        video.appendChild(source);
        videoPreview.appendChild(video);
    } else if (uploadId === 'course-image-upload') {
        // Store the course image in localStorage for later use
        const reader = new FileReader();
        reader.onload = function(event) {
            // Store the image data in localStorage
            localStorage.setItem('tempCourseImage', event.target.result);
            
            // Show a preview of the image
            const courseImageUpload = document.getElementById('course-image-upload');
            if (courseImageUpload) {
                courseImageUpload.innerHTML = `
                    <img src="${event.target.result}" alt="Course Image" style="max-width: 100%; max-height: 200px; object-fit: cover;">
                    <p class="mb-0 mt-2">Click to change image</p>
                `;
            }
        };
        reader.readAsDataURL(files[0]);
    }
}

// Function to remove file from list
function removeFile(button) {
    const fileItem = button.closest('.file-item');
    fileItem.remove();
}

// Function to setup form submission handlers
function setupFormSubmissionHandlers() {
    // Create course form submission
    const createCourseForm = document.getElementById('create-course-form');
    createCourseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const courseData = {
                id: 'course_' + Date.now(),
                title: document.getElementById('course-title').value,
                category: document.getElementById('course-category').value,
                description: document.getElementById('course-description').value,
                requiresApproval: document.getElementById('course-requires-approval').checked,
                createdAt: new Date().toISOString(),
                status: 'active',
                enrolledStudents: [],
                teacherId: JSON.parse(sessionStorage.getItem('userSession')).id,
                materials: []
            };
            
            // Handle file uploads
            const materialsInput = document.querySelector('#course-materials-upload input[type="file"]');
            if (materialsInput && materialsInput.files.length > 0) {
                const filePromises = Array.from(materialsInput.files).map(file => {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        
                        reader.onload = () => {
                            const material = {
                                id: 'material_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                                name: file.name,
                                size: file.size,
                                type: getFileTypeFromName(file.name),
                                uploadDate: new Date().toISOString(),
                                fileData: reader.result,
                                fileName: file.name
                            };
                            resolve(material);
                        };
                        
                        reader.onerror = () => {
                            reject(new Error(`Error reading file: ${file.name}`));
                        };
                        
                        reader.readAsDataURL(file);
                    });
                });
                
                // Wait for all files to be processed
                const materials = await Promise.all(filePromises);
                courseData.materials = materials;
                
                // Store materials in localStorage
                const storedMaterials = JSON.parse(localStorage.getItem('courseMaterials') || '[]');
                materials.forEach(material => {
                    material.courseId = courseData.id;
                    storedMaterials.push(material);
                });
                localStorage.setItem('courseMaterials', JSON.stringify(storedMaterials));
            }
            
            // Handle course image
            const courseImage = localStorage.getItem('tempCourseImage');
            if (courseImage) {
                courseData.image = courseImage;
                localStorage.removeItem('tempCourseImage');
            }
            
            // Save course to localStorage
            const courses = JSON.parse(localStorage.getItem('courses') || '[]');
            courses.push(courseData);
            localStorage.setItem('courses', JSON.stringify(courses));
            
            // Show success message
            Swal.fire({
                icon: 'success',
                title: 'Course Created',
                text: 'Your course has been created successfully!',
                timer: 2000,
                showConfirmButton: false
            });
            
            // Close modal and reset form
            document.getElementById('create-course-modal').style.display = 'none';
            createCourseForm.reset();
            
            // Reset course image upload
            const courseImageUpload = document.getElementById('course-image-upload');
            if (courseImageUpload) {
                courseImageUpload.innerHTML = `
                    <input type="file" accept="image/*">
                    <i class="fas fa-cloud-upload-alt fa-2x mb-2"></i>
                    <p class="mb-0">Click to upload course image</p>
                `;
            }
            
            // Clear materials list
            const materialsList = document.getElementById('course-materials-list');
            if (materialsList) {
                materialsList.innerHTML = '';
            }
            
            // Reload courses
            loadTeacherCourses();
            
        } catch (error) {
            console.error('Error creating course:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to create course. Please try again.',
                confirmButtonText: 'OK'
            });
        }
    });
    
    // Edit course form submission
    const editCourseForm = document.getElementById('edit-course-form');
    editCourseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const courseId = document.getElementById('edit-course-form').dataset.courseId;
        const courseData = {
            title: document.getElementById('edit-course-title').value,
            category: document.getElementById('edit-course-category').value,
            description: document.getElementById('edit-course-description').value,
            requiresApproval: document.getElementById('edit-course-requires-approval').checked,
            updatedAt: new Date().toISOString()
        };
        
        // Handle file uploads
        const materialsInput = document.getElementById('edit-course-materials');
        if (materialsInput.files.length > 0) {
            courseData.materials = Array.from(materialsInput.files).map(file => ({
                name: file.name,
                size: file.size,
                type: file.type
            }));
        }
        
        try {
            const response = await fetch(`/api/courses/${courseId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(courseData)
            });
            
            if (response.ok) {
                const updatedCourse = await response.json();
                const index = courses.findIndex(course => course.id === courseId);
                if (index !== -1) {
                    courses[index] = updatedCourse;
                }
                displayCourses();
                closeModal('edit-course-modal');
                editCourseForm.reset();
            } else {
                console.error('Failed to update course');
            }
        } catch (error) {
            console.error('Error updating course:', error);
        }
    });
    
    // Send message form
    const sendMessageForm = document.getElementById('send-message-form');
    if (sendMessageForm) {
        sendMessageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const messageData = {
                studentId: document.getElementById('send-message-form').dataset.studentId,
                subject: document.getElementById('message-subject').value,
                content: document.getElementById('message-content').value,
                sentAt: new Date().toISOString()
            };
            
            // Send message
            sendMessageToStudent(messageData);
            
            // Close modal
            document.getElementById('send-message-modal').style.display = 'none';
            
            // Show success message
            Swal.fire({
                icon: 'success',
                title: 'Message Sent',
                text: 'Your message has been sent successfully!',
                timer: 2000,
                showConfirmButton: false
            });
        });
    }
}

// Function to get file type from file name
function getFileTypeFromName(fileName) {
    if (!fileName) return 'other';
    const extension = fileName.split('.').pop().toLowerCase();
    const typeMap = {
        'pdf': 'pdf',
        'doc': 'doc',
        'docx': 'doc',
        'ppt': 'ppt',
        'pptx': 'ppt',
        'xls': 'xls',
        'xlsx': 'xls',
        'txt': 'txt',
        'zip': 'zip',
        'rar': 'zip',
        'mp4': 'video',
        'avi': 'video',
        'mov': 'video',
        'jpg': 'image',
        'jpeg': 'image',
        'png': 'image',
        'gif': 'image',
        'mp3': 'audio',
        'wav': 'audio'
    };
    return typeMap[extension] || 'other';
}

// Function to save course
function saveCourse(courseData) {
    const courses = JSON.parse(localStorage.getItem('courses') || '[]');
    
    // Add course to array
    courses.push(courseData);
    
    // Save to localStorage
    localStorage.setItem('courses', JSON.stringify(courses));
}

// Function to update course
function updateCourse(courseData) {
    const courses = JSON.parse(localStorage.getItem('courses') || '[]');
    
    // Find course index
    const courseIndex = courses.findIndex(course => course.id === courseData.id);
    
    if (courseIndex !== -1) {
        // Update course
        courses[courseIndex] = { ...courses[courseIndex], ...courseData };
        
        // Save to localStorage
        localStorage.setItem('courses', JSON.stringify(courses));
    }
}

// Function to delete course
function deleteCourse(courseId) {
    Swal.fire({
        title: 'Are you sure?',
        text: 'Do you want to delete this course?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            // Get courses
            const courses = JSON.parse(localStorage.getItem('courses') || '[]');
            
            // Filter out the course to delete
            const updatedCourses = courses.filter(course => course.id !== courseId);
            
            // Save to localStorage
            localStorage.setItem('courses', JSON.stringify(updatedCourses));
            
            Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'The course has been deleted.',
                timer: 1500,
                showConfirmButton: false
            });
            
            // Reload courses
            loadTeacherCourses();
        }
    });
}

// Function to edit course
function editCourse(courseId) {
    // Get course data
    const courses = JSON.parse(localStorage.getItem('courses') || '[]');
    const course = courses.find(c => c.id === courseId);
    
    if (!course) {
        // Use sample data if not found
        const sampleCourses = [
            {
                id: 'course_1',
                title: 'Structural Analysis',
                category: 'Structural Engineering',
                description: 'Learn the fundamentals of structural analysis and design.',
                students: 45,
                progress: '75%',
                status: 'published'
            },
            {
                id: 'course_2',
                title: 'Transportation Systems',
                category: 'Transportation Engineering',
                description: 'Master the principles of transportation systems.',
                students: 32,
                progress: '60%',
                status: 'draft'
            },
            {
                id: 'course_3',
                title: 'Environmental Impact Assessment',
                category: 'Environmental Engineering',
                description: 'Explore sustainable engineering solutions.',
                students: 28,
                progress: '90%',
                status: 'published'
            }
        ];
        
        const sampleCourse = sampleCourses.find(c => c.id === courseId);
        if (!sampleCourse) return;
        
        // Set form data
        document.getElementById('edit-course-form').dataset.courseId = sampleCourse.id;
        document.getElementById('edit-course-title').value = sampleCourse.title;
        document.getElementById('edit-course-category').value = sampleCourse.category;
        document.getElementById('edit-course-description').value = sampleCourse.description;
        
        // Show modal
        document.getElementById('edit-course-modal').style.display = 'block';
    } else {
        // Set form data
        document.getElementById('edit-course-form').dataset.courseId = course.id;
        document.getElementById('edit-course-title').value = course.title;
        document.getElementById('edit-course-category').value = course.category;
        document.getElementById('edit-course-description').value = course.description;
        
        // Show modal
        document.getElementById('edit-course-modal').style.display = 'block';
    }
}

// Function to upload materials
function uploadMaterials(courseId) {
    // Set course ID in the form
    document.getElementById('upload-material-form').dataset.courseId = courseId;
    
    // Display existing materials
    displayCourseMaterials(courseId);
    
    // Show the modal
    document.getElementById('upload-materials-modal').style.display = 'block';
}

// Function to view student details
function viewStudentDetails(studentId) {
    console.log('Viewing student details for ID:', studentId);
    
    // Get student data from localStorage
    const teacherStudents = JSON.parse(localStorage.getItem('teacherStudents') || '[]');
    console.log('Teacher students from localStorage:', teacherStudents);
    
    const student = teacherStudents.find(s => s.id === studentId);
    
    if (!student) {
        console.log('Student not found in teacherStudents, trying to find in courses');
        
        // If student not found in teacherStudents, try to find in courses
        const allCourses = JSON.parse(localStorage.getItem('courses') || '[]');
        const teacherId = JSON.parse(sessionStorage.getItem('userSession')).id;
        const teacherCourses = allCourses.filter(course => course.teacherId === teacherId);
        
        let foundStudent = null;
        let studentCourses = [];
        
        // Search for student in teacher's courses
        for (const course of teacherCourses) {
            console.log('Checking course:', course.title);
            
            // Check if course has students array
            if (!course.students) {
                // Check if course has enrolledStudents array instead
                if (course.enrolledStudents && Array.isArray(course.enrolledStudents)) {
                    console.log('Using enrolledStudents array instead');
                    if (course.enrolledStudents.includes(studentId)) {
                        // Try to find student details from users
                        const users = JSON.parse(localStorage.getItem('users') || '[]');
                        const userStudent = users.find(user => user.id === studentId);
                        
                        if (userStudent) {
                            foundStudent = {
                                id: userStudent.id,
                                name: userStudent.name || userStudent.fullName,
                                email: userStudent.email,
                                enrollmentDate: new Date().toISOString() // Default date
                            };
                            studentCourses.push(course.title);
                        } else {
                            // Create a basic student object if details not found
                            foundStudent = {
                                id: studentId,
                                name: 'Student ' + studentId,
                                email: 'student' + studentId + '@example.com',
                                enrollmentDate: new Date().toISOString()
                            };
                            studentCourses.push(course.title);
                        }
                    }
                }
            } else if (course.students && Array.isArray(course.students)) {
                const courseStudent = course.students.find(s => s.id === studentId);
                if (courseStudent) {
                    foundStudent = courseStudent;
                    studentCourses.push(course.title);
                }
            }
        }
        
        if (foundStudent) {
            console.log('Found student in courses:', foundStudent);
            
            // Create a student object from the found data
            const studentData = {
                id: foundStudent.id,
                name: foundStudent.name,
                email: foundStudent.email,
                enrolledCourses: studentCourses,
                progress: calculateStudentProgress(foundStudent.id, studentCourses[0]),
                lastActive: foundStudent.enrollmentDate || new Date().toISOString()
            };
            
            // Update the student details modal with actual data
            updateStudentDetailsModal(studentData);
            return;
        }
        
        console.log('Student not found in courses, using sample data');
        
        // If still not found, use sample data
        const sampleStudents = [
            {
                id: 'student_1',
                name: 'John Smith',
                email: 'john.smith@example.com',
                enrolledCourses: ['Structural Analysis', 'Transportation Systems'],
                progress: '80%',
                lastActive: '2023-06-15T10:30:00'
            },
            {
                id: 'student_2',
                name: 'Emily Johnson',
                email: 'emily.johnson@example.com',
                enrolledCourses: ['Environmental Impact Assessment'],
                progress: '65%',
                lastActive: '2023-06-14T15:45:00'
            },
            {
                id: 'student_3',
                name: 'Michael Brown',
                email: 'michael.brown@example.com',
                enrolledCourses: ['Structural Analysis', 'Environmental Impact Assessment'],
                progress: '92%',
                lastActive: '2023-06-15T09:15:00'
            }
        ];
        
        const sampleStudent = sampleStudents.find(s => s.id === studentId);
        if (!sampleStudent) {
            console.log('Student not found in sample data either');
            return;
        }
        
        // Update the student details modal with sample data
        updateStudentDetailsModal(sampleStudent);
    } else {
        console.log('Found student in teacherStudents:', student);
        
        // Update the student details modal with actual data
        updateStudentDetailsModal(student);
    }
}

// Helper function to update the student details modal
function updateStudentDetailsModal(student) {
    // Set student data
    document.getElementById('student-avatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=4a6bff&color=fff`;
    document.getElementById('student-name').textContent = student.name;
    document.getElementById('student-email').textContent = student.email;
    document.getElementById('student-courses-count').textContent = student.enrolledCourses.length;
    document.getElementById('student-completion').textContent = student.progress;
    document.getElementById('student-last-active').textContent = new Date(student.lastActive).toLocaleString();
    
    // Set enrolled courses
    const enrolledCoursesList = document.getElementById('enrolled-courses-list');
    enrolledCoursesList.innerHTML = student.enrolledCourses.map(course => `
        <div class="enrolled-course-item">
            <i class="fas fa-book"></i>
            <span>${course}</span>
        </div>
    `).join('');
    
    // Set student ID for actions
    document.getElementById('send-message-form').dataset.studentId = student.id;
    
    // Show modal
    document.getElementById('student-details-modal').style.display = 'block';
}

// Function to send message
function sendMessage(studentId) {
    // Set student ID
    document.getElementById('send-message-form').dataset.studentId = studentId;
    
    // Show modal
    document.getElementById('send-message-modal').style.display = 'block';
}

// Function to send message to student
function sendMessageToStudent(messageData) {
    const messages = JSON.parse(localStorage.getItem('messages') || '[]');
    
    // Generate unique ID
    messageData.id = 'message_' + Date.now();
    
    // Add message to array
    messages.push(messageData);
    
    // Save to localStorage
    localStorage.setItem('messages', JSON.stringify(messages));
}

// Function to handle logout
function handleLogout() {
    // Clear session data
    sessionStorage.removeItem('userSession');
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userFullName');
    sessionStorage.removeItem('userRole');
    
    // Show success message
    Swal.fire({
        icon: 'success',
        title: 'Logged Out',
        text: 'You have been successfully logged out.',
        timer: 1500,
        showConfirmButton: false
    }).then(() => {
        // Redirect to login page
        window.location.href = 'teacher-login.html';
    });
}

// Function to filter students
function filterStudents(searchTerm) {
    const rows = document.querySelectorAll('#students-table-body tr');
    
    rows.forEach(row => {
        const name = row.cells[0].textContent.toLowerCase();
        const email = row.cells[1].textContent.toLowerCase();
        
        if (name.includes(searchTerm) || email.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Function to filter students by course
function filterStudentsByCourse(courseId) {
    if (!courseId) {
        // Show all students
        const rows = document.querySelectorAll('#students-table-body tr');
        rows.forEach(row => {
            row.style.display = '';
        });
        return;
    }
    
    // Get course title
    const courses = JSON.parse(localStorage.getItem('courses') || '[]');
    const course = courses.find(c => c.id === courseId);
    
    if (!course) return;
    
    const rows = document.querySelectorAll('#students-table-body tr');
    
    rows.forEach(row => {
        const enrolledCourses = row.cells[2].textContent;
        
        if (enrolledCourses.includes(course.title)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Materials Management
let materials = [];

function loadMaterials() {
    // Load materials from localStorage
    const storedMaterials = localStorage.getItem('materials');
    if (storedMaterials) {
        materials = JSON.parse(storedMaterials);
        displayMaterials();
    }
}

function displayMaterials() {
    const materialsList = document.getElementById('materialsList');
    if (!materialsList) return;

    materialsList.innerHTML = materials.map(material => `
        <div class="material-item">
            <div class="material-icon">
                <i class="fas ${getMaterialIcon(material.type)}"></i>
            </div>
            <div class="material-info">
                <h4>${material.title}</h4>
                <p>${material.description || 'No description provided'}</p>
                <small>Course: ${material.course}</small>
            </div>
            <div class="material-actions">
                <button class="btn btn-sm btn-primary" onclick="downloadMaterial('${material.id}')">
                    <i class="fas fa-download"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteMaterial('${material.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function getMaterialIcon(type) {
    switch (type) {
        case 'document':
            return 'fa-file-alt';
        case 'video':
            return 'fa-video';
        case 'link':
            return 'fa-link';
        default:
            return 'fa-file';
    }
}

function openUploadMaterialModal() {
    document.getElementById('upload-material-modal').style.display = 'block';
    loadCoursesForMaterialUpload();
}

function closeUploadMaterialModal() {
    document.getElementById('upload-material-modal').style.display = 'none';
}

function loadCoursesForMaterialUpload() {
    const courseSelect = document.getElementById('material-course');
    const courses = JSON.parse(localStorage.getItem('courses')) || [];
    
    courseSelect.innerHTML = courses.map(course => 
        `<option value="${course.id}">${course.title}</option>`
    ).join('');
}

async function handleMaterialUpload(event, courseId) {
    event.preventDefault();
    
    try {
        const form = event.target;
        const formData = new FormData(form);
        const file = formData.get('materialFile');
        
        if (!file) {
            throw new Error('Please select a file to upload');
        }
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            throw new Error('File size must be less than 10MB');
        }
        
        // Create material object
        const material = {
            id: 'material_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            courseId: courseId,
            name: file.name,
            type: getFileTypeFromName(file.name),
            size: file.size,
            uploadDate: new Date().toISOString(),
            title: formData.get('materialTitle') || file.name,
            description: formData.get('materialDescription') || '',
            fileName: file.name
        };
        
        // Convert file to base64 for storage
        const reader = new FileReader();
        
        reader.onload = async () => {
            try {
                // Store the file data
                material.fileData = reader.result;
                
                // Store material in localStorage
                const storedMaterials = JSON.parse(localStorage.getItem('courseMaterials') || '[]');
                storedMaterials.push(material);
                localStorage.setItem('courseMaterials', JSON.stringify(storedMaterials));
                
                // Update course materials
                const courses = JSON.parse(localStorage.getItem('courses') || '[]');
                const courseIndex = courses.findIndex(c => c.id === courseId);
                
                if (courseIndex !== -1) {
                    if (!courses[courseIndex].materials) {
                        courses[courseIndex].materials = [];
                    }
                    courses[courseIndex].materials.push(material);
                    localStorage.setItem('courses', JSON.stringify(courses));
                }
                
                // Show success message
                Swal.fire({
                    icon: 'success',
                    title: 'Material Uploaded',
                    text: 'The material has been successfully uploaded.',
                    timer: 1500,
                    showConfirmButton: false
                });
                
                // Reset form and close modal
                form.reset();
                closeUploadMaterialModal();
                
                // Refresh materials display
                loadCourseMaterials(courseId);
                
            } catch (error) {
                console.error('Error processing file:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Upload Error',
                    text: 'There was an error processing the file. Please try again.',
                    confirmButtonText: 'OK'
                });
            }
        };
        
        reader.onerror = () => {
            Swal.fire({
                icon: 'error',
                title: 'File Read Error',
                text: 'There was an error reading the file. Please try again.',
                confirmButtonText: 'OK'
            });
        };
        
        // Start reading the file
        reader.readAsDataURL(file);
        
    } catch (error) {
        console.error('Error uploading material:', error);
        Swal.fire({
            icon: 'error',
            title: 'Upload Error',
            text: error.message || 'There was an error uploading the material. Please try again.',
            confirmButtonText: 'OK'
        });
    }
}

function loadCourseMaterials(courseId) {
    try {
        const materialsContainer = document.getElementById('courseMaterials');
        if (!materialsContainer) return;
        
        // Get materials from both course object and localStorage
        const courses = JSON.parse(localStorage.getItem('courses') || '[]');
        const course = courses.find(c => c.id === courseId);
        const courseMaterials = course?.materials || [];
        
        const storedMaterials = JSON.parse(localStorage.getItem('courseMaterials') || '[]');
        const storedCourseMaterials = storedMaterials.filter(m => m.courseId === courseId);
        
        // Combine materials and remove duplicates
        const allMaterials = [...courseMaterials];
        storedCourseMaterials.forEach(storedMaterial => {
            if (!allMaterials.some(m => m.id === storedMaterial.id)) {
                allMaterials.push(storedMaterial);
            }
        });
        
        if (!allMaterials || allMaterials.length === 0) {
            materialsContainer.innerHTML = `
                <div class="no-content">
                    <i class="fas fa-file-alt" style="font-size: 3rem; color: #ddd; margin-bottom: 1rem;"></i>
                    <p>No materials available for this course yet.</p>
                </div>
            `;
            return;
        }
        
        materialsContainer.innerHTML = allMaterials.map(material => `
            <div class="material-card">
                <div class="material-icon">
                    <i class="fas ${getFileIcon(material.type || getFileTypeFromName(material.fileName || material.name))}"></i>
                </div>
                <h3 class="material-title">${material.title || material.name}</h3>
                <div class="material-meta">
                    <span><i class="fas fa-calendar"></i> ${new Date(material.uploadDate).toLocaleDateString()}</span>
                    ${material.size ? `<span><i class="fas fa-file"></i> ${formatFileSize(material.size)}</span>` : ''}
                    ${material.description ? `<p class="material-description">${material.description}</p>` : ''}
                </div>
                <div class="material-actions">
                    <button class="btn btn-primary" onclick="downloadMaterial('${material.id}', '${courseId}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button class="btn btn-danger" onclick="deleteMaterial('${material.id}', '${courseId}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading materials:', error);
        const materialsContainer = document.getElementById('courseMaterials');
        if (materialsContainer) {
            materialsContainer.innerHTML = `
                <div class="no-content">
                    <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #dc3545; margin-bottom: 1rem;"></i>
                    <p>Error loading materials. Please try refreshing the page.</p>
                </div>
            `;
        }
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(type) {
    const icons = {
        'pdf': 'fa-file-pdf',
        'doc': 'fa-file-word',
        'docx': 'fa-file-word',
        'ppt': 'fa-file-powerpoint',
        'pptx': 'fa-file-powerpoint',
        'xls': 'fa-file-excel',
        'xlsx': 'fa-file-excel',
        'txt': 'fa-file-alt',
        'zip': 'fa-file-archive',
        'rar': 'fa-file-archive',
        'image': 'fa-file-image',
        'video': 'fa-file-video',
        'audio': 'fa-file-audio',
        'other': 'fa-file'
    };
    return icons[type] || icons.other;
}

function deleteMaterial(materialId, courseId) {
    Swal.fire({
        title: 'Delete Material',
        text: 'Are you sure you want to delete this material?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            try {
                // Remove from course materials
                const courses = JSON.parse(localStorage.getItem('courses') || '[]');
                const courseIndex = courses.findIndex(c => c.id === courseId);
                
                if (courseIndex !== -1) {
                    courses[courseIndex].materials = courses[courseIndex].materials.filter(m => m.id !== materialId);
                    localStorage.setItem('courses', JSON.stringify(courses));
                }
                
                // Remove from stored materials
                const storedMaterials = JSON.parse(localStorage.getItem('courseMaterials') || '[]');
                const updatedMaterials = storedMaterials.filter(m => !(m.id === materialId && m.courseId === courseId));
            localStorage.setItem('courseMaterials', JSON.stringify(updatedMaterials));
            
                // Refresh display
                loadCourseMaterials(courseId);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'The material has been deleted.',
                    timer: 1500,
                    showConfirmButton: false
                });
                
            } catch (error) {
                console.error('Error deleting material:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Delete Error',
                    text: 'There was an error deleting the material. Please try again.',
                    confirmButtonText: 'OK'
                });
            }
        }
    });
}

function populateEditForm(course) {
    document.getElementById('edit-course-form').dataset.courseId = course.id;
    document.getElementById('edit-course-title').value = course.title;
    document.getElementById('edit-course-category').value = course.category;
    document.getElementById('edit-course-description').value = course.description;
    document.getElementById('edit-course-requires-approval').checked = course.requiresApproval || false;
    
    // Clear existing materials list
    const materialsList = document.getElementById('edit-course-materials-list');
    materialsList.innerHTML = '';
    
    // Add existing materials to the list
    if (course.materials && course.materials.length > 0) {
        course.materials.forEach(material => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <span class="file-name">${material.name || material.title}</span>
                <button type="button" class="remove-file" onclick="removeFile(this)">×</button>
            `;
            materialsList.appendChild(fileItem);
        });
    }
}

function displayCourses(courses) {
    const coursesList = document.getElementById('courses-list');
    coursesList.innerHTML = '';
    
    courses.forEach(course => {
        const courseElement = document.createElement('div');
        courseElement.className = 'course-item';
        courseElement.innerHTML = `
            <div class="course-header">
                <h3>${course.title}</h3>
                <div class="course-actions">
                    <button onclick="editCourse('${course.id}')" class="edit-btn">Edit</button>
                    <button onclick="deleteCourse('${course.id}')" class="delete-btn">Delete</button>
                </div>
            </div>
            <p class="course-category">Category: ${course.category}</p>
            <p class="course-description">${course.description}</p>
            <p class="course-status">Status: ${course.requiresApproval ? 'Requires Approval' : 'Open Access'}</p>
            <div class="course-materials">
                <h4>Materials:</h4>
                <ul>
                    ${course.materials ? course.materials.map(material => `
                        <li>
                            <a href="${material.url}" target="_blank">${material.name || material.title}</a>
                        </li>
                    `).join('') : '<li>No materials uploaded</li>'}
                </ul>
            </div>
        `;
        coursesList.appendChild(courseElement);
    });
}

// Function to handle course materials upload
function handleCourseMaterialsUpload(files) {
    const materialsList = document.getElementById('course-materials-list');
    if (!materialsList) return;
    
    // Clear the list if it's the first upload
    if (materialsList.children.length === 0) {
        materialsList.innerHTML = '';
    }
    
    // Add each file to the list
    Array.from(files).forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <i class="fas ${getFileIcon(getFileTypeFromName(file.name))}"></i>
            <span class="file-name">${file.name}</span>
            <div class="file-actions">
                <button type="button" onclick="removeFile(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        materialsList.appendChild(fileItem);
    });
}

function loadPendingReviews() {
    // Get current teacher ID
    const teacherId = JSON.parse(sessionStorage.getItem('userSession')).id;
    
    // Get all courses for this teacher
    const allCourses = JSON.parse(localStorage.getItem('courses') || '[]');
    const teacherCourses = allCourses.filter(course => course.teacherId === teacherId);
    
    // Get all reviews from courses
    const pendingReviews = [];
    teacherCourses.forEach(course => {
        if (course.reviews && Array.isArray(course.reviews)) {
            course.reviews.forEach(review => {
                if (review.status === 'pending') {
                    pendingReviews.push({
                        id: review.id,
                        courseId: course.id,
                        courseTitle: course.title,
                        studentId: review.studentId,
                        studentName: review.studentName,
                        rating: review.rating,
                        comment: review.comment,
                        date: review.date
                    });
                }
            });
        }
    });
    
    // Populate reviews table
    const tableBody = document.getElementById('reviews-table-body');
    if (tableBody) {
        if (pendingReviews.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">No pending reviews to display.</td>
                </tr>
            `;
        } else {
            tableBody.innerHTML = pendingReviews.map(review => `
                <tr>
                    <td>${review.courseTitle}</td>
                    <td>${review.studentName}</td>
                    <td>${review.rating} stars</td>
                    <td>${review.comment}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-success btn-sm" onclick="approveReview('${review.id}', '${review.courseId}')">Approve</button>
                            <button class="btn btn-danger btn-sm" onclick="rejectReview('${review.id}', '${review.courseId}')">Reject</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    }
    
    // Store pending reviews in localStorage for reference
    localStorage.setItem('pendingReviews', JSON.stringify(pendingReviews));
}

// Function to show notifications
function showNotification(message, type = 'info') {
    // Check if Swal (SweetAlert2) is available
    if (typeof Swal !== 'undefined') {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });

        Toast.fire({
            icon: type,
            title: message
        });
    } else {
        // Fallback to basic alert if SweetAlert2 is not available
        alert(message);
    }
}

// Function to setup enrollment request check
function setupEnrollmentRequestCheck() {
    // Check for new enrollment requests immediately
    checkForNewEnrollmentRequests();
    
    // Set up interval to check for new enrollment requests every 10 seconds
    setInterval(checkForNewEnrollmentRequests, 10000);
    
    // Listen for storage events (updates from other tabs/windows)
    window.addEventListener('storage', (e) => {
        if (e.key === 'enrollmentRequests' || e.key === 'lastEnrollmentUpdate') {
            console.log('Storage event detected:', e.key);
            checkForNewEnrollmentRequests();
        }
    });
}

// Function to load courses (alias for loadTeacherCourses for consistency)
function loadCourses() {
    loadTeacherCourses();
} 