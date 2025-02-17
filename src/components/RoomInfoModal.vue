<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <h2>{{ getRoomTitle(room.type) }}</h2>
      
      <div class="modal-tabs">
        <button 
          :class="{ active: activeTab === 'info' }" 
          @click="activeTab = 'info'"
        >
          Informations
        </button>
        <button 
          v-if="room.type !== 'raffinerie'"
          :class="{ active: activeTab === 'equipment' }" 
          @click="activeTab = 'equipment'"
        >
          Équipements
        </button>
        <button 
          v-if="room.type === 'raffinerie'"
          :class="{ active: activeTab === 'production' }" 
          @click="activeTab = 'production'"
        >
          Production
        </button>
      </div>

      <div v-if="activeTab === 'info'">
        <div class="error-message" v-if="errorMessage">{{ errorMessage }}</div>
        
        <div class="production-details">
          <h3>Détails de la salle</h3>
          <div class="production-formula">
            <div class="formula-row" v-if="room.type === 'generateur' || room.type === 'derrick'">
              <span class="label">{{ room.type === 'generateur' ? 'Niveau de carburant:' : 'Progression du forage:' }}</span>
              <div class="fuel-gauge">
                <div class="fuel-bar" :style="{ width: `${room.fuelLevel || 0}%` }"></div>
                <span class="fuel-text">{{ Math.floor(room.fuelLevel || 0) }}%</span>
              </div>
            </div>
            <div class="formula-row" v-if="room.type === 'raffinerie'">
              <span class="label">Consommation d'énergie:</span>
              <span>{{ ROOMS_CONFIG['raffinerie'].energyConsumption }} par semaine</span>
            </div>
            <div class="formula-row">
              <span class="label">Nombre de travailleurs:</span>
              <span>{{ room.occupants.length }}/{{ roomConfig?.maxWorkers ?? 0 }}👥</span>
            </div>
            <div class="formula-row" v-if="room.type === 'raffinerie'">
              <span class="label">Capacité de traitement:</span>
              <span>{{ getProcessingCapacity() }} minerais par semaine</span>
            </div>
            <div class="formula-row">
              <span class="label">Taille de la salle:</span>
              <span>{{ room.gridSize || 1 }}</span>
            </div>
            <div class="formula-row">
              <span class="label">Multiplicateur de fusion:</span>
              <span>{{ getMergeMultiplier }}✨</span>
            </div>
            <div class="formula-row total" v-if="isProductionRoom && room.type !== 'raffinerie'">
              <span class="label">Production totale:</span>
              <span>{{ getTotalProduction }}</span>
            </div>
          </div>
        </div>

        <div v-if="room.type === 'raffinerie'" class="details-section">
          <h3>Production en cours</h3>
          <div class="room-item">
            <div v-if="room.nextMineralsToProcess" class="next-process">
              <div class="process-inputs">
                Entrée :
                <span v-for="(input, index) in room.nextMineralsToProcess.input" :key="index">
                  {{ input.amount }} {{ getItemName(input.type) }}
                  <span v-if="index < room.nextMineralsToProcess.input.length - 1">, </span>
                </span>
              </div>
              <div class="process-output">
                Sortie : {{ room.nextMineralsToProcess.output.amount }} {{ getItemName(room.nextMineralsToProcess.output.type) }}
              </div>
            </div>
            <div v-else class="no-process">
              Pas de minerais à traiter
            </div>
          </div>
        </div>

        <div class="room-info">
          <div v-if="props.room.type === 'cuve'" class="tank-info">
            <h3>Contenu de la cuve</h3>
            <div class="tank-content">
              <div class="content-type">
                <span 
                  class="droplet-icon" 
                  :class="{ 'water': hasCuveEau, 'oil': !hasCuveEau }"
                >💧</span>
                {{ hasCuveEau ? 'Eau' : 'Pétrole' }}
              </div>
              <div class="tank-gauge">
                <div 
                  class="tank-bar" 
                  :class="{ 'water': hasCuveEau, 'oil': !hasCuveEau }"
                  :style="{ width: `${props.room.fuelLevel || 0}%` }"
                ></div>
                <span class="tank-text">{{ Math.floor(props.room.fuelLevel || 0) }}%</span>
              </div>
            </div>
          </div>

          <div class="production" v-if="isProductionRoom">
            <h3>Production par travailleur</h3>
            <div 
              v-for="(amount, resource) in baseProduction" 
              :key="resource"
              class="production-item"
            >
              <span class="resource">{{ resource }}:</span>
              <span class="amount">+{{ amount }}/semaine</span>
            </div>
          </div>

          <div class="storage" v-if="isStorageRoom">
            <h3>Capacité de stockage par travailleur</h3>
            <div 
              v-for="(amount, resource) in storageCapacity" 
              :key="resource"
              class="storage-item"
            >
              <span class="resource">{{ resource }}:</span>
              <span class="amount">+{{ amount }}</span>
            </div>
          </div>

          <div class="logement-info" v-if="isLogementRoom">
            <h3>Occupation du logement</h3>
            <div class="occupation-info">
              {{ props.room.occupants.length }} / {{ getTotalCapacity }} 🧍‍♂️
            </div>
          </div>

          <div class="workers">
            <h3>
              <template v-if="isLogementRoom">
                Habitants ({{ room.occupants.length }}/{{ getTotalCapacity }})
              </template>
              <template v-else>
                Travailleurs ({{ room.occupants.length }}/{{ roomConfig?.maxWorkers ?? 0 }})
              </template>
            </h3>
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

            <div class="add-worker" v-if="canAddOccupant">
              <select v-model="selectedHabitant">
                <option value="">Sélectionner un habitant</option>
                <option 
                  v-for="habitant in availableHabitants" 
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
        <div class="available-equipment" v-if="canAddMoreEquipment">
          <h3>Équipements disponibles</h3>
          <div class="equipment-list">
            <div 
              v-for="(config, type) in availableEquipments" 
              :key="type"
              class="equipment-item"
            >
              <div class="equipment-info">
                <h4>{{ config.nom }}</h4>
                <p>{{ config.description }}</p>
                <p class="construction-time">
                  Temps de construction: {{ config.constructionTime }} semaines
                </p>
              </div>
              <button 
                @click="addEquipment(String(type))"
                :disabled="hasEquipment(String(type))"
              >
                Installer
              </button>
            </div>
          </div>
        </div>

        <div class="installed-equipment">
          <h3>Équipements installés ({{ room.equipments?.length || 0 }}/{{ maxEquipments }})</h3>
          <div class="equipment-list">
            <div 
              v-for="equipment in (room.equipments || [])" 
              :key="equipment.id"
              class="equipment-item"
            >
              <div class="equipment-info">
                <h4>{{ store.EQUIPMENT_CONFIG[props.room.type]?.[equipment.type]?.nom || equipment.type }}</h4>
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
                  <template v-if="equipment.type === 'nurserie'">
                    <NurserieInterface
                      :levelId="props.levelId"
                      :position="props.room.position"
                      :roomIndex="props.room.index"
                      :equipmentId="equipment.id"
                    />
                  </template>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'production' && room.type === 'raffinerie'" class="production-tab">
        <div class="details-section">
          <h3>Conversions disponibles</h3>
          <div class="resources-grid">
            <div v-for="(rule, inputType) in conversionRules" :key="inputType" class="resource-row">
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
                    'active': room.nextMineralsToProcess?.input[0]?.type === rule.inputType
                  }"
                  @click="selectResource(rule.inputType, rule)"
                  :disabled="!canConvertResource(rule.inputType, rule)"
                >
                  {{ room.nextMineralsToProcess?.input[0]?.type === rule.inputType ? 'Sélectionnée' : 'Sélectionner' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button 
          v-if="!isLogementRoom"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '../stores/gameStore'
import { ROOM_MERGE_CONFIG, ROOMS_CONFIG, type ProductionRoomConfig, type StorageRoomConfig, type DortoryRoomConfig } from '../config/roomsConfig'
import { ITEMS_CONFIG, type ItemType } from '../config/itemsConfig'
import type { Room, Equipment } from '../stores/gameStore'
import NurserieInterface from './NurserieInterface.vue'

const props = defineProps<{
  room: Room
  levelId: number
  position: 'left' | 'right'
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update-recipe', recipe: { input: { type: ItemType, amount: number }[], output: { type: ItemType, amount: number } } | null): void
}>()

const store = useGameStore()
const { habitants, gameSpeed } = storeToRefs(store)
const selectedHabitant = ref('')
const selectedResource = ref<ItemType | null>(null)
const activeTab = ref('info')
const errorMessage = ref('')

const roomConfig = computed(() => {
  const config = ROOMS_CONFIG[props.room.type]
  if (!config) return null
  return config
})

const isProductionRoom = computed(() => {
  const config = roomConfig.value
  return config && 'productionPerWorker' in config
})

const baseProduction = computed(() => {
  if (!isProductionRoom.value) return {}
  const config = ROOMS_CONFIG[props.room.type] as ProductionRoomConfig
  
  // Si c'est une serre, gérer les différentes cultures
  if (props.room.type === 'serre') {
    const production: Record<string, number> = {
      'laitue': 2 // Production de base de laitue
    }
    
    // Vérifier les équipements de culture
    const hasTomates = props.room.equipments?.some(e => e.type === 'culture-tomates' && !e.isUnderConstruction)
    const hasAvoine = props.room.equipments?.some(e => e.type === 'culture-avoine' && !e.isUnderConstruction)
    const hasVersSoie = props.room.equipments?.some(e => e.type === 'vers-soie' && !e.isUnderConstruction)
    
    if (hasTomates) {
      production['tomates'] = 1.5
    }
    if (hasAvoine) {
      production['avoine'] = 2
    }
    if (hasVersSoie) {
      production['soie'] = 0.5
    }
    
    return production
  }
  
  // Si c'est un atelier avec équipement de couture
  if (props.room.type === 'atelier') {
    const hasAtelierCouture = props.room.equipments?.some(e => e.type === 'atelier-couture' && !e.isUnderConstruction)
    if (hasAtelierCouture) {
      return { 
        'vetements': 2,
        'soie (consommation)': 4
      }
    }
  }
  
  return config.productionPerWorker as Record<string, number>
})

const isStorageRoom = computed(() => {
  const config = ROOMS_CONFIG[props.room.type]
  return config && 'capacityPerWorker' in config
})

const storageCapacity = computed(() => {
  const config = ROOMS_CONFIG[props.room.type]
  if (!config || !('capacityPerWorker' in config)) return {}
  return (config as StorageRoomConfig).capacityPerWorker
})

const getMergeMultiplier = computed(() => {
  const gridSize = props.room.gridSize || 1
  const mergeConfig = ROOM_MERGE_CONFIG[props.room.type]
  return mergeConfig?.useMultiplier 
    ? store.GAME_CONFIG.MERGE_MULTIPLIERS[Math.min(gridSize, 6) as keyof typeof store.GAME_CONFIG.MERGE_MULTIPLIERS] || 1
    : 1
})

const getTotalProduction = computed(() => {
  if (!isProductionRoom.value) return ''
  const config = ROOMS_CONFIG[props.room.type] as ProductionRoomConfig

  const nbWorkers = props.room.occupants.length
  const gridSize = props.room.gridSize || 1
  const mergeMultiplier = getMergeMultiplier.value

  const productions = []
  
  // Pour la serre, afficher toutes les productions
  if (props.room.type === 'serre') {
    for (const [resource, amount] of Object.entries(baseProduction.value)) {
      const total = amount * nbWorkers * gridSize * mergeMultiplier
      productions.push(`${resource}: +${total.toFixed(1)}/semaine`)
    }
    // Ajouter la consommation d'eau
    const waterConsumption = 2 * gridSize // 2 unités d'eau par cellule de serre
    productions.push(`eau: -${waterConsumption.toFixed(1)}/semaine`)
  }
  // Pour l'atelier, gérer la production de vêtements
  else if (props.room.type === 'atelier') {
    const hasAtelierCouture = props.room.equipments?.some(e => e.type === 'atelier-couture' && !e.isUnderConstruction)
    if (hasAtelierCouture) {
      const soieDisponible = store.getItemQuantity('soie')
      const productionBase = 2 * nbWorkers * gridSize * mergeMultiplier
      productions.push(`vêtements: +${productionBase.toFixed(1)}/semaine`)
      productions.push(`soie: -${(productionBase * 2).toFixed(1)}/semaine`)
      if (soieDisponible === 0) {
        productions.push('(Production arrêtée: pas de soie disponible)')
      }
    }
  }
  // Pour les autres salles
  else {
    for (const [resource, amount] of Object.entries(baseProduction.value)) {
      const total = amount * nbWorkers * gridSize * mergeMultiplier
      if (resource.includes('consommation')) {
        productions.push(`${resource}: -${total.toFixed(1)}/semaine`)
      } else {
        productions.push(`${resource}: +${total.toFixed(1)}/semaine`)
      }
    }
  }

  return productions.join(', ')
})

const isIncubating = ref<boolean>(false)
const incubationStartTime = ref<number>(0)

const maxEquipments = computed(() => props.room.gridSize || 1)

const canAddMoreEquipment = computed(() => 
  (props.room.equipments?.length || 0) < maxEquipments.value
)

const availableEquipments = computed(() => {
  const allEquipments = store.EQUIPMENT_CONFIG[props.room.type] || {}
  const installedTypes = new Set(props.room.equipments?.map(e => e.type) || [])
  
  return Object.fromEntries(
    Object.entries(allEquipments).filter(([type]) => !installedTypes.has(type))
  )
})

const remainingIncubationTime = computed(() => {
  if (!isIncubating.value) return 0
  const nurseryConfig = store.EQUIPMENT_CONFIG.medical.nurserie
  const elapsedTime = store.gameTime - incubationStartTime.value
  return Math.max(0, nurseryConfig.incubationTime! - elapsedTime)
})

const canIncubate = computed(() => {
  return !isIncubating.value && props.room.occupants.length > 0
})

const isLogementRoom = computed(() => {
  return ['dortoir', 'quartiers', 'appartement', 'suite'].includes(props.room.type)
})

const getTotalCapacity = computed(() => {
  if (!isLogementRoom.value) return 0
  const config = roomConfig.value
  if (!config || !('capacityPerResident' in config)) return 0
  return config.capacityPerResident * (props.room.gridSize || 1)
})

const canAddOccupant = computed(() => {
  if (isLogementRoom.value) {
    return props.room.occupants.length < getTotalCapacity.value
  }
  return props.room.occupants.length < (roomConfig.value?.maxWorkers || 0)
})

const availableHabitants = computed(() => {
  if (isLogementRoom.value) {
    // Pour les logements, on peut affecter n'importe quel habitant sans logement
    return habitants.value.filter(h => !h.logement)
  }
  // Pour les autres salles, seulement les adultes sans affectation
  return habitants.value.filter(h => 
    h.affectation.type === null && h.age >= (7 * 52)
  )
})

function getHabitantName(habitantId: string): string {
  const habitant = habitants.value.find(h => h.id === habitantId)
  return habitant ? habitant.nom : 'Inconnu'
}

function retirerHabitant(habitantId: string) {
  errorMessage.value = ''

  if (props.room.type === 'medical' && isIncubating.value) {
    if (props.room.occupants.length <= 1) {
      errorMessage.value = "Impossible de retirer le dernier travailleur pendant une incubation"
      return
    }
  }
  store.retirerHabitantSalle(habitantId, props.room.id)
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

function hasEquipment(equipmentType: string): boolean {
  return props.room.equipments?.some(e => e.type === equipmentType) || false
}

function addEquipment(equipmentType: string) {
  store.addEquipment(
    props.levelId,
    props.room.position,
    props.room.index,
    equipmentType
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

function createNewHabitant() {
  if (isIncubating.value) return
  
  if (props.room.occupants.length === 0) return

  isIncubating.value = true
  incubationStartTime.value = store.gameTime

  const checkInterval = setInterval(() => {
    if (remainingIncubationTime.value <= 0) {
      isIncubating.value = false
      clearInterval(checkInterval)
      
      store.createNewHabitant(
        props.levelId,
        props.room.position,
        props.room.index
      )
    }
  }, 1000)
}

// Vérifie si la cuve contient de l'eau
const hasCuveEau = computed(() => 
  props.room.equipments.some(e => e.type === 'cuve-eau' && !e.isUnderConstruction)
)

function updateRefineryRecipe(recipe: { 
  input: { type: ItemType, amount: number }[],
  output: { type: ItemType, amount: number }
} | null) {
  if (props.room.type === 'raffinerie') {
    props.room.nextMineralsToProcess = recipe || undefined
  }
}

function toggleRoom() {
  props.room.isDisabled = !props.room.isDisabled
}

function getProcessingCapacity(): number {
  const config = ROOMS_CONFIG['raffinerie'] as ProductionRoomConfig
  if (!config || !config.mineralsProcessingPerWorker) return 0
  const nbWorkers = props.room.occupants.length
  const gridSize = props.room.gridSize || 1
  return Math.floor(config.mineralsProcessingPerWorker * nbWorkers * gridSize * getMergeMultiplier.value * store.gameSpeed)
}

function getItemName(type: ItemType | string): string {
  const itemConfig = ITEMS_CONFIG[type as ItemType]
  return itemConfig?.name || String(type)
}

function getRoomTitle(type: string): string {
  const titles: Record<string, string> = {
    'raffinerie': 'Détails de la Raffinerie',
    'generateur': 'Générateur',
    'derrick': 'Derrick',
    'cuve': 'Cuve de stockage',
    'logement': 'Logement'
  }
  return titles[type] || type.charAt(0).toUpperCase() + type.slice(1)
}

const conversionRules = computed(() => {
  const config = ROOMS_CONFIG['raffinerie'] as ProductionRoomConfig
  if (!config || !config.conversionRules) return {}
  return Object.entries(config.conversionRules).reduce((acc, [inputType, rule]) => {
    acc[inputType] = {
      ...rule,
      inputType
    }
    return acc
  }, {} as Record<string, typeof config.conversionRules[string] & { inputType: string }>)
})

function getRequiredResources(rule: { inputType: string, output: ItemType, ratio: number, requires?: Record<string, number> }) {
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

function canConvertResource(inputType: string, rule: { inputType: string, output: ItemType, ratio: number, requires?: Record<string, number> }): boolean {
  const resources = getRequiredResources(rule)
  return resources.every(resource => resource.available >= resource.amount)
}

function selectResource(type: string, rule: { inputType: string, output: ItemType, ratio: number, requires?: Record<string, number> }) {
  selectedResource.value = type as ItemType
  
  if (canConvertResource(type, rule)) {
    const recipe = {
      input: [
        { type: type as ItemType, amount: 1 },
        ...(rule.requires ? Object.entries(rule.requires).map(([reqType, reqAmount]) => ({
          type: reqType as ItemType,
          amount: reqAmount
        })) : [])
      ],
      output: {
        type: rule.output,
        amount: rule.ratio
      }
    }
    
    // Mettre à jour directement la recette dans la salle
    props.room.nextMineralsToProcess = recipe
    // Émettre l'événement pour informer le parent
    emit('update-recipe', recipe)
  } else {
    props.room.nextMineralsToProcess = undefined
    emit('update-recipe', null)
  }
}

function selectFirstAvailableRecipe() {
  const rules = Object.entries(conversionRules.value)
  for (const [type, rule] of rules) {
    if (canConvertResource(type, rule)) {
      selectResource(type, rule)
      return true
    }
  }
  return false
}

// Ajouter un watcher pour initialiser selectedResource avec la recette actuelle
watch(() => props.room.nextMineralsToProcess, (newValue) => {
  if (newValue && newValue.input.length > 0) {
    selectedResource.value = newValue.input[0].type
  } else {
    selectedResource.value = null
  }
}, { immediate: true })

// Surveiller les changements qui pourraient affecter la recette
watch([() => props.room.isDisabled, () => store.gameTime], () => {
  if (props.room.type === 'raffinerie') {
    const currentRecipe = props.room.nextMineralsToProcess
    
    if (currentRecipe) {
      const canProcess = currentRecipe.input.every(({ type, amount }) => 
        store.getItemQuantity(type as ItemType) >= amount
      )
      
      if (!canProcess) {
        // Chercher une nouvelle recette disponible
        const rules = Object.entries(conversionRules.value)
        let recipeFound = false
        
        for (const [type, rule] of rules) {
          if (canConvertResource(type, rule)) {
            selectResource(type, rule)
            recipeFound = true
            break
          }
        }
        
        if (!recipeFound) {
          props.room.nextMineralsToProcess = undefined
          emit('update-recipe', null)
        }
      }
    } else if (!props.room.isDisabled) {
      activeTab.value = 'production'
      const rules = Object.entries(conversionRules.value)
      for (const [type, rule] of rules) {
        if (canConvertResource(type, rule)) {
          selectResource(type, rule)
          break
        }
      }
    }
  }
}, { deep: true })
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: flex-start;
  padding-top: max(100px, 15vh);
  justify-content: center;
  z-index: 1000;
  overflow-y: auto;
}

.modal-content {
  background-color: #34495e;
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 500px;
  width: 90%;
  height: fit-content;
  min-height: 200px;
  position: fixed;
  top: max(50px, 5vh);
  left: 50%;
  transform: translateX(-50%);

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

.nurserie-controls {
  margin-top: 1rem;

  .incubate-button {
    width: 100%;
    background-color: #e67e22;
    
    &:hover:not(:disabled) {
      background-color: #d35400;
    }
    
    &:disabled {
      background-color: #95a5a6;
      cursor: not-allowed;
    }
  }
}

.error-message {
  background-color: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
  padding: 0.5rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
}

.fuel-gauge {
  width: 100px;
  height: 20px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  position: relative;
  overflow: hidden;
}

.fuel-bar {
  height: 100%;
  background-color: #e67e22;
  transition: width 0.3s ease;
}

.fuel-text {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: #ecf0f1;
  font-size: 0.8rem;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
}

.logement-info {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;

  .occupation-info {
    font-size: 1.5rem;
    color: #ecf0f1;
    font-weight: bold;
    margin-top: 0.5rem;
  }
}

.tank-info {
  margin: 1rem 0;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 8px;

  .tank-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .content-type {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.1rem;
    
    .droplet-icon {
      font-size: 1.2rem;
      
      &.water {
        color: #3498db;
        filter: drop-shadow(0 0 2px #3498db);
      }
      
      &.oil {
        color: #8e44ad;
        filter: drop-shadow(0 0 2px #8e44ad);
      }
    }
  }

  .tank-gauge {
    width: 100%;
    height: 12px;
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 6px;
    position: relative;
    overflow: hidden;

    .tank-bar {
      height: 100%;
      transition: width 0.3s ease;
      
      &.water {
        background-color: #3498db;
      }
      
      &.oil {
        background-color: #8e44ad;
      }
    }

    .tank-text {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      color: #ecf0f1;
      font-size: 0.8rem;
      text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
      white-space: nowrap;
    }
  }
}

.production-tab {
  .details-section {
    .resources-grid {
      display: grid;
      gap: 1rem;
    }

    .resource-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem;
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 4px;

      .resource-info {
        .resource-name {
          font-size: 1rem;
          color: #ecf0f1;
        }

        .resource-quantity {
          font-size: 0.8rem;
          color: #95a5a6;
        }
      }

      .conversion-info {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.5rem;

        .conversion-details {
          font-size: 0.8rem;
          color: #95a5a6;
          text-align: right;
        }

        .convert-button {
          padding: 0.25rem 0.5rem;
          background-color: #3498db;
          color: #ecf0f1;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 120px;

          &.active {
            background-color: #2ecc71;
            &:hover {
              background-color: #27ae60;
            }
          }

          &:hover:not(:disabled) {
            background-color: #2980b9;
          }

          &:disabled {
            background-color: #95a5a6;
            cursor: not-allowed;
            opacity: 0.7;
          }
        }
      }
    }
  }
}
</style> 