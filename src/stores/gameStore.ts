import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface NurserieState {
  isIncubating: boolean
  startTime?: number
  embryonType?: ItemType
}

export interface Resource {
  amount: number
  capacity: number
  production: number
  consumption: number
}

type ResourceKey = 'energie' | 'eau' | 'nourriture' | 'vetements' | 'medicaments'

export interface ExcavationProgress {
  startTime: number // Semaine de début
  duration: number // Durée en semaines
  levelId: number
  position: 'left' | 'right' | 'stairs'
  roomIndex?: number
}

export interface Competences {
  force: number
  dexterite: number
  charme: number
  relations: number
  instinct: number
  savoir: number
}

export interface Affectation {
  type: 'construction' | 'excavation' | 'salle' | null
  levelId?: number
  position?: 'left' | 'right' | 'stairs'
  roomIndex?: number
}

export interface Habitant {
  id: string
  nom: string
  genre: 'H' | 'F'
  age: number // Âge en années
  sante: number // Santé en pourcentage
  affectation: Affectation
  competences: Competences
  bonheur: number // Score de bonheur sur 100
  logement: {
    levelId: number
    position: 'left' | 'right'
    roomIndex: number
  } | null
}

export interface Equipment {
  id: string
  type: string
  isUnderConstruction: boolean
  constructionStartTime?: number
  constructionDuration?: number
  nurserieState?: NurserieState
}

export interface Room {
  id: string
  type: string
  isBuilt: boolean
  isUnderConstruction?: boolean
  constructionStartTime?: number
  constructionDuration?: number
  occupants: string[]
  position: 'left' | 'right'
  index: number
  isExcavated: boolean
  gridSize?: number // Nombre de cellules occupées par la salle
  stairsPosition?: 'left' | 'right'
  equipments: Equipment[]
  fuelLevel?: number // Niveau de carburant en pourcentage (0-100)
  nextMineralsToProcess?: { // Pour la raffinerie
    input: { type: ItemType, amount: number }[]
    output: { type: ItemType, amount: number }
  }
}

export interface Level {
  id: number
  isStairsExcavated: boolean
  leftRooms: Room[]
  rightRooms: Room[]
}

export interface RoomCategory {
  id: string
  name: string
  rooms: string[]
}

export const ROOM_CATEGORIES: RoomCategory[] = [
  {
    id: 'stockage',
    name: 'Stockage',
    rooms: ['entrepot', 'cuve']
  },
  {
    id: 'logements',
    name: 'Logements',
    rooms: ['dortoir', 'quartiers', 'appartement', 'suite']
  },
  {
    id: 'eau',
    name: 'Eau',
    rooms: ['station-traitement']
  },
  {
    id: 'alimentation',
    name: 'Alimentation',
    rooms: ['cuisine', 'serre']
  },
  {
    id: 'energie',
    name: 'Énergie',
    rooms: ['generateur']
  },
  {
    id: 'sante',
    name: 'Santé',
    rooms: ['infirmerie']
  },
  {
    id: 'production',
    name: 'Production',
    rooms: ['raffinerie', 'derrick', 'atelier']
  }
]

// Configuration du jeu
export const GAME_CONFIG = {
  INITIAL_LEVELS: 5,
  ROOMS_PER_SIDE: 7,
  BASE_EXCAVATION_TIME: 4,
  DEPTH_TIME_MULTIPLIER: 0.5,
  MERGE_MULTIPLIERS: {
    2: 2.5, // 2 salles fusionnées
    3: 4.0, // 3 salles fusionnées
    4: 6.0, // 4 salles fusionnées
    5: 8.0, // 5 salles fusionnées
    6: 10.0, // 6+ salles fusionnées
  },
  // Configuration des salles pré-construites au démarrage
  INITIAL_ROOMS: [
    {
      levelId: 0, // RDC
      rooms: [
        { position: 'left', index: 0, type: 'generateur', gridSize: 2, workers: 1 },
        
        //{ position: 'left', index: 4, type: 'raffinerie', gridSize: 1, workers: 1 },
        { position: 'right', index: 0, type: 'dortoir', gridSize: 2, workers: 0 },
        //{ position: 'right', index: 2, type: 'station-traitement', gridSize: 1, workers: 1 },
        //{ position: 'right', index: 3, type: 'serre', gridSize: 1, workers: 1 }
        { position: 'right', index: 4, type: 'salle-controle', gridSize: 2, workers: 0 }
      ]
    },
    {
      levelId: 1, // Premier niveau
      rooms: [
        { position: 'left', index: 0, type: 'cuve', gridSize: 1, workers: 0 },
        { position: 'left', index: 5, type: 'entrepot', gridSize: 2, workers: 0 },
      ]
    }
  ]
} as const

// Configuration des multiplicateurs de fusion par type de salle
export const ROOM_MERGE_CONFIG: { [key: string]: { useMultiplier: boolean } } = {
  entrepot: { useMultiplier: true },
  dortoir: { useMultiplier: false },
  quartiers: { useMultiplier: false },
  appartement: { useMultiplier: false },
  suite: { useMultiplier: false },
  cuisine: { useMultiplier: true },
  'station-traitement': { useMultiplier: true },
  generateur: { useMultiplier: true },
  infirmerie: { useMultiplier: true },
  serre: { useMultiplier: true },
  raffinerie: { useMultiplier: true },
  derrick: { useMultiplier: true },
  'salle-controle': { useMultiplier: false },
  cuve: { useMultiplier: false },
  atelier: { useMultiplier: true }
}

export const INITIAL_LEVELS = GAME_CONFIG.INITIAL_LEVELS // Nombre de niveaux au départ
export const ROOMS_PER_SIDE = GAME_CONFIG.ROOMS_PER_SIDE // Nombre de salles de chaque côté
const BASE_EXCAVATION_TIME = GAME_CONFIG.BASE_EXCAVATION_TIME // 4 semaines de base
const DEPTH_TIME_MULTIPLIER = GAME_CONFIG.DEPTH_TIME_MULTIPLIER // +0.5 semaine par niveau de profondeur

interface Resources {
  energie: {
    amount: number
    capacity: number
    production: number
    consumption: number
  }
  eau: {
    amount: number
    capacity: number
    production: number
    consumption: number
  }
  nourriture: {
    amount: number
    capacity: number
    production: number
    consumption: number
  }
  vetements: {
    amount: number
    capacity: number
    production: number
    consumption: number
  }
  medicaments: {
    amount: number
    capacity: number
    production: number
    consumption: number
  }
}

const resources = ref<Resources>({
  energie: { amount: 0, capacity: 200, production: 0, consumption: 0 },
  eau: { amount: 200, capacity: 200, production: 0, consumption: 0 },
  nourriture: { amount: 200, capacity: 200, production: 0, consumption: 0 },
  vetements: { amount: 50, capacity: 200, production: 0, consumption: 0 },
  medicaments: { amount: 100, capacity: 200, production: 0, consumption: 0 }
})

interface RoomConfigBase {
  maxWorkers: number
  energyConsumption: number // Consommation d'énergie par semaine
}

export interface StorageRoomConfig extends RoomConfigBase {
  capacityPerWorker: {
    [key in ResourceKey]?: number
  }
}

export interface DortoryRoomConfig extends RoomConfigBase {
  capacityPerResident: number
}

export interface ProductionRoomConfig extends RoomConfigBase {
  productionPerWorker: {
    [key in ResourceKey]?: number
  }
  waterConsumption?: number
  fuelConsumption?: number // Consommation de carburant par semaine en pourcentage
  resourceConsumption?: {
    [key in ResourceKey]?: number
  }
  resourceProduction?: {
    [key in ResourceKey]?: number
  }
  mineralsProcessingPerWorker?: number // Nombre de minerais traités par travailleur par semaine
  conversionRules?: {
    [key: string]: {
      output: ItemType,
      ratio: number,
      requires?: {
        [key: string]: number
      }
    }
  }
}

export type RoomConfig = StorageRoomConfig | DortoryRoomConfig | ProductionRoomConfig

export const ROOM_CONFIGS: { [key: string]: RoomConfig } = {
  entrepot: {
    maxWorkers: 2,
    energyConsumption: 1, // 1 unité d'énergie par semaine
    capacityPerWorker: {
      nourriture: 100,
      vetements: 50,
      medicaments: 25
    }
  } as StorageRoomConfig,
  dortoir: {
    maxWorkers: 0,
    energyConsumption: 2, // 2 unités d'énergie par semaine
    capacityPerResident: 8
  } as DortoryRoomConfig,
  quartiers: {
    maxWorkers: 0,
    energyConsumption: 3, // 3 unités d'énergie par semaine
    capacityPerResident: 6
  } as DortoryRoomConfig,
  appartement: {
    maxWorkers: 0,
    energyConsumption: 4, // 4 unités d'énergie par semaine
    capacityPerResident: 4
  } as DortoryRoomConfig,
  suite: {
    maxWorkers: 0,
    energyConsumption: 5, // 5 unités d'énergie par semaine
    capacityPerResident: 2
  } as DortoryRoomConfig,
  cuisine: {
    maxWorkers: 2,
    energyConsumption: 3, // 3 unités d'énergie par semaine
    productionPerWorker: {
      nourriture: 2
    }
  } as ProductionRoomConfig,
  'station-traitement': {
    maxWorkers: 2,
    energyConsumption: 4, // 4 unités d'énergie par semaine
    productionPerWorker: {
      eau: 8
    }
  } as ProductionRoomConfig,
  generateur: {
    maxWorkers: 2,
    energyConsumption: 0, // La salle d'énergie ne consomme pas d'énergie
    productionPerWorker: {
      energie: 8
    },
    fuelConsumption: 10 // Consomme 10% du réservoir par semaine par travailleur
  } as ProductionRoomConfig,
  infirmerie: {
    maxWorkers: 2,
    energyConsumption: 5, // 5 unités d'énergie par semaine
    productionPerWorker: {
      medicaments: 1
    }
  } as ProductionRoomConfig,
  serre: {
    maxWorkers: 3,
    energyConsumption: 4, // 4 unités d'énergie par semaine
    waterConsumption: 2, // 2 unités d'eau par semaine
    productionPerWorker: {
      laitue: 2 // Production de base de laitue
    }
  } as ProductionRoomConfig,
  raffinerie: {
    maxWorkers: 3,
    energyConsumption: 5, // 5 unités d'énergie par semaine
    productionPerWorker: {
      energie: -1 // Consommation d'énergie par travailleur
    },
    mineralsProcessingPerWorker: 5, // Nombre de minerais traités par travailleur par semaine
    conversionRules: {
      'minerai-fer': { output: 'lingot-fer', ratio: 0.8 }, // 80% de rendement
      'minerai-cuivre': { output: 'lingot-cuivre', ratio: 0.8 },
      'minerai-silicium': { output: 'lingot-silicium', ratio: 0.7 },
      'minerai-or': { output: 'lingot-or', ratio: 0.9 },
      'lingot-fer': { 
        output: 'lingot-acier', 
        ratio: 0.8, 
        requires: { 
          'minerai-charbon': 1,
          'minerai-calcaire': 0.5
        }
      } // 1 lingot de fer + 1 charbon + 0.5 calcaire = 0.8 acier
    }
  } as ProductionRoomConfig & {
    mineralsProcessingPerWorker: number,
    conversionRules: {
      [key: string]: {
        output: ItemType,
        ratio: number,
        requires?: {
          [key: string]: number
        }
      }
    }
  },
  derrick: {
    maxWorkers: 2,
    energyConsumption: 4, // 4 unités d'énergie par semaine
    productionPerWorker: {
      energie: -1 // Consommation d'énergie par travailleur
    },
    fuelConsumption: 0, // Ne consomme pas de carburant
    resourceProduction: {
      'baril-petrole': 2 // Produit 2 barils de pétrole par semaine par travailleur
    }
  } as ProductionRoomConfig,
  'salle-controle': {
    maxWorkers: 4,
    energyConsumption: 8, // 8 unités d'énergie par semaine
    productionPerWorker: {
      energie: -1 // Consommation d'énergie par travailleur
    }
  } as ProductionRoomConfig,
  cuve: {
    'lingot-fer': 30,
    'lingot-acier': 15,
    'lingot-cuivre': 12,
    'lingot-silicium': 8
  },
  atelier: {
    maxWorkers: 2,
    energyConsumption: 3,
    productionPerWorker: {
      vetements: 0 // Production de base sans équipement
    }
  } as ProductionRoomConfig
} as const

const PRENOMS = [
  'Jean', 'Pierre', 'Luc', 'Louis', 'Thomas', 'Paul', 'Nicolas', 'Antoine',
  'Michel', 'François', 'Henri', 'Marcel', 'André', 'Philippe', 'Jacques', 'Robert',
  'Daniel', 'Joseph', 'Claude', 'Georges', 'Roger', 'Bernard', 'Alain', 'René', // Prénoms masculins
  'Marie', 'Sophie', 'Emma', 'Julie', 'Claire', 'Alice', 'Laura', 'Léa',
  'Anne', 'Catherine', 'Isabelle', 'Jeanne', 'Marguerite', 'Françoise', 'Hélène', 'Louise',
  'Madeleine', 'Thérèse', 'Suzanne', 'Monique', 'Simone', 'Yvette', 'Nicole', 'Denise' // Prénoms féminins
]

const NOMS = [
  'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand',
  'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David',
  'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel', 'Girard', 'Andre', 'Lefevre',
  'Mercier', 'Dupont', 'Lambert', 'Bonnet', 'Francois', 'Martinez', 'Legrand', 'Garnier',
  'Faure', 'Rousseau', 'Blanc', 'Guerin', 'Muller', 'Henry', 'Roussel', 'Nicolas'
]

