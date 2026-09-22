# 1.3.7 — Sélection visible, annulation stable et zoom précis

- Le repère bleu du texte sélectionné reste visible pendant le choix d’une couleur ou d’un surlignage, y compris dans le sélecteur personnalisé. Il est libéré quand la modification est appliquée.
- Annulation et rétablissement sur place : les paragraphes, textes et images inchangés restent montés, sans recréer tout le document. La géométrie du livre est actualisée avant l’affichage suivant.
- Ctrl + Z depuis la barre de mise en forme ou le sélecteur de couleur utilise l’historique du texte, sans reconstruire l’application entière.
- Zoom Note : pas de 5 points au lieu de 10 ; sensibilité de la molette et du pincement divisée par deux, avec accumulation des gestes très fins. Aucun changement à la taille réelle des caractères.
- Guide complété sans remplacer les annotations personnelles. Journal SUIVI_MINDSET enrichi d’une chronologie de tous les commits disponibles depuis la création du projet.

# 1.3.6 — Notes, pages entières et couleurs immédiates

- Les pages du livre tiennent entièrement dans la hauteur et la largeur disponibles. Le passage entre les feuilles d’une même rangée garde le défilement stable.
- Deux modes : Note et Livre. L’ancien mode Feuilles disparaît ; chaque document s’ouvre initialement en Note.
- Zoom visuel de la note par Ctrl + molette, pincement du pavé tactile et boutons : de 50 % à 200 %, sans changer la police enregistrée ou imprimée.
- Tous les émojis pour les notes, dossiers et documents audio : saisie, collage ou sélecteur Windows, sans couper les familles, drapeaux et tons de peau.
- Double-clic sur les marqueurs des listes pour choisir noir, rouge, bleu, jaune, orange, vert, violet ou rose ; retour possible à la couleur automatique du texte.
- Texte et surlignage : application immédiate, sans bouton de validation. Fermer le choix conserve sa dernière couleur ; un seul Ctrl + Z annule le geste.
- Douze couleurs prédéfinies modifiables dans les paramètres et trois cases de couleurs personnalisées pour chaque palette, remplacées circulairement sans doublons.
- Guide enrichi sans remplacer les annotations personnelles, conservation des couleurs dans les sauvegardes, contrôles de l’éditeur et des PDF.

# 1.3.5 — Mode livre et écriture stable

- Retour arrière au début absolu de la note sans suppression, déplacement du curseur ni défilement parasite, y compris sur une ligne vide.
- Mode livre à la place de l’ancien affichage en deux colonnes : feuilles distinctes, texte continu qui passe automatiquement à la suivante, défilement vertical.
- Deux feuilles par défaut ; zoom pour afficher de une à quatre feuilles par rangée sans modifier le texte ou les coupures.
- A4 par défaut ; A5, A6, A3, Letter, Legal, Executive, Poche et dimensions personnalisées. Orientation et marges enregistrées avec chaque note.
- PDF avec le format, les styles et les images du livre ; format également transmis à l’export compatible Word et aux sauvegardes `.mindset`.
- Guide enrichi d’un chapitre Mode livre, ajouté aux guides existants sans écraser leurs annotations.
- Distribution personnelle gratuite possible sans certificat ; téléchargement vérifié, signature invalide refusée, sauvegarde avant installation et contrôle de version au redémarrage conservés.
- Inclut les fonctions préparées en 1.3.4 : sauvegarde/import des boîtes avec l’audio, guide, profil de développement séparé et retour à la fenêtre existante au second lancement.

L’impression papier nécessite le format correspondant et une échelle de 100 %. L’ajout d’un titre/date à l’export peut changer les coupures. Aucun certificat payant ni abonnement n’est nécessaire pour cette distribution ; les protections Windows restent actives.

# 1.3.4 — Boîtes transportables et lancement fiable (en préparation)

- Un second lancement ramène la fenêtre existante, y compris lorsqu’elle est réduite.
- Le développement utilise un profil séparé de l’application installée.
- Import `.mindset` à côté de « Nouvelle boîte », aperçu avant confirmation et conservation des boîtes déjà présentes.
- Export d’une boîte ou de toutes les boîtes avec leur audio ; enregistrement natif sans fermer MindSet.
- Chiffrement conservé, intégrité vérifiée, absence d’écrasement des enregistrements et retour arrière si la sauvegarde locale échoue.
- Lecture du stockage protégée : aucun remplacement par un espace vide ni nettoyage audio si les données sont illisibles.
- Guide MindSet organisé en cinq dossiers, séparé des projets sur l’accueil ; anciens contenus conservés.
- Accueil plus lisible, bouton Recentrer dans la vue arbre.
- Journal détaillé `SUIVI_MINDSET.txt` à la racine.

Les préférences d’affichage et polices locales restent propres à l’ordinateur. Les fichiers `.mindset` sont limités à 256 Mo. Cette version inclut les corrections de mise à jour préparées en 1.3.3 ; aucun installeur 1.3.4 n’est encore publié. Note historique : la mise à jour 1.3.2 a ensuite réussi. La 1.3.5 reprend ce lot et permet une distribution personnelle gratuite.

# 1.3.3 — Installation des mises à jour (en préparation)

- Même parcours : rechercher, télécharger, redémarrer.
- Sauvegarde des notes terminée avant le lancement de l’installation ; annulation si la sauvegarde échoue.
- Vérification du fichier téléchargé et de sa signature Windows avant la fermeture.
- Affichage de la version réellement installée et du résultat de l’installation au lancement suivant.
- Aucune nouvelle tentative d’installation lors d’une fermeture ordinaire.
- Publication réservée aux versions signées, avec contrôle de l’application, de l’installeur et du manifeste avant la mise en ligne.

Cette version attend l’activation d’un certificat reconnu avant de pouvoir être distribuée.

# 1.3.2 — Écriture fluide

- Édition continue dans toutes les vues, sans découpage des paragraphes pendant la frappe.
- Menu `/` avec recherche et choix au clavier pour les titres, listes, tâches, citations, annotations, code, séparateurs et sauts de page.
- Barre de mise en forme sur la sélection et palettes de couleurs plus compactes.
- Retours à la ligne et sorties des titres/listes corrigés ; saisie avec composition respectée.
- Annuler/Rétablir avec restauration du curseur et regroupement des frappes.
- Police système par défaut, nouvelle note vide, plan de la note actualisé pendant l’écriture.
- Les anciennes feuilles et leurs mises en forme sont reprises ; les feuilles indépendantes deviennent des sauts de page explicites.
- Le double-clic dans un titre sélectionne le texte. Le repli reste accessible par la flèche et les boutons dédiés.
- Sauts de page pris en compte dans l’impression et l’export Word ; tableaux conservés au collage.

- Bibliothèque de lecture des manifestes de mise à jour actualisée.

Les boîtes, dossiers, onglets, signets, audio et vue graphique sont conservés. La vue papier affiche un document continu ; les coupures automatiques sont calculées lors de l’impression/PDF.
