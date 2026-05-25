// ─── PAGE DETECTION ─────────────────────────────────────────────
const isPortfolio = !!document.getElementById('scrollContainer');
const isProject   = !!document.getElementById('projectGallery');

// ─── SHARED: PRELOADER ──────────────────────────────────────────
function runPreloader(onComplete) {
    const preloader = document.getElementById('preloader');
    if (!preloader) { onComplete(); return; }

    const logo = preloader.querySelector('.preloader-logo');
    const bar  = document.getElementById('preloaderBar');

    // Première visite de la session : 1.4s min, sinon 0.7s (navigation interne)
    const isFirst   = !sessionStorage.getItem('sicz_visited');
    const minDelay  = isFirst ? 1400 : 700;
    sessionStorage.setItem('sicz_visited', '1');

    const startTime = Date.now();

    // Logo apparaît
    requestAnimationFrame(() => logo.classList.add('is-visible'));

    // Barre : monte à 65% rapidement, attend le load, finit à 100%
    setTimeout(() => { bar.style.width = '65%'; bar.style.transition = 'width 0.7s ease-out'; }, 50);

    function finish() {
        bar.style.transition = 'width 0.3s ease-out';
        bar.style.width = '100%';
        setTimeout(() => {
            preloader.classList.add('is-hiding');
            onComplete();
            setTimeout(() => preloader.remove(), 500);
        }, 320);
    }

    function afterLoad() {
        const elapsed  = Date.now() - startTime;
        const waitMore = Math.max(0, minDelay - elapsed);
        setTimeout(finish, waitMore);
    }

    if (document.readyState === 'complete') {
        afterLoad();
    } else {
        window.addEventListener('load', afterLoad, { once: true });
    }
}

// ─── SHARED: FOOTER VARS ────────────────────────────────────────
const footer    = document.getElementById('footer');
const bigname   = document.querySelector('.footer-bigname');
const hiddenMask = 'radial-gradient(circle 200px at -9999px -9999px, white, transparent)';

function fitBigName() {
    if (!bigname) return;
    bigname.style.fontSize = '100px';
    const w = bigname.offsetWidth;
    if (!w) return;
    bigname.style.fontSize = (100 * window.innerWidth / w * 1.015) + 'px';
}
document.fonts.ready.then(() => { fitBigName(); });

// ─── SHARED: CURSOR ─────────────────────────────────────────────
let globalMouseX = -9999, globalMouseY = -9999;
const cursorEl = document.getElementById('cursor');
let lastMouseMove = 0;
window.addEventListener('mousemove', (e) => {
    lastMouseMove = Date.now();
    gsap.to(cursorEl, { x: e.clientX, y: e.clientY, duration: 0.6, ease: 'power3.out' });
    globalMouseX = e.clientX;
    globalMouseY = e.clientY;
    if (footer && bigname) {
        const footerRect = footer.getBoundingClientRect();
        if (e.clientY < footerRect.top) {
            bigname.style.webkitMaskImage = hiddenMask;
            bigname.style.maskImage = hiddenMask;
        } else {
            const rect = bigname.getBoundingClientRect();
            const mask = `radial-gradient(circle 650px at ${e.clientX - rect.left}px ${e.clientY - rect.top}px, white 0%, rgba(255,255,255,0.8) 25%, rgba(255,255,255,0.3) 55%, transparent 80%)`;
            bigname.style.webkitMaskImage = mask;
            bigname.style.maskImage = mask;
        }
    }
}, { passive: true });
if (!document.body.classList.contains('is-touch')) {
    (function cursorWillChangeLoop() {
        if (cursorEl) {
            cursorEl.style.willChange = Date.now() - lastMouseMove > 150 ? 'auto' : 'transform';
        }
        requestAnimationFrame(cursorWillChangeLoop);
    })();
}
document.addEventListener('mouseover', (e) => {
    if (e.target.closest('a, button, .card, .footer-cta-trigger')) cursorEl.classList.add('is-hovering');
});
document.addEventListener('mouseout', (e) => {
    if (e.target.closest('a, button, .card, .footer-cta-trigger')) cursorEl.classList.remove('is-hovering');
});

// ─── SHARED: TOUCH ──────────────────────────────────────────────
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    document.body.classList.add('is-touch');
    if (cursorEl) cursorEl.style.display = 'none';
    document.body.style.cursor = 'auto';
}

// ─── SHARED: CHATBOT ────────────────────────────────────────────
const chatBtn     = document.getElementById('chatBtn');
const chatPanel   = document.getElementById('chatPanel');
const chatClose   = document.getElementById('chatClose');
const chatForm    = document.getElementById('chatForm');
const chatSend    = document.getElementById('chatSend');
const chatSuccess = document.getElementById('chatSuccess');

const chatOverlay = document.getElementById('chatOverlay');

function preventScroll(e) { e.preventDefault(); e.stopPropagation(); }

function openChat() {
    chatPanel.classList.add('open');
    if (chatOverlay) chatOverlay.classList.add('open');
    window.addEventListener('wheel',       preventScroll, { passive: false, capture: true });
    window.addEventListener('touchmove',   preventScroll, { passive: false, capture: true });
}
function closeChat() {
    chatPanel.classList.remove('open');
    if (chatOverlay) chatOverlay.classList.remove('open');
    window.removeEventListener('wheel',     preventScroll, { capture: true });
    window.removeEventListener('touchmove', preventScroll, { capture: true });
}

if (chatBtn && chatPanel) {
    chatBtn.addEventListener('click', () => chatPanel.classList.contains('open') ? closeChat() : openChat());
    if (chatOverlay) chatOverlay.addEventListener('click', closeChat);
    if (chatClose) chatClose.addEventListener('click', closeChat);
    const ctaTrigger    = document.getElementById('ctaTrigger');
    const ctaTriggerTop = document.getElementById('ctaTriggerTop');
    const contactNavBtn = document.getElementById('contactNavBtn');
    if (ctaTrigger)    ctaTrigger.addEventListener('click',    () => openChat());
    if (ctaTriggerTop) ctaTriggerTop.addEventListener('click', () => openChat());
    if (contactNavBtn) contactNavBtn.addEventListener('click', (e) => { e.preventDefault(); openChat(); });
    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            chatSend.disabled = true; chatSend.textContent = 'Envoi…';
            const data = { name: chatForm.name.value, email: chatForm.email.value, message: chatForm.message.value };
            try {
                const res = await fetch('https://formspree.io/f/YOUR_FORM_ID', { // TODO: remplacer YOUR_FORM_ID
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(data),
                });
                if (res.ok) { chatForm.style.display = 'none'; chatSuccess.style.display = 'block'; }
                else { throw new Error(); }
            } catch { chatSend.disabled = false; chatSend.textContent = 'Réessayer'; }
        });
    }
}

// ─── SHARED: SCROLL PROGRESS ────────────────────────────────
const scrollProgress = document.getElementById('scrollProgress');

// ─── SHARED: LENIS ──────────────────────────────────────────────
const lenis = new Lenis({
    duration:      isProject ? 1.6 : 2.2,
    easing:        (t) => 1 - Math.pow(1 - t, 4),
    smoothWheel:   true,
    wheelMultiplier: 0.9,
    smoothTouch:   false,
});
window.lenis = lenis;
let lenisRafId = null;
function lenisRaf(time) { lenis.raf(time); lenisRafId = requestAnimationFrame(lenisRaf); }
lenisRafId = requestAnimationFrame(lenisRaf);

