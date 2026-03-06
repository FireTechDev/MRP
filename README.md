# MRP - Message Radio Pompier

Application pour générer des messages radio pour les pompiers.

## Structure du projet

- `index.html` - Structure HTML principale
- `styles.css` - Styles CSS
- `script.js` - Logique JavaScript
- `sw.js` - Service Worker pour la PWA
- `manifest.json` - Configuration PWA
- `version.json` - Metadonnees de version/build pour la PWA
- `PWA_UPDATES.md` - Regles de mise a jour PWA et compatibilite iOS
- `CHANGELOG.md` - Historique des modifications

## Installation

Aucune installation requise. Ouvrez simplement `index.html` dans un navigateur ou servez les fichiers via un serveur web local.

## Fonctionnalités

- Génération de messages radio structurés
- Interface mobile-first optimisée iOS
- Menu de navigation flottant en bas de l'écran (conforme aux guidelines iOS)
- Application PWA (installable sur mobile)
- Fonctionne hors ligne
- Support complet de la safe area iOS

## Mises a jour PWA

Le point le plus sensible du projet concerne les mises a jour des PWA deja installees sur iPhone.  
Une refonte de `sw.js` peut laisser des clients iOS bloques sur un ancien service worker si aucune version de transition compatible n'est livree.

La procedure a suivre est documentee dans [PWA_UPDATES.md](PWA_UPDATES.md).

## Version

1.0.22

Voir [CHANGELOG.md](CHANGELOG.md) pour l'historique complet des modifications.
