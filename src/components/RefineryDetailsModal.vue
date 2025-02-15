<template>
  <div class="refinery-details">
    <h2>Détails de la Raffinerie</h2>

    <div class="modal-tabs">
      <button 
        :class="{ active: activeTab === 'info' }" 
        @click="activeTab = 'info'"
      >
        Informations
      </button>
      <button 
        :class="{ active: activeTab === 'production' }" 
        @click="activeTab = 'production'"
      >
        Production
      </button>
    </div>

    <div v-if="activeTab === 'info'">
      <div class="details-section">
        <div class="production-details">
          <h3>Détails de la salle</h3>
          <div class="production-formula">
            <div class="formula-row">
              <span class="label">Consommation d'énergie:</span>
              <span>{{ ROOM_CONFIGS['raffinerie'].energyConsumption }} par semaine</span>
            </div>
            <div class="formula-row">
              <span class="label">Nombre de travailleurs:</span>
              <span>{{ props.room.occupants.length }}/{{ ROOM_CONFIGS['raffinerie'].maxWorkers }}👥</span>
            </div>
            <div class="formula-row">
              <span class="label">Capacité de traitement:</span>
              <span>{{ getProcessingCapacity() }} minerais par semaine</span>
            </div>
            <div class="formula-row">
              <span class="label">Taille de la salle:</span>
              <span>{{ props.room.gridSize || 1 }}</span>
            </div>
            <div class="formula-row">
              <span class="label">Multiplicateur de fusion:</span>
              <span>{{ getMergeMultiplier }}✨</span>
            </div>
          </div>
        </div>
      </div>

      <div class="details-section">
        <h3>Production en cours</h3>
        <div class="room-item">
          <div v-if="props.room.nextMineralsToProcess" class="next-process">
            <div class="process-inputs">
              Entrée :
              <span v-for="(input, index) in props.room.nextMineralsToProcess.input" :key="index">
                {{ input.amount }} {{ getItemName(input.type) }}
                <span v-if="index < props.room.nextMineralsToProcess.input.length - 1">, </span>
              </span>
            </div>
            <div class="process-output">
              Sortie : {{ props.room.nextMineralsToProcess.output.amount }} {{ getItemName(props.room.nextMineralsToProcess.output.type) }}
            </div>
          </div>
          <div v-else class="no-process">
            Pas de minerais à traiter
          </div>
        </div>
      </div>

      <div class="details-section">
        <h3>Travailleurs</h3>
        <div class="workers-list">
          <div 
            v-for="habitantId in props.room.occupants" 
            :key="habitantId"
            class="worker"
          >
            <span class="name">{{ getHabitantName(habitantId) }}</span>
            <button class="remove-button" @click="retirerHabitant(habitantId)">Retirer</button>
          </div>
        </div>

        <div class="add-worker" v-if="props.room.occupants.length < (ROOM_CONFIGS['raffinerie'] as RefineryConfig).maxWorkers">
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
            class="add-button"
            @click="ajouterHabitant"
            :disabled="!selectedHabitant"
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="activeTab === 'production'" class="production-tab">
      <div class="details-section">
        <h3>Conversions disponibles</h3>
        <div class="resources-grid">
          <div v-for="rule in conversionRulesList" :key="rule.inputType" class="resource-row">
            <div class="resource-info">
              <div class="resource-name">{{ getItemName(rule.output) }}</div>
              <div class="resource-quantity">
                Rendement: {{ Math.round(rule.ratio * 100) }}%
              </div>
            </div>
            <div class="conversion-info">
              <div class="conversion-details">
                Nécessite:
                <span v-for="(req, index) in getRequiredResources(rule)" :key="req.type">
                  {{ index > 0 ? ', ' : '' }}{{ Math.round(req.amount) }} {{ getItemName(req.type) }}
                  ({{ Math.round(req.available) }})
                </span>
              </div>
              <button 
                class="convert-button"
                :class="{ 
                  active: selectedResource === rule.inputType || 
                  (props.room.nextMineralsToProcess?.input[0]?.type === rule.inputType) 
                }"
                @click="selectResource(rule.inputType, rule)"
                :disabled="!canConvertResource(rule.inputType, rule)"
              >
                Sélectionner
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-actions">
      <button 
        class="toggle-button"
        :class="{ 'disabled': props.room.isDisabled }"
        @click="toggleRoom"
      >
        {{ props.room.isDisabled ? 'Activer' : 'Désactiver' }}
        {{ props.room.isDisabled ? '🔌' : '⚡' }}
      </button>
      <button @click="$emit('close')">Fermer</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '../stores/gameStore'
