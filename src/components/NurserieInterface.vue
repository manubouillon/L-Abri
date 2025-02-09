<template>
  <div class="nurserie-interface">
    <div class="nurserie-header">
      <h3>Nurserie</h3>
      <div class="embryons-disponibles">
        Embryons disponibles: {{ embryonsDisponibles }}
      </div>
    </div>

    <div v-if="isIncubating" class="incubation-status">
      <div class="status-text">Incubation en cours...</div>
      <div class="progress-bar">
        <div 
          class="progress" 
          :style="{ width: `${incubationProgress}%` }"
        ></div>
      </div>
      <div class="time-remaining">
        Temps restant: {{ remainingWeeks }} semaines
      </div>
    </div>

    <div v-else class="incubation-controls">
      <button 
        @click="startIncubation"
        :disabled="embryonsDisponibles === 0"
        class="incubate-button"
      >
        Incuber un embryon humain
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '../stores/gameStore'

const props = defineProps<{
  levelId: number
  position: 'left' | 'right'
  roomIndex: number
  equipmentId: string
}>()

const store = useGameStore()
const { levels, gameTime } = storeToRefs(store)

// Récupérer la nurserie
const nurserie = computed(() => {
  const level = levels.value.find(l => l.id === props.levelId)
  if (!level) return null
  
  const room = props.position === 'left' 
    ? level.leftRooms[props.roomIndex] 
    : level.rightRooms[props.roomIndex]
  
  if (!room) return null
  
  return room.equipments.find(e => e.id === props.equipmentId)
})

// État de l'incubation
const isIncubating = computed(() => nurserie.value?.nurserieState?.isIncubating || false)
const incubationStartTime = computed(() => nurserie.value?.nurserieState?.startTime || 0)

// Calculer le progrès de l'incubation
const incubationProgress = computed(() => {
  if (!isIncubating.value || !incubationStartTime.value) return 0
  
  const elapsed = gameTime.value - incubationStartTime.value
  const total = 36 // 9 mois = 36 semaines
  return Math.min(100, (elapsed / total) * 100)
})

// Calculer le temps restant
const remainingWeeks = computed(() => {
  if (!isIncubating.value || !incubationStartTime.value) return 0
  
  const elapsed = gameTime.value - incubationStartTime.value
  const total = 36
  return Math.max(0, total - Math.floor(elapsed))
})

// Nombre d'embryons disponibles
const embryonsDisponibles = computed(() => store.getItemQuantity('embryon-humain'))

// Démarrer l'incubation
function startIncubation() {
  store.createNewHabitant(props.levelId, props.position, props.roomIndex, 'embryon-humain')
}
</script>

<style lang="scss" scoped>
.nurserie-interface {
  padding: 1rem;
  background-color: #34495e;
  border-radius: 8px;
  color: #ecf0f1;
}

.nurserie-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;

  h3 {
    margin: 0;
  }

  .embryons-disponibles {
    font-size: 0.9rem;
    color: #bdc3c7;
  }
}

.incubation-status {
  .status-text {
    text-align: center;
    margin-bottom: 0.5rem;
    color: #3498db;
  }

  .progress-bar {
    height: 4px;
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 0.5rem;

    .progress {
      height: 100%;
      background-color: #3498db;
      transition: width 0.3s ease;
    }
  }

  .time-remaining {
    text-align: center;
    font-size: 0.9rem;
    color: #bdc3c7;
  }
}

.incubation-controls {
  display: flex;
  justify-content: center;

  .incubate-button {
    padding: 0.5rem 1rem;
    background-color: #2ecc71;
    border: none;
    border-radius: 4px;
    color: white;
    cursor: pointer;

    &:hover:not(:disabled) {
      background-color: #27ae60;
    }

    &:disabled {
      background-color: #95a5a6;
      cursor: not-allowed;
    }
  }
}
</style> 