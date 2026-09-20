# Signer et publier MindSet pour Windows

La version 1.3.4 est préparée (y compris les corrections 1.3.3), mais n’est pas distribuée tant qu’un certificat de signature de code reconnu n’a pas été activé. Les versions précédentes étaient non signées ; sur un ordinateur où Smart App Control les bloque, accepter la demande d’administration ne suffit pas à les installer.

Le parcours de l’utilisateur reste **Rechercher → Télécharger → Redémarrer**. La signature intervient lors de la fabrication de la version. L’utilisateur qui installe une mise à jour n’a aucun compte de signature à créer.

## Pourquoi une ancienne version pouvait fonctionner

Windows n’exige pas systématiquement l’achat d’un certificat. [Smart App Control](https://support.microsoft.com/fr-fr/windows/security/threat-malware-protection/smart-app-control-frequently-asked-questions) peut autoriser un programme non signé quand son service de confiance le juge sûr. Un nouvel installeur constitue un nouveau fichier à évaluer ; en l’absence de verdict favorable et de signature valide, il peut être bloqué. Les journaux de l’incident confirment le refus de l’installeur 1.3.2, mais ne permettent pas de dater un éventuel changement de politique Windows ni d’expliquer le verdict des anciennes versions.

Le contrôle obligatoire des signatures ajouté dans le code 1.3.3 est un choix de fiabilité du processus de publication. Cette version n’étant pas installée sur le poste concerné, ce nouveau contrôle n’est pas la cause de l’échec déjà observé. Une signature reconnue peut être fournie gratuitement dans certains programmes ; signature ne signifie pas nécessairement achat.

## Pistes gratuites à examiner avant un achat

- [SignPath Foundation](https://signpath.org/terms.html) propose la signature gratuite aux projets open source qu’elle accepte. Il faut notamment une licence compatible pour tous les composants, un projet publié et documenté, une réputation vérifiable, l’authentification multifacteur et une approbation de chaque version. MindSet n’est pas encore accepté. Le champ ISC de package.json ne remplace pas la vérification des licences et des conditions d’admission. Cette intégration nécessitera un parcours de construction adapté si la candidature est retenue.
- Le [portail Microsoft d’analyse des fichiers](https://www.microsoft.com/en-us/wdsi/filesubmission) propose Smart App Control parmi les produits concernés. Un réexamen peut être demandé pour le fichier bloqué ; il ne garantit pas le déblocage, ni l’acceptation des versions futures. Vérifier la limite d’envoi affichée avant de transmettre l’installeur.

Aucune demande externe n’a été déposée et aucune adhésion à ces services n’est présumée.

## Activation initiale du certificat

Pour un développeur individuel en France, la configuration prévue utilise un certificat de signature de code accessible dans le magasin de certificats Windows, par exemple via le client SimplySign de Certum ou un support matériel compatible SignTool. Le certificat doit être délivré par une autorité reconnue et la clé privée doit rester chez son titulaire.

[Certum](https://shop.certum.eu/code-signing.html) accepte les particuliers, mais ses prix d’appel de 139 € en Standard et de 25 € en Open Source concernent un code pour des clients disposant déjà de la carte et du lecteur nécessaires. L’offre Open Source dans le cloud est affichée à partir de 49 € et indisponible lors de la vérification du 19 septembre 2026. Ces offres ne sont pas des droits de signature à vie : après expiration, signer de nouvelles versions demande une nouvelle période de validité. Le titulaire doit effectuer lui-même la validation d’identité et activer son moyen de signature. Aucun compte ni achat n’est créé par les scripts de ce dépôt.

Le service [Microsoft Artifact Signing Public Trust](https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart) ne prend actuellement en charge les particuliers qu’aux États-Unis et au Canada. Les offres dédiées aux projets open source ont leurs propres conditions d’éligibilité ; elles ne sont pas présumées acquises pour une application personnelle.

Une signature valide ne dispense pas du test sur le poste concerné : Windows conserve ses contrôles de confiance et de réputation. La procédure ne modifie aucune protection Windows.

## Fabrication et publication depuis le poste du titulaire

1. Activer le certificat et son client officiel. Pour un certificat dans le cloud, ouvrir une session de signature dans ce client ; pour un support matériel, le connecter.
2. Relever le nom exact du titulaire et l’empreinte du certificat, sans exporter la clé privée :

```powershell
Get-ChildItem Cert:\CurrentUser\My -CodeSigningCert |
  Select-Object Subject, Thumbprint, NotAfter
```

3. Définir les deux paramètres dans la session utilisée pour fabriquer MindSet :

```powershell
$env:SIGNING_PUBLISHER_NAME = 'Nom exact du titulaire dans le certificat'
$env:SIGNING_CERTIFICATE_SHA1 = 'EMPREINTE_HEXADECIMALE_DE_40_CARACTERES'
```

4. Actualiser la version dans `package.json`, `package-lock.json` et `CHANGELOG.md`. Quand le certificat est actif, retirer la mention « en préparation » des notes de cette version. Tester avec `npm test`, valider les fichiers, puis créer et pousser le tag correspondant à ce commit.
5. Lancer `npm run release`. Le script teste, fabrique l’application et l’installeur signés, contrôle les deux signatures et leur horodatage, puis vérifie le manifeste. Il ouvre ensuite un brouillon GitHub, envoie les trois fichiers et publie seulement quand leurs contrôles passent. Un échec d’envoi laisse le brouillon en place ; une version déjà publique ne sera jamais remplacée.

Pour fabriquer et vérifier les fichiers sans les publier :

```powershell
npm run dist:signed
node scripts/verify-windows-signatures.cjs
npm run verify:release
```

`dist/signature-verification.json` relie les contrôles Windows à l’installeur produit. Le manifeste `latest.yml` doit contenir l’empreinte du fichier après signature. La configuration oblige la signature et inscrit le nom du titulaire dans la configuration des mises à jour pour contrôler les futurs téléchargements.

## Variante GitHub Actions

Le workflow **Publish Windows release** prend en charge un certificat existant utilisable par electron-builder via `CSC_LINK` et `CSC_KEY_PASSWORD` (secrets GitHub), avec `SIGNING_PUBLISHER_NAME` comme variable du dépôt. Ne jamais placer ces secrets dans le code ou dans une conversation.

Cette variante ne rend pas exportable une clé cloud ou matérielle : pour SimplySign, utiliser la publication depuis le poste connecté décrite ci-dessus. Sans configuration de signature utilisable, le workflow s’arrête avant publication. Les commandes de développement `npm run pack` et `npm run dist` ne constituent pas des versions publiables.

## Vérification avant de considérer l’incident résolu

- Sur un profil de test, partir d’une version antérieure et utiliser les trois boutons.
- Vérifier la sauvegarde des notes, l’installation et le lancement de la nouvelle version.
- Rechercher à nouveau : la version installée doit être annoncée à jour.
- Annuler l’installeur sur le profil de test : au lancement suivant, l’ancienne version doit être explicitement signalée, sans nouvelle installation automatique lors d’une fermeture ordinaire.
- Sur le poste initialement bloqué, vérifier le même parcours avec le certificat reconnu et les protections Windows toujours actives.

Les tests automatisés couvrent le parcours, les doubles clics, la sauvegarde et son échec, l’intégrité des fichiers, les signatures absentes, les manifestes incohérents et le résultat au lancement suivant. Ils ne remplacent pas cet essai d’installation avec le véritable certificat.