import type { Room, ItemType } from '../stores/gameStore'
import { ITEMS_CONFIG, ROOM_CONFIGS } from '../stores/gameStore'

interface ConversionRule {
  output: ItemType
  ratio: number
  requires?: {
    [key: string]: number
  }
}

interface RefineryConfig {
  maxWorkers: number
  energyConsumption: number
  mineralsProcessingPerWorker: number
  conversionRules: {
    [key: string]: ConversionRule
  }
}

const props = defineProps<{
  room: Room
}>()

const store = useGameStore()
const { habitants, gameSpeed } = storeToRefs(store)
const selectedHabitant = ref('')
const selectedResource = ref<ItemType | null>(null)
const activeTab = ref('info')

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update-recipe', recipe: { 
    input: { type: ItemType, amount: number }[],
    output: { type: ItemType, amount: number }
  } | null): void
}>()

// Ajouter un watcher pour initialiser la sélection en fonction de la recette actuelle
watch(() => props.room.nextMineralsToProcess, (newValue) => {
  if (newValue && newValue.input.length > 0) {
    selectedResource.value = newValue.input[0].type
  } else {
    selectedResource.value = null
  }
}, { immediate: true })

const conversionRules = computed(() => {
  const config = ROOM_CONFIGS['raffinerie'] as RefineryConfig
  if (!config || !config.conversionRules) return {}
  return Object.fromEntries(
    Object.entries(config.conversionRules).map(([inputType, rule]) => [
      inputType,
      {
        inputType,
        output: rule.output,
        ratio: rule.ratio,
        requires: rule.requires
      }
    ])
  ) as { [key: string]: ConversionRule & { inputType: string } }
})

const conversionRulesList = computed(() => {
  return Object.values(conversionRules.value)
})

const habitantsDisponibles = computed(() => 
  habitants.value.filter(h => h.affectation.type === null && h.age >= 7)
)

const getMergeMultiplier = computed(() => {
  const gridSize = props.room.gridSize || 1
  const mergeConfig = store.ROOM_MERGE_CONFIG['raffinerie']
  return mergeConfig?.useMultiplier 
    ? store.GAME_CONFIG.MERGE_MULTIPLIERS[Math.min(gridSize, 6) as keyof typeof store.GAME_CONFIG.MERGE_MULTIPLIERS] || 1
    : 1
})

function getProcessingCapacity(): number {
  const config = ROOM_CONFIGS['raffinerie'] as RefineryConfig
  if (!config || !config.mineralsProcessingPerWorker) return 0
  const nbWorkers = props.room.occupants.length
  const gridSize = props.room.gridSize || 1
  return Math.floor(config.mineralsProcessingPerWorker * nbWorkers * gridSize * getMergeMultiplier.value * store.gameSpeed)
}

function getRoomName(room: Room): string {
  const levelText = `Niveau ${room.id.split('-')[0]}`
  const positionText = room.position === 'left' ? 'Gauche' : 'Droite'
  const indexText = `#${room.index + 1}`
  return `Raffinerie (${levelText}, ${positionText} ${indexText})`
}

function getHabitantName(habitantId: string): string {
  const habitant = habitants.value.find(h => h.id === habitantId)
  return habitant ? habitant.nom : 'Inconnu'
}

function retirerHabitant(habitantId: string) {
  store.retirerHabitantSalle(habitantId, props.room.id)
}

function ajouterHabitant() {
  if (selectedHabitant.value) {
    const roomId = props.room.id
    const [levelId, position, index] = roomId.split('-')
    store.affecterHabitantSalle(
      selectedHabitant.value,
      Number(levelId),
      position as 'left' | 'right',
      Number(index)
    )
    selectedHabitant.value = ''
  }
}

function getResourceQuantity(type: ItemType): number {
  return store.getItemQuantity(type)
}

function getItemName(type: ItemType): string {
  return ITEMS_CONFIG[type]?.name || type
}

function getRequiredResources(rule: ConversionRule & { inputType: string }) {
  const resources: { type: ItemType; amount: number; available: number }[] = [
    {
      type: rule.inputType as ItemType,
      amount: 1,
      available: store.getItemQuantity(rule.inputType as ItemType)
    }
  ]

  if (rule.requires) {
    Object.entries(rule.requires).forEach(([type, amount]) => {
      resources.push({
        type: type as ItemType,
        amount,
        available: store.getItemQuantity(type as ItemType)
      })
    })
  }

  return resources
}

