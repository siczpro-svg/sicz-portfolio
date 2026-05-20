---
name: responsive-sicz
description: >
  Skill dédié au responsive design complet du portfolio S!CZ (Simon Collin).
  Utilise ce skill pour rendre le site responsive sur 4 breakpoints :
  mobile (< 768px), tablette (768–1024px), desktop (1025–1250px), XL (> 1250px).
  Couvre tous les modules du site : carousel 3D WebGL, timeline flip,
  chatbot, cursor, WebGL tornado, animations GSAP/Lenis, filtres portfolio,
  pages projet, à-propos, mentions légales. Conserver le maximum d'effets
  visuels sur tous les formats.
---

# Responsive S!CZ Portfolio

## Contexte du site

Stack : Vanilla HTML/CSS/JS, GSAP, Lenis, WebGL/Canvas, Three.js (hero projet).
Pages : index.html, projet.html, a-propos.html, mentions-legales.html,
politique-confidentialite.html.
Fichiers JS : main.js, animations.js, apropos.js.
Aucun framework CSS — tout est en vanilla CSS dans style.css.

---

## Règles absolues avant de commencer

1. **Lire style.css en entier** avant d'écrire une seule ligne de CSS.
2. **Ne jamais écraser** une règle existante — ajouter uniquement dans
   les blocs `@media` en fin de style.css.
3. **Ne pas modifier** main.js, animations.js, apropos.js sauf pour
   les désactivations JS listées explicitement ci-dessous.
4. **Tester chaque breakpoint** via DevTools avant de passer au suivant.
5. **Mobile-first** : les media queries utilisent `min-width`
   (sauf exceptions notées).

---

## Breakpoints

```css
/* Mobile      : base CSS (0–767px) */
/* Tablette    : @media (min-width: 768px)  */
/* Desktop     : @media (min-width: 1025px) */
/* XL          : @media (min-width: 1251px) */
```

---

## 1. MOBILE (< 768px)

### Désactivations JS obligatoires (via classe sur <body>)

Au chargement, détecter le touch device et ajouter `.is-touch` sur body :
```js
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
  document.body.classList.add('is-touch');
}
```

Puis en CSS :
```css
.is-touch .custom-cursor { display: none; }
```

Et en JS (main.js) : wrapper le cursor RAF dans :
```js
if (!document.body.classList.contains('is-touch')) { /* cursor RAF */ }
```

### Typographie mobile

| Élément | Desktop | Mobile |
|---|---|---|
| H1 / grands titres | 72–120px | 36–48px |
| H2 / titres section | 48–64px | 28–36px |
| Body text | 16–18px | 15px |
| Labels uppercase | 11–12px | 10px |
| `.footer-bigname` | très grand | 48px, overflow hidden |
| `.intro-subtitle` | grand | 22px |

Règle générale : `font-size: clamp(min, vw, max)` sur les grands titres.
Exemple : `font-size: clamp(32px, 8vw, 72px)`

### Navigation

`.logo-fixed` : réduire taille logo, s'assurer qu'il ne chevauche pas
le contenu. `font-size` réduit ou `width` du SVG réduit à 80px.

Navigation projet (`.project-nav`) :
- `.nav-back` : texte raccourci ou icône seule
- `.nav-arrows` : toujours visibles, taille touch minimum 44×44px
- `#navName` : masqué si trop long (`display: none` sur mobile)

### Hero index — Carousel 3D WebGL

**Conserver** le carousel WebGL sur mobile — c'est la pièce maîtresse.
Adaptations :
- `.scroll-container` : hauteur réduite, les cartes sont plus petites
- `.tl-card` (carousel portfolio) : `width: 80vw`, scale adapté
- Le scroll horizontal est conservé mais via touch scroll natif
- Désactiver uniquement le `wheel hijack` sur mobile :
  ```js
  if (window.innerWidth < 768) return; // dans le wheel handler
  ```
- Les effets WebGL liquid des cartes : **conserver**
- Le `.scroll-hint` : masquer après 2s ou au premier scroll

### WebGL Tornado (#world)

**Conserver** sur mobile — réduire uniquement la résolution du canvas :
```js
const dpr = Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1 : 2);
```

