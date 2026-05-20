// ─── LIQUID RENDERERS ────────────────────────────────────────────────────────
const liquidRenderers = [];

// ─── LIQUID IMAGE (WebGL) ────────────────────────────────────────────────────
function initLiquidImage(canvas, src, strength = 0.06, speed = 0.14, radius = 0.14) {
    const gl = canvas.getContext('webgl');
    if (!gl) return null;

    const vertSrc = `
        attribute vec2 a_position;
        attribute vec2 a_uv;
        varying vec2 v_uv;
        void main() {
            v_uv = a_uv;
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;
    // Aspect ratio du canvas (800/500)
    const aspect = canvas.width / canvas.height;
    const fragSrc = `
        precision mediump float;
        uniform sampler2D u_texture;
        uniform float u_time;
        uniform float u_strength;
        uniform vec2  u_mouse;    // position curseur en UV [0,1]
        uniform float u_hovered;  // 0.0 → 1.0, animé en JS
        uniform float u_radius;   // rayon de l'effet en UV
        uniform float u_aspect;
        varying vec2 v_uv;
        void main() {
            // Distance au curseur, corrigée pour l'aspect ratio
            vec2 diff = v_uv - u_mouse;
            diff.x *= u_aspect;
            float dist = length(diff);

            // Falloff local (distorsion uniquement près du curseur)
            float distortFalloff = smoothstep(u_radius, 0.0, dist) * u_hovered;

            // Distorsion liquid uniquement dans la zone du curseur
            vec2 uv = v_uv;
            uv.x += sin(uv.y * 10.0 + u_time) * u_strength * distortFalloff;
            uv.y += cos(uv.x * 10.0 + u_time) * u_strength * distortFalloff;

            vec4 color = texture2D(u_texture, uv);

            // Cercle de couleur qui grandit depuis le curseur
            float growRadius = u_hovered * 2.1 - 0.22;
            float edge = 0.06;
            float colorBlend = clamp(1.0 - smoothstep(growRadius - edge, growRadius + edge, dist), 0.0, 1.0);
            float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));
            vec3 gray  = vec3(luma) * 0.55;
            vec3 final = mix(gray, color.rgb, colorBlend);

            gl_FragColor = vec4(final, color.a);
        }
    `;

    function compileShader(type, src) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        return shader;
    }

    const program = gl.createProgram();
    gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vertSrc));
    gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fragSrc));
    gl.linkProgram(program);
    gl.useProgram(program);

    const positions = new Float32Array([-1,-1, 1,-1, -1,1, 1,-1, 1,1, -1,1]);
    const uvs       = new Float32Array([ 0, 1, 1, 1,  0,0, 1, 1, 1,0,  0,0]);

    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uvBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    const uvLoc = gl.getAttribLocation(program, 'a_uv');
    gl.enableVertexAttribArray(uvLoc);
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,255]));

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    };

    const timeLoc     = gl.getUniformLocation(program, 'u_time');
    const strengthLoc = gl.getUniformLocation(program, 'u_strength');
    const mouseLoc    = gl.getUniformLocation(program, 'u_mouse');
    const hoveredLoc  = gl.getUniformLocation(program, 'u_hovered');
    const radiusLoc   = gl.getUniformLocation(program, 'u_radius');
    const aspectLoc   = gl.getUniformLocation(program, 'u_aspect');
    gl.uniform1f(strengthLoc, strength);
    gl.uniform1f(radiusLoc, radius);
    gl.uniform1f(aspectLoc, aspect);
    gl.uniform2f(mouseLoc, 0.5, 0.5);

    let mouseX = 0.5, mouseY = 0.5;
    let hoveredTarget = 0, hoveredCurrent = 0;

    const start = performance.now();
    return {
        setMouse(x, y) { mouseX = x; mouseY = y; },
        setHovered(v)  { hoveredTarget = v; },
        render() {
            hoveredCurrent += (hoveredTarget - hoveredCurrent) * 0.030;
            const elapsed = (performance.now() - start) / 1000;
            gl.uniform1f(timeLoc, elapsed * speed * 10);
            gl.uniform2f(mouseLoc, mouseX, mouseY);
            gl.uniform1f(hoveredLoc, hoveredCurrent);
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
    };
}

// ─── LIQUID TRANSITION ───────────────────────────────────────────────────────
function initLiquidTransition() {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:9999;pointer-events:none;';
    document.body.appendChild(canvas);

    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) return { reveal: () => {}, cover: (_d, cb) => cb && cb() };

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const vert = `attribute vec2 a_pos;attribute vec2 a_uv;varying vec2 v_uv;void main(){v_uv=a_uv;gl_Position=vec4(a_pos,0.0,1.0);}`;
    const frag = `
        precision mediump float;
        uniform float u_progress;
        uniform float u_time;
        varying vec2 v_uv;
        float hash(vec2 p){p=fract(p*vec2(127.1,311.7));p+=dot(p,p+45.32);return fract(p.x*p.y);}
        float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
        float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.0+vec2(1.7,9.2);a*=0.5;}return v;}
        void main(){
            vec2 uv=v_uv;
            vec2 q=vec2(fbm(uv*2.5+u_time*0.10),fbm(uv*2.5+vec2(5.2,1.3)+u_time*0.08));
            float n=fbm(uv*3.0+q*0.7);
            float edge=0.07;
            float threshold=u_progress*(1.0+edge*2.0)-edge;
            float alpha=1.0-smoothstep(threshold-edge,threshold+edge,n);
            gl_FragColor=vec4(0.0,0.0,0.0,alpha);
        }`;

    function compile(type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src); gl.compileShader(s); return s;
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vert));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog); gl.useProgram(prog);

    const pb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,-1,1,1,-1,1]), gl.STATIC_DRAW);
    const pl = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(pl); gl.vertexAttribPointer(pl, 2, gl.FLOAT, false, 0, 0);

    const ub = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, ub);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,1,1,1,0,0,1,1,1,0,0,0]), gl.STATIC_DRAW);
    const ul = gl.getAttribLocation(prog, 'a_uv');
    gl.enableVertexAttribArray(ul); gl.vertexAttribPointer(ul, 2, gl.FLOAT, false, 0, 0);

    const pLoc = gl.getUniformLocation(prog, 'u_progress');
    const tLoc = gl.getUniformLocation(prog, 'u_time');

    let prog_ = 0, time = 0, lastTs = performance.now(), rafId = null;
    const obj = { p: 0 };

    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);

    function tick() {
        const now = performance.now();
        time += (now - lastTs) / 1000; lastTs = now;
        gl.uniform1f(pLoc, prog_); gl.uniform1f(tLoc, time);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 6);
        rafId = requestAnimationFrame(tick);
    }
    function stop() { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }

    return {
        reveal(duration) {
            prog_ = 1; obj.p = 1; lastTs = performance.now(); tick();
            gsap.to(obj, { p: 0, duration, ease: 'power2.inOut',
                onUpdate: () => { prog_ = obj.p; },
                onComplete: stop });
        },
        cover(duration, onComplete) {
            prog_ = 0; obj.p = 0; lastTs = performance.now(); tick();
            gsap.to(obj, { p: 1, duration, ease: 'power2.inOut',
                onUpdate: () => { prog_ = obj.p; },
                onComplete: () => { stop(); onComplete && onComplete(); } });
        }
    };
}

// ─── DESCRIPTION REVEAL ──────────────────────────────────────────────────────
function initDescriptionReveal(lenis, onRevealComplete) {
    const lines = Array.from(document.querySelectorAll('.description-line'));
    if (!lines.length) return;

    const sequence = [];
    lines.forEach(container => {
        // Tokenise: flatten child nodes en liste de { type:'char', value } ou { type:'span', el }
        const tokens = [];
        Array.from(container.childNodes).forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                node.textContent.split('').forEach(ch => tokens.push({ type: 'char', value: ch }));
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                tokens.push({ type: 'span', el: node });
            }
        });

        container.innerHTML = '';

        let wordTokens = [];
        function flushWord() {
            if (!wordTokens.length) return;
            const wordSpan = document.createElement('span');
            wordSpan.className = 'reveal-word';
            wordTokens.forEach(tok => {
                if (tok.type === 'char') {
                    const charSpan = document.createElement('span');
                    charSpan.className = 'reveal-char';
                    charSpan.textContent = tok.value;
                    wordSpan.appendChild(charSpan);
                    sequence.push(charSpan);
                } else {
                    // Préserve le span .ag / .pre-ag, wrape ses caractères en reveal-char
                    const wrapper = document.createElement('span');
                    wrapper.className = tok.el.className;
                    tok.el.textContent.split('').forEach(ch => {
                        const charSpan = document.createElement('span');
                        charSpan.className = 'reveal-char';
                        charSpan.textContent = ch;
                        wrapper.appendChild(charSpan);
                        sequence.push(charSpan);
                    });
                    wordSpan.appendChild(wrapper);
                }
            });
            container.appendChild(wordSpan);
            container.appendChild(document.createTextNode(' '));
            wordTokens = [];
        }

        tokens.forEach(tok => {
            if (tok.type === 'char' && tok.value === ' ') {
                flushWord();
            } else {
                wordTokens.push(tok);
            }
        });
        flushWord();
    });

    const totalChars = sequence.length;
    // Lignes contenant du texte (ignore le spacer vide)
    const textLines = lines.filter(l => l.children.length > 0);
    let notified = false;
    function handleReveal() {
        const vh        = window.innerHeight;
        const firstRect = textLines[0].getBoundingClientRect();
        const lastRect  = textLines[textLines.length - 1].getBoundingClientRect();
        // Centre exact du bloc de texte (première lettre → dernière lettre)
        const blockCenter = (firstRect.top + lastRect.bottom) / 2;
        // progress 0 → bloc entre dans l'écran par le bas
        // progress 1 → bloc entièrement centré dans l'écran
        const start = vh;
        const end   = vh * 0.5;
        const rawProgress = (start - blockCenter) / (start - end);
        const progress = Math.max(0, Math.min(1, rawProgress));
        sequence.forEach((charSpan, i) => {
            charSpan.style.color = progress >= (i + 1) / totalChars ? '#f3f0ef' : 'rgba(243,240,239,0.01)';
        });
        // Notifie une seule fois quand le reveal est complet
        if (rawProgress >= 1 && !notified) {
            notified = true;
            if (onRevealComplete) onRevealComplete(lenis.scroll);
        } else if (rawProgress < 1) {
            notified = false;
        }
    }
    lenis.on('scroll', handleReveal);
    setTimeout(handleReveal, 100);
}

// ─── LIQUID DISTORT (distorsion seule, sans effet couleur) ───────────────────
function initLiquidDistort(canvas, src, strength = 0.07, speed = 0.14, radius = 0.12) {
    const gl = canvas.getContext('webgl');
    if (!gl) return null;

    const vert = `attribute vec2 a_position;attribute vec2 a_uv;varying vec2 v_uv;void main(){v_uv=a_uv;gl_Position=vec4(a_position,0.0,1.0);}`;
    const aspect = canvas.width / canvas.height;
    const frag = `
        precision mediump float;
        uniform sampler2D u_tex;
        uniform float u_time;
        uniform float u_strength;
        uniform vec2  u_mouse;
        uniform float u_hovered;
        uniform float u_radius;
        uniform float u_aspect;
        varying vec2 v_uv;
        void main() {
            vec2 diff = v_uv - u_mouse;
            diff.x *= u_aspect;
            float dist  = length(diff);
            float fall  = smoothstep(u_radius, 0.0, dist) * u_hovered;
            vec2 uv = v_uv;
            uv.x += sin(uv.y * 14.0 + u_time)        * u_strength * fall;
            uv.y += cos(uv.x * 14.0 + u_time * 0.85) * u_strength * fall;
            gl_FragColor = texture2D(u_tex, uv);
        }
    `;

    function compile(type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src); gl.compileShader(s); return s;
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vert));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog); gl.useProgram(prog);

    const pb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,-1,1,1,-1,1]), gl.STATIC_DRAW);
    const pl = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pl); gl.vertexAttribPointer(pl, 2, gl.FLOAT, false, 0, 0);

    const ub = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, ub);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,1,1,1,0,0,1,1,1,0,0,0]), gl.STATIC_DRAW);
    const ul = gl.getAttribLocation(prog, 'a_uv');
    gl.enableVertexAttribArray(ul); gl.vertexAttribPointer(ul, 2, gl.FLOAT, false, 0, 0);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,255]));

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    };

    const timeLoc     = gl.getUniformLocation(prog, 'u_time');
    const strengthLoc = gl.getUniformLocation(prog, 'u_strength');
    const mouseLoc    = gl.getUniformLocation(prog, 'u_mouse');
    const hoveredLoc  = gl.getUniformLocation(prog, 'u_hovered');
    const radiusLoc   = gl.getUniformLocation(prog, 'u_radius');
    const aspectLoc   = gl.getUniformLocation(prog, 'u_aspect');
    gl.uniform1f(strengthLoc, strength);
    gl.uniform1f(radiusLoc, radius);
    gl.uniform1f(aspectLoc, aspect);
    gl.uniform2f(mouseLoc, -1, -1);

    let mouseX = -1, mouseY = -1;
    let hoveredTarget = 0, hoveredCurrent = 0;
    const start = performance.now();

    return {
        setMouse(x, y) { mouseX = x; mouseY = y; },
        setHovered(v)  { hoveredTarget = v; },
        render() {
            hoveredCurrent += (hoveredTarget - hoveredCurrent) * 0.035;
            const elapsed = (performance.now() - start) / 1000;
            gl.uniform1f(timeLoc, elapsed * speed * 10);
            gl.uniform2f(mouseLoc, mouseX, mouseY);
            gl.uniform1f(hoveredLoc, hoveredCurrent);
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
    };
}

// ─── GALLERY REVEAL ──────────────────────────────────────────────────────────
function initGalleryReveal() {
    const groups = Array.from(document.querySelectorAll('.project-gallery > div:not(.gallery-spacer)'));
    if (!groups.length) return;

    // Récupère les éléments animables dans chaque groupe (canvas ou img)
    const transition = 'opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1)';

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            observer.unobserve(entry.target);

            const isPair = entry.target.classList.contains('gallery-pair');
            if (isPair) {
                const children = Array.from(entry.target.querySelectorAll('canvas, img'));
                children.forEach((child, i) => {
                    setTimeout(() => {
                        child.style.opacity = '1';
                        child.style.transform = 'translateY(0)';
                    }, i * 400);
                });
            } else {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0, rootMargin: '0px 0px -5% 0px' });

    groups.forEach(group => {
        if (group.classList.contains('gallery-pair')) {
            const children = Array.from(group.querySelectorAll('canvas, img'));
            children.forEach(child => {
                child.style.opacity = '0';
                child.style.transform = 'translateY(250px)';
                child.style.transition = transition;
            });
        } else {
            group.style.opacity = '0';
            group.style.transform = 'translateY(250px)';
            group.style.transition = transition;
        }
        observer.observe(group);
    });
}

// ─── TUBE TYPE ───────────────────────────────────────────────────────────────
function initTubeType() {
    const target = document.querySelector('.footer-flip-inner');
    if (!target) return;

    const FACES    = 3;
    const RADIUS   = '0.28em';
    const DURATION = 10;
    const STAGGER  = 0.07;

    target.innerHTML = '';
    const drums = [];

    [...'ensemble'].forEach((char, i) => {
        // Wrapper lettre : porte la perspective individuelle
        const wrap = document.createElement('span');
        wrap.style.cssText = `
            display: inline-block;
            perspective: 5em;
            vertical-align: top;
        `;

        // Drum : tourne en continu (rotation pilotée en JS)
        const drum = document.createElement('span');
        drum.style.cssText = `
            display: inline-block;
            position: relative;
            transform-style: preserve-3d;
        `;

        // 3 faces réparties sur le cylindre (0°, 120°, 240°)
        for (let f = 0; f < FACES; f++) {
            const angle = f * (360 / FACES);
            const face  = document.createElement('span');
            face.textContent = char;

            if (f === 0) {
                // Face de référence : garde le flux layout
                face.style.cssText = `
                    display: inline-block;
                    transform: rotateX(${angle}deg) translateZ(${RADIUS});
                    backface-visibility: hidden;
                    -webkit-backface-visibility: hidden;
                `;
            } else {
                // Faces superposées en absolu
                face.style.cssText = `
                    display: block;
                    position: absolute;
                    top: 0; left: 0;
                    transform: rotateX(${angle}deg) translateZ(${RADIUS});
                    backface-visibility: hidden;
                    -webkit-backface-visibility: hidden;
                `;
            }
            drum.appendChild(face);
        }

        drums.push(drum);
        wrap.appendChild(drum);
        target.appendChild(wrap);
    });

    // Rotation JS : angle de base + stagger par lettre
    const BASE_DEG_PER_FRAME = 360 / (DURATION * 60);
    const angles = drums.map((_, i) =>
        ((('ensemble'.length - 1 - i) * STAGGER) / DURATION) * 360
    );

    let speed       = BASE_DEG_PER_FRAME;
    let targetSpeed = BASE_DEG_PER_FRAME;

    let spinRafId = null;
    let spinVisible = false;
    function spinLoop() {
        speed += (targetSpeed - speed) * 0.06;
        drums.forEach((drum, i) => {
            angles[i] = (angles[i] + speed) % 360;
            drum.style.transform = `rotateX(${angles[i]}deg)`;
        });
        spinRafId = requestAnimationFrame(spinLoop);
    }
    function startSpin() {
        if (!spinRafId && spinVisible && !document.hidden) spinRafId = requestAnimationFrame(spinLoop);
    }
    function stopSpin() {
        if (spinRafId) { cancelAnimationFrame(spinRafId); spinRafId = null; }
    }
    new IntersectionObserver((entries) => {
        spinVisible = entries[0].isIntersecting;
        if (spinVisible) startSpin(); else stopSpin();
    }, { threshold: 0 }).observe(target);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopSpin(); else startSpin();
    });

    const flipWord = document.querySelector('.footer-flip-word');
    if (flipWord) {
        flipWord.addEventListener('mouseenter', () => { targetSpeed = BASE_DEG_PER_FRAME * 2.2; });
        flipWord.addEventListener('mouseleave', () => { targetSpeed = BASE_DEG_PER_FRAME; });
    }
}
