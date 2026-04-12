document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('buy-modal');
    const closeBtn = modal.querySelector('.close');
    const buyButtons = document.querySelectorAll('.buy-btn'); // Assuming class name
  
    // Open modal on Buy button click
    buyButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        modal.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' }); // optional: scrolls to top
      });
    });
  
    // Close modal when 'X' is clicked
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  
    // Close modal when clicking outside modal content
    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  });
