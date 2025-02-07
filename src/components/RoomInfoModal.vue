<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <h2>{{ room.type }}</h2>
      
      <div class="room-info">
        <div class="production" v-if="roomConfig.productionPerWorker">
          <h3>Production par travailleur</h3>
          <div 
            v-for="(amount, resource) in roomConfig.productionPerWorker" 
            :key="resource"
            class="production-item"
          >
            <span class="resource">{{ resource }}:</span>
            <span class="amount">+{{ amount }}/s</span>
          </div>
        </div>

        <div class="storage" v-if="roomConfig.capacityPerWorker">
          <h3>Capacité de stockage par travailleur</h3>
          <div 
            v-for="(amount, resource) in roomConfig.capacityPerWorker" 
            :key="resource"
            class="storage-item"
          >
            <span class="resource">{{ resource }}:</span>
            <span class="amount">+{{ amount }}</span>
          </div>
        </div>

        <div class="workers">
          <h3>Travailleurs ({{ room.occupants.length }}/{{ roomConfig.maxWorkers }})</h3>
          <div class="workers-list">
            <div 
              v-for="habitantId in room.occupants" 
              :key="habitantId"
              class="worker"
            >
              <span class="name">{{ getHabitantName(habitantId) }}</span>
              <button class="remove" @click="retirerHabitant(habitantId)">Retirer</button>
            </div>
          </div>

          <div class="add-worker" v-if="room.occupants.length < roomConfig.maxWorkers">
            <select v-model="selectedHabitant">
              <option value="">Sélectionner un habitant</option>
              <option 
                v-for="habitant in habitantsDisponibles" 
                :key="habitant.id"
                :value="habitant.id"
              >
                {{ habitant.nom }}
              </option>
            </select>
            <button 
              @click="ajouterHabitant"
              :disabled="!selectedHabitant"
            >
              Ajouter
            </button>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button @click="$emit('close')">Fermer</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '../stores/gameStore'
import type { Room } from '../stores/gameStore'

const props = defineProps<{
  room: Room
  levelId: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const store = useGameStore()
const { habitants } = storeToRefs(store)
const selectedHabitant = ref('')

const roomConfig = computed(() => 
  store.ROOM_CONFIGS[props.room.type as keyof typeof store.ROOM_CONFIGS]
)

const habitantsDisponibles = computed(() => 
  habitants.value.filter(h => h.affectation.type === null)
)

function getHabitantName(habitantId: string): string {
  const habitant = habitants.value.find(h => h.id === habitantId)
  return habitant ? habitant.nom : 'Inconnu'
}

function retirerHabitant(habitantId: string) {
  store.retirerHabitantSalle(habitantId)
}

function ajouterHabitant() {
  if (selectedHabitant.value) {
    store.affecterHabitantSalle(
      selectedHabitant.value,
      props.levelId,
      props.room.position,
      props.room.index
    )
    selectedHabitant.value = ''
  }
}
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: #34495e;
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;

  h2 {
    margin: 0 0 1rem;
    text-transform: capitalize;
    text-align: center;
    color: #ecf0f1;
  }

  h3 {
    margin: 0 0 0.5rem;
    font-size: 1rem;
    color: #bdc3c7;
  }
}

.room-info {
  display: grid;
  gap: 1.5rem;
}

.production, .storage {
  .production-item, .storage-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.25rem;
    
    .resource {
      text-transform: capitalize;
      color: #ecf0f1;
    }
    
    .amount {
      color: #2ecc71;
    }
  }
}

.workers {
  .workers-list {
    display: grid;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .worker {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #2c3e50;
    padding: 0.5rem;
    border-radius: 4px;

    .name {
      color: #ecf0f1;
    }

    .remove {
      padding: 0.25rem 0.5rem;
      font-size: 0.8rem;
      background-color: #e74c3c;

      &:hover {
        background-color: #c0392b;
      }
    }
  }
}

.add-worker {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
  align-items: center;

  select {
    padding: 0.5rem;
    background-color: #2c3e50;
    border: 1px solid #3498db;
    border-radius: 4px;
    color: #ecf0f1;
    
    option {
      background-color: #2c3e50;
    }
  }

  button {
    padding: 0.5rem 1rem;
    background-color: #2ecc71;

    &:hover {
      background-color: #27ae60;
    }

    &:disabled {
      background-color: #95a5a6;
    }
  }
}

.modal-actions {
  margin-top: 1.5rem;
  text-align: right;

  button {
    background-color: #3498db;

    &:hover {
      background-color: #2980b9;
    }
  }
}
</style> 