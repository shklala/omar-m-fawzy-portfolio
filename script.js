/* =========================================================================
   Omar M. Fawzy Portfolio
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
     10. Ambient effects (starfield, skill stars, matrix rain)
     11. Motion and interaction (scroll-spy, counters, spotlight, tilt, timeline)
     12. Custom cursor (reticle, states, trail, magnetic elements)
     13. Project filters
     14. Progress ring, navbar auto-hide, hero fade
     15. Copy to clipboard
     16. Konami code
     17. Guide bot (pointer-tracking companion, per-section tour)
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

    // Anything else that needs the scroll position registers here rather than
    // adding its own listener, so the whole page still costs one frame.
    const scrollFrameHooks = [];

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

        for (let i = 0; i < scrollFrameHooks.length; i++) scrollFrameHooks[i](y);
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
        // Nothing to hide, so leave the text exactly as authored.
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
        // intro at all, so drop them straight into the content.
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


    // --- Starfield: true 3D perspective ----------------------------------
    // Stars carry a z depth and are projected through a focal length rather
    // than being drawn as flat parallax layers, so they genuinely fly past the
    // viewer. Scrolling adds thrust, which stretches them into streaks.
    const starCanvas = $('#bgStars');
    if (starCanvas && allowAmbient()) {
        const ctx = starCanvas.getContext('2d');
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const FOCAL = 480;
        const MAX_Z = 1400;
        const COLORS = ['#93c5fd', '#a5b4fc', '#c7d2fe', '#e0e7ff'];

        let width = 0;
        let height = 0;
        let stars = [];
        let running = true;
        let thrust = 0;
        let lastScrollY = window.scrollY;

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
            const count = Math.max(150, Math.min(420, Math.floor((width * height) / 4200)));
            const spread = Math.max(width, height) * 1.25;
            stars = Array.from({ length: count }, () => ({
                x: (Math.random() - 0.5) * spread,
                y: (Math.random() - 0.5) * spread,
                z: Math.random() * MAX_Z + 1,
                c: COLORS[Math.floor(Math.random() * COLORS.length)],
                tw: Math.random() * 6.28
            }));
        }

        resize();
        spawnStars();

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => { resize(); spawnStars(); }, 200);
        }, { passive: true });

        // Scrolling pushes the field forward, then it eases back to a drift.
        scrollFrameHooks.push((y) => {
            thrust = Math.min(900, Math.abs(y - lastScrollY) * 14);
            lastScrollY = y;
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                running = false;
            } else if (!reduceMotion) {
                running = true;
                last = performance.now();
                requestAnimationFrame(draw);
            }
        });

        let t = 0;
        let last = performance.now();

        function draw(now) {
            if (!running || reduceMotion) { running = false; return; }
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            t += dt;
            thrust *= 0.92;

            ctx.clearRect(0, 0, width, height);
            const cx = width / 2;
            const cy = height / 2;
            const speed = (60 + thrust) * dt;

            for (let i = 0; i < stars.length; i++) {
                const s = stars[i];
                const prevZ = s.z;
                s.z -= speed;

                if (s.z < 1) {
                    // Recycle to the far plane with a fresh position.
                    const spread = Math.max(width, height) * 1.25;
                    s.x = (Math.random() - 0.5) * spread;
                    s.y = (Math.random() - 0.5) * spread;
                    s.z = MAX_Z;
                    continue;
                }

                const k = FOCAL / s.z;
                const sx = cx + s.x * k;
                const sy = cy + s.y * k;
                if (sx < -40 || sx > width + 40 || sy < -40 || sy > height + 40) continue;

                const depth = 1 - s.z / MAX_Z;
                const twinkle = 0.75 + 0.25 * Math.sin(t * 2 + s.tw);
                const r = Math.max(0.25, depth * 2.1);

                ctx.fillStyle = s.c;
                ctx.globalAlpha = Math.min(1, depth * 1.3) * twinkle;

                // Under thrust the star smears between its old and new position.
                if (thrust > 120) {
                    const pk = FOCAL / prevZ;
                    ctx.strokeStyle = s.c;
                    ctx.lineWidth = r;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.moveTo(cx + s.x * pk, cy + s.y * pk);
                    ctx.lineTo(sx, sy);
                    ctx.stroke();
                } else {
                    ctx.beginPath();
                    ctx.arc(sx, sy, r, 0, Math.PI * 2);
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
       11. Motion and interaction
       Scroll-spy, counters, pointer-reactive cards and the timeline progress
       line. All of it checks reduceMotion first, and the pointer effects are
       skipped entirely on touch devices where there is no hover to react to.
       ------------------------------------------------------------------ */

    // Stagger index for grid reveals, consumed by --i in the stylesheet.
    ['.projects-grid', '.skills-grid', '.about-stats', '.badge-list'].forEach((sel) => {
        const parent = $(sel);
        if (!parent) return;
        Array.from(parent.children).forEach((child, i) => {
            child.style.setProperty('--i', String(i));
        });
    });

    // --- Section titles: grow the underline when the title arrives ---------
    const titleObserver = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (!e.isIntersecting) return;
            e.target.classList.add('in-view');
            titleObserver.unobserve(e.target);
        });
    }, { threshold: 0.6 });

    $$('.section-title').forEach((t) => titleObserver.observe(t));

    // --- Scroll-spy navigation ---------------------------------------------
    const navLinks = $$('.nav-link');
    const sections = navLinks
        .map((link) => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);

    function updateActiveNav() {
        if (!sections.length) return;
        // The section whose top is closest to just under the fixed navbar.
        const probe = window.scrollY + 120;
        let activeIndex = 0;
        sections.forEach((sec, i) => {
            if (sec.offsetTop <= probe) activeIndex = i;
        });
        // At the very bottom the last section may never reach the probe line.
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 4) {
            activeIndex = sections.length - 1;
        }
        navLinks.forEach((link, i) => link.classList.toggle('active', i === activeIndex));
    }

    // --- Timeline progress line --------------------------------------------
    const timeline = $('.timeline');
    const timelineItems = $$('.timeline-item');

    function updateTimeline() {
        if (!timeline) return;
        const rect = timeline.getBoundingClientRect();
        const mid = window.innerHeight * 0.55;
        const progress = (mid - rect.top) / rect.height;
        timeline.style.setProperty('--timeline-progress',
            Math.max(0, Math.min(1, progress)) * 100 + '%');

        // Mark the entry nearest the middle of the viewport.
        let nearest = null;
        let best = Infinity;
        timelineItems.forEach((item) => {
            const r = item.getBoundingClientRect();
            const d = Math.abs(r.top + r.height / 2 - window.innerHeight / 2);
            if (d < best) { best = d; nearest = item; }
        });
        timelineItems.forEach((item) => item.classList.toggle('current', item === nearest));
    }

    // Both run inside the existing rAF-batched scroll frame.
    scrollFrameHooks.push(updateActiveNav);
    if (timeline && !reduceMotion) scrollFrameHooks.push(updateTimeline);
    updateActiveNav();
    updateTimeline();

    // --- Count-up statistics ------------------------------------------------
    // Reads the number out of the existing text, so the markup stays readable
    // and a value like "C1" is simply left alone.
    const statObserver = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (!e.isIntersecting) return;
            const el = e.target;
            statObserver.unobserve(el);

            const text = el.textContent.trim();
            // Accept thousands separators, so "3,800+" counts the whole number
            // rather than just the leading digit.
            const match = text.match(/^(\D*)([\d,]+)(.*)$/);
            if (!match || reduceMotion) return;

            const [, prefix, digits, suffix] = match;
            const target = parseInt(digits.replace(/,/g, ''), 10);
            if (!target || target > 1000000) return;
            const grouped = digits.indexOf(',') !== -1;

            const duration = 1100;
            const start = performance.now();
            const step = (now) => {
                const t = Math.min(1, (now - start) / duration);
                // easeOutCubic
                const eased = 1 - Math.pow(1 - t, 3);
                const n = Math.round(target * eased);
                el.textContent = prefix + (grouped ? n.toLocaleString('en-US') : n) + suffix;
                if (t < 1) requestAnimationFrame(step);
                else el.textContent = text;
            };
            el.textContent = prefix + '0' + suffix;
            requestAnimationFrame(step);
        });
    }, { threshold: 0.6 });

    $$('.stat h3').forEach((el) => statObserver.observe(el));

    // --- XP bar fills on arrival -------------------------------------------
    if (xpFill) {
        const finalWidth = xpFill.style.width;
        if (!reduceMotion) {
            xpFill.style.width = '0%';
            setTimeout(() => { xpFill.style.width = finalWidth; }, 700);
        }
    }

    // --- Pointer spotlight and tilt ----------------------------------------
    if (!coarsePointer && !reduceMotion) {
        const spotlightTargets = $$('.project-card, .skill-category, .timeline-content, .stat, .education-item');
        spotlightTargets.forEach((el) => el.classList.add('spotlight'));

        let pointerQueued = false;
        let pending = null;

        const applyPointer = () => {
            pointerQueued = false;
            if (!pending) return;
            const { el, x, y, tilt } = pending;
            const r = el.getBoundingClientRect();
            const px = ((x - r.left) / r.width) * 100;
            const py = ((y - r.top) / r.height) * 100;
            el.style.setProperty('--mx', px + '%');
            el.style.setProperty('--my', py + '%');
            if (tilt) {
                // Small angles only: enough to read as depth, not as a gimmick.
                el.style.setProperty('--ry', ((px - 50) / 50 * 5).toFixed(2) + 'deg');
                el.style.setProperty('--rx', (-(py - 50) / 50 * 5).toFixed(2) + 'deg');
            }
            pending = null;
        };

        const track = (el, tilt) => {
            el.addEventListener('pointermove', (e) => {
                pending = { el, x: e.clientX, y: e.clientY, tilt };
                if (!pointerQueued) {
                    pointerQueued = true;
                    requestAnimationFrame(applyPointer);
                }
            }, { passive: true });

            el.addEventListener('pointerleave', () => {
                pending = null;
                if (tilt) {
                    el.style.setProperty('--rx', '0deg');
                    el.style.setProperty('--ry', '0deg');
                }
            });
        };

        // Cards and stat tiles tilt; the rest only take the spotlight.
        spotlightTargets.forEach((el) => track(el,
            el.classList.contains('project-card') || el.classList.contains('stat')));

        const profileCard = $('.profile-card');
        if (profileCard) track(profileCard, true);
    }


    /* ---------------------------------------------------------------------
       12. Custom cursor
       A reticle that lags behind a hard dot, changes shape over links and
       text fields, and can carry a label supplied by data-cursor. Enabled
       only for fine pointers with motion allowed, and switched on from JS so
       the native cursor survives if any of this fails.
       ------------------------------------------------------------------ */
    if (!coarsePointer && !reduceMotion && window.matchMedia('(hover: hover)').matches) {
        const cursor = document.createElement('div');
        cursor.className = 'cursor';
        cursor.setAttribute('aria-hidden', 'true');
        cursor.innerHTML =
            '<div class="cursor-ring"></div><div class="cursor-core"></div><div class="cursor-label"></div>';
        document.body.appendChild(cursor);

        const ring = cursor.querySelector('.cursor-ring');
        const core = cursor.querySelector('.cursor-core');
        const label = cursor.querySelector('.cursor-label');

        // A fixed pool of trail dots: no allocation while the pointer moves.
        const TRAIL = 6;
        const trail = [];
        for (let i = 0; i < TRAIL; i++) {
            const dot = document.createElement('div');
            dot.className = 'cursor-trail';
            dot.setAttribute('aria-hidden', 'true');
            document.body.appendChild(dot);
            trail.push({ el: dot, x: 0, y: 0 });
        }

        let targetX = window.innerWidth / 2;
        let targetY = window.innerHeight / 2;
        let ringX = targetX;
        let ringY = targetY;
        let started = false;

        document.addEventListener('pointermove', (e) => {
            if (e.pointerType === 'touch') return;
            targetX = e.clientX;
            targetY = e.clientY;
            if (!started) {
                started = true;
                ringX = targetX;
                ringY = targetY;
                cursor.classList.add('ready');
                document.body.classList.add('cursor-on');
            }
        }, { passive: true });

        document.addEventListener('pointerdown', () => cursor.classList.add('down'));
        document.addEventListener('pointerup', () => cursor.classList.remove('down'));
        document.addEventListener('pointerleave', () => cursor.classList.add('off'));
        document.addEventListener('pointerenter', () => cursor.classList.remove('off'));
        window.addEventListener('blur', () => cursor.classList.add('off'));
        window.addEventListener('focus', () => cursor.classList.remove('off'));

        // Shape follows whatever is under the pointer.
        const LINK_SEL = 'a, button, .project-card, .skill-item, .stat, .badge, .social-link, [role="button"], summary';
        const TEXT_SEL = 'input, textarea, select';

        document.addEventListener('pointerover', (e) => {
            const el = e.target;
            if (!el || !el.closest) return;

            const labelled = el.closest('[data-cursor]');
            if (labelled) {
                label.textContent = labelled.getAttribute('data-cursor');
                cursor.classList.add('has-label');
            } else {
                cursor.classList.remove('has-label');
                label.textContent = '';
            }

            cursor.classList.toggle('on-text', !!el.closest(TEXT_SEL));
            cursor.classList.toggle('on-link', !el.closest(TEXT_SEL) && !!el.closest(LINK_SEL));
        }, { passive: true });

        const lerp = (a, b, n) => a + (b - a) * n;

        (function drawCursor() {
            ringX = lerp(ringX, targetX, 0.18);
            ringY = lerp(ringY, targetY, 0.18);

            core.style.transform = 'translate(' + targetX + 'px,' + targetY + 'px) translate(-50%,-50%)';
            ring.style.transform = 'translate(' + ringX + 'px,' + ringY + 'px) translate(-50%,-50%)' +
                (cursor.classList.contains('down') ? ' scale(0.8)' : '');
            label.style.transform = 'translate(' + ringX + 'px,' + (ringY + 46) + 'px) translate(-50%,-50%)';

            // Each trail dot chases the one in front of it.
            let px = targetX;
            let py = targetY;
            for (let i = 0; i < trail.length; i++) {
                const t = trail[i];
                t.x = lerp(t.x, px, 0.4);
                t.y = lerp(t.y, py, 0.4);
                t.el.style.transform = 'translate(' + t.x + 'px,' + t.y + 'px) translate(-50%,-50%) scale(' +
                    (1 - i / trail.length) + ')';
                t.el.style.opacity = started ? String(0.35 * (1 - i / trail.length)) : '0';
                px = t.x;
                py = t.y;
            }

            requestAnimationFrame(drawCursor);
        })();

        /* --- Magnetic pull ------------------------------------------------ */
        $$('.btn, .social-link, #backToTop, .filter-btn').forEach((el) => {
            el.classList.add('magnetic');
            const strength = el.classList.contains('btn') ? 0.28 : 0.4;

            el.addEventListener('pointermove', (e) => {
                const r = el.getBoundingClientRect();
                const dx = e.clientX - (r.left + r.width / 2);
                const dy = e.clientY - (r.top + r.height / 2);
                el.classList.add('pulling');
                el.style.transform = 'translate(' + dx * strength + 'px,' + dy * strength + 'px)';
            }, { passive: true });

            el.addEventListener('pointerleave', () => {
                el.classList.remove('pulling');
                el.style.transform = '';
            });
        });
    }

    /* ---------------------------------------------------------------------
       13. Project filters
       ------------------------------------------------------------------ */
    const filterBar = $('.project-filters');
    if (filterBar) {
        const cards = $$('.project-card');
        const buttons = $$('.filter-btn', filterBar);

        // Fill in the counts from the markup rather than hard-coding them.
        buttons.forEach((btn) => {
            const f = btn.dataset.filter;
            const n = f === 'all' ? cards.length : cards.filter((c) => c.dataset.filter === f).length;
            const slot = btn.querySelector('.filter-count');
            if (slot) slot.textContent = n;
        });

        const apply = (filter) => {
            let shown = 0;
            cards.forEach((card) => {
                const match = filter === 'all' || card.dataset.filter === filter;
                card.classList.toggle('filtered-out', !match);
                if (match) {
                    card.style.setProperty('--fi', String(shown++));
                    card.classList.remove('filtering-in');
                    // Restart the entrance animation.
                    void card.offsetWidth;
                    card.classList.add('filtering-in');
                }
            });
            buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === filter)));
        };

        buttons.forEach((btn) => btn.addEventListener('click', () => apply(btn.dataset.filter)));
    }

    /* ---------------------------------------------------------------------
       14. Back-to-top progress ring, navbar auto-hide, hero fade
       ------------------------------------------------------------------ */
    const ringFill = $('.back-to-top .ring-fill');
    if (ringFill) {
        const r = ringFill.r.baseVal.value;
        const circ = 2 * Math.PI * r;
        ringFill.style.setProperty('--circ', circ);
        scrollFrameHooks.push((y) => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            const pct = max > 0 ? Math.min(1, y / max) : 0;
            ringFill.style.setProperty('--offset', circ * (1 - pct));
        });
    }

    if (navbar && !reduceMotion) {
        let lastY = window.scrollY;
        let travel = 0;

        const showNav = () => {
            navbar.classList.remove('nav-hidden');
            travel = 0;
        };

        scrollFrameHooks.push((y) => {
            const delta = y - lastY;
            lastY = y;

            // Accumulate distance in the current direction rather than judging
            // each frame: a smooth scroll decelerates to sub-pixel deltas, which
            // left the bar stuck in whatever state the last big frame set.
            travel = (delta > 0) === (travel > 0) ? travel + delta : delta;

            const menuOpen = navMenu && navMenu.classList.contains('active');
            if (y <= 400 || menuOpen) {
                showNav();
            } else if (travel > 90) {
                navbar.classList.add('nav-hidden');
                travel = 0;
            } else if (travel < -50) {
                showNav();
            }
        });

        // Jumping to a section must never leave the visitor without the nav.
        $$('a[href^="#"]').forEach((a) => a.addEventListener('click', () => setTimeout(showNav, 60)));
        window.addEventListener('keydown', (e) => { if (e.key === 'Escape') showNav(); });
    }

    const heroContent = $('.hero-content');
    const heroImage = $('.hero-image');
    if (heroContent && !reduceMotion && !smallScreen) {
        scrollFrameHooks.push((y) => {
            const fade = Math.max(0, 1 - y / (window.innerHeight * 0.75));
            heroContent.style.opacity = fade;
            if (heroImage) heroImage.style.opacity = fade;
        });
    }

    /* ---------------------------------------------------------------------
       15. Copy to clipboard
       ------------------------------------------------------------------ */
    $$('.copy-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const value = btn.dataset.copy || '';
            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(value);
                } else {
                    const tmp = document.createElement('textarea');
                    tmp.value = value;
                    tmp.setAttribute('readonly', '');
                    tmp.style.position = 'fixed';
                    tmp.style.opacity = '0';
                    document.body.appendChild(tmp);
                    tmp.select();
                    document.execCommand('copy');
                    tmp.remove();
                }
                const original = btn.innerHTML;
                btn.classList.add('copied');
                btn.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i>';
                showNotification('Copied ' + value, 'success');
                setTimeout(() => {
                    btn.classList.remove('copied');
                    btn.innerHTML = original;
                }, 1600);
            } catch (err) {
                showNotification('Could not copy. Please select the text instead.', 'error');
            }
        });
    });

    /* ---------------------------------------------------------------------
       16. Konami code
     17. Guide bot (pointer-tracking companion, per-section tour)
       The page already keeps a level and an XP bar, so the classic cheat
       code granting a level felt like the honest payoff.
       ------------------------------------------------------------------ */
    (function konami() {
        const SEQ = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft',
            'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
        let pos = 0;

        document.addEventListener('keydown', (e) => {
            const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
            pos = (key === SEQ[pos]) ? pos + 1 : (key === SEQ[0] ? 1 : 0);
            if (pos < SEQ.length) return;
            pos = 0;
            unlock();
        });

        function unlock() {
            addXP(XP_MAX - currentXP);
            reward(50);

            const panel = document.createElement('div');
            panel.className = 'achievement';
            panel.setAttribute('role', 'status');
            panel.innerHTML =
                '<div class="achievement-title">ACHIEVEMENT UNLOCKED</div>' +
                '<div class="achievement-body">Level ' + currentLevel + ' reached. You found the cheat code.</div>' +
                '<div class="achievement-hint">Thanks for looking this closely.</div>';
            document.body.appendChild(panel);
            // Flush layout so the transition has a start value to animate from.
            // A single rAF was not reliably delivered before the class landed.
            void panel.offsetWidth;
            panel.classList.add('show');
            setTimeout(() => {
                panel.classList.add('leaving');
                setTimeout(() => panel.remove(), 350);
            }, 3800);

            if (reduceMotion) return;

            // Pixel confetti, cleaned up by the animation's own finish event.
            const colors = ['#a5b4fc', '#fbbf24', '#34d399', '#60a5fa', '#f472b6'];
            for (let i = 0; i < 60; i++) {
                const bit = document.createElement('div');
                bit.className = 'konami-burst';
                bit.style.background = colors[i % colors.length];
                document.body.appendChild(bit);

                const angle = Math.random() * Math.PI * 2;
                const dist = 120 + Math.random() * 320;
                const anim = bit.animate([
                    { transform: 'translate(50vw, 40vh) scale(1)', opacity: 1 },
                    {
                        transform: 'translate(calc(50vw + ' + Math.cos(angle) * dist + 'px), calc(40vh + ' +
                            (Math.sin(angle) * dist + 260) + 'px)) rotate(' + (Math.random() * 720 - 360) + 'deg) scale(0.3)',
                        opacity: 0
                    }
                ], { duration: 1400 + Math.random() * 900, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
                anim.onfinish = () => bit.remove();
            }
        }
    })();


    /* ---------------------------------------------------------------------
       17. Guide bot
       A companion that watches the pointer and explains whichever section is
       on screen, plus a self-driving tour. Its state is remembered per
       visitor, and it is skipped entirely when motion is reduced to a
       still bubble rather than removed, since the explanations are content.
       ------------------------------------------------------------------ */
    (function guideBot() {
        const guide = $('#guide');
        const bot = $('#guideBot');
        const bubble = $('#guideBubble');
        const textEl = $('#guideText');
        const tourBtn = $('#guideTour');
        const closeBtn = $('#guideClose');
        const recall = $('#guideRecall');
        if (!guide || !bot || !textEl) return;

        const SCRIPT = {
            home: 'Hi, I am <b>Pixel</b>. I will explain what you are looking at as you scroll. This is the hero: Omar’s current role, and the resume download.',
            about: '<b>About.</b> The short version of who Omar is, and the numbers behind it: 3,800+ applications audited, 1,300+ stages reconstructed, 1,500+ sessions delivered.',
            experience: '<b>Experience.</b> A timeline of every role. The rail fills as you scroll and the glowing marker follows whichever entry you are reading.',
            projects: '<b>Selected Work.</b> Twelve products Omar owned end to end. Use the filters for live demos, private internal platforms, or research, and hover a card to tilt it.',
            skills: '<b>Skills.</b> Grouped into product, engineering, automation and AI, and EdTech. The bar under each one shows the level: expert, advanced or working.',
            education: '<b>Education.</b> The Computer Science degree, certifications including Cambridge C2, and languages.',
            contact: '<b>Contact.</b> Email and phone both have copy buttons, and the form sends without navigating you off the page.'
        };

        const STORAGE_KEY = 'omf-guide-dismissed';
        let dismissed = false;
        try { dismissed = localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) { /* private mode */ }

        let currentKey = null;
        let typeTimer = null;
        let touring = false;

        function setText(html) {
            clearInterval(typeTimer);
            if (reduceMotion) { textEl.innerHTML = html; return; }

            // Type the visible characters while leaving any markup intact.
            const parts = html.split(/(<[^>]+>)/);
            let partIndex = 0;
            let charIndex = 0;
            textEl.innerHTML = '';
            let built = '';

            typeTimer = setInterval(() => {
                if (partIndex >= parts.length) { clearInterval(typeTimer); return; }
                const part = parts[partIndex];
                if (part.startsWith('<')) {
                    built += part;
                    partIndex++;
                } else {
                    built += part.charAt(charIndex++);
                    if (charIndex >= part.length) { partIndex++; charIndex = 0; }
                }
                textEl.innerHTML = built;
            }, 14);
        }

        // The bubble folds away on its own so it never sits on top of a card
        // for longer than it takes to read. Clicking the bot brings it back.
        let collapseTimer = null;

        function scheduleCollapse() {
            clearTimeout(collapseTimer);
            if (touring) return;
            collapseTimer = setTimeout(() => {
                if (touring) return;
                guide.classList.remove('open');
                stopPointing();
            }, 5200);
        }

        function show(key) {
            if (dismissed || key === currentKey || !SCRIPT[key]) return;
            currentKey = key;
            guide.classList.add('open');

            const speak = () => { setText(SCRIPT[key]); pointAt(key); scheduleCollapse(); };

            if (travelAllowed() && ANCHORS[key] && key !== anchorKey) {
                // Speak once the bot has stepped out of the far portal.
                teleportTo(key);
                setTimeout(speak, 500);
            } else {
                speak();
            }
        }

        function open() {
            dismissed = false;
            try { localStorage.setItem(STORAGE_KEY, '0'); } catch (e) { /* ignore */ }
            guide.hidden = false;
            recall.hidden = true;
            guide.classList.add('open');
            if (!currentKey) show('home');
        }

        function hide() {
            dismissed = true;
            touring = false;
            clearInterval(typeTimer);
            try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) { /* ignore */ }
            guide.classList.remove('open');
            guide.hidden = true;
            recall.hidden = false;
            stopPointing();
        }

        // --- Pointing ---------------------------------------------------------
        // Each explanation names the thing it is about, and the bot aims its
        // arm at that element and outlines it, so "this" is unambiguous.
        const TARGETS = {
            home: '.hero-buttons',
            about: '.about-stats',
            experience: '.timeline',
            projects: '.project-filters',
            skills: '.skills-grid',
            education: '.languages-section',
            contact: '.contact-info'
        };

        const botSvg = $('svg', bot);
        const armRight = $('.bot-arm-right', bot);
        const armLeft = $('.bot-arm-left', bot);
        let pointTarget = null;

        // Shoulder hinges, in viewBox units of the 96x104 drawing.
        const SHOULDER = { right: [84, 78], left: [36, 78] };
        // Mirrored, because the left arm is drawn aiming -x.
        const REST = { right: 38, left: -38 };

        function restArms() {
            if (armRight) {
                armRight.classList.remove('aiming');
                armRight.style.transform = 'rotate(' + REST.right + 'deg)';
            }
            if (armLeft) {
                armLeft.classList.remove('aiming');
                armLeft.style.transform = 'rotate(' + REST.left + 'deg)';
            }
        }

        function aimArm() {
            if (!armRight || !armLeft) return;
            if (!pointTarget || !guide.classList.contains('open')) { restArms(); return; }

            const b = bot.getBoundingClientRect();
            const t = pointTarget.getBoundingClientRect();
            const tx = t.left + t.width / 2;
            const ty = t.top + t.height / 2;

            // Pick the arm on the side the target is on, so it reaches out
            // rather than swinging across the body.
            const useRight = tx >= b.left + b.width / 2;
            const arm = useRight ? armRight : armLeft;
            const other = useRight ? armLeft : armRight;
            const hinge = useRight ? SHOULDER.right : SHOULDER.left;

            const vb = botSvg && botSvg.viewBox && botSvg.viewBox.baseVal;
            const vw = (vb && vb.width) || 120;
            const vh = (vb && vb.height) || 124;
            const sx = b.left + (hinge[0] / vw) * b.width;
            const sy = b.top + (hinge[1] / vh) * b.height;
            const dx = tx - sx;
            const dy = ty - sy;

            // The right arm is drawn aiming +x, the left one aiming -x.
            const deg = useRight
                ? Math.atan2(dy, dx) * 180 / Math.PI
                : Math.atan2(-dy, -dx) * 180 / Math.PI;

            other.classList.remove('aiming');
            other.style.transform = 'rotate(' + (useRight ? REST.left : REST.right) + 'deg)';
            arm.classList.add('aiming');
            arm.style.transform = 'rotate(' + deg.toFixed(1) + 'deg)';
        }

        function pointAt(key) {
            document.querySelectorAll('.guide-pointing')
                .forEach((el) => el.classList.remove('guide-pointing'));

            const sel = TARGETS[key];
            const section = document.getElementById(key);
            pointTarget = sel && section ? section.querySelector(sel) : null;
            if (!pointTarget && section) pointTarget = section.querySelector('.section-title');
            if (pointTarget) pointTarget.classList.add('guide-pointing');
            aimArm();
        }

        function stopPointing() {
            pointTarget = null;
            document.querySelectorAll('.guide-pointing')
                .forEach((el) => el.classList.remove('guide-pointing'));
            aimArm();
        }

        // Keep the finger on the target as the page moves under it.
        scrollFrameHooks.push(aimArm);

        // --- Portal travel ---------------------------------------------------
        // Each section has a landing spot. The right-hand ones sit mid-height
        // so the bot never lands on the HUD chips or the back-to-top button.
        const ANCHORS = {
            home: { x: 'left', y: 'bottom' },
            about: { x: 'right', y: 'mid' },
            experience: { x: 'left', y: 'mid' },
            projects: { x: 'right', y: 'mid' },
            skills: { x: 'left', y: 'bottom' },
            education: { x: 'right', y: 'mid' },
            contact: { x: 'left', y: 'bottom' }
        };

        const MARGIN = 24;
        let anchorKey = 'home';
        let porting = false;
        let pendingKey = null;

        const travelAllowed = () => !reduceMotion && window.innerWidth > 900;

        function applyAnchor(key) {
            const a = ANCHORS[key];
            if (!a || window.innerWidth <= 900) return;
            anchorKey = key;

            guide.classList.toggle('at-right', a.x === 'right');

            // Stand in the page gutter, outside the content column, so the bot
            // is never on top of text. The bubble is measured separately
            // because it keeps its layout box even while folded away.
            const column = document.querySelector('.projects .container') || document.querySelector('.container');
            const col = column ? column.getBoundingClientRect() : { left: 120, right: window.innerWidth - 120 };
            const botW = bot.getBoundingClientRect().width || 78;
            const botH = bot.getBoundingClientRect().height || 85;

            if (a.x === 'left') {
                guide.style.setProperty('--gl', Math.max(12, col.left - botW - 14) + 'px');
                guide.style.setProperty('--gr', 'auto');
            } else {
                guide.style.setProperty('--gl', 'auto');
                guide.style.setProperty('--gr',
                    Math.max(12, window.innerWidth - col.right - botW - 14) + 'px');
            }

            // Anchor by the bot, which sits at the bottom of the stack, so the
            // bubble can grow upward without shifting the bot.
            guide.style.setProperty('--gb', a.y === 'bottom'
                ? MARGIN + 'px'
                : Math.round(window.innerHeight / 2 - botH / 2) + 'px');

            // The shoulder just moved, so the aim is stale.
            requestAnimationFrame(aimArm);
        }

        function teleportTo(key) {
            if (!ANCHORS[key] || key === anchorKey) return;
            if (!travelAllowed()) { applyAnchor(key); return; }

            // Scrolling quickly can request a jump mid-jump. Remember the most
            // recent destination instead of dropping it, or the bot strands
            // itself at whichever section it happened to be mid-flight for.
            if (porting) { pendingKey = key; return; }

            porting = true;
            guide.classList.add('porting');

            // Move only once the bot has disappeared into the portal.
            setTimeout(() => {
                applyAnchor(key);
                guide.classList.remove('porting');
                guide.classList.add('arriving');
                setTimeout(() => {
                    guide.classList.remove('arriving');
                    porting = false;
                    aimArm();
                    if (pendingKey && pendingKey !== anchorKey) {
                        const next = pendingKey;
                        pendingKey = null;
                        teleportTo(next);
                    } else {
                        pendingKey = null;
                    }
                }, 540);
            }, 430);
        }

        window.addEventListener('resize', () => applyAnchor(anchorKey), { passive: true });

        // --- Pointer tracking: pupils and a slight lean ---------------------
        const pupils = $$('.bot-pupil', bot);
        if (!coarsePointer && !reduceMotion) {
            let queued = false;
            let px = 0;
            let py = 0;

            const applyGaze = () => {
                queued = false;
                const r = bot.getBoundingClientRect();
                const cx = r.left + r.width / 2;
                const cy = r.top + r.height * 0.38;
                const dx = px - cx;
                const dy = py - cy;
                const dist = Math.hypot(dx, dy) || 1;
                const reach = Math.min(1, dist / 260);
                const ox = (dx / dist) * 3.2 * reach;
                const oy = (dy / dist) * 2.6 * reach;
                pupils.forEach((p) => {
                    p.style.transform = 'translate(' + ox.toFixed(2) + 'px,' + oy.toFixed(2) + 'px)';
                });
                // The button itself carries the bob animation, so the lean goes
                // on the SVG to avoid two transforms fighting over one element.
                if (botSvg) {
                    botSvg.style.transform = 'rotate(' + ((dx / dist) * 5 * reach).toFixed(2) + 'deg)';
                }
            };

            document.addEventListener('pointermove', (e) => {
                if (e.pointerType === 'touch') return;
                px = e.clientX;
                py = e.clientY;
                if (!queued) { queued = true; requestAnimationFrame(applyGaze); }
            }, { passive: true });
        }

        // --- Follow the section in view -------------------------------------
        const sections = $$('main section');
        const seen = new Map();

        const guideObserver = new IntersectionObserver((entries) => {
            entries.forEach((e) => seen.set(e.target.id, e.intersectionRatio));
            if (touring || dismissed) return;
            let best = null;
            let bestRatio = 0;
            seen.forEach((ratio, id) => {
                if (ratio > bestRatio) { bestRatio = ratio; best = id; }
            });
            if (best && bestRatio > 0.25) show(best);
        }, { threshold: [0, 0.25, 0.5, 0.75, 1] });

        sections.forEach((s) => guideObserver.observe(s));

        // --- The tour --------------------------------------------------------
        const ORDER = ['home', 'about', 'experience', 'projects', 'skills', 'education', 'contact'];

        function runTour() {
            if (touring) { stopTour(); return; }
            touring = true;
            tourBtn.textContent = 'Stop tour';
            let i = 0;

            const step = () => {
                if (!touring) return;
                if (i >= ORDER.length) { stopTour(); return; }
                const id = ORDER[i++];
                const target = document.getElementById(id);
                if (!target) { step(); return; }

                document.querySelectorAll('.guide-spotlight')
                    .forEach((el) => el.classList.remove('guide-spotlight'));
                target.classList.add('guide-spotlight');
                target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });

                currentKey = null;
                show(id);
                setTimeout(step, 5200);
            };

            step();
        }

        function stopTour() {
            touring = false;
            tourBtn.textContent = 'Take the tour';
            scheduleCollapse();
            document.querySelectorAll('.guide-spotlight')
                .forEach((el) => el.classList.remove('guide-spotlight'));
        }

        tourBtn.addEventListener('click', runTour);
        closeBtn.addEventListener('click', hide);
        recall.addEventListener('click', open);
        bot.addEventListener('click', () => {
            guide.classList.toggle('open');
            if (guide.classList.contains('open')) {
                if (!currentKey) show('home');
                else { pointAt(currentKey); scheduleCollapse(); }
            } else {
                clearTimeout(collapseTimer);
                stopPointing();
            }
        });

        // Hovering the bubble keeps it open while it is being read.
        bubble.addEventListener('pointerenter', () => clearTimeout(collapseTimer));
        bubble.addEventListener('pointerleave', scheduleCollapse);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && touring) stopTour();
        });

        // Appear once the visitor is actually in the page.
        const start = () => {
            if (dismissed) { guide.hidden = true; recall.hidden = false; return; }
            guide.hidden = false;
            applyAnchor('home');
            setTimeout(() => { guide.classList.add('open'); show('home'); }, 900);
        };

        if (document.body.classList.contains('started')) start();
        else {
            const wait = setInterval(() => {
                if (document.body.classList.contains('started')) { clearInterval(wait); start(); }
            }, 250);
        }
    })();

    /* ---------------------------------------------------------------------
       Footer year, one less thing to go stale.
       ------------------------------------------------------------------ */
    const footerYear = $('#footerYear');
    if (footerYear) footerYear.textContent = String(new Date().getFullYear());
})();
