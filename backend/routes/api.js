const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(__dirname, '../data/db.json');

// Helper to read DB
const readDB = () => {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ users: [], events: [] }));
    }
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
};

// Helper to write DB
const writeDB = (data) => {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

// Register a new user
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const db = readDB();
        
        // Check if user already exists
        const existingUser = db.users.find(u => u.email === email);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = {
            id: crypto.randomUUID(),
            name,
            email,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        db.users.push(newUser);
        writeDB(db);

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (err) {
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = readDB();
        
        const user = db.users.find(u => u.email === email);
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        res.json({ message: 'Logged in successfully', userId: user.id, name: user.name });
    } catch (err) {
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Get all events
router.get('/events', (req, res) => {
    try {
        const db = readDB();
        // Populate organizer name for events
        const populatedEvents = db.events.map(event => {
            const organizer = db.users.find(u => u.id === event.organizerId);
            return {
                ...event,
                organizer: organizer ? { name: organizer.name } : { name: 'Unknown' }
            };
        });
        
        // Sort by date
        populatedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        res.json(populatedEvents);
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching events' });
    }
});

// Create an event
router.post('/events', (req, res) => {
    try {
        const { title, description, date, location, organizerId } = req.body;
        const db = readDB();
        
        const newEvent = {
            id: crypto.randomUUID(),
            title,
            description,
            date,
            location,
            organizerId,
            attendees: [],
            createdAt: new Date().toISOString()
        };
        
        db.events.push(newEvent);
        writeDB(db);
        
        res.status(201).json({ message: 'Event created successfully!', event: newEvent });
    } catch (err) {
        res.status(500).json({ error: 'Server error creating event' });
    }
});

// RSVP to an event
router.post('/events/:id/rsvp', (req, res) => {
    try {
        const { userId } = req.body;
        const eventId = req.params.id;
        const db = readDB();
        
        const eventIndex = db.events.findIndex(e => e.id === eventId);
        if (eventIndex === -1) return res.status(404).json({ error: 'Event not found' });
        
        if (!db.events[eventIndex].attendees.includes(userId)) {
            db.events[eventIndex].attendees.push(userId);
            writeDB(db);
        }
        
        res.json({ message: 'RSVP successful!' });
    } catch (err) {
        res.status(500).json({ error: 'Server error during RSVP' });
    }
});

// Delete an event
router.delete('/events/:id', (req, res) => {
    try {
        const { userId } = req.body; // In a real app, this should come from a secure auth token
        const eventId = req.params.id;
        const db = readDB();
        
        const eventIndex = db.events.findIndex(e => e.id === eventId);
        if (eventIndex === -1) return res.status(404).json({ error: 'Event not found' });
        
        if (db.events[eventIndex].organizerId !== userId) {
            return res.status(403).json({ error: 'Unauthorized to delete this event' });
        }
        
        db.events.splice(eventIndex, 1);
        writeDB(db);
        
        res.json({ message: 'Event deleted successfully!' });
    } catch (err) {
        res.status(500).json({ error: 'Server error deleting event' });
    }
});

module.exports = router;
