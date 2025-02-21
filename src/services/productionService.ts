import type { Room } from '../stores/gameStore'
import type { RoomConfig, ResourceKey } from '../config/roomsConfig'
import type { ItemType } from '../config/itemsConfig'
import { GAME_CONFIG } from '../config/gameConfig'
import { effectuerTest, type CompetenceTest, calculateProductionBonus } from './competenceTestService'
import type { Habitant, Resource, Resources } from '../stores/gameStore'
import { useGameStore } from '../stores/gameStore'

// Garder en mémoire les derniers tests effectués
const lastTests = new Map<string, number>()

export function handleRoomProduction(
  room: Room,
  config: RoomConfig,
  nbWorkers: number,
  resources: Resources,
  weeksElapsed: number,
  productionBonus: number = 1,
  addItem: (type: ItemType, quantity: number) => boolean,
  removeItem: (type: ItemType, quantity: number) => boolean,
  getItemQuantity: (type: ItemType) => number,
  habitants: Habitant[],
  addCompetenceTest: (test: CompetenceTest) => void
) {
  const gameStore = useGameStore()
  const currentWeek = Math.floor(gameStore.gameTime)
  
  // Limiter weeksElapsed à 1 pour éviter les calculs en masse lors du chargement
  weeksElapsed = Math.min(weeksElapsed, 1)
  
  // Effectuer les tests de compétences pour chaque travailleur
  const tests: CompetenceTest[] = []
  const travailleurs = habitants.filter(h => room.occupants.includes(h.id))
  
  // Ne faire les tests qu'une fois par semaine pour chaque travailleur dans cette salle
  travailleurs.forEach(travailleur => {
    const testKey = `${room.id}-${travailleur.id}-${currentWeek}`
    if (!lastTests.has(testKey)) {
      const test = effectuerTest(travailleur, room)
      tests.push(test)
      lastTests.set(testKey, currentWeek)
    }
  })
  
  // Enregistrer les tests
  tests.forEach(test => addCompetenceTest(test))
  
  // Nettoyer les anciens tests (garder seulement les 2 dernières semaines)
  for (const [key, week] of lastTests.entries()) {
    if (week < currentWeek - 2) {
      lastTests.delete(key)
    }
  }
  
  // Calculer le bonus de production basé sur les tests
  const testBonus = calculateProductionBonus(tests)
  productionBonus *= testBonus

  const gridSize = room.gridSize || 1
  const mergeMultiplier = gridSize > 1 
    ? GAME_CONFIG.MERGE_MULTIPLIERS[Math.min(gridSize, 6) as keyof typeof GAME_CONFIG.MERGE_MULTIPLIERS] || 1
    : 1

  // Gestion de la consommation d'eau
  if ('waterConsumption' in config && config.waterConsumption) {
    const waterConsumptionValue = Math.min(
      config.waterConsumption * nbWorkers * gridSize * mergeMultiplier,
      1000 // Limite de sécurité par salle
    )
    resources.eau.consumption += waterConsumptionValue
  }

  // Gestion de la raffinerie
  if (room.type === 'raffinerie' && room.nextMineralsToProcess && 'mineralsProcessingPerWorker' in config) {
    const processingCapacity = (config.mineralsProcessingPerWorker || 0) * nbWorkers * gridSize * mergeMultiplier * productionBonus * weeksElapsed
    const canProcess = room.nextMineralsToProcess.input.every(({ type, amount }) => 
      getItemQuantity(type) >= amount
    )

    if (canProcess) {
      // Calculer combien de fois on peut effectuer la recette en fonction de la capacité
      const recipeInputTotal = room.nextMineralsToProcess.input.reduce((sum, { amount }) => sum + amount, 0)
      const maxBatches = Math.floor(processingCapacity / recipeInputTotal)
      
      if (maxBatches > 0) {
        // Consommer les ressources d'entrée
        room.nextMineralsToProcess.input.forEach(({ type, amount }) => {
          removeItem(type, amount * maxBatches)
        })
        // Produire la ressource de sortie avec le bonus de production
        const outputAmount = room.nextMineralsToProcess.output.amount * maxBatches
        addItem(room.nextMineralsToProcess.output.type, outputAmount)
      }
    }
  }

  // Gestion du derrick
  if (room.type === 'derrick') {
    if (room.fuelLevel === undefined) room.fuelLevel = 0
    
    // Ne fonctionne que s'il y a des travailleurs
    if (nbWorkers > 0) {
      // Le remplissage est influencé par le nombre de travailleurs, la taille et le bonus de production
      const remplissageParSemaine = (100 / 7) * nbWorkers * gridSize * mergeMultiplier * productionBonus
      room.fuelLevel += remplissageParSemaine * weeksElapsed
      room.fuelLevel = Math.min(room.fuelLevel, 100)

      // Quand on atteint 100%, on produit un baril si on a un baril vide
      while (room.fuelLevel >= 100) {
        const nbBarilsVides = getItemQuantity('baril-vide')
        if (nbBarilsVides > 0) {
          removeItem('baril-vide', 1)
          addItem('baril-petrole', 1)
          room.fuelLevel -= 100
        } else {
          break // On sort de la boucle si pas de baril vide
        }
      }
    }
  }

  // Gestion du laboratoire
  if (room.type === 'laboratoire' && room.researchState) {
    if (room.fuelLevel === undefined) room.fuelLevel = 0
    
    // Ne fonctionne que s'il y a des travailleurs
    if (nbWorkers > 0) {
      // La progression est influencée par le nombre de travailleurs, la taille et le bonus de production
      const elapsedTime = gameStore.gameTime - room.researchState.startTime
      const progressionParSemaine = (100 / room.researchState.duration) * nbWorkers * gridSize * mergeMultiplier * productionBonus
      room.fuelLevel = Math.min(100, progressionParSemaine * elapsedTime)
      
      // Quand on atteint 100%, on débloque la salle et on transforme le laboratoire
      if (room.fuelLevel >= 100) {
        const gameStore = useGameStore()
        const newRoomType = room.researchState.roomType
        
        // Désaffecter tous les travailleurs
        room.occupants.forEach(habitantId => {
          const habitant = habitants.find(h => h.id === habitantId)
          if (habitant) {
            habitant.affectation = { type: null }
          }
        })
        room.occupants = []
        
        // Conserver les propriétés importantes
        const gridSize = room.gridSize
        const position = room.position
        const index = room.index
        const isExcavated = room.isExcavated
        
        // Transformer la salle
        room.type = newRoomType
        room.gridSize = gridSize
        room.position = position
        room.index = index
        room.isExcavated = isExcavated
        room.isBuilt = true
        room.isUnderConstruction = false
        room.equipments = []
        room.fuelLevel = undefined
        room.researchState = undefined
        
        // Débloquer la salle dans le store
        gameStore.unlockRoom(newRoomType)
        
        // Notifier le changement
        window.dispatchEvent(new CustomEvent('notification', {
          detail: {
            title: 'Transformation du laboratoire',
            message: `Le laboratoire s'est transformé en ${newRoomType}`,
            type: 'success'
          }
        }))
      }
    }
  }

  // Gestion du générateur
  if (room.type === 'generateur') {
    if (room.fuelLevel === undefined) room.fuelLevel = 0
    
    // Consommation de carburant
    const consommationParSemaine = 10 // 10% de carburant par semaine
    const consommation = consommationParSemaine * weeksElapsed
    
    if (room.fuelLevel > 0) {
      room.fuelLevel = Math.max(0, room.fuelLevel - consommation)
    }
    
    // Si le niveau est bas, essayer d'ajouter du carburant
    if (room.fuelLevel < 20) { // Seuil de 20%
      const nbBarilsPetrole = getItemQuantity('baril-petrole')
      if (nbBarilsPetrole > 0) {
        const nbBarilsNecessaires = Math.min(
          Math.ceil((100 - room.fuelLevel) / 50), // Chaque baril donne 50% de carburant
          nbBarilsPetrole
        )
        
        if (nbBarilsNecessaires > 0) {
          removeItem('baril-petrole', nbBarilsNecessaires)
          addItem('baril-vide', nbBarilsNecessaires)
          room.fuelLevel = Math.min(100, room.fuelLevel + (nbBarilsNecessaires * 50))
        }
      }
    }
    
    // Le générateur ne se désactive plus automatiquement sans carburant
    // Il reste dans l'état défini par l'utilisateur (isManuallyDisabled)
    room.isDisabled = room.isManuallyDisabled || false
  }

  // Gestion de la production de vêtements dans les ateliers
  if (room.type === 'atelier') {
    const hasAtelierCouture = room.equipments?.some(e => e.type === 'atelier-couture' && !e.isUnderConstruction)
    if (hasAtelierCouture) {
      const productionBase = 2 * nbWorkers * gridSize * mergeMultiplier * productionBonus * weeksElapsed
      const soieNecessaire = productionBase * 2 // 2 unités de soie par vêtement
      const soieDisponible = getItemQuantity('soie')

      if (soieDisponible >= soieNecessaire) {
        removeItem('soie', Math.floor(soieNecessaire))
        addItem('vetements', Math.floor(productionBase))
        resources.vetements.production += productionBase
      }
    }
  }

  // Gestion des productions et consommations standards
  if ('productionPerWorker' in config) {


    Object.entries(config.productionPerWorker).forEach(([resource, amount]) => {
      if (amount && resource in resources) {
        if (amount > 0) {
          const production = amount * nbWorkers * gridSize * mergeMultiplier * productionBonus * weeksElapsed
            console.log('productionPerWorker', room.type, 'bonus:'+productionBonus, 'nbWorkers:'+nbWorkers, 'gridSize:'+gridSize, 'mergeMultiplier:'+mergeMultiplier, 'weeksElapsed:'+weeksElapsed, 'production:'+production)
          resources[resource as ResourceKey].production += production
        } else {
          const consumption = Math.abs(amount) * nbWorkers * gridSize * mergeMultiplier * weeksElapsed
          console.log('productionPerWorker', room.type, 'bonus:'+productionBonus, 'nbWorkers:'+nbWorkers, 'gridSize:'+gridSize, 'mergeMultiplier:'+mergeMultiplier, 'weeksElapsed:'+weeksElapsed, 'consumption:'+consumption)
          resources[resource as ResourceKey].consumption += consumption
        }
      }
    });
  }

  // Gestion spéciale de la production de nourriture des serres
  if (room.type === 'serre' && 'productionPerWorker' in config) {
    // Vérifier la disponibilité de l'eau
    const waterConsumptionPerWorker = 2 // 2 unités d'eau par travailleur par semaine
    const totalWaterNeeded = waterConsumptionPerWorker * nbWorkers * gridSize * mergeMultiplier * weeksElapsed
    
    if (resources.eau.amount >= totalWaterNeeded) {
      // Consommer l'eau
      resources.eau.consumption += totalWaterNeeded
      resources.eau.amount -= totalWaterNeeded

      // Production de base (laitue)
      const laitueProduction = 2 * nbWorkers * gridSize * mergeMultiplier * productionBonus * weeksElapsed
      addItem('laitue', Math.floor(laitueProduction))

      // Vérifier les équipements
      const hasTomates = room.equipments?.some(e => e.type === 'culture-tomates' && !e.isUnderConstruction)
      const hasAvoine = room.equipments?.some(e => e.type === 'culture-avoine' && !e.isUnderConstruction)
      const hasVersSoie = room.equipments?.some(e => e.type === 'vers-soie' && !e.isUnderConstruction)

      if (hasTomates) {
        const tomatoProduction = 1.5 * nbWorkers * gridSize * mergeMultiplier * productionBonus * weeksElapsed
        addItem('tomates', Math.floor(tomatoProduction))
      }
      if (hasAvoine) {
        const avoineProduction = 2 * nbWorkers * gridSize * mergeMultiplier * productionBonus * weeksElapsed
        addItem('avoine', Math.floor(avoineProduction))
      }
      if (hasVersSoie) {
        const soieProduction = 0.5 * nbWorkers * gridSize * mergeMultiplier * productionBonus * weeksElapsed
        addItem('soie', Math.floor(soieProduction))
      }

      // Convertir la production en unités de nourriture
      const totalNourritureFromSerre = (
        (laitueProduction / 2) + // 2 laitues = 1 unité de nourriture
        (hasTomates ? (1.5 * nbWorkers * gridSize * mergeMultiplier * productionBonus * weeksElapsed / 3) : 0) + // 3 tomates = 1 unité de nourriture
        (hasAvoine ? (2 * nbWorkers * gridSize * mergeMultiplier * productionBonus * weeksElapsed) : 0) // 1 avoine = 1 unité de nourriture
      )
      resources.nourriture.production += totalNourritureFromSerre
    }
    // Si pas assez d'eau, la serre ne produit rien
  }
} 