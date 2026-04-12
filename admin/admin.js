import { database, ref, get } from '../firebaseconfig.js';
function openModal(id) {
    $(id).addClass('active');
}

function closeModal(id) {
    const content = $(id).find('.modal-content');
    content.addClass('closing');
    $(id).css({ opacity: '', transition: 'opacity 0.3s ease' });
    setTimeout(() => {
        $(id).removeClass('active');
        content.removeClass('closing');
    }, 300);
}

$(document).ready(function() {
    // Show login modal on page load
    openModal('#loginModal');

    // Close the modal when the user clicks on the close button
    $('.close').on('click', function() {
        closeModal('#loginModal');
    });

    // Handle login form submission
    $('#login-form').on('submit', function(e) {
        e.preventDefault();

        const username = $('#username').val();
        const password = $('#password').val();

        if (username === 'admin' && password === 'password') {
            closeModal('#loginModal');
            displayAppointments();
        } else {
            alert('Invalid username or password.');
        }
    });

    const today = moment().format('YYYY-MM-DD');
    $('#date-input').val(today);
    //displayAppointments(today);
    $('#date-input').on('change', function() {
        const selectedDate = $(this).val();
        displayAppointments(selectedDate);
    });
    function displayAppointments(date) {
        if (!date) {
            date = $('#date-input').val(); // Use the current date input if no date is provided
        }
        $.ajax({
            url: `https://us-central1-barber-website-55f10.cloudfunctions.net/getInfo?date=${date}`,
            method: 'GET',
            success: function(response) {
                const appointments = response.appointmentDetails;
                let appointmentHtml = '<table><thead><tr><th>Time</th><th>Name</th><th>Phone</th><th>Services</th><th>Action</th></tr></thead><tbody>';
                appointments.forEach(appointment => {
                    const appointmentTime = appointment.appointmentTime.split('T')[1].substring(0, 5);
                    const formattedTime = moment(appointmentTime, 'HH:mm').format('hh:mm A');
                    const phoneLink = `tel:${appointment.phone.replace(/\s/g, '')}`;
                    
                    appointmentHtml += `
                        <tr>
                            <td>${formattedTime}</td>
                            <td>${appointment.name}</td>
                            <td><a href="${phoneLink}">${appointment.phone}</a></td>
                            <td>${appointment.services.join(', ')}</td> <!-- Add services here -->
                            <td><button class="cancel-btn" data-phone="${appointment.phone}" data-time="${appointment.appointmentTime}">Cancel</button></td>
                        </tr>`;
                });
                appointmentHtml += '</tbody></table>';
                $('#appointments-list').html(appointmentHtml);
                $('#appointments').show();
    
                // Bind click event for cancel buttons
                $('.cancel-btn').on('click', function() {
                    const phoneNumber = $(this).data('phone');
                    const appointmentTime = $(this).data('time');
                    cancelAppointment(phoneNumber, appointmentTime);
                });
            },
            error: function() {
                alert('Error retrieving appointments.');
            }
        });
    }
    
    
    // Function to cancel an appointment
    function cancelAppointment(phoneNumber, appointmentTime) {
        $.ajax({
            url: `https://us-central1-barber-website-55f10.cloudfunctions.net/cancelAppointment`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ phoneNumber, appointmentTime }), // Send phone number and appointment time
            success: function() {
                alert('تم إلغاء الموعد بنجاح.');
                const currentDate = $('#date-input').val(); // Get the current date from the input
                displayAppointments(currentDate); 
            },
            error: function() {
                alert('خطأ في إلغاء الموعد.');
            }
        });
    }

