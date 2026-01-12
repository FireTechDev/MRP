# Guide de restauration - Retour en arrière MRP

## ⚠️ IMPORTANT
Ce document explique comment restaurer la version précédente de MRP si la nouvelle version (MRP2) ne fonctionne pas correctement sur mobile.

## 📦 Sauvegarde créée

Une branche de sauvegarde a été créée **AVANT** la migration vers MRP2 :
- **Branche locale** : `backup-before-mrp2-migration`
- **Branche GitHub** : `origin/backup-before-mrp2-migration`
- **Commit de sauvegarde** : `f3667bd` (dernier commit avant la migration)

## 🔄 Méthode 1 : Restaurer depuis la branche de sauvegarde (RECOMMANDÉ)

### Sur votre machine locale :

```bash
cd /Users/tael/Documents/FireTechDev/MRP

# Option A : Créer une nouvelle branche depuis la sauvegarde
git checkout -b restore-old-version backup-before-mrp2-migration
git push origin restore-old-version

# Option B : Restaurer directement sur main (ATTENTION : force push requis)
git checkout backup-before-mrp2-migration
git branch -D main
git checkout -b main
git push --force-with-lease origin main
```

### Via GitHub (interface web) :

1. Allez sur https://github.com/FireTechDev/MRP/branches
2. Trouvez la branche `backup-before-mrp2-migration`
3. Cliquez sur "New pull request"
4. Créez une pull request pour fusionner cette branche dans `main`
5. Mergez la pull request

## 🔄 Méthode 2 : Revert le commit de migration

Si vous préférez annuler uniquement le commit de migration :

```bash
cd /Users/tael/Documents/FireTechDev/MRP
git revert 8a63543
git push origin main
```

## 🔄 Méthode 3 : Reset vers le commit précédent

**⚠️ ATTENTION : Cette méthode réécrit l'historique**

```bash
cd /Users/tael/Documents/FireTechDev/MRP
git reset --hard f3667bd
git push --force-with-lease origin main
```

## 📋 Vérification

Après restauration, vérifiez que :
- ✅ L'application fonctionne correctement sur mobile
- ✅ Le service worker se met à jour
- ✅ Les fonctionnalités principales sont opérationnelles

## 📝 Notes

- Le commit de migration est : `8a63543`
- Le commit de sauvegarde est : `f3667bd`
- La branche de sauvegarde est disponible sur GitHub et localement
- Tous les fichiers de l'ancienne version sont préservés dans la branche `backup-before-mrp2-migration`

## 🔗 Liens utiles

- Branche de sauvegarde sur GitHub : https://github.com/FireTechDev/MRP/tree/backup-before-mrp2-migration
- Commit de sauvegarde : https://github.com/FireTechDev/MRP/commit/f3667bd
- Commit de migration : https://github.com/FireTechDev/MRP/commit/8a63543
