# Mode livre — architecture et contrôles

Depuis la version 1.3.6, seuls Note et Livre sont proposés. Chaque ouverture ou changement de document revient en Note. L’ancienne vue Feuilles est retirée de l’interface ; les anciennes structures de contenu restent migrées sans perte. Le réglage `split` est reconnu comme un livre, mais aucune préférence globale ne force les prochaines notes à s’ouvrir ainsi. Deux feuilles sont affichées par défaut ; les commandes +/− et le sélecteur règlent une à quatre feuilles par rangée. Le document se parcourt verticalement, sans limite de quatre pages au total.

## Un document, un éditeur

`book-layout.js` normalise les formats en centimètres et calcule la géométrie. `book-editor.js` utilise la fragmentation native de Chromium (`column-height`, `column-wrap: wrap`, `column-fill: auto`). Le contenu reste dans un seul `contenteditable` : aucun découpage ni déplacement des paragraphes pendant la frappe. Les feuilles et leurs numéros sont des éléments frères, jamais sauvegardés dans les notes.

Le zoom utilise une transformation visuelle, pas un changement de taille de police. La réduction tient compte de la largeur ET de la hauteur disponibles, avec les espacements du conteneur : chaque rangée tient entièrement à l’écran. Pendant la frappe ou les déplacements au clavier, le défilement aligne la rangée du curseur ; il ne remonte pas entre deux feuilles de cette même rangée. Les rectangles des lignes et des objets permettent de compter les pages. Leur colonne est calculée par division entière ; les petits rectangles de fin de ligne ne créent pas de fausses pages. Les mesures sont regroupées par frame, avec observation des modifications, du redimensionnement, du chargement des images et des polices.

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

## Mode Note, couleurs et émojis (1.3.6)

`writing-tools.js` contient le zoom Note, la segmentation des émojis, la mémoire circulaire de couleurs et les interactions avec les marqueurs. Le zoom Note (50–200 %) s’applique uniquement au conteneur éditable via CSS `zoom`, en dehors du HTML sauvegardé. Ctrl/molette et les événements de pincement `wheel` avec Ctrl sont interceptés sans changer le zoom de toute l’application. La valeur est une préférence locale `noteZoom` ; les polices et le PDF gardent leur taille réelle. Les commandes +/−/100 % offrent une autre entrée.

Les palettes du texte et du surlignage ont 12 couleurs personnalisables dans les paramètres et 3 cases indépendantes de couleurs récentes. Les valeurs et la prochaine case sont persistées. Réutiliser une couleur ou cliquer sur un préréglage ne tourne pas la mémoire. Les anciennes 6 cases sont réduites aux 3 dernières lorsque leur ordre est connu.

Un choix natif de couleur peut émettre plusieurs `input`. Le premier enregistre l’état à annuler et prépare des spans couvrant uniquement les portions de texte sélectionnées ; les suivants modifient ces mêmes spans. Aucun focus ni `Selection.addRange` n’est imposé pendant le geste : Chromium fermerait son sélecteur. Un Range indépendant conserve la sélection. `change`, blur, fermeture de palette ou démontage terminent le geste et mémorisent seulement sa dernière couleur. Une seule annulation restaure le texte avant ce geste ; les paragraphes, gras et italiques sont conservés.

Le double-clic sur la première ligne d’un marqueur ouvre huit couleurs. Le repérage tient compte du zoom et des colonnes ; un double-clic sur le texte garde sa sélection normale. La couleur explicite est `li[data-marker-color]`, hexadécimale validée à l’import et au collage. `--li-marker-color` reste le style effectif utilisé à l’écran, à l’impression et dans l’export Word. Le choix « Suivre la couleur du texte » enlève la priorité explicite et rétablit l’héritage de la couleur précédente.

Les icônes personnalisées acceptent le premier graphème émoji complet, via `Intl.Segmenter`, sans liste fermée : tons de peau, familles, drapeaux et séquences ZWJ restent intacts. Leur dessin dépend des polices d’émojis de Windows. Les imports utilisent la même normalisation. Aucun service externe n’est nécessaire.

`node tests/writing-electron.cjs` complète les contrôles avec un profil jetable : zoom, ouverture en Note, palette en direct, fermeture sans validation, historique circulaire, annulation, texte riche, huit familles de marqueurs, émojis, deux tailles de fenêtre et passage entre pages. Les événements du sélecteur natif et du pincement sont reproduits ; le matériel du pavé tactile n’est pas piloté par ces tests.

## Ajustements de confort (1.3.7)

La palette utilise un `Highlight` CSS distinct, avec les couleurs système de sélection. Son Range est actualisé après les modifications de spans du sélecteur natif. Le repère reste visible pendant `input`, puis disparaît à l’application d’un préréglage, à `change`, ou à la fermeture ; un geste terminé laisse un curseur à la fin de la sélection. Le focus du sélecteur natif reste intact pendant la prévisualisation.

`MindSetDocument.restore` prépare la cible hors écran, puis rapproche les arbres DOM de manière synchrone. Les préfixes et suffixes identiques restent en place, les nœuds compatibles sont modifiés et seuls les éléments ajoutés/supprimés sont insérés/retirés. Le texte utilise `replaceData` sur sa portion différente. Les images inchangées gardent leur élément et leur source. Le mode Livre est mesuré dans la même tâche après restitution du curseur, avant le prochain rendu. Les rendus différés éventuels sont annulés. Depuis les boutons de la barre et le champ couleur, Ctrl + Z vise l’historique du document ; les autres champs conservent leur édition native.

Le zoom Note avance de 0,05 par bouton. La molette utilise un coefficient de 0,00125 au lieu de 0,0025 ; son accumulateur garde les fractions avant l’arrondi au pourcentage. Le contenu, les tailles de caractères et le format imprimé restent indépendants de cette préférence.
