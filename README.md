# MindSet

Application Windows de prise de notes locale : boîtes de projets, dossiers imbriqués, notes, onglets, signets, vue graphique et enregistrements audio. Les boîtes protégées utilisent un chiffrement AES-GCM ; les clips audio sont conservés dans IndexedDB.

## Développement

- `npm install` puis `npm start` pour Electron.
- `node scripts/static-server.mjs` puis ouvrir `http://127.0.0.1:4173` pour tester dans un navigateur.
- `npm run dist -- --publish never` pour créer un installeur de développement dans `dist/`.
- `npm test` pour vérifier le parcours de mise à jour et les contrôles de publication.

## Écriture — version 1.3.2

La note reste un document continu, y compris en vue papier. Sa mise en page ne découpe plus les paragraphes pendant la saisie. Le format, les marges et le zoom restent personnalisables ; la pagination finale est calculée à l’impression.

- `/` au début d’un bloc : texte, titres, listes à puces ou numérotées, cases à cocher, citation, encadré, code, séparateur, saut de page. Taper pour filtrer, flèches pour choisir, Entrée pour valider, Échap pour fermer.
- `Entrée` crée un paragraphe ; `Maj + Entrée` crée un retour simple. Entrée à la fin d’un titre revient au texte normal. Entrée dans un élément de liste vide sort de la liste.
- `Ctrl + Entrée` insère un saut de page pour l’impression et les exports.
- `#` à `######` suivis d’espace créent un titre ; `>` une citation ; `---` un séparateur ; trois accents graves un bloc de code. Les anciens raccourcis de listes restent disponibles.
- Sélectionner du texte affiche une petite barre de mise en forme. Les outils complets et les palettes personnalisées restent accessibles en haut.
- Annuler/Rétablir conserve l’emplacement du curseur, y compris entre des paragraphes vides. Les frappes consécutives sont regroupées.

Les anciennes feuilles indépendantes sont reprises comme des sections séparées par des sauts de page explicites. Les notes existantes et les polices personnalisées sont conservées ; l’ancienne police par défaut Georgia passe à la police système.

## Vérification

Ouvrir `http://127.0.0.1:4173/tests/editor-document.html` après avoir démarré le serveur : 15 tests de migration, sans accès aux notes utilisateur. Voir [la procédure de vérification](tests/README.md) pour les essais interactifs.

## Publication

La version 1.3.3 est préparée et attend un certificat reconnu avant distribution. Les prochaines publications doivent être signées : application, installeur, horodatage et manifeste sont vérifiés avant mise en ligne.

Voir [la procédure de signature et de publication Windows](docs/windows-signing.md). La commande locale `npm run release` permet de signer depuis le poste du titulaire puis de publier sur GitHub. Le workflow **Publish Windows release** reste disponible avec une configuration de signature adaptée à GitHub Actions. Aucun de ces parcours ne publie une version non signée.
