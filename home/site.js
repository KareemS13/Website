document.addEventListener('DOMContentLoaded', () => {
    const preloader = document.getElementById('preloader');
    const preloaderLogo = document.querySelector('.preloader-logo');
    const mainContent = document.getElementById('main-content');
    // Step 1: Fade in the preloader logo (handled by CSS animation)

    // Step 2: Start shrinking and moving the logo after fade-in
    setTimeout(() => {
        preloaderLogo.style.animation = 'logoTransition 1s ease forwards';
    }, 1000); // Matches the fadeInLogo duration

    // Step 3: Hide preloader and fade in main content after logo transition
    setTimeout(() => {
        preloader.style.opacity = '0'; // Start fading out preloader
    }, 1800); // 1000ms (fade-in) + 1000ms (logo transition)

    setTimeout(() => {
        preloader.style.display = 'none'; // Remove preloader
        mainContent.classList.add('fade-in'); // Fade in main content
        document.body.classList.add('loaded'); // Restore scrolling
        document.querySelector('.site-nav').style.opacity = '1'; // Show nav
        // Move preloader-logo to top-section and match logo-image
        preloaderLogo.style.position = 'static';
        preloaderLogo.style.transform = 'none';
        preloaderLogo.style.width = '100px';
        preloaderLogo.style.height = 'auto';
        preloaderLogo.style.top = 'auto';
        preloaderLogo.style.left = 'auto';
        document.querySelector('.logo').appendChild(preloaderLogo); // Move to top-section
        preloaderLogo.style.animation = 'none'; // Stop animation
    }, 1900); // 2000ms + 800ms (preloader fade-out transition)



// Scroll reveal animation
window.addEventListener('scroll', () => {
    const reveals = document.querySelectorAll('.scroll-reveal');
    reveals.forEach((reveal) => {
        const windowHeight = window.innerHeight;
        const elementTop = reveal.getBoundingClientRect().top;
        const revealPoint = 150;

        if (elementTop < windowHeight - revealPoint) {
            reveal.classList.add('revealed');
        }
    });
});

// Slider JavaScript
let currentIndex = 0;
const images = document.querySelectorAll('.slider-image');
const prevButton = document.querySelector('.prev');
const nextButton = document.querySelector('.next');
const totalImages = images.length; // Define total images for automatic slider
let autoSlideInterval;

function showImage(index) {
    images.forEach((image, i) => {
        image.classList.remove('active'); // Remove active class from all images
        if (i === index) {
            image.classList.add('active'); // Add active class to the current image
        }
    });
}

function nextImage() {
    currentIndex = (currentIndex + 1) % totalImages; // Cycle to the next image
    showImage(currentIndex);
}

function prevImage() {
    currentIndex = (currentIndex - 1 + totalImages) % totalImages; // Cycle to the previous image
    showImage(currentIndex);
}

function startAutoSlide() {
    autoSlideInterval = setInterval(() => {
        nextImage(); // Automatically move to the next image
    }, 2000); // Change image every 2 seconds
}

function stopAutoSlide() {
    clearInterval(autoSlideInterval); // Stop the auto-slide
}

// Initialize the slider by showing the first image
showImage(currentIndex);

// Event listeners for next and previous buttons
nextButton.addEventListener('click', () => {
    nextImage();
    stopAutoSlide(); // Stop auto-slide when user clicks manually
    startAutoSlide(); // Restart auto-slide after interaction
});
prevButton.addEventListener('click', () => {
    prevImage();
    stopAutoSlide(); // Stop auto-slide when user clicks manually
    startAutoSlide(); // Restart auto-slide after interaction
});

// Start the automatic slider on page load
startAutoSlide();

// Initialize particles.js for background animation
particlesJS('particle-background', {
    "particles": {
        "number": {
            "value": 80,
            "density": {
                "enable": true,
                "value_area": 800
            }
        },
        "color": {
            "value": "#ff4e50"
        },
        "shape": {
            "type": "circle",
            "stroke": {
                "width": 0,
                "color": "#000000"
            }
        },
        "opacity": {
            "value": 0.5,
            "random": true,
            "anim": {
                "enable": true,
                "speed": 0.25,
                "opacity_min": 0.1
            }
        },
        "size": {
            "value": 3,
            "random": true,
            "anim": {
                "enable": true,
                "speed": 3,
                "size_min": 0.1
            }
        },
        "line_linked": {
            "enable": true,
            "distance": 150,
            "color": "#ff4e50",
            "opacity": 0.4,
            "width": 1
        },
        "move": {
            "enable": true,
            "speed": 6,
            "direction": "none",
            "random": false,
            "straight": false,
            "out_mode": "out",
            "bounce": false,
            "attract": {
                "enable": false,
                "rotateX": 600,
                "rotateY": 600
            }
        }
    },
    "interactivity": {
        "detect_on": "window",
        "events": {
            "onhover": {
                "enable": true,
                "mode": "repulse"
            },
            "onclick": {
                "enable": true,
                "mode": "push"
            }
        }
    },
    "retina_detect": true
 }); 
});