function generateRandomName(): { nom: string, genre: 'H' | 'F', age: number } {
  const genre = Math.random() > 0.5 ? 'H' : 'F'
  const prenom = genre === 'H' 
    ? PRENOMS.filter((_, i) => i < PRENOMS.length / 2)[Math.floor(Math.random() * (PRENOMS.length / 2))]
    : PRENOMS.filter((_, i) => i >= PRENOMS.length / 2)[Math.floor(Math.random() * (PRENOMS.length / 2))]
  const nom = NOMS[Math.floor(Math.random() * NOMS.length)]
  const ageEnAnnees = Math.floor(Math.random() * 53) + 8 // Entre 8 et 60 ans
  const ageEnSemaines = ageEnAnnees * 52 // Conversion en semaines
  return { nom: `${prenom} ${nom}`, genre, age: ageEnSemaines }
}

function generateRandomCompetences(): Competences {
  const competences = ['force', 'dexterite', 'charme', 'relations', 'instinct', 'savoir']
  const points = Array(6).fill(1) // Chaque compétence commence à 1
  let remainingPoints = 21 // 27 - 6 points déjà distribués

  // Distribution aléatoire des points restants
  while (remainingPoints > 0) {
    const index = Math.floor(Math.random() * competences.length)
    if (points[index] < 10) { // Maximum de 10 points par compétence
      points[index]++
      remainingPoints--
    }
  }

  return {
    force: points[0],
    dexterite: points[1],
    charme: points[2],
    relations: points[3],
    instinct: points[4],
    savoir: points[5]
  }
}

interface Excavation {
  levelId: number
  position: 'left' | 'right' | 'stairs'
  roomIndex?: number
  startTime: number
  habitantId: string
  duration: number
  mineralsFound?: MineralFound[]
}

export interface Item {
  id: string
  type: string
  quantity: number
  stackSize: number
  description: string
  category: ItemCategory
  ratio?: number
  qualite?: number
}

export type ItemCategory = 'biologique' | 'ressource' | 'nourriture' | 'conteneur' | 'ressource-brute'
export type ItemType = 
  | 'minerai-fer' | 'minerai-cuivre' | 'minerai-silicium' | 'minerai-or'
  | 'minerai-charbon' | 'minerai-calcaire'
  | 'lingot-fer' | 'lingot-cuivre' | 'lingot-silicium' | 'lingot-or' | 'lingot-acier'
  | 'baril-petrole' | 'baril-vide'
  | 'laitue' | 'tomates' | 'avoine' | 'nourriture-conserve'
  | 'soie' | 'vetements' | 'embryon-humain'

export interface BaseItemConfig {
  name: string
  stackSize: number
  description: string
  category: ItemCategory
}

export interface FoodItemConfig extends BaseItemConfig {
  category: 'nourriture'
  ratio: number
  qualite: number
}

export interface ResourceItemConfig extends BaseItemConfig {
  category: 'ressource' | 'ressource-brute'
}

export interface BiologicalItemConfig extends BaseItemConfig {
  category: 'biologique'
}

export interface ContainerItemConfig extends BaseItemConfig {
  category: 'conteneur'
}

export type ItemConfig = FoodItemConfig | ResourceItemConfig | BiologicalItemConfig | ContainerItemConfig

export const ITEMS_CONFIG: { [key in ItemType]: ItemConfig } = {
  'embryon-humain': {
    name: 'Embryon humain',
    stackSize: 1,
    description: 'Un embryon humain cryogénisé',
    category: 'biologique'
  } as BiologicalItemConfig,
  'avoine': {
    name: 'Avoine',
    stackSize: 1000,
    description: 'Des grains d\'avoine cultivés dans les serres.',
    category: 'nourriture',
    ratio: 5,
    qualite: 1
  } as FoodItemConfig,
  'tomates': {
    name: 'Tomates',
    stackSize: 1000,
    description: 'Des tomates fraîches cultivées dans les serres.',
    category: 'nourriture',
    ratio: 3,
    qualite: 2
  } as FoodItemConfig,
  'laitue': {
    name: 'Laitue',
    stackSize: 1000,
    description: 'De la laitue fraîche cultivée dans les serres.',
    category: 'nourriture',
    ratio: 10,
    qualite: 1
  } as FoodItemConfig,
  'nourriture-conserve': {
    name: 'Conserves',
    stackSize: 1000,
    description: 'De la nourriture en conserve.',
    category: 'nourriture',
    ratio: 1,
    qualite: 1
  } as FoodItemConfig,
  'soie': {
    name: 'Soie',
    stackSize: 100,
    description: 'De la soie brute produite par les vers à soie',
    category: 'ressource'
  } as ResourceItemConfig,
  'baril-petrole': {
    name: 'Baril de pétrole',
    stackSize: 10,
    description: 'Un baril rempli de pétrole.',
    category: 'conteneur'
  } as ContainerItemConfig,
  'baril-vide': {
    name: 'Baril vide',
    stackSize: 10,
    description: 'Un baril vide qui peut contenir du pétrole.',
    category: 'conteneur'
  } as ContainerItemConfig,
  'minerai-fer': {
    name: 'Minerai de fer',
    stackSize: 1000,
    description: 'Du minerai de fer brut.',
    category: 'ressource-brute'
  } as ResourceItemConfig,
  'minerai-charbon': {
    name: 'Charbon',
    stackSize: 1000,
    description: 'Du charbon brut.',
    category: 'ressource-brute'
  } as ResourceItemConfig,
  'minerai-silicium': {
    name: 'Minerai de silicium',
    stackSize: 1000,
    description: 'Du minerai de silicium brut.',
    category: 'ressource-brute'
  } as ResourceItemConfig,
  'minerai-cuivre': {
    name: 'Minerai de cuivre',
    stackSize: 1000,
    description: 'Du minerai de cuivre brut.',
    category: 'ressource-brute'
  } as ResourceItemConfig,
  'minerai-or': {
    name: 'Minerai d\'or',
    stackSize: 1000,
    description: 'Du minerai d\'or brut.',
    category: 'ressource-brute'
  } as ResourceItemConfig,
  'minerai-calcaire': {
    name: 'Calcaire',
    stackSize: 1000,
    description: 'Du calcaire brut.',
    category: 'ressource-brute'
  } as ResourceItemConfig,
  'lingot-fer': {
    name: 'Lingot de fer',
    stackSize: 100,
    description: 'Un lingot de fer pur',
    category: 'ressource'
  } as ResourceItemConfig,
  'lingot-acier': {
    name: 'Lingot d\'acier',
    stackSize: 100,
    description: 'Un lingot d\'acier',
    category: 'ressource'
  } as ResourceItemConfig,
  'lingot-cuivre': {
    name: 'Lingot de cuivre',
    stackSize: 100,
    description: 'Un lingot de cuivre pur',
    category: 'ressource'
  } as ResourceItemConfig,
  'lingot-silicium': {
    name: 'Lingot de silicium',
    stackSize: 100,
    description: 'Un lingot de silicium pur',
    category: 'ressource'
  } as ResourceItemConfig,
  'lingot-or': {
    name: 'Lingot d\'or',
    stackSize: 100,
    description: 'Un lingot d\'or pur',
    category: 'ressource'
  } as ResourceItemConfig,
  vetements: {
    name: 'Vêtements',
    stackSize: 50,
    description: 'Des vêtements pour les habitants',
    category: 'ressource'
  } as ResourceItemConfig
} as const

export const ITEM_CATEGORIES: { [key in ItemCategory]: {
  name: string
  description: string
  color: string
} } = {
  'biologique': {
    name: 'Biologique',
    description: 'Items biologiques et médicaux',
    color: '#2ecc71'
  },
  'ressource': {
    name: 'Ressource',
    description: 'Ressources transformées',
    color: '#e67e22'
  },
  'ressource-brute': {
    name: 'Ressources brutes',
    description: 'Minerais et matériaux bruts',
    color: '#7f8c8d'
  },
  'nourriture': {
    name: 'Nourriture',
    description: 'Tout ce qui peut être consommé',
    color: '#f1c40f'
  },
  'conteneur': {
    name: 'Conteneur',
    description: 'Objets de stockage',
    color: '#95a5a6'
  }
}

// Configuration des minerais par niveau
const MINERAL_DISTRIBUTION = {
  0: { // Premier niveau
    'minerai-fer': { chance: 0.6, amount: { min: 10, max: 30 } },
    'minerai-charbon': { chance: 0.5, amount: { min: 10, max: 25 } },
    'minerai-calcaire': { chance: 0.7, amount: { min: 15, max: 35 } },
    'minerai-cuivre': { chance: 0.2, amount: { min: 5, max: 15 } },
    'minerai-silicium': { chance: 0.1, amount: { min: 2, max: 10 } },
    'minerai-or': { chance: 0.05, amount: { min: 1, max: 5 } }
  },
  1: {
    'minerai-fer': { chance: 0.5, amount: { min: 15, max: 35 } },
    'minerai-charbon': { chance: 0.4, amount: { min: 15, max: 30 } },
    'minerai-calcaire': { chance: 0.6, amount: { min: 20, max: 40 } },
    'minerai-cuivre': { chance: 0.3, amount: { min: 10, max: 20 } },
    'minerai-silicium': { chance: 0.2, amount: { min: 5, max: 15 } },
    'minerai-or': { chance: 0.1, amount: { min: 2, max: 8 } }
  },
  2: {
    'minerai-fer': { chance: 0.4, amount: { min: 20, max: 40 } },
    'minerai-charbon': { chance: 0.3, amount: { min: 20, max: 35 } },
    'minerai-calcaire': { chance: 0.5, amount: { min: 25, max: 45 } },
    'minerai-cuivre': { chance: 0.4, amount: { min: 15, max: 25 } },
    'minerai-silicium': { chance: 0.3, amount: { min: 10, max: 20 } },
    'minerai-or': { chance: 0.15, amount: { min: 3, max: 10 } }
  },
  3: {
    'minerai-fer': { chance: 0.3, amount: { min: 25, max: 45 } },
    'minerai-charbon': { chance: 0.2, amount: { min: 25, max: 40 } },
    'minerai-calcaire': { chance: 0.4, amount: { min: 30, max: 50 } },
    'minerai-cuivre': { chance: 0.5, amount: { min: 20, max: 30 } },
    'minerai-silicium': { chance: 0.4, amount: { min: 15, max: 25 } },
    'minerai-or': { chance: 0.2, amount: { min: 5, max: 15 } }
  },
  4: {
    'minerai-fer': { chance: 0.2, amount: { min: 30, max: 50 } },
    'minerai-charbon': { chance: 0.1, amount: { min: 30, max: 45 } },
    'minerai-calcaire': { chance: 0.3, amount: { min: 35, max: 55 } },
    'minerai-cuivre': { chance: 0.6, amount: { min: 25, max: 35 } },
    'minerai-silicium': { chance: 0.5, amount: { min: 20, max: 30 } },
    'minerai-or': { chance: 0.25, amount: { min: 6, max: 18 } }
  },
  5: {
    'minerai-fer': { chance: 0.25, amount: { min: 35, max: 55 } },
    'minerai-charbon': { chance: 0.15, amount: { min: 35, max: 50 } },
    'minerai-calcaire': { chance: 0.35, amount: { min: 40, max: 60 } },
    'minerai-cuivre': { chance: 0.55, amount: { min: 30, max: 40 } },
    'minerai-silicium': { chance: 0.45, amount: { min: 25, max: 35 } },
    'minerai-or': { chance: 0.3, amount: { min: 7, max: 20 } }
  },
  6: {
    'minerai-fer': { chance: 0.3, amount: { min: 40, max: 60 } },
    'minerai-charbon': { chance: 0.2, amount: { min: 40, max: 55 } },
    'minerai-calcaire': { chance: 0.4, amount: { min: 45, max: 65 } },
    'minerai-cuivre': { chance: 0.5, amount: { min: 35, max: 45 } },
    'minerai-silicium': { chance: 0.4, amount: { min: 30, max: 40 } },
    'minerai-or': { chance: 0.35, amount: { min: 8, max: 22 } }
  },
  7: {
    'minerai-fer': { chance: 0.35, amount: { min: 45, max: 65 } },
    'minerai-charbon': { chance: 0.25, amount: { min: 45, max: 60 } },
    'minerai-calcaire': { chance: 0.45, amount: { min: 50, max: 70 } },
    'minerai-cuivre': { chance: 0.45, amount: { min: 40, max: 50 } },
    'minerai-silicium': { chance: 0.35, amount: { min: 35, max: 45 } },
    'minerai-or': { chance: 0.4, amount: { min: 9, max: 25 } }
  },
  8: {
    'minerai-fer': { chance: 0.4, amount: { min: 50, max: 70 } },
    'minerai-charbon': { chance: 0.3, amount: { min: 50, max: 65 } },
    'minerai-calcaire': { chance: 0.5, amount: { min: 55, max: 75 } },
    'minerai-cuivre': { chance: 0.4, amount: { min: 45, max: 55 } },
    'minerai-silicium': { chance: 0.3, amount: { min: 40, max: 50 } },
    'minerai-or': { chance: 0.45, amount: { min: 10, max: 28 } }
  },
  9: {
    'minerai-fer': { chance: 0.45, amount: { min: 55, max: 75 } },
    'minerai-charbon': { chance: 0.35, amount: { min: 55, max: 70 } },
    'minerai-calcaire': { chance: 0.55, amount: { min: 60, max: 80 } },
    'minerai-cuivre': { chance: 0.35, amount: { min: 50, max: 60 } },
    'minerai-silicium': { chance: 0.25, amount: { min: 45, max: 55 } },
    'minerai-or': { chance: 0.5, amount: { min: 11, max: 30 } }
  },
  10: {
    'minerai-fer': { chance: 0.5, amount: { min: 60, max: 80 } },
    'minerai-charbon': { chance: 0.4, amount: { min: 60, max: 75 } },
    'minerai-calcaire': { chance: 0.6, amount: { min: 65, max: 85 } },
    'minerai-cuivre': { chance: 0.3, amount: { min: 55, max: 65 } },
    'minerai-silicium': { chance: 0.2, amount: { min: 50, max: 60 } },
    'minerai-or': { chance: 0.55, amount: { min: 12, max: 32 } }
  },
  11: {
    'minerai-fer': { chance: 0.55, amount: { min: 65, max: 85 } },
    'minerai-charbon': { chance: 0.45, amount: { min: 65, max: 80 } },
    'minerai-calcaire': { chance: 0.65, amount: { min: 70, max: 90 } },
    'minerai-cuivre': { chance: 0.25, amount: { min: 60, max: 70 } },
    'minerai-silicium': { chance: 0.15, amount: { min: 55, max: 65 } },
    'minerai-or': { chance: 0.6, amount: { min: 13, max: 35 } }
  },
  12: {
    'minerai-fer': { chance: 0.6, amount: { min: 70, max: 90 } },
    'minerai-charbon': { chance: 0.5, amount: { min: 70, max: 85 } },
    'minerai-calcaire': { chance: 0.7, amount: { min: 75, max: 95 } },
    'minerai-cuivre': { chance: 0.2, amount: { min: 65, max: 75 } },
    'minerai-silicium': { chance: 0.1, amount: { min: 60, max: 70 } },
    'minerai-or': { chance: 0.65, amount: { min: 14, max: 38 } }
  },
  13: {
    'minerai-fer': { chance: 0.65, amount: { min: 75, max: 95 } },
    'minerai-charbon': { chance: 0.55, amount: { min: 75, max: 90 } },
    'minerai-calcaire': { chance: 0.75, amount: { min: 80, max: 100 } },
    'minerai-cuivre': { chance: 0.15, amount: { min: 70, max: 80 } },
    'minerai-silicium': { chance: 0.05, amount: { min: 65, max: 75 } },
    'minerai-or': { chance: 0.7, amount: { min: 15, max: 40 } }
  },
  14: {
    'minerai-fer': { chance: 0.7, amount: { min: 80, max: 100 } },
    'minerai-charbon': { chance: 0.6, amount: { min: 80, max: 95 } },
    'minerai-calcaire': { chance: 0.8, amount: { min: 85, max: 105 } },
    'minerai-cuivre': { chance: 0.1, amount: { min: 75, max: 85 } },
    'minerai-silicium': { chance: 0.05, amount: { min: 70, max: 80 } },
    'minerai-or': { chance: 0.75, amount: { min: 16, max: 42 } }
  }
}

