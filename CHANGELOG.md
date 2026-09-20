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

Les préférences d’affichage et polices locales restent propres à l’ordinateur. Les fichiers `.mindset` sont limités à 256 Mo. Cette version inclut les corrections de mise à jour préparées en 1.3.3 ; aucun installeur 1.3.4 n’est encore publié. Le blocage Windows de l’ancien installeur n’est pas résolu par ces changements.

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