// Trying to let him make a reservation. EZ
    // Show the reservation modal when the Add Reservation button is clicked
    $('#add-reservation-btn').on('click', function() {
        openModal('#reservation-modal');
        populateTimeSlots();
    });

    $('.close-reservation').on('click', function() {
        closeModal('#reservation-modal');
        resetReservationForm();
    });

    // Function to reset reservation form fields
    function resetReservationForm() {
        $('#reservation-date').val(''); // Reset date input
        $('#customer-name').val(''); // Reset name input
        $('#customer-phone').val(''); // Reset phone input
        $('#reservation-time').empty(); // Clear time slots
        $('#service-dropdown input[type=checkbox]').prop('checked', false); // Reset services selection
    }


    // Populate time slots based on selected date
    $('#reservation-date').on('change', function() {
        populateTimeSlots(); // Call this function when date changes
    });

    function populateTimeSlots() {
        const selectedDate = $('#reservation-date').val();

        if (!selectedDate) {
            $('#reservation-time').empty(); // Clear if no date is selected
            return;
        }
        const serviceDurations = {
            'قص شعر للرجال': 2, 'قص شعر للأطفال': 2, 'شعر و ذقن': 3, 'تحديد ذقن': 1,
            'حلاقة ذقن': 2, 'شمع و خيط': 1, 'حناء': 1, 'شمع الهوبي': 1,
            'صبغة': 2, 'تمليس': 5, 'تنظيف بشرة': 8, 'سشوار': 1,
            'الثلاثي جبران': 1, 'حمام زيت': 1
        };
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

        $('#reservation-time').empty(); // Clear existing options

        // Fetch existing appointments and disable time slots
        $.ajax({
            url: `https://us-central1-barber-website-55f10.cloudfunctions.net/getAppointments?date=${selectedDate}`,
            method: 'GET',
            success: function(response) {
                const reservedSlots = response.reservedSlots;
                const reservationCounts = {};

                // Count reservations for each 15-minute interval
                reservedSlots.forEach(reservation => {
                    const reservationTime = moment(reservation.time);
                    const services = reservation.services;
                    
                    const totalDuration = services.reduce((total, service) => {
                        return total + (serviceDurations[service] || 1);
                    }, 0);

                    for (let i = 0; i < totalDuration; i++) {
                        const checkTime = reservationTime.clone().add(i * 15, 'minutes').format();
                        reservationCounts[checkTime] = (reservationCounts[checkTime] || 0) + 1;
                    }
                });

                // Create and append time slot options, disabling those with >= 2 reservations
                timeSlots.forEach(slot => {
                    const slotTime = moment(`${selectedDate} ${slot}`, 'YYYY-MM-DD hh:mm A').format();
                    let slotValue2 = slotTime.slice(0, -6); // Remove timezone offset
                    let slotValue = slotValue2 + "+02:00";
                    console.log(slotValue);
                    const slotMoment = moment(slotValue).format(); // Format as string

                    const option = new Option(slot, slot); // Use just the time slot as the value
                    if (reservationCounts[slotMoment] >= 2) {
                        option.disabled = true;
                    }
                    $('#reservation-time').append(option);
                });
            },
            error: function() {
                alert('Error retrieving reservations.');
            }
        });
    }
    document.getElementById('service-dropdown-btn').addEventListener('click', function(e) {
        e.preventDefault();
        var dropdown = document.getElementById('service-dropdown');
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });
    
    // Handle reservation form submission
    $('#submit-reservation').on('click', function(e) {
        e.preventDefault(); // Prevent default form submission

        const date = $('#reservation-date').val();
        const time = $('#reservation-time').val();
        const name = $('#customer-name').val();
        const areaCode = $('#area-code').val(); // Assuming there's an input/select for this
        const phoneNumber = $('#customer-phone').val();
        const phone = `${areaCode} ${phoneNumber}`;

        // Collect selected services
        const selectedServices = [];
        $('#service-dropdown input[type=checkbox]:checked').each(function() {
            selectedServices.push($(this).val());
        });

        if (!date || !time || !name || !phone || selectedServices.length === 0) {
            alert('Please fill all fields and select at least one service.');
            return;
        }

        const appointmentTime1 = moment(`${date} ${time}`, 'YYYY-MM-DD hh:mm A').format();
        appointmentTime = appointmentTime1.slice(0,-6)+"+02:00"
        $.ajax({
            url: `https://us-central1-barber-website-55f10.cloudfunctions.net/reserveAppointment`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                name,
                phone,
                appointmentTime,
                physicalTime: moment().format(), // Current timestamp as physical time
                selectedServices
            }),
            success: function(response) {
                alert('Reservation added successfully!');
                resetReservationForm(); // Reset form after successful reservation
                const currentDate = $('#date-input').val(); // Get the current date from the input
                displayAppointments(currentDate);
            },
            error: function() {
                alert('Error adding reservation.');
            }
        });
    });


    // Close modal when clicking outside of it
    $(window).on('click', function(event) {
        if ($(event.target).is('#reservation-modal')) {
            closeModal('#reservation-modal');
            resetReservationForm();
        }
        if ($(event.target).is('#loginModal')) {
            closeModal('#loginModal');
        }
    });

    
    // Handle name input for autocomplete
    $('#customer-name').on('input', function() {
        const inputName = $(this).val().trim();
        
        if (inputName.length < 2) {
            $('#name-suggestions').empty().hide(); // Hide suggestions if input is too short
            return;
        }
        const reservationsRef = ref(database, 'Reservations');
        // Query Firebase to find matching names
        get(reservationsRef).then((snapshot) => {
            if (snapshot.exists()) {
              let matches = [];
              snapshot.forEach((childSnapshot) => {
                const phone = childSnapshot.key; // Phone number
                const name = childSnapshot.child('name').val(); // Stored name
        
                if (name && name.includes(inputName)) {
                  matches.push({ name, phone });
                }
              });
              showSuggestions(matches);
            } else {
              // No data found
              $('#name-suggestions').empty().hide();
            }
          }).catch((error) => {
            console.error("Error reading data:", error);
          });
        });

    // Function to display name suggestions
    function showSuggestions(matches) {
        const suggestionBox = $('#name-suggestions');
        suggestionBox.empty().show();
    
        if (matches.length === 0) {
            suggestionBox.hide();
            console.log('no names here');
            return;
        }
    
        matches.forEach(match => {
            const suggestionItem = $('<div>').addClass('suggestion-item').text(match.name);
            suggestionItem.on('click', function() {
                $('#customer-name').val(match.name); // Fill in name
                
                // Split the phone number into area code and main number
                const fullPhone = match.phone.replace(/\s/g, ''); // Remove any spaces
                const areaCode = fullPhone.slice(0, 4); // Get the first 4 digits
                const mainNumber = fullPhone.slice(4); // Get the rest of the number
    
                $('#area-code').val(areaCode); // Set the area code
                $('#phone').val(mainNumber); // Set the main phone number
                
                suggestionBox.empty().hide();
            });
            suggestionBox.append(suggestionItem);
        });
    }
    

    // Hide suggestions when clicking outside
    $(document).on('click', function(event) {
        if (!$(event.target).closest('#customer-name, #name-suggestions').length) {
            $('#name-suggestions').hide();
        }
    });

});
