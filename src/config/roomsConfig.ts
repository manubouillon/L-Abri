import type { ItemType } from '../stores/gameStore'

export type ResourceKey = 'energie' | 'eau' | 'nourriture' | 'vetements' | 'medicaments' | 'laitue'

export interface RoomConfigBase {
  maxWorkers: number
  energyConsumption: number // Consommation d'énergie par semaine
}

export interface StorageRoomConfig extends RoomConfigBase {
  type: 'storage'
  capacityPerWorker: {
    [key in ResourceKey]?: number
  }
}

export interface DortoryRoomConfig extends RoomConfigBase {
  type: 'dortory'
  capacityPerResident: number
}

export interface ProductionRoomConfig extends RoomConfigBase {
  type: 'production'
  productionPerWorker: {
    [key in ResourceKey]?: number
  }
  waterConsumption?: number
  fuelConsumption?: number
  resourceConsumption?: {
    [key in ResourceKey]?: number
  }
  resourceProduction?: {
    [key: string]: number
  }
  mineralsProcessingPerWorker?: number
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

export interface StorageTankConfig extends RoomConfigBase {
  type: 'tank'
  storage: {
    [key in ItemType]?: number
  }
}

export type RoomConfig = StorageRoomConfig | DortoryRoomConfig | ProductionRoomConfig | StorageTankConfig

export const ROOMS_CONFIG: { [key: string]: RoomConfig } = {
  'chambre-froide': {
    type: 'storage',
    maxWorkers: 2,
    energyConsumption: 3,
    capacityPerWorker: {
      'nourriture': 200
    }
  },
  'cuve': {
    type: 'tank',
    maxWorkers: 0,
    energyConsumption: 0,
    storage: {
      'lingot-fer': 30,
      'lingot-acier': 15,
      'lingot-cuivre': 12,
      'lingot-silicium': 8,
    }
  },
  'dortoir': {
    type: 'dortory',
    maxWorkers: 0,
    energyConsumption: 1,
    capacityPerResident: 4
  },
  'quartiers': {
    type: 'dortory',
    maxWorkers: 0,
    energyConsumption: 2,
    capacityPerResident: 2
  },
  'appartement': {
    type: 'dortory',
    maxWorkers: 0,
    energyConsumption: 3,
    capacityPerResident: 1
  },
  'suite': {
    type: 'dortory',
    maxWorkers: 0,
    energyConsumption: 4,
    capacityPerResident: 1
  },
  'entrepot': {
    type: 'storage',
    maxWorkers: 2,
    energyConsumption: 1,
    capacityPerWorker: {
      'eau': 100,
      'nourriture': 100,
      'vetements': 50,
      'medicaments': 20
    }
  },
  'raffinerie': {
    type: 'production',
    maxWorkers: 4,
    energyConsumption: 5,
    mineralsProcessingPerWorker: 2,
    productionPerWorker: {},
    conversionRules: {
      'minerai-fer': {
        output: 'lingot-fer',
        ratio: 0.8,
        requires: {
          'minerai-charbon': 0.2
        }
      },
      'minerai-cuivre': {
        output: 'lingot-cuivre',
        ratio: 0.7
      },
      'minerai-silicium': {
        output: 'lingot-silicium',
        ratio: 0.6
      },
      'minerai-or': {
        output: 'lingot-or',
        ratio: 0.3
      },
      'lingot-fer': {
        output: 'lingot-acier',
        ratio: 0.5,
        requires: {
          'minerai-charbon': 0.5,
          'minerai-calcaire': 0.2
        }
      }
    }
  },
  'cuisine': {
    type: 'production',
    maxWorkers: 3,
    energyConsumption: 2,
    productionPerWorker: {
      'nourriture': 5
    }
  },
  'station-traitement': {
    type: 'production',
    maxWorkers: 2,
    energyConsumption: 3,
    productionPerWorker: {
      'eau': 10
    }
  },
  'generateur': {
    type: 'production',
    maxWorkers: 2,
    energyConsumption: 0,
    productionPerWorker: {
      'energie': 10
    }
  },
  'infirmerie': {
    type: 'production',
    maxWorkers: 2,
    energyConsumption: 2,
    productionPerWorker: {
      'medicaments': 2
    }
  },
  'serre': {
    type: 'production',
    maxWorkers: 3,
    energyConsumption: 2,
    waterConsumption: 2,
    productionPerWorker: {
      'laitue': 2
    }
  },
  'derrick': {
    type: 'production',
    maxWorkers: 2,
    energyConsumption: 4,
    productionPerWorker: {},
    resourceProduction: {
      'baril-petrole': 1
    }
  },
  'salle-controle': {
    type: 'production',
    maxWorkers: 2,
    energyConsumption: 5,
    productionPerWorker: {}
  },
  'atelier': {
    type: 'production',
    maxWorkers: 3,
    energyConsumption: 2,
    productionPerWorker: {}
  }
}

export interface RoomCategory {
  id: string
  name: string
  rooms: string[]
}

export interface RoomType {
  id: string
  name: string
  icon: string
  description: string
  category: string
  competence: 'force' | 'dexterite' | 'charme' | 'relations' | 'instinct' | 'savoir'
}

export const ROOM_TYPES: RoomType[] = [
  {
    id: 'chambre-froide',
    name: 'Chambre froide',
    icon: '❄️',
    description: 'Stocke de la nourriture avec une capacité accrue',
    category: 'stockage',
    competence: 'dexterite' // ?
  },
  {
    id: 'entrepot',
    name: 'Entrepôt',
    icon: '📦',
    description: 'Augmente la capacité de stockage des ressources',
    category: 'stockage',
    competence: 'force'     // ?
  },
  {
    id: 'cuve',
    name: 'Cuve',
    icon: '🛢️',
    description: 'Stocke de l\'eau ou du pétrole en grande quantité',
    category: 'stockage',
    competence: 'dexterite' // ?
  },
  {
    id: 'dortoir',
    name: 'Dortoir',
    icon: '🛏️',
    description: 'Héberge jusqu\'à 8 habitants',
    category: 'logements',
    competence: 'charme'
  },
  {
    id: 'quartiers',
    name: 'Quartiers',
    icon: '🏘️',
    description: 'Héberge jusqu\'à 6 habitants avec plus de confort',
    category: 'logements',
    competence: 'charme'
  },
  {
    id: 'appartement',
    name: 'Appartement',
    icon: '🏢',
    description: 'Héberge jusqu\'à 4 habitants avec un grand confort',
    category: 'logements',
    competence: 'charme'
  },
  {
    id: 'suite',
    name: 'Suite',
    icon: '🏰',
    description: 'Héberge jusqu\'à 2 habitants dans un luxe absolu',
    category: 'logements',
    competence: 'charme'
  },
  {
    id: 'cuisine',
    name: 'Cuisine',
    icon: '🍳',
    description: 'Produit de la nourriture',
    category: 'alimentation',
    competence: 'dexterite'
  },
  {
    id: 'station-traitement',
    name: 'Station de traitement',
    icon: '💧',
    description: 'Produit de l\'eau potable',
    category: 'eau',
    competence: 'savoir'
  },
  {
    id: 'generateur',
    name: 'Générateur',
    icon: '⚡',
    description: 'Produit de l\'énergie',
    category: 'energie',
    competence: 'force'
  },
  {
    id: 'infirmerie',
    name: 'Infirmerie',
    icon: '🏥',
    description: 'Produit des médicaments',
    category: 'sante',
    competence: 'savoir'
  },
  {
    id: 'serre',
    name: 'Serre',
    icon: '🌱',
    description: 'Produit de la nourriture',
    category: 'alimentation',
    competence: 'instinct'
  },
  {
    id: 'raffinerie',
    name: 'Raffinerie',
    icon: '⚒️',
    description: 'Raffine les minerais en lingots',
    category: 'production',
    competence: 'force'
  },
  {
    id: 'derrick',
    name: 'Derrick',
    icon: '🛢️',
    description: 'Extrait du pétrole pour alimenter les générateurs',
    category: 'production',
    competence: 'force'
  },
  {
    id: 'atelier',
    name: 'Atelier',
    icon: '⚒️',
    description: 'Produit des objets manufacturés',
    category: 'production',
    competence: 'dexterite'
  },
  {
    id: 'salle-controle',
    name: 'Salle de contrôle',
    icon: '🎮',
    description: 'Permet de contrôler et surveiller l\'ensemble de l\'abri',
    category: 'production',
    competence: 'relations'
  }
]

export const ROOM_CATEGORIES: RoomCategory[] = [
  {
    id: 'stockage',
    name: 'Stockage',
    rooms: ['entrepot', 'cuve', 'chambre-froide']
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

// Configuration des multiplicateurs de fusion par type de salle
export const ROOM_MERGE_CONFIG: { [key: string]: { useMultiplier: boolean } } = {
  'chambre-froide': { useMultiplier: true },
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

// Configuration des coûts de construction par type de salle
export const ROOM_CONSTRUCTION_COSTS: { [key: string]: { [key in ItemType]?: number } } = {
  'chambre-froide': {
    'lingot-fer': 35,
    'lingot-acier': 20,
    'lingot-cuivre': 15,
    'lingot-silicium': 10
  },
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

// Configuration des couleurs
export const ROOM_COLORS = {
  categories: {
    stockage: '#3498db',     // Bleu
    logements: '#2ecc71',    // Vert
    alimentation: '#e67e22', // Orange
    eau: '#3498db',         // Bleu
    energie: '#f1c40f',     // Jaune
    sante: '#e74c3c',       // Rouge
    production: '#9b59b6'   // Violet
  },
  rooms: {
    'chambre-froide': '#3498db',
    'entrepot': '#3498db',
    'cuve': '#3498db',
    'dortoir': '#2ecc71',
    'quartiers': '#2ecc71',
    'appartement': '#2ecc71',
    'suite': '#2ecc71',
    'cuisine': '#e67e22',
    'station-traitement': '#3498db',
    'generateur': '#f1c40f',
    'infirmerie': '#e74c3c',
    'serre': '#e67e22',
    'raffinerie': '#9b59b6',
    'derrick': '#9b59b6',
    'atelier': '#9b59b6',
    'salle-controle': '#9b59b6'
  }
} as const 