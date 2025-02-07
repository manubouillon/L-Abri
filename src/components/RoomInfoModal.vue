<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <h2>{{ room.type }}</h2>
      
      <div class="modal-tabs">
        <button 
          :class="{ active: activeTab === 'info' }" 
          @click="activeTab = 'info'"
        >
          Informations
        </button>
        <button 
          :class="{ active: activeTab === 'equipment' }" 
          @click="activeTab = 'equipment'"
        >
          Équipements
        </button>
      </div>

      <div v-if="activeTab === 'info'">
        <div class="production-details" v-if="isProductionRoom">
          <h3>Détails de la production</h3>
          <div class="production-formula">
            <div class="formula-row">
              <span class="label">Production de base par travailleur:</span>
              <span v-for="(amount, resource) in baseProduction" :key="resource">
                {{ resource }}: {{ amount }}/s
              </span>
            </div>
            <div class="formula-row">
              <span class="label">Nombre de travailleurs:</span>
              <span>{{ room.occupants.length }}👥</span>
            </div>
            <div class="formula-row">
              <span class="label">Taille de la salle:</span>
              <span>{{ room.gridSize || 1 }}��</span>
            </div>
            <div class="formula-row">
              <span class="label">Multiplicateur de fusion:</span>
              <span>{{ getMergeMultiplier }}✨</span>
            </div>
            <div class="formula-row total">
              <span class="label">Production totale:</span>
              <span>{{ getTotalProduction }}</span>
            </div>
          </div>
        </div>

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
      </div>

      <div v-else-if="activeTab === 'equipment'" class="equipment-tab">
        <div class="available-equipment">
          <h3>Équipements disponibles</h3>
          <div class="equipment-list">
            <div 
              v-for="(config, type) in availableEquipment" 
              :key="type"
              class="equipment-item"
            >
              <div class="equipment-info">
                <h4>{{ type }}</h4>
                <p>{{ config.description }}</p>
                <p class="construction-time">
                  Temps de construction: {{ config.constructionTime }} semaines
                </p>
              </div>
              <button 
                @click="addEquipment(type)"
                :disabled="hasEquipment(type)"
              >
                {{ hasEquipment(type) ? 'Installé' : 'Installer' }}
              </button>
            </div>
          </div>
        </div>

        <div class="installed-equipment">
          <h3>Équipements installés</h3>
          <div class="equipment-list">
            <div 
              v-for="equipment in (room.equipments || [])" 
              :key="equipment.id"
              class="equipment-item"
            >
              <div class="equipment-info">
                <h4>{{ equipment.type }}</h4>
                <template v-if="equipment.isUnderConstruction">
                  <div class="construction-progress">
                    <div 
                      class="progress-bar"
                      :style="{ width: `${getEquipmentProgress(equipment)}%` }"
                    ></div>
                    <span class="progress-text">
                      Construction: {{ getRemainingConstructionTime(equipment) }} semaines
                    </span>
                  </div>
                </template>
                <template v-else>
                  <span class="status">Opérationnel</span>
                </template>
              </div>
            </div>
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
import type { Room, Equipment } from '../stores/gameStore'

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

const isProductionRoom = computed(() => {
  const config = store.ROOM_CONFIGS[props.room.type]
  return config && 'productionPerWorker' in config
})

const baseProduction = computed(() => {
  const config = store.ROOM_CONFIGS[props.room.type]
  if (!config || !('productionPerWorker' in config)) return {}
  return config.productionPerWorker
})

const getMergeMultiplier = computed(() => {
  const gridSize = props.room.gridSize || 1
  const mergeConfig = store.ROOM_MERGE_CONFIG[props.room.type]
  return mergeConfig?.useMultiplier 
    ? store.GAME_CONFIG.MERGE_MULTIPLIERS[Math.min(gridSize, 6) as keyof typeof store.GAME_CONFIG.MERGE_MULTIPLIERS] || 1
    : 1
})

const getTotalProduction = computed(() => {
  const config = store.ROOM_CONFIGS[props.room.type]
  if (!config || !('productionPerWorker' in config)) return ''

  const nbWorkers = props.room.occupants.length
  const gridSize = props.room.gridSize || 1
  const mergeMultiplier = getMergeMultiplier.value

  const productions = []
  for (const [resource, amount] of Object.entries(config.productionPerWorker)) {
    const total = amount * nbWorkers * gridSize * mergeMultiplier
    productions.push(`${resource}: ${total.toFixed(1)}/s`)
  }

  return productions.join(', ')
})

const activeTab = ref('info')

const availableEquipment = computed(() => 
  store.EQUIPMENT_CONFIG[props.room.type] || {}
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

function hasEquipment(type: string): boolean {
  return props.room.equipments?.some(e => e.type === type) || false
}

function addEquipment(type: string) {
  store.addEquipment(
    props.levelId,
    props.room.position,
    props.room.index,
    type
  )
}

function getEquipmentProgress(equipment: Equipment): number {
  if (!equipment.isUnderConstruction || equipment.constructionStartTime === undefined || equipment.constructionDuration === undefined) {
    return 100
  }
  const elapsedTime = store.gameTime - equipment.constructionStartTime
  return Math.min(100, (elapsedTime / equipment.constructionDuration) * 100)
}

function getRemainingConstructionTime(equipment: Equipment): number {
  if (!equipment.isUnderConstruction || equipment.constructionStartTime === undefined || equipment.constructionDuration === undefined) {
    return 0
  }
  const elapsedTime = store.gameTime - equipment.constructionStartTime
  return Math.max(0, equipment.constructionDuration - elapsedTime)
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

.production-details {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;

  h3 {
    margin-top: 0;
    color: #2ecc71;
  }

  .production-formula {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    .formula-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.25rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);

      &:last-child {
        border-bottom: none;
      }

      &.total {
        margin-top: 0.5rem;
        padding-top: 0.5rem;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
        font-weight: bold;
        color: #2ecc71;
      }

      .label {
        color: rgba(255, 255, 255, 0.7);
      }
    }
  }
}

.modal-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.5rem;

  button {
    background: none;
    border: none;
    color: #95a5a6;
    padding: 0.5rem 1rem;
    cursor: pointer;
    transition: all 0.3s ease;

    &.active {
      color: #3498db;
      border-bottom: 2px solid #3498db;
    }

    &:hover {
      color: #3498db;
    }
  }
}

.equipment-tab {
  display: grid;
  gap: 2rem;
}

.equipment-list {
  display: grid;
  gap: 1rem;
}

.equipment-item {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;

  .equipment-info {
    flex: 1;

    h4 {
      margin: 0 0 0.5rem;
      color: #ecf0f1;
      text-transform: capitalize;
    }

    p {
      margin: 0;
      font-size: 0.9rem;
      color: #bdc3c7;

      &.construction-time {
        font-size: 0.8rem;
        color: #95a5a6;
        margin-top: 0.25rem;
      }
    }

    .status {
      color: #2ecc71;
      font-size: 0.9rem;
    }
  }

  button {
    &:disabled {
      background-color: #27ae60;
    }
  }
}

.construction-progress {
  margin-top: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  height: 0.5rem;
  position: relative;
  overflow: hidden;

  .progress-bar {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background-color: #3498db;
    transition: width 0.3s ease;
  }

  .progress-text {
    position: absolute;
    left: 0;
    top: 100%;
    width: 100%;
    text-align: center;
    font-size: 0.8rem;
    color: #95a5a6;
    margin-top: 0.25rem;
  }
}
</style> 