// Configuration des points de bonheur
export const HAPPINESS_CONFIG = {
  // Besoins de base
  EAU: 25,
  NOURRITURE: 25,
  
  // Besoins secondaires
  VETEMENTS: 15,
  MEDICAMENTS: 15,
  
  // Pénalités
  MANQUE_EAU: -30,
  MANQUE_NOURRITURE: -30,
  MANQUE_VETEMENTS: -20,
  MANQUE_MEDICAMENTS: -20,
  
  // Bonus/Malus qualité nourriture (sur 10)
  QUALITE_NOURRITURE_EXCELLENTE: 10, // 9-10
  QUALITE_NOURRITURE_BONNE: 5, // 7-8
  QUALITE_NOURRITURE_MOYENNE: 0, // 5-6
  QUALITE_NOURRITURE_MAUVAISE: -5, // 3-4
  QUALITE_NOURRITURE_TERRIBLE: -10, // 0-2
  
  // Plafonds de bonheur par type de logement
  SANS_LOGEMENT: 50,
  DORTOIR: 80,
  QUARTIERS: 90,
  APPARTEMENT: 95,
  SUITE: 100,
  
  // Valeur par défaut
  DEFAULT: 50
} as const

// Configuration de la mortalité
export const DEATH_CONFIG = {
  AGE_75: 75 * 52, // 75 ans en semaines
  AGE_85: 85 * 52, // 85 ans en semaines
  AGE_95: 95 * 52, // 95 ans en semaines
  CHANCE_75: 0.05, // 1/20
  CHANCE_85: 0.1,  // 1/10
  CHANCE_95: 0.2,  // 1/5
} as const

// Configuration générale du jeu
export const GAME_CONFIG = {
  INITIAL_LEVELS: 5,
  ROOMS_PER_SIDE: 7,
  BASE_EXCAVATION_TIME: 4,
  DEPTH_TIME_MULTIPLIER: 0.5,
  MERGE_MULTIPLIERS: {
    2: 2.5,
    3: 4.0,
    4: 6.0,
    5: 8.0,
    6: 10.0,
  },
  INITIAL_ROOMS: [
    {
      levelId: 0,
      rooms: [
        { position: 'left', index: 0, type: 'generateur', gridSize: 2, workers: 1 },
        { position: 'right', index: 0, type: 'dortoir', gridSize: 2, workers: 0 },
        { position: 'right', index: 4, type: 'salle-controle', gridSize: 2, workers: 0 }
      ]
    },
    {
      levelId: 1,
      rooms: [
        { position: 'left', index: 0, type: 'cuve', gridSize: 1, workers: 0 },
        { position: 'left', index: 4, type: 'chambre-froide', gridSize: 1, workers: 0 },
        { position: 'left', index: 5, type: 'entrepot', gridSize: 2, workers: 0 },
      ]
    }
  ]
} as const 