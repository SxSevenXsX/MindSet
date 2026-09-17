# Vérification de l’éditeur 1.3.0

## Tests automatiques de migration

Démarrer `node scripts/static-server.mjs` et ouvrir `/tests/editor-document.html`.
Résultat attendu et obtenu : **14/14**. La page n’utilise pas le stockage de l’application.

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
