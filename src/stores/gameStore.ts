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
  affectation: Affectation
  competences: Competences
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
    rooms: ['entrepot']
  },
  {
    id: 'logements',
    name: 'Logements',
    rooms: ['dortoir']
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
    rooms: ['raffinerie', 'derrick']
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
      levelId: 0, // Premier niveau
      rooms: [
        { position: 'left', index: 0, type: 'dortoir', gridSize: 2, workers: 0 },
        { position: 'left', index: 2, type: 'entrepot', gridSize: 1, workers: 0 },
        //{ position: 'left', index: 4, type: 'raffinerie', gridSize: 1, workers: 1 },
        { position: 'right', index: 0, type: 'generateur', gridSize: 2, workers: 1 },
        { position: 'right', index: 2, type: 'station-traitement', gridSize: 1, workers: 1 },
        { position: 'right', index: 3, type: 'serre', gridSize: 1, workers: 1 }
      ]
    }
  ]
} as const

// Configuration des multiplicateurs de fusion par type de salle
export const ROOM_MERGE_CONFIG: { [key: string]: { useMultiplier: boolean } } = {
  entrepot: { useMultiplier: true },
  dortoir: { useMultiplier: false },
  cuisine: { useMultiplier: true },
  'station-traitement': { useMultiplier: true },
  generateur: { useMultiplier: true },
  infirmerie: { useMultiplier: true },
  serre: { useMultiplier: true },
  raffinerie: { useMultiplier: true },
  derrick: { useMultiplier: true }
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

interface StorageRoomConfig extends RoomConfigBase {
  capacityPerWorker: {
    [key in ResourceKey]?: number
  }
}

interface DortoryRoomConfig extends RoomConfigBase {
  capacityPerResident: number
}

interface ProductionRoomConfig extends RoomConfigBase {
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

type RoomConfig = StorageRoomConfig | DortoryRoomConfig | ProductionRoomConfig

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
    capacityPerResident: 4
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
      eau: 2
    }
  } as ProductionRoomConfig,
  generateur: {
    maxWorkers: 2,
    energyConsumption: 0, // La salle d'énergie ne consomme pas d'énergie
    productionPerWorker: {
      energie: 3
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
      nourriture: 1.5
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
      'minerai-charbon': { output: 'lingot-acier', ratio: 0.6, requires: { 'minerai-fer': 2 } } // 2 fer + 1 charbon = 0.6 acier
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
  } as ProductionRoomConfig
} as const

const PRENOMS = [
  'Jean', 'Pierre', 'Luc', 'Louis', 'Thomas', 'Paul', 'Nicolas', 'Antoine', // Prénoms masculins
  'Marie', 'Sophie', 'Emma', 'Julie', 'Claire', 'Alice', 'Laura', 'Léa' // Prénoms féminins
]

const NOMS = [
  'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit',
  'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel'
]

function generateRandomName(): { nom: string, genre: 'H' | 'F', age: number } {
  const genre = Math.random() > 0.5 ? 'H' : 'F'
  const prenom = genre === 'H' 
    ? PRENOMS.filter((_, i) => i < PRENOMS.length / 2)[Math.floor(Math.random() * (PRENOMS.length / 2))]
    : PRENOMS.filter((_, i) => i >= PRENOMS.length / 2)[Math.floor(Math.random() * (PRENOMS.length / 2))]
  const nom = NOMS[Math.floor(Math.random() * NOMS.length)]
  const age = Math.floor(Math.random() * 30) + 18 // Entre 18 et 47 ans
  return { nom: `${prenom} ${nom}`, genre, age }
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
}

export type ItemCategory = 'biologique' | 'ressource' | 'nourriture' | 'conteneur' | 'ressource-brute'
export type ItemType = 'embryon-humain' | 'baril-petrole' | 'baril-vide' | 'cereales' | 'nourriture-conserve' | 
  'minerai-fer' | 'minerai-charbon' | 'minerai-silicium' | 'minerai-cuivre' | 'minerai-or' | 'minerai-calcaire' |
  'lingot-fer' | 'lingot-acier' | 'lingot-cuivre' | 'lingot-silicium' | 'lingot-or'

export const ITEMS_CONFIG: { [key in ItemType]: {
  name: string
  stackSize: number
  description: string
  category: ItemCategory
} } = {
  'embryon-humain': {
    name: 'Embryon humain',
    stackSize: 1000,
    description: 'Un embryon humain cryogénisé, prêt à être implanté dans une nurserie.',
    category: 'biologique'
  },
  'baril-petrole': {
    name: 'Baril de pétrole',
    stackSize: 100,
    description: 'Un baril contenant du pétrole brut.',
    category: 'ressource'
  },
  'baril-vide': {
    name: 'Baril vide',
    stackSize: 100,
    description: 'Un baril vide pouvant contenir des liquides.',
    category: 'conteneur'
  },
  'cereales': {
    name: 'Céréales',
    stackSize: 1000,
    description: 'Des céréales cultivées dans les serres.',
    category: 'nourriture'
  },
  'nourriture-conserve': {
    name: 'Nourriture en conserve',
    stackSize: 1000,
    description: 'De la nourriture en conserve, peut être stockée longtemps.',
    category: 'nourriture'
  },
  'minerai-fer': {
    name: 'Minerai de fer',
    stackSize: 1000,
    description: 'Minerai de fer brut extrait des profondeurs.',
    category: 'ressource-brute'
  },
  'minerai-charbon': {
    name: 'Charbon',
    stackSize: 1000,
    description: 'Charbon extrait des profondeurs.',
    category: 'ressource-brute'
  },
  'minerai-silicium': {
    name: 'Minerai de silicium',
    stackSize: 1000,
    description: 'Minerai de silicium brut extrait des profondeurs.',
    category: 'ressource-brute'
  },
  'minerai-cuivre': {
    name: 'Minerai de cuivre',
    stackSize: 1000,
    description: 'Minerai de cuivre brut extrait des profondeurs.',
    category: 'ressource-brute'
  },
  'minerai-or': {
    name: 'Minerai d\'or',
    stackSize: 1000,
    description: 'Minerai d\'or brut extrait des profondeurs.',
    category: 'ressource-brute'
  },
  'minerai-calcaire': {
    name: 'Calcaire',
    stackSize: 1000,
    description: 'Calcaire extrait des profondeurs.',
    category: 'ressource-brute'
  },
  'lingot-fer': {
    name: 'Lingot de fer',
    stackSize: 1000,
    description: 'Lingot de fer raffiné.',
    category: 'ressource'
  },
  'lingot-acier': {
    name: 'Lingot d\'acier',
    stackSize: 1000,
    description: 'Lingot d\'acier, un alliage de fer et de carbone.',
    category: 'ressource'
  },
  'lingot-cuivre': {
    name: 'Lingot de cuivre',
    stackSize: 1000,
    description: 'Lingot de cuivre raffiné.',
    category: 'ressource'
  },
  'lingot-silicium': {
    name: 'Lingot de silicium',
    stackSize: 1000,
    description: 'Lingot de silicium raffiné.',
    category: 'ressource'
  },
  'lingot-or': {
    name: 'Lingot d\'or',
    stackSize: 1000,
    description: 'Lingot d\'or raffiné.',
    category: 'ressource'
  }
}

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
    'minerai-calcaire': { chance: 0.7, amount: { min: 15, max: 35 } }
  },
  1: {
    'minerai-fer': { chance: 0.5, amount: { min: 15, max: 35 } },
    'minerai-charbon': { chance: 0.4, amount: { min: 15, max: 30 } },
    'minerai-calcaire': { chance: 0.6, amount: { min: 20, max: 40 } },
    'minerai-cuivre': { chance: 0.2, amount: { min: 5, max: 15 } }
  },
  2: {
    'minerai-fer': { chance: 0.4, amount: { min: 20, max: 40 } },
    'minerai-charbon': { chance: 0.3, amount: { min: 20, max: 35 } },
    'minerai-calcaire': { chance: 0.5, amount: { min: 25, max: 45 } },
    'minerai-cuivre': { chance: 0.3, amount: { min: 10, max: 25 } },
    'minerai-silicium': { chance: 0.2, amount: { min: 5, max: 15 } }
  },
  3: {
    'minerai-fer': { chance: 0.3, amount: { min: 25, max: 45 } },
    'minerai-cuivre': { chance: 0.4, amount: { min: 15, max: 35 } },
    'minerai-silicium': { chance: 0.3, amount: { min: 10, max: 25 } },
    'minerai-or': { chance: 0.1, amount: { min: 2, max: 8 } }
  },
  4: {
    'minerai-cuivre': { chance: 0.5, amount: { min: 20, max: 40 } },
    'minerai-silicium': { chance: 0.4, amount: { min: 15, max: 35 } },
    'minerai-or': { chance: 0.2, amount: { min: 5, max: 15 } }
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
  }
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
  const gameSpeed = ref(1) // Ajout de la vitesse du jeu
  const resources = ref<{ [key: string]: Resource }>({
    energie: { amount: 0, capacity: 200, production: 0, consumption: 0 },
    eau: { amount: 0, capacity: 200, production: 0, consumption: 0 },
    nourriture: { amount: 0, capacity: 200, production: 0, consumption: 0 },
    vetements: { amount: 0, capacity: 200, production: 0, consumption: 0 },
    medicaments: { amount: 0, capacity: 200, production: 0, consumption: 0 }
  })

  // Inventaire
  const inventory = ref<Item[]>([])
  const inventoryCapacity = ref(1000) // Capacité totale de l'inventaire en nombre d'items

  // Getters
  const resourcesList = computed(() => Object.entries(resources.value))
  const excavatedLevels = computed(() => levels.value.filter(l => l.isStairsExcavated))
  const builtRooms = computed(() => levels.value.flatMap(l => [...l.leftRooms, ...l.rightRooms].filter(r => r.isBuilt)))
  
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
    habitants.value.filter(h => h.age < 7)
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
      equipments: [],
      gridSize: 1
    }))

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
    levels.value = Array.from({ length: INITIAL_LEVELS }, (_, i) => ({
      id: i,
      isStairsExcavated: i === 0,
      leftRooms: createInitialRooms('left', i, i === 0),
      rightRooms: createInitialRooms('right', i, i === 0)
    }))

    // Initialiser le premier niveau avec des salles excavées
    const firstLevel = levels.value[0]
    firstLevel.leftRooms.forEach(room => {
      room.isExcavated = true
    })
    firstLevel.rightRooms.forEach(room => {
      room.isExcavated = true
    })

    // Initialiser les habitants
    habitants.value = Array.from({ length: 5 }, (_, i) => {
      const { nom, genre, age } = generateRandomName()
      return {
        id: `habitant-${i}`,
        nom,
        genre,
        age,
        affectation: { type: null },
        competences: generateRandomCompetences()
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
    
    const cereales: Item = {
      id: `cereales-${Date.now()}-1`,
      type: 'cereales',
      quantity: 500,
      stackSize: ITEMS_CONFIG['cereales'].stackSize,
      description: ITEMS_CONFIG['cereales'].description,
      category: ITEMS_CONFIG['cereales'].category
    }
    
    const barilsVides: Item = {
      id: `baril-vide-${Date.now()}-1`,
      type: 'baril-vide',
      quantity: 0,
      stackSize: ITEMS_CONFIG['baril-vide'].stackSize,
      description: ITEMS_CONFIG['baril-vide'].description,
      category: ITEMS_CONFIG['baril-vide'].category
    }
    
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
        quantity: 50,
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
    inventory.value.push(embryons, barilsPetrole, nourritureConserve, barilsVides, cereales, ...lingotsInitiaux, ...mineraisInitiaux)

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
      vetements: population.value * 0.05,
      medicaments: 0
    }

    // Appliquer les consommations de base
    Object.entries(baseConsumptions).forEach(([resource, amount]) => {
      resources.value[resource as ResourceKey].consumption = amount
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
        resources.value.energie.consumption += config.energyConsumption * gridSize

        // 2.2 Ajouter la consommation d'eau des serres
        if (room.type === 'serre') {
          const waterConsumption = (config as ProductionRoomConfig).waterConsumption || 0
          resources.value.eau.consumption += waterConsumption * gridSize
        }

        // 2.3 Gérer la production des salles
        if ('productionPerWorker' in config) {
          const nbWorkers = room.occupants.length

          // Gestion spéciale pour le générateur
          if (room.type === 'generateur') {
            // Initialiser le niveau de carburant s'il n'existe pas
            if (room.fuelLevel === undefined) {
              room.fuelLevel = 0
            }

            // Si le réservoir est vide, essayer de le remplir
            if (room.fuelLevel <= 0) {
              const barilPetrole = inventory.value.find(item => item.type === 'baril-petrole' && item.quantity > 0)
              if (barilPetrole) {
                console.log('Consommation d\'un baril de pétrole')
                const success = removeItem(barilPetrole.id, 1)
                if (success) {
                  console.log('Baril de pétrole retiré, création d\'un baril vide')
                  const addSuccess = addItem('baril-vide', 1)
                  console.log('Création du baril vide:', addSuccess ? 'réussie' : 'échouée')
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
                  if (amount && resource in resources.value) {
                    resources.value[resource as ResourceKey].production += amount * nbWorkers * gridSize * mergeMultiplier
                  }
                })
                room.fuelLevel -= fuelNeeded
              } else {
                // Pas assez de carburant, production réduite
                const ratio = room.fuelLevel / fuelNeeded
                Object.entries(config.productionPerWorker).forEach(([resource, amount]) => {
                  if (amount && resource in resources.value) {
                    resources.value[resource as ResourceKey].production += amount * nbWorkers * gridSize * mergeMultiplier * ratio
                  }
                })
                room.fuelLevel = 0
              }
            }
          } else if (room.type === 'derrick' && room.occupants.length > 0) {
            // Initialiser le niveau de carburant s'il n'existe pas
            if (room.fuelLevel === undefined) {
              room.fuelLevel = 0
            }

            // Augmenter le fuelLevel
            room.fuelLevel = Math.min(100, room.fuelLevel + (10 * nbWorkers * weeksElapsed))

            // Si le fuelLevel est à 100%, essayer de produire un baril de pétrole
            if (room.fuelLevel >= 100) {
              // Chercher un baril vide
              const barilVide = inventory.value.find(item => item.type === 'baril-vide' && item.quantity > 0)
              if (barilVide) {
                // Retirer le baril vide et ajouter un baril de pétrole
                const success = removeItem(barilVide.id, 1)
                if (success) {
                  addItem('baril-petrole', 1)
                  room.fuelLevel = 0 // Réinitialiser le fuelLevel
                }
              }
            }
          } else {
            // Production normale pour les autres salles
            Object.entries(config.productionPerWorker).forEach(([resource, amount]) => {
              if (amount && resource in resources.value) {
                resources.value[resource as ResourceKey].production += amount * nbWorkers * gridSize * mergeMultiplier
              }
            })
          }
        }

        // 2.4 Gérer les capacités de stockage
        if ('capacityPerWorker' in config) {
          const nbWorkers = room.occupants.length
          Object.entries(config.capacityPerWorker).forEach(([resource, amount]) => {
            if (amount && resource in resources.value) {
              resources.value[resource as ResourceKey].capacity += amount * nbWorkers * gridSize * mergeMultiplier
            }
          })
        }

        // Gestion spéciale de la raffinerie
        if (room.type === 'raffinerie' && room.occupants.length > 0) {
          const nbWorkers = room.occupants.length
          const gridSize = room.gridSize || 1
          const mergeMultiplier = mergeConfig?.useMultiplier 
            ? GAME_CONFIG.MERGE_MULTIPLIERS[Math.min(gridSize, 6) as keyof typeof GAME_CONFIG.MERGE_MULTIPLIERS] || 1
            : 1

          // Calculer le nombre total de minerais pouvant être traités
          const totalProcessingCapacity = (config as any).mineralsProcessingPerWorker * nbWorkers * gridSize * mergeMultiplier

          // Trouver les prochains minerais à traiter
          const conversionRules = (config as any).conversionRules
          let remainingCapacity = totalProcessingCapacity

          // Réinitialiser les prochains minerais à traiter
          room.nextMineralsToProcess = {
            input: [],
            output: { type: 'lingot-fer', amount: 0 } // Valeur par défaut, sera mise à jour
          }

          // Vérifier chaque règle de conversion
          for (const [inputType, rule] of Object.entries(conversionRules)) {
            if (remainingCapacity <= 0) break

            const inputItem = inventory.value.find(item => item.type === inputType && item.quantity > 0)
            if (!inputItem) continue

            if (rule.requires) {
              // Cas spécial pour l'acier qui nécessite du fer et du charbon
              const canProcess = Object.entries(rule.requires).every(([reqType, reqAmount]) => {
                const reqItem = inventory.value.find(item => item.type === reqType && item.quantity >= reqAmount)
                return reqItem !== undefined
              })

              if (canProcess) {
                const maxPossible = Math.min(
                  remainingCapacity,
                  inputItem.quantity,
                  ...Object.entries(rule.requires).map(([reqType, reqAmount]) => {
                    const reqItem = inventory.value.find(item => item.type === reqType)
                    return reqItem ? Math.floor(reqItem.quantity / reqAmount) : 0
                  })
                )

                if (maxPossible > 0) {
                  room.nextMineralsToProcess = {
                    input: [
                      { type: inputType as ItemType, amount: maxPossible },
                      ...Object.entries(rule.requires).map(([reqType, reqAmount]) => ({
                        type: reqType as ItemType,
                        amount: maxPossible * reqAmount
                      }))
                    ],
                    output: {
                      type: rule.output,
                      amount: Math.floor(maxPossible * rule.ratio)
                    }
                  }
                  remainingCapacity -= maxPossible
                }
              }
            } else {
              // Cas simple de conversion 1:1
              const maxPossible = Math.min(remainingCapacity, inputItem.quantity)
              if (maxPossible > 0) {
                room.nextMineralsToProcess = {
                  input: [{ type: inputType as ItemType, amount: maxPossible }],
                  output: {
                    type: rule.output,
                    amount: Math.floor(maxPossible * rule.ratio)
                  }
                }
                remainingCapacity -= maxPossible
              }
            }
          }
        }
      })
    })
  }

  function updateResources(weeksElapsed: number) {
    // Mettre à jour les productions et consommations
    updateRoomProduction(weeksElapsed)

    // Appliquer les changements pour chaque semaine écoulée
    for (let i = 0; i < weeksElapsed; i++) {
      Object.entries(resources.value).forEach(([key, resource]) => {
        const net = resource.production - resource.consumption
        const newAmount = Math.max(0, Math.min(resource.amount + net, resource.capacity))
        resources.value[key as ResourceKey].amount = newAmount
      })
    }
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

        updateHappiness()

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

              // Si la conversion actuelle n'est pas possible, chercher une autre conversion faisable
              if (!canProcess) {
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

  function updateHappiness() {
    const resourcesStatus = Object.values(resources.value).map(resource => {
      if (resource.consumption === 0) return 100;
      return Math.min(100, (resource.production / resource.consumption) * 100);
    });

    happiness.value = Math.floor((resourcesStatus.reduce((a: number, b: number) => a + b, 0) / resourcesStatus.length));
  }

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
    localStorage.removeItem('abriGameState')
    initGame()
  }

  function affecterHabitant(habitantId: string, affectation: Habitant['affectation']) {
    const habitant = habitants.value.find(h => h.id === habitantId)
    if (habitant) {
      habitant.affectation = affectation
    }
  }

  function libererHabitant(habitantId: string) {
    const habitant = habitants.value.find(h => h.id === habitantId)
    if (habitant) {
      habitant.affectation = { type: null }
    }
  }

  // Configuration des équipements disponibles par type de salle
  const EQUIPMENT_CONFIG: { [key: string]: { [key: string]: { constructionTime: number, description: string, incubationTime?: number } } } = {
    infirmerie: {
      nurserie: {
        constructionTime: 2, // 2 semaines pour construire
        description: "Permet de créer de nouveaux habitants. Les enfants de moins de 7 ans ne peuvent pas travailler.",
        incubationTime: 36 // 9 mois = 36 semaines
      }
    }
  }

  function affecterHabitantSalle(habitantId: string, levelId: number, position: 'left' | 'right', roomIndex: number): boolean {
    const habitant = habitants.value.find(h => h.id === habitantId)
    if (!habitant) return false

    // Vérifier l'âge minimum
    if (habitant.age < 7) return false

    const level = levels.value.find(l => l.id === levelId)
    if (!level) return false

    const room = position === 'left' ? level.leftRooms[roomIndex] : level.rightRooms[roomIndex]
    if (!room || !room.isBuilt) return false

    const config = ROOM_CONFIGS[room.type]
    if (!config) return false

    // Vérifier si la salle n'est pas déjà pleine
    if (room.occupants.length >= (config.maxWorkers || 0)) return false

    // Si l'habitant était déjà dans une salle, le retirer
    if (habitant.affectation.type === 'salle') {
      const oldLevel = levels.value.find(l => l.id === habitant.affectation.levelId)
      if (oldLevel) {
        const oldRoom = habitant.affectation.position === 'left' 
          ? oldLevel.leftRooms[habitant.affectation.roomIndex!]
          : oldLevel.rightRooms[habitant.affectation.roomIndex!]
        if (oldRoom) {
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

    updateRoomProduction() // Utiliser la nouvelle fonction
    return true
  }

  function retirerHabitantSalle(habitantId: string): boolean {
    const habitant = habitants.value.find(h => h.id === habitantId)
    if (!habitant || habitant.affectation.type !== 'salle') return false

    const level = levels.value.find(l => l.id === habitant.affectation.levelId)
    if (!level) return false

    const room = habitant.affectation.position === 'left'
      ? level.leftRooms[habitant.affectation.roomIndex!]
      : level.rightRooms[habitant.affectation.roomIndex!]
    if (!room) return false

    room.occupants = room.occupants.filter(id => id !== habitantId)
    habitant.affectation = { type: null }

    updateRoomProduction() // Utiliser la nouvelle fonction
    return true
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

  // Vérifier et fusionner les salles adjacentes du même type
  function checkAndMergeRooms(level: Level, room: Room) {
    if (!room.isBuilt) return false

    const rooms = room.position === 'left' ? level.leftRooms : level.rightRooms
    const prevRoom = rooms[room.index - 1]
    const nextRoom = rooms[room.index + 1]

    // Vérifier si on peut fusionner avec la salle précédente
    if (prevRoom?.isBuilt && prevRoom.type === room.type && !prevRoom.isUnderConstruction) {
      // Vérifier que la fusion ne dépassera pas 5 cellules
      const newSize = (prevRoom.gridSize || 1) + (room.gridSize || 1)
      if (newSize <= 5) {
        // Fusionner avec la salle précédente
        prevRoom.gridSize = newSize
        
        // Déplacer les occupants
        room.occupants.forEach(id => {
          if (!prevRoom.occupants.includes(id)) {
            prevRoom.occupants.push(id)
            const habitant = habitants.value.find(h => h.id === id)
            if (habitant) {
              habitant.affectation = {
                type: 'salle',
                levelId: level.id,
                position: prevRoom.position,
                roomIndex: prevRoom.index
              }
            }
          }
        })

        // Supprimer la salle fusionnée et réorganiser les indices
        rooms.splice(room.index, 1)
        for (let i = room.index; i < rooms.length; i++) {
          rooms[i].index = i
        }

        updateRoomProduction()
        return true
      }
    }
    // Vérifier si on peut fusionner avec la salle suivante
    else if (nextRoom?.isBuilt && nextRoom.type === room.type && !nextRoom.isUnderConstruction) {
      // Vérifier que la fusion ne dépassera pas 5 cellules
      const newSize = (room.gridSize || 1) + (nextRoom.gridSize || 1)
      if (newSize <= 5) {
        // Fusionner avec la salle suivante
        room.gridSize = newSize
        
        // Déplacer les occupants
        nextRoom.occupants.forEach(id => {
          if (!room.occupants.includes(id)) {
            room.occupants.push(id)
            const habitant = habitants.value.find(h => h.id === id)
            if (habitant) {
              habitant.affectation = {
                type: 'salle',
                levelId: level.id,
                position: room.position,
                roomIndex: room.index
              }
            }
          }
        })

        // Supprimer la salle fusionnée et réorganiser les indices
        rooms.splice(nextRoom.index, 1)
        for (let i = nextRoom.index - 1; i < rooms.length; i++) {
          rooms[i].index = i
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

    // Vérifier si la nurserie est construite et opérationnelle
    const nurserie = room.equipments.find(e => e.type === 'nurserie' && !e.isUnderConstruction)
    if (!nurserie) return false

    // Vérifier si la nurserie n'est pas déjà en train d'incuber
    if (nurserie.nurserieState?.isIncubating) return false

    // Vérifier s'il y a des embryons disponibles
    const embryonsDisponibles = getItemQuantity(embryonType)
    if (embryonsDisponibles <= 0) return false

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
                    affectation: { type: null },
                    competences: generateRandomCompetences()
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
    console.log('Tentative d\'ajout d\'item:', type, quantity);
    console.log('Espace d\'inventaire:', inventorySpace.value);

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
        console.log('Stack existant trouvé:', existingItem);
        const spaceInStack = existingItem.stackSize - existingItem.quantity;
        const toAdd = Math.min(remainingQuantity, spaceInStack);
        existingItem.quantity += toAdd;
        remainingQuantity -= toAdd;
        console.log('Ajouté au stack existant:', toAdd);
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
        console.log('Nouveau stack créé:', newItem);
      }
    }

    saveGame();
    return true;
  }

  function removeItem(itemId: string, quantity: number = 1): boolean {
    const itemIndex = inventory.value.findIndex(item => item.id === itemId)
    if (itemIndex === -1) return false

    const item = inventory.value[itemIndex]
    if (item.quantity < quantity) return false

    item.quantity -= quantity
    if (item.quantity === 0) {
      inventory.value.splice(itemIndex, 1)
    }

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
    loadState
  }
}) 