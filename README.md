# MindSet

Application Windows de prise de notes locale : boîtes de projets, dossiers imbriqués, notes, onglets, signets, vue graphique et enregistrements audio. Les boîtes protégées utilisent un chiffrement AES-GCM ; les clips audio sont conservés dans IndexedDB.

## Développement

- `npm install` puis `npm start` pour Electron.
- `node scripts/static-server.mjs` puis ouvrir `http://127.0.0.1:4173` pour tester dans un navigateur.
- `npm run dist -- --publish never` pour créer un installeur de développement dans `dist/`.
- `npm test` pour vérifier les archives, le stockage, l’instance unique, le parcours de mise à jour et les contrôles de publication.

## Confort d’écriture — version 1.3.7

La sélection reste visible pendant le choix des couleurs et du surlignage. Annuler et rétablir conserve les éléments inchangés du document. Le zoom Note propose des pas de 5 points et une molette deux fois moins sensible. Le guide intégré et le journal du projet expliquent ces ajustements.

## Écriture — version 1.3.6

Les documents s’ouvrent en **Note**, avec un zoom visuel par Ctrl + molette ou pincement (50 à 200 %). **Livre** remplace la vue Feuilles : une à quatre pages par rangée, adaptées en largeur et en hauteur pour rester entièrement visibles.

Les couleurs et le surlignage s’appliquent directement, avec douze préréglages modifiables et trois dernières couleurs personnalisées. Un double-clic colore les marqueurs des listes. Les notes, dossiers et documents audio acceptent tous les émojis, y compris les séquences composées.

Le guide intégré explique ces commandes ; [SUIVI_MINDSET.txt](SUIVI_MINDSET.txt) conserve l’historique détaillé des interventions.

## Mode livre — version 1.3.5

Le bouton **Mode livre** affiche de vraies feuilles : deux A4 par défaut, avec texte continu vers la feuille suivante. Les commandes de zoom permettent une à quatre feuilles côte à côte. Le format, l’orientation et les marges se règlent pour chaque note, avec des dimensions personnalisées possibles. L’export PDF reprend la mise en page et les images. Retour arrière au début de la note est sans effet, y compris sur une ligne vide.

Voir [le fonctionnement et les tests du mode livre](docs/book-mode.md).

## Boîtes et sauvegardes

L’accueil propose **Importer des boîtes** et **Sauvegarder toutes les boîtes**. Chaque carte possède aussi son bouton **Exporter**. Un fichier `.mindset` contient les boîtes, notes, images intégrées et audio ; les boîtes protégées restent chiffrées. Les préférences d’affichage et polices locales sont exclues. Limite : 256 Mo par fichier.

L’import présente un résumé et ajoute uniquement les boîtes absentes. Une boîte ayant le même identifiant est conservée, sans remplacement. Le fichier est vérifié avant toute écriture. Un échec de stockage provoque le retrait des seuls nouveaux enregistrements audio. Un fichier non chiffré doit être conservé comme un document personnel.

Le **Guide MindSet**, en bas de l’accueil, présente les fonctions et leurs limites. Il est ajouté aux espaces existants sans remplacer leur ancienne boîte de démarrage. Ses notes sont modifiables ; le bouton du guide le recrée s’il a été supprimé.

Un second lancement de la nouvelle version ramène la fenêtre existante. Au premier passage depuis une ancienne version qui n’avait pas de verrou, fermer normalement toutes les anciennes fenêtres. `npm start` utilise `%APPDATA%/mindset-development` ; les tests peuvent choisir un profil distinct avec `MINDSET_DEV_PROFILE`. L’application installée conserve son profil habituel `%APPDATA%/mindset`.

Si le stockage ne peut pas être lu, l’application suspend les écritures et le nettoyage audio. Elle propose de réessayer et, si disponibles, de copier les données illisibles pour un diagnostic local. Elle ne remplace pas ces données par une première installation.

Le journal de travail et les actions restantes sont dans [SUIVI_MINDSET.txt](SUIVI_MINDSET.txt). Ne pas confondre une version préparée dans les sources avec une version publiée ou installée.

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

La distribution personnelle gratuite est possible avec `npm run release -- --unsigned`. Le fichier, son empreinte et son état de signature sont vérifiés ; Windows conserve ses protections et peut afficher « éditeur inconnu ». La variante signée reste disponible avec un certificat.

Voir [la procédure de signature et de publication Windows](docs/windows-signing.md). La commande locale `npm run release` permet de signer depuis le poste du titulaire puis de publier sur GitHub. Le workflow **Publish Windows release** reste disponible avec une configuration de signature adaptée à GitHub Actions. Le workflow GitHub Actions reste réservé à la variante signée. Aucun certificat ni abonnement n’est nécessaire pour le parcours personnel local.
