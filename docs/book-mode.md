# Mode livre — architecture et contrôles

Le mode livre remplace l’ancien réglage `split`, migré vers `book`. L’écriture simple et la vue papier continue restent disponibles. Deux feuilles sont affichées par défaut ; les commandes +/− et le sélecteur règlent une à quatre feuilles par rangée. Le document se parcourt verticalement, sans limite de quatre pages au total.

## Un document, un éditeur

`book-layout.js` normalise les formats en centimètres et calcule la géométrie. `book-editor.js` utilise la fragmentation native de Chromium (`column-height`, `column-wrap: wrap`, `column-fill: auto`). Le contenu reste dans un seul `contenteditable` : aucun découpage ni déplacement des paragraphes pendant la frappe. Les feuilles et leurs numéros sont des éléments frères, jamais sauvegardés dans les notes.

Le zoom utilise une transformation visuelle, pas un changement de taille de police. Les rectangles des lignes et des objets permettent de compter les pages. Leur colonne est calculée par division entière ; les petits rectangles de fin de ligne ne créent pas de fausses pages. Les mesures sont regroupées par frame, avec observation des modifications, du redimensionnement, du chargement des images et des polices.

Les anciennes colonnes ne fixaient pas de hauteur physique. Le nouveau mode utilise A4 par défaut, A5/A6/A3/Letter/Legal/Executive/Poche, ou des dimensions personnalisées de 8 à 60 cm. Orientation et marges appartiennent à `note.bookSetup`, transporté dans les archives et les boîtes chiffrées. Le nombre de colonnes appartient aux préférences locales. Une feuille pâle « Page suivante » réserve l’espace d’aperçu ; elle ne crée pas de page vide dans le document.

Le moteur ciblé et testé est Electron 43 / Chromium 150. La prise en charge est détectée avant activation. Voir les références du moteur : [column-wrap](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/column-wrap), [column-height](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/column-height).

## Retour arrière au début

`editor-boundary.js` identifie le début absolu, sans confondre le début d’un paragraphe ultérieur avec celui de la note. Il bloque uniquement les suppressions vers l’arrière avec une sélection vide. Les événements de composition, Suppr vers l’avant et les sélections restent natifs. Le suivi du curseur de `editor-blocks.js` ignore aussi le relâchement de cette touche : c’était une deuxième cause de déplacement même après annulation de l’effacement.

## Impression et PDF

`book-print.js` réutilise les règles typographiques de l’éditeur, les styles personnels et les polices locales embarquées, puis applique une page imprimée avec les mêmes dimensions et marges. Un saut explicite devient un saut de page à l’impression. Les en-têtes de tableaux ne sont pas répétés sur les pages suivantes : ce choix garde les mêmes coupures à l’écran et en PDF. Les titres sont dépliés dans le mode livre.

L’export PDF dans Electron utilise `printToPDF({ preferCSSPageSize: true })`, depuis une fenêtre cachée séparée : sandbox, pas de Node, pas de preload privilégié, JavaScript désactivé, permissions refusées, accès aux fichiers locaux interdit. Une seule génération peut être active ; délai maximal de 30 secondes et HTML limité à 32 Mo. Le résultat passe par l’aperçu PDF existant et son bouton Enregistrer PDF. Le navigateur seul utilise son impression système. [API Electron](https://www.electronjs.org/docs/latest/api/web-contents#contentsprinttopdfoptions).

Ajouter le titre/date/heure à l’export prend de la place : les coupures peuvent alors changer. L’impression papier nécessite le même format, 100 % et sans en-têtes du système. Word conserve le format mais utilise son propre moteur de pagination. Les blocs indivisibles plus hauts qu’une feuille doivent être adaptés ; aucune promesse de pagination identique à Word pour tous les documents.

## Refaire les contrôles

- `npm test` : formats, géométrie, conservation du guide, archives, stockage, mise à jour et publication.
- `node scripts/static-server.mjs` puis `/tests/editor-document.html`, `/tests/archive-content.html` et `/tests/editor-boundary.html` : migrations et limites de suppression.
- `node tests/book-electron.cjs` : application réelle avec un profil de test unique sous `output/book-tests`. Requiert le module `playwright`, accessible normalement ou via `MINDSET_PLAYWRIGHT_MODULE` (chemin absolu du module). Cette suite crée ses seules boîtes fictives ; elle ne lance pas l’application installée.
- Les résultats PDF et cartes des paragraphes de cette suite se trouvent sous `output/book-tests`, exclu de Git et des fichiers distribués. Comparer chaque marqueur et chaque numéro de page avec un lecteur PDF, puis examiner visuellement les feuilles.

Le fichier `SUIVI_MINDSET.txt` consigne les résultats réellement obtenus et les limites restantes. Le guide ajoute son nouveau chapitre une seule fois, sans remplacer les notes déjà modifiées par l’utilisateur.

Après la suite Electron, `python tests/verify-book-pdfs.py` (module `pypdf` requis) vérifie les marqueurs page par page, les dimensions, l’image intégrée et l’absence de texte indicatif sur une page vide.
