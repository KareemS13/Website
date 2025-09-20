let selectedServices = [];

$(document).ready(function() {
    $('#login-btn').on('click', function() {
        window.location.href = 'admin.html';
    });

    const timeSlots = [
        '09:00 AM', '09:15 AM', '09:30 AM', '09:45 AM',
        '10:00 AM', '10:15 AM', '10:30 AM', '10:45 AM',
        '11:00 AM', '11:15 AM', '11:30 AM', '11:45 AM',
        '12:00 PM', '12:15 PM', '12:30 PM', '12:45 PM',
        '01:00 PM', '01:15 PM', '01:30 PM', '01:45 PM',
        '02:00 PM', '02:15 PM', '02:30 PM', '02:45 PM',
        '03:00 PM', '03:15 PM', '03:30 PM', '03:45 PM',
        '04:00 PM', '04:15 PM', '04:30 PM', '04:45 PM',
        '05:00 PM', '05:15 PM', '05:30 PM', '05:45 PM',
        '06:00 PM', '06:15 PM', '06:30 PM', '06:45 PM',
        '07:00 PM', '07:15 PM', '07:30 PM', '07:45 PM',
        '08:00 PM', '08:15 PM', '08:30 PM', '08:45 PM',
        '09:00 PM'
    ];

    const serviceDurations = {
        'قص شعر للرجال': 2, 
        'قص شعر للأطفال': 2, 
        'شعر و ذقن': 3, 
        'تحديد ذقن': 1,
        'حلاقة ذقن': 2, 
        'شمع و خيط': 1,
        'حناء': 1, 
        'شمع الهوبي': 1,
        'صبغة': 2, 
        'تمليس': 5, 
        'تنظيف بشرة': 8, 
        'سشوار': 1,
        'الثلاثي جبران': 1, 
        'حمام زيت': 1
    };

    function populateUpcomingDates() {
        const today = moment();
        let dateListHtml = '';
        let daysAdded = 0;

        while (daysAdded < 14) {
            const date = today.clone().add(daysAdded, 'days');
            if (date.day() !== 1) {
                dateListHtml += `<div class='date-item' data-date='${date.format()}' style='cursor:pointer;'>${date.format('dddd, MMMM Do YYYY')}</div>`;
            }
            daysAdded++;
        }

        $('#date-list').html(dateListHtml);
    }

    $('#date-list').on('click', '.date-item', function() {
        const selectedDate = $(this).data('date');
        $('#selected-date-time').val(selectedDate);
        const formattedDate = moment(selectedDate).format('YYYY-MM-DD');

        $('#time-slots').empty();
        timeSlots.forEach(slot => {
            $('#time-slots').append(new Option(slot, `${formattedDate} ${slot}`));
        });
        $('#time-slots').val("");

        $.ajax({
            url: `http://127.0.0.1:5001/barber-website-55f10/us-central1/getAppointments?date=${formattedDate}`,
            method: 'GET',
            success: function(response) {
                const reservedSlots = response.reservedSlots;
                const slotCounts = {};

                reservedSlots.forEach(reservation => {
                    const reservationTime = moment(reservation.time);
                    const services = reservation.services;

                    const totalDuration = services.reduce((total, service) => {
                        return total + (serviceDurations[service] || 1);
                    }, 0);

                    for (let i = 0; i < totalDuration; i++) {
                        const checkTime = reservationTime.clone().add(i * 15, 'minutes');
                        const key = checkTime.format('YYYY-MM-DD HH:mm');


                        if (!slotCounts[key]) {
                            slotCounts[key] = 1;
                        } else {
                            slotCounts[key]++;
                        }
                    }
                });

                $('#time-slots option').each(function() {
                    const slotValue = moment($(this).val()).format('YYYY-MM-DD HH:mm');
                    if (slotCounts[slotValue] >= 1) {
                        $(this).prop('disabled', true);
                    }
                });
                
                $('.reservation-form').addClass('active');
            },
            error: function() {
                alert('Error retrieving reservations.');
            }
        });
    });

    function fixTime(selectedTime) {
        let [dateTimePart, timeWithAmPm] = selectedTime.split(" ");
        let [datePart] = dateTimePart.split("T");
        let [timePart] = timeWithAmPm.split(" ");
        let [hour, minute] = timePart.split(":").map(Number);
        let amPm = selectedTime.slice(-2).toUpperCase();

        if (amPm === "PM" && hour !== 12) hour += 12;
        if (amPm === "AM" && hour === 12) hour = 0;

        let newTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
        return `${datePart}T${newTime}+03:00`;
    }

    $('#appointment-form').on('submit', function(e) {
        e.preventDefault();

        const name = $('#name').val();
        const areaCode = $('#area-code').val();
        const phoneNumber = $('#phone').val();
        const phone = `${areaCode} ${phoneNumber}`;

        const selectedDate = $('#selected-date-time').val();
        const selectedTime = $('#time-slots').val();
        const timeOnly = selectedTime.split(" ")[1] + " " + selectedTime.split(" ")[2];
        const variableToFeedIntoFixTimeFunction = `${selectedDate} ${timeOnly}`;
        const appointmentTime = fixTime(variableToFeedIntoFixTimeFunction);
        const physicalTime = moment().format();

        $.ajax({
            url: 'http://127.0.0.1:5001/barber-website-55f10/us-central1/reserveAppointment',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                name: name,
                phone: phone,
                appointmentTime: appointmentTime,
                physicalTime: physicalTime,
                selectedServices: selectedServices
            }),
            success: function() {
                alert('Reservation successful!');
                $('#appointment-form')[0].reset();
                $('.reservation-form').removeClass('active');
                populateUpcomingDates();
            },
            error: function() {
                alert('Error making reservation.');
            }
        });
    });

    $('#dropdown-btn').on('click', function(e) {
        e.stopPropagation();
        $('#service-dropdown').toggle();
    });

    $('#service-dropdown input[type="checkbox"]').on('change', function() {
        const serviceValue = $(this).val();
        if ($(this).is(':checked')) {
            selectedServices.push(serviceValue);
        } else {
            selectedServices = selectedServices.filter(service => service !== serviceValue);
        }
        updateDropdownButton();
    });

    function updateDropdownButton() {
        if (selectedServices.length === 0) {
            $('#dropdown-btn').text('اختر الخدمات');
        } else {
            $('#dropdown-btn').text(selectedServices.join(', '));
        }
    }

    $(document).on('click', function(e) {
        if (!$(e.target).closest('.dropdown').length) {
            $('#service-dropdown').hide();
        }
    });

    document.getElementById('close-btn').addEventListener('click', function() {
        document.querySelector('.reservation-form').classList.remove('active');
    });

    populateUpcomingDates();

    $('#cancel-btn').on('click', function() {
        $('#cancel-modal').show();
    });

    $('.close').on('click', function() {
        $('#cancel-modal').hide();
        $('#appointments-table-container').empty();
    });

    $('#submit-cancel').on('click', function() {
        const phone = $('#cancel-phone').val();
        const countryCode = $('#country-code').val();
        const phoneNumber = `${countryCode} ${phone}`;
        if (!phoneNumber) {
            alert("يرجى إدخال رقم الجوال.");
            return;
        }

        $.ajax({
            url: `http://127.0.0.1:5001/barber-website-55f10/us-central1/getAppointmentsByPhone?phone=${phoneNumber}`,
            method: 'GET',
            success: function(response) {
                displayAppointments(response.appointments);
            },
            error: function() {
                alert('لا يوجد مواعيد لهذا الرقم في المستقبل');
            }
        });
    });

    function displayAppointments(appointments) {
        let tableHtml = '<table><tr><th>الوقت</th><th>الخدمات</th><th>إلغاء</th></tr>';
        
        appointments.forEach(appointment => {
            const appointmentTime = moment(appointment.appointmentTime).format('YYYY-MM-DD HH:mm');
            const servicesList = appointment.services.join(', ');

            tableHtml += `<tr>
                <td>${appointmentTime}</td>
                <td>${servicesList}</td>
                <td><button class='cancel-appointment' data-time='${appointment.appointmentTime}'>إلغاء</button></td>
            </tr>`;
        });

        tableHtml += '</table>';
        $('#appointments-table-container').html(tableHtml);

        $('.cancel-appointment').on('click', function() {
            const appointmentTime = $(this).data('time');
            const phone = $('#cancel-phone').val();
            const countryCode = $('#country-code').val();
            const phoneNumber = `${countryCode} ${phone}`;
            $.ajax({
                url: `http://127.0.0.1:5001/barber-website-55f10/us-central1/cancelAppointment`,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ phoneNumber: phoneNumber, appointmentTime }),
                success: function() {
                    alert('تم إلغاء الموعد بنجاح.');
                    $('#appointments-table-container').empty();
                },
                error: function() {
                    alert('خطأ في إلغاء الموعد.');
                }
            });
        });
    }

    $(window).on('click', function(event) {
        if ($(event.target).is('#cancel-modal')) {
            $('#cancel-modal').hide();
        }
    });
});