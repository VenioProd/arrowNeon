// ============================================
// ADDITIONS JS - New features
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initScrollToTop();
    initScrollReveal();
    initThemeToggle();
    initCounterAnimation();
});

// ---- Scroll to top button ----
function initScrollToTop() {
    const btn = document.getElementById('scrollTopBtn');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    }, { passive: true });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ---- Scroll reveal animations (Intersection Observer) ----
function initScrollReveal() {
    const elements = document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right');
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Stagger animation for grid items
                const delay = entry.target.dataset.delay || 0;
                setTimeout(() => {
                    entry.target.classList.add('revealed');
                }, delay);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    elements.forEach(el => observer.observe(el));
}

// ---- Theme toggle (dark/light) ----
function initThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;

    // Restore saved theme
    const savedTheme = localStorage.getItem('arrow-theme');
    if (savedTheme === 'light') {
        document.documentElement.classList.add('light-theme');
        toggle.textContent = '🌙';
    }

    toggle.addEventListener('click', () => {
        const isLight = document.documentElement.classList.toggle('light-theme');
        toggle.textContent = isLight ? '🌙' : '☀️';
        localStorage.setItem('arrow-theme', isLight ? 'light' : 'dark');
    });
}

// ---- Counter animation for HUD stats ----
function initCounterAnimation() {
    const counters = document.querySelectorAll('.stat-value[data-count]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(el => observer.observe(el));
}

function animateCounter(element) {
    const target = element.dataset.count;
    const suffix = element.dataset.suffix || '';
    const isNumber = !isNaN(parseFloat(target));

    if (!isNumber) {
        // For non-numeric values like "24/7" or "∞"
        element.style.opacity = '0';
        setTimeout(() => {
            element.style.transition = 'opacity 0.5s';
            element.style.opacity = '1';
            element.classList.add('counting');
        }, 300);
        return;
    }

    const end = parseFloat(target);
    const duration = 1500;
    const startTime = performance.now();
    const hasDecimal = target.includes('.');

    element.textContent = '0' + suffix;

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = eased * end;

        if (hasDecimal) {
            element.textContent = current.toFixed(1) + suffix;
        } else {
            element.textContent = Math.floor(current) + suffix;
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = target + suffix;
            element.classList.add('counting');
        }
    }

    requestAnimationFrame(update);
}
