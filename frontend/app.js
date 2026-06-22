// State
let currentUser = null;

// DOM Elements
const sections = {
    events: document.getElementById('events-section'),
    dashboard: document.getElementById('dashboard-section'),
    login: document.getElementById('login-section'),
    register: document.getElementById('register-section')
};

const navLinks = {
    events: document.getElementById('nav-events'),
    dashboard: document.getElementById('nav-dashboard'),
    login: document.getElementById('nav-login'),
    register: document.getElementById('nav-register'),
    logout: document.getElementById('nav-logout')
};

const eventsList = document.getElementById('events-list');
const organizedEventsList = document.getElementById('organized-events-list');
const attendingEventsList = document.getElementById('attending-events-list');

const btnCreateEvent = document.getElementById('btn-create-event');
const createEventModal = document.getElementById('create-event-modal');
const closeModal = document.querySelector('.close');

// Initialize
function init() {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        updateNav();
    }

    // Event Listeners for Navigation
    navLinks.events.addEventListener('click', () => showSection('events'));
    navLinks.dashboard.addEventListener('click', () => showSection('dashboard'));
    navLinks.login.addEventListener('click', () => showSection('login'));
    navLinks.register.addEventListener('click', () => showSection('register'));
    navLinks.logout.addEventListener('click', handleLogout);

    // Form Submissions
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('create-event-form').addEventListener('submit', handleCreateEvent);

    // Modal
    btnCreateEvent.addEventListener('click', () => createEventModal.style.display = 'flex');
    closeModal.addEventListener('click', () => createEventModal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target == createEventModal) createEventModal.style.display = 'none';
    });

    // Load initial data
    loadEvents();
    showSection('events');
}

// Navigation Logic
function showSection(sectionId) {
    Object.values(sections).forEach(sec => sec.style.display = 'none');
    sections[sectionId].style.display = 'block';
    
    if (sectionId === 'events') {
        loadEvents();
    } else if (sectionId === 'dashboard') {
        loadDashboard();
    }
}

function updateNav() {
    if (currentUser) {
        navLinks.login.style.display = 'none';
        navLinks.register.style.display = 'none';
        navLinks.dashboard.style.display = 'inline';
        navLinks.logout.style.display = 'inline';
        btnCreateEvent.style.display = 'block';
    } else {
        navLinks.login.style.display = 'inline';
        navLinks.register.style.display = 'inline';
        navLinks.dashboard.style.display = 'none';
        navLinks.logout.style.display = 'none';
        btnCreateEvent.style.display = 'none';
    }
}

// Rendering Helper
function createEventCard(event) {
    const date = new Date(event.date).toLocaleDateString();
    const card = document.createElement('div');
    card.className = 'event-card';
    
    let actionsHtml = '';
    
    if (currentUser) {
        if (event.organizerId === currentUser.id) {
            actionsHtml = `<div class="event-actions"><button class="btn-danger" onclick="handleDelete('${event.id}')">Delete</button></div>`;
        } else {
            const isAttending = event.attendees && event.attendees.includes(currentUser.id);
            if (isAttending) {
                actionsHtml = `<div class="event-actions"><button class="btn-disabled" disabled>Attending ✓</button></div>`;
            } else {
                actionsHtml = `<div class="event-actions"><button class="btn-success" onclick="handleRSVP('${event.id}')">RSVP</button></div>`;
            }
        }
    }

    card.innerHTML = `
        <h3>${event.title}</h3>
        <p>${event.description}</p>
        <div class="event-details">
            <span>📍 ${event.location}</span>
            <span>📅 ${date}</span>
        </div>
        <div class="event-details" style="margin-top: 0.5rem; font-weight: bold;">
            <span>By: ${event.organizer.name}</span>
            <span>👥 ${event.attendees ? event.attendees.length : 0} Attendees</span>
        </div>
        ${actionsHtml}
    `;
    return card;
}

// API Calls
async function loadEvents() {
    try {
        const res = await fetch('/api/events');
        const events = await res.json();
        
        eventsList.innerHTML = '';
        if(events.length === 0) {
            eventsList.innerHTML = '<p>No upcoming events.</p>';
            return;
        }

        events.forEach(event => eventsList.appendChild(createEventCard(event)));
    } catch (err) {
        console.error('Error loading events:', err);
    }
}

async function loadDashboard() {
    try {
        const res = await fetch('/api/events');
        const events = await res.json();
        
        organizedEventsList.innerHTML = '';
        attendingEventsList.innerHTML = '';
        
        const organized = events.filter(e => e.organizerId === currentUser.id);
        const attending = events.filter(e => e.attendees && e.attendees.includes(currentUser.id) && e.organizerId !== currentUser.id);

        if (organized.length === 0) organizedEventsList.innerHTML = '<p>You haven\'t organized any events yet.</p>';
        else organized.forEach(event => organizedEventsList.appendChild(createEventCard(event)));

        if (attending.length === 0) attendingEventsList.innerHTML = '<p>You haven\'t RSVP\'d to any events yet.</p>';
        else attending.forEach(event => attendingEventsList.appendChild(createEventCard(event)));
        
    } catch (err) {
        console.error('Error loading dashboard:', err);
    }
}

async function handleRSVP(eventId) {
    if (!currentUser) return;
    try {
        const res = await fetch(`/api/events/${eventId}/rsvp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id })
        });
        if (res.ok) {
            loadEvents();
            if (sections.dashboard.style.display === 'block') loadDashboard();
        }
    } catch (err) {
        console.error(err);
    }
}

async function handleDelete(eventId) {
    if (!currentUser) return;
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
        const res = await fetch(`/api/events/${eventId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id })
        });
        if (res.ok) {
            loadEvents();
            if (sections.dashboard.style.display === 'block') loadDashboard();
        }
    } catch (err) {
        console.error(err);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok) {
            currentUser = { id: data.userId, name: data.name };
            localStorage.setItem('user', JSON.stringify(currentUser));
            updateNav();
            showSection('events');
            e.target.reset();
        } else {
            alert(data.error);
        }
    } catch (err) {
        console.error(err);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();

        if (res.ok) {
            alert('Registration successful! Please login.');
            showSection('login');
            e.target.reset();
        } else {
            alert(data.error);
        }
    } catch (err) {
        console.error(err);
    }
}

async function handleCreateEvent(e) {
    e.preventDefault();
    if (!currentUser) return;

    const title = document.getElementById('event-title').value;
    const description = document.getElementById('event-desc').value;
    const date = document.getElementById('event-date').value;
    const location = document.getElementById('event-location').value;

    try {
        const res = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title, description, date, location, organizerId: currentUser.id
            })
        });

        if (res.ok) {
            createEventModal.style.display = 'none';
            e.target.reset();
            loadEvents();
            if (sections.dashboard.style.display === 'block') loadDashboard();
        }
    } catch (err) {
        console.error(err);
    }
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('user');
    updateNav();
    showSection('events');
}

// Boot up
init();
