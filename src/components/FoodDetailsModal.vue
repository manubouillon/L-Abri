<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <h2>Détails de la Nourriture</h2>
      
      <!-- Section Prochain Cycle -->
      <div class="details-section highlight">
        <h3>Prochain Cycle (x{{ gameSpeed }} vitesse)</h3>
        <div class="next-cycle">
          <div class="consumption-preview">
            <h4>Consommation prévue :</h4>
            <div class="food-distribution">
              <div v-for="item in availableFoodItems" :key="item.type" class="food-item">
                <div class="food-name">{{ item.type === 'nourriture-conserve' ? 'Boîtes de conserve' : 
                                       item.type === 'laitue' ? 'Laitue' : 
                                       item.type === 'avoine' ? 'Avoine' : item.type }}</div>
                <div class="food-quality">
                  <span class="quality-stars">{{ '★'.repeat(getFoodQuality(item.type)) }}</span>
                  <span class="quality-empty">{{ '☆'.repeat(10 - getFoodQuality(item.type)) }}</span>
                </div>
                <div class="food-consumption">
                  {{ calculateFoodConsumption(item) }} unités
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section Stocks -->
      <div class="details-section">
        <h3>Stocks Disponibles</h3>
        <div class="food-stocks">
          <div v-for="item in availableFoodItems" :key="item.type" class="food-stock-item">
            <div class="stock-info">
              <div class="stock-name">{{ item.type === 'nourriture-conserve' ? 'Boîtes de conserve' : 
                                       item.type === 'laitue' ? 'Laitue' : 
                                       item.type === 'avoine' ? 'Avoine' : item.type }}</div>
              <div class="stock-quantity">{{ item.quantity }} unités</div>
            </div>
            <div class="stock-details">
              <div class="quality-info">
                Qualité: {{ getFoodQuality(item.type) }}/10
                <div class="quality-bar">
                  <div 
                    class="quality-fill"
                    :style="{ width: getFoodQuality(item.type) * 10 + '%' }"
                  ></div>
                </div>
              </div>
              <div class="ratio-info">
                Ratio: 1:{{ getFoodRatio(item.type) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section Production -->
      <div class="details-section">
        <h3>Production</h3>
        <div v-if="productionRooms.length === 0" class="no-data">
          Aucune production de nourriture
        </div>
        <div v-else class="rooms-list">
          <div v-for="room in productionRooms" :key="room.id" class="room-item">
            <div class="room-header">
              {{ getRoomName(room) }}
              ({{ room.occupants.length }}/{{ ROOM_CONFIGS[room.type].maxWorkers }} travailleurs)
            </div>
            <div class="room-details">
              <div>Production: {{ calculateRoomProduction(room) }} par semaine</div>
              <div>Type: {{ getFoodTypeForRoom(room) }}</div>
            </div>
          </div>
        </div>
        <div class="total">
          Production totale: {{ calculateTotalProduction() }} rations par semaine
          <div class="production-details">
            <div v-for="room in productionRooms" :key="room.id" class="production-detail">
              {{ getFoodTypeForRoom(room) }}: {{ calculateRoomProduction(room) }} unités 
              ({{ Math.floor(calculateRoomProduction(room) / (room.type === 'serre' && ITEMS_CONFIG['laitue']?.ratio ? ITEMS_CONFIG['laitue'].ratio : 1)) }} rations)
            </div>
          </div>
        </div>
      </div>

      <div class="details-section">
        <h3>Bilan</h3>
        <div class="balance">
          <div>Stock total: {{ Math.floor(resources.nourriture.amount) }}/{{ resources.nourriture.capacity }}</div>
          <div>Balance par semaine: {{ resources.nourriture.production - resources.nourriture.consumption }}</div>
        </div>
      </div>

      <button class="close-button" @click="$emit('close')">Fermer</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '../stores/gameStore'
import type { Room, ItemType, Item } from '../stores/gameStore'

const store = useGameStore()
const { resources, levels, population, inventory, gameSpeed } = storeToRefs(store)
const { ROOM_CONFIGS, ITEMS_CONFIG } = store

const availableFoodItems = computed(() => {
  return inventory.value.filter(item => 
    item.category === 'nourriture' && 
    item.quantity > 0
  )
})

const productionRooms = computed(() => {
  return levels.value.flatMap(level => 
    [...level.leftRooms, ...level.rightRooms].filter(room => 
      room.isBuilt && 
      (room.type === 'cuisine' || room.type === 'serre')
    )
  )
})

function getRoomName(room: Room): string {
  const levelText = `Niveau ${room.id.split('-')[0]}`
  const positionText = room.position === 'left' ? 'Gauche' : 'Droite'
  const indexText = `#${room.index + 1}`
  const typeText = room.type === 'cuisine' ? 'Cuisine' : 'Serre'
  return `${typeText} (${levelText}, ${positionText} ${indexText})`
}

function calculateRoomProduction(room: Room): number {
  const config = ROOM_CONFIGS[room.type]
  if ('productionPerWorker' in config) {
    const gridSize = room.gridSize || 1
    const mergeMultiplier = store.GAME_CONFIG.MERGE_MULTIPLIERS[Math.min(gridSize, 6) as keyof typeof store.GAME_CONFIG.MERGE_MULTIPLIERS] || 1
    
    if (room.type === 'cuisine' && 'nourriture' in config.productionPerWorker) {
      const production = config.productionPerWorker.nourriture
      if (typeof production === 'number') {
        return production * room.occupants.length * gridSize * mergeMultiplier * gameSpeed.value
      }
    } else if (room.type === 'serre' && 'laitue' in config.productionPerWorker) {
      const production = config.productionPerWorker.laitue
      if (typeof production === 'number') {
        return production * room.occupants.length * gridSize * mergeMultiplier * gameSpeed.value
      }
    }
  }
  return 0
}

function getFoodTypeForRoom(room: Room): string {
  if (room.type === 'cuisine') {
    return 'Nourriture en conserve'
  } else if (room.type === 'serre') {
    return 'Laitue'
  }
  return ''
}

function getFoodQuality(type: string): number {
  if (type === 'nourriture-conserve') {
    return ITEMS_CONFIG['nourriture-conserve'].qualite || 0
  } else if (type === 'laitue') {
    return ITEMS_CONFIG['laitue'].qualite || 0
  } else if (type === 'avoine') {
    return ITEMS_CONFIG['avoine'].qualite || 0
  }
  return 0
}

function getFoodRatio(type: string): number {
  if (type === 'nourriture-conserve') {
    return ITEMS_CONFIG['nourriture-conserve'].ratio || 1
  } else if (type === 'laitue') {
    return ITEMS_CONFIG['laitue'].ratio || 1
  } else if (type === 'avoine') {
    return ITEMS_CONFIG['avoine'].ratio || 1
  }
  return 1
}

function calculateFoodConsumption(item: Item): number {
  const totalConsumption = resources.value.nourriture.consumption * gameSpeed.value
  const foodCount = availableFoodItems.value.length
  if (foodCount === 0) return 0
  
  const consumptionPerType = totalConsumption / foodCount
  const ratio = getFoodRatio(item.type)
  
  return Math.ceil(consumptionPerType * ratio)
}

function calculateTotalProduction(): number {
  let totalRations = 0
  
  for (const room of productionRooms.value) {
    const production = calculateRoomProduction(room)
    if (room.type === 'cuisine') {
      // Production de conserves (ratio 1)
      totalRations += production
    } else if (room.type === 'serre') {
      // Production de laitue (ratio 10)
      const laitueConfig = ITEMS_CONFIG['laitue']
      if (laitueConfig?.ratio) {
        totalRations += production / laitueConfig.ratio
      }
    }
  }
  
  return Math.floor(totalRations)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #1a1a1a;
  padding: 2rem;
  border-radius: 8px;
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.highlight {
  border: 1px solid #4a4a4a;
  background-color: #2d2d2d;
}

h2 {
  color: #fff;
  margin-bottom: 1.5rem;
  text-align: center;
}

h3 {
  color: #ddd;
  margin: 1rem 0;
}

h4 {
  color: #bbb;
  margin: 0.5rem 0;
}

.details-section {
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: #2a2a2a;
  border-radius: 4px;
}

.next-cycle {
  padding: 1rem;
  background-color: #333;
  border-radius: 4px;
}

.food-distribution {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.food-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background-color: #2a2a2a;
  border-radius: 4px;
}

.food-name {
  flex: 1;
}

.food-quality {
  margin: 0 1rem;
}

.quality-stars {
  color: #ffd700;
}

.quality-empty {
  color: #444;
}

.food-consumption {
  min-width: 100px;
  text-align: right;
}

.food-stocks {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.food-stock-item {
  background-color: #333;
  padding: 1rem;
  border-radius: 4px;
}

.stock-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.stock-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quality-info {
  flex: 1;
}

.quality-bar {
  height: 4px;
  background-color: #444;
  border-radius: 2px;
  margin-top: 4px;
}

.quality-fill {
  height: 100%;
  background-color: #ffd700;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.ratio-info {
  margin-left: 1rem;
}

.rooms-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.room-item {
  background-color: #333;
  padding: 0.8rem;
  border-radius: 4px;
}

.room-header {
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.room-details {
  color: #aaa;
}

.total {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #444;
  font-weight: bold;
}

.balance {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.no-data {
  color: #888;
  font-style: italic;
  padding: 1rem 0;
}

.close-button {
  width: 100%;
  padding: 0.8rem;
  background-color: #444;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  margin-top: 1rem;
}

.close-button:hover {
  background-color: #555;
}

.production-details {
  margin-top: 0.5rem;
  font-size: 0.9em;
  color: #888;
}

.production-detail {
  margin-top: 0.3rem;
  padding-left: 1rem;
}
</style> 