### Intro (#intro / .intro-screen)

Conserver l'animation GSAP d'entrée.
Réduire les dimensions du SVG logo : `max-width: 80vw`.
`.intro-subtitle` : `font-size: clamp(18px, 5vw, 32px)`.

### Description section (.description-section)

`.description-line` : `font-size: clamp(24px, 6vw, 48px)`.
Réduire le padding horizontal.

### Footer

`.footer-bigname` : `font-size: clamp(40px, 10vw, 80px)`, `overflow: hidden`.
`.footer-cta-line` : taille réduite, retour à la ligne autorisé.
`.footer-flip-word` : **conserver** l'effet flip au hover/touch.
Le chatbot (#chatPanel) : `width: 100vw`, `height: 90vh`, positionné
en bas de l'écran comme un bottom sheet.

### Chatbot

```css
@media (max-width: 767px) {
  .chat-panel {
    width: 100vw;
    height: 85vh;
    bottom: 0;
    right: 0;
    border-radius: 20px 20px 0 0;
  }
}
```

### Pages projet (projet.html)

`.project-hero` : `height: 60vh` (au lieu de 100vh).
`#heroImg` / canvas WebGL hero : `width: 95vw`, centré, pas d'animation
de déformation au scroll (trop lourd sur mobile) — afficher l'image statique.
Pour désactiver le WebGL hero sur mobile :
```js
if (window.innerWidth < 768) {
  heroImg.style.visibility = 'visible';
  // ne pas init le canvas Three.js
  return;
}
```

`.project-info` : layout vertical, single column.
`.project-info-meta` : flex-wrap, les tags passent à la ligne.
`.project-gallery` : single column, `width: 100%` par image/canvas.
`.project-bottom-nav` : les deux liens s'empilent ou passent en colonne.

### Timeline PARCOURS (a-propos.html)

**Conserver** le flip des cartes mais en version IntersectionObserver
(déjà prévu dans apropos.js pour mobile).
Désactiver le wheel hijack horizontal.
Cartes : `width: 88vw`, hauteur auto.
Contenu terminal : `font-size: 12px`, padding réduit.
SVG ligne organique : `display: none`.
Flottement sinusoïdal (float RAF) : **conserver**.
Tilt au mousemove : désactiver sur touch.

### Pages légales

`.legal-content` : `padding: 0 20px`, `font-size: 15px`.
`.legal-hero` : titre réduit.

---

## 2. TABLETTE (768px – 1024px)

La tablette est un format intermédiaire — la majorité des effets
desktop sont conservés, avec des adaptations dimensionnelles.

### Cursor

**Conserver** le custom cursor sur tablette non-touch (trackpad).
Sur tablette touch (iPad) : masqué via `.is-touch`.

### Carousel 3D

Conserver intégralement. Adapter les dimensions des cartes :
`.tl-card` dans le carousel portfolio : `width: 60vw`.
Scroll horizontal : conserver le wheel hijack si non-touch.

### Layout général

Max-width des contenus : `90vw` au lieu de `80vw` desktop.
Padding horizontal global : `40px` (au lieu de 60–80px desktop).

### Footer

`.footer-bigname` : `font-size: clamp(60px, 12vw, 120px)`.
Chat panel : `width: 380px` (légèrement réduit).

### Pages projet

`.project-hero` : `height: 75vh`.
WebGL hero déformation : **conserver** sur tablette non-touch.
`.project-gallery` : 2 colonnes max si images paysage.
`.project-info` : layout en 2 colonnes possibles.

### Timeline PARCOURS

Wheel hijack : **conserver** si non-touch.
Cartes : `width: 480px`, `height: 280px`.
SVG ligne : **conserver**, `strokeWidth: 8px`.
Float + tilt : **conserver** sur tablette non-touch.

---

## 3. DESKTOP (1025px – 1250px)

C'est le format de référence — le design actuel est déjà optimisé
pour cette plage. Peu de modifications nécessaires.

Vérifier uniquement :
- Les éléments qui débordent entre 1025 et 1250px
- Le padding du `.tl-track-viewport` (actuellement `36vw` à gauche)
- La taille des cartes carousel : elles doivent être lisibles à 1025px

Ajustements mineurs :
```css
@media (min-width: 1025px) and (max-width: 1250px) {
  .tl-track-viewport {
    padding-left: 20vw; /* réduit vs la valeur desktop XL */
  }
  .description-line {
    font-size: clamp(36px, 4vw, 56px);
  }
}
```

---

## 4. XL (> 1250px)

Format grands écrans — éviter les contenus trop étirés.

### Règles principales

Max-width sur les contenus textuels :
```css
@media (min-width: 1251px) {
  .project-info-body,
  .about-body,
  .legal-content {
    max-width: 800px;
  }
  .description-section {
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

Typographie : légèrement augmentée pour profiter de l'espace.
```css
@media (min-width: 1251px) {
  body { font-size: 18px; }
  .description-line { font-size: clamp(56px, 5vw, 96px); }
}
```

Carousel : les cartes peuvent être plus grandes, `gap` augmenté.
Footer `.footer-bigname` : laisser en très grand, c'est voulu.

---

## 5. Éléments à NE PAS toucher sur aucun format

- Les shaders WebGL (vertex/fragment) dans animations.js
- Les valeurs d'easing GSAP (`power3.inOut`, etc.)
- Les durées d'animation
- Le tableau `PROJECTS` dans main.js
- Le routing projet par URL params
- Les couleurs de la charte (#131211, #F3F0EF, #00B4ED)

---

## 6. Touch events

Sur les éléments interactifs, s'assurer que les zones de touch
font minimum **44×44px** (guideline Apple/Google) :
```css
.nav-arrow,
.chat-btn,
.filter-btn,
#bottomPrev,
#bottomNext {
  min-width: 44px;
  min-height: 44px;
}
```

Le hover CSS (`:hover`) fonctionne mal sur touch.
Remplacer les effets hover critiques par des états `:active` sur mobile :
```css
@media (max-width: 767px) {
  .filter-btn:active { /* styles du hover */ }
}
```

---

## 7. Images et médias

Toutes les `<img>` hors viewport : `loading="lazy" decoding="async"`
(déjà appliqué — vérifier que les images projet sont aussi lazy).

Sur mobile, si des images sont en `background-image` CSS avec
des URLs fixes, utiliser `image-set()` ou des media queries pour
servir des versions plus légères si disponibles.

Le canvas WebGL liquid (galerie projet) : sur mobile, réduire
la résolution en passant `devicePixelRatio` à 1 max.

---

## 8. Scroll et overflow

Sur mobile, s'assurer qu'aucun élément ne provoque de scroll
horizontal non voulu :
```css
@media (max-width: 767px) {
  body, html {
    overflow-x: hidden;
  }
  .tl-outer {
    overflow-x: hidden;
  }
}
```

Attention : `overflow: hidden` sur body peut bloquer Lenis.
Utiliser `overflow-x: clip` si Lenis se bloque.

---

## 9. Ordre d'implémentation recommandé

1. Ajouter la détection `.is-touch` en JS (main.js, début du fichier)
2. Masquer le cursor sur `.is-touch` (style.css)
3. Implémenter le breakpoint mobile (< 768px) — page par page :
   - index.html (carousel, intro, footer, chatbot)
   - projet.html (hero, gallery, nav)
   - a-propos.html (timeline, sections texte)
   - mentions-legales.html + politique-confidentialite.html
4. Implémenter tablette (768–1024px)
5. Ajustements desktop (1025–1250px)
6. Ajustements XL (> 1250px)
7. Test final : resize lent de 320px → 1920px sans rupture visuelle

---

## 10. Test checklist

Pour chaque breakpoint, vérifier :
- [ ] Aucun scroll horizontal parasite
- [ ] Cursor masqué sur touch, visible sur pointeur
- [ ] Carousel lisible et utilisable
- [ ] Chatbot accessible et utilisable
- [ ] Navigation projet fonctionnelle (prev/next)
- [ ] Footer non débordant
- [ ] Typographie lisible (min 14px body)
- [ ] Zones de touch ≥ 44px
- [ ] WebGL canvas ne freeze pas
- [ ] Lenis smooth scroll opérationnel
- [ ] Preloader correct
- [ ] Aucune animation bloquante au chargement