lenis.on('scroll', ({ scroll }) => {
    if (scrollProgress) scrollProgress.style.width = (scroll / (lenis.limit || 1) * 100) + '%';
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (lenisRafId !== null) { cancelAnimationFrame(lenisRafId); lenisRafId = null; }
        if (cursorEl) cursorEl.style.willChange = 'auto';
    } else {
        if (lenisRafId === null) lenisRafId = requestAnimationFrame(lenisRaf);
    }
});

// ─── SHARED: TUBE TYPE ──────────────────────────────────────────
initTubeType();


// ─── PORTFOLIO ──────────────────────────────────────────────────
if (isPortfolio) {
    const portfolioTransition = initLiquidTransition();

    // Restaure la position de scroll si on revient d'une page projet
    const savedScroll = sessionStorage.getItem('portfolioScroll');
    if (savedScroll) {
        sessionStorage.removeItem('portfolioScroll');
        requestAnimationFrame(() => {
            lenis.scrollTo(parseFloat(savedScroll), { immediate: true });
        });
    }

    const world = document.getElementById('world');
    const intro = document.getElementById('intro');
    const scrollContainer = document.getElementById('scrollContainer');
    const scrollHint = document.querySelector('.scroll-hint');
    const logoFixed  = document.querySelector('.logo-fixed');

    const projects = [
        { key: 'arobase',  name: 'Arobase Systèmes',       categories: ['branding', 'web'] },
        { key: 'bouchtri', name: 'Bouchtri',                categories: ['autres'] },
        { key: 'comedie',  name: 'La Comédie des Fleurs',   categories: ['web'] },
        { key: 'honey',    name: 'Honey Coffee & Food',     categories: ['web'] },
        { key: 'slink',    name: 's!Link',                  categories: ['branding'] },
        { key: 'mankled',  name: 'MANK.LED',                categories: ['web'] },
        { key: 'auren',    name: 'Auren',                   categories: ['autres'] },
        { key: 'myr',      name: 'myr',                     categories: ['branding'] },
        { key: 'rcl',      name: 'Rugby Club Lunévillois',  categories: ['branding'] },
        { key: 'clotures', name: 'Clôtures Béton Vosges',   categories: ['web'] },
        { key: 'umami',    name: 'Umami',                   categories: ['branding'] },
        { key: 'affiches', name: 'Explorations<br>print',   categories: ['autres'] },
    ];

    const cards = [];
    let activeFilters = (() => {
        try { return new Set(JSON.parse(sessionStorage.getItem('sicz_filters') || '[]')); }
        catch(e) { return new Set(); }
    })();
    const getRadius = () => {
        const width = window.innerWidth;
        if (width > 1200) return width * 0.32;
        if (width > 768)  return width * 0.38;
        if (width > 480)  return width * 0.72;
        return width * 1.2;
    };

    const getVerticalGap = () => {
        const width = window.innerWidth;
        if (width > 1200) return 140;
        if (width > 768)  return 120;
        if (width > 480)  return 100;
        return 80;
    };

    let radius = getRadius();

    // ─── HERO INTRO ELEMENTS ────────────────────────────────────
    const introLogoImg    = document.querySelector('.intro-logo-img');
    const introSubtitle   = document.querySelector('.intro-subtitle');
    const logoMarkPaths   = Array.from(document.querySelectorAll('.logo-mark path'));
    const logoLetterPaths = Array.from(document.querySelectorAll('.logo-letters path'));
    let heroEntranceDone  = false;

    // Split subtitle en spans de caractères (préserve .ag / .pre-ag)
    const introCharSpans = [];
    if (introSubtitle) {
        const nodes = Array.from(introSubtitle.childNodes);
        introSubtitle.innerHTML = '';
        nodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                node.textContent.split('').forEach(ch => {
                    if (ch === ' ' || ch === '\n') { introSubtitle.appendChild(document.createTextNode(ch)); return; }
                    const s = document.createElement('span');
                    s.style.display = 'inline-block';
                    s.textContent = ch;
                    introSubtitle.appendChild(s);
                    introCharSpans.push(s);
                });
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const wrapper = node.cloneNode(false);
                node.textContent.split('').forEach(ch => {
                    const s = document.createElement('span');
                    s.style.display = 'inline-block';
                    s.textContent = ch;
                    wrapper.appendChild(s);
                    introCharSpans.push(s);
                });
                introSubtitle.appendChild(wrapper);
            }
        });
    }

    // Séquence complète : mark logo → lettres logo → lettres subtitle
    const allStaggerEls = [
        ...logoMarkPaths,
        ...logoLetterPaths,
        ...introCharSpans
    ];

    // État initial caché
    gsap.set(allStaggerEls, { opacity: 0, y: -20 });

    runPreloader(() => {
        portfolioTransition.reveal(0.9);

        // Modale avertissement mobile — une seule fois par session
        if (window.innerWidth < 768 && !sessionStorage.getItem('sicz_mobile_ok')) {
            const warn = document.getElementById('mobileWarning');
            const btn  = document.getElementById('mobileWarningBtn');
            if (warn && btn) {
                setTimeout(() => warn.classList.add('is-visible'), 300);
                btn.addEventListener('click', () => {
                    warn.classList.add('is-hiding');
                    setTimeout(() => warn.remove(), 400);
                    sessionStorage.setItem('sicz_mobile_ok', '1');
                });
            }
        }

        if (savedScroll) {
            // Retour depuis un projet : affichage immédiat sans animation
            gsap.set(allStaggerEls, { opacity: 1, y: 0 });
            heroEntranceDone = true;
        } else {
            // Première arrivée : stagger continu de gauche à droite
            setTimeout(() => {
                gsap.timeline({
                    onStart:    () => { allStaggerEls.forEach(el => { el.style.willChange = 'transform, opacity'; }); },
                    onComplete: () => { heroEntranceDone = true; allStaggerEls.forEach(el => { el.style.willChange = 'auto'; }); }
                })
                    .to(allStaggerEls, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.03 });
            }, 500);
        }
    });

    projects.forEach((p, i) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <canvas></canvas>
            <div class="card-overlay">
                <div class="card-title">${p.name}.</div>
            </div>
        `;
        world.appendChild(card);

        const canvas = card.querySelector('canvas');
        canvas.width  = 800;
        canvas.height = 500;
        const liquid = initLiquidImage(canvas, `https://picsum.photos/seed/${p.key}/1200/800`);
        const cardData = { el: card, index: i, hovered: false, liquid, canvas, _tiltXTarget: 0, _tiltYTarget: 0, _tiltX: 0, _tiltY: 0, _scale: 1, _filterOpacity: 1, _filterTargetVisible: true };
        if (liquid) {
            liquidRenderers.push(() => liquid.render());
            card.addEventListener('mousemove', (e) => {
                const rect = canvas.getBoundingClientRect();
                const nx = (e.clientX - rect.left) / rect.width;
                const ny = (e.clientY - rect.top) / rect.height;
                liquid.setMouse(nx, ny);
                cardData._tiltXTarget = (ny - 0.5) * -18;
                cardData._tiltYTarget = (nx - 0.5) *  22;
            });
        }

        card.addEventListener('mouseenter', () => { canvas.style.willChange = 'transform'; });
        canvas.addEventListener('transitionend',  () => { canvas.style.willChange = 'auto'; });

        card.addEventListener('click', () => {
            sessionStorage.setItem('portfolioScroll', lenis.scroll);
            lenis.stop();
            portfolioTransition.cover(0.65, () => {
                window.location.href = `/projet.html?id=${p.key}`;
            });
        });

        cards.push(cardData);
    });

    // Mobile (< 768px) : pas de hover, forcer toutes les cartes en couleur
    if (window.innerWidth < 768) {
        cards.forEach(item => { if (item.liquid) item.liquid.setHovered(1); item.hovered = true; });
    }

    let currentProgress = 0;

    // ─── SCROLL SNAP : description ↔ footer ────────────────────
    let isSnapping  = false;
    let snapLockY   = Infinity; // armé par onRevealComplete
    let snapBackY   = 0;

    const footerTopEl     = footer.querySelector('.footer-top');
    const footerPadTop    = parseInt(getComputedStyle(footer).paddingTop) || 0;
    const snapBandHeight  = footerTopEl ? Math.round(footerTopEl.offsetHeight + footerPadTop) : 100;
    const snapReturnOffset = snapBandHeight;

    const snapEase = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    function snapToFooter() {
        if (window.innerWidth < 768) return;
        isSnapping = true;
        snapBackY = lenis.scroll;
        lenis.scrollTo(footer, { duration: 1.4, easing: snapEase, onComplete: () => { isSnapping = false; } });
    }

    function snapToDesc() {
        if (window.innerWidth < 768) return;
        isSnapping = true;
        const safeY = Math.max(0, snapBackY - snapReturnOffset);
        lenis.scrollTo(safeY, { duration: 1.4, easing: snapEase, onComplete: () => {
            isSnapping = false;
            snapLockY  = safeY;
            snapFooterObserver.observe(footer);
        }});
    }

    const snapFooterObserver = new IntersectionObserver((entries) => {
        if (window.innerWidth < 768) return;
        if (entries[0].isIntersecting && !isSnapping) {
            snapFooterObserver.unobserve(footer);
            snapToFooter();
        }
    }, { threshold: 0, rootMargin: `0px 0px ${snapBandHeight}px 0px` });

    lenis.on('scroll', ({ scroll }) => {
        currentProgress = Math.min(Math.max(scroll / (lenis.limit || 1), 0), 1);
        const hintOpacity = gsap.utils.clamp(0, 0.75, gsap.utils.mapRange(0.60, 0.72, 0.75, 0, currentProgress));
        scrollHint.style.opacity = hintOpacity;
    });

    // Bloque le scroll pendant le snap + remontée depuis le footer (desktop uniquement)
    window.addEventListener('wheel', (e) => {
        if (window.innerWidth < 768) return;
        if (isSnapping) { e.preventDefault(); e.stopImmediatePropagation(); return; }
        const inFooter = footer.getBoundingClientRect().top <= 0;
        if (e.deltaY < 0 && inFooter && snapBackY > 0) { e.preventDefault(); e.stopImmediatePropagation(); snapToDesc(); }
    }, { passive: false, capture: true });

    function updateScene(globalProgress) {
        const textHoldLimit = 0.15;
        const entryLimit = 0.22;

        // Logo exit : t va de 0 (immobile) à 1 (hors écran)
        const explodeT = gsap.utils.clamp(0, 1, gsap.utils.mapRange(textHoldLimit, entryLimit, 0, 1, globalProgress));
        const e = explodeT * explodeT; // ease-in quadratique
        gsap.set(intro, { y: 0, opacity: 1, scale: 1 });

        const tornadoProgress = gsap.utils.clamp(0, 1, gsap.utils.mapRange(entryLimit, 1, 0, 1, globalProgress));

        const introVisible = tornadoProgress > 0 ? 0 : 1;
        if (tornadoProgress > 0 || heroEntranceDone) {
            gsap.set(introSubtitle, { opacity: introVisible, y: 0 });
        }
        if (logoFixed) {
            if (tornadoProgress > 0) {
                logoFixed.style.opacity   = '0.85';
                logoFixed.style.transform = 'translateX(-50%) translateY(0)';
            } else {
                logoFixed.style.opacity   = '0';
                logoFixed.style.transform = 'translateX(-50%) translateY(-18px)';
            }
        }
        const verticalGap = getVerticalGap();
        const limitY = window.innerHeight * 0.45;

        // Sous-ensemble de cartes actives selon le filtre
        const targetVisible = cards.filter(c => c._filterTargetVisible);
        const N = Math.max(1, targetVisible.length);
        const scrollMovement = (N - 1) * verticalGap + limitY + 450;

        const filtersBar = document.getElementById('project-filters');
        if (filtersBar) {
            const spinStop = N > 1 ? (N - 1) * verticalGap / scrollMovement : 1;
            const filtersVisible = tornadoProgress > 0 && tornadoProgress < spinStop;
            filtersBar.style.opacity       = filtersVisible ? '1' : '0';
            filtersBar.style.transform     = filtersVisible ? 'translateY(-50%) translateX(0)' : 'translateY(-50%) translateX(-14px)';
            filtersBar.style.pointerEvents = filtersVisible ? 'auto' : 'none';
        }

        if (introLogoImg && (tornadoProgress > 0 || heroEntranceDone)) {
            gsap.set(introLogoImg, { opacity: introVisible, y: 0 });
        }

        const cardsPerRevolution = 7;
        const angleStep = (Math.PI * 2) / cardsPerRevolution;
        const maxRotation = (N - 1) * angleStep;
        // Synchronise la vitesse de rotation avec le déplacement vertical :
        // la carte en façade (z max) passe toujours par Y=0
        const rotationSpeed = 2 * scrollMovement / (cardsPerRevolution * verticalGap);

        targetVisible.forEach((item, i) => {
            const rotationFactor = -(Math.min(tornadoProgress * Math.PI * rotationSpeed, maxRotation));
            const currentAngle = i * angleStep + rotationFactor;

            const x = Math.sin(currentAngle) * radius;
            const z = Math.cos(currentAngle) * radius;

            const tornadoY = i * verticalGap - tornadoProgress * scrollMovement;
            const entryY = gsap.utils.mapRange(0, entryLimit, window.innerHeight * 0.6, 0, globalProgress);

            const finalY = tornadoProgress > 0 ? tornadoY : entryY + i * verticalGap;
            const rotationY = currentAngle * 180 / Math.PI;

            let opacity = 1;
            if (Math.abs(finalY) > limitY) {
                opacity = Math.max(0, 1 - (Math.abs(finalY) - limitY) / 250);
            }

            const isBehind = z < 0;
            const blurAmount = isBehind ? Math.min(Math.abs(z / 150), 10) : 0;
            const bright = isBehind ? Math.max(0.2, 1 - Math.abs(z / (radius * 1.5))) : 1;

            const scaleTarget = item.hovered ? 1.06 : 1;
            item._scale  += (scaleTarget    - item._scale)  * 0.04;
            item._tiltX  += (item._tiltXTarget - item._tiltX) * 0.08;
            item._tiltY  += (item._tiltYTarget - item._tiltY) * 0.08;

            const finalOpacity = opacity * item._filterOpacity;
            gsap.set(item.el, {
                x, y: finalY, z,
                rotationX: item._tiltX,
                rotationY: rotationY + item._tiltY,
                scale: item._scale,
                opacity: finalOpacity,
                filter: `blur(${blurAmount}px) brightness(${bright})`,
                display: finalOpacity <= 0.01 ? 'none' : 'block',
                zIndex: Math.round(z + 1000)
            });
        });

        // Cartes filtrées : fade out sans modifier leur transform
        cards.forEach(item => {
            if (item._filterTargetVisible) return;
            if (item._filterOpacity <= 0.01) {
                gsap.set(item.el, { display: 'none', opacity: 0 });
            } else {
                gsap.set(item.el, { display: 'block', opacity: item._filterOpacity });
            }
        });
    }

    function updateHoverStates() {
        if (window.innerWidth < 768) return;
        const el = document.elementFromPoint(globalMouseX, globalMouseY);
        const cardUnder = el ? el.closest('.card') : null;
        cards.forEach(item => {
            const shouldHover = item.el === cardUnder;
            if (shouldHover === item.hovered) return;
            item.hovered = shouldHover;
            if (item.liquid) item.liquid.setHovered(shouldHover ? 1 : 0);
            if (!shouldHover) {
                item._tiltXTarget = 0;
                item._tiltYTarget = 0;
            }
        });
    }

    function applyFilter() {
        cards.forEach(c => {
            const proj = projects[c.index];
            const showAll = activeFilters.size === 0 || activeFilters.has('_tous');
            const visible = showAll || proj.categories.some(cat => activeFilters.has(cat));
            c._filterTargetVisible = visible;
            c._filterOpacity = visible ? 1 : 0;
        });
        sessionStorage.setItem('sicz_filters', JSON.stringify([...activeFilters]));
        document.querySelectorAll('.filter-btn').forEach(btn => {
            const f = btn.dataset.filter;
            const active = f === 'all' ? activeFilters.has('_tous') : activeFilters.has(f);
            btn.classList.toggle('is-active', active);
        });
    }

    let portfolioRafId = null;
    let portfolioRafVisible = true;
    function rafLoop() {
        updateHoverStates();
        updateScene(currentProgress);
        for (let i = 0; i < liquidRenderers.length; i++) liquidRenderers[i]();
        portfolioRafId = requestAnimationFrame(rafLoop);
    }
    function startPortfolioRaf() {
        if (!portfolioRafId && portfolioRafVisible && !document.hidden) {
            intro.style.willChange = 'transform, opacity';
            introLogoImg.style.willChange = 'transform, opacity';
            world.style.willChange = 'transform';
            cards.forEach(c => { c.el.style.willChange = 'transform, opacity'; });
            portfolioRafId = requestAnimationFrame(rafLoop);
        }
    }
    function stopPortfolioRaf() {
        if (portfolioRafId) {
            cancelAnimationFrame(portfolioRafId);
            portfolioRafId = null;
            intro.style.willChange = 'auto';
            introLogoImg.style.willChange = 'auto';
            world.style.willChange = 'auto';
            cards.forEach(c => { c.el.style.willChange = 'auto'; });
        }
    }
    const stickyViewport = document.querySelector('.sticky-viewport');

    // ─── FILTRES ────────────────────────────────────────────────
    const filterDefs = [
        { id: 'all',      label: 'Tous' },
        { id: 'branding', label: 'Branding' },
        { id: 'web',      label: 'Site Web' },
        { id: 'autres',   label: 'Autres' },
    ];
    const filtersEl = document.createElement('div');
    filtersEl.id = 'project-filters';
    filterDefs.forEach(({ id, label }) => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.dataset.filter = id;
        btn.textContent = label;
        btn.addEventListener('click', () => {
            if (id === 'all') {
                activeFilters = activeFilters.has('_tous') ? new Set() : new Set(['_tous']);
            } else {
                activeFilters = activeFilters.has(id) ? new Set() : new Set([id]);
            }
            applyFilter();
            const target = lenis.limit > 0 ? Math.ceil(lenis.limit * 0.22) : window.innerHeight * 2;
            lenis.scrollTo(target, { duration: 1.2 });
        });
        filtersEl.appendChild(btn);
    });
    if (stickyViewport) stickyViewport.appendChild(filtersEl);
    applyFilter();

    if (stickyViewport) {
        new IntersectionObserver((entries) => {
            portfolioRafVisible = entries[0].isIntersecting;
            if (portfolioRafVisible) startPortfolioRaf(); else stopPortfolioRaf();
        }, { threshold: 0 }).observe(stickyViewport);
    }
    startPortfolioRaf();
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopPortfolioRaf(); else startPortfolioRaf();
    });

    window.addEventListener('resize', () => { fitBigName(); radius = getRadius(); });

    initDescriptionReveal(lenis, (scrollY) => {
        snapLockY = scrollY;
        if (window.innerWidth >= 768) snapFooterObserver.observe(footer);
    });
}

