/* =========================================================================
   Omar M. Fawzy — Portfolio
   Vanilla JS, no dependencies.

   Sections:
     1.  Environment flags (reduced motion / coarse pointer)
     2.  Navigation
     3.  Smooth scrolling + focus management
     4.  Single rAF-throttled scroll handler (navbar, progress, back-to-top, parallax)
     5.  Reveal + typing on scroll
     6.  Start screen
     7.  Contact form (async, stays on the page)
     8.  Notifications
     9.  Gamification (XP, coins, streak)
     10. Ambient effects (starfield, skill stars, cursor trail, matrix rain)
   ========================================================================= */

(function () {
    'use strict';

    /* ---------------------------------------------------------------------
       1. Environment flags
       ------------------------------------------------------------------ */
    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarsePointer = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    const smallScreen = window.matchMedia('(max-width: 768px)').matches;

    let reduceMotion = reduceMotionQuery.matches;
    const onMotionChange = (e) => { reduceMotion = e.matches; };
    if (reduceMotionQuery.addEventListener) {
        reduceMotionQuery.addEventListener('change', onMotionChange);
    } else if (reduceMotionQuery.addListener) {
        reduceMotionQuery.addListener(onMotionChange);
    }

    // Ambient canvas effects are decorative: skip them when the visitor asked
    // for less motion, and on small screens where they cost battery for nothing.
    const allowAmbient = () => !reduceMotion && !smallScreen;

    const $ = (sel, root) => (root || document).querySelector(sel);
    const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

    /* ---------------------------------------------------------------------
       2. Navigation
       ------------------------------------------------------------------ */
    const navToggle = $('.nav-toggle') || $('.hamburger');
    const navMenu = $('.nav-menu');

    function setNav(open) {
        if (!navToggle || !navMenu) return;
        navToggle.classList.toggle('active', open);
        navMenu.classList.toggle('active', open);
        navToggle.setAttribute('aria-expanded', String(open));
        navToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    }

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            setNav(!navMenu.classList.contains('active'));
        });

        $$('.nav-link').forEach((link) => link.addEventListener('click', () => setNav(false)));

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                setNav(false);
                navToggle.focus();
            }
        });

        document.addEventListener('click', (e) => {
            if (!navMenu.classList.contains('active')) return;
            if (navMenu.contains(e.target) || navToggle.contains(e.target)) return;
            setNav(false);
        });
    }

    /* ---------------------------------------------------------------------
       3. Smooth scrolling + focus management
       Moving the viewport is not enough: keyboard and screen-reader users need
       focus to follow, otherwise the next Tab jumps back to the top of the page.
       ------------------------------------------------------------------ */
    $$('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (!href || href === '#') return;

            const target = document.querySelector(href);
            if (!target) return;

            e.preventDefault();
            target.scrollIntoView({
                behavior: reduceMotion ? 'auto' : 'smooth',
                block: 'start'
            });

            const hadTabIndex = target.hasAttribute('tabindex');
            if (!hadTabIndex) target.setAttribute('tabindex', '-1');
            target.focus({ preventScroll: true });
            if (!hadTabIndex) {
                target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
            }

            if (history.replaceState) history.replaceState(null, '', href);
        });
    });

    /* ---------------------------------------------------------------------
       4. One rAF-throttled scroll handler
       The previous version registered four separate scroll listeners, each
       writing to style on every event. This batches them into one frame.
       ------------------------------------------------------------------ */
    const navbar = $('.navbar');
    const progressBar = $('#progressBar');
    const backToTopBtn = $('#backToTop');
    const hero = $('.hero');
    const allowParallax = !coarsePointer && !smallScreen;

    let scrollQueued = false;

    function onScrollFrame() {
        scrollQueued = false;
        const y = window.pageYOffset || document.documentElement.scrollTop || 0;

        if (navbar) {
            const scrolled = y > 100;
            navbar.style.background = scrolled ? 'rgba(7, 11, 22, 0.92)' : 'rgba(7, 11, 22, 0.6)';
            navbar.style.boxShadow = scrolled ? '0 6px 24px rgba(0, 0, 0, 0.35)' : 'none';
        }

        if (progressBar) {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            progressBar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
        }

        if (backToTopBtn) backToTopBtn.classList.toggle('show', y > 300);

        if (hero && allowParallax && !reduceMotion) {
            hero.style.transform = 'translate3d(0,' + (y * -0.25) + 'px,0)';
        }
    }

    function requestScrollFrame() {
        if (scrollQueued) return;
        scrollQueued = true;
        requestAnimationFrame(onScrollFrame);
    }

    window.addEventListener('scroll', requestScrollFrame, { passive: true });
    window.addEventListener('resize', requestScrollFrame, { passive: true });
    requestScrollFrame();

    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        });
    }

    /* ---------------------------------------------------------------------
       5. Reveal + typing on scroll
       ------------------------------------------------------------------ */
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                sectionObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    $$('section').forEach((section) => sectionObserver.observe(section));

    const revealables = $$('.skill-category, .education-item, .project-card, .timeline-item');
    revealables.forEach((el) => el.classList.add('will-reveal'));

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target);
        });
        // A low threshold plus a bottom margin: an element taller than the
        // viewport can never reach a high visible ratio, and would stay hidden.
    }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });

    revealables.forEach((el) => revealObserver.observe(el));

    // Typewriter effect for elements marked with data-type-on-scroll.
    const scrollTypeTargets = $$('[data-type-on-scroll]');

    if (reduceMotion) {
        // Nothing to hide — leave the text exactly as authored.
        scrollTypeTargets.forEach((el) => { el.dataset.typed = '1'; });
    } else {
        scrollTypeTargets.forEach((el) => {
            if (!el.dataset.originalText) {
                el.dataset.originalText = el.textContent || '';
                el.textContent = '';
            }
        });

        const typeInElement = (el, text, speedMs) => {
            if (el.dataset.typed === '1') return;
            let i = 0;
            const timer = setInterval(() => {
                el.textContent = text.slice(0, ++i);
                if (i >= text.length) {
                    clearInterval(timer);
                    el.dataset.typed = '1';
                }
            }, speedMs);
        };

        const typingObserver = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (!e.isIntersecting) return;
                const el = e.target;
                typeInElement(el, el.dataset.originalText || '', Number(el.getAttribute('data-type-on-scroll')) || 18);
                typingObserver.unobserve(el);
            });
        }, { threshold: 0.2 });

        scrollTypeTargets.forEach((el) => typingObserver.observe(el));

        // Safety net: if an element never scrolls into view (or the observer is
        // starved), restore its text so content is never permanently blank.
        window.addEventListener('load', () => {
            setTimeout(() => {
                scrollTypeTargets.forEach((el) => {
                    if (el.dataset.typed !== '1' && !el.textContent) {
                        el.textContent = el.dataset.originalText || '';
                    }
                });
            }, 8000);
        });
    }

    /* ---------------------------------------------------------------------
       6. Start screen
       ------------------------------------------------------------------ */
    const startScreen = $('#startScreen');
    const matrixCanvas = $('#matrixRain');
    let started = false;

    function beginExperience(withEffects) {
        if (started) return;
        started = true;

        const typeTargets = $$('[data-type-on-start="true"]');
        const originals = typeTargets.map((el) => el.textContent);

        const finish = () => {
            document.body.classList.remove('prestart', 'starting');
            document.body.classList.add('started');
            if (startScreen) startScreen.setAttribute('hidden', '');

            // Move focus into the page so keyboard users land somewhere sensible.
            const heading = $('#heroTitle');
            if (heading) {
                heading.setAttribute('tabindex', '-1');
                heading.focus({ preventScroll: true });
            }

            if (!withEffects) return;

            let idx = 0;
            (function typeNext() {
                if (idx >= typeTargets.length) return;
                const el = typeTargets[idx];
                const text = originals[idx] || '';
                let i = 0;
                // Fixed and fast: a per-length speed made long strings crawl,
                // leaving real content blank for seconds after the intro.
                const speed = 12;
                const timer = setInterval(() => {
                    el.textContent = text.slice(0, i++);
                    if (i > text.length) {
                        clearInterval(timer);
                        el.textContent = text;
                        idx++;
                        setTimeout(typeNext, 100);
                    }
                }, speed);
            })();
        };

        if (withEffects) {
            document.body.classList.add('starting');
            typeTargets.forEach((el) => { el.textContent = ''; });
            if (matrixCanvas) runMatrixRain(matrixCanvas, 900);
            setTimeout(finish, 850);
        } else {
            finish();
        }
    }

    if (startScreen && document.body.classList.contains('prestart')) {
        const withEffects = !reduceMotion;

        // If the visitor prefers reduced motion, don't make them sit through an
        // intro at all — drop them straight into the content.
        if (reduceMotion) {
            beginExperience(false);
        } else {
            const startNow = () => beginExperience(true);

            const startButton = $('#startButton');
            const startSkip = $('#startSkip');
            if (startButton) startButton.addEventListener('click', startNow);
            if (startSkip) {
                startSkip.addEventListener('click', (e) => {
                    e.stopPropagation();
                    beginExperience(false);
                });
            }

            window.addEventListener('keydown', startNow, { once: true });
            startScreen.addEventListener('mousedown', startNow, { once: true });
            startScreen.addEventListener('touchstart', startNow, { once: true, passive: true });

            // Never strand a visitor on the start screen.
            setTimeout(() => beginExperience(false), 15000);

            if (startButton) {
                window.addEventListener('load', () => startButton.focus({ preventScroll: true }));
            }
        }
        void withEffects;
    } else {
        document.body.classList.add('started');
    }

    /* ---------------------------------------------------------------------
       7. Contact form
       Submits via fetch so the visitor stays on the page instead of being
       bounced to a Formspree confirmation screen.
       ------------------------------------------------------------------ */
    const contactForm = $('#contactForm');

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    if (contactForm) {
        contactForm.addEventListener('submit', async function (e) {
            const email = ($('#email', this) || {}).value || '';
            const required = ['#name', '#email', '#subject', '#message']
                .map((sel) => ($(sel, this) || {}).value || '');

            if (required.some((v) => !v.trim())) {
                e.preventDefault();
                showNotification('Please fill in all fields', 'error');
                return;
            }

            if (!isValidEmail(email)) {
                e.preventDefault();
                showNotification('Please enter a valid email address', 'error');
                return;
            }

            // Progressive enhancement: without fetch the native POST still works.
            if (!window.fetch) return;

            e.preventDefault();
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalLabel = submitBtn ? submitBtn.textContent : '';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Sending…';
            }

            try {
                const response = await fetch(this.action, {
                    method: 'POST',
                    body: new FormData(this),
                    headers: { Accept: 'application/json' }
                });

                if (response.ok) {
                    showNotification('Message sent. I will get back to you soon.', 'success');
                    this.reset();
                } else {
                    showNotification('Could not send the message. Please email me directly.', 'error');
                }
            } catch (err) {
                showNotification('Network problem. Please email me directly at omar55138@gmail.com.', 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalLabel;
                }
            }
        });
    }

    /* ---------------------------------------------------------------------
       8. Notifications
       ------------------------------------------------------------------ */
    function showNotification(message, type) {
        const existing = $('.notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = 'notification notification-' + (type || 'info');
        notification.setAttribute('role', 'status');
        notification.setAttribute('aria-live', 'polite');

        const content = document.createElement('div');
        content.className = 'notification-content';

        const text = document.createElement('span');
        text.className = 'notification-message';
        text.textContent = message;

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'notification-close';
        closeBtn.setAttribute('aria-label', 'Dismiss notification');
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => notification.remove());

        content.appendChild(text);
        content.appendChild(closeBtn);
        notification.appendChild(content);
        document.body.appendChild(notification);

        setTimeout(() => notification.remove(), 5000);
    }

    /* ---------------------------------------------------------------------
       9. Gamification
       ------------------------------------------------------------------ */
    const xpFill = $('#xpFill');
    const xpText = $('#playerXP');
    const levelText = $('#playerLevel');
    const coinChip = $('#coinCount');
    const streakChip = $('#streakCount');
    const xpToast = $('#xpToast');

    const XP_MAX = 10000;
    let currentXP = 7800;
    let currentLevel = 12;
    let coins = 0;
    let streak = 0;

    function updateXPUI() {
        if (!xpFill || !xpText) return;
        xpFill.style.width = Math.max(0, Math.min(100, (currentXP / XP_MAX) * 100)) + '%';
        xpText.textContent = currentXP + ' / ' + XP_MAX;
        if (levelText) levelText.textContent = String(currentLevel);
    }

    function addXP(points) {
        currentXP += points;
        while (currentXP >= XP_MAX) {
            currentXP -= XP_MAX;
            currentLevel += 1;
        }
        updateXPUI();
    }

    function showXP(amount) {
        if (!xpToast) return;
        xpToast.textContent = '+' + amount + ' XP';
        xpToast.classList.add('show');
        setTimeout(() => xpToast.classList.remove('show'), 900);
    }

    function reward(amount) {
        coins += amount;
        streak += 1;
        if (coinChip) coinChip.textContent = String(coins);
        if (streakChip) streakChip.textContent = String(streak);
        const gained = amount * 5;
        addXP(gained);
        showXP(gained);
    }

    updateXPUI();

    const rewardObserver = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (e.isIntersecting && document.body.classList.contains('started')) {
                reward(5);
                rewardObserver.unobserve(e.target);
            }
        });
    }, { threshold: 0.6 });

    $$('main section').forEach((sec) => rewardObserver.observe(sec));

    /* ---------------------------------------------------------------------
       10. Ambient effects
       ------------------------------------------------------------------ */

    // --- Shooting stars over the skill columns ---------------------------
    const skillStars = $$('.skill-stars');
    if (skillStars.length && allowAmbient()) {
        let skillsVisible = false;

        const skillsSection = $('#skills');
        if (skillsSection) {
            new IntersectionObserver((entries) => {
                skillsVisible = entries.some((e) => e.isIntersecting);
            }, { threshold: 0.05 }).observe(skillsSection);
        }

        const spawnStar = (container) => {
            const parent = container.parentElement;
            if (!parent) return;
            const star = document.createElement('div');
            star.className = 'skill-star';
            star.style.left = (Math.random() * (parent.clientWidth - 10) + 5) + 'px';
            star.style.top = '0px';
            container.appendChild(star);

            const dy = 80 + Math.random() * 140;
            const dx = (Math.random() - 0.5) * 80;
            if (star.animate) {
                star.animate([
                    { transform: 'translate(0, 0)', opacity: 0.9 },
                    { transform: 'translate(' + dx + 'px, ' + dy + 'px)', opacity: 0 }
                ], { duration: 1500 + Math.random() * 1000, easing: 'ease-out' });
            }
            setTimeout(() => star.remove(), 1800);
        };

        // Only spawn while the skills section is on screen and the tab is visible.
        setInterval(() => {
            if (!skillsVisible || document.hidden || reduceMotion) return;
            skillStars.forEach((c) => { if (Math.random() < 0.4) spawnStar(c); });
        }, 700);
    }

    // --- Cursor trail ----------------------------------------------------
    if (!coarsePointer && allowAmbient()) {
        let lastTrail = 0;
        window.addEventListener('mousemove', (e) => {
            const now = Date.now();
            if (now - lastTrail < 25 || reduceMotion) return;
            lastTrail = now;
            const dot = document.createElement('div');
            dot.className = 'cursor-dot';
            dot.style.left = e.clientX + 'px';
            dot.style.top = e.clientY + 'px';
            document.body.appendChild(dot);
            setTimeout(() => dot.remove(), 350);
        }, { passive: true });
    }

    // --- Starfield background -------------------------------------------
    const starCanvas = $('#bgStars');
    if (starCanvas && allowAmbient()) {
        const ctx = starCanvas.getContext('2d');
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        let width = 0;
        let height = 0;
        let layers = [[], [], []];
        let running = true;

        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            starCanvas.width = Math.floor(width * dpr);
            starCanvas.height = Math.floor(height * dpr);
            starCanvas.style.width = width + 'px';
            starCanvas.style.height = height + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function spawnStars() {
            const make = (divisor, floor, rBase, rSpread) => Array.from(
                { length: Math.max(floor, Math.floor((width * height) / divisor)) },
                () => ({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    r: Math.random() * rSpread + rBase,
                    tw: Math.random()
                })
            );
            layers = [
                make(9000, 80, 0.2, 0.8),
                make(14000, 50, 0.4, 1.2),
                make(22000, 30, 0.6, 1.6)
            ];
        }

        resize();
        spawnStars();

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => { resize(); spawnStars(); }, 200);
        }, { passive: true });

        // Stop drawing entirely when the tab is hidden or motion is disabled.
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                running = false;
            } else if (!reduceMotion) {
                running = true;
                last = performance.now();
                requestAnimationFrame(draw);
            }
        });

        const PARALLAX = [0.15, 0.3, 0.45];
        const COLORS = ['#93c5fd', '#a5b4fc', '#c7d2fe'];
        let t = 0;
        let last = performance.now();

        function draw(now) {
            if (!running || reduceMotion) { running = false; return; }
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            t += dt;

            ctx.clearRect(0, 0, width, height);
            const scrollY = window.scrollY || 0;

            for (let i = 0; i < layers.length; i++) {
                ctx.fillStyle = COLORS[i];
                for (const s of layers[i]) {
                    const y = s.y + scrollY * PARALLAX[i];
                    const twinkle = 0.5 + 0.5 * Math.sin(t * (1.5 + i * 0.5) + s.tw * 6.28);
                    ctx.globalAlpha = 0.2 + twinkle * 0.8;
                    ctx.beginPath();
                    ctx.arc(s.x, y % (height + 5), s.r + i * 0.2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.globalAlpha = 1;
            requestAnimationFrame(draw);
        }

        requestAnimationFrame(draw);
    }

    // --- Matrix rain transition ------------------------------------------
    function runMatrixRain(canvas, durationMs) {
        if (!canvas || reduceMotion) return;
        const ctx = canvas.getContext('2d');
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = window.innerWidth;
        const h = window.innerHeight;

        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        canvas.style.opacity = '1';

        const fontSize = 16;
        const drops = new Array(Math.ceil(w / fontSize)).fill(0);
        const glyphs = 'アイウエオカキクケコ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const start = performance.now();

        (function frame(now) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#36fca1';
            ctx.font = fontSize + 'px monospace';

            for (let i = 0; i < drops.length; i++) {
                const glyph = glyphs[Math.floor(Math.random() * glyphs.length)] || '*';
                ctx.fillText(glyph, i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > h && Math.random() > 0.975) drops[i] = 0;
                drops[i]++;
            }

            if (now - start < (durationMs || 1000)) {
                requestAnimationFrame(frame);
            } else {
                canvas.style.opacity = '0';
                setTimeout(() => ctx.clearRect(0, 0, w, h), 250);
            }
        })(performance.now());
    }

    /* ---------------------------------------------------------------------
       Footer year — one less thing to go stale.
       ------------------------------------------------------------------ */
    const footerYear = $('#footerYear');
    if (footerYear) footerYear.textContent = String(new Date().getFullYear());
})();
