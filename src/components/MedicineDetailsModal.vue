<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <h2>Détails des Médicaments</h2>
      
      <div class="details-section">
        <h3>Production</h3>
        <div v-if="productionRooms.length === 0" class="no-data">
          Aucune production de médicaments
        </div>
        <div v-else class="rooms-list">
          <div v-for="room in productionRooms" :key="room.id" class="room-item">
            <div class="room-header">
              {{ getRoomName(room) }}
              ({{ room.occupants.length }}/{{ ROOMS_CONFIG[room.type].maxWorkers }} travailleurs)
            </div>
            <div class="room-details">
              Production: {{ calculateRoomProduction(room) }} par semaine
            </div>
          </div>
        </div>
        <div class="total">
          Production totale: {{ resources.medicaments.production }} par semaine
        </div>
      </div>

      <div class="details-section">
        <h3>Stockage</h3>
        <div v-if="storageRooms.length === 0" class="no-data">
          Aucune salle de stockage
        </div>
        <div v-else class="rooms-list">
          <div v-for="room in storageRooms" :key="room.id" class="room-item">
            <div class="room-header">
              {{ getRoomName(room) }}
              ({{ room.occupants.length }}/{{ ROOMS_CONFIG[room.type].maxWorkers }} travailleurs)
            </div>
            <div class="room-details">
              Capacité: {{ calculateStorageCapacity(room) }}
            </div>
          </div>
        </div>
      </div>

      <div class="details-section">
        <h3>Consommation</h3>
        <div class="consumption-details">
          <div>Population ({{ population }} habitants)</div>
          <div>Consommation de base: {{ resources.medicaments.consumption }} par semaine</div>
          <div class="info-text">Les médicaments sont consommés uniquement en cas de maladie</div>
        </div>
        <div class="total">
          Consommation totale: {{ resources.medicaments.consumption }} par semaine
        </div>
      </div>

      <div class="details-section">
        <h3>Bilan</h3>
        <div class="balance">
          <div>Stock actuel: {{ Math.floor(resources.medicaments.amount) }}/{{ resources.medicaments.capacity }}</div>
          <div>Balance par semaine: {{ resources.medicaments.production - resources.medicaments.consumption }}</div>
        </div>
      </div>

      <button class="close-button" @click="$emit('close')">Fermer</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '../stores/gameStore'
import { ROOMS_CONFIG } from '../config/roomsConfig'
import type { Room } from '../stores/gameStore'
import { useModal } from '../composables/useModal'

useModal()

const props = defineProps<{
  room?: Room
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const store = useGameStore()
const { resources, levels, population } = storeToRefs(store)

const productionRooms = computed(() => {
  return levels.value.flatMap(level => 
    [...level.leftRooms, ...level.rightRooms].filter(room => 
      room.isBuilt && 
      room.type === 'medical'
    )
  )
})

const storageRooms = computed(() => {
  return levels.value.flatMap(level => 
    [...level.leftRooms, ...level.rightRooms].filter(room => 
      room.isBuilt && 
      room.type === 'stockage'
    )
  )
})

function getRoomName(room: Room): string {
  const levelText = `Niveau ${room.id.split('-')[0]}`
  const positionText = room.position === 'left' ? 'Gauche' : 'Droite'
  const indexText = `#${room.index + 1}`
  const typeText = room.type === 'stockage' ? 'Stockage' : 'Centre médical'
  return `${typeText} (${levelText}, ${positionText} ${indexText})`
}

function calculateRoomProduction(room: Room): number {
  const config = ROOMS_CONFIG[room.type]
  if ('productionPerWorker' in config && config.productionPerWorker.medicaments) {
    const gridSize = room.gridSize || 1
    const mergeMultiplier = store.GAME_CONFIG.MERGE_MULTIPLIERS[Math.min(gridSize, 6) as keyof typeof store.GAME_CONFIG.MERGE_MULTIPLIERS] || 1
    return config.productionPerWorker.medicaments * room.occupants.length * gridSize * mergeMultiplier
  }
  return 0
}

function calculateStorageCapacity(room: Room): number {
  const config = ROOMS_CONFIG[room.type]
  if ('capacityPerWorker' in config && config.capacityPerWorker.medicaments) {
    const gridSize = room.gridSize || 1
    const mergeMultiplier = store.GAME_CONFIG.MERGE_MULTIPLIERS[Math.min(gridSize, 6) as keyof typeof store.GAME_CONFIG.MERGE_MULTIPLIERS] || 1
    return config.capacityPerWorker.medicaments * room.occupants.length * gridSize * mergeMultiplier
  }
  return 0
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
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
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

.details-section {
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: #2a2a2a;
  border-radius: 4px;
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

.consumption-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 1rem 0;
}

.info-text {
  color: #888;
  font-style: italic;
  font-size: 0.9em;
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
</style> 