class ForumManager {
    constructor() {
        this.threads = JSON.parse(localStorage.getItem('forum_threads')) || this.getInitialThreads();
        this.comments = JSON.parse(localStorage.getItem('forum_comments')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('current_user')) || { name: 'Student' };
        this.announcements = JSON.parse(localStorage.getItem('forumAnnouncements')) || [];
        this.initializeEventHandlers();
        this.renderThreads();
        this.renderAnnouncements();
    }

    getInitialThreads() {
        return [
            {
                id: '1',
                category: 'structural',
                title: 'Best Practices for Seismic Design',
                content: 'Discussing the latest techniques and considerations for earthquake-resistant structures.',
                tags: ['seismic', 'design', 'earthquake'],
                author: 'John Doe',
                date: new Date().toISOString(),
                likes: 15,
                replies: 8
            },
            {
                id: '2',
                category: 'geotechnical',
                title: 'Soil Testing Methods Comparison',
                content: 'Comparing different soil testing methods and their applications in foundation design.',
                tags: ['soil', 'testing', 'foundation'],
                author: 'Jane Smith',
                date: new Date().toISOString(),
                likes: 12,
                replies: 5
            },
            {
                id: '3',
                category: 'transportation',
                title: 'Smart Traffic Management Systems',
                content: 'Exploring modern solutions for urban traffic management and congestion reduction.',
                tags: ['traffic', 'urban', 'smart-city'],
                author: 'Mike Johnson',
                date: new Date().toISOString(),
                likes: 10,
                replies: 6
            },
            {
                id: '4',
                category: 'environmental',
                title: 'Sustainable Construction Materials',
                content: 'Discussion on eco-friendly materials and their impact on construction projects.',
                tags: ['sustainability', 'materials', 'green'],
                author: 'Sarah Williams',
                date: new Date().toISOString(),
                likes: 18,
                replies: 9
            },
            {
                id: '5',
                category: 'construction',
                title: 'Project Management Challenges',
                content: 'Sharing experiences and solutions for common construction project management issues.',
                tags: ['management', 'projects', 'challenges'],
                author: 'David Brown',
                date: new Date().toISOString(),
                likes: 14,
                replies: 7
            },
            {
                id: '6',
                category: 'water',
                title: 'Water Treatment Innovations',
                content: 'Latest developments in water treatment technologies and their applications.',
                tags: ['treatment', 'water', 'technology'],
                author: 'Emily Davis',
                date: new Date().toISOString(),
                likes: 11,
                replies: 4
            }
        ];
    }

    initializeEventHandlers() {
        // New Thread Button
        document.querySelector('.new-thread-btn').addEventListener('click', () => {
            this.showModal('threadModal');
        });

        // Close Modal Buttons
        document.querySelectorAll('.close-modal').forEach(button => {
            button.addEventListener('click', () => {
                this.hideModal();
            });
        });

        // Thread Form Submission
        document.getElementById('threadForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createThread(e.target);
        });

        // Search Functionality
        document.querySelector('.search-input').addEventListener('input', (e) => {
            this.searchThreads(e.target.value);
        });

        // Filter Changes
        document.querySelector('.date-filter').addEventListener('change', () => {
            this.filterThreads();
        });

        document.querySelector('.sort-filter').addEventListener('change', () => {
            this.filterThreads();
        });

        // Thread detail modal handlers
        document.addEventListener('click', (e) => {
            const threadItem = e.target.closest('.thread-item');
            if (threadItem) {
                const threadId = threadItem.dataset.threadId;
                if (threadId) {
                    this.showThreadDetail(threadId);
                    this.incrementViews(threadId);
                }
            }
        });

        // Comment form handler
        document.addEventListener('submit', (e) => {
            if (e.target.classList.contains('comment-form')) {
                e.preventDefault();
                const modal = document.querySelector('#threadDetailModal');
                const threadId = modal.dataset.threadId;
                const commentText = e.target.querySelector('textarea').value.trim();
                
                if (threadId && commentText) {
                    this.addComment(threadId, commentText);
                    e.target.querySelector('textarea').value = '';
                }
            }
        });

