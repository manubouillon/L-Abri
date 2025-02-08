import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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
}

export interface Level {
  id: number
  isStairsExcavated: boolean
  leftRooms: Room[]
  rightRooms: Room[]
}

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
        { position: 'left', index: 2, type: 'stockage', gridSize: 1, workers: 1 },
        { position: 'right', index: 0, type: 'energie', gridSize: 2, workers: 1 },
        { position: 'right', index: 2, type: 'eau', gridSize: 1, workers: 1 }
      ]
    }
  ]
} as const

// Configuration des multiplicateurs de fusion par type de salle
export const ROOM_MERGE_CONFIG: { [key: string]: { useMultiplier: boolean } } = {
  stockage: { useMultiplier: true },
  dortoir: { useMultiplier: false }, // Le dortoir ne bénéficie pas des multiplicateurs
  cuisine: { useMultiplier: true },
  eau: { useMultiplier: true },
  energie: { useMultiplier: true },
  medical: { useMultiplier: true },
  serre: { useMultiplier: true }
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
}

type RoomConfig = StorageRoomConfig | DortoryRoomConfig | ProductionRoomConfig

const ROOM_CONFIGS: { [key: string]: RoomConfig } = {
  stockage: {
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
  eau: {
    maxWorkers: 2,
    energyConsumption: 4, // 4 unités d'énergie par semaine
    productionPerWorker: {
      eau: 2
    }
  } as ProductionRoomConfig,
  energie: {
    maxWorkers: 2,
    energyConsumption: 0, // La salle d'énergie ne consomme pas d'énergie
    productionPerWorker: {
      energie: 3
    }
  } as ProductionRoomConfig,
  medical: {
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
  } as ProductionRoomConfig
}

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
  const resources = ref<{ [key: string]: Resource }>({
    energie: { amount: 0, capacity: 200, production: 0, consumption: 0 },
    eau: { amount: 0, capacity: 200, production: 0, consumption: 0 },
    nourriture: { amount: 0, capacity: 200, production: 0, consumption: 0 },
    vetements: { amount: 0, capacity: 200, production: 0, consumption: 0 },
    medicaments: { amount: 0, capacity: 200, production: 0, consumption: 0 }
  })

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

  function updateRoomProduction() {
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
      nourriture: population.value * 1,
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
          Object.entries(config.productionPerWorker).forEach(([resource, amount]) => {
            if (amount && resource in resources.value) {
              resources.value[resource as ResourceKey].production += amount * nbWorkers * gridSize * mergeMultiplier
            }
          })
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
      })
    })
  }

  function updateResources(weeksElapsed: number) {
    // Mettre à jour les productions et consommations
    updateRoomProduction()

    // Appliquer les changements pour chaque semaine écoulée
    for (let i = 0; i < weeksElapsed; i++) {
      Object.values(resources.value).forEach(resource => {
        const net = resource.production - resource.consumption
        resource.amount = Math.max(0, Math.min(resource.amount + net, resource.capacity))
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
                if (room) room.isExcavated = true

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

        if (gameTime.value % 10 === 0) {
          saveGame()
        }
      }

      // Vérifier si une semaine s'est écoulée
      if (Math.floor(gameTime.value / 52) > Math.floor(previousGameTime / 52)) {
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
    const resourcesStatus: number[] = Object.values(resources.value).map(r =>
      Math.min(100, (r.amount / (r.consumption * population.value)) * 100)
    );
    happiness.value = Math.floor(resourcesStatus.reduce((a: number, b: number) => a + b, 0) / resourcesStatus.length);
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
          
          excavations.value.push({
            levelId,
            position: 'stairs',
            startTime: gameTime.value,
            habitantId: habitantLibre.id,
            duration: getExcavationTime(levelId)
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

          excavations.value.push({
            levelId,
            position,
            roomIndex,
            startTime: gameTime.value,
            habitantId: habitantLibre.id,
            duration: getExcavationTime(levelId)
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
        if (!adultAvailable) return

        // Trouver un habitant libre qui a plus de 7 ans
        const habitantLibre = habitantsLibres.value.find(h => h.age >= 7)
        if (habitantLibre) {
          room.isUnderConstruction = true
          room.constructionStartTime = Math.floor(gameTime.value)
          room.constructionDuration = 4 // 4 semaines pour construire une salle
          room.type = roomType // Définir le type immédiatement
          affecterHabitant(habitantLibre.id, {
            type: 'construction',
            levelId,
            position,
            roomIndex
          })
          updateRoomProduction() // Utiliser la nouvelle fonction
          saveGame()
        }
      }
    }
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
      habitants: habitants.value
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
    medical: {
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

  function createNewHabitant(levelId: number, position: 'left' | 'right', roomIndex: number): boolean {
    const level = levels.value.find(l => l.id === levelId)
    if (!level) return false

    const room = position === 'left' ? level.leftRooms[roomIndex] : level.rightRooms[roomIndex]
    if (!room || !room.isBuilt || room.type !== 'medical') return false

    // Vérifier si la nurserie est construite et opérationnelle
    const nurserie = room.equipments.find(e => e.type === 'nurserie' && !e.isUnderConstruction)
    if (!nurserie) return false

    // Créer un nouveau-né
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
    saveGame()
    return true
  }

  // Initialisation
  if (!loadGame()) {
    initGame()
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
    addStairs,
    addEquipment,
    createNewHabitant,
    EQUIPMENT_CONFIG
  }
}) 