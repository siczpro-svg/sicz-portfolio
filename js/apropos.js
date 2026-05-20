// Timeline Parcours — wheel hijack + flip scroll-driven + float + tilt
(function () {
    'use strict';

    var tlOuter = document.getElementById('tlOuter');
    var tlTrack = document.getElementById('tlTrack');
    if (!tlOuter || !tlTrack) return;

    var viewport   = tlOuter.querySelector('.tl-track-viewport');
    var cards      = Array.from(tlTrack.querySelectorAll('.tl-card'));
    var inners     = cards.map(function (c) { return c.querySelector('.tl-card-inner'); });
    var CARD_COUNT = cards.length;
    if (!CARD_COUNT || !viewport) return;

    // ─── Typewriter — indépendant par carte, annulable ───────────────────────
    var twDone = new Array(CARD_COUNT).fill(false);
    var twGen  = new Array(CARD_COUNT).fill(0);

    function triggerTypewriter(idx) {
        if (twDone[idx]) return;
        twDone[idx] = true;
        var gen    = ++twGen[idx];
        var lines  = Array.from(cards[idx].querySelectorAll('.tl-tl'));
        var cursor = cards[idx].querySelector('.tl-term-cursor');
        if (!lines.length) return;
        if (cursor) cursor.style.display = 'inline';
        var li = 0;
        function nextLine() {
            if (twGen[idx] !== gen) return;
            if (li >= lines.length) {
                if (cursor) cursor.style.display = 'none';
                return;
            }
            var el   = lines[li];
            var full = el.dataset.text || '';
            el.textContent = '';
            var ci    = 0;
            var delay = el.classList.contains('tl-tl--sep') ? 4 : 8;
            var timer = setInterval(function () {
                if (twGen[idx] !== gen) { clearInterval(timer); return; }
                if (ci < full.length) {
                    el.textContent += full[ci++];
                } else {
                    clearInterval(timer);
                    li++;
                    setTimeout(nextLine, el.classList.contains('tl-tl--sep') ? 20 : 30);
                }
            }, delay);
        }
        nextLine();
    }

    function resetTypewriter(idx) {
        if (!twDone[idx]) return;
        twDone[idx] = false;
        twGen[idx]++;
        var lines  = Array.from(cards[idx].querySelectorAll('.tl-tl'));
        var cursor = cards[idx].querySelector('.tl-term-cursor');
        lines.forEach(function (el) { el.textContent = ''; });
        if (cursor) cursor.style.display = 'none';
    }

    // ─── MOBILE ──────────────────────────────────────────────────────────────
    if (window.innerWidth < 768) {
        inners.forEach(function (inner) {
            if (inner) inner.style.transform = 'rotateY(0deg)';
        });

        var mobileObs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var card = entry.target;
                mobileObs.unobserve(card);
                var idx = parseInt(card.dataset.idx || '0', 10);
                setTimeout(function () {
                    card.classList.add('tl-revealed');
                    triggerTypewriter(idx);
                }, idx * 150);
            });
        }, { threshold: 0.15 });

        cards.forEach(function (card) { mobileObs.observe(card); });
        return;
    }

    // ─── DESKTOP ─────────────────────────────────────────────────────────────

    // État initial : verso visible
    inners.forEach(function (inner) {
        if (inner) inner.style.transform = 'rotateY(180deg)';
    });

    // ─── Float + Tilt (RAF) ───────────────────────────────────────────────────
    var TWO_PI = Math.PI * 2;
    var states = cards.map(function (_, i) {
        return {
            phase:       i * (TWO_PI / CARD_COUNT),
            tiltX:       0, targetTiltX: 0,
            tiltY:       0, targetTiltY: 0
        };
    });

    function animateFloat() {
        var t = performance.now() / 1000;
        for (var i = 0; i < CARD_COUNT; i++) {
            var s      = states[i];
            var floatY = Math.sin(t * 0.6 + s.phase) * 28;
            s.tiltX   += (s.targetTiltX - s.tiltX) * 0.08;
            s.tiltY   += (s.targetTiltY - s.tiltY) * 0.08;
            cards[i].style.opacity = '1';
            cards[i].style.transform =
                'translateY(' + floatY.toFixed(2) + 'px) ' +
                'rotateX(' + s.tiltX.toFixed(3) + 'deg) ' +
                'rotateY(' + s.tiltY.toFixed(3) + 'deg)';
        }
        requestAnimationFrame(animateFloat);
    }
    animateFloat();

    // Tilt au survol
    cards.forEach(function (card, i) {
        card.addEventListener('mousemove', function (e) {
            var rect = card.getBoundingClientRect();
            var dx   = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
            var dy   = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
            states[i].targetTiltX = -dy * 8;
            states[i].targetTiltY =  dx * 12;
        });
        card.addEventListener('mouseleave', function () {
            states[i].targetTiltX = 0;
            states[i].targetTiltY = 0;
        });
    });

    // ─── Flip basé sur la position dans le viewport ──────────────────────────
    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function updateFlip() {
        var vpRect    = viewport.getBoundingClientRect();
        var vw        = vpRect.width;
        var flipZone  = vw * 0.55; // distance de scroll pour passer de verso à recto

        for (var i = 0; i < CARD_COUNT; i++) {
            var cardLeft = cards[i].getBoundingClientRect().left - vpRect.left;

            // fp = 0 quand le bord gauche de la carte est au bord droit du viewport
            // fp = 1 quand la carte a avancé de flipZone vers la gauche
            var fp    = Math.max(0, Math.min(1, (vw - cardLeft) / flipZone));
            var eased = easeInOutCubic(fp);
            var peakX = Math.sin(fp * Math.PI) * 14;

            if (inners[i]) {
                inners[i].style.transform =
                    'rotateY(' + (180 - eased * 180).toFixed(2) + 'deg) ' +
                    'rotateX(' + peakX.toFixed(2) + 'deg)';
            }
            if (fp >= 0.55) {
                triggerTypewriter(i);
            } else if (fp < 0.4) {
                resetTypewriter(i);
            }
        }
    }

    viewport.addEventListener('scroll', function () {
        if (!rafId) updateFlip();
    }, { passive: true });

    // ─── Wheel hijack horizontal ─────────────────────────────────────────────
    var isActive = false;
    var targetX  = 0;
    var rafId    = null;

    function tick() {
        var diff = targetX - viewport.scrollLeft;
        if (Math.abs(diff) > 0.5) {
            viewport.scrollLeft += diff * 0.12;
            updateFlip();
            rafId = requestAnimationFrame(tick);
        } else {
            viewport.scrollLeft = targetX;
            updateFlip();
            rafId = null;
        }
    }

    function checkCentered() {
        var rect          = tlOuter.getBoundingClientRect();
        var sectionCenter = rect.top + rect.height / 2;
        var vpCenter      = window.innerHeight / 2;
        var wasActive     = isActive;
        // Active uniquement si le centre de la section est dans ±20 % du centre du viewport
        isActive = Math.abs(sectionCenter - vpCenter) < window.innerHeight * 0.2;
        if (isActive && !wasActive) { targetX = viewport.scrollLeft; updateFlip(); }
    }

    if (window.lenis) {
        window.lenis.on('scroll', checkCentered);
    } else {
        window.addEventListener('scroll', checkCentered, { passive: true });
    }
    checkCentered();

    window.addEventListener('wheel', function (e) {
        if (!isActive) return;

        var maxScroll = viewport.scrollWidth - viewport.clientWidth;
        if (maxScroll <= 0) return;

        var atStart = targetX <= 0        && e.deltaY < 0;
        var atEnd   = targetX >= maxScroll && e.deltaY > 0;

        if (atStart || atEnd) return;

        e.preventDefault();
        e.stopImmediatePropagation();

        targetX = Math.max(0, Math.min(maxScroll, targetX + e.deltaY));
        if (!rafId) rafId = requestAnimationFrame(tick);
    }, { passive: false, capture: true });

})();
