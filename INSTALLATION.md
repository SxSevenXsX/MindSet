# Installer MindSet sur Windows

## Liens utiles

- Node.js LTS : https://nodejs.org/en/download
- Electron : https://www.electronjs.org/docs/latest/
- electron-builder : https://www.electron.build/
- Auto-update Electron : https://www.electron.build/auto-update
- Installateur Windows NSIS : https://www.electron.build/nsis/
- GitHub Releases : https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository
- Depot MindSet : https://github.com/SxSevenXsX/MindSet

## Installer l'app

L'installateur 1.0.3 pret a installer est ici :

```text
release-1.0.3\MindSet-Setup-1.0.3.exe
```

Double-clique sur ce fichier pour installer MindSet sur ton ordinateur.

Les fichiers techniques de mise a jour de cette version sont aussi ranges dans le meme dossier :

```text
release-1.0.3\MindSet-Setup-1.0.3.exe.blockmap
release-1.0.3\latest.yml
```

## Tester la mise a jour 1.0.3 vers 1.0.4

Les fichiers de la mise a jour 1.0.4 sont prets ici :

```text
release-1.0.4\MindSet-Setup-1.0.4.exe
release-1.0.4\MindSet-Setup-1.0.4.exe.blockmap
release-1.0.4\latest.yml
```

Pour que MindSet 1.0.3 les detecte depuis le bouton `Rechercher`, il faut les publier dans une GitHub Release :

1. Ouvre https://github.com/SxSevenXsX/MindSet/releases
2. Clique `Draft a new release`.
3. Tag : `v1.0.4`.
4. Titre : `MindSet 1.0.4`.
5. Ajoute exactement ces trois fichiers depuis `release-1.0.4`.
6. Publie la release.

Ensuite, ouvre MindSet 1.0.3 installe sur ton ordinateur, puis va dans `Parametres` -> `Mises a jour` -> `Rechercher`.

## Version de reparation updater 1.0.5

Si MindSet affiche une erreur `404` sur `releases.atom`, installe directement cette version :

```text
release-1.0.5\MindSet-Setup-1.0.5.exe
```

Cette version ne passe plus par `releases.atom`. Elle lit directement :

```text
https://github.com/SxSevenXsX/MindSet/releases/latest/download/latest.yml
```

Pour tester une vraie mise a jour automatique apres avoir installe 1.0.5, cree ensuite une release `v1.0.6` avec les trois fichiers de la version suivante :

```text
release-1.0.6\MindSet-Setup-1.0.6.exe
release-1.0.6\MindSet-Setup-1.0.6.exe.blockmap
release-1.0.6\latest.yml
```

La release GitHub doit etre accessible publiquement, sinon GitHub renverra encore `404` a l'application.

## Relancer une generation

Depuis PowerShell, dans le dossier du projet :

```powershell
cd C:\Users\mathi\Desktop\Mind7
npm.cmd run dist
```

Si PowerShell bloque `npm`, utilise toujours `npm.cmd`.

## Lancer MindSet en mode developpement

```powershell
npm.cmd start
```

## Creer une nouvelle version

1. Modifier MindSet.
2. Augmenter la version dans `package.json`, par exemple `1.0.3` vers `1.0.4`.
3. Generer l'installateur :

```powershell
npm.cmd run dist
```

4. Publier une GitHub Release contenant au minimum :

```text
dist\MindSet-Setup-1.0.4.exe
dist\MindSet-Setup-1.0.4.exe.blockmap
dist\latest.yml
```

MindSet utilise `latest.yml` pour savoir qu'une nouvelle version existe.

Pour tester la mise a jour depuis MindSet 1.0.3, cree une release GitHub nommee `v1.0.4` et ajoute exactement ces trois fichiers.

## Mise a jour depuis l'application

Dans MindSet installe :

1. Ouvre les parametres.
2. Va dans `Mises a jour`.
3. Clique `Rechercher`.
4. Si une version existe, clique `Telecharger`.
5. Quand c'est pret, clique `Redemarrer`.

En mode developpement, la mise a jour affiche simplement un message : elle fonctionne vraiment dans l'application installee.
