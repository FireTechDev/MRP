# UI System

## Objectif

Ce document cadre l'harmonisation visuelle de MRP sans toucher au fonctionnel.

## Fondations

### Spacing scale

- `--space-1`: `4px`
- `--space-2`: `8px`
- `--space-3`: `12px`
- `--space-4`: `16px`
- `--space-5`: `20px`
- `--space-6`: `24px`
- `--space-7`: `32px`
- `--space-8`: `40px`
- `--space-9`: `48px`

### Radius scale

- `--radius-sm`: `10px`
- `--radius-md`: `14px`
- `--radius-lg`: `16px`

### Type scale

- `--text-caption`: `13px`
- `--text-body`: `18px`
- `--text-title`: `24px`
- `--text-display`: `26px`

### Composants

- Contrôle standard:
  - hauteur mini `56px`
  - padding `12px 16px`
  - rayon `14px`
- Carte standard:
  - rayon `16px`
  - bordure `1px`
  - ombre légère
- Bouton compteur:
  - `32px`
  - rond
  - variante `plus`
  - variante `moins`

## Règles

- Les espacements verticaux utilisent prioritairement la spacing scale.
- Les titres de page utilisent la même structure: taille, gap, marge basse, soulignement.
- Les champs, boutons secondaires et cartes s'appuient sur les mêmes rayons et paddings.
- Les listes à compteur reposent sur une structure unique.
- Les surfaces sombres reprennent les mêmes composants avec des contrastes adaptés, sans changer leur signification.

## Zones harmonisées

- Header et navigation basse
- Titres de page
- Cards principales
- Formulaires
- Boutons secondaires et primaires
- Listes à compteur
- Étape message
- Historique des messages

## Vigilance

- Ne pas recréer de valeurs arbitraires en `px` si un token existe déjà.
- Toute nouvelle famille de composant doit d'abord réutiliser les fondations existantes.
- Les écrans courts iOS doivent conserver la stabilité actuelle de la tab bar.
