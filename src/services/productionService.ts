import type { Room } from '../stores/gameStore'
import type { RoomConfig } from '../config/roomsConfig'
import type { ResourceKey } from '../config/roomsConfig'
import type { ItemType } from '../stores/gameStore'

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
  const mergeMultiplier = room.gridSize && room.gridSize > 1 ? 1.2 : 1

  // Gestion de la consommation d'eau
  if ('waterConsumption' in config && config.waterConsumption) {
    resources.eau.consumption += config.waterConsumption * nbWorkers * gridSize * mergeMultiplier
  }

  // Gestion de la raffinerie
  if (room.type === 'raffinerie' && room.nextMineralsToProcess && 'mineralsProcessingPerWorker' in config) {
    const processingCapacity = (config.mineralsProcessingPerWorker || 0) * nbWorkers * gridSize * mergeMultiplier
    const canProcess = room.nextMineralsToProcess.input.every(({ type, amount }) => 
      getItemQuantity(type) >= amount
    )

    if (canProcess) {
      room.nextMineralsToProcess.input.forEach(({ type, amount }) => {
        removeItem(type, amount)
      })
      addItem(room.nextMineralsToProcess.output.type, room.nextMineralsToProcess.output.amount)
      room.nextMineralsToProcess = undefined
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

  // Gestion des productions et consommations standards
  if ('productionPerWorker' in config) {
    Object.entries(config.productionPerWorker).forEach(([resource, amount]) => {
      if (amount && resource in resources) {
        if (amount > 0) {
          resources[resource as ResourceKey].production += amount * nbWorkers * gridSize * mergeMultiplier * productionBonus
        } else {
          resources[resource as ResourceKey].consumption += Math.abs(amount) * nbWorkers * gridSize * mergeMultiplier
        }
      }
    })
  }
} 