        // Like button handler
        document.addEventListener('click', (e) => {
            const likeBtn = e.target.closest('.like-btn');
            if (likeBtn) {
                const modal = document.querySelector('#threadDetailModal');
                const threadId = modal.dataset.threadId;
                if (threadId) {
                    this.toggleLike(threadId);
                }
            }
        });
    }

    showModal(modalId) {
        document.getElementById(modalId).style.display = 'flex';
    }

    hideModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    createThread(form) {
        const formData = new FormData(form);
        const thread = {
            id: Date.now().toString(),
            category: formData.get('category'),
            title: formData.get('title'),
            content: formData.get('content'),
            tags: formData.get('tags').split(',').map(tag => tag.trim()),
            author: this.currentUser.name,
            date: new Date().toISOString(),
            likes: 0,
            replies: 0,
            comments: []
        };

        this.threads.push(thread);
        this.saveThreads();
        this.renderThreads();
        this.hideModal();
    }

    saveThreads() {
        localStorage.setItem('forum_threads', JSON.stringify(this.threads));
    }

    renderThreads() {
        const categories = document.querySelectorAll('.category');
        categories.forEach(category => {
            const categoryName = category.dataset.category;
            const threadsList = category.querySelector('.threads-list');
            const categoryThreads = this.threads.filter(thread => thread.category === categoryName);

            threadsList.innerHTML = categoryThreads.length > 0 
                ? categoryThreads.map(thread => this.createThreadElement(thread)).join('')
                : '<div class="no-threads">No threads in this category yet.</div>';
        });
    }

    createThreadElement(thread) {
        return `
            <div class="thread-item" data-thread-id="${thread.id}">
                <div class="thread-header">
                    <div class="thread-author">
                        <div class="author-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <div class="author-details">
                            <span class="author-name">${thread.author}</span>
                            <span class="post-date">${this.formatDate(thread.date)}</span>
                        </div>
                    </div>
                    <a href="#" class="thread-title">${thread.title}</a>
                    <div class="thread-meta">
                        <span><i class="fas fa-comment"></i> ${thread.replies}</span>
                        <span><i class="fas fa-heart"></i> ${thread.likes}</span>
                        <span><i class="fas fa-eye"></i> ${thread.views || 0}</span>
                    </div>
                </div>
                <div class="thread-tags">
                    ${thread.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
        `;
    }

    renderAnnouncements() {
        const announcementsList = document.querySelector('.announcements-list');
        if (this.announcements.length > 0) {
            announcementsList.innerHTML = this.announcements.map(announcement => `
                <div class="announcement-item">
                    <h3>${announcement.title}</h3>
                    <p>${announcement.content}</p>
                    <div class="announcement-meta">
                        <span>Posted by ${announcement.author}</span>
                        <span>${new Date(announcement.date).toLocaleDateString()}</span>
                    </div>
                </div>
            `).join('');
        } else {
            announcementsList.innerHTML = '<div class="no-announcements">No announcements yet.</div>';
        }
    }

    searchThreads(query) {
        const searchResults = this.threads.filter(thread => 
            thread.title.toLowerCase().includes(query.toLowerCase()) ||
            thread.content.toLowerCase().includes(query.toLowerCase()) ||
            thread.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        );

        this.renderSearchResults(searchResults);
    }

    renderSearchResults(results) {
        const categories = document.querySelectorAll('.category');
        categories.forEach(category => {
            const categoryName = category.dataset.category;
            const threadsList = category.querySelector('.threads-list');
            const categoryResults = results.filter(thread => thread.category === categoryName);

            threadsList.innerHTML = categoryResults.length > 0
                ? categoryResults.map(thread => this.createThreadElement(thread)).join('')
                : '<div class="no-threads">No matching threads found.</div>';
        });
    }

    filterThreads() {
        const dateFilter = document.querySelector('.date-filter').value;
        const sortFilter = document.querySelector('.sort-filter').value;
        let filteredThreads = [...this.threads];

        // Apply date filter
        if (dateFilter !== 'all') {
            const now = new Date();
            filteredThreads = filteredThreads.filter(thread => {
                const threadDate = new Date(thread.date);
                switch (dateFilter) {
                    case 'day':
                        return threadDate.toDateString() === now.toDateString();
                    case 'week':
                        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
                        return threadDate >= weekAgo;
                    case 'month':
                        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                        return threadDate >= monthAgo;
                    default:
                        return true;
                }
            });
        }

        // Apply sort filter
        switch (sortFilter) {
            case 'recent':
                filteredThreads.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'popular':
                filteredThreads.sort((a, b) => b.likes - a.likes);
                break;
            case 'replies':
                filteredThreads.sort((a, b) => b.replies - a.replies);
                break;
        }

        this.renderSearchResults(filteredThreads);
    }

    incrementViews(threadId) {
        const thread = this.threads.find(t => t.id === threadId);
        if (thread) {
            thread.views = (thread.views || 0) + 1;
            this.saveThreads();
            this.updateThreadViews(threadId);
        }
    }

    updateThreadViews(threadId) {
        const thread = this.threads.find(t => t.id === threadId);
        if (thread) {
            const viewCountElement = document.querySelector(`.thread-item[data-thread-id="${threadId}"] .view-count`);
            if (viewCountElement) {
                viewCountElement.textContent = thread.views || 0;
            }
        }
    }

    showThreadDetail(threadId) {
        const thread = this.threads.find(t => t.id === threadId);
        if (thread) {
            const modal = document.querySelector('#threadDetailModal');
            modal.dataset.threadId = threadId;
            
            // Update thread content
            modal.querySelector('.author-name').textContent = thread.author;
            modal.querySelector('.post-date').textContent = this.formatDate(thread.date);
            modal.querySelector('.thread-body').textContent = thread.content;
            
            // Update stats
            modal.querySelector('.reaction-count').textContent = thread.likes || 0;
            modal.querySelector('.comment-count').textContent = `${thread.replies || 0} comments`;
            
            // Update like button state
            const likeBtn = modal.querySelector('.like-btn');
            likeBtn.classList.toggle('active', thread.likes > 0);
            
            // Render comments
            this.renderComments(threadId);
            
            // Show modal
            modal.style.display = 'flex';
        }
    }

    renderComments(threadId) {
        const thread = this.threads.find(t => t.id === threadId);
        if (thread) {
            const commentsList = document.querySelector('.comments-list');
            if (commentsList) {
                commentsList.innerHTML = thread.comments ? thread.comments.map(comment => `
                    <div class="comment-item">
                        <div class="user-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <div class="comment-content">
                            <div class="comment-header">
                                <span class="comment-author">${comment.author}</span>
                                <span class="comment-date">${this.formatDate(comment.date)}</span>
                            </div>
                            <div class="comment-body">${comment.content}</div>
                        </div>
                    </div>
                `).join('') : '';
            }
        }
    }

    addComment(threadId, body) {
        const thread = this.threads.find(t => t.id === threadId);
        if (thread) {
            if (!thread.comments) {
                thread.comments = [];
            }
            
            const comment = {
                id: Date.now().toString(),
                author: this.currentUser.name,
                content: body,
                date: new Date().toISOString()
            };
            
            thread.comments.push(comment);
            thread.replies = thread.comments.length;
            
            this.saveThreads();
            this.renderComments(threadId);
            
            // Update comment count
            const modal = document.querySelector('#threadDetailModal');
            if (modal) {
                modal.querySelector('.comment-count').textContent = `${thread.replies} comments`;
            }
        }
    }

    toggleLike(threadId) {
        const thread = this.threads.find(t => t.id === threadId);
        if (thread) {
            const likeBtn = document.querySelector('.like-btn');
            const isLiked = likeBtn.classList.contains('active');
            
            if (isLiked) {
                thread.likes--;
                likeBtn.classList.remove('active');
            } else {
                thread.likes++;
                likeBtn.classList.add('active');
            }
            
            this.saveThreads();
            
            // Update like count
            const modal = document.querySelector('#threadDetailModal');
            if (modal) {
                modal.querySelector('.reaction-count').textContent = thread.likes;
            }
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Initialize the forum when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ForumManager();
});

