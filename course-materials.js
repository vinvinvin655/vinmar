// Course Materials JavaScript

// Function to display course materials
function displayCourseMaterials(courseId) {
    // Get the course
    const courses = JSON.parse(localStorage.getItem('courses') || '[]');
    const course = courses.find(c => c.id === courseId);
    
    if (!course || !course.materials) return;
    
    // Get the materials list element
    const materialsList = document.getElementById('course-materials-list');
    if (!materialsList) return;
    
    // Clear the list
    materialsList.innerHTML = '';
    
    // Add materials to the list
    course.materials.forEach(material => {
        const materialItem = document.createElement('div');
        materialItem.className = 'material-item';
        materialItem.innerHTML = `
            <div class="material-info">
                <i class="fas ${getFileIcon(material.type)}"></i>
                <div class="material-details">
                    <h5>${material.title}</h5>
                    <small>${new Date(material.uploadDate).toLocaleDateString()}</small>
                </div>
            </div>
            <div class="material-actions">
                <button class="btn btn-primary btn-sm" onclick="downloadMaterial('${material.id}', '${courseId}')">
                    <i class="fas fa-download"></i> Download
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteMaterial('${material.id}', '${courseId}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        materialsList.appendChild(materialItem);
    });
    
    // If no materials, show a message
    if (course.materials.length === 0) {
        materialsList.innerHTML = `
            <div class="no-materials">
                <i class="fas fa-folder-open"></i>
                <p>No materials uploaded yet</p>
            </div>
        `;
    }
}

// Function to get file icon based on file type
function getFileIcon(fileType) {
    switch (fileType) {
        case 'pdf':
            return 'fa-file-pdf';
        case 'doc':
            return 'fa-file-word';
        case 'ppt':
            return 'fa-file-powerpoint';
        case 'video':
            return 'fa-file-video';
        default:
            return 'fa-file';
    }
}

// Function to download material
function downloadMaterial(materialId, courseId) {
    // Get the course
    const courses = JSON.parse(localStorage.getItem('courses') || '[]');
    const course = courses.find(c => c.id === courseId);
    
    if (!course || !course.materials) return;
    
    // Get the material
    const material = course.materials.find(m => m.id === materialId);
    
    if (!material) return;
    
    // In a real application, this would trigger a file download
    // For now, we'll just show a success message
    Swal.fire({
        icon: 'success',
        title: 'Download Started',
        text: `Downloading ${material.fileName}`,
        timer: 1500,
        showConfirmButton: false
    });
}

// Function to delete material
function deleteMaterial(materialId, courseId) {
    Swal.fire({
        title: 'Are you sure?',
        text: 'Do you want to delete this material?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            // Get courses
            const courses = JSON.parse(localStorage.getItem('courses') || '[]');
            
            // Find the course
            const courseIndex = courses.findIndex(c => c.id === courseId);
            
            if (courseIndex !== -1) {
                // Filter out the material to delete
                courses[courseIndex].materials = courses[courseIndex].materials.filter(m => m.id !== materialId);
                
                // Save to localStorage
                localStorage.setItem('courses', JSON.stringify(courses));
                
                // Show success message
                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'The material has been deleted.',
                    timer: 1500,
                    showConfirmButton: false
                });
                
                // Display materials
                displayCourseMaterials(courseId);
            }
        }
    });
} 