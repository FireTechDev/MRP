# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

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
