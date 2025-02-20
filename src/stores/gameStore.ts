import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { handleRoomProduction } from '../services/productionService'
import { 
  ROOMS_CONFIG,
  ROOM_CATEGORIES,
  ROOM_MERGE_CONFIG,
  ROOM_CONSTRUCTION_COSTS,
  type RoomConfig,
  type ResourceKey,
  type StorageTankConfig,
  type StorageRoomConfig,
  type DortoryRoomConfig,
  type ProductionRoomConfig,
  type RoomConfigBase
} from '../config/roomsConfig'
import {
  GAME_CONFIG,
  HAPPINESS_CONFIG,
  DEATH_CONFIG
} from '../config/gameConfig'
import {
  type ItemType,
  type ItemConfig,
  type ItemCategory,
  type FoodItemConfig,
  type ResourceItemConfig,
  type BiologicalItemConfig,
  type ContainerItemConfig,
  ITEMS_CONFIG
} from '../config/itemsConfig'
import { effectuerTest, type CompetenceTest } from '../services/competenceTestService'
import { ROOM_TYPES } from '../config/roomsConfig'
import { calculateProductionBonus } from '../services/competenceTestService'

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

export interface Resources {
  energie: Resource
  eau: Resource
  nourriture: Resource
  vetements: Resource
  medicaments: Resource
}

