// Modal Component JavaScript

let previouslyFocusedElement = null;

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        previouslyFocusedElement = document.activeElement;
        modal.style.display = 'flex';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        document.body.style.overflow = 'hidden';

        // Focus first focusable element
        const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length) focusable[0].focus();
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        if (previouslyFocusedElement) previouslyFocusedElement.focus();
    }
}

// Close modal on overlay click + Escape + Focus trap
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                overlay.style.display = 'none';
                document.body.style.overflow = '';
                if (previouslyFocusedElement) previouslyFocusedElement.focus();
            }
        });
    });

    // Escape key closes any open modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal-overlay[style*="display: flex"]');
            openModals.forEach(modal => {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            });
            if (previouslyFocusedElement) previouslyFocusedElement.focus();
        }
    });

    // Focus trap for modals
    document.addEventListener('keydown', function(e) {
        if (e.key !== 'Tab') return;
        const openModal = document.querySelector('.modal-overlay[style*="display: flex"]');
        if (!openModal) return;

        const focusable = openModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    });

    // Data-attribute event delegation for modal open/close
    document.addEventListener('click', function(e) {
        const openBtn = e.target.closest('[data-modal-open]');
        if (openBtn) {
            openModal(openBtn.dataset.modalOpen);
            return;
        }
        const closeBtn = e.target.closest('[data-modal-close]');
        if (closeBtn) {
            closeModal(closeBtn.dataset.modalClose);
        }
    });
});