function canConvertResource(inputType: string, rule: ConversionRule & { inputType: string }): boolean {
  const resources = getRequiredResources(rule)
  return resources.every(resource => resource.available >= resource.amount)
}

function selectResource(type: string, rule: ConversionRule & { inputType: string }) {
  // Mettre à jour la sélection locale
  selectedResource.value = type as ItemType
  
  // Émettre la nouvelle recette si on a les ressources nécessaires
  if (canConvertResource(type, rule)) {
    emit('update-recipe', {
      input: [
        { type: type as ItemType, amount: 1 },
        ...(rule.requires ? Object.entries(rule.requires).map(([reqType, reqAmount]) => ({
          type: reqType as ItemType,
          amount: reqAmount as number
        })) : [])
      ],
      output: {
        type: rule.output as ItemType,
        amount: rule.ratio as number
      }
    })
  } else {
    // Si on n'a pas les ressources, on émet null pour arrêter la production
    emit('update-recipe', null)
  }
}

function toggleRoom() {
  props.room.isDisabled = !props.room.isDisabled
}
</script>

<style scoped>
.refinery-details {
  color: #ecf0f1;
  width: 100%;
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

.room-item {
  background-color: #333;
  padding: 0.8rem;
  border-radius: 4px;
}

.room-header {
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.next-process {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: #2c3e50;
  border-radius: 4px;
}

.process-title {
  font-weight: bold;
  margin-bottom: 0.3rem;
  color: #3498db;
}

.process-inputs, .process-output {
  padding: 0.2rem 0;
}

.no-process {
  color: #95a5a6;
  font-style: italic;
}

.conversion-rules {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  background-color: #333;
  border-radius: 4px;
}

.rule-input, .rule-output {
  flex: 1;
}

.rule-arrow {
  color: #3498db;
  font-weight: bold;
}

.close-button {
  width: 100%;
  margin-top: 1rem;
  padding: 0.8rem;
  background-color: #3498db;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: #2980b9;
}

.no-data {
  text-align: center;
  color: #95a5a6;
  font-style: italic;
  padding: 1rem;
}

.workers-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.worker {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #333;
  padding: 0.5rem;
  border-radius: 4px;
}

.worker .name {
  color: #ecf0f1;
}

.remove-button {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  background-color: #e74c3c;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
}

.remove-button:hover {
  background-color: #c0392b;
}

.add-worker {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
  align-items: center;
}

.add-worker select {
  padding: 0.5rem;
  background-color: #2c3e50;
  border: 1px solid #3498db;
  border-radius: 4px;
  color: #ecf0f1;
}

.add-worker select option {
  background-color: #2c3e50;
}

.add-button {
  padding: 0.5rem 1rem;
  background-color: #2ecc71;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
}

.add-button:hover {
  background-color: #27ae60;
}

.add-button:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.resources-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.resource-row {
  background-color: #333;
  padding: 1rem;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.resource-info {
  flex: 1;
}

.resource-name {
  font-weight: bold;
  color: #3498db;
  margin-bottom: 0.25rem;
}

.resource-quantity {
  font-size: 0.9rem;
  color: #95a5a6;
}

.conversion-info {
  flex: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.conversion-details {
  font-size: 0.9rem;
  color: #bdc3c7;
}

.convert-button {
  padding: 0.5rem 1rem;
  background-color: #2c3e50;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.convert-button:hover:not(:disabled) {
  background-color: #3498db;
}

.convert-button.active {
  background-color: #2ecc71;
}

.convert-button:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
  opacity: 0.7;
}

.modal-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.5rem;
}

.modal-tabs button {
  background: none;
  border: none;
  color: #95a5a6;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-tabs button.active {
  color: #3498db;
  border-bottom: 2px solid #3498db;
}

.modal-tabs button:hover {
  color: #3498db;
}

.production-formula {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.formula-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.formula-row:last-child {
  border-bottom: none;
}

.formula-row .label {
  color: rgba(255, 255, 255, 0.7);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  .toggle-button {
    background-color: #34495e;
    color: #ecf0f1;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    &:hover {
      background-color: #2c3e50;
    }

    &.disabled {
      background-color: #c0392b;
      &:hover {
        background-color: #e74c3c;
      }
    }
  }
}
</style> 