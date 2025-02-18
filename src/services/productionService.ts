import type { Room } from '../stores/gameStore'
import type { RoomConfig, ResourceKey } from '../config/roomsConfig'
import type { ItemType } from '../config/itemsConfig'
import { GAME_CONFIG } from '../config/gameConfig'

interface Resource {
  amount: number
  capacity: number
  production: number
  consumption: number
}

interface Resources {
  [key: string]: Resource
}

export function handleRoomProduction(
  room: Room,
  config: RoomConfig,
  nbWorkers: number,
  resources: Resources,
  weeksElapsed: number,
  productionBonus: number = 1,
  addItem: (type: ItemType, quantity: number) => boolean,
  removeItem: (type: ItemType, quantity: number) => boolean,
  getItemQuantity: (type: ItemType) => number
) {

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
    console.log('Consommation d\'eau:', waterConsumptionValue)
  }

  // Gestion de la raffinerie
  if (room.type === 'raffinerie' && room.nextMineralsToProcess && 'mineralsProcessingPerWorker' in config) {
    const processingCapacity = (config.mineralsProcessingPerWorker || 0) * nbWorkers * gridSize * mergeMultiplier
    const canProcess = room.nextMineralsToProcess.input.every(({ type, amount }) => 
      getItemQuantity(type) >= amount
    )

    if (canProcess) {
      // Consommer les ressources d'entrée
      room.nextMineralsToProcess.input.forEach(({ type, amount }) => {
        removeItem(type, amount)
      })
      // Produire la ressource de sortie
      addItem(room.nextMineralsToProcess.output.type, room.nextMineralsToProcess.output.amount)
      // Ne pas réinitialiser la recette pour qu'elle continue
      // room.nextMineralsToProcess = undefined
    }
  }

  // Gestion du derrick
  if (room.type === 'derrick') {
    if (room.fuelLevel === undefined) room.fuelLevel = 0
    room.fuelLevel += (100 / 7) * weeksElapsed

    if (room.fuelLevel >= 100) {
      const nbBarilsVides = getItemQuantity('baril-vide')
      if (nbBarilsVides > 0 && 'resourceProduction' in config && config.resourceProduction?.['baril-petrole']) {
        const productionPetrole = config.resourceProduction['baril-petrole'] * nbWorkers * gridSize * mergeMultiplier
        const nbBarilsAProduire = Math.min(nbBarilsVides, Math.floor(productionPetrole))

        if (nbBarilsAProduire > 0) {
          removeItem('baril-vide', nbBarilsAProduire)
          addItem('baril-petrole', nbBarilsAProduire)
          room.fuelLevel = 0
        }
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
          resources[resource as ResourceKey].production += production
        } else {
          const consumption = Math.abs(amount) * nbWorkers * gridSize * mergeMultiplier * weeksElapsed
          resources[resource as ResourceKey].consumption += consumption
        }
      }
    });
  }

  // Gestion spéciale de la production de nourriture des serres
  if (room.type === 'serre' && 'productionPerWorker' in config) {
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
} 