// Chatbot functionality
document.addEventListener('DOMContentLoaded', () => {
    const chatbotModal = document.getElementById('chatbotModal');
    const chatbotToggle = document.getElementById('chatbotToggle');
    const chatForm = document.getElementById('chatForm');
    const userInput = document.getElementById('userInput');
    const chatMessages = document.getElementById('chatMessages');

    // Toggle chatbot modal
    chatbotToggle.addEventListener('click', () => {
        chatbotModal.style.display = 'flex';
    });

    // Close chatbot modal
    chatbotModal.querySelector('.close-modal').addEventListener('click', () => {
        chatbotModal.style.display = 'none';
    });

    // Handle chat form submission
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = userInput.value.trim();
        if (!message) return;

        // Add user message to chat
        addMessage(message, 'user');
        userInput.value = '';

        try {
            // Show loading state
            const loadingMessage = addMessage('Thinking...', 'bot');
            
            // Call our PHP endpoint
            const response = await fetch('api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            const data = await response.json();
            
            // Remove loading message
            loadingMessage.remove();
            
            if (data.error) {
                addMessage('Sorry, I encountered an error: ' + data.error, 'bot');
            } else {
                // Add bot response
                addMessage(data.response, 'bot');
            }
        } catch (error) {
            console.error('Error:', error);
            addMessage('Sorry, I encountered an error. Please try again later.', 'bot');
        }
    });

    // Function to add messages to chat
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        
        contentDiv.appendChild(paragraph);
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return messageDiv;
    }

    // Auto-resize textarea
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = userInput.scrollHeight + 'px';
    });
});

// Handle modal close buttons
document.querySelectorAll('.close-modal').forEach(button => {
    button.addEventListener('click', () => {
        const modal = button.closest('.modal');
        modal.style.display = 'none';
    });
}); 