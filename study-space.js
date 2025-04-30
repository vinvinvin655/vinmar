// Schedule Manager Class
class ScheduleManager {
    constructor() {
        this.currentDate = new Date();
        this.events = JSON.parse(localStorage.getItem('scheduleEvents')) || [];
        this.viewMode = 'month';
        this.initializeCalendar();
        this.initializeEventHandlers();
        this.renderEvents();
    }

    initializeCalendar() {
        this.renderCalendar();
    }

    initializeEventHandlers() {
        // Calendar navigation
        const prevMonthBtn = document.querySelector('.prev-month');
        const nextMonthBtn = document.querySelector('.next-month');
        const addEventBtn = document.querySelector('.add-event-btn');
        const viewToggleBtn = document.querySelector('.view-toggle-btn');
        const eventFilter = document.querySelector('.events-filter select');

        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', () => this.navigateMonth(-1));
        }
        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', () => this.navigateMonth(1));
        }
        if (addEventBtn) {
            addEventBtn.addEventListener('click', () => this.showAddEventModal());
        }
        if (viewToggleBtn) {
            viewToggleBtn.addEventListener('click', () => this.toggleView());
        }
        if (eventFilter) {
            eventFilter.addEventListener('change', (e) => this.filterEvents(e.target.value));
        }

        // Add event handler for the "Add Event" button in the empty state
        document.addEventListener('click', (e) => {
            if (e.target.closest('.no-events .add-event-btn')) {
                this.showAddEventModal();
            }
        });
    }

    toggleView() {
        this.viewMode = this.viewMode === 'month' ? 'week' : 'month';
        const viewToggleBtn = document.querySelector('.view-toggle-btn');
        if (viewToggleBtn) {
            viewToggleBtn.innerHTML = `<i class="fas fa-${this.viewMode === 'month' ? 'calendar-week' : 'calendar-alt'}"></i>`;
        }
        this.renderCalendar();
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Update month header
        const monthHeader = document.querySelector('.current-month');
        if (monthHeader) {
            monthHeader.textContent = new Date(year, month).toLocaleDateString('default', { month: 'long', year: 'numeric' });
        }
        
        if (this.viewMode === 'month') {
            this.renderMonthView(year, month);
        } else {
            this.renderWeekView();
        }
    }

    renderMonthView(year, month) {
        const firstDay = new Date(year, month, 1).getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();
        
        const calendarDays = document.querySelector('.calendar-days');
        if (!calendarDays) return;
        
        calendarDays.innerHTML = '';
        
        // Add empty cells for days before first day of month
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day empty';
            calendarDays.appendChild(emptyCell);
        }
        
        // Add days of month
        const today = new Date();
        for (let day = 1; day <= totalDays; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            // Highlight today
            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayElement.classList.add('today');
            }
            
            // Add event indicator
            const date = new Date(year, month, day);
            if (this.hasEventsOnDate(date)) {
                dayElement.classList.add('has-events');
            }
            
            // Add click handler
            dayElement.addEventListener('click', () => this.showDayEvents(date));
            
            calendarDays.appendChild(dayElement);
        }
    }

    renderWeekView() {
        const calendarDays = document.querySelector('.calendar-days');
        if (!calendarDays) return;
        
        calendarDays.innerHTML = '';
        
        const today = new Date();
        const currentDay = today.getDay();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - currentDay);
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.innerHTML = `
                <span class="weekday">${date.toLocaleDateString('default', { weekday: 'short' })}</span>
                <span class="day">${date.getDate()}</span>
            `;
            
            if (date.toDateString() === today.toDateString()) {
                dayElement.classList.add('today');
            }
            
            if (this.hasEventsOnDate(date)) {
                dayElement.classList.add('has-events');
            }
            
            dayElement.addEventListener('click', () => this.showDayEvents(date));
            calendarDays.appendChild(dayElement);
        }
    }

    navigateMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderCalendar();
    }

    hasEventsOnDate(date) {
        return this.events.some(event => {
            const eventDate = new Date(event.date);
            return eventDate.toDateString() === date.toDateString();
        });
    }

    showDayEvents(date) {
        const dayEvents = this.events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.toDateString() === date.toDateString();
        });
        
        this.renderEvents(dayEvents);
    }

    renderEvents(events = this.events) {
        const eventsList = document.querySelector('.events-list');
        if (!eventsList) return;
        
        eventsList.innerHTML = '';
        
        if (events.length === 0) {
            eventsList.innerHTML = `
                <div class="no-events">
                    <i class="fas fa-calendar-plus"></i>
                    <p>No events scheduled</p>
                </div>
            `;
            return;
        }
        
        events.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = 'event-item';
            
            const typeIcon = this.getEventTypeIcon(event.type);
            const timeIcon = this.getTimeIcon(event.startTime);
            
            eventElement.innerHTML = `
                <span class="event-time">
                    <i class="fas ${timeIcon}"></i>
                    ${this.formatTime(event.startTime)} - ${this.formatTime(event.endTime)}
                </span>
                <h4 class="event-title">${event.title}</h4>
                <span class="event-type ${event.type}">
                    <i class="fas ${typeIcon}"></i>
                    ${event.type}
                </span>
                ${event.description ? `<p class="event-description">${event.description}</p>` : ''}
                <div class="event-actions">
                    <button class="edit-event" title="Edit Event">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-event" title="Delete Event">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            eventsList.appendChild(eventElement);
            
            // Add event handlers for edit and delete buttons
            eventElement.querySelector('.edit-event').addEventListener('click', () => this.editEvent(event));
            eventElement.querySelector('.delete-event').addEventListener('click', () => this.deleteEvent(event.id));
        });
    }

    getEventTypeIcon(type) {
        const icons = {
            class: 'fa-chalkboard-teacher',
            study: 'fa-book',
            exam: 'fa-file-alt',
            assignment: 'fa-tasks'
        };
        return icons[type] || 'fa-calendar';
    }

    getTimeIcon(time) {
        const hour = parseInt(time.split(':')[0]);
        if (hour < 12) return 'fa-sun';
        if (hour < 17) return 'fa-cloud-sun';
        return 'fa-moon';
    }

    editEvent(event) {
        this.showAddEventModal(event);
    }

    deleteEvent(eventId) {
        if (confirm('Are you sure you want to delete this event?')) {
            this.events = this.events.filter(e => e.id !== eventId);
            localStorage.setItem('scheduleEvents', JSON.stringify(this.events));
            this.renderCalendar();
            this.renderEvents();
        }
    }

    showAddEventModal(event = null) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>${event ? 'Edit Event' : 'Add New Event'}</h3>
                <form id="event-form">
                    <div class="form-group">
                        <label for="event-title">Title</label>
                        <input type="text" id="event-title" name="title" required value="${event?.title || ''}">
                    </div>
                    <div class="form-group">
                        <label for="event-date">Date</label>
                        <input type="date" id="event-date" name="date" required value="${event?.date || ''}">
                    </div>
                    <div class="form-group">
                        <label for="event-start-time">Start Time</label>
                        <input type="time" id="event-start-time" name="startTime" required value="${event?.startTime || ''}">
                    </div>
                    <div class="form-group">
                        <label for="event-end-time">End Time</label>
                        <input type="time" id="event-end-time" name="endTime" required value="${event?.endTime || ''}">
                    </div>
                    <div class="form-group">
                        <label for="event-type">Type</label>
                        <select id="event-type" name="type" required>
                            <option value="class" ${event?.type === 'class' ? 'selected' : ''}>Class</option>
                            <option value="study" ${event?.type === 'study' ? 'selected' : ''}>Study Time</option>
                            <option value="exam" ${event?.type === 'exam' ? 'selected' : ''}>Exam</option>
                            <option value="assignment" ${event?.type === 'assignment' ? 'selected' : ''}>Assignment</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="event-description">Description</label>
                        <textarea id="event-description" name="description">${event?.description || ''}</textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="cancel-btn">Cancel</button>
                        <button type="submit">${event ? 'Update' : 'Add'} Event</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const form = modal.querySelector('#event-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const eventData = {
                id: event?.id || Date.now().toString(),
                title: formData.get('title'),
                date: formData.get('date'),
                startTime: formData.get('startTime'),
                endTime: formData.get('endTime'),
                type: formData.get('type'),
                description: formData.get('description')
            };
            
            if (event) {
                const index = this.events.findIndex(e => e.id === event.id);
                this.events[index] = eventData;
            } else {
                this.events.push(eventData);
            }
            
            localStorage.setItem('scheduleEvents', JSON.stringify(this.events));
            this.renderCalendar();
            this.renderEvents();
            modal.remove();
        });
        
        const cancelBtn = modal.querySelector('.cancel-btn');
        cancelBtn.addEventListener('click', () => modal.remove());
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    filterEvents(type) {
        if (type === 'all') {
            this.renderEvents();
        } else {
            const filteredEvents = this.events.filter(event => event.type === type);
            this.renderEvents(filteredEvents);
        }
    }

    formatTime(time) {
        return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const sidebarItems = document.querySelectorAll('.sidebar-menu li');
    const contentSections = document.querySelectorAll('.content-section');

    // Initialize schedule manager if schedule tab is active on page load
    const activeTab = document.querySelector('.sidebar-menu li.active');
    if (activeTab && activeTab.getAttribute('data-tab') === 'schedule') {
        window.scheduleManager = new ScheduleManager();
    }

    sidebarItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            sidebarItems.forEach(i => i.classList.remove('active'));
            contentSections.forEach(section => section.classList.remove('active'));

            // Add active class to clicked item
            this.classList.add('active');

            // Show corresponding content section
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');

            // Scroll to top of content
            document.querySelector('.study-content').scrollTo({
                top: 0,
                behavior: 'smooth'
            });

            // Initialize schedule manager if schedule tab is clicked
            if (tabId === 'schedule') {
                if (!window.scheduleManager) {
                    window.scheduleManager = new ScheduleManager();
                }
            }
        });
    });

    // Unit Conversion functionality
    const conversionCards = document.querySelectorAll('.conversion-card');
    
    // Conversion factors for different units
    const conversionFactors = {
        length: {
            m: 1,
            ft: 3.28084,
            in: 39.3701,
            cm: 100,
            mm: 1000,
            km: 0.001,
            mi: 0.000621371
        },
        area: {
            m2: 1,
            ft2: 10.7639,
            in2: 1550,
            ha: 0.0001,
            ac: 0.000247105
        },
        force: {
            N: 1,
            kN: 0.001,
            lbf: 0.224809,
            kgf: 0.101972
        },
        pressure: {
            Pa: 1,
            kPa: 0.001,
            MPa: 0.000001,
            psi: 0.000145038,
            bar: 0.00001
        }
    };

    conversionCards.forEach(card => {
        const input = card.querySelector('input');
        const fromSelect = card.querySelector('select:first-of-type');
        const toSelect = card.querySelector('select:last-of-type');
        const convertBtn = card.querySelector('.convert-btn');
        const resultValue = card.querySelector('.result-value');
        const resultUnit = card.querySelector('.result-unit');
        const result = card.querySelector('.result');

        // Add input validation
        input.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9.-]/g, '');
            if (this.value.includes('-')) {
                this.value = this.value.replace(/-/g, '');
            }
        });

        // Add keyboard support
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                convertBtn.click();
            }
        });

        // Add copy to clipboard functionality
        result.addEventListener('click', function() {
            const textToCopy = `${resultValue.textContent} ${resultUnit.textContent}`;
            navigator.clipboard.writeText(textToCopy).then(() => {
                showNotification('Result copied to clipboard!', 'success');
            }).catch(() => {
                showNotification('Failed to copy result', 'error');
            });
        });

        convertBtn.addEventListener('click', function() {
            const value = parseFloat(input.value);
            const fromUnit = fromSelect.value;
            const toUnit = toSelect.value;
            const category = card.querySelector('h3').textContent.toLowerCase();

            if (isNaN(value)) {
                showNotification('Please enter a valid number', 'error');
                return;
            }

            // Convert to base unit
            const baseValue = value / conversionFactors[category][fromUnit];
            // Convert from base unit to target unit
            const convertedValue = baseValue * conversionFactors[category][toUnit];

            // Format the result based on its magnitude
            let formattedResult;
            if (Math.abs(convertedValue) < 0.0001) {
                formattedResult = convertedValue.toExponential(4);
            } else if (Math.abs(convertedValue) < 0.01) {
                formattedResult = convertedValue.toFixed(6);
            } else if (Math.abs(convertedValue) < 1) {
                formattedResult = convertedValue.toFixed(4);
            } else if (Math.abs(convertedValue) < 1000) {
                formattedResult = convertedValue.toFixed(2);
            } else {
                formattedResult = convertedValue.toLocaleString();
            }

            resultValue.textContent = formattedResult;
            resultUnit.textContent = toUnit;

            // Add animation to result
            result.style.animation = 'none';
            result.offsetHeight; // Trigger reflow
            result.style.animation = 'fadeIn 0.3s ease';
        });
    });

    // Formula search functionality
    const formulaSearch = document.querySelector('#formulas .search-box input');
    const formulaItems = document.querySelectorAll('.formula-item');

    formulaSearch.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        
        formulaItems.forEach(item => {
            const title = item.querySelector('.formula-title').textContent.toLowerCase();
            const description = item.querySelector('.formula-description').textContent.toLowerCase();
            const equation = item.querySelector('.formula-equation').textContent.toLowerCase();
            
            if (title.includes(searchTerm) || description.includes(searchTerm) || equation.includes(searchTerm)) {
                item.style.display = 'block';
                item.style.animation = 'fadeIn 0.3s ease';
            } else {
                item.style.display = 'none';
            }
        });
    });

    // Practice Problems functionality
    const problemFilters = document.querySelectorAll('#practice select');
    const problemCards = document.querySelectorAll('.problem-card');

    // Add more practice problems
    const practiceProblems = [
        {
            difficulty: 'easy',
            topic: 'Structural Analysis',
            title: 'Beam Deflection',
            description: 'Calculate the maximum deflection of a simply supported beam with a uniform load of 10 kN/m and a span of 6m.',
            solution: 'Using the deflection formula: δ = (5wL⁴)/(384EI)',
            steps: [
                'Identify given values: w = 10 kN/m, L = 6m',
                'Calculate moment of inertia (I) for the beam section',
                'Determine modulus of elasticity (E) for the material',
                'Plug values into the deflection formula',
                'Calculate the result'
            ],
            answer: 'The maximum deflection is 0.0167 m (16.7 mm)',
            formula: 'δ = (5wL⁴)/(384EI)',
            variables: {
                'w': '10 kN/m',
                'L': '6 m',
                'E': '200 GPa',
                'I': '8.33 × 10⁻⁶ m⁴'
            }
        },
        {
            difficulty: 'medium',
            topic: 'Geotechnical',
            title: 'Bearing Capacity',
            description: 'Calculate the ultimate bearing capacity of a square footing with width 2m, depth 1.5m, and soil properties: c = 20 kPa, φ = 30°, γ = 18 kN/m³.',
            solution: 'Using Terzaghi\'s bearing capacity equation',
            steps: [
                'Calculate effective overburden pressure (q)',
                'Determine bearing capacity factors (Nc, Nq, Nγ)',
                'Apply Terzaghi\'s equation: qu = cNc + qNq + 0.5γBNγ',
                'Calculate the result'
            ],
            answer: 'The ultimate bearing capacity is 1,234.5 kPa',
            formula: 'qu = cNc + qNq + 0.5γBNγ',
            variables: {
                'c': '20 kPa',
                'φ': '30°',
                'γ': '18 kN/m³',
                'B': '2 m',
                'D': '1.5 m'
            }
        },
        {
            difficulty: 'hard',
            topic: 'Hydraulics',
            title: 'Flow Rate Calculation',
            description: 'Determine the flow rate in a rectangular channel with width 3m, depth 1.5m, slope 0.001, and Manning\'s n = 0.013.',
            solution: 'Using Manning\'s equation: Q = (1/n)AR^(2/3)S^(1/2)',
            steps: [
                'Calculate cross-sectional area (A)',
                'Determine wetted perimeter (P)',
                'Calculate hydraulic radius (R = A/P)',
                'Plug values into Manning\'s equation',
                'Calculate the result'
            ],
            answer: 'The flow rate is 4.56 m³/s',
            formula: 'Q = (1/n)AR^(2/3)S^(1/2)',
            variables: {
                'n': '0.013',
                'b': '3 m',
                'y': '1.5 m',
                'S': '0.001'
            }
        },
        {
            difficulty: 'medium',
            topic: 'Thermodynamics',
            title: 'Heat Transfer Calculation',
            description: 'Calculate the rate of heat transfer through a composite wall with three layers: brick (k₁ = 0.72 W/m·K, L₁ = 0.1m), insulation (k₂ = 0.04 W/m·K, L₂ = 0.05m), and concrete (k₃ = 1.4 W/m·K, L₃ = 0.15m). The temperature difference is 25°C.',
            solution: 'Using Fourier\'s Law of Heat Conduction',
            steps: [
                'Calculate thermal resistance for each layer',
                'Determine total thermal resistance',
                'Apply Fourier\'s Law: Q = ΔT/R_total',
                'Calculate the result'
            ],
            answer: 'The heat transfer rate is 45.2 W/m²',
            formula: 'Q = ΔT/(L₁/k₁ + L₂/k₂ + L₃/k₃)',
            variables: {
                'k₁': '0.72 W/m·K',
                'L₁': '0.1 m',
                'k₂': '0.04 W/m·K',
                'L₂': '0.05 m',
                'k₃': '1.4 W/m·K',
                'L₃': '0.15 m',
                'ΔT': '25°C'
            }
        },
        {
            difficulty: 'hard',
            topic: 'Mechanics',
            title: 'Stress Analysis',
            description: 'A steel shaft with diameter 50mm is subjected to a torque of 500 N·m and an axial force of 20 kN. Calculate the maximum principal stress.',
            solution: 'Using combined stress analysis',
            steps: [
                'Calculate normal stress from axial force',
                'Determine shear stress from torque',
                'Apply principal stress formula',
                'Calculate the result'
            ],
            answer: 'The maximum principal stress is 102.4 MPa',
            formula: 'σ₁ = (σ/2) + √((σ/2)² + τ²)',
            variables: {
                'd': '50 mm',
                'T': '500 N·m',
                'F': '20 kN',
                'A': 'πd²/4',
                'J': 'πd⁴/32'
            }
        },
        {
            difficulty: 'easy',
            topic: 'Environmental',
            title: 'BOD Calculation',
            description: 'Calculate the 5-day BOD of a wastewater sample if the initial DO is 8.2 mg/L and the final DO after 5 days is 3.5 mg/L. The sample was diluted 1:10.',
            solution: 'Using BOD formula',
            steps: [
                'Calculate DO depletion',
                'Apply dilution factor',
                'Calculate BOD',
                'Determine the result'
            ],
            answer: 'The 5-day BOD is 47 mg/L',
            formula: 'BOD = (DO_initial - DO_final) × Dilution Factor',
            variables: {
                'DO_initial': '8.2 mg/L',
                'DO_final': '3.5 mg/L',
                'Dilution': '1:10'
            }
        },
        {
            difficulty: 'medium',
            topic: 'Transportation',
            title: 'Traffic Flow Analysis',
            description: 'Calculate the peak hour factor (PHF) for a traffic stream with the following 15-minute counts: 250, 280, 300, and 270 vehicles.',
            solution: 'Using PHF formula',
            steps: [
                'Calculate hourly volume',
                'Determine maximum 15-minute flow',
                'Apply PHF formula',
                'Calculate the result'
            ],
            answer: 'The peak hour factor is 0.917',
            formula: 'PHF = Hourly Volume / (4 × Max 15-min Volume)',
            variables: {
                'Q₁': '250 veh/15min',
                'Q₂': '280 veh/15min',
                'Q₃': '300 veh/15min',
                'Q₄': '270 veh/15min'
            }
        },
        {
            difficulty: 'hard',
            topic: 'Structural',
            title: 'Column Design',
            description: 'Design a steel column to carry an axial load of 500 kN. The column is 4m long and pinned at both ends. Use A36 steel (Fy = 250 MPa).',
            solution: 'Using column design equations',
            steps: [
                'Calculate required area',
                'Determine slenderness ratio',
                'Check buckling capacity',
                'Select appropriate section'
            ],
            answer: 'Use W200×46 section with Pn = 520 kN',
            formula: 'Pn = 0.85AgFcr',
            variables: {
                'P': '500 kN',
                'L': '4 m',
                'Fy': '250 MPa',
                'E': '200 GPa'
            }
        }
    ];

    // Function to create problem cards
    function createProblemCards() {
        const problemsGrid = document.querySelector('.problems-grid');
        problemsGrid.innerHTML = '';

        practiceProblems.forEach(problem => {
            const card = document.createElement('div');
            card.className = 'problem-card';
            card.innerHTML = `
                <div class="problem-header">
                    <h3>${problem.title}</h3>
                    <div class="problem-meta">
                        <span class="difficulty ${problem.difficulty}">${problem.difficulty}</span>
                        <span class="topic">${problem.topic}</span>
                    </div>
                </div>
                <div class="problem-content">
                    <div class="problem-description">
                        <p>${problem.description}</p>
                    </div>
                    <div class="problem-formula">
                        <h4>Formula</h4>
                        <p>${problem.formula}</p>
                    </div>
                    <div class="problem-variables">
                        <h4>Given Variables</h4>
                        <ul>
                            ${Object.entries(problem.variables).map(([key, value]) => 
                                `<li>${key} = ${value}</li>`
                            ).join('')}
                        </ul>
                    </div>
                    <div class="answer-section">
                        <div class="answer-input">
                            <input type="text" placeholder="Enter your answer" aria-label="Your answer">
                            <button class="check-answer-btn">Check Answer</button>
                        </div>
                        <div class="answer-buttons">
                            <button class="show-answer-btn">Show Answer</button>
                            <button class="show-solution-btn">Show Solution</button>
                        </div>
                        <div class="final-answer" style="display: none;">
                            <h5>Final Answer</h5>
                            <p>${problem.answer}</p>
                        </div>
                    </div>
                    <div class="solution-section">
                        <div class="solution-content">
                            <div class="solution-steps">
                                <h5>Solution Steps</h5>
                                <ol>
                                    ${problem.steps.map(step => `<li>${step}</li>`).join('')}
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Add event listeners
            const checkAnswerBtn = card.querySelector('.check-answer-btn');
            const answerInput = card.querySelector('.answer-input input');
            const finalAnswer = card.querySelector('.final-answer');
            const showAnswerBtn = card.querySelector('.show-answer-btn');
            const showSolutionBtn = card.querySelector('.show-solution-btn');
            const solutionContent = card.querySelector('.solution-content');

            checkAnswerBtn.addEventListener('click', () => {
                const userAnswer = answerInput.value.trim();
                if (!userAnswer) {
                    showNotification('Please enter an answer', 'error');
                    return;
                }

                // Simple answer checking (can be enhanced with more sophisticated comparison)
                const isCorrect = userAnswer.toLowerCase().includes(problem.answer.toLowerCase());
                if (isCorrect) {
                    showNotification('Correct! Well done!', 'success');
                    answerInput.style.borderColor = 'var(--success-color)';
                    finalAnswer.style.display = 'block';
                } else {
                    showNotification('Not quite right. Try again!', 'error');
                    answerInput.style.borderColor = 'var(--danger-color)';
                }
            });

            answerInput.addEventListener('input', () => {
                answerInput.style.borderColor = 'var(--border-color)';
            });

            showAnswerBtn.addEventListener('click', () => {
                finalAnswer.style.display = finalAnswer.style.display === 'none' ? 'block' : 'none';
                showAnswerBtn.textContent = finalAnswer.style.display === 'none' ? 'Show Answer' : 'Hide Answer';
            });

            showSolutionBtn.addEventListener('click', () => {
                solutionContent.classList.toggle('active');
                showSolutionBtn.textContent = solutionContent.classList.contains('active') ? 'Hide Solution' : 'Show Solution';
            });

            problemsGrid.appendChild(card);
        });
    }

    // Create initial problem cards
    createProblemCards();

    // Filter problems
    problemFilters.forEach(filter => {
        filter.addEventListener('change', function() {
            const topicFilter = document.querySelector('#practice select:first-of-type').value;
            const difficultyFilter = document.querySelector('#practice select:last-of-type').value;

            problemCards.forEach(card => {
                const topic = card.querySelector('.topic').textContent.toLowerCase();
                const difficulty = card.querySelector('.difficulty').textContent.toLowerCase();

                const matchesTopic = topicFilter === 'all' || topic.includes(topicFilter);
                const matchesDifficulty = difficultyFilter === 'all' || difficulty === difficultyFilter;

                if (matchesTopic && matchesDifficulty) {
                    card.style.display = 'block';
                    card.style.animation = 'fadeIn 0.3s ease';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // Quizlet functionality
    const createSetBtn = document.querySelector('.create-set-btn');
    
    createSetBtn.addEventListener('click', function() {
        showCreateSetModal();
    });

    // Notes functionality
    const newNoteBtn = document.querySelector('.new-note-btn');
    
    newNoteBtn.addEventListener('click', function() {
        showCreateNoteModal();
    });

    // Helper Functions
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'fadeIn 0.3s ease reverse';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    function showCreateSetModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Create New Set</h3>
                <form id="create-set-form">
                    <input type="text" placeholder="Set Title" required>
                    <textarea placeholder="Add terms and definitions (one per line, separated by tab)"></textarea>
                    <button type="submit">Create Set</button>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        const form = modal.querySelector('form');
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const title = form.querySelector('input').value;
            const content = form.querySelector('textarea').value;
            
            // Create new set card
            const newSet = document.createElement('div');
            newSet.className = 'set-card';
            newSet.innerHTML = `
                <div class="set-header">
                    <h3>${title}</h3>
                    <span class="card-count">${content.split('\n').length} cards</span>
                </div>
                <div class="set-stats">
                    <div class="stat">
                        <i class="fas fa-check-circle"></i>
                        <span>0% Mastery</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-clock"></i>
                        <span>Last studied: Just now</span>
                    </div>
                </div>
                <div class="set-actions">
                    <button class="study-btn">Study</button>
                    <button class="edit-btn">Edit</button>
                </div>
            `;

            document.querySelector('.quizlet-sets').appendChild(newSet);
            modal.remove();
            showNotification('Set created successfully!', 'success');
        });

        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    function showCreateNoteModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Create New Note</h3>
                <form id="create-note-form">
                    <input type="text" placeholder="Note Title" required>
                    <textarea placeholder="Note Content"></textarea>
                    <input type="text" placeholder="Tags (comma separated)">
                    <button type="submit">Create Note</button>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        const form = modal.querySelector('form');
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const title = form.querySelector('input[type="text"]').value;
            const content = form.querySelector('textarea').value;
            const tags = form.querySelector('input[type="text"]:last-of-type').value.split(',').map(tag => tag.trim());
            
            // Create new note card
            const newNote = document.createElement('div');
            newNote.className = 'note-card';
            newNote.innerHTML = `
                <div class="note-header">
                    <h3>${title}</h3>
                    <div class="note-actions">
                        <button class="edit-note"><i class="fas fa-edit"></i></button>
                        <button class="delete-note"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="note-content">
                    <p>${content}</p>
                </div>
                <div class="note-footer">
                    <span class="note-date">Last updated: ${new Date().toLocaleDateString()}</span>
                    <span class="note-tags">
                        ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </span>
                </div>
            `;

            document.querySelector('.notes-grid').appendChild(newNote);
            modal.remove();
            showNotification('Note created successfully!', 'success');
        });

        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // Initialize MathJax for formula rendering
    if (window.MathJax) {
        window.MathJax.typeset();
    }

    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            showNotification('Auto-save enabled', 'info');
        }
        // Ctrl/Cmd + F to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            const activeSection = document.querySelector('.content-section.active');
            const searchBox = activeSection.querySelector('.search-box input');
            if (searchBox) {
                searchBox.focus();
            }
        }
    });

    // Initialize formulas array at the top level
    const formulas = [
        {
            category: "Structural Analysis",
            description: "Formulas for analyzing structural elements",
            formulas: [
                {
                    name: "Bending Moment",
                    equation: "M = \\frac{wL^2}{8}",
                    description: "Maximum bending moment in a simply supported beam with uniform load",
                    variables: {
                        "M": "Bending Moment (N·m)",
                        "w": "Uniform Load (N/m)",
                        "L": "Span Length (m)"
                    }
                },
                {
                    name: "Beam Deflection",
                    equation: "\\delta = \\frac{5wL^4}{384EI}",
                    description: "Maximum deflection in a simply supported beam with uniform load",
                    variables: {
                        "δ": "Deflection (m)",
                        "w": "Uniform Load (N/m)",
                        "L": "Span Length (m)",
                        "E": "Modulus of Elasticity (Pa)",
                        "I": "Moment of Inertia (m⁴)"
                    }
                },
                {
                    name: "Shear Force",
                    equation: "V = \\frac{wL}{2}",
                    description: "Maximum shear force in a simply supported beam with uniform load",
                    variables: {
                        "V": "Shear Force (N)",
                        "w": "Uniform Load (N/m)",
                        "L": "Span Length (m)"
                    }
                },
                {
                    name: "Critical Buckling Load",
                    equation: "P_{cr} = \\frac{\\pi^2EI}{(KL)^2}",
                    description: "Euler's formula for critical buckling load of a column",
                    variables: {
                        "P_cr": "Critical Buckling Load (N)",
                        "E": "Modulus of Elasticity (Pa)",
                        "I": "Moment of Inertia (m⁴)",
                        "K": "Effective Length Factor",
                        "L": "Column Length (m)"
                    }
                },
                {
                    name: "Torsion Formula",
                    equation: "\\tau = \\frac{Tr}{J}",
                    description: "Shear stress in a circular shaft under torsion",
                    variables: {
                        "τ": "Shear Stress (Pa)",
                        "T": "Torque (N·m)",
                        "r": "Radius (m)",
                        "J": "Polar Moment of Inertia (m⁴)"
                    }
                }
            ]
        },
        {
            category: "Geotechnical Engineering",
            description: "Formulas for soil mechanics and foundation design",
            formulas: [
                {
                    name: "Bearing Capacity",
                    equation: "q_u = cN_c + qN_q + 0.5\\gamma BN_\\gamma",
                    description: "Ultimate bearing capacity of a shallow foundation",
                    variables: {
                        "q_u": "Ultimate Bearing Capacity (Pa)",
                        "c": "Cohesion (Pa)",
                        "q": "Surcharge (Pa)",
                        "γ": "Unit Weight (N/m³)",
                        "B": "Foundation Width (m)",
                        "N_c, N_q, N_γ": "Bearing Capacity Factors"
                    }
                },
                {
                    name: "Consolidation Settlement",
                    equation: "S_c = C_c\\frac{H}{1+e_0}\\log\\frac{\\sigma'_f}{\\sigma'_0}",
                    description: "Primary consolidation settlement of a clay layer",
                    variables: {
                        "S_c": "Consolidation Settlement (m)",
                        "C_c": "Compression Index",
                        "H": "Layer Thickness (m)",
                        "e_0": "Initial Void Ratio",
                        "σ'_f": "Final Effective Stress (Pa)",
                        "σ'_0": "Initial Effective Stress (Pa)"
                    }
                },
                {
                    name: "Lateral Earth Pressure",
                    equation: "P_a = \\frac{1}{2}K_a\\gamma H^2",
                    description: "Active earth pressure on a retaining wall",
                    variables: {
                        "P_a": "Active Earth Pressure (N/m)",
                        "K_a": "Active Earth Pressure Coefficient",
                        "γ": "Unit Weight (N/m³)",
                        "H": "Wall Height (m)"
                    }
                },
                {
                    name: "Slope Stability",
                    equation: "FS = \\frac{c' + \\sigma'\\tan\\phi'}{\\tau}",
                    description: "Factor of safety for slope stability",
                    variables: {
                        "FS": "Factor of Safety",
                        "c'": "Effective Cohesion (Pa)",
                        "σ'": "Effective Normal Stress (Pa)",
                        "φ'": "Effective Friction Angle (degrees)",
                        "τ": "Shear Stress (Pa)"
                    }
                }
            ]
        },
        {
            category: "Hydraulics",
            description: "Formulas for fluid mechanics and water flow",
            formulas: [
                {
                    name: "Manning's Equation",
                    equation: "V = \\frac{1}{n}R^{2/3}S^{1/2}",
                    description: "Flow velocity in an open channel",
                    variables: {
                        "V": "Flow Velocity (m/s)",
                        "n": "Manning's Coefficient",
                        "R": "Hydraulic Radius (m)",
                        "S": "Channel Slope"
                    }
                },
                {
                    name: "Bernoulli's Equation",
                    equation: "\\frac{p_1}{\\gamma} + \\frac{V_1^2}{2g} + z_1 = \\frac{p_2}{\\gamma} + \\frac{V_2^2}{2g} + z_2",
                    description: "Energy conservation in fluid flow",
                    variables: {
                        "p": "Pressure (Pa)",
                        "γ": "Specific Weight (N/m³)",
                        "V": "Velocity (m/s)",
                        "g": "Gravity (m/s²)",
                        "z": "Elevation (m)"
                    }
                },
                {
                    name: "Hazen-Williams Equation",
                    equation: "Q = 0.849CAR^{0.63}S^{0.54}",
                    description: "Flow rate in pipes",
                    variables: {
                        "Q": "Flow Rate (m³/s)",
                        "C": "Hazen-Williams Coefficient",
                        "A": "Cross-sectional Area (m²)",
                        "R": "Hydraulic Radius (m)",
                        "S": "Energy Grade Line Slope"
                    }
                },
                {
                    name: "Reynolds Number",
                    equation: "Re = \\frac{\\rho VD}{\\mu}",
                    description: "Dimensionless number for flow regime",
                    variables: {
                        "Re": "Reynolds Number",
                        "ρ": "Fluid Density (kg/m³)",
                        "V": "Flow Velocity (m/s)",
                        "D": "Characteristic Length (m)",
                        "μ": "Dynamic Viscosity (Pa·s)"
                    }
                }
            ]
        },
        {
            category: "Transportation",
            description: "Formulas for traffic and transportation engineering",
            formulas: [
                {
                    name: "Traffic Flow",
                    equation: "q = k \\times v",
                    description: "Basic traffic flow relationship",
                    variables: {
                        "q": "Flow Rate (veh/h)",
                        "k": "Density (veh/km)",
                        "v": "Speed (km/h)"
                    }
                },
                {
                    name: "Level of Service",
                    equation: "v/c = \\frac{V}{C}",
                    description: "Volume to capacity ratio for level of service",
                    variables: {
                        "v/c": "Volume to Capacity Ratio",
                        "V": "Volume (veh/h)",
                        "C": "Capacity (veh/h)"
                    }
                },
                {
                    name: "Stopping Sight Distance",
                    equation: "SSD = vt + \\frac{v^2}{2g(f \\pm G)}",
                    description: "Distance required for a vehicle to stop safely",
                    variables: {
                        "SSD": "Stopping Sight Distance (m)",
                        "v": "Initial Speed (m/s)",
                        "t": "Perception-Reaction Time (s)",
                        "g": "Gravity (m/s²)",
                        "f": "Coefficient of Friction",
                        "G": "Grade (decimal)"
                    }
                }
            ]
        }
    ];

    // Function to create formula cards
    function createFormulaCards() {
        const formulaContainer = document.getElementById('formula-categories');
        if (!formulaContainer) return; // Exit if container not found
        
        formulaContainer.innerHTML = '';

        formulas.forEach(category => {
            const categoryCard = document.createElement('div');
            categoryCard.className = 'category-card';
            
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'category-header';
            categoryHeader.innerHTML = `
                <h3>${category.category}</h3>
                <p>${category.description}</p>
            `;
            
            const formulaList = document.createElement('div');
            formulaList.className = 'formula-list';
            
            category.formulas.forEach(formula => {
                const formulaItem = document.createElement('div');
                formulaItem.className = 'formula-item';
                
                formulaItem.innerHTML = `
                    <div class="formula-title">${formula.name}</div>
                    <div class="formula-equation">$${formula.equation}$</div>
                    <div class="formula-description">${formula.description}</div>
                    <div class="formula-variables">
                        <h4>Variables:</h4>
                        <ul>
                            ${Object.entries(formula.variables).map(([varName, varDesc]) => 
                                `<li><strong>${varName}</strong>: ${varDesc}</li>`
                            ).join('')}
                        </ul>
                    </div>
                    <div class="formula-actions">
                        <button class="copy-btn">
                            <i class="fas fa-copy"></i>Copy
                        </button>
                        <button class="save-btn">
                            <i class="fas fa-bookmark"></i>Save
                        </button>
                    </div>
                `;
                
                // Add event listeners for copy and save buttons
                const copyBtn = formulaItem.querySelector('.copy-btn');
                const saveBtn = formulaItem.querySelector('.save-btn');
                
                copyBtn.addEventListener('click', () => {
                    const equation = formula.equation;
                    navigator.clipboard.writeText(equation).then(() => {
                        showNotification('Formula copied to clipboard!', 'success');
                    }).catch(() => {
                        showNotification('Failed to copy formula', 'error');
                    });
                });
                
                saveBtn.addEventListener('click', () => {
                    formulaItem.classList.toggle('saved');
                    const isSaved = formulaItem.classList.contains('saved');
                    saveBtn.innerHTML = `<i class="fas fa-bookmark"></i>${isSaved ? 'Saved' : 'Save'}`;
                    showNotification(isSaved ? 'Formula saved!' : 'Formula removed from saved', 'success');
                });
                
                formulaList.appendChild(formulaItem);
            });
            
            categoryCard.appendChild(categoryHeader);
            categoryCard.appendChild(formulaList);
            formulaContainer.appendChild(categoryCard);
        });

        // Trigger MathJax rendering after adding formulas
        if (window.MathJax) {
            MathJax.typesetPromise();
        }
    }

    // Create initial formula cards
    createFormulaCards();
}); 