const functions = require('firebase-functions');
const admin = require('firebase-admin');
const moment = require('moment');
admin.initializeApp();

exports.reserveAppointment = functions.https.onRequest(async (request, response) => {
    if (request.method !== 'POST') {
        return response.status(405).send('Method Not Allowed');
    }

    const { name, phone, appointmentTime, physicalTime, selectedServices } = request.body;

    if (!name || !phone || !appointmentTime || !physicalTime || !selectedServices) {
        return response.status(400).send('Missing required fields');
    }

    try {
        // Reference to the user's phone number as the first branch
        const userRef = admin.database().ref(`Reservations/${phone}`);

        // Create or update user data with appointment details
        const appointmentData = {
            appointmentTime: appointmentTime, // Store formatted appointment time
            physicalTime: physicalTime, // Store actual reservation time
            services: selectedServices
        };

        // Use update to add the new appointment without overwriting existing data
        await userRef.child('appointments').child(appointmentTime).set(appointmentData);

        // Optionally, update the user's name if it is new or changed
        await userRef.child('name').set(name);

        response.status(200).send({ success: true, message: 'Appointment reserved successfully' });
    } catch (error) {
        console.error('Error saving appointment:', error);
        response.status(500).send('Internal Server Error');
    }
});

exports.getAppointments = functions.https.onRequest(async (request, response) => {
    if (request.method !== 'GET') {
        return response.status(405).send('Method Not Allowed');
    }

    const { date } = request.query;

    if (!date) {
        return response.status(400).send('Missing required field: date');
    }

    try {
        const snapshot = await admin.database().ref('Reservations').once('value');
        const reservations = snapshot.val() || {};
        const reservedSlots = [];

        const formattedDate = moment(date).format('YYYY-MM-DD');

        for (const phone in reservations) {
            const userAppointments = reservations[phone].appointments;
            for (const key in userAppointments) {
                const appointment = userAppointments[key];
                const appointmentDateTime = appointment.appointmentTime;
                const appointmentDate = moment(appointmentDateTime).format('YYYY-MM-DD');

                if (appointmentDate === formattedDate) {
                    reservedSlots.push({
                        time: appointmentDateTime,
                        services: appointment.services
                    });
                }
            }
        }

        console.log({ reservedSlots });
        response.status(200).send({ reservedSlots });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        response.status(500).send('Internal Server Error');
    }
});




exports.getAppointmentsByPhone = functions.https.onRequest(async (request, response) => {
    if (request.method !== 'GET') {
        return response.status(405).send('Method Not Allowed');
    }

    const { phone } = request.query;
    const phone1 = phone.replace(/^\s*(\d+)\s+/, '+$1 ');
    
    if (!phone1) {
        return response.status(400).send('Missing required field: phone');
    }

    console.log(phone1);

    try {
        const snapshot = await admin.database().ref('Reservations').child(phone1).once('value'); // Access the user's reservations using their phone number
        const userData = snapshot.val(); // Get the entire user data
        const userAppointments = userData ? userData.appointments : null;
        const userName = userData ? userData.name : null; // Get the user's name

        if (!userAppointments) {
            return response.status(404).send('No appointments found for this phone number.');
        }

        // Prepare an array to hold upcoming appointments
        const upcomingAppointments = [];
        const currentTime = moment(); // Get the current time for comparison

        for (const key in userAppointments) {
            const appointmentTime = userAppointments[key].appointmentTime;

            // Check if the appointment is in the future
            if (moment(appointmentTime).isAfter(currentTime)) {
                upcomingAppointments.push({
                    appointmentTime,
                    services: userAppointments[key].services, // Retrieve services directly
                    name: userName // Use the retrieved name
                });
            }
        }

        console.log({ upcomingAppointments });
        response.status(200).send({ appointments: upcomingAppointments });
    } catch (error) {
        console.error('Error retrieving appointments:', error);
        response.status(500).send('Internal Server Error');
    }
});



exports.getInfo = functions.https.onRequest(async (request, response) => {
    if (request.method !== 'GET') {
        return response.status(405).send('Method Not Allowed');
    }

    const { date } = request.query;

    if (!date) {
        return response.status(400).send('Missing required field: date');
    }

    try {
        const snapshot = await admin.database().ref('Reservations').once('value');
        const reservations = snapshot.val() || {};
        const appointmentDetails = [];

        const formattedDate = moment(date).format('YYYY-MM-DD');

        for (const phone in reservations) {
            const userAppointments = reservations[phone].appointments;
            const userName = reservations[phone].name; // Corrected variable declaration
            for (const key in userAppointments) {
                const appointmentDateTime = userAppointments[key].appointmentTime;
                const appointmentDate = moment(appointmentDateTime).format('YYYY-MM-DD');

                if (appointmentDate === formattedDate) {
                    appointmentDetails.push({
                        name: userName,
                        phone: phone,
                        appointmentTime: appointmentDateTime,
                        services: userAppointments[key].services // Include services here
                    });
                }
            }
        }

        console.log({ appointmentDetails });
        response.status(200).send({ appointmentDetails });
    } catch (error) {
        console.error('Error retrieving appointment info:', error);
        response.status(500).send('Internal Server Error');
    }
});


exports.cancelAppointment = functions.https.onRequest(async (request, response) => {
    if (request.method !== 'POST') {
        return response.status(405).send('Method Not Allowed');
    }

    const { phoneNumber, appointmentTime } = request.body;

    if (!phoneNumber || !appointmentTime) {
        return response.status(400).send('Missing required fields: phoneNumber or appointmentTime');
    }

    try {
        const userRef = admin.database().ref(`Reservations/${phoneNumber}/appointments`);
        
        // Find and remove the appointment
        const snapshot = await userRef.once('value');
        const userAppointments = snapshot.val();

        if (!userAppointments) {
            return response.status(404).send('No appointments found for this phone number.');
        }

        // Iterate through appointments to find and remove the specified one
        let appointmentFound = false;
        
        for (const key in userAppointments) {
            if (userAppointments[key].appointmentTime === appointmentTime) {
                await userRef.child(key).remove(); // Remove the appointment
                appointmentFound = true;
                break;
            }
        }

        if (!appointmentFound) {
            return response.status(404).send('Appointment not found.');
        }

        response.status(200).send('Appointment canceled successfully.');
    } catch (error) {
        console.error('Error canceling appointment:', error);
        response.status(500).send('Internal Server Error');
    }
});