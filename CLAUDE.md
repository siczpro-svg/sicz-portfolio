# Règles de session — Portfolio S!CZ

## Contexte projet
Portfolio personnel de Simon Collin (S!CZ), site HTML/CSS/JS vanilla.
Déployé sur Vercel : sicz-portfolio.vercel.app
Remote Git : https://github.com/siczpro-svg/sicz-portfolio.git (branch: main)

---

## Git & Déploiement Vercel

- À chaque fin de session de travail, rappelle-moi de commit et push.
- Avant tout push, vérifie que `index.html`, `css/`, `js/` et `assets/` sont bien trackés.
- Format de commit obligatoire : `update: [description courte de ce qui a changé]`
- Remote cible : `origin main` → déclenche un redéploiement automatique sur Vercel.
- Ne jamais push sur une autre branche que `main` sauf demande explicite.

---

## Commande de fin de session

Quand je dis **"fin de session"**, **"on s'arrête"**, **"je coupe"** ou **"push"**, exécute automatiquement dans l'ordre :

1. `git status` — liste les fichiers modifiés
2. `git add .`
3. Propose un message de commit court et pertinent basé sur les fichiers modifiés
4. `git commit -m "update: [message proposé]"`
5. `git push origin main`
6. Confirme que le push est passé avec un résumé des fichiers envoyés

---

## Rappel en cours de session

- Si je travaille depuis plus de 30 minutes sans commit, rappelle-moi de sauvegarder.
- Si je modifie `index.html`, `css/style.css` ou des fichiers dans `js/`, propose un commit rapide.

---

## Stack technique

- HTML / CSS / JS vanilla — pas de framework, pas de bundler
- Pas de `node_modules`, pas de `package.json`
- Fonts Adobe Typekit (kwr6tyz) — ne pas modifier les liens Typekit
- Aucun build command nécessaire — Vercel sert les fichiers statiques directement

---

## Conventions de code

- Indentation : 2 espaces
- Pas de jQuery, pas de Bootstrap
- Les animations JS utilisent `requestAnimationFrame` ou `IntersectionObserver`
- Les variables CSS sont définies dans `:root` dans `css/style.css`
- Commentaires en français