// ─── PROJECT ────────────────────────────────────────────────────
if (isProject) {
    document.body.classList.add('is-project');
    // ─── DONNÉES ────────────────────────────────────────────────
    const PROJECTS = [
        {
            key: 'arobase', title: 'Arobase Systèmes', type: 'Identité visuelle & web', year: '2025',
            context: "J'ai bossé chez Arobase pendant mon stage (avril–juin 2025), puis je suis revenu en alternance dès septembre. Arobase est une agence web à Nancy qui fait du site, des réseaux et du graphisme pour des clients locaux : TPE, artisans, PME du Grand-Est.",
            objectives: ['Nouveau logo', 'Charte graphique', 'Site web', 'Réseaux sociaux'],
            creative: "Pascal voulait garder le renard mais en traits géométriques, dans l'esprit de Richard Orlinski. Ça cadrait pas mal ce que je pouvais faire. J'ai travaillé sur des grilles de construction pour que la tête soit parfaitement symétrique, testé plusieurs directions avant d'arriver à quelque chose de propre et déclinable. Pour le site, j'ai choisi une palette sombre qui tranche avec les agences web classiques, trop sages. Les réseaux ont suivi la même logique graphique que le logo.",
            palette: "Orange Mandarine #F68615 · Noir Pur #000000 · Blanc Pur #FFFFFF · Almost Black #222222",
            results: "Pascal a gagné des clients grâce au nouveau site, ce que l'ancien ne permettait pas.",
            hero: 'https://picsum.photos/seed/arobase-hero/1920/1080',
            images: ['https://picsum.photos/seed/arobase1/1600/900','https://picsum.photos/seed/arobase2/900/1100','https://picsum.photos/seed/arobase3/900/1100','https://picsum.photos/seed/arobase4/1600/900','https://picsum.photos/seed/arobase5/900/1100','https://picsum.photos/seed/arobase6/900/1100']
        },
        {
            key: 'bouchtri', title: 'Bouchtri', type: 'Identité visuelle & communication', year: '2025',
            context: "Projet scolaire de 50 heures en 3ème année. Bouchtri est une station de tri pour collectivités et entreprises : 4 bacs, un écran interactif, des capteurs qui analysent chaque déchet en temps réel, et un système de bonus/malus financier pour récompenser les bons gestes.",
            objectives: ['Logo et identité complète', 'Campagne print et digitale', 'Visuels du produit'],
            creative: "Le nom dit tout : « bouche » + « tri ». Le O remplacé par le symbole de recyclage, c'était une évidence. Pour les couleurs, j'avais pas envie de faire le vert écolo habituel, trop vu. Vert forêt profond pour le corps de la station, vert électrique pour les LED et l'écran. Le logo a deux versions pensées pour le produit lui-même : une horizontale pour la base, une empilée pour l'écran. La campagne a tourné autour d'un seul fil rouge : « Un geste. Une ville qui avance. »",
            palette: "Vert Forêt #13302a · Vert Électrique #23ff65",
            contribution: "Logo, charte, visuels du produit via IA, 5 visuels de campagne (4×3, abribus, réseaux, presse), 5 mockups, motion design 37 secondes sur After Effects avec voix off, landing page en vibe coding.",
            hero: 'https://picsum.photos/seed/bouchtri-hero/1920/1080',
            images: ['https://picsum.photos/seed/bouchtri1/1600/900','https://picsum.photos/seed/bouchtri2/900/1100','https://picsum.photos/seed/bouchtri3/900/1100','https://picsum.photos/seed/bouchtri4/1600/900','https://picsum.photos/seed/bouchtri5/900/1100','https://picsum.photos/seed/bouchtri6/900/1100']
        },
        {
            key: 'comedie', title: 'La Comédie des Fleurs', type: 'E-commerce & design web', year: '2025',
            context: "Client d'Arobase Systèmes. La Comédie des Fleurs est une boutique de fleurs à Épinal. L'ancien site était en full code, impossible à gérer pour elle au quotidien. En bonus : elle est partenaire d'un cimetière militaire américain à Épinal, ce qui a nécessité un deuxième site (Florist American Cemetery) entièrement en français et en anglais.",
            objectives: ['Migrer sur WordPress/WooCommerce', 'Intégrer 280 produits', 'Créer une ambiance florale immersive', 'Site enfant bilingue FR/EN'],
            creative: "Pour la Comédie des Fleurs, je voulais que le visiteur ait l'impression d'entrer dans la boutique depuis son écran. Beaucoup de photos, mise en page généreuse, palette végétale calée sur le logo existant. Pour Florist American Cemetery, c'est un autre registre : bleu et rouge du drapeau américain, sobre, pour une clientèle qui vient honorer des soldats enterrés en France. J'ai construit des fichiers CSV à la main pour importer les 280 produits, et mis en place Polylang pour la double langue avec traduction complète des slugs.",
            hero: 'https://picsum.photos/seed/comedie-hero/1920/1080',
            images: ['https://picsum.photos/seed/comedie1/1600/900','https://picsum.photos/seed/comedie2/900/1100','https://picsum.photos/seed/comedie3/900/1100','https://picsum.photos/seed/comedie4/1600/900','https://picsum.photos/seed/comedie5/900/1100','https://picsum.photos/seed/comedie6/900/1100']
        },
        {
            key: 'honey', title: 'Honey Coffee & Food', type: 'Design web', year: '2025',
            context: "My Digital Project en Bachelor 3ème année, équipe pluridisciplinaire. Honey est un restaurant brunch ouvert depuis 2022 à Nancy, avec une adresse à Metz et plus de 14 000 abonnés Instagram. L'ancien site ne faisait pas le job.",
            objectives: ["Site avec animations et effets au scroll", "Charte graphique à partir de l'identité existante", "Contenus réseaux et vidéos"],
            creative: "Zéro refonte logo, c'était la contrainte. J'ai construit la charte autour de ce qui existait déjà : noir, or, blanc. L'ambiance recherchée c'est chaud et un peu premium à la fois. Site réalisé en vibe coding avec effets au scroll, animations et un préloader pour poser l'ambiance dès l'entrée.",
            contribution: "Charte graphique, développement complet, intégration photos, préloader. Les réseaux et vidéos, c'était le reste du pôle créa. Le SEO était géré par le pôle marketing.",
            hero: 'https://picsum.photos/seed/honey-hero/1920/1080',
            images: ['https://picsum.photos/seed/honey1/1600/900','https://picsum.photos/seed/honey2/900/1100','https://picsum.photos/seed/honey3/900/1100','https://picsum.photos/seed/honey4/1600/900','https://picsum.photos/seed/honey5/900/1100','https://picsum.photos/seed/honey6/900/1100']
        },
        {
            key: 'slink', title: 's!Link', type: 'Identité visuelle', year: '2024',
            context: "1ère année Bachelor. Plateforme fictive de mise en relation freelances/clients, dans l'esprit de Malt, mais avec une identité qui ressemble pas aux autres.",
            creative: "4 triangles qui se rejoignent pour former un S. L'idée c'était de représenter des gens qui se connectent et créent ensemble. Violet et bleu nuit plutôt que les tons neutres habituels des plateformes freelance. La baseline « Connecter. Créer. Collaborer. » résume le concept en trois mots.",
            palette: "Violet Électrique #6528F7 · Lavande #D7BBF5 · Bleu Nuit #0D0975 · Altone Medium",
            hero: 'https://picsum.photos/seed/slink-hero/1920/1080',
            images: ['https://picsum.photos/seed/slink1/1600/900','https://picsum.photos/seed/slink2/900/1100','https://picsum.photos/seed/slink3/900/1100','https://picsum.photos/seed/slink4/1600/900','https://picsum.photos/seed/slink5/900/1100','https://picsum.photos/seed/slink6/900/1100']
        },
        {
            key: 'mankled', title: 'MANK.LED', type: 'Design web', year: '2025',
            context: "Client d'Arobase, cinquantaine d'heures. MANK.LED vend et pose de l'éclairage et du matériel électrique pour le spectacle, les forains et les collectivités.",
            creative: "Fond noir partout. Quand tu vends des produits qui s'allument, tu les mets sur fond noir. C'est ce que font les scènes de spectacle depuis toujours. Structure divisée par secteur d'activité pour que chaque visiteur trouve son truc rapidement.",
            hero: 'https://picsum.photos/seed/mankled-hero/1920/1080',
            images: ['https://picsum.photos/seed/mankled1/1600/900','https://picsum.photos/seed/mankled2/900/1100','https://picsum.photos/seed/mankled3/900/1100','https://picsum.photos/seed/mankled4/1600/900','https://picsum.photos/seed/mankled5/900/1100','https://picsum.photos/seed/mankled6/900/1100']
        },
        {
            key: 'auren', title: 'AUREN', type: 'UX/UI Design', year: '2025',
            context: "Cours UX/UI en 3ème année, moins de 20 heures. App fictive pour louer des voitures de collection pour des occasions spéciales : mariage, tournage, exposition.",
            creative: "Des voitures comme l'Aston Martin DB5 ou la Rolls-Royce Silver Cloud III, c'est des voitures qui font rêver. J'ai eu envie que la palette le reflète : poudre, lavande, crème. Des tons brumeux, presque oniriques. Pas ce qu'on attend d'une app de location de voitures, mais ça colle avec ce que ces voitures représentent. Visuels générés via IA pour rester dans ces tons. 14 écrans au total, de l'onboarding jusqu'au profil utilisateur.",
            palette: "Poudre · Lavande · Crème · Prune-noir · Cormorant Garamond + Jost Light",
            hero: 'https://picsum.photos/seed/auren-hero/1920/1080',
            images: ['https://picsum.photos/seed/auren1/1600/900','https://picsum.photos/seed/auren2/900/1100','https://picsum.photos/seed/auren3/900/1100','https://picsum.photos/seed/auren4/1600/900','https://picsum.photos/seed/auren5/900/1100','https://picsum.photos/seed/auren6/900/1100']
        },
        {
            key: 'myr', title: 'myr', type: 'Identité visuelle', year: '2024',
            context: "2ème année Bachelor, vingtaine d'heures. Marque fictive de cosmétiques au miel de sapin des Vosges.",
            creative: "Je suis vosgien, donc l'univers je le connais bien. La branche de sapin qui forme le Y de mYr, c'est venu assez naturellement. Vert forêt, miel doré, crème : les couleurs du territoire. Déclinaisons produits faites sur Photoshop avec des mockups.",
            hero: 'https://picsum.photos/seed/myr-hero/1920/1080',
            images: ['https://picsum.photos/seed/myr1/1600/900','https://picsum.photos/seed/myr2/900/1100','https://picsum.photos/seed/myr3/900/1100','https://picsum.photos/seed/myr4/1600/900','https://picsum.photos/seed/myr5/900/1100','https://picsum.photos/seed/myr6/900/1100']
        },
        {
            key: 'rcl', title: 'Rugby Club Lunévillois', type: 'Identité visuelle', year: '2024',
            context: "2ème année Bachelor, cinquantaine d'heures. Vrai client, plusieurs rendez-vous sur place. Club fondé en 1928 à Lunéville.",
            creative: "On a tous proposé un logo, le mien a été retenu. J'ai intégré les lunes de Lunéville dans le blason, c'est un symbole fort de la ville, ça avait du sens pour un club local. Bleu et jaune, les couleurs historiques. Ensuite : 3 versions de maillots, templates réseaux pour les scores et jours de match, flyer pour un afterwork.",
            hero: 'https://picsum.photos/seed/rcl-hero/1920/1080',
            images: ['https://picsum.photos/seed/rcl1/1600/900','https://picsum.photos/seed/rcl2/900/1100','https://picsum.photos/seed/rcl3/900/1100','https://picsum.photos/seed/rcl4/1600/900','https://picsum.photos/seed/rcl5/900/1100','https://picsum.photos/seed/rcl6/900/1100']
        },
        {
            key: 'clotures', title: 'Clôtures Béton Vosges', type: 'Design web', year: '2025',
            context: "Client d'Arobase, soixantaine d'heures. Vente et pose de clôtures béton et aménagements paysagers partout en France.",
            creative: "J'ai repris la charte du client sans la toucher. Site sobre et carré, adapté à un secteur où les clients veulent voir les réalisations et avoir un devis vite. J'ai aussi branché un plugin de synchro Facebook pour que ses publications alimentent automatiquement la section actualités, il n'avait pas envie de gérer deux endroits.",
            hero: 'https://picsum.photos/seed/clotures-hero/1920/1080',
            images: ['https://picsum.photos/seed/clotures1/1600/900','https://picsum.photos/seed/clotures2/900/1100','https://picsum.photos/seed/clotures3/900/1100','https://picsum.photos/seed/clotures4/1600/900','https://picsum.photos/seed/clotures5/900/1100','https://picsum.photos/seed/clotures6/900/1100']
        },
        {
            key: 'umami', title: 'Umami', type: 'Identité visuelle', year: '2024',
            context: "Projet scolaire géré comme une vraie mission agence, avec jalons de validation. Restaurant japonais fictif à Nancy.",
            creative: "Le brief disait clairement : pas de clichés. Pas de soleil rouge, pas de kanji décoratif. J'ai construit le logo avec des traits de pinceau qui forment la fleur de sakura, une référence au japonisme sans en faire trop. Pour la palette, j'ai évité le rouge et noir attendus : vert forêt, crème, miel. Ça donne quelque chose de plus calme, plus contemporain. Flyers recto/verso avec un système saisonnier réplicable.",
            palette: "Vert Forêt #3C4D31 · Crème #EDEBCE · Vert Clair #C4FAA0 · Brun Chaud #452A1C · Mak",
            hero: 'https://picsum.photos/seed/umami-hero/1920/1080',
            images: ['https://picsum.photos/seed/umami1/1600/900','https://picsum.photos/seed/umami2/900/1100','https://picsum.photos/seed/umami3/900/1100','https://picsum.photos/seed/umami4/1600/900','https://picsum.photos/seed/umami5/900/1100','https://picsum.photos/seed/umami6/900/1100']
        },
        {
            key: 'affiches', title: 'Explorations print', type: 'Print & illustration', year: '2024 – 2025',
            context: "Six affiches, six univers. Du brief client à l'exploration personnelle.",
            creative: "Nancy Handball « Puissance Sept » — affiche pour le pass mi-saison. « Puissance Sept » = 7 matchs dans le pass, 7 joueurs sur le terrain. Joueur en célébration devant une typo massive dorée. Marine et or, les couleurs du club.\n\nSalon du Randonneur « L'Appel de l'Évasion » — double affiche pour l'ouverture du salon à Lyon en mars 2026. Technique de double exposition : un visage qui se fond dans un paysage. Deux versions — orange et volcanique pour la femme, bleu montagne pour l'homme.\n\nMercedes 190E — j'aime les vieilles mécaniques. Typo 3D liquide turquoise sur la carrosserie grise de la 190E. Le but c'était de faire quelque chose de moderne sur une voiture des années 90.\n\nToyota GT86 — surnommée « Hachiroku » en japonais. Noir et blanc, rouge sang, culture JDM. Pas d'artifice — juste l'ambiance de la voiture.\n\nMenace — Halloween. Personnage en costume avec une citrouille en tête, éclairs néon orange, fond texturé. L'idée c'était de faire quelque chose qui ressemble à une affiche de film, pas à une déco de supermarché.\n\nL'Illusion des Masques — affiche pour une soirée étudiante le 17 octobre. Masque vénitien 3D, typo liquide or et noir, fond marbre. Je voulais que ça ressemble à une affiche de spectacle plutôt qu'à un flyer étudiant.",
            hero: 'https://picsum.photos/seed/affiches-hero/1920/1080',
            images: ['https://picsum.photos/seed/affiches1/1600/900','https://picsum.photos/seed/affiches2/900/1100','https://picsum.photos/seed/affiches3/900/1100','https://picsum.photos/seed/affiches4/1600/900','https://picsum.photos/seed/affiches5/900/1100','https://picsum.photos/seed/affiches6/900/1100']
        },
    ];

    // ─── ROUTING ────────────────────────────────────────────────
    const params      = new URLSearchParams(window.location.search);
    const projectId   = params.get('id') || window.location.pathname.match(/\/projets\/([^/]+)/)?.[1];
    const currentKey  = (projectId || 'cairo').toLowerCase();
    const currentIdx  = PROJECTS.findIndex(p => p.key === currentKey);
    const project     = PROJECTS[Math.max(0, currentIdx)];
    const prevProject = currentIdx > 0 ? PROJECTS[currentIdx - 1] : null;
    const nextProject = currentIdx < PROJECTS.length - 1 ? PROJECTS[currentIdx + 1] : null;

    // ─── RENDER ─────────────────────────────────────────────────
    // Titres avec lettres en Apple Garamond Bold Italic (pattern: pre-ag + ag)
    const AG_TITLES = {
        arobase:  `Ar<span class="ag">ob</span>ase Systèmes`,
        bouchtri: `B<span class="ag">ou</span>chtri`,
        comedie:  `La Com<span class="ag">éd</span>ie des Fleurs`,
        honey:    `H<span class="ag">on</span>ey Coffee & Food`,
        slink:    `s!<span class="ag">Li</span>nk`,
        mankled:  `MAN<span class="ag">K.</span>LED`,
        auren:    `A<span class="ag">ur</span>en`,
        myr:      `m<span class="ag">yr</span>`,
        rcl:      `Rug<span class="ag">by</span> Club Lunévillois`,
        clotures: `Cl<span class="ag">ôt</span>ures Béton Vosges`,
        umami:    `Um<span class="ag">am</span>i`,
        affiches: `Explor<span class="ag">at</span>ions print`,
    };

    const AG_STATEMENTS = {
        arobase:  `Le <span class="ag">logo</span> ne passait plus. Le <span class="ag">site</span> non plus. Tout était à <span class="ag">refaire.</span>`,
        bouchtri: `Une <span class="ag">poubelle</span> connectée avec de l'IA dedans. Pas le brief le plus <span class="ag">banal.</span>`,
        comedie:  `<span class="ag">280</span> produits. Deux <span class="ag">sites.</span> Deux <span class="ag">langues.</span> Plus de <span class="ag">100</span> heures.`,
        honey:    `Le client ne voulait pas toucher à son <span class="ag">logo.</span> Juste un site qui donne envie de <span class="ag">bruncher.</span>`,
        slink:    `Une <span class="ag">plateforme</span> freelance avec une <span class="ag">identité</span> qui ressemble pas aux autres.`,
        mankled:  `Quand tu vends des <span class="ag">produits</span> qui s'allument, tu les mets sur <span class="ag">fond</span> noir.`,
        auren:    `Des voitures qui font <span class="ag">rêver.</span> Une <span class="ag">palette</span> qui reflète ça.`,
        myr:      `<span class="ag">Cosmétiques</span> au miel de <span class="ag">sapin</span> des Vosges. L'univers, je le connais <span class="ag">bien.</span>`,
        rcl:      `Un <span class="ag">logo</span> pour un club fondé en 1928 à Lunéville. Le mien a été <span class="ag">retenu.</span>`,
        clotures: `Un secteur où les clients veulent voir les <span class="ag">réalisations</span> et avoir un <span class="ag">devis</span> vite.`,
        umami:    `Pas de <span class="ag">clichés.</span> Pas de soleil rouge, pas de <span class="ag">kanji</span> décoratif.`,
        affiches: `<span class="ag">Explorations</span> print. De l'affiche <span class="ag">sportive</span> au flyer <span class="ag">étudiant.</span>`,
    };

    document.title = `${project.title} — s!cz`;
    document.getElementById('navName').textContent        = project.title;
    document.getElementById('heroImg').src                = project.hero;
    document.getElementById('heroImg').alt                = project.title;
    document.getElementById('projectMeta').textContent    = `${project.type} — ${project.year}`;
    document.getElementById('projectTitle').innerHTML     = AG_TITLES[project.key] || project.title;
    document.getElementById('projectStatement').innerHTML = AG_STATEMENTS[project.key] || '';
    document.getElementById('projectDesc').textContent    = project.context || '';
    document.getElementById('projectType').textContent    = project.type;
    document.getElementById('projectYear').textContent    = project.year;

    const infoBody = document.querySelector('.project-info-body');
    const infoMeta = document.querySelector('.project-info-meta');

    function addSection(container, labelText, text) {
        const label = document.createElement('p');
        label.className = 'project-section-label';
        label.textContent = labelText;
        const para = document.createElement('p');
        para.className = 'project-description';
        para.style.whiteSpace = 'pre-line';
        para.textContent = text;
        container.appendChild(label);
        container.appendChild(para);
    }

    if (project.creative)     addSection(infoBody, 'Cheminement créatif', project.creative);
    if (project.palette)      addSection(infoBody, 'Charte graphique', project.palette);
    if (project.results)      addSection(infoBody, 'Résultats', project.results);
    if (project.contribution) addSection(infoBody, 'Ma contribution', project.contribution);

    if (project.objectives && project.objectives.length) {
        const label = document.createElement('p');
        label.className = 'project-info-tag';
        label.textContent = 'Objectifs';
        const ul = document.createElement('ul');
        ul.className = 'project-objectives';
        project.objectives.forEach(obj => {
            const li = document.createElement('li');
            li.textContent = obj;
            ul.appendChild(li);
        });
        infoMeta.appendChild(label);
        infoMeta.appendChild(ul);
    }

    const navPrev = document.getElementById('navPrev');
    const navNext = document.getElementById('navNext');
    if (prevProject) { navPrev.href = `/projet.html?id=${prevProject.key}`; }
    else { navPrev.removeAttribute('href'); navPrev.classList.add('disabled'); }
    if (nextProject) { navNext.href = `/projet.html?id=${nextProject.key}`; }
    else { navNext.removeAttribute('href'); navNext.classList.add('disabled'); }

    const bottomPrev = document.getElementById('bottomPrev');
    const bottomNext = document.getElementById('bottomNext');
    if (prevProject) { bottomPrev.href = `/projet.html?id=${prevProject.key}`; document.getElementById('bottomPrevTitle').innerHTML = AG_TITLES[prevProject.key] || prevProject.title; }
    else { bottomPrev.style.visibility = 'hidden'; }
    if (nextProject) { bottomNext.href = `/projet.html?id=${nextProject.key}`; document.getElementById('bottomNextTitle').innerHTML = AG_TITLES[nextProject.key] || nextProject.title; }
    else { bottomNext.style.visibility = 'hidden'; }

    // ─── GALERIE ────────────────────────────────────────────────
    const gallery = document.getElementById('projectGallery');

    // Détecte portrait vs paysage depuis l'URL (ex: /900/1100)
    function imgIsPortrait(url) {
        const m = url.match(/\/(\d+)\/(\d+)(?:[/?#]|$)/);
        return m ? parseInt(m[1]) < parseInt(m[2]) : false;
    }

    // Groupe les portraits consécutifs en paires, le reste en full
    const groups = [];
    let gi = 0;
    while (gi < project.images.length) {
        if (imgIsPortrait(project.images[gi]) &&
            gi + 1 < project.images.length &&
            imgIsPortrait(project.images[gi + 1])) {
            groups.push({ layout: 'pair', imgs: [project.images[gi], project.images[gi + 1]] });
            gi += 2;
        } else {
            groups.push({ layout: 'full', imgs: [project.images[gi]] });
            gi++;
        }
    }

    let gHtml = '';
    groups.forEach((group, idx) => {
        if (idx > 0) gHtml += `<div class="gallery-spacer"></div>`;
        if (group.layout === 'full') {
            gHtml += `<div class="gallery-full"><canvas data-src="${group.imgs[0]}" data-w="1200" data-h="675"></canvas></div>`;
        } else {
            gHtml += `<div class="gallery-pair">` +
                `<canvas data-src="${group.imgs[0]}" data-w="700" data-h="858"></canvas>` +
                `<canvas data-src="${group.imgs[1]}" data-w="700" data-h="858"></canvas>` +
            `</div>`;
        }
    });
    gallery.innerHTML = gHtml;

    // Liquid distort sur chaque canvas
    const galleryLiquids = [];
    gallery.querySelectorAll('canvas[data-src]').forEach(canvas => {
        canvas.width  = parseInt(canvas.dataset.w);
        canvas.height = parseInt(canvas.dataset.h);
        const liquid  = initLiquidDistort(canvas, canvas.dataset.src);
        if (!liquid) {
            const img = document.createElement('img');
            img.src = canvas.dataset.src; img.loading = 'lazy';
            img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
            canvas.replaceWith(img); return;
        }
        galleryLiquids.push(liquid);
        canvas.addEventListener('mousemove', e => {
            const r = canvas.getBoundingClientRect();
            liquid.setMouse((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
        });
        canvas.addEventListener('mouseenter', () => liquid.setHovered(1));
        canvas.addEventListener('mouseleave', () => { liquid.setHovered(0); liquid.setMouse(-1, -1); });
    });

    // Reveal au scroll
    initGalleryReveal();

    // RAF loop galerie
    let galleryRafId = null;
    let galleryRafVisible = true;
    function galleryRender() {
        galleryLiquids.forEach(l => l.render());
        galleryRafId = requestAnimationFrame(galleryRender);
    }
    function startGalleryRaf() {
        if (!galleryRafId && galleryRafVisible && !document.hidden) galleryRafId = requestAnimationFrame(galleryRender);
    }
    function stopGalleryRaf() {
        if (galleryRafId) { cancelAnimationFrame(galleryRafId); galleryRafId = null; }
    }
    new IntersectionObserver((entries) => {
        galleryRafVisible = entries[0].isIntersecting;
        if (galleryRafVisible) startGalleryRaf(); else stopGalleryRaf();
    }, { threshold: 0 }).observe(gallery);
    startGalleryRaf();
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopGalleryRaf(); else startGalleryRaf();
    });

    // ─── TRANSITION LIQUID ──────────────────────────────────────
    const transition = initLiquidTransition();

    // Révèle la page à l'arrivée
    runPreloader(() => transition.reveal(0.9));

    function navigateTo(url) {
        lenis.stop();
        transition.cover(0.65, () => { window.location.href = url; });
    }

    // ─── SNAP SCROLL → FOOTER ───────────────────────────────────────────────
    let projectIsSnapping = false;
    const projectSnapEase = t => t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
    let projectSnapLockY = Infinity;

    const projectNav = document.querySelector('.project-nav');
    function setNavVisible(v) {
        if (projectNav) projectNav.style.opacity = v ? '1' : '0';
    }

    function snapProjectToFooter() {
        if (window.innerWidth < 768) return;
        projectIsSnapping = true;
        projectSnapLockY = lenis.scroll;
        setNavVisible(false);
        lenis.scrollTo(footer, { duration: 1.4, easing: projectSnapEase, onComplete: () => { projectIsSnapping = false; } });
    }

    function snapProjectBack() {
        if (window.innerWidth < 768) return;
        projectIsSnapping = true;
        const safeY = Math.max(0, projectSnapLockY - 20);
        lenis.scrollTo(safeY, { duration: 1.4, easing: projectSnapEase, onComplete: () => {
            projectSnapLockY = Infinity;
            projectIsSnapping = false;
            setNavVisible(true);
            projectSnapFooterObserver.observe(footer);
        }});
    }

    const projectSnapFooterObserver = new IntersectionObserver((entries) => {
        if (window.innerWidth < 768) return;
        if (entries[0].isIntersecting && !projectIsSnapping) {
            projectSnapFooterObserver.unobserve(footer);
            snapProjectToFooter();
        }
    }, { threshold: 0, rootMargin: '0px 0px 0px 0px' });
    if (window.innerWidth >= 768) projectSnapFooterObserver.observe(footer);

    // Bloque le scroll pendant le snap + remontée depuis le footer (desktop uniquement)
    window.addEventListener('wheel', (e) => {
        if (window.innerWidth < 768) return;
        if (projectIsSnapping) { e.preventDefault(); e.stopImmediatePropagation(); return; }
        const inFooter = footer && footer.getBoundingClientRect().top <= 10;
        if (inFooter && e.deltaY < 0 && projectSnapLockY < Infinity) {
            e.preventDefault(); e.stopImmediatePropagation();
            snapProjectBack();
        }
    }, { passive: false, capture: true });

    // Interception des liens internes
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        const href = link.getAttribute('href');
        if (!href || href === '#' || link.classList.contains('disabled')) return;
        if (href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel')) return;
        e.preventDefault();
        navigateTo(href);
    });

    window.addEventListener('resize', fitBigName);
}

// ─── SHARED: PRELOADER + SNAP (pages légales et autres) ─────
if (!isPortfolio && !isProject) {
    const isLegal = !!document.querySelector('.legal-hero, .about-hero');

    runPreloader(() => {});

    if (isLegal) {
        let legalIsSnapping = false;
        const legalSnapEase = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        let legalSnapLockY = Infinity;

        const legalNav = document.querySelector('.project-nav');
        function setLegalNavVisible(v) {
            if (legalNav) legalNav.style.opacity = v ? '1' : '0';
        }

        function snapLegalToFooter() {
            if (window.innerWidth < 768) return;
            legalIsSnapping = true;
            legalSnapLockY = lenis.scroll;
            setLegalNavVisible(false);
            lenis.scrollTo(footer, { duration: 1.4, easing: legalSnapEase, onComplete: () => { legalIsSnapping = false; } });
        }

        function snapLegalBack() {
            if (window.innerWidth < 768) return;
            legalIsSnapping = true;
            const safeY = Math.max(0, legalSnapLockY - 20);
            lenis.scrollTo(safeY, { duration: 1.4, easing: legalSnapEase, onComplete: () => {
                legalSnapLockY = Infinity;
                legalIsSnapping = false;
                setLegalNavVisible(true);
                legalSnapFooterObserver.observe(footer);
            }});
        }

        const legalSnapFooterObserver = new IntersectionObserver((entries) => {
            if (window.innerWidth < 768) return;
            if (entries[0].isIntersecting && !legalIsSnapping) {
                legalSnapFooterObserver.unobserve(footer);
                snapLegalToFooter();
            }
        }, { threshold: 0 });
        if (window.innerWidth >= 768) legalSnapFooterObserver.observe(footer);

        window.addEventListener('wheel', (e) => {
            if (window.innerWidth < 768) return;
            if (legalIsSnapping) { e.preventDefault(); e.stopImmediatePropagation(); return; }
            const inFooter = footer && footer.getBoundingClientRect().top <= 10;
            if (inFooter && e.deltaY < 0 && legalSnapLockY < Infinity) {
                e.preventDefault(); e.stopImmediatePropagation();
                snapLegalBack();
            }
        }, { passive: false, capture: true });
    }
}
