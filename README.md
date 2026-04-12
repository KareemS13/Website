# Hamza's Barber Website

A full-stack barber shop booking website where customers can browse services, make reservations, and manage appointments.

## Features

- **Home** — Landing page showcasing the barber shop
- **Reservations** — Book, view, and cancel appointments by phone number
- **Buy** — Browse and purchase services
- **Admin** — View all appointments for a given day

## Tech Stack

**Frontend:** HTML, CSS, JavaScript  
**Backend:** Firebase Cloud Functions (Node.js)  
**Database:** Firebase Realtime Database

## Project Structure

```
├── index.html          # Entry point
├── nav.css             # Shared navigation styles
├── firebaseconfig.js   # Firebase initialization
├── index.js            # Cloud Functions backend
├── firebase.json       # Firebase project config
├── home/               # Home page
├── reserve/            # Reservation page
├── buy/                # Services/buy page
├── admin/              # Admin dashboard
└── images/             # Site images
```

## Cloud Functions

| Function | Method | Description |
|---|---|---|
| `reserveAppointment` | POST | Book a new appointment |
| `getAppointments` | GET | Get all appointments for a date |
| `getAppointmentsByPhone` | GET | Get a customer's upcoming appointments |
| `getInfo` | GET | Get full appointment details for a date (admin) |
| `cancelAppointment` | POST | Cancel an existing appointment |

## Deployment

Deploy the Cloud Functions:

```bash
npm install
npm run deploy
```