export interface ExcavationProgress {
  startTime: number
  duration: number
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
  age: number
  sante: number
  affectation: Affectation
  competences: Competences
  experience: { [key in keyof Competences]: number }
  bonheur: number
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
  gridSize?: number
  stairsPosition?: 'left' | 'right'
  equipments: Equipment[]
  fuelLevel?: number
  isDisabled?: boolean
  isManuallyDisabled?: boolean  // Nouvelle propriété
  nextMineralsToProcess?: {
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

export interface MineralFound {
  type: ItemType
  amount: number
}

export interface Excavation {
  levelId: number
  position: 'left' | 'right' | 'stairs'
  roomIndex?: number
  startTime: number
  habitantId: string
  duration: number
  mineralsFound?: MineralFound[]
}

export const INITIAL_LEVELS = GAME_CONFIG.INITIAL_LEVELS
export const ROOMS_PER_SIDE = GAME_CONFIG.ROOMS_PER_SIDE
export const BASE_EXCAVATION_TIME = GAME_CONFIG.BASE_EXCAVATION_TIME
export const DEPTH_TIME_MULTIPLIER = GAME_CONFIG.DEPTH_TIME_MULTIPLIER

// Ratio de conversion pour le stockage d'eau (2 unités d'eau par % de niveau)
export const WATER_TANK_RATIO = 2

// Configuration des minerais par niveau
export const MINERAL_DISTRIBUTION: { [key: number]: {
  [key in ItemType]?: {
    chance: number
    amount: { min: number, max: number }
  }
}} = {
  0: { // Premier niveau
    'minerai-fer': { chance: 0.6, amount: { min: 10, max: 30 } },
    'minerai-charbon': { chance: 0.5, amount: { min: 10, max: 25 } },
    'minerai-calcaire': { chance: 0.7, amount: { min: 15, max: 35 } },
    'minerai-cuivre': { chance: 0.2, amount: { min: 5, max: 15 } },
    'minerai-silicium': { chance: 0.1, amount: { min: 2, max: 10 } },
    'minerai-or': { chance: 0.05, amount: { min: 1, max: 5 } }
  },
  1: { // Deuxième niveau
    'minerai-fer': { chance: 0.7, amount: { min: 15, max: 35 } },
    'minerai-charbon': { chance: 0.6, amount: { min: 12, max: 30 } },
    'minerai-calcaire': { chance: 0.8, amount: { min: 20, max: 40 } },
    'minerai-cuivre': { chance: 0.3, amount: { min: 8, max: 20 } },
    'minerai-silicium': { chance: 0.15, amount: { min: 3, max: 12 } },
    'minerai-or': { chance: 0.08, amount: { min: 2, max: 7 } }
  },
  2: { // Troisième niveau
    'minerai-fer': { chance: 0.8, amount: { min: 20, max: 40 } },
    'minerai-charbon': { chance: 0.7, amount: { min: 15, max: 35 } },
    'minerai-calcaire': { chance: 0.9, amount: { min: 25, max: 45 } },
    'minerai-cuivre': { chance: 0.4, amount: { min: 10, max: 25 } },
    'minerai-silicium': { chance: 0.2, amount: { min: 5, max: 15 } },
    'minerai-or': { chance: 0.1, amount: { min: 3, max: 10 } }
  },
  3: { // Quatrième niveau
    'minerai-fer': { chance: 0.9, amount: { min: 25, max: 45 } },
    'minerai-charbon': { chance: 0.8, amount: { min: 20, max: 40 } },
    'minerai-calcaire': { chance: 1.0, amount: { min: 30, max: 50 } },
    'minerai-cuivre': { chance: 0.5, amount: { min: 15, max: 30 } },
    'minerai-silicium': { chance: 0.3, amount: { min: 8, max: 20 } },
    'minerai-or': { chance: 0.15, amount: { min: 5, max: 15 } }
  },
  4: { // Cinquième niveau et plus
    'minerai-fer': { chance: 1.0, amount: { min: 30, max: 50 } },
    'minerai-charbon': { chance: 0.9, amount: { min: 25, max: 45 } },
    'minerai-calcaire': { chance: 1.0, amount: { min: 35, max: 55 } },
    'minerai-cuivre': { chance: 0.6, amount: { min: 20, max: 35 } },
    'minerai-silicium': { chance: 0.4, amount: { min: 10, max: 25 } },
    'minerai-or': { chance: 0.2, amount: { min: 8, max: 20 } }
  }
} as const

export const useGameStore = defineStore('game', () => {
  // Utilitaires pour la génération de personnages
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

  // État du jeu
  const resources = ref<Resources>({
    energie: { amount: 100, capacity: 200, production: 15, consumption: 0 },
    eau: { amount: 200, capacity: 400, production: 0, consumption: 0 },
    nourriture: { amount: 200, capacity: 400, production: 0, consumption: 0 },
    vetements: { amount: 50, capacity: 100, production: 0, consumption: 0 },
    medicaments: { amount: 50, capacity: 100, production: 0, consumption: 0 }
  })
  const levels = ref<Level[]>([])
  const gameTime = ref(0)
  const population = ref(0)
  const happiness = ref(100)
  const lastUpdateTime = ref(Date.now())
  const excavations = ref<ExcavationProgress[]>([])
  const habitants = ref<Habitant[]>([])
  const inventory = ref<Item[]>([])
  const inventoryCapacity = ref(1000)
  const gameSpeed = ref(1)
  const isPaused = ref(false)
  const showDeathModal = ref(false)
  const deceasedHabitant = ref<Habitant | null>(null)
  const competenceTests = ref<CompetenceTest[]>([])

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
    const days = Math.floor((weeks % 1) * 7)
    
    return {
      years,
      months,
      weeks: lastWeeks,
      days
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
      isExcavated: isFirstLevel, // Les salles sont excavées si c'est un niveau initial
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
            if (room) { // Vérifier que la salle existe
              room.type = roomConfig.type
              room.isBuilt = true // Seules les salles configurées sont construites instantanément
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
    const elapsedTime = gameTime.value - excavation.startTime
    return Math.round(Math.max(0, excavation.duration - elapsedTime))
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
    const remainingWeeks = Math.ceil(Math.max(0, excavation.duration - elapsedTime))
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
        ...generateRandomCompetences(),
        bonheur: 50, // Score de bonheur par défaut
        logement: null
      }
    })

    // Initialiser les ressources avec les nouvelles valeurs
    resources.value = {
      energie: { amount: 100, capacity: 200, production: 15, consumption: 0 },
      eau: { amount: 200, capacity: 400, production: 0, consumption: 0 },
      nourriture: { amount: 200, capacity: 400, production: 0, consumption: 0 },
      vetements: { amount: 50, capacity: 100, production: 0, consumption: 0 },
      medicaments: { amount: 50, capacity: 100, production: 0, consumption: 0 }
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
    // Réinitialiser les productions et consommations
    Object.values(resources.value).forEach(resource => {
      resource.production = 0
      resource.consumption = 0
    })

    // Mettre à jour les productions et consommations
    levels.value.forEach(level => {
      const allRooms = [...level.leftRooms, ...level.rightRooms]
      allRooms.forEach(room => {
        if (room.isBuilt && !room.isDisabled) {
          const config = ROOMS_CONFIG[room.type]
          const nbWorkers = room.occupants.length

          // Calculer le bonus de production basé sur les tests de compétences
          const recentTests = competenceTests.value
            .filter(t => t.habitantId && room.occupants.includes(t.habitantId) && t.salle === room.type)
            .slice(-3) // Prendre les 3 derniers tests par habitant
          
          const productionBonus = calculateProductionBonus(recentTests)

          handleRoomProduction(
            room,
            config,
            nbWorkers,
            resources.value,
            weeksElapsed,
            productionBonus,
            addItem,
            removeItem,
            getItemQuantity,
            habitants.value,
            (test: CompetenceTest) => competenceTests.value.push(test)
          )
        }
      })
    })

    // Limiter le nombre de tests stockés à 100
    if (competenceTests.value.length > 100) {
      competenceTests.value = competenceTests.value.slice(-100)
    }
  }

  function calculateWaterConsumption(): number {
    let totalConsumption = population.value // Consommation de base par habitant

    levels.value.forEach(level => {
      const allRooms = [...level.leftRooms, ...level.rightRooms]
      allRooms.forEach(room => {
        if (room.isBuilt && room.type === 'serre') {
          const gridSize = room.gridSize || 1
          const waterConsumption = 2 * gridSize // 2 unités d'eau par cellule de serre
          totalConsumption += waterConsumption
        }
      })
    })
    
    return totalConsumption
  }

  function calculateWaterProduction(): number {
    let totalProduction = 0
    
    levels.value.forEach(level => {
      const allRooms = [...level.leftRooms, ...level.rightRooms]
      allRooms.forEach(room => {
        if (room.isBuilt && room.type === 'station-traitement' && !room.isDisabled) {
          const config = ROOMS_CONFIG[room.type]
          if (!config || !('productionPerWorker' in config)) return

          const nbWorkers = room.occupants.length
          const gridSize = room.gridSize || 1
          const mergeConfig = ROOM_MERGE_CONFIG[room.type]
          const mergeMultiplier = mergeConfig?.useMultiplier 
            ? GAME_CONFIG.MERGE_MULTIPLIERS[Math.min(gridSize, 6) as keyof typeof GAME_CONFIG.MERGE_MULTIPLIERS] || 1
            : 1

          // Calculer le bonus de production basé sur les tests de compétences
          const recentTests = competenceTests.value
            .filter(t => t.habitantId && room.occupants.includes(t.habitantId) && t.salle === room.type)
            .slice(-3) // Prendre les 3 derniers tests par habitant
          
          const productionBonus = calculateProductionBonus(recentTests)

          const production = config.productionPerWorker.eau! * nbWorkers * gridSize * mergeMultiplier * productionBonus
          if (production > 0) {
            totalProduction += production
          }
        }
      })
    })
    
    return totalProduction
  }

  function calculateEnergyProduction(): number {
    let totalProduction = 0
    
    levels.value.forEach(level => {
      const allRooms = [...level.leftRooms, ...level.rightRooms]
      allRooms.forEach(room => {
        if (room.isBuilt && room.type === 'generateur' && !room.isDisabled) {
          const config = ROOMS_CONFIG[room.type]
          if (!config || !('productionPerWorker' in config)) return

          const nbWorkers = room.occupants.length
          const gridSize = room.gridSize || 1
          const mergeConfig = ROOM_MERGE_CONFIG[room.type]
          const mergeMultiplier = mergeConfig?.useMultiplier 
            ? GAME_CONFIG.MERGE_MULTIPLIERS[Math.min(gridSize, 6) as keyof typeof GAME_CONFIG.MERGE_MULTIPLIERS] || 1
            : 1

          // Calculer le bonus de production basé sur les tests de compétences
          const recentTests = competenceTests.value
            .filter(t => t.habitantId && room.occupants.includes(t.habitantId) && t.salle === room.type)
            .slice(-3) // Prendre les 3 derniers tests par habitant
          
          const productionBonus = calculateProductionBonus(recentTests)

          const production = config.productionPerWorker.energie! * nbWorkers * gridSize * mergeMultiplier * productionBonus
          if (production > 0) {
            totalProduction += production
          }
        }
      })
    })
    
    return totalProduction
  }

  function calculateEnergyConsumption(): number {
    let totalConsumption = population.value * 2 // Consommation de base par habitant (2 unités)

    levels.value.forEach(level => {
      const allRooms = [...level.leftRooms, ...level.rightRooms]
      allRooms.forEach(room => {
        if (room.isBuilt && !room.isDisabled) {  // Vérifier si la salle n'est pas désactivée
          const config = ROOMS_CONFIG[room.type]
          if (!config) return
          
          const gridSize = room.gridSize || 1
          const energyConsumption = config.energyConsumption * gridSize
          totalConsumption += energyConsumption
        }
      })
    })
    
    return totalConsumption
  }

  function updateResources(weeksElapsed: number) {
    // Réinitialiser les productions et consommations
    Object.values(resources.value).forEach(resource => {
      resource.production = 0
      resource.consumption = 0
    })

    // Mettre à jour les productions et consommations
    updateRoomProduction(weeksElapsed)

    // Calculer la consommation de base par habitant
    const nbHabitants = habitants.value.length
    resources.value.nourriture.consumption += nbHabitants * 1 // 1 unité de nourriture par habitant par semaine
    resources.value.vetements.consumption += nbHabitants * 0.1 // 0.1 unité de vêtements par habitant par semaine
    resources.value.medicaments.consumption += nbHabitants * 0.05 // 0.05 unité de médicaments par habitant par semaine

    // Gestion de la nourriture
    const foodConsumption = nbHabitants * weeksElapsed // 1 ration par habitant par semaine
    if (foodConsumption > 0) {
      // Calculer le nombre total de rations disponibles
      let totalRations = 0
      const foodItems = inventory.value.filter(item => item.category === 'nourriture' && item.quantity > 0)
      
      foodItems.forEach(item => {
        const itemConfig = ITEMS_CONFIG[item.type as ItemType]
        if (itemConfig && isFoodItem(itemConfig)) {
          // Une ration nécessite ratio items
          totalRations += Math.floor(item.quantity / itemConfig.ratio)
        }
      })

      // Si on a des rations disponibles, les consommer proportionnellement
      if (totalRations > 0) {
        const rationsToConsume = Math.min(totalRations, foodConsumption)
        resources.value.nourriture.amount = totalRations - rationsToConsume

        // Consommer les items proportionnellement à leur contribution en rations
        foodItems.forEach(item => {
          const itemConfig = ITEMS_CONFIG[item.type as ItemType]
          if (itemConfig && isFoodItem(itemConfig)) {
            const itemRations = Math.floor(item.quantity / itemConfig.ratio)
            const rationProportion = itemRations / totalRations
            const rationsToConsumeFromThisType = Math.floor(rationsToConsume * rationProportion)
            const itemsToConsume = rationsToConsumeFromThisType * itemConfig.ratio
            removeItem(item.type, Math.min(itemsToConsume, item.quantity))
          }
        })
      } else {
        resources.value.nourriture.amount = 0
      }
    }

    // Gestion spéciale de l'eau
    resources.value.eau.capacity = calculateTotalWaterStorage() // Mise à jour de la capacité totale
    resources.value.eau.production = calculateWaterProduction()
    resources.value.eau.consumption = calculateWaterConsumption()
    const waterNet = (resources.value.eau.production - resources.value.eau.consumption) * weeksElapsed

    // Gestion spéciale de l'énergie
    resources.value.energie.production = calculateEnergyProduction()
    resources.value.energie.consumption = calculateEnergyConsumption()
    const energyNet = resources.value.energie.production - resources.value.energie.consumption

    // Si déficit d'énergie, désactiver certaines salles
    if (energyNet < 0) {
      // Ne désactiver que les salles qui ne sont pas déjà désactivées manuellement
      levels.value.forEach(level => {
        const allRooms = [...level.leftRooms, ...level.rightRooms]
        allRooms.forEach(room => {
          if (room.isBuilt && room.type !== 'generateur' && !room.isManuallyDisabled) {
            room.isDisabled = true
          }
        })
      })
    } else {
      // Réactiver uniquement les salles qui n'ont pas été désactivées manuellement
      levels.value.forEach(level => {
        const allRooms = [...level.leftRooms, ...level.rightRooms]
        allRooms.forEach(room => {
          if (!room.isManuallyDisabled) {
            // Ne pas réactiver automatiquement les générateurs sans carburant
            if (room.type === 'generateur') {
              if (room.fuelLevel && room.fuelLevel > 0) {
                room.isDisabled = false
              }
            } else {
              room.isDisabled = false
            }
          }
        })
      })
    }

    // Mettre à jour la quantité d'énergie
    resources.value.energie.amount = Math.max(0, resources.value.energie.amount + (energyNet * weeksElapsed))

    // Appliquer les changements pour chaque ressource
    Object.entries(resources.value).forEach(([key, resource]) => {
      if (key === 'eau') {
        if (waterNet > 0) {
          // Production d'eau : stocker dans les cuves
          const waterToAdd = Math.min(waterNet, 1000) // Limite de sécurité à 1000 unités par mise à jour
          addWater(waterToAdd)
        } else {
          // Consommation d'eau : prendre des cuves
          const tanks = findWaterTanks()
          let remainingConsumption = Math.min(Math.abs(waterNet), 1000) // Limite de sécurité
          
          for (const tank of tanks) {
            if (remainingConsumption <= 0) break
            
            const gridSize = tank.gridSize || 1
            const currentLevel = Math.min(100, Math.max(0, Number(tank.fuelLevel || 0)))
            const waterAvailable = currentLevel * WATER_TANK_RATIO * gridSize
            const waterToTake = Math.min(waterAvailable, remainingConsumption)
            
            if (waterToTake > 0) {
              const newLevel = Math.max(0, currentLevel - (waterToTake / (WATER_TANK_RATIO * gridSize)))
              tank.fuelLevel = Math.min(100, newLevel)
              remainingConsumption -= waterToTake
            }
          }
        }
        
        // Calculer la quantité totale d'eau stockée
        const tanks = findWaterTanks()
        let totalWater = 0
        for (const tank of tanks) {
          const gridSize = tank.gridSize || 1
          const currentLevel = Math.min(100, Math.max(0, Number(tank.fuelLevel || 0)))
          totalWater += currentLevel * WATER_TANK_RATIO * gridSize
        }
        resource.amount = totalWater
      } else if (key === 'energie') {
        // Gestion de l'énergie
        const energyNet = resource.production - resource.consumption
        
        // Si déficit d'énergie, désactiver certaines salles
        if (energyNet < 0) {
          levels.value.forEach(level => {
            const allRooms = [...level.leftRooms, ...level.rightRooms]
            allRooms.forEach(room => {
              if (room.isBuilt && room.type !== 'generateur' && !room.isManuallyDisabled) {
                room.isDisabled = true
              }
            })
          })
        } else {
          // Réactiver uniquement les salles qui n'ont pas été désactivées manuellement
          levels.value.forEach(level => {
            const allRooms = [...level.leftRooms, ...level.rightRooms]
            allRooms.forEach(room => {
              if (!room.isManuallyDisabled) {
                room.isDisabled = false
              }
            })
          })
        }
        
        // Mettre à jour la quantité d'énergie
        resource.amount = Math.max(0, resource.amount + (energyNet * weeksElapsed))
      } else {
        // Autres ressources : gestion standard
        const net = (resource.production - resource.consumption) * weeksElapsed
        resource.amount = Math.max(0, resource.amount + net)
      }
    })
  }

  function update(speed: number) {
    // Ne pas mettre à jour si le jeu est en pause
    if (isPaused.value) {
      lastUpdateTime.value = Date.now()
      return
    }

    const currentTime = Date.now()
    const deltaTime = currentTime - lastUpdateTime.value
    lastUpdateTime.value = currentTime
    
    // Mettre à jour le temps de jeu
    const weekIncrease = (deltaTime / 1000) * speed
    gameTime.value += weekIncrease
    
    // Calculer le nombre de semaines écoulées
    const previousWeek = Math.floor(gameTime.value - weekIncrease)
    const currentWeek = Math.floor(gameTime.value)
    const elapsedWeeks = currentWeek - previousWeek
    
    // Si une semaine s'est écoulée
    if (elapsedWeeks > 0) {
      // Mettre à jour les excavations
      excavations.value = excavations.value.filter(excavation => {
        const elapsed = Math.floor(gameTime.value) - excavation.startTime
        if (elapsed >= excavation.duration) {
          // L'excavation est terminée
          const level = levels.value.find(l => l.id === excavation.levelId)
          if (level) {
            if (excavation.position === 'stairs') {
              level.isStairsExcavated = true
            } else {
              const rooms = excavation.position === 'left' ? level.leftRooms : level.rightRooms
              const room = rooms[excavation.roomIndex!]
              if (room) {
                room.isExcavated = true
              }
            }
            // Libérer l'habitant
            const habitant = habitants.value.find(h => h.id === excavation.habitantId)
            if (habitant) {
              habitant.affectation = { type: null }
            }

            // Notifier les minerais trouvés
            if (excavation.mineralsFound && excavation.mineralsFound.length > 0) {
              const mineraisMessage = excavation.mineralsFound
                .map(mineral => `${mineral.amount} ${ITEMS_CONFIG[mineral.type].name}`)
                .join(', ')
              
              window.dispatchEvent(new CustomEvent('excavation-complete', {
                detail: {
                  title: 'Minerais découverts',
                  message: `L'excavation a permis de découvrir : ${mineraisMessage}`,
                  type: 'success'
                }
              }))
            }

            // Notifier la fin de l'excavation
            window.dispatchEvent(new CustomEvent('excavation-complete', {
              detail: {
                title: 'Excavation terminée',
                message: excavation.position === 'stairs' 
                  ? `Les escaliers du niveau ${excavation.levelId + 1} sont excavés.`
                  : `Une nouvelle salle est excavée au niveau ${excavation.levelId + 1}.`,
                type: 'success'
              }
            }))
            return false // Retirer l'excavation de la liste
          }
        }
        return true // Garder l'excavation dans la liste
      })

      // Mettre à jour les constructions
      levels.value.forEach(level => {
        const allRooms = [...level.leftRooms, ...level.rightRooms]
        allRooms.forEach(room => {
          if (room.isUnderConstruction && room.constructionStartTime !== undefined && room.constructionDuration !== undefined) {
            const elapsed = Math.floor(gameTime.value) - room.constructionStartTime
            if (elapsed >= room.constructionDuration) {
              room.isUnderConstruction = false
              room.isBuilt = true
              // Libérer l'habitant
              const habitant = habitants.value.find(h => 
                h.affectation.type === 'construction' && 
                h.affectation.levelId === level.id &&
                h.affectation.position === room.position &&
                h.affectation.roomIndex === room.index
              )
              if (habitant) {
                habitant.affectation = { type: null }
              }
              // Vérifier si on peut fusionner la salle
              checkAndMergeRooms(level, room)
              // Notifier la fin de la construction
              window.dispatchEvent(new CustomEvent('excavation-complete', {
                detail: {
                  title: 'Construction terminée',
                  message: `Une nouvelle salle de type ${room.type} est construite au niveau ${level.id + 1}.`,
                  type: 'success'
                }
              }))
            }
          }

          // Vérifier la construction des équipements
          room.equipments.forEach(equipment => {
            if (equipment.isUnderConstruction && equipment.constructionStartTime !== undefined && equipment.constructionDuration !== undefined) {
              const elapsed = Math.floor(gameTime.value) - equipment.constructionStartTime
              if (elapsed >= equipment.constructionDuration) {
                equipment.isUnderConstruction = false
                // Initialiser l'état de la nurserie si c'est une nurserie
                if (equipment.type === 'nurserie') {
                  equipment.nurserieState = {
                    isIncubating: false
                  }
                }
                // Notifier la fin de la construction
                window.dispatchEvent(new CustomEvent('excavation-complete', {
                  detail: {
                    title: 'Équipement installé',
                    message: `Un nouvel équipement (${equipment.type}) est opérationnel dans la salle de type ${room.type} au niveau ${level.id + 1}.`,
                    type: 'success'
                  }
                }))
              }
            }
          })
        })
      })

      // Mettre à jour les ressources
      updateRoomProduction(elapsedWeeks)
      updateResources(elapsedWeeks)
      
      // Mettre à jour l'âge des habitants
      habitants.value.forEach(habitant => {
        habitant.age += elapsedWeeks
      })
      
      // Vérifier les incubations
      checkAndFinalizeIncubation()
      
      // Vérifier la mortalité
      checkMortality()
      
      // Optimiser les stacks à la fin de chaque semaine
      optimizeStacks()
      
      // Sauvegarder l'état du jeu
      saveGame()
    }
  }

  // Ajout de la fonction de calcul du bonheur
  function calculateHappiness(habitantId: string): number {
    let score: number = HAPPINESS_CONFIG.DEFAULT
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

    // Gestion du logement
    if (habitant.logement) {
      const room = getRoomById(habitant.logement.levelId, habitant.logement.position, habitant.logement.roomIndex)
      if (room) {
        let bonheurMax = HAPPINESS_CONFIG.DEFAULT
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
        score = Math.min(score, bonheurMax)
      }
    } else {
      // Pénalité pour absence de logement
      score = Math.min(score, HAPPINESS_CONFIG.SANS_LOGEMENT)
    }

    // Limiter le score entre 0 et le plafond de bonheur maximal
    return Math.max(0, Math.min(score, HAPPINESS_CONFIG.SUITE))
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
        // Vérifier si un habitant libre est disponible
        const habitantLibre = habitants.value.find(h => h.affectation.type === null)
        
        // Si l'habitant est un enfant, afficher un message d'erreur
        if (habitantLibre && isEnfant(habitantLibre.age)) {
          window.dispatchEvent(new CustomEvent('excavation-complete', {
            detail: {
              title: 'Excavation impossible',
              message: 'Les enfants de moins de 7 ans ne peuvent pas excaver d\'escaliers.',
              type: 'error'
            }
          }))
          return false
        }
        
        // Trouver un habitant libre qui a plus de 7 ans
        const habitantAdulte = habitants.value.find(h => h.affectation.type === null && h.age >= 7 * 52)
        if (habitantAdulte) {
          // Affecter l'habitant à l'excavation
          affecterHabitant(habitantAdulte.id, {
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
                    config.amount.min * 3,
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
            habitantId: habitantAdulte.id,
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
        // Vérifier si un habitant libre est disponible
        const habitantLibre = habitants.value.find(h => h.affectation.type === null)
        
        // Si l'habitant est un enfant, afficher un message d'erreur
        if (habitantLibre && isEnfant(habitantLibre.age)) {
          window.dispatchEvent(new CustomEvent('excavation-complete', {
            detail: {
              title: 'Excavation impossible',
              message: 'Les enfants de moins de 7 ans ne peuvent pas excaver de salles.',
              type: 'error'
            }
          }))
          return false
        }
        
        // Trouver un habitant libre qui a plus de 7 ans
        const habitantAdulte = habitants.value.find(h => h.affectation.type === null && h.age >= 7 * 52)
        if (habitantAdulte) {
          // Affecter l'habitant à l'excavation
          affecterHabitant(habitantAdulte.id, {
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
                    config.amount.min * 3,
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
            position,
            roomIndex,
            startTime: gameTime.value,
            habitantId: habitantAdulte.id,
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
            if (amount !== undefined) {
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
          }

          // Consommer les ressources
          for (const [resource, amount] of Object.entries(constructionCosts)) {
            if (amount !== undefined) {
              const item = inventory.value.find(item => item.type === resource && item.quantity >= amount)
              if (item) {
                removeItem(item.id, amount)
              }
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
            room.fuelLevel = 0 // Changé de 100 à 0 pour que le générateur démarre vide
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
    // Réinitialiser tous les états du jeu
    this.habitants = []
    this.levels = initializeLevels()
    this.inventory = initializeInventory()
    this.gameSpeed = 1
    this.isPaused = false
    this.showDeathModal = false
    this.deceasedHabitant = null
    this.competenceTests = []
    
    // Ajouter les premiers habitants
    this.addInitialHabitants()
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

    const config = ROOMS_CONFIG[room.type]
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
        const oldLevel = levels.value.find(l => l.id === habitant.logement?.levelId)
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

        // Désactiver la salle si elle n'a plus de travailleurs
        if (targetRoom.occupants.length === 0) {
          targetRoom.isDisabled = true
          targetRoom.isManuallyDisabled = true
        }

        updateRoomProduction()
        return true
      }
    }

    return false
  }

  function toggleRoomDisabled(levelId: number, position: 'left' | 'right', roomIndex: number) {
    const room = getRoomById(levelId, position, roomIndex)
    if (!room) {
      console.error('Store: Salle non trouvée')
      return
    }
    
    // Inverser l'état de désactivation manuelle
    room.isManuallyDisabled = !room.isManuallyDisabled
    
    // Si on active manuellement la salle, vérifier si on a assez d'énergie
    if (!room.isManuallyDisabled) {
      const energyNet = resources.value.energie.production - resources.value.energie.consumption
      room.isDisabled = energyNet < 0 && room.type !== 'generateur'
    } else {
      // Si on désactive manuellement, la salle est toujours désactivée
      room.isDisabled = true
    }
    
    updateRoomProduction()
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
                    ...generateRandomCompetences(),
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

    // Si c'est de la nourriture, vérifier la capacité des chambres froides
    if (config.category === 'nourriture') {
      const currentFoodStacks = inventory.value
        .filter(item => item.category === 'nourriture')
        .length
      
      const maxFoodStacks = calculateTotalFoodStorage()
      
      // Si on n'a plus de place dans les chambres froides, on ne peut pas ajouter de nourriture
      if (currentFoodStacks >= maxFoodStacks) {
        return false
      }
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
        // Pour la nourriture, vérifier si on peut créer un nouveau stack
        if (config.category === 'nourriture') {
          const currentFoodStacks = inventory.value
            .filter(item => item.category === 'nourriture')
            .length
          
          const maxFoodStacks = calculateTotalFoodStorage()
          
          if (currentFoodStacks >= maxFoodStacks) {
            break // On ne peut plus créer de nouveaux stacks
          }
        }

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
    return remainingQuantity === 0; // Retourne true seulement si tout a été stocké
  }

  function removeItem(type: ItemType | string, quantity: number = 1): boolean {

    // Trouver tous les items correspondants (par ID ou par type) et retirer les stacks vides
    const matchingItems = inventory.value.filter(item => 
      (item.id === type || item.type === type) && item.quantity > 0
    ).sort((a, b) => b.quantity - a.quantity) // Trier par quantité décroissante

    if (matchingItems.length === 0) {
      console.log('Item non trouvé:', type)
      return false
    }

    // Calculer la quantité totale disponible
    const totalAvailable = matchingItems.reduce((sum, item) => sum + item.quantity, 0)
    if (totalAvailable < quantity) {
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

  function getItemQuantity(type: ItemType | string): number {
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

    const config = ROOMS_CONFIG[room.type]
    if (!config) return false

    room.stairsPosition = position
    return true
  }

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
    return tanks
  }

  function addWater(amount: number): number {
    const tanks = findWaterTanks()
    if (tanks.length === 0) {
        console.log('Pas de cuve disponible pour stocker l\'eau')
        return 0
    }

    let remainingWater = amount
    let totalAdded = 0

    // Continuer tant qu'il reste de l'eau à ajouter et qu'au moins une cuve n'est pas pleine
    while (remainingWater > 0) {
        // Trouver la cuve la moins remplie en tenant compte de la taille
        const leastFilledTank = tanks.reduce((min, tank) => {
            const tankGridSize = tank.gridSize || 1
            const minGridSize = min.gridSize || 1
            const tankLevel = (Number(tank.fuelLevel) || 0) / tankGridSize
            const minLevel = (Number(min.fuelLevel) || 0) / minGridSize
            return tankLevel < minLevel ? tank : min
        }, tanks[0])

        const tankGridSize = leastFilledTank.gridSize || 1
        const currentLevel = Number(leastFilledTank.fuelLevel || 0)
        const maxLevel = 100 * tankGridSize // Le niveau max est multiplié par la taille
        
        if (currentLevel >= maxLevel) {
            break // Cette cuve est pleine
        }

        const spaceLeft = maxLevel - currentLevel
        // Le ratio d'eau est multiplié par la taille de la cuve
        const waterToAdd = Math.min(remainingWater, spaceLeft * (WATER_TANK_RATIO / tankGridSize))

        if (waterToAdd > 0) {
            const newLevel = Math.min(maxLevel, currentLevel + (waterToAdd / WATER_TANK_RATIO * tankGridSize))
            leastFilledTank.fuelLevel = newLevel
            remainingWater -= waterToAdd
            totalAdded += waterToAdd
        } else {
            break
        }
    }

    return totalAdded
  }

  function removeWater(amount: number): number {
    const tanks = findWaterTanks()
    if (tanks.length === 0) return 0 // Pas de cuve disponible

    // Trouver la cuve la plus remplie
    const mostFilledTank = tanks.reduce((max, tank) => 
      (Number(tank.fuelLevel) || 0) > (Number(max.fuelLevel) || 0) ? tank : max
    , tanks[0])

    // S'assurer que le niveau actuel est un nombre valide entre 0 et 100
    const currentLevel = Math.min(100, Math.max(0, Number(mostFilledTank.fuelLevel || 0)))
    // Calculer l'eau disponible (2 unités d'eau par % de niveau)
    const waterAvailable = Math.min(200, currentLevel * WATER_TANK_RATIO) // Maximum 200 unités par cuve
    const waterToRemove = Math.min(amount, waterAvailable)

    if (waterToRemove > 0) {
      // Calculer le nouveau niveau en pourcentage (2 unités d'eau = 1%)
      const newLevel = Math.max(0, currentLevel - (waterToRemove / WATER_TANK_RATIO))
      mostFilledTank.fuelLevel = Math.min(100, newLevel)
      return waterToRemove
    }

    return 0
  }

  function isFoodItem(item: ItemConfig): item is FoodItemConfig {
    return item.category === 'nourriture'
  }

  function calculateFoodQuality(item: Item): number {
    const config = ITEMS_CONFIG[item.type as ItemType]
    if (isFoodItem(config)) {
      return config.qualite
    }
    return 0
  }

  function getFoodRatio(itemType: ItemType): number {
    const itemConfig = ITEMS_CONFIG[itemType]
    return isFoodItem(itemConfig) ? itemConfig.ratio : 1
  }

  // Fonction pour gérer le décès d'un habitant
  function handleHabitantDeath(habitant: Habitant) {
    // Sauvegarder l'habitant décédé pour la modale
    deceasedHabitant.value = { ...habitant }
    showDeathModal.value = true

    // Libérer le logement
    if (habitant.logement) {
      const level = levels.value.find(l => l.id === habitant.logement!.levelId)
      if (level) {
        const room = habitant.logement.position === 'left'
          ? level.leftRooms[habitant.logement.roomIndex]
          : level.rightRooms[habitant.logement.roomIndex]
        if (room) {
          room.occupants = room.occupants.filter(id => id !== habitant.id)
        }
      }
    }

    // Libérer l'affectation
    if (habitant.affectation.type === 'salle') {
      const level = levels.value.find(l => l.id === habitant.affectation.levelId)
      if (level) {
        const room = habitant.affectation.position === 'left'
          ? level.leftRooms[habitant.affectation.roomIndex!]
          : level.rightRooms[habitant.affectation.roomIndex!]
        if (room) {
          room.occupants = room.occupants.filter(id => id !== habitant.id)
          // Désactiver la salle si elle n'a plus de travailleurs
          if (room.occupants.length === 0) {
            room.isDisabled = true
            room.isManuallyDisabled = true
          }
        }
      }
    }

    // Retirer l'habitant de la liste
    habitants.value = habitants.value.filter(h => h.id !== habitant.id)
    population.value--

    // Mettre à jour les productions
    updateRoomProduction()
  }

  // Fonction pour vérifier la mortalité des habitants
  function checkMortality() {
    habitants.value.forEach(habitant => {
      if (habitant.age >= DEATH_CONFIG.AGE_95) {
        if (Math.random() < DEATH_CONFIG.CHANCE_95) {
          handleHabitantDeath(habitant)
        }
      } else if (habitant.age >= DEATH_CONFIG.AGE_85) {
        if (Math.random() < DEATH_CONFIG.CHANCE_85) {
          handleHabitantDeath(habitant)
        }
      } else if (habitant.age >= DEATH_CONFIG.AGE_75) {
        if (Math.random() < DEATH_CONFIG.CHANCE_75) {
          handleHabitantDeath(habitant)
        }
      }
    })
  }

  function isItemType(type: string): type is ItemType {
    return Object.prototype.hasOwnProperty.call(ITEMS_CONFIG, type)
  }

  function optimizeStacks() {
    const newInventory: Item[] = []
    
    // Regrouper les items par type
    const itemsByType = new Map<string, Item[]>()
    inventory.value.forEach(item => {
      const items = itemsByType.get(item.type) || []
      items.push(item)
      itemsByType.set(item.type, items)
    })
    
    // Pour chaque type d'item
    itemsByType.forEach((items, type) => {
      // Trier les items par quantité décroissante
      items.sort((a, b) => b.quantity - a.quantity)
      
      let totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
      const stackSize = items[0].stackSize
      
      // Créer des stacks complets
      while (totalQuantity > 0) {
        const quantity = Math.min(totalQuantity, stackSize)
        newInventory.push({
          ...items[0],
          id: `${type}-${Date.now()}-${Math.random()}`,
          quantity
        })
        totalQuantity -= quantity
      }
    })
    
    // Mettre à jour l'inventaire
    inventory.value = newInventory
  }

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

  function generateRandomCompetences(): { competences: Competences, experience: { [key in keyof Competences]: number } } {
    const competences = ['force', 'dexterite', 'charme', 'relations', 'instinct', 'savoir']
    const points = Array(6).fill(1) // Chaque compétence commence à 1
    let remainingPoints = 13

    // Distribution aléatoire des points restants
    while (remainingPoints > 0) {
      const index = Math.floor(Math.random() * competences.length)
      if (points[index] < 7) { // Maximum de 10 points par compétence
        points[index]++
        remainingPoints--
      }
    }

    return {
      competences: {
        force: points[0],
        dexterite: points[1],
        charme: points[2],
        relations: points[3],
        instinct: points[4],
        savoir: points[5]
      },
      experience: {
        force: 0,
        dexterite: 0,
        charme: 0,
        relations: 0,
        instinct: 0,
        savoir: 0
      }
    }
  }

  function getRoomById(levelId: number, position: 'left' | 'right', roomIndex: number): Room | null {
    const level = levels.value.find(l => l.id === levelId)
    if (!level) return null
    
    return position === 'left'
      ? level.leftRooms[roomIndex] || null
      : level.rightRooms[roomIndex] || null
  }

  function togglePause() {
    isPaused.value = !isPaused.value
    if (!isPaused.value) {
      lastUpdateTime.value = Date.now()
    }
  }

  function calculateTotalFoodStorage(): number {
    let totalCapacity = 0

    // Calculer la capacité des chambres froides
    levels.value.forEach(level => {
      [...level.leftRooms, ...level.rightRooms].forEach(room => {
        if (room.isBuilt && !room.isDisabled && room.type === 'chambre-froide') {
          const gridSize = room.gridSize || 1
          
          // Une chambre froide peut stocker 1 stack de chaque type de nourriture
          const foodTypes = Object.entries(ITEMS_CONFIG)
            .filter(([_, config]) => config.category === 'nourriture')
            .length

          // Capacité totale = nombre de types de nourriture * taille de stack * multiplicateur de fusion
          totalCapacity += foodTypes * gridSize
        }
      })
    })

    return totalCapacity
  }

  function calculateTotalWaterStorage(): number {
    let totalCapacity = 0
    
    levels.value.forEach(level => {
      const allRooms = [...level.leftRooms, ...level.rightRooms]
      allRooms.forEach(room => {
        if (!room.isBuilt) return
        
        const config = ROOMS_CONFIG[room.type]
        const gridSize = room.gridSize || 1
        const nbWorkers = room.occupants.length
        
        if (room.type === 'cuve') {
          // Une cuve peut stocker 200 unités d'eau par cellule
          totalCapacity += 200 * gridSize
        } else if (room.type === 'entrepot' && 'capacityPerWorker' in config) {
          const mergeMultiplier = GAME_CONFIG.MERGE_MULTIPLIERS[Math.min(gridSize, 6) as keyof typeof GAME_CONFIG.MERGE_MULTIPLIERS] || 1
          totalCapacity += (config.capacityPerWorker.eau || 0) * nbWorkers * gridSize * mergeMultiplier
        }
      })
    })
    
    return totalCapacity
  }

  function addInitialHabitants() {
    // Ajouter 3 habitants initiaux
    const initialHabitants = [
      {
        nom: 'Jean',
        genre: 'H',
        age: 30 * 52, // 30 ans en semaines
        bonheur: 100,
        competences: {
          force: 5,
          dexterite: 5,
          charme: 5,
          relations: 5,
          instinct: 5,
          savoir: 5
        }
      },
      {
        nom: 'Marie',
        genre: 'F',
        age: 28 * 52,
        bonheur: 100,
        competences: {
          force: 5,
          dexterite: 5,
          charme: 5,
          relations: 5,
          instinct: 5,
          savoir: 5
        }
      },
      {
        nom: 'Pierre',
        genre: 'H',
        age: 25 * 52,
        bonheur: 100,
        competences: {
          force: 5,
          dexterite: 5,
          charme: 5,
          relations: 5,
          instinct: 5,
          savoir: 5
        }
      }
    ]

    initialHabitants.forEach(habitant => {
      this.addHabitant(habitant)
    })
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
    isPaused,
    
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
    ROOMS_CONFIG,
    ROOM_MERGE_CONFIG,
    GAME_CONFIG,
    ITEMS_CONFIG,
    addStairs,
    addEquipment,
    createNewHabitant,
    EQUIPMENT_CONFIG,
    togglePause,
    
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
    removeWater,
    showDeathModal,
    deceasedHabitant,
    handleHabitantDeath,
    checkMortality,
    toggleRoomDisabled,
    calculateTotalFoodStorage,
    calculateTotalWaterStorage,
    competenceTests: computed(() => competenceTests.value),
    calculateProductionBonus,
    addInitialHabitants
  }
}) 