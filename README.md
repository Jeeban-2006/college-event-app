# College Event Management App

A simple and modern web application to manage and discover college events. Built with an Express.js backend and a lightweight HTML/CSS/JS frontend.

## Features
- User Authentication (Register/Login)
- View upcoming events
- Create new events
- Clean, responsive UI

## Architecture
- **Frontend**: Vanilla HTML, CSS, JavaScript (served via Express)
- **Backend**: Node.js, Express.js
- **Database**: Local JSON File Storage (`backend/data/db.json`)
- **Authentication**: bcryptjs for password hashing

## How It Works: Organizers vs Attendees
To keep the application logical and realistic, users have different permissions depending on their relationship to an event:
- **Organizers**: When you create an event, you become its Organizer. You cannot RSVP to your own event. Instead of an RSVP button, you will see a red **Delete** button that allows you to cancel the event.
- **Attendees**: If you are viewing an event created by someone else, you will see a green **RSVP** button. Clicking it marks you as an attendee and adds the event to your Dashboard.

*Tip: To test the RSVP feature, create two separate user accounts (e.g., User A and User B). Have User A create an event, then log in as User B to RSVP to it!*

For detailed instructions on how to set up and start the application, please refer to [startup.md](startup.md).
