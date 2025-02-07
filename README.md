# L'Abri

Un jeu de gestion d'abri post-apocalyptique inspiré de "Silo" et "Fallout Shelter", développé avec Vue.js 3.

## Fonctionnalités

- Gestion des ressources (énergie, eau, nourriture, vêtements, médicaments)
- Construction et excavation de niveaux
- Gestion de la population et de leurs besoins
- Système de temps avec possibilité d'accélération
- Sauvegarde automatique dans le localStorage

## Installation

1. Clonez le dépôt :
```bash
git clone [URL_DU_REPO]
cd l-abri
```

2. Installez les dépendances :
```bash
npm install
```

3. Lancez le serveur de développement :
```bash
npm run dev
```

4. Ouvrez votre navigateur à l'adresse indiquée (généralement http://localhost:5173)

## Technologies utilisées

- Vue.js 3 avec Composition API
- TypeScript
- Vite
- Pinia pour la gestion d'état
- SCSS pour les styles

## Structure du projet

```
src/
├── components/         # Composants Vue
│   ├── ResourcePanel.vue
│   └── SiloLevel.vue
├── stores/            # Stores Pinia
│   └── gameStore.ts
├── App.vue            # Composant racine
├── main.ts           # Point d'entrée
└── style.css         # Styles globaux
```

## Commandes disponibles

- `npm run dev` : Lance le serveur de développement
- `npm run build` : Compile le projet pour la production
- `npm run preview` : Prévisualise la version de production

## Contrôles du jeu

- Molette de la souris : Défilement vertical du silo
- Boutons de vitesse : Contrôle de la vitesse du jeu (x1, x2, x3)
- Bouton Pause : Met le jeu en pause
- Bouton Réinitialiser : Réinitialise complètement le jeu

## Mécaniques de jeu

### Ressources
- Chaque ressource a une production et une consommation par habitant
- Le niveau de bonheur est calculé en fonction de la disponibilité des ressources

### Construction
- Les niveaux doivent être excavés avant de pouvoir construire
- Différents types de salles disponibles (stockage, dortoir, cuisine, etc.)
- Chaque type de salle a des effets spécifiques sur la production/consommation

### Population
- Les habitants consomment des ressources
- Le bonheur de la population dépend de la satisfaction des besoins

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## Licence

MIT