interface MineralFound {
  type: ItemType
  amount: number
}

// Configuration des coûts de construction par type de salle
export const ROOM_CONSTRUCTION_COSTS: { [key: string]: { [key in ItemType]?: number } } = {
  entrepot: {
    'lingot-fer': 20,
    'lingot-acier': 10
  },
  dortoir: {
    'lingot-fer': 30,
    'lingot-acier': 15,
    'lingot-cuivre': 10
  },
  quartiers: {
    'lingot-fer': 40,
    'lingot-acier': 20,
    'lingot-cuivre': 15,
    'lingot-silicium': 5
  },
  appartement: {
    'lingot-fer': 50,
    'lingot-acier': 25,
    'lingot-cuivre': 20,
    'lingot-silicium': 10,
    'lingot-or': 2
  },
  suite: {
    'lingot-fer': 60,
    'lingot-acier': 30,
    'lingot-cuivre': 25,
    'lingot-silicium': 15,
    'lingot-or': 5
  },
  cuisine: {
    'lingot-fer': 25,
    'lingot-acier': 12,
    'lingot-cuivre': 8
  },
  'station-traitement': {
    'lingot-fer': 35,
    'lingot-acier': 20,
    'lingot-cuivre': 15,
    'lingot-silicium': 10
  },
  generateur: {
    'lingot-fer': 40,
    'lingot-acier': 25,
    'lingot-cuivre': 20,
    'lingot-silicium': 15,
    'lingot-or': 5
  },
  infirmerie: {
    'lingot-fer': 30,
    'lingot-acier': 15,
    'lingot-cuivre': 12,
    'lingot-silicium': 8
  },
  serre: {
    'lingot-fer': 25,
    'lingot-acier': 10,
    'lingot-cuivre': 8,
    'lingot-silicium': 5
  },
  raffinerie: {
    'lingot-fer': 50,
    'lingot-acier': 30,
    'lingot-cuivre': 25,
    'lingot-silicium': 20,
    'lingot-or': 10
  },
  derrick: {
    'lingot-fer': 45,
    'lingot-acier': 25,
    'lingot-cuivre': 20,
    'lingot-silicium': 15
  },
  'salle-controle': {
    'lingot-fer': 60,
    'lingot-acier': 40,
    'lingot-cuivre': 30,
    'lingot-silicium': 25,
    'lingot-or': 15
  },
  cuve: {
    'lingot-fer': 30,
    'lingot-acier': 15,
    'lingot-cuivre': 12,
    'lingot-silicium': 8
  },
  atelier: {
    'lingot-fer': 35,
    'lingot-acier': 20,
    'lingot-cuivre': 15,
    'lingot-silicium': 10
  }
} as const

// Configuration des points de bonheur
const HAPPINESS_CONFIG = {
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
}

