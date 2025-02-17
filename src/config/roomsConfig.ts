import type { ItemType } from '../stores/gameStore'

export type ResourceKey = 'energie' | 'eau' | 'nourriture' | 'vetements' | 'medicaments'

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
      'minerai-fer-acier': {
        output: 'lingot-acier',
        ratio: 0.5,
        requires: {
          'minerai-charbon': 0.5,
          'minerai-calcaire': 0.2
        }
      }
    }
  },
  // ... autres configurations de salles ...
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