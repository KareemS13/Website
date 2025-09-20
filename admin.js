import { database, ref, get } from './firebaseconfig.js';

$(document).ready(function () {
    // Initialize lastAppointmentTimes for tracking new appointments
    let lastAppointmentTimes = [];

    // Show login modal on page load
    $('#loginModal').show();

    // Close login modal
    $('.close').on('click', function () {
        $('#loginModal').hide();
    });

    // Handle login form
    $('#login-form').on('submit', function (e) {
        e.preventDefault();
        const username = $('#username').val();
        const password = $('#password').val();
    
        if (username === 'admin' && password === 'password') {
            alert('Login successful!');
            $('#loginModal').hide();
            displayAppointments();
        
            // 🔁 Refresh every 30s min if appointments section is visible
            setInterval(() => {
                if ($('#appointments').is(':visible')) {
                    displayAppointments($('#date-input').val());
                }
            }, 30000);
        } 
    });

    // Default date input to today
    const today = moment().format('YYYY-MM-DD');
    $('#date-input').val(today);

    $('#date-input').on('change', function () {
        const selectedDate = $(this).val();
        displayAppointments(selectedDate);
    });

    function displayAppointments(date) {
        if (!date) date = $('#date-input').val();

        $.ajax({
            url: `https://us-central1-barber-website-55f10.cloudfunctions.net/getInfo?date=${date}`,
            method: 'GET',
            success: function (response) {
                const appointments = response.appointmentDetails;
                let html = `
                    <table>
                        <thead><tr><th>Time</th><th>Name</th><th>Phone</th><th>Services</th><th>Action</th></tr></thead>
                        <tbody>
                `;

                const currentTimes = appointments.map(app => app.appointmentTime);

                // 🔔 Check for new appointments (only after initial load)
                if (lastAppointmentTimes.length > 0) {
                    const newAppointments = currentTimes.filter(t => !lastAppointmentTimes.includes(t));
                    if (newAppointments.length > 0) {
                        showNewAppointmentNotification(newAppointments.length);
                    }
                }
                
                lastAppointmentTimes = currentTimes;
                
                // Build HTML
                appointments.forEach(app => {
                    const formattedTime = moment(app.appointmentTime.split('T')[1].substring(0, 5), 'HH:mm').format('hh:mm A');
                
                    const phoneLink = `tel:${app.phone.replace(/\s/g, '')}`;

                    html += `
                        <tr>
                            <td>${formattedTime}</td>
                            <td>${app.name}</td>
                            <td><a href="${phoneLink}">${app.phone}</a></td>
                            <td>${app.services.join(', ')}</td>
                            <td><button class="cancel-btn" data-phone="${app.phone}" data-time="${app.appointmentTime}">Cancel</button></td>
                        </tr>
                    `;
                });

                html += '</tbody></table>';
                $('#appointments-list').html(html);
                $('#appointments').show();

                $('.cancel-btn').on('click', function () {
                    const phone = $(this).data('phone');
                    const time = $(this).data('time');
                    cancelAppointment(phone, time);
                });
            },
            error: function () {
                alert('Error retrieving appointments.');
            }
        });
    }

    function cancelAppointment(phoneNumber, appointmentTime) {
        $.ajax({
            url: `https://us-central1-barber-website-55f10.cloudfunctions.net/cancelAppointment`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ phoneNumber, appointmentTime }),
            success: function () {
                alert('تم إلغاء الموعد بنجاح.');
                displayAppointments($('#date-input').val());
            },
            error: function () {
                alert('خطأ في إلغاء الموعد.');
            }
        });
    }

    $('#add-reservation-btn').on('click', function () {
        $('#reservation-modal').show();
        populateTimeSlots();
    });

    $('.close-reservation').on('click', function () {
        $('#reservation-modal').hide();
        resetReservationForm();
    });

    function resetReservationForm() {
        $('#reservation-date').val('');
        $('#customer-name').val('');
        $('#customer-phone').val('');
        $('#reservation-time').empty();
        $('#service-dropdown input[type=checkbox]').prop('checked', false);
    }

    $('#reservation-date').on('change', populateTimeSlots);

    function populateTimeSlots() {
        const selectedDate = $('#reservation-date').val();
        if (!selectedDate) {
            $('#reservation-time').empty();
            return;
        }

        const serviceDurations = {
            'قص شعر للرجال': 2, 'قص شعر للأطفال': 2, 'شعر و ذقن': 3, 'تحديد ذقن': 1,
            'حلاقة ذقن': 2, 'شمع و خيط': 1, 'حناء': 1, 'شمع الهوبي': 1,
            'صبغة': 2, 'تمليس': 5, 'تنظيف بشرة': 8, 'سشوار': 1,
            'الثلاثي جبران': 1, 'حمام زيت': 1
        };

        const timeSlots = [...Array(49)].map((_, i) => moment('09:00 AM', 'hh:mm A').add(i * 15, 'minutes').format('hh:mm A'));

        $('#reservation-time').empty();

        $.ajax({
            url: `https://us-central1-barber-website-55f10.cloudfunctions.net/getAppointments?date=${selectedDate}`,
            method: 'GET',
            success: function (response) {
                const reservedSlots = response.reservedSlots;
                const reservationCounts = {};

                reservedSlots.forEach(reservation => {
                    const baseTime = moment(reservation.time);
                    const duration = reservation.services.reduce((sum, s) => sum + (serviceDurations[s] || 1), 0);

                    for (let i = 0; i < duration; i++) {
                        const slot = baseTime.clone().add(i * 15, 'minutes').format();
                        reservationCounts[slot] = (reservationCounts[slot] || 0) + 1;
                    }
                });

                timeSlots.forEach(slot => {
                    const fullTime = moment(`${selectedDate} ${slot}`, 'YYYY-MM-DD hh:mm A').format();
                    const formattedTime = fullTime.slice(0, -6) + '+02:00';

                    const option = new Option(slot, slot);
                    if (reservationCounts[formattedTime] >= 2) {
                        option.disabled = true;
                    }
                    $('#reservation-time').append(option);
                });
            },
            error: function () {
                alert('Error retrieving reservations.');
            }
        });
    }

    $('#service-dropdown-btn').on('click', function (e) {
        e.preventDefault();
        $('#service-dropdown').toggle();
    });

    $('#submit-reservation').on('click', function (e) {
        e.preventDefault();

        const date = $('#reservation-date').val();
        const time = $('#reservation-time').val();
        const name = $('#customer-name').val();
        const areaCode = $('#area-code').val();
        const phoneNumber = $('#customer-phone').val();
        const phone = `${areaCode} ${phoneNumber}`;

        const selectedServices = [];
        $('#service-dropdown input[type=checkbox]:checked').each(function () {
            selectedServices.push($(this).val());
        });

        if (!date || !time || !name || !phone || selectedServices.length === 0) {
            alert('Please fill all fields and select at least one service.');
            return;
        }

        const appointmentTime = moment(`${date} ${time}`, 'YYYY-MM-DD hh:mm A').format().slice(0, -6) + '+02:00';

        $.ajax({
            url: `https://us-central1-barber-website-55f10.cloudfunctions.net/reserveAppointment`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                name,
                phone,
                appointmentTime,
                physicalTime: moment().format(),
                selectedServices
            }),
            success: function () {
                alert('Reservation added successfully!');
                resetReservationForm();

                const newRow = `
                    <tr>
                        <td>${time}</td>
                        <td>${name}</td>
                        <td><a href="tel:${phone}">${phone}</a></td>
                        <td>${selectedServices.join(', ')}</td>
                        <td><button class="cancel-btn" data-phone="${phone}" data-time="${appointmentTime}">Cancel</button></td>
                    </tr>
                `;
                $('#appointments-list tbody').append(newRow);

                $('.cancel-btn').on('click', function () {
                    const phone = $(this).data('phone');
                    const time = $(this).data('time');
                    cancelAppointment(phone, time);
                });
            },
            error: function () {
                alert('Error adding reservation.');
            }
        });
    });

    $(window).on('click', function (e) {
        if ($(e.target).is('#reservation-modal')) {
            $('#reservation-modal').hide();
        }
    });

    $('#customer-name').on('input', function () {
        const input = $(this).val().trim();
        if (input.length < 2) {
            $('#name-suggestions').empty().hide();
            return;
        }

        const reservationsRef = ref(database, 'Reservations');

        get(reservationsRef).then(snapshot => {
            if (snapshot.exists()) {
                const matches = [];
                snapshot.forEach(child => {
                    const name = child.child('name').val();
                    const phone = child.key;
                    if (name && name.includes(input)) {
                        matches.push({ name, phone });
                    }
                });
                showSuggestions(matches);
            } else {
                $('#name-suggestions').empty().hide();
            }
        }).catch(err => {
            console.error("Error reading data:", err);
        });
    });

    function showSuggestions(matches) {
        const box = $('#name-suggestions');
        box.empty().show();
    
        if (matches.length === 0) {
            box.hide();
            return;
        }
    
        matches.forEach(match => {
            const container = $('<div>').addClass('suggestion-item');
    
            const nameDiv = $('<span>').text(match.name).css('cursor', 'pointer');
            const deleteBtn = $('<span>').text('🗑️').css({ float: 'right', cursor: 'pointer', color: 'red' });
    
            nameDiv.on('click', function () {
                $('#customer-name').val(match.name);
                const fullPhone = match.phone.replace(/\s/g, '');
                const areaCode = fullPhone.slice(0, 4);
                const number = fullPhone.slice(4);
    
                $('#area-code').val(areaCode);
                $('#customer-phone').val(number);
                box.empty().hide();
            });
    
            deleteBtn.on('click', function () {
                if (confirm(`Delete saved name "${match.name}"?`)) {
                    const matchRef = ref(database, `Reservations/${match.phone}`);
                    matchRef.remove().then(() => {
                        alert('Name deleted.');
                        container.remove();
                    }).catch(err => {
                        console.error('Failed to delete:', err);
                        alert('Error deleting name.');
                    });
                }
            });
    
            container.append(nameDiv, deleteBtn);
            box.append(container);
        });
    }

    // Placeholder for showNewAppointmentNotification (implement as needed)
    function showNewAppointmentNotification(count) {
        alert(`${count} new appointment(s) detected!`);
    }
});

