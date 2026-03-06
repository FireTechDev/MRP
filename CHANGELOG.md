# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

## [1.0.22] - 2026-03-06

### 🔧 Corrections
- **Compatibilite iOS legacy** : ajout d'un bridge dans le service worker pour permettre aux PWA iOS deja installees d'adopter la nouvelle mecanique de mise a jour sans desinstallation
- **Activation immediate** : reintroduction de `skipWaiting()` dans la release de transition pour debloquer les anciens clients qui faisaient deja `registration.update()`

### 📝 Documentation
- Ajout de `PWA_UPDATES.md` pour documenter la procedure critique de mise a jour PWA et les precautions a prendre pour les clients iOS deja installes

## [1.0.21] - 2026-03-06

### 🚀 Refactorisation majeure
- **PWA** : refonte complete du service worker avec caches versionnes, `version.json`, manifest relatif et flux de mise a jour plus robuste inspire de SunApp
- **Versioning** : affichage de `Version • Build` dans l'interface pour suivre clairement les mises a jour deployees

## [1.0.20] - 2025-01-12

### ✨ Nouvelles fonctionnalités
- **Barre de navigation en haut** : Ajout d'une barre de menu fixe avec icône ronde et titre "Message radio pompier"
- **Menu burger** : Menu latéral slide depuis la droite avec navigation
- **Page À propos** : Nouvelle page accessible depuis le menu avec toutes les informations de l'application
- **Navigation** : Système de navigation entre page principale et page À propos

### 🎨 Améliorations
- Icône de l'application en mode rond dans la barre de menu
- Espacement harmonieux en haut de chaque page
- Menu latéral avec animations fluides et support de la safe area iOS

---

## [1.0.19] - 2025-01-12

### ✨ Améliorations
- **Menu de navigation** : Augmentation de la hauteur du menu selon les guidelines iOS (49pt minimum)
- **Compatibilité iOS** : Ajout d'un espace supplémentaire sous le menu pour éviter les conflits avec la barre de navigation système iOS
- **Safe Area** : Support complet de la safe area iOS pour les iPhone avec encoche (Face ID)
- **Zones tactiles** : Chaque bouton du menu respecte maintenant la taille minimale recommandée iOS (44pt)

### 🔧 Corrections
- Correction du conflit entre le menu de l'app et la barre de navigation système iOS lors du switch entre applications

### 📱 Interface
- Menu flottant en bas de l'écran avec meilleur espacement
- Padding vertical augmenté pour une meilleure accessibilité
- Support de `viewport-fit=cover` pour une meilleure intégration iOS

---

## [1.0.18] - 2025-01-12

### 🚀 Refactorisation majeure
- **Architecture** : Séparation du CSS et JavaScript dans des fichiers externes (`styles.css` et `script.js`)
- **Menu de navigation** : Transformation du menu horizontal en menu flottant en bas de l'écran (style application mobile)
- **Service Worker** : Mise à jour du cache (v2) pour inclure les nouveaux fichiers CSS et JS
- **Performance** : Amélioration du chargement grâce à la séparation des fichiers

### 📝 Documentation
- Ajout d'un guide de restauration (`RESTAURATION.md`) pour faciliter le retour en arrière si nécessaire
- Mise à jour du README avec la nouvelle structure du projet

### 🔄 Migration
- Migration complète de MRP2 vers MRP
- Création d'une branche de sauvegarde (`backup-before-mrp2-migration`) pour sécurité

---

## Versions précédentes

Pour l'historique complet des versions précédentes, consultez les commits Git sur [GitHub](https://github.com/FireTechDev/MRP/commits/main).
