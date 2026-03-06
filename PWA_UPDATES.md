# Guide PWA - Mises a jour et compatibilite iOS

## Pourquoi ce document existe

MRP est une PWA installee sur mobile. Sur iOS en particulier, une application deja installee peut rester pilotee par un ancien service worker si la mecanique de mise a jour change trop brutalement.

Le risque est critique :
- l'application web sur ordinateur affiche bien la nouvelle version
- mais l'application iOS deja installee reste bloquee sur l'ancien worker
- l'utilisateur serait alors tente de desinstaller/reinstaller, ce qu'il faut eviter

## Point crucial

Quand on refond la logique PWA, il faut prevoir une **version de transition compatible legacy** pour que les anciennes installations puissent adopter le nouveau systeme sans desinstallation.

La version de transition introduite en `1.0.22` fait deux choses essentielles dans [`sw.js`](sw.js) :

1. elle expose encore `APP_VERSION` et `APP_BUILD`
Le code legacy lisait directement ces constantes dans `sw.js` pour detecter une nouvelle version.

2. elle appelle `self.skipWaiting()` a l'installation
Le code legacy faisait `registration.update()` puis attendait que le nouveau worker prenne la main. Sans activation immediate, certains clients iOS restaient bloques.

## Regles a conserver

Pour chaque future release PWA :

1. incrementer `APP_VERSION` et `APP_BUILD` dans [`script.js`](script.js)
2. incrementer `APP_VERSION` et `APP_BUILD` dans [`sw.js`](sw.js)
3. mettre a jour [`version.json`](version.json)
4. mettre a jour [`manifest.json`](manifest.json)
5. mettre a jour [`package.json`](package.json)
6. mettre a jour le texte visible dans [`index.html`](index.html)

## Sources de verite

- [`script.js`](script.js) : version/build utilises par l'interface et l'enregistrement du service worker
- [`sw.js`](sw.js) : version/build utilises par le bridge legacy et le cache versionne
- [`version.json`](version.json) : version/build compares a distance

Ces trois points doivent rester alignes.

## Procedure de validation recommandee

Avant de considerer une release PWA comme bonne :

1. tester l'application dans un navigateur desktop
2. tester l'application hors ligne apres premier chargement
3. tester une PWA iOS deja installee, idealement depuis une version precedente
4. dans la PWA iOS, faire :
   - ouvrir l'app
   - utiliser `Verifier si l'app est a jour`
   - fermer completement l'app
   - rouvrir l'app
   - verifier le couple `Version • Build`

## A ne pas faire

- ne pas supprimer brutalement le bridge legacy dans `sw.js` sans test reel sur iOS installe
- ne pas changer la strategie de mise a jour sans livrer une version de transition
- ne pas compter uniquement sur le fait que "le site desktop est a jour"

## Etat actuel

La compatibilite legacy iOS a ete retablie avec la release :

- Version `1.0.22`
- Build `06/03/2026 - 13h46`

Le commit Git correspondant est `0dc0d03` (`Bridge legacy PWA updates on iOS`).
