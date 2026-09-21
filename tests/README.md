# Vérification de l’éditeur 1.3.2

## Tests automatiques de migration

Démarrer `node scripts/static-server.mjs` et ouvrir `/tests/editor-document.html`.
Résultat attendu et obtenu : **15/15**. La page n’utilise pas le stockage de l’application.

## Parcours interactifs vérifiés dans Chromium

Utiliser une note de test, jamais une note personnelle existante.

- Nouvelle note vide, renommer puis Entrée : le curseur arrive dans le contenu.
- `/titre`, flèche bas, Entrée : titre 2 ; saisir puis Entrée : paragraphe normal.
- Maj+Entrée : retour simple dans le même paragraphe.
- `/faire` : cases à cocher ; deux Entrées après le dernier élément : sortie de liste.
- `##` puis espace : titre ; `/encadre` : annotation ; Entrée : retour au paragraphe.
- `/num` : liste numérotée ; Entrée au début d’un élément non vide : insertion d’un élément vide sans perte du texte suivant.
- `/citation` dans une liste : conversion sans liste imbriquée invalide.
- `/inconnu`, Échap : conservation du texte saisi.
- Sélection au clavier puis bouton Gras de la barre flottante : texte sélectionné en gras.
- Ctrl+Entrée : saut explicite ; la frappe continue après le saut.
- Annuler puis Rétablir : contenu rétabli. Annuler une insertion au milieu d’une note conserve le curseur au même endroit, avec les paragraphes vides.
- Coller 90 paragraphes (6 576 caractères après ajout du marqueur final), changer de vue, recharger et rouvrir : nombre de caractères et fin du document inchangés, aucune feuille physique dans l’éditeur.
- Vue papier, vue continue, thème sombre : contenu conservé.
- Collage enrichi : gras, italique, tableau, encadré et saut explicite conservés.
- Aperçu PDF MindSet : un saut explicite produit deux pages.
- Bloc de code : une ligne vide suivie d’Entrée permet de reprendre un paragraphe.
- Aucune erreur JavaScript observée pendant ces parcours.

Vérifier également le collage enrichi et l’impression avec ses options avant de publier un changement touchant ces fonctions. La vue papier représente la largeur et les marges ; elle ne prétend pas montrer les coupures automatiques finales, qui dépendent du moteur d’impression. Le compteur indique des **sections explicites**, pas un nombre de pages imprimées.

## Construction

`node --check src/app.js`, `node --check src/editor-blocks.js`, `node --check src/editor-document.js`, puis `npm run dist -- --publish never`.

## Sauvegardes et lancement — 1.3.4

Tests Node : `npm test`. La suite couvre aussi l’intégrité des archives, les collisions, les audios manquants, les formats protégés, le stockage illisible et la remise au premier plan d’une instance existante.

Ouvrir `/tests/archive-content.html` avec le serveur local : **6/6** contrôles du nettoyage des imports et de la conservation des mises en forme. La page ne lit pas les données de l’application.

Parcours vérifiés le 19 septembre 2026, exclusivement sur des données fictives dans un profil Chromium distinct :

- Import d’une boîte libre et d’une boîte protégée contenant notes, image intégrée, tableau, tâche, saut explicite et audio WAV.
- Export de toutes les boîtes, puis comparaison des enregistrements audio : octets identiques, y compris le chiffré.
- Réimport du même fichier : zéro boîte ajoutée, aucun écrasement, confirmation désactivée.
- Mauvais code refusé ; bon code accepté et note importée déchiffrée.
- Échec simulé de localStorage pendant la confirmation : aucune nouvelle boîte persistée ; seuls les nouveaux octets audio sont retirés, les anciens restent présents.
- Stockage rendu illisible dans le profil de test : écran de protection, octets localStorage inchangés et audio encore présent après le délai du nettoyage initial.
- Redémarrage du navigateur : boîtes conservées.
- Ancienne suite de migration de l’éditeur : **15/15**.

Parcours natif Electron vérifié avec `MINDSET_DEV_PROFILE` pointant vers un dossier de test sous `output/playwright/` :

- Deux lancements réels : le second processus sort, la fenêtre réduite du premier est restaurée, une seule fenêtre reste présente.
- Profil distinct de celui de l’application installée.
- Le bouton de sauvegarde appelle l’enregistrement natif et produit un fichier valide. La boîte de dialogue a été remplacée par un choix de chemin de test pour automatiser ce contrôle.
- L’annulation de cette boîte de dialogue affiche « Export annulé », sans succès mensonger.

Les scénarios temporaires, captures et fichiers synthétiques se trouvent dans `output/playwright/`, exclu de Git. Ne jamais pointer ces scénarios vers un profil contenant des notes personnelles. Ces essais ne valident pas une installation signée ni le déblocage de Smart App Control : ce parcours reste à tester sur le vrai poste après disponibilité d’un installeur accepté par Windows.

Compléments de fin de vérification : styles personnels et couleurs audio conservés ; annuler puis rétablir un import réussi ; le nœud racine du graphe revient effectivement dans le cadre après Recentrer. La suite Node finale compte **39 tests réussis**.

## Mode livre (1.3.5)

La procédure et la suite Electron isolée sont décrites dans [docs/book-mode.md](../docs/book-mode.md). Les fixtures navigateur supplémentaires sont `archive-content.html` (dont les formats de livre importés) et `editor-boundary.html` (limite absolue du document). La suite réelle `book-electron.cjs` utilise uniquement des boîtes fictives et produit ses PDF sous `output/book-tests`.
