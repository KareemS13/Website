document.addEventListener('DOMContentLoaded', () => {
    const BARBER_NUMBER = '972599298767';

    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const row = btn.closest('tr');
            const productName = row.querySelector('td:first-child').textContent.trim();
            const message = `أود الاستفسار عن هذا المنتج: ${productName} 🛒`;
            const url = `https://wa.me/${BARBER_NUMBER}?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
        });
    });
});
