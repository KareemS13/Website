const functions = require('firebase-functions');
const admin = require('firebase-admin');
const moment = require('moment');
admin.initializeApp();

const GREEN_API_INSTANCE = '7107547836';
const GREEN_API_TOKEN = '3a7c5871b22347afa27ad573a8b00835fca39237e3d14ebd92';
const BARBER_PHONE = '970595243767';

function formatPhone(phone) {
    return phone.replace(/[\s+\-()]/g, '') + '@c.us';
}

async function sendWhatsApp(phone, message) {
    const url = `https://api.green-api.com/waInstance${GREEN_API_INSTANCE}/sendMessage/${GREEN_API_TOKEN}`;
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatId: formatPhone(phone), message })
        });
    } catch (error) {
        console.error('WhatsApp notification failed:', error);
    }
}

exports.reserveAppointment = functions.https.onRequest(async (request, response) => {
    if (request.method !== 'POST') {
        return response.status(405).send('Method Not Allowed');
    }

    const { name, phone, appointmentTime, physicalTime, selectedServices } = request.body;

    if (!name || !phone || !appointmentTime || !physicalTime || !selectedServices) {
        return response.status(400).send('Missing required fields');
    }

    try {
        const userRef = admin.database().ref(`Reservations/${phone}`);

        const appointmentData = {
            appointmentTime: appointmentTime,
            physicalTime: physicalTime,
            services: selectedServices
        };

        await userRef.child('appointments').child(appointmentTime).set(appointmentData);
        await userRef.child('name').set(name);

        const formattedTime = moment(appointmentTime).format('dddd, MMMM Do YYYY [at] h:mm A');
        const servicesList = selectedServices.join(', ');

        await sendWhatsApp(phone, `مرحباً ${name}! ✅\nتم تأكيد موعدك بنجاح.\n\n📅 ${formattedTime}\n✂️ ${servicesList}\n\nنراك قريباً!`);
        await sendWhatsApp(BARBER_PHONE, `📌 موعد جديد!\n\n👤 ${name}\n📞 ${phone}\n📅 ${formattedTime}\n✂️ ${servicesList}`);

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
        const snapshot = await admin.database().ref('Reservations').child(phone1).once('value');
        const userData = snapshot.val();
        const userAppointments = userData ? userData.appointments : null;
        const userName = userData ? userData.name : null;

        if (!userAppointments) {
            return response.status(404).send('No appointments found for this phone number.');
        }

        const upcomingAppointments = [];
        const currentTime = moment();

        for (const key in userAppointments) {
            const appointmentTime = userAppointments[key].appointmentTime;

            if (moment(appointmentTime).isAfter(currentTime)) {
                upcomingAppointments.push({
                    appointmentTime,
                    services: userAppointments[key].services,
                    name: userName
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
            const userName = reservations[phone].name;
            for (const key in userAppointments) {
                const appointmentDateTime = userAppointments[key].appointmentTime;
                const appointmentDate = moment(appointmentDateTime).format('YYYY-MM-DD');

                if (appointmentDate === formattedDate) {
                    appointmentDetails.push({
                        name: userName,
                        phone: phone,
                        appointmentTime: appointmentDateTime,
                        services: userAppointments[key].services
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

        const snapshot = await userRef.once('value');
        const userAppointments = snapshot.val();

        if (!userAppointments) {
            return response.status(404).send('No appointments found for this phone number.');
        }

        let appointmentFound = false;

        for (const key in userAppointments) {
            if (userAppointments[key].appointmentTime === appointmentTime) {
                await userRef.child(key).remove();
                appointmentFound = true;
                break;
            }
        }

        if (!appointmentFound) {
            return response.status(404).send('Appointment not found.');
        }

        const formattedTime = moment(appointmentTime).format('dddd, MMMM Do YYYY [at] h:mm A');

        await sendWhatsApp(phoneNumber, `تم إلغاء موعدك بنجاح. ❌\n\n📅 ${formattedTime}\n\nنأمل أن نراك في وقت آخر!`);
        await sendWhatsApp(BARBER_PHONE, `❌ تم إلغاء موعد\n\n📞 ${phoneNumber}\n📅 ${formattedTime}`);

        response.status(200).send('Appointment canceled successfully.');
    } catch (error) {
        console.error('Error canceling appointment:', error);
        response.status(500).send('Internal Server Error');
    }
});