export const useGameStore = defineStore('game', () => {
  // État du jeu
  const levels = ref<Level[]>([])
  const gameTime = ref(0) // En semaines
  const population = ref(0)
  const happiness = ref(100)
  const lastUpdateTime = ref(Date.now())
  const excavationsInProgress = ref<ExcavationProgress[]>([])
  const habitants = ref<Habitant[]>([])
  const excavations = ref<Excavation[]>([])
  const gameSpeed = ref(1)
  const resources = ref<{ [key: string]: Resource }>({
    energie: { amount: 0, capacity: 200, production: 0, consumption: 0 },
    eau: { amount: 0, capacity: 200, production: 0, consumption: 0 },
    nourriture: { amount: 0, capacity: 200, production: 0, consumption: 0 },
    vetements: { amount: 0, capacity: 200, production: 0, consumption: 0 },
    medicaments: { amount: 0, capacity: 200, production: 0, consumption: 0 }
  })

  // Inventaire
  const inventory = ref<Item[]>([])
  const inventoryCapacity = ref(1000)

  // Getters
  const resourcesList = computed(() => Object.entries(resources.value))
  const excavatedLevels = computed(() => levels.value.filter(l => l.isStairsExcavated))
  const builtRooms = computed(() => levels.value.flatMap(l => [...l.leftRooms, ...l.rightRooms].filter(r => r.isBuilt)))

  // Calcul de la qualité moyenne de la nourriture
  const averageFoodQuality = computed(() => {
    // Récupérer les types uniques de nourriture disponible
    const uniqueFoodTypes = new Set(
      inventory.value
        .filter(item => item.category === 'nourriture' && item.quantity > 0)
        .map(item => item.type)
    )
    
    if (uniqueFoodTypes.size === 0) return 0
    
    // Calculer la somme des qualités pour chaque type unique
    const totalQuality = Array.from(uniqueFoodTypes).reduce((sum, type) => {
      const itemConfig = ITEMS_CONFIG[type as keyof typeof ITEMS_CONFIG]
      const quality = itemConfig?.qualite || 0
      return sum + quality
    }, 0)
    
    // Retourner la somme des qualités
    return totalQuality
  })

  // Emoji pour la qualité de la nourriture
  const foodQualityEmoji = computed(() => {
    const quality = averageFoodQuality.value
    return quality >= 15 ? '🎯' :
           quality >= 12 ? '🏆' :
           quality >= 9 ? '⭐' :
           quality >= 7 ? '👍' :
           quality >= 5 ? '😐' :
           quality >= 3 ? '👎' :
           quality >= 2 ? '⚠️' :
           quality >= 1 ? '💀' : '❌'
  })

  const formattedTime = computed(() => {
    const weeks = gameTime.value
    const years = Math.floor(weeks / 52)
    const remainingWeeks = weeks % 52
    const months = Math.floor(remainingWeeks / 4)
    const lastWeeks = remainingWeeks % 4
    
    return {
      years,
      months,
      weeks: lastWeeks
    }
  })

  const habitantsLibres = computed(() => 
    habitants.value.filter(h => h.affectation.type === null)
  )

  const habitantsOccupes = computed(() => 
    habitants.value.filter(h => h.affectation.type !== null)
  )

  const enfants = computed(() =>
    habitants.value.filter(h => h.age < (7 * 52)) // Moins de 7 ans en semaines
  )

  // Getters pour l'inventaire
  const inventoryItems = computed(() => inventory.value)
  const inventorySpace = computed(() => {
    const used = inventory.value.reduce((total, item) => total + item.quantity, 0)
    return {
      used,
      total: inventoryCapacity.value,
      remaining: inventoryCapacity.value - used
    }
  })

  function createInitialRooms(side: 'left' | 'right', levelId: number, isFirstLevel: boolean): Room[] {
    // Calculer le nombre de salles à créer en tenant compte des fusions
    let roomsToCreate = ROOMS_PER_SIDE
    if (isFirstLevel) {
      const levelConfig = GAME_CONFIG.INITIAL_ROOMS.find(config => config.levelId === levelId)
      if (levelConfig) {
        // Calculer l'espace occupé par les salles pré-construites de ce côté
        const sideRooms = levelConfig.rooms.filter(r => r.position === side)
        const spaceUsed = sideRooms.reduce((total, room) => total + (room.gridSize - 1), 0)
        roomsToCreate -= spaceUsed
      }
    }

    const rooms = Array.from({ length: roomsToCreate }, (_, index) => ({
      id: `${levelId}-${side}-${index}`,
      type: 'empty',
      isBuilt: false,
      occupants: [],
      position: side,
      index,
      isExcavated: isFirstLevel,
      equipments: [] as Equipment[],
      gridSize: 1,
      fuelLevel: undefined,
      nextMineralsToProcess: undefined
    } as Room))

    // Si c'est le premier niveau, appliquer la configuration des salles pré-construites
    if (isFirstLevel) {
      const levelConfig = GAME_CONFIG.INITIAL_ROOMS.find(config => config.levelId === levelId)
      if (levelConfig) {
        levelConfig.rooms.forEach(roomConfig => {
          if (roomConfig.position === side) {
            const room = rooms[roomConfig.index]
            room.type = roomConfig.type
            room.isBuilt = true
            room.gridSize = roomConfig.gridSize
            // Initialiser le niveau de carburant pour le générateur
            if (room.type === 'generateur') {
              room.fuelLevel = 100
            }
            // Ajouter automatiquement la cuve à eau dans la cuve
            if (room.type === 'cuve') {
              room.fuelLevel = 100
              room.equipments.push({
                id: `${room.id}-cuve-eau`,
                type: 'cuve-eau',
                isUnderConstruction: false,
                constructionStartTime: 0,
                constructionDuration: EQUIPMENT_CONFIG.cuve['cuve-eau'].constructionTime
              })
            }
          }
        })
      }
    }

    return rooms
  }

  function getExcavationTime(levelId: number): number {
    return BASE_EXCAVATION_TIME + (levelId * DEPTH_TIME_MULTIPLIER)
  }

  function isExcavationInProgress(levelId: number, position: 'left' | 'right' | 'stairs', roomIndex?: number): boolean {
    return excavations.value.some(e =>
      e.levelId === levelId &&
      e.position === position &&
      (position === 'stairs' || e.roomIndex === roomIndex)
    )
  }

  function getExcavationProgress(levelId: number, position: 'left' | 'right' | 'stairs', roomIndex?: number): number | null {
    const excavation = excavations.value.find(e => 
      e.levelId === levelId && 
      e.position === position && 
      (position === 'stairs' || e.roomIndex === roomIndex)
    )
    
    if (!excavation) return null
    
    const elapsed = gameTime.value - excavation.startTime
    return Math.min(100, (elapsed / excavation.duration) * 100)
  }

  function getRemainingExcavationTime(excavation: ExcavationProgress): number {
    const elapsed = gameTime.value - excavation.startTime
    return Math.max(0, excavation.duration - elapsed)
  }

  function getExcavationInfo(levelId: number, position: 'left' | 'right' | 'stairs', roomIndex?: number): { 
    inProgress: boolean
    remainingWeeks: number | null
    progress: number
  } {
    const excavation = excavations.value.find(e => 
      e.levelId === levelId && 
      e.position === position && 
      (position === 'stairs' || e.roomIndex === roomIndex)
    )
    
    if (!excavation) {
      return { inProgress: false, remainingWeeks: null, progress: 0 }
    }
    
    const elapsedTime = Math.floor(gameTime.value) - excavation.startTime
    const remainingWeeks = Math.max(0, excavation.duration - elapsedTime)
    const progress = Math.min(100, (elapsedTime / excavation.duration) * 100)
    
    return {
      inProgress: true,
      remainingWeeks,
      progress
    }
  }

  // Actions
  function initGame() {
    // Créer les niveaux avec un niveau 0 supplémentaire
    levels.value = Array(INITIAL_LEVELS + 1).fill(null).map((_, index) => ({
      id: index,
      isStairsExcavated: index <= 1, // Les niveaux 0 et 1 sont excavés
      leftRooms: createInitialRooms('left', index, index <= 1),
      rightRooms: createInitialRooms('right', index, index <= 1)
    }))

    // Initialiser le niveau 1 avec des salles excavées
    const firstLevel = levels.value[1]
    if (firstLevel) {
      firstLevel.leftRooms.forEach(room => {
        room.isExcavated = true
      })
      firstLevel.rightRooms.forEach(room => {
        room.isExcavated = true
      })
    }

    // Initialiser les habitants
    habitants.value = Array.from({ length: 5 }, (_, i) => {
      const { nom, genre, age } = generateRandomName()
      return {
        id: `habitant-${i}`,
        nom,
        genre,
        age,
        sante: 100, // Santé initiale à 100%
        affectation: { type: null },
        competences: generateRandomCompetences(),
        bonheur: 50, // Score de bonheur par défaut
        logement: null
      }
    })

    // Initialiser les ressources avec les nouvelles valeurs
    resources.value = {
      energie: { amount: 100, capacity: 200, production: 15, consumption: 0 } as Resource,
      eau: { amount: 200, capacity: 400, production: 0, consumption: 0 } as Resource,
      nourriture: { amount: 200, capacity: 400, production: 0, consumption: 0 } as Resource,
      vetements: { amount: 50, capacity: 100, production: 0, consumption: 0 } as Resource,
      medicaments: { amount: 100, capacity: 200, production: 0, consumption: 0 } as Resource,
    }

    // Réinitialiser l'inventaire
    inventory.value = []
    
    // Ajouter les items initiaux avec leur configuration complète
    const embryons: Item = {
      id: `embryon-humain-${Date.now()}-1`,
      type: 'embryon-humain',
      quantity: 1000,
      stackSize: ITEMS_CONFIG['embryon-humain'].stackSize,
      description: ITEMS_CONFIG['embryon-humain'].description,
      category: ITEMS_CONFIG['embryon-humain'].category
    }
    
    const barilsPetrole: Item = {
      id: `baril-petrole-${Date.now()}-1`,
      type: 'baril-petrole',
      quantity: 100,
      stackSize: ITEMS_CONFIG['baril-petrole'].stackSize,
      description: ITEMS_CONFIG['baril-petrole'].description,
      category: ITEMS_CONFIG['baril-petrole'].category
    }
    
    const nourritureConserve: Item = {
      id: `nourriture-conserve-${Date.now()}-1`,
      type: 'nourriture-conserve',
      quantity: 200,
      stackSize: ITEMS_CONFIG['nourriture-conserve'].stackSize,
      description: ITEMS_CONFIG['nourriture-conserve'].description,
      category: ITEMS_CONFIG['nourriture-conserve'].category
    }
    
    /*
    const avoine: Item = {
      id: `avoine-${Date.now()}-1`,
      type: 'avoine',
      quantity: 500,
      stackSize: ITEMS_CONFIG['avoine'].stackSize,
      description: ITEMS_CONFIG['avoine'].description,
      category: ITEMS_CONFIG['avoine'].category
    }
    */
    
    /*
    const barilsVides: Item = {
      id: `baril-vide-${Date.now()}-1`,
      type: 'baril-vide',
      quantity: 0,
      stackSize: ITEMS_CONFIG['baril-vide'].stackSize,
      description: ITEMS_CONFIG['baril-vide'].description,
      category: ITEMS_CONFIG['baril-vide'].category
    }*/
    
    // Ajouter les lingots initiaux
    const lingotsInitiaux: Item[] = [
      {
        id: `lingot-fer-${Date.now()}-1`,
        type: 'lingot-fer',
        quantity: 200,
        stackSize: ITEMS_CONFIG['lingot-fer'].stackSize,
        description: ITEMS_CONFIG['lingot-fer'].description,
        category: ITEMS_CONFIG['lingot-fer'].category
      },
      {
        id: `lingot-acier-${Date.now()}-1`,
        type: 'lingot-acier',
        quantity: 100,
        stackSize: ITEMS_CONFIG['lingot-acier'].stackSize,
        description: ITEMS_CONFIG['lingot-acier'].description,
        category: ITEMS_CONFIG['lingot-acier'].category
      },
      {
        id: `lingot-cuivre-${Date.now()}-1`,
        type: 'lingot-cuivre',
        quantity: 100,
        stackSize: ITEMS_CONFIG['lingot-cuivre'].stackSize,
        description: ITEMS_CONFIG['lingot-cuivre'].description,
        category: ITEMS_CONFIG['lingot-cuivre'].category
      },
      {
        id: `lingot-silicium-${Date.now()}-1`,
        type: 'lingot-silicium',
        quantity: 100,
        stackSize: ITEMS_CONFIG['lingot-silicium'].stackSize,
        description: ITEMS_CONFIG['lingot-silicium'].description,
        category: ITEMS_CONFIG['lingot-silicium'].category
      },
      {
        id: `lingot-or-${Date.now()}-1`,
        type: 'lingot-or',
        quantity: 20,
        stackSize: ITEMS_CONFIG['lingot-or'].stackSize,
        description: ITEMS_CONFIG['lingot-or'].description,
        category: ITEMS_CONFIG['lingot-or'].category
      }
    ]
    
    // Ajouter les minerais initiaux
    const mineraisInitiaux: Item[] = [
      {
        id: `minerai-fer-${Date.now()}-1`,
        type: 'minerai-fer',
        quantity: 200,
        stackSize: ITEMS_CONFIG['minerai-fer'].stackSize,
        description: ITEMS_CONFIG['minerai-fer'].description,
        category: ITEMS_CONFIG['minerai-fer'].category
      },
      {
        id: `minerai-cuivre-${Date.now()}-1`,
        type: 'minerai-cuivre',
        quantity: 200,
        stackSize: ITEMS_CONFIG['minerai-cuivre'].stackSize,
        description: ITEMS_CONFIG['minerai-cuivre'].description,
        category: ITEMS_CONFIG['minerai-cuivre'].category
      },
      {
        id: `minerai-silicium-${Date.now()}-1`,
        type: 'minerai-silicium',
        quantity: 200,
        stackSize: ITEMS_CONFIG['minerai-silicium'].stackSize,
        description: ITEMS_CONFIG['minerai-silicium'].description,
        category: ITEMS_CONFIG['minerai-silicium'].category
      },
      {
        id: `minerai-or-${Date.now()}-1`,
        type: 'minerai-or',
        quantity: 200,
        stackSize: ITEMS_CONFIG['minerai-or'].stackSize,
        description: ITEMS_CONFIG['minerai-or'].description,
        category: ITEMS_CONFIG['minerai-or'].category
      },
      {
        id: `minerai-charbon-${Date.now()}-1`,
        type: 'minerai-charbon',
        quantity: 200,
        stackSize: ITEMS_CONFIG['minerai-charbon'].stackSize,
        description: ITEMS_CONFIG['minerai-charbon'].description,
        category: ITEMS_CONFIG['minerai-charbon'].category
      },
      {
        id: `minerai-calcaire-${Date.now()}-1`,
        type: 'minerai-calcaire',
        quantity: 200,
        stackSize: ITEMS_CONFIG['minerai-calcaire'].stackSize,
        description: ITEMS_CONFIG['minerai-calcaire'].description,
        category: ITEMS_CONFIG['minerai-calcaire'].category
      }
    ]
    
    // Ajouter les items à l'inventaire
    inventory.value.push(embryons, barilsPetrole, nourritureConserve, ...lingotsInitiaux, ...mineraisInitiaux)

    // Réinitialiser les autres valeurs
    gameTime.value = 0
    population.value = 5
    happiness.value = 100
    lastUpdateTime.value = Date.now()
    excavations.value = []

    // Affecter automatiquement les habitants aux salles pré-construites
    if (firstLevel) {
      const allRooms = [...firstLevel.leftRooms, ...firstLevel.rightRooms]
      const builtRooms = allRooms.filter(room => room.isBuilt)
      let habitantIndex = 0

      // Récupérer la configuration des salles initiales
      const levelConfig = GAME_CONFIG.INITIAL_ROOMS.find(config => config.levelId === 0)
      if (levelConfig) {
        levelConfig.rooms.forEach(roomConfig => {
          const room = builtRooms.find(r => 
            r.position === roomConfig.position && 
            r.index === roomConfig.index
          )
          if (room && roomConfig.workers > 0) {
            // Affecter le nombre de travailleurs spécifié
            for (let i = 0; i < roomConfig.workers && habitantIndex < habitants.value.length; i++) {
              const habitant = habitants.value[habitantIndex]
              affecterHabitantSalle(habitant.id, 0, room.position, room.index)
              habitantIndex++
            }
          }
        })
      }
    }

    // Mettre à jour les productions et consommations initiales
    updateRoomProduction()

    // Sauvegarder l'état initial
    saveGame()
  }

  function calculateTotalClothes(): number {
    return inventory.value
      .filter(item => item.type === 'vetements')
      .reduce((total, item) => total + item.quantity, 0)
  }

  function updateRoomProduction(weeksElapsed: number = 0) {
    // Réinitialiser toutes les productions et consommations
    Object.values(resources.value).forEach(resource => {
      resource.production = 0
      resource.consumption = 0
      resource.capacity = 200 // Capacité de base
    })

    // 1. Calculer les consommations de base des habitants
    const baseConsumptions = {
      energie: population.value * 2, // 2 unités d'énergie par habitant
      eau: population.value * 1,     // 1 unité d'eau par habitant
      nourriture: population.value * 0.7, // 0.7 unité par habitant
      vetements: population.value * 0.05, // 0.05 unité par habitant
      medicaments: 0
    }

    // Appliquer les consommations de base
    Object.entries(baseConsumptions).forEach(([resource, amount]) => {
      if (amount > 0) { // Éviter les valeurs nulles ou négatives
        resources.value[resource as ResourceKey].consumption = amount
      }
    })

    // 2. Calculer les productions et consommations des salles
    levels.value?.forEach(level => {
      const allRooms = [...level.leftRooms, ...level.rightRooms]
      allRooms.forEach(room => {
        if (!room.isBuilt) return

        const config = ROOM_CONFIGS[room.type]
        if (!config) return

        const gridSize = room.gridSize || 1
        const mergeConfig = ROOM_MERGE_CONFIG[room.type]
        const mergeMultiplier = mergeConfig?.useMultiplier 
          ? GAME_CONFIG.MERGE_MULTIPLIERS[Math.min(gridSize, 6) as keyof typeof GAME_CONFIG.MERGE_MULTIPLIERS] || 1
          : 1

        // 2.1 Ajouter la consommation d'énergie de la salle
        if (config.energyConsumption > 0) {
          resources.value.energie.consumption += config.energyConsumption * gridSize
        }

        // 2.2 Ajouter la consommation d'eau si applicable
        if ('waterConsumption' in config) {
          const waterConsumption = (config as ProductionRoomConfig).waterConsumption || 0
          if (waterConsumption > 0) {
            resources.value.eau.consumption += waterConsumption * gridSize
          }
        }

        // 2.3 Gérer la production des salles
        if ('productionPerWorker' in config) {
          const nbWorkers = room.occupants.length
          if (nbWorkers === 0) return

          // Vérifier si la salle a un équipement qui améliore la production
          let productionBonus = 1
          if (room.type === 'cuisine' && room.equipments?.some(e => e.type === 'cuisine-avancee' && !e.isUnderConstruction)) {
            productionBonus = 1.5 // +50% de production
          }

          // Gérer la production d'eau pour la station de traitement
          if (room.type === 'station-traitement') {
            const waterProduction = (config.productionPerWorker.eau || 0) * nbWorkers * gridSize * mergeMultiplier * productionBonus
            if (waterProduction > 0) {
              resources.value.eau.production += waterProduction
            }
          }

          // Gérer la production de nourriture pour les serres
          if (room.type === 'serre') {
            // Production de base (laitue)
            const laitueProduction = 2 * nbWorkers * gridSize * mergeMultiplier
            if (laitueProduction > 0) {
              addItem('laitue', Math.floor(laitueProduction))
              const laitueConfig = ITEMS_CONFIG['laitue'] as FoodItemConfig
              resources.value.nourriture.production += laitueProduction / laitueConfig.ratio
            }

            // Vérifier les équipements
            const hasTomates = room.equipments?.some(e => e.type === 'culture-tomates' && !e.isUnderConstruction)
            const hasAvoine = room.equipments?.some(e => e.type === 'culture-avoine' && !e.isUnderConstruction)
            const hasVersSoie = room.equipments?.some(e => e.type === 'vers-soie' && !e.isUnderConstruction)

            if (hasTomates) {
              const tomatoProduction = 1.5 * nbWorkers * gridSize * mergeMultiplier
              if (tomatoProduction > 0) {
                addItem('tomates', Math.floor(tomatoProduction))
                const tomatesConfig = ITEMS_CONFIG['tomates'] as FoodItemConfig
                resources.value.nourriture.production += tomatoProduction / tomatesConfig.ratio
              }
            }

            if (hasAvoine) {
              const avoineProduction = 2 * nbWorkers * gridSize * mergeMultiplier
              if (avoineProduction > 0) {
                addItem('avoine', Math.floor(avoineProduction))
                const avoineConfig = ITEMS_CONFIG['avoine'] as FoodItemConfig
                resources.value.nourriture.production += avoineProduction / avoineConfig.ratio
              }
            }

            if (hasVersSoie) {
              const soieProduction = 0.5 * nbWorkers * gridSize * mergeMultiplier
              if (soieProduction > 0) {
                addItem('soie', Math.floor(soieProduction))
              }
            }
          }

          // Gérer la production de vêtements dans l'atelier
          if (room.type === 'atelier') {
            const hasAtelierCouture = room.equipments?.some(e => e.type === 'atelier-couture' && !e.isUnderConstruction)
            if (hasAtelierCouture) {
              // Vérifier s'il y a de la soie disponible
              const soieDisponible = inventory.value.find(item => item.type === 'soie' && item.quantity > 0)
              if (soieDisponible) {
                const clothesProduction = 2 * nbWorkers * gridSize * mergeMultiplier
                if (clothesProduction > 0) {
                  // Consommer de la soie (1 soie = 2 vêtements)
                  const soieNecessaire = Math.ceil(clothesProduction / 2)
                  const soieUtilisee = Math.min(soieNecessaire, soieDisponible.quantity)
                  if (soieUtilisee > 0) {
                    removeItem(soieDisponible.id, soieUtilisee)
                    const clothesProduits = soieUtilisee * 2
                    addItem('vetements', clothesProduits)
                    resources.value.vetements.production += clothesProduits
                  }
                }
              }
            }
          }

          // Gérer la production avec carburant (générateur)
          if (room.type === 'generateur' && room.fuelLevel !== undefined) {
            // Vérifier s'il y a du carburant disponible
            if (room.fuelLevel <= 0) {
              // Essayer de remplir avec un baril de pétrole
              const barilPetrole = inventory.value.find(item => item.type === 'baril-petrole' && item.quantity > 0)
              if (barilPetrole) {
                const success = removeItem(barilPetrole.id, 1)
                if (success) {
                  // Ajouter un baril vide
                  const addSuccess = addItem('baril-vide', 1)
                  room.fuelLevel = 100 // Remplir le réservoir
                }
              }
            }

            // Calculer la consommation de carburant
            if (room.fuelLevel > 0 && config.fuelConsumption) {
              const fuelNeeded = config.fuelConsumption * nbWorkers
              if (room.fuelLevel >= fuelNeeded) {
                // Assez de carburant, production normale
                Object.entries(config.productionPerWorker).forEach(([resource, amount]) => {
                  if (amount && resource in resources.value && amount > 0) {
                    resources.value[resource as ResourceKey].production += amount * nbWorkers * gridSize * mergeMultiplier * productionBonus
                  }
                })
                room.fuelLevel -= fuelNeeded
              } else {
                // Pas assez de carburant, production réduite
                const ratio = room.fuelLevel / fuelNeeded
                Object.entries(config.productionPerWorker).forEach(([resource, amount]) => {
                  if (amount && resource in resources.value && amount > 0) {
                    resources.value[resource as ResourceKey].production += amount * nbWorkers * gridSize * mergeMultiplier * ratio * productionBonus
                  }
                })
                room.fuelLevel = 0
              }
            }
          }

          // Gérer la production de pétrole pour le derrick
          if (room.type === 'derrick') {
            const nbWorkers = room.occupants.length
            if (nbWorkers > 0) {
              const gridSize = room.gridSize || 1
              const mergeConfig = ROOM_MERGE_CONFIG[room.type]
              const mergeMultiplier = mergeConfig?.useMultiplier 
                ? GAME_CONFIG.MERGE_MULTIPLIERS[Math.min(gridSize, 6) as keyof typeof GAME_CONFIG.MERGE_MULTIPLIERS] || 1
                : 1

              // Calculer la production potentielle de pétrole
              const petroleProduction = 2 * nbWorkers * gridSize * mergeMultiplier

              // Vérifier s'il y a des barils vides disponibles
              const barilsVides = inventory.value.find(item => item.type === 'baril-vide' && item.quantity > 0)
              if (barilsVides) {
                // Limiter la production au nombre de barils vides disponibles
                const productionPossible = Math.min(petroleProduction, barilsVides.quantity)
                if (productionPossible > 0) {
                  // Consommer les barils vides
                  removeItem(barilsVides.id, productionPossible)
                  // Produire les barils de pétrole
                  addItem('baril-petrole', productionPossible)
                }
              }
            }
          }
        }
      })
    })

    // Mettre à jour la quantité totale de nourriture
    resources.value.nourriture.amount = calculateTotalFood()
    resources.value.vetements.amount = calculateTotalClothes()
  }

  function calculateTotalFood(): number {
    let totalFood = 0
    const foodItems = inventory.value.filter(item => item.category === 'nourriture')
    
    for (const item of foodItems) {
      const itemConfig = ITEMS_CONFIG[item.type as keyof typeof ITEMS_CONFIG]
      if (itemConfig && isFoodItem(itemConfig)) {
        totalFood += item.quantity / itemConfig.ratio
      }
    }
    
    return totalFood
  }

  function updateResources(weeksElapsed: number) {
    // Mettre à jour les productions et consommations
    updateRoomProduction(weeksElapsed)

    // Appliquer les changements une seule fois car ils sont déjà multipliés par weeksElapsed
    Object.entries(resources.value).forEach(([key, resource]) => {
      const net = resource.production - resource.consumption
      
      if (key === 'eau') {
        console.log(`Eau - Production: ${resource.production}, Consommation: ${resource.consumption}, Net: ${net}`)
        // Gestion spéciale pour l'eau
        if (net > 0) {
          // Production d'eau : ajouter aux cuves
          const added = addWater(net)
          console.log(`Eau ajoutée aux cuves: ${added}`)
          resources.value.eau.amount = Math.min(resources.value.eau.capacity, resources.value.eau.amount + added)
        } else if (net < 0) {
          // Consommation d'eau : retirer des cuves
          const removed = removeWater(-net)
          console.log(`Eau retirée des cuves: ${removed}`)
          resources.value.eau.amount = Math.max(0, resources.value.eau.amount - removed)
        }
        console.log(`Nouveau montant d'eau: ${resources.value.eau.amount}`)
      } else if (key === 'nourriture') {
        // Gestion spéciale pour la nourriture
        resources.value.nourriture.amount = calculateTotalFood()
        
        // Si consommation de nourriture
        if (net < 0) {
          const foodNeeded = -net
          
          // Récupérer tous les types de nourriture disponibles avec leurs configurations
          const foodItems = inventory.value
            .filter(item => item.category === 'nourriture' && item.quantity > 0)
            .map(item => ({
              item,
              config: ITEMS_CONFIG[item.type as keyof typeof ITEMS_CONFIG]
            }))
            .filter(({ config }) => config && isFoodItem(config))
          
          if (foodItems.length > 0) {
            // Calculer la nourriture nécessaire par type
            const foodPerType = foodNeeded / foodItems.length
            
            // Consommer chaque type de nourriture
            foodItems.forEach(({ item, config }) => {
              if (isFoodItem(config)) {
                const itemsToConsume = Math.ceil(foodPerType * config.ratio)
                if (itemsToConsume > 0) {
                  const actualConsumption = Math.min(itemsToConsume, item.quantity)
                  removeItem(item.id, actualConsumption)
                }
              }
            })
          }
        }
      } else if (key === 'vetements') {
        // Gestion spéciale pour les vêtements
        resources.value.vetements.amount = calculateTotalClothes()
        
        // Si consommation de vêtements
        if (net < 0) {
          const clothesNeeded = -net
          const clothesItems = inventory.value.filter(item => item.type === 'vetements' && item.quantity > 0)
          
          if (clothesItems.length > 0) {
            // Prendre le premier stack de vêtements disponible
            const item = clothesItems[0]
            const itemsToConsume = Math.ceil(clothesNeeded)
            if (itemsToConsume > 0) {
              const actualConsumption = Math.min(itemsToConsume, item.quantity)
              removeItem(item.id, actualConsumption)
            }
          }
        }
      } else {
        // Gestion normale pour les autres ressources
        const newAmount = Math.max(0, Math.min(resource.amount + net, resource.capacity))
        resources.value[key as ResourceKey].amount = newAmount
      }
    })
  }

  function update(speed: number) {
    const currentTime = Date.now()
    const deltaTime = currentTime - lastUpdateTime.value
    
    if (deltaTime >= 2000) { // Mise à jour toutes les 2 secondes
      const previousGameTime = Math.floor(gameTime.value)
      gameTime.value += speed
      const currentGameTime = Math.floor(gameTime.value)
      lastUpdateTime.value = currentTime

      // Calculer combien de semaines se sont écoulées depuis la dernière mise à jour
      const previousWeek = Math.floor(previousGameTime)
      const currentWeek = Math.floor(currentGameTime)
      const weeksElapsed = currentWeek - previousWeek

      // Mettre à jour le bonheur à chaque cycle
      updateHappiness()

      if (weeksElapsed > 0) {
        // Faire vieillir les habitants
        habitants.value?.forEach(habitant => {
          habitant.age += weeksElapsed
        })

        // Mettre à jour les ressources
        updateResources(weeksElapsed)

        // Vérifier les constructions terminées
        levels.value.forEach(level => {
          [...level.leftRooms, ...level.rightRooms].forEach(room => {
            if (room.isUnderConstruction && room.constructionStartTime !== undefined && room.constructionDuration !== undefined) {
              const elapsedTime = Math.floor(gameTime.value) - room.constructionStartTime
              if (elapsedTime >= room.constructionDuration) {
                room.isUnderConstruction = false
                room.isBuilt = true
                
                // Libérer l'habitant affecté à la construction
                const habitantAffecte = habitants.value.find(h => 
                  h.affectation.type === 'construction' &&
                  h.affectation.levelId === level.id &&
                  h.affectation.position === room.position &&
                  h.affectation.roomIndex === room.index
                )
                if (habitantAffecte) {
                  libererHabitant(habitantAffecte.id)
                }

                // Initialiser la taille de la salle si ce n'est pas déjà fait
                if (!room.gridSize) {
                  room.gridSize = 1
                }

                // Vérifier et fusionner les salles adjacentes
                checkAndMergeRooms(level, room)
              }
            }
          })
        })

        // Vérifier les excavations terminées
        excavations.value = excavations.value.filter(excavation => {
          const elapsedTime = Math.floor(gameTime.value) - excavation.startTime
          const isComplete = elapsedTime >= excavation.duration
          
          if (isComplete) {
            if (excavation.position === 'stairs') {
              const level = levels.value.find(l => l.id === excavation.levelId)
              if (level) level.isStairsExcavated = true

              // Notifier des minerais trouvés lors de l'excavation verticale
              if (excavation.mineralsFound && excavation.mineralsFound.length > 0) {
                const message = excavation.mineralsFound
                  .map(m => `${ITEMS_CONFIG[m.type].name}: ${m.amount}`)
                  .join('\n')
                
                window.dispatchEvent(new CustomEvent('excavation-complete', {
                  detail: {
                    title: 'Minerais découverts lors de l\'excavation verticale !',
                    message,
                    type: 'success'
                  }
                }))
              }

              // Libérer l'habitant affecté à l'excavation
              const habitantAffecte = habitants.value.find(h => 
                h.affectation.type === 'excavation' &&
                h.affectation.levelId === excavation.levelId &&
                h.affectation.position === excavation.position
              )
              if (habitantAffecte) {
                libererHabitant(habitantAffecte.id)
              }
            } else {
              const level = levels.value.find(l => l.id === excavation.levelId)
              if (level) {
                const rooms = excavation.position === 'left' ? level.leftRooms : level.rightRooms
                const room = rooms[excavation.roomIndex!]
                if (room) {
                  room.isExcavated = true

                  // Notifier des minerais trouvés lors de l'excavation horizontale
                  if (excavation.mineralsFound && excavation.mineralsFound.length > 0) {
                    const message = excavation.mineralsFound
                      .map(m => `${ITEMS_CONFIG[m.type].name}: ${m.amount}`)
                      .join('\n')
                    
                    window.dispatchEvent(new CustomEvent('excavation-complete', {
                      detail: {
                        title: 'Minerais découverts !',
                        message,
                        type: 'success'
                      }
                    }))
                  }
                }

                // Libérer l'habitant affecté à l'excavation
                const habitantAffecte = habitants.value.find(h => 
                  h.affectation.type === 'excavation' &&
                  h.affectation.levelId === excavation.levelId &&
                  h.affectation.position === excavation.position &&
                  h.affectation.roomIndex === excavation.roomIndex
                )
                if (habitantAffecte) {
                  libererHabitant(habitantAffecte.id)
                }
              }
            }
            return false
          }
          return true
        })

        // Vérifier les incubations
        checkAndFinalizeIncubation()

        if (gameTime.value % 10 === 0) {
          saveGame()
        }
      }

      // Vérifier si une semaine s'est écoulée
      if (Math.floor(gameTime.value) > Math.floor(previousGameTime)) {
        // Traiter les minerais dans les raffineries
        levels.value.forEach(level => {
          const allRooms = [...level.leftRooms, ...level.rightRooms]
          allRooms.forEach(room => {
            if (room.isBuilt && room.type === 'raffinerie' && room.occupants.length > 0) {
              const nbWorkers = room.occupants.length
              const gridSize = room.gridSize || 1
              const mergeConfig = ROOM_MERGE_CONFIG[room.type]
              const mergeMultiplier = mergeConfig?.useMultiplier 
                ? GAME_CONFIG.MERGE_MULTIPLIERS[Math.min(gridSize, 6) as keyof typeof GAME_CONFIG.MERGE_MULTIPLIERS] || 1
                : 1

              // Effectuer autant de conversions que la vitesse actuelle
              const batchesToProcess = speed

              // Vérifier si la conversion actuelle est possible
              let canProcess = false
              if (room.nextMineralsToProcess) {
                canProcess = room.nextMineralsToProcess.input.every(({ type, amount }) => {
                  const needed = amount * batchesToProcess
                  const available = getItemQuantity(type)
                  return available >= needed
                })
              }

              // Ne chercher une nouvelle recette que si aucune n'est sélectionnée
              if (!room.nextMineralsToProcess) {
                const config = ROOM_CONFIGS.raffinerie
                const conversionRules = (config as any).conversionRules

                // Parcourir toutes les règles de conversion pour en trouver une faisable
                for (const [inputType, rule] of Object.entries(conversionRules)) {
                  const inputItem = inventory.value.find(item => item.type === inputType && item.quantity > 0)
                  if (!inputItem) continue

                  if (rule.requires) {
                    // Vérifier si tous les composants requis sont disponibles
                    const hasAllComponents = Object.entries(rule.requires).every(([reqType, reqAmount]) => {
                      const reqItem = inventory.value.find(item => item.type === reqType)
                      return reqItem && reqItem.quantity >= (reqAmount as number) * batchesToProcess
                    })

                    if (hasAllComponents) {
                      room.nextMineralsToProcess = {
                        input: [
                          { type: inputType as ItemType, amount: 1 },
                          ...Object.entries(rule.requires).map(([reqType, reqAmount]) => ({
                            type: reqType as ItemType,
                            amount: reqAmount as number
                          }))
                        ],
                        output: {
                          type: rule.output as ItemType,
                          amount: rule.ratio as number
                        }
                      }
                      canProcess = true
                      break
                    }
                  } else {
                    // Conversion simple
                    if (inputItem.quantity >= batchesToProcess) {
                      room.nextMineralsToProcess = {
                        input: [{ type: inputType as ItemType, amount: 1 }],
                        output: {
                          type: rule.output as ItemType,
                          amount: rule.ratio as number
                        }
                      }
                      canProcess = true
                      break
                    }
                  }
                }
              }

              // Si une conversion est possible, l'effectuer
              if (canProcess && room.nextMineralsToProcess) {
                const { input, output } = room.nextMineralsToProcess
                
                // Retirer les ressources d'entrée
                input.forEach(({ type, amount }) => {
                  const toRemove = amount * batchesToProcess
                  const items = inventory.value.filter(item => item.type === type)
                  let remaining = toRemove

                  for (const item of items) {
                    if (remaining <= 0) break
                    const remove = Math.min(remaining, item.quantity)
                    removeItem(item.id, remove)
                    remaining -= remove
                  }
                })

                // Ajouter les ressources de sortie
                const outputAmount = output.amount * batchesToProcess
                addItem(output.type, outputAmount)

                // Émettre un événement pour mettre à jour l'interface
                window.dispatchEvent(new CustomEvent('conversion-update', {
                  detail: {
                    type: 'success',
                    input: input,
                    output: output,
                    amount: batchesToProcess
                  }
                }))
              }
            }
          })
        })

        // Mise à jour des équipements en construction
        levels.value?.forEach(level => {
          const allRooms = [...(level.leftRooms || []), ...(level.rightRooms || [])]
          allRooms.forEach(room => {
            room.equipments?.forEach(equipment => {
              if (equipment.isUnderConstruction && equipment.constructionStartTime !== undefined && equipment.constructionDuration !== undefined) {
                const elapsedTime = gameTime.value - equipment.constructionStartTime
                if (elapsedTime >= equipment.constructionDuration) {
                  equipment.isUnderConstruction = false
                }
              }
            })
          })
        })
      }
    }
  }

  // Ajout de la fonction de calcul du bonheur
  function calculateHappiness(habitantId: string): number {
    let score = HAPPINESS_CONFIG.DEFAULT
    const habitant = habitants.value.find(h => h.id === habitantId)
    if (!habitant) return score

    // Vérification des ressources disponibles
    if (resources.value.eau.amount > 0) {
      score += HAPPINESS_CONFIG.EAU
    } else {
      score += HAPPINESS_CONFIG.MANQUE_EAU
    }

    if (resources.value.nourriture.amount > 0) {
      score += HAPPINESS_CONFIG.NOURRITURE
      // Ajouter le bonus/malus de qualité de nourriture
      const qualite = Math.min(10, Math.max(0, averageFoodQuality.value))
      if (qualite >= 9) {
        score += HAPPINESS_CONFIG.QUALITE_NOURRITURE_EXCELLENTE
      } else if (qualite >= 7) {
        score += HAPPINESS_CONFIG.QUALITE_NOURRITURE_BONNE
      } else if (qualite >= 5) {
        score += HAPPINESS_CONFIG.QUALITE_NOURRITURE_MOYENNE
      } else if (qualite >= 3) {
        score += HAPPINESS_CONFIG.QUALITE_NOURRITURE_MAUVAISE
      } else {
        score += HAPPINESS_CONFIG.QUALITE_NOURRITURE_TERRIBLE
      }
    } else {
      score += HAPPINESS_CONFIG.MANQUE_NOURRITURE
    }

    if (resources.value.vetements.amount > 0) {
      score += HAPPINESS_CONFIG.VETEMENTS
    } else {
      score += HAPPINESS_CONFIG.MANQUE_VETEMENTS
    }

    if (resources.value.medicaments.amount > 0) {
      score += HAPPINESS_CONFIG.MEDICAMENTS
    } else {
      score += HAPPINESS_CONFIG.MANQUE_MEDICAMENTS
    }

    // Appliquer le plafond de bonheur en fonction du type de logement
    let bonheurMax = HAPPINESS_CONFIG.SANS_LOGEMENT
    
    if (habitant.logement) {
      const level = levels.value.find(l => l.id === habitant.logement?.levelId)
      if (level) {
        const room = habitant.logement.position === 'left'
          ? level.leftRooms[habitant.logement.roomIndex]
          : level.rightRooms[habitant.logement.roomIndex]
        
        if (room) {
          switch (room.type) {
            case 'dortoir':
              bonheurMax = HAPPINESS_CONFIG.DORTOIR
              break
            case 'quartiers':
              bonheurMax = HAPPINESS_CONFIG.QUARTIERS
              break
            case 'appartement':
              bonheurMax = HAPPINESS_CONFIG.APPARTEMENT
              break
            case 'suite':
              bonheurMax = HAPPINESS_CONFIG.SUITE
              break
          }
        }
      }
    } else {
      // Pénalité pour absence de logement
      score = Math.min(score, HAPPINESS_CONFIG.SANS_LOGEMENT)
    }

    // Limiter le score entre 0 et le plafond de bonheur
    return Math.max(0, Math.min(bonheurMax, score))
  }

  // Mise à jour de la fonction updateHappiness
  function updateHappiness() {
    habitants.value?.forEach(habitant => {
      let bonheurTotal = 100 // Bonheur de base

      // Vérifier si l'habitant a un logement
      if (!habitant.logement) {
        bonheurTotal -= 30 // -30 points si pas de logement
      }

      // Vérifier la nourriture
      const nourritureParHabitant = resources.value.nourriture.amount / (habitants.value?.length || 1)
      if (nourritureParHabitant < 1) {
        bonheurTotal -= 40 // -40 points si pas assez de nourriture
      }

      // Vérifier l'eau
      const eauParHabitant = resources.value.eau.amount / (habitants.value?.length || 1)
      if (eauParHabitant < 1) {
        bonheurTotal -= 40 // -40 points si pas assez d'eau
      }

      // Vérifier les vêtements
      const vetementsParHabitant = resources.value.vetements.amount / (habitants.value?.length || 1)
      if (vetementsParHabitant < 1) {
        bonheurTotal -= 20 // -20 points si pas assez de vêtements
      }

      // Mettre à jour la consommation de vêtements
      resources.value.vetements.consumption = habitants.value.length * 0.1 // Chaque habitant consomme 0.1 vêtement par semaine

      // Limiter le bonheur entre 0 et 100
      habitant.bonheur = Math.max(0, Math.min(100, bonheurTotal))
    })
  }

  // Ajout du calcul du bonheur global
  const globalHappiness = computed(() => {
    if (habitants.value.length === 0) return 0
    const totalHappiness = habitants.value.reduce((sum, habitant) => sum + habitant.bonheur, 0)
    return Math.round(totalHappiness / habitants.value.length)
  })

  function addNewLevel() {
    const newLevelId = levels.value.length
    levels.value.push({
      id: newLevelId,
      isStairsExcavated: false,
      leftRooms: createInitialRooms('left', newLevelId, false),
      rightRooms: createInitialRooms('right', newLevelId, false)
    })
  }

  function excavateStairs(levelId: number): boolean {
    const level = levels.value.find(l => l.id === levelId)
    const previousLevel = levels.value.find(l => l.id === levelId - 1)

    // Si on est au dernier niveau, ajouter un nouveau niveau
    if (levelId === levels.value.length - 1) {
      addNewLevel()
    }

    if (level && !level.isStairsExcavated && !isExcavationInProgress(levelId, 'stairs')) {
      // Vérifier que le niveau précédent a ses escaliers excavés
      if (previousLevel && previousLevel.isStairsExcavated) {
        // Trouver un habitant libre qui a plus de 7 ans
        const habitantLibre = habitants.value.find(h => h.affectation.type === null && h.age >= 7)
        if (habitantLibre) {
          // Affecter l'habitant à l'excavation
          affecterHabitant(habitantLibre.id, {
            type: 'excavation',
            levelId,
            position: 'stairs'
          })

          // Extraire des minerais (3x plus que l'excavation horizontale)
          const mineralsFound: MineralFound[] = []
          const mineralDistribution = MINERAL_DISTRIBUTION[Math.min(levelId, 4) as keyof typeof MINERAL_DISTRIBUTION]
          if (mineralDistribution) {
            // Garantir au moins une ressource
            let hasFoundResource = false
            Object.entries(mineralDistribution).forEach(([mineral, config]) => {
              if (Math.random() < Math.max(0.3, config.chance)) { // Minimum 30% de chance
                const amount = Math.floor(
                  Math.max(
                    config.amount.min,
                    (config.amount.min + Math.random() * (config.amount.max - config.amount.min)) * 3
                  )
                )
                addItem(mineral as ItemType, amount)
                mineralsFound.push({ type: mineral as ItemType, amount })
                hasFoundResource = true
              }
            })

            // Si aucune ressource n'a été trouvée, en ajouter une aléatoire
            if (!hasFoundResource) {
              const randomMineral = Object.entries(mineralDistribution)[Math.floor(Math.random() * Object.entries(mineralDistribution).length)]
              const amount = Math.floor(randomMineral[1].amount.min * 3)
              addItem(randomMineral[0] as ItemType, amount)
              mineralsFound.push({ type: randomMineral[0] as ItemType, amount })
            }
          }
          
          excavations.value.push({
            levelId,
            position: 'stairs',
            startTime: gameTime.value,
            habitantId: habitantLibre.id,
            duration: getExcavationTime(levelId),
            mineralsFound
          })
          return true
        }
      }
    }
    return false
  }

  function excavateRoom(levelId: number, position: 'left' | 'right', roomIndex: number): boolean {
    const level = levels.value.find(l => l.id === levelId)
    if (level && level.isStairsExcavated && !isExcavationInProgress(levelId, position, roomIndex)) {
      const rooms = position === 'left' ? level.leftRooms : level.rightRooms
      const room = rooms[roomIndex]

      if (room && !room.isBuilt) {
        // Trouver un habitant libre qui a plus de 7 ans
        const habitantLibre = habitants.value.find(h => h.affectation.type === null && h.age >= 7)
        if (habitantLibre) {
          // Affecter l'habitant à l'excavation
          affecterHabitant(habitantLibre.id, {
            type: 'excavation',
            levelId,
            position,
            roomIndex
          })

          // Extraire des minerais
          const mineralsFound: MineralFound[] = []
          const mineralDistribution = MINERAL_DISTRIBUTION[Math.min(levelId, 4) as keyof typeof MINERAL_DISTRIBUTION]
          if (mineralDistribution) {
            // Garantir au moins une ressource
            let hasFoundResource = false
            Object.entries(mineralDistribution).forEach(([mineral, config]) => {
              if (Math.random() < Math.max(0.3, config.chance)) { // Minimum 30% de chance
                const amount = Math.floor(
                  Math.max(
                    config.amount.min,
                    config.amount.min + Math.random() * (config.amount.max - config.amount.min)
                  )
                )
                addItem(mineral as ItemType, amount)
                mineralsFound.push({ type: mineral as ItemType, amount })
                hasFoundResource = true
              }
            })

            // Si aucune ressource n'a été trouvée, en ajouter une aléatoire
            if (!hasFoundResource) {
              const randomMineral = Object.entries(mineralDistribution)[Math.floor(Math.random() * Object.entries(mineralDistribution).length)]
              const amount = Math.floor(randomMineral[1].amount.min)
              addItem(randomMineral[0] as ItemType, amount)
              mineralsFound.push({ type: randomMineral[0] as ItemType, amount })
            }
          }

          excavations.value.push({
            levelId,
            position,
            roomIndex,
            startTime: gameTime.value,
            habitantId: habitantLibre.id,
            duration: getExcavationTime(levelId),
            mineralsFound
          })
          return true
        }
      }
    }
    return false
  }

  function buildRoom(levelId: number, position: 'left' | 'right', roomIndex: number, roomType: string) {
    const level = levels.value.find(l => l.id === levelId)
    if (level && level.isStairsExcavated) {
      const rooms = position === 'left' ? level.leftRooms : level.rightRooms
      const room = rooms[roomIndex]
      if (room && room.isExcavated && !room.isBuilt && !room.isUnderConstruction) {
        // Vérifier qu'il y a au moins un adulte disponible
        const adultAvailable = habitantsLibres.value.some(h => h.age >= 7)
        if (!adultAvailable) return false

        // Vérifier les ressources nécessaires
        const constructionCosts = ROOM_CONSTRUCTION_COSTS[roomType]
        if (constructionCosts) {
          // Vérifier si toutes les ressources sont disponibles
          for (const [resource, amount] of Object.entries(constructionCosts)) {
            const available = getItemQuantity(resource as ItemType)
            if (available < amount) {
              // Notifier le manque de ressources
              window.dispatchEvent(new CustomEvent('excavation-complete', {
                detail: {
                  title: 'Construction impossible',
                  message: `Il manque ${amount - available} ${ITEMS_CONFIG[resource as ItemType].name}`,
                  type: 'error'
                }
              }))
              return false
            }
          }

          // Consommer les ressources
          for (const [resource, amount] of Object.entries(constructionCosts)) {
            const item = inventory.value.find(item => item.type === resource && item.quantity >= amount)
            if (item) {
              removeItem(item.id, amount)
            }
          }
        }

        // Trouver un habitant libre qui a plus de 7 ans
        const habitantLibre = habitantsLibres.value.find(h => h.age >= 7)
        if (habitantLibre) {
          room.isUnderConstruction = true
          room.constructionStartTime = Math.floor(gameTime.value)
          room.constructionDuration = 4 // 4 semaines pour construire une salle
          room.type = roomType // Définir le type immédiatement
          // Initialiser le niveau de carburant pour le générateur ou le derrick
          if (roomType === 'generateur') {
            room.fuelLevel = 100
          } else if (roomType === 'derrick') {
            room.fuelLevel = 0
          }
          affecterHabitant(habitantLibre.id, {
            type: 'construction',
            levelId,
            position,
            roomIndex
          })
          updateRoomProduction()
          saveGame()
          return true
        }
      }
    }
    return false
  }

  function saveGame() {
    const gameState = {
      resources: resources.value,
      levels: levels.value,
      gameTime: gameTime.value,
      population: population.value,
      happiness: happiness.value,
      lastUpdateTime: lastUpdateTime.value,
      excavations: excavations.value,
      habitants: habitants.value,
      inventory: inventory.value,
      inventoryCapacity: inventoryCapacity.value,
      gameSpeed: gameSpeed.value // Ajout de la sauvegarde de la vitesse
    }
    localStorage.setItem('abriGameState', JSON.stringify(gameState))
  }

  function loadGame(): boolean {
    const savedState = localStorage.getItem('abriGameState')
    if (savedState) {
      const state = JSON.parse(savedState)
      resources.value = state.resources
      levels.value = state.levels
      gameTime.value = state.gameTime
      population.value = state.population
      happiness.value = state.happiness
      lastUpdateTime.value = state.lastUpdateTime || Date.now()
      excavations.value = state.excavations || []
      habitants.value = state.habitants || []
      inventory.value = state.inventory || []
      inventoryCapacity.value = state.inventoryCapacity || 1000
      gameSpeed.value = state.gameSpeed || 1 // Chargement de la vitesse
      return true
    }
    return false
  }

  function resetGame() {
    // Supprimer la sauvegarde
    localStorage.removeItem('abriGameState')
    
    // Réinitialiser toutes les variables d'état
    resources.value = {
      energie: { amount: 0, capacity: 200, production: 0, consumption: 0 },
      eau: { amount: 0, capacity: 200, production: 0, consumption: 0 },
      nourriture: { amount: 0, capacity: 200, production: 0, consumption: 0 },
      vetements: { amount: 0, capacity: 200, production: 0, consumption: 0 },
      medicaments: { amount: 0, capacity: 200, production: 0, consumption: 0 }
    }
    levels.value = []
    gameTime.value = 0
    population.value = 0
    happiness.value = 100
    lastUpdateTime.value = Date.now()
    excavations.value = []
    habitants.value = []
    inventory.value = [] // Vider complètement l'inventaire
    inventoryCapacity.value = 1000
    gameSpeed.value = 1
    
    // Réinitialiser le jeu avec les valeurs par défaut
    initGame()
  }

  // Ajouter la fonction utilitaire
  function isEnfant(age: number): boolean {
    return age < (7 * 52) // Moins de 7 ans en semaines
  }

  // Modifier la fonction affecterHabitant
  function affecterHabitant(habitantId: string, affectation: Habitant['affectation']) {
    const habitant = habitants.value.find(h => h.id === habitantId)
    if (habitant) {
      // Vérifier si l'habitant n'est pas un enfant
      if (isEnfant(habitant.age)) {
        window.dispatchEvent(new CustomEvent('excavation-complete', {
          detail: {
            title: 'Affectation impossible',
            message: 'Les enfants de moins de 7 ans ne peuvent pas travailler.',
            type: 'error'
          }
        }))
        return false
      }
      habitant.affectation = affectation
      return true
    }
    return false
  }

  function libererHabitant(habitantId: string) {
    const habitant = habitants.value.find(h => h.id === habitantId)
    if (habitant) {
      habitant.affectation = { type: null }
    }
  }

  // Configuration des équipements disponibles par type de salle
  const EQUIPMENT_CONFIG: { [key: string]: { [key: string]: { constructionTime: number, description: string, incubationTime?: number, nom: string } } } = {
    infirmerie: {
      nurserie: {
        nom: "Nurserie",
        constructionTime: 2, // 2 semaines pour construire
        description: "Permet de créer de nouveaux habitants. Les enfants de moins de 7 ans ne peuvent pas travailler.",
        incubationTime: 36 // 9 mois = 36 semaines
      }
    },
    cuve: {
      'cuve-eau': {
        nom: "Cuve à eau",
        constructionTime: 1, // 1 semaine pour construire
        description: "Augmente la capacité de stockage d'eau de la salle."
      }
    },
    serre: {
      'culture-tomates': {
        nom: "Culture de tomates",
        constructionTime: 2,
        description: "Permet de cultiver des tomates dans la serre. Augmente la production de nourriture."
      },
      'culture-avoine': {
        nom: "Culture d'avoine",
        constructionTime: 2,
        description: "Permet de cultiver de l'avoine dans la serre. Augmente la production de nourriture."
      },
      'vers-soie': {
        nom: "Élevage de vers à soie",
        constructionTime: 3,
        description: "Permet d'élever des vers à soie pour produire de la soie brute."
      }
    },
    atelier: {
      'atelier-couture': {
        nom: "👔 Atelier de couture",
        constructionTime: 2,
        description: "Permet de produire des vêtements à partir de soie."
      }
    }
  }

  // Modifier la fonction affecterHabitantSalle
  function affecterHabitantSalle(habitantId: string, levelId: number, position: 'left' | 'right', roomIndex: number): boolean {
    const habitant = habitants.value.find(h => h.id === habitantId)
    if (!habitant) return false

    const level = levels.value.find(l => l.id === levelId)
    if (!level) return false

    const room = position === 'left' ? level.leftRooms[roomIndex] : level.rightRooms[roomIndex]
    if (!room || !room.isBuilt) return false

    const config = ROOM_CONFIGS[room.type]
    if (!config) return false

    // Vérifier si c'est une salle de logement
    const isLogementRoom = ['dortoir', 'quartiers', 'appartement', 'suite'].includes(room.type)

    if (isLogementRoom) {
      // Pour les logements, pas besoin de vérifier l'âge
      // Vérifier si la salle n'est pas déjà pleine
      const capacityConfig = config as DortoryRoomConfig
      if (room.occupants.length >= (capacityConfig.capacityPerResident * (room.gridSize || 1))) {
        window.dispatchEvent(new CustomEvent('excavation-complete', {
          detail: {
            title: 'Affectation impossible',
            message: 'Ce logement est déjà plein.',
            type: 'error'
          }
        }))
        return false
      }

      // Si l'habitant avait déjà un logement, le libérer
      if (habitant.logement) {
        const oldLevel = levels.value.find(l => l.id === habitant.logement.levelId)
        if (oldLevel) {
          const oldRoom = habitant.logement.position === 'left' 
            ? oldLevel.leftRooms[habitant.logement.roomIndex]
            : oldLevel.rightRooms[habitant.logement.roomIndex]
          if (oldRoom) {
            oldRoom.occupants = oldRoom.occupants.filter(id => id !== habitantId)
          }
        }
      }

      // Affecter l'habitant au nouveau logement
      room.occupants.push(habitantId)
      habitant.logement = {
        levelId,
        position,
        roomIndex
      }
      return true
    } else {
      // Pour les autres salles, vérifier l'âge
      if (isEnfant(habitant.age)) {
        window.dispatchEvent(new CustomEvent('excavation-complete', {
          detail: {
            title: 'Affectation impossible',
            message: 'Les enfants de moins de 7 ans ne peuvent pas travailler.',
            type: 'error'
          }
        }))
        return false
      }

      // Vérifier si la salle n'est pas déjà pleine
      if (room.occupants.length >= (config.maxWorkers || 0)) return false

      // Si l'habitant était déjà dans une salle, le retirer proprement
      if (habitant.affectation.type === 'salle') {
        const oldLevel = levels.value.find(l => l.id === habitant.affectation.levelId)
        if (oldLevel) {
          const oldRoom = habitant.affectation.position === 'left' 
            ? oldLevel.leftRooms[habitant.affectation.roomIndex!]
            : oldLevel.rightRooms[habitant.affectation.roomIndex!]
          if (oldRoom) {
            // Vérifier si c'est une infirmerie avec une incubation en cours
            if (oldRoom.type === 'infirmerie') {
              const nurserie = oldRoom.equipments.find(e => e.type === 'nurserie')
              if (nurserie?.nurserieState?.isIncubating && oldRoom.occupants.length <= 1) {
                return false // Empêcher le retrait du dernier travailleur pendant l'incubation
              }
            }
            oldRoom.occupants = oldRoom.occupants.filter(id => id !== habitantId)
          }
        }
      }

      // Affecter l'habitant à la nouvelle salle
      room.occupants.push(habitantId)
      habitant.affectation = {
        type: 'salle',
        levelId,
        position,
        roomIndex
      }

      updateRoomProduction()
    }
    return true
  }

  function retirerHabitantSalle(habitantId: string, roomId: string): boolean {
    
    const habitant = habitants.value.find(h => h.id === habitantId)
    if (!habitant) return false

    // Trouver la salle spécifiée
    let targetRoom: Room | null = null
    let targetLevel: Level | null = null

    for (const level of levels.value) {
      const allRooms = [...level.leftRooms, ...level.rightRooms]
      const room = allRooms.find(r => r.id === roomId)
      if (room) {
        targetRoom = room
        targetLevel = level
        break
      }
    }

    if (!targetRoom || !targetLevel) return false

    // Vérifier si c'est une salle de logement
    const isLogementRoom = ['dortoir', 'quartiers', 'appartement', 'suite'].includes(targetRoom.type)

    if (isLogementRoom) {
      // Pour un logement, vérifier si l'habitant y est logé
      if (habitant.logement && 
          habitant.logement.levelId === targetLevel.id && 
          habitant.logement.position === targetRoom.position && 
          habitant.logement.roomIndex === targetRoom.index) {
        targetRoom.occupants = targetRoom.occupants.filter(id => id !== habitantId)
        habitant.logement = null
        return true
      }
    } else {
      // Pour une salle de travail, vérifier si l'habitant y est affecté
      if (habitant.affectation.type === 'salle' && 
          habitant.affectation.levelId === targetLevel.id && 
          habitant.affectation.position === targetRoom.position && 
          habitant.affectation.roomIndex === targetRoom.index) {
        targetRoom.occupants = targetRoom.occupants.filter(id => id !== habitantId)
        habitant.affectation = { type: null }
        updateRoomProduction()
        return true
      }
    }

    return false
  }

  // Nouvelle version moins agressive de la vérification de cohérence
  function verifierCoherenceAffectations() {
    // 1. Nettoyer les références aux habitants qui n'existent plus
    levels.value.forEach(level => {
      const allRooms = [...level.leftRooms, ...level.rightRooms]
      allRooms.forEach(room => {
        if (!room.isBuilt) return
        
        room.occupants = room.occupants.filter(id => 
          habitants.value.some(h => h.id === id)
        )
      })
    })

    // 2. Vérifier uniquement les habitants sans salle qui sont listés comme occupants
    habitants.value.forEach(habitant => {
      if (habitant.affectation.type !== 'salle') {
        // Si l'habitant n'est pas affecté, s'assurer qu'il n'est pas listé comme occupant
        levels.value.forEach(level => {
          const allRooms = [...level.leftRooms, ...level.rightRooms]
          allRooms.forEach(room => {
            if (room.occupants.includes(habitant.id)) {
              room.occupants = room.occupants.filter(id => id !== habitant.id)
            }
          })
        })
      }
    })
  }

  function checkAndMergeRooms(level: Level, room: Room) {
    if (!room.isBuilt) return false

    const rooms = room.position === 'left' ? level.leftRooms : level.rightRooms
    const prevRoom = rooms[room.index - 1]
    const nextRoom = rooms[room.index + 1]

    // Vérifier si on peut fusionner avec la salle précédente
    if (prevRoom?.isBuilt && prevRoom.type === room.type && !prevRoom.isUnderConstruction) {
      const newSize = (prevRoom.gridSize || 1) + (room.gridSize || 1)
      if (newSize <= 5) {
        // Fusionner avec la salle précédente
        prevRoom.gridSize = newSize
        
        // Déplacer les occupants de manière sûre
        const occupantsToMove = [...room.occupants]
        occupantsToMove.forEach(id => {
          const habitant = habitants.value.find(h => h.id === id)
          if (habitant && !prevRoom.occupants.includes(id)) {
            prevRoom.occupants.push(id)
            habitant.affectation = {
              type: 'salle',
              levelId: level.id,
              position: prevRoom.position,
              roomIndex: prevRoom.index
            }
          }
        })

        // Supprimer la salle fusionnée et réorganiser les indices
        rooms.splice(room.index, 1)
        
        // Mettre à jour les indices des salles restantes
        for (let i = room.index; i < rooms.length; i++) {
          rooms[i].index = i
          // Mettre à jour les affectations des habitants pour les salles suivantes
          rooms[i].occupants.forEach(id => {
            const habitant = habitants.value.find(h => h.id === id)
            if (habitant && habitant.affectation.type === 'salle') {
              habitant.affectation.roomIndex = i
            }
          })
        }

        updateRoomProduction()
        return true
      }
    }
    // Vérifier si on peut fusionner avec la salle suivante
    else if (nextRoom?.isBuilt && nextRoom.type === room.type && !nextRoom.isUnderConstruction) {
      const newSize = (room.gridSize || 1) + (nextRoom.gridSize || 1)
      if (newSize <= 5) {
        // Fusionner avec la salle suivante
        room.gridSize = newSize
        
        // Déplacer les occupants de manière sûre
        const occupantsToMove = [...nextRoom.occupants]
        occupantsToMove.forEach(id => {
          const habitant = habitants.value.find(h => h.id === id)
          if (habitant && !room.occupants.includes(id)) {
            room.occupants.push(id)
            habitant.affectation = {
              type: 'salle',
              levelId: level.id,
              position: room.position,
              roomIndex: room.index
            }
          }
        })

        // Supprimer la salle fusionnée et réorganiser les indices
        rooms.splice(nextRoom.index, 1)
        
        // Mettre à jour les indices des salles restantes
        for (let i = nextRoom.index - 1; i < rooms.length; i++) {
          rooms[i].index = i
          // Mettre à jour les affectations des habitants pour les salles suivantes
          rooms[i].occupants.forEach(id => {
            const habitant = habitants.value.find(h => h.id === id)
            if (habitant && habitant.affectation.type === 'salle') {
              habitant.affectation.roomIndex = i
            }
          })
        }

        updateRoomProduction()
        return true
      }
    }

    return false
  }

  function addEquipment(levelId: number, position: 'left' | 'right', roomIndex: number, equipmentType: string): boolean {
    const level = levels.value.find(l => l.id === levelId)
    if (!level) return false

    const room = position === 'left' ? level.leftRooms[roomIndex] : level.rightRooms[roomIndex]
    if (!room || !room.isBuilt) return false

    // Vérifier si l'équipement est disponible pour ce type de salle
    const equipmentConfig = EQUIPMENT_CONFIG[room.type]?.[equipmentType]
    if (!equipmentConfig) return false

    // Vérifier si l'équipement n'est pas déjà installé ou en construction
    if (room.equipments.some(e => e.type === equipmentType)) return false

    const equipment: Equipment = {
      id: `${room.id}-${equipmentType}`,
      type: equipmentType,
      isUnderConstruction: true,
      constructionStartTime: gameTime.value,
      constructionDuration: equipmentConfig.constructionTime
    }

    room.equipments.push(equipment)
    saveGame()
    return true
  }

  function createNewHabitant(levelId: number, position: 'left' | 'right', roomIndex: number, embryonType: ItemType = 'embryon-humain'): boolean {
    const level = levels.value.find(l => l.id === levelId)
    if (!level) return false

    const room = position === 'left' ? level.leftRooms[roomIndex] : level.rightRooms[roomIndex]
    if (!room || !room.isBuilt || room.type !== 'infirmerie') return false

    // Vérifier s'il y a au moins un travailleur dans l'infirmerie
    if (room.occupants.length === 0) {
        window.dispatchEvent(new CustomEvent('excavation-complete', {
            detail: {
                title: 'Incubation impossible',
                message: 'Il faut au moins un travailleur dans l\'infirmerie pour incuber un embryon.',
                type: 'error'
            }
        }))
        return false
    }

    // Vérifier si la nurserie est construite et opérationnelle
    const nurserie = room.equipments.find(e => e.type === 'nurserie' && !e.isUnderConstruction)
    if (!nurserie) {
        window.dispatchEvent(new CustomEvent('excavation-complete', {
            detail: {
                title: 'Incubation impossible',
                message: 'Une nurserie opérationnelle est nécessaire pour incuber un embryon.',
                type: 'error'
            }
        }))
        return false
    }

    // Vérifier si la nurserie n'est pas déjà en train d'incuber
    if (nurserie.nurserieState?.isIncubating) {
        window.dispatchEvent(new CustomEvent('excavation-complete', {
            detail: {
                title: 'Incubation impossible',
                message: 'Une incubation est déjà en cours dans cette nurserie.',
                type: 'error'
            }
        }))
        return false
    }

    // Vérifier s'il y a des embryons disponibles
    const embryonsDisponibles = getItemQuantity(embryonType)
    if (embryonsDisponibles <= 0) {
        window.dispatchEvent(new CustomEvent('excavation-complete', {
            detail: {
                title: 'Incubation impossible',
                message: 'Aucun embryon disponible pour l\'incubation.',
                type: 'error'
            }
        }))
        return false
    }

    // Trouver un embryon à utiliser et le retirer de l'inventaire
    const embryonItem = inventory.value.find(item => item.type === embryonType && item.quantity > 0)
    if (!embryonItem) return false

    // Retirer un embryon
    removeItem(embryonItem.id, 1)

    // Démarrer l'incubation
    nurserie.nurserieState = {
      isIncubating: true,
      startTime: gameTime.value,
      embryonType
    }

    saveGame()
    return true
  }

  // Ajouter une nouvelle fonction pour vérifier et finaliser l'incubation
  function checkAndFinalizeIncubation() {
    levels.value.forEach(level => {
      const allRooms = [...level.leftRooms, ...level.rightRooms]
      allRooms.forEach(room => {
        if (room.type === 'infirmerie' && room.isBuilt) {
          room.equipments.forEach(equipment => {
            if (equipment.type === 'nurserie' && !equipment.isUnderConstruction) {
              const nurserieState = equipment.nurserieState
              if (nurserieState?.isIncubating && nurserieState.startTime !== undefined) {
                const elapsedTime = gameTime.value - nurserieState.startTime
                const incubationTime = EQUIPMENT_CONFIG.infirmerie.nurserie.incubationTime || 36

                if (elapsedTime >= incubationTime) {
                  // Créer le nouvel habitant
                  const genre = Math.random() > 0.5 ? 'H' : 'F'
                  const prenom = genre === 'H' 
                    ? PRENOMS.filter((_, i) => i < PRENOMS.length / 2)[Math.floor(Math.random() * (PRENOMS.length / 2))]
                    : PRENOMS.filter((_, i) => i >= PRENOMS.length / 2)[Math.floor(Math.random() * (PRENOMS.length / 2))]
                  const nom = NOMS[Math.floor(Math.random() * NOMS.length)]

                  const newHabitant: Habitant = {
                    id: `habitant-${Date.now()}`,
                    nom: `${prenom} ${nom}`,
                    genre,
                    age: 0,
                    sante: 100, // Santé initiale à 100%
                    affectation: { type: null },
                    competences: generateRandomCompetences(),
                    bonheur: 50, // Score de bonheur par défaut
                    logement: null
                  }

                  habitants.value.push(newHabitant)
                  population.value++

                  // Réinitialiser l'état de la nurserie
                  equipment.nurserieState = {
                    isIncubating: false,
                    embryonType: undefined,
                    startTime: undefined
                  }

                  saveGame()
                }
              }
            }
          })
        }
      })
    })
  }

  // Fonctions de gestion de l'inventaire
  function addItem(type: ItemType, quantity: number = 1): boolean {

    // Vérifier si on ne dépasse pas la taille du stack
    const config = ITEMS_CONFIG[type];
    if (!config) {
      console.log('Type d\'item non trouvé:', type);
      return false;
    }

    let remainingQuantity = quantity;

    while (remainingQuantity > 0) {
      // Chercher un stack existant non plein
      const existingItem = inventory.value.find(item => 
        item.type === type && item.quantity < item.stackSize
      );

      if (existingItem) {
        const spaceInStack = existingItem.stackSize - existingItem.quantity;
        const toAdd = Math.min(remainingQuantity, spaceInStack);
        existingItem.quantity += toAdd;
        remainingQuantity -= toAdd;
      } else {
        // Créer un nouveau stack
        const stackSize = Math.min(remainingQuantity, config.stackSize);
        const newItem: Item = {
          id: `${type}-${Date.now()}-${Math.random()}`,
          type,
          quantity: stackSize,
          stackSize: config.stackSize,
          description: config.description,
          category: config.category
        };
        inventory.value.push(newItem);
        remainingQuantity -= stackSize;
      }
    }

    saveGame();
    return true;
  }

  function removeItem(itemIdOrType: string, quantity: number = 1): boolean {

    // Trouver tous les items correspondants (par ID ou par type) et retirer les stacks vides
    const matchingItems = inventory.value.filter(item => 
      (item.id === itemIdOrType || item.type === itemIdOrType) && item.quantity > 0
    ).sort((a, b) => b.quantity - a.quantity) // Trier par quantité décroissante

    if (matchingItems.length === 0) {
      console.log('Item non trouvé:', itemIdOrType)
      return false
    }

    // Calculer la quantité totale disponible
    const totalAvailable = matchingItems.reduce((sum, item) => sum + item.quantity, 0)
    if (totalAvailable < quantity) {
      console.log('Quantité insuffisante:', totalAvailable, '<', quantity)
      return false
    }

    let remainingToRemove = quantity

    // Retirer la quantité nécessaire des stacks et purger les stacks vides
    for (const item of matchingItems) {
      if (remainingToRemove <= 0) break

      const amountToRemove = Math.min(remainingToRemove, item.quantity)
      item.quantity -= amountToRemove
      remainingToRemove -= amountToRemove
    }

    // Purger tous les stacks vides
    inventory.value = inventory.value.filter(item => item.quantity > 0)

    saveGame()
    return true
  }

  function getItemQuantity(type: ItemType): number {
    return inventory.value
      .filter(item => item.type === type)
      .reduce((total, item) => total + item.quantity, 0)
  }

  // Initialisation
  if (!loadGame()) {
    initGame()
  }

  // Ajout des fonctions de contrôle de la vitesse
  function setGameSpeed(speed: number) {
    gameSpeed.value = speed
  }

  function increaseGameSpeed() {
    if (gameSpeed.value < 50) {
      gameSpeed.value++
    }
  }

  function decreaseGameSpeed() {
    if (gameSpeed.value > 1) {
      gameSpeed.value--
    }
  }

  function getCurrentState() {
    return {
      resources: resources.value,
      levels: levels.value,
      gameTime: gameTime.value,
      population: population.value,
      happiness: happiness.value,
      lastUpdateTime: lastUpdateTime.value,
      excavations: excavations.value,
      habitants: habitants.value,
      inventory: inventory.value,
      inventoryCapacity: inventoryCapacity.value,
      gameSpeed: gameSpeed.value
    }
  }

  function loadState(state: any) {
    resources.value = state.resources
    levels.value = state.levels
    gameTime.value = state.gameTime
    population.value = state.population
    happiness.value = state.happiness
    lastUpdateTime.value = state.lastUpdateTime || Date.now()
    excavations.value = state.excavations || []
    habitants.value = state.habitants || []
    inventory.value = state.inventory || []
    inventoryCapacity.value = state.inventoryCapacity || 1000
    gameSpeed.value = state.gameSpeed || 1
  }

  function addStairs(levelIndex: number, position: 'left' | 'right') {
    const level = levels.value[levelIndex]
    if (!level) return false

    const rooms = position === 'left' ? level.leftRooms : level.rightRooms
    const room = rooms[0]

    if (!room || !room.isBuilt) return false

    const config = ROOM_CONFIGS[room.type]
    if (!config) return false

    room.stairsPosition = position
    return true
  }

  const WATER_TANK_RATIO = 2 // 1% de fuelLevel = 2 unités d'eau

  function findWaterTanks(): Room[] {
    const tanks: Room[] = []
    levels.value.forEach(level => {
      const allRooms = [...level.leftRooms, ...level.rightRooms]
      allRooms.forEach(room => {
        if (room.isBuilt && room.type === 'cuve' && 
            room.equipments?.some(e => e.type === 'cuve-eau' && !e.isUnderConstruction)) {
          if (room.fuelLevel === undefined) {
            room.fuelLevel = 0 // Initialiser le niveau si undefined
          }
          tanks.push(room)
        }
      })
    })
    console.log('Cuves d\'eau trouvées:', tanks.length)
    return tanks
  }

  function addWater(amount: number): number {
    const tanks = findWaterTanks()
    if (tanks.length === 0) {
      console.log('Pas de cuve disponible pour stocker l\'eau')
      return 0
    }

    // Trouver la cuve la moins remplie
    const leastFilledTank = tanks.reduce((min, tank) => 
      (tank.fuelLevel || 0) < (min.fuelLevel || 0) ? tank : min
    , tanks[0])

    const tankCapacity = 100 // Capacité maximale en pourcentage
    const currentLevel = leastFilledTank.fuelLevel || 0
    const spaceLeft = tankCapacity - currentLevel
    const waterToAdd = Math.min(amount, spaceLeft * WATER_TANK_RATIO)

    if (waterToAdd > 0) {
      leastFilledTank.fuelLevel = currentLevel + (waterToAdd / WATER_TANK_RATIO)
      console.log(`Ajout de ${waterToAdd} unités d'eau, niveau cuve: ${leastFilledTank.fuelLevel}%`)
      return waterToAdd
    }

    return 0
  }

  function removeWater(amount: number): number {
    const tanks = findWaterTanks()
    if (tanks.length === 0) return 0 // Pas de cuve disponible

    // Trouver la cuve la plus remplie
    const mostFilledTank = tanks.reduce((max, tank) => 
      (tank.fuelLevel || 0) > (max.fuelLevel || 0) ? tank : max
    , tanks[0])

    const currentLevel = mostFilledTank.fuelLevel || 0
    const waterAvailable = currentLevel * WATER_TANK_RATIO
    const waterToRemove = Math.min(amount, waterAvailable)

    if (waterToRemove > 0) {
      mostFilledTank.fuelLevel = currentLevel - (waterToRemove / WATER_TANK_RATIO)
      return waterToRemove
    }

    return 0
  }

  function isFoodItem(item: ItemConfig): item is FoodItemConfig {
    return item.category === 'nourriture'
  }

  function calculateFoodQuality(item: Item): number {
    const itemConfig = ITEMS_CONFIG[item.type as keyof typeof ITEMS_CONFIG]
    return isFoodItem(itemConfig) ? itemConfig.qualite : 1
  }

  function getFoodRatio(itemType: ItemType): number {
    const itemConfig = ITEMS_CONFIG[itemType]
    return isFoodItem(itemConfig) ? itemConfig.ratio : 1
  }

  return {
    // État
    resources,
    levels,
    gameTime,
    population,
    happiness,
    formattedTime,
    excavations,
    habitants,
    habitantsLibres,
    habitantsOccupes,
    enfants,
    
    // Getters
    resourcesList,
    excavatedLevels,
    builtRooms,
    isExcavationInProgress,
    getExcavationProgress,
    getExcavationInfo,
    averageFoodQuality,
    foodQualityEmoji,
    
    // Actions
    update,
    excavateStairs,
    excavateRoom,
    buildRoom,
    saveGame,
    loadGame,
    resetGame,
    affecterHabitant,
    libererHabitant,
    affecterHabitantSalle,
    retirerHabitantSalle,
    ROOM_CONFIGS,
    ROOM_MERGE_CONFIG,
    GAME_CONFIG,
    ITEMS_CONFIG,
    addStairs,
    addEquipment,
    createNewHabitant,
    EQUIPMENT_CONFIG,
    
    // Inventaire
    inventory,
    inventoryItems,
    inventorySpace,
    addItem,
    removeItem,
    getItemQuantity,
    gameSpeed,
    setGameSpeed,
    increaseGameSpeed,
    decreaseGameSpeed,
    getCurrentState,
    loadState,
    globalHappiness,
    HAPPINESS_CONFIG,
    findWaterTanks,
    addWater,
    removeWater
  }
}) 