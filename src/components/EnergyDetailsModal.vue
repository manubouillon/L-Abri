<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <h2>Détails de l'Énergie</h2>

      <div class="energy-details">
        <section class="production">
          <h3>Production ({{ totalProduction.toFixed(1) }}/semaine)</h3>
          <ul>
            <li v-for="(prod, index) in productions" :key="index">
              {{ prod.description }}: +{{ prod.amount.toFixed(1) }}
            </li>
          </ul>
        </section>

        <section class="consumption">
          <h3>Consommation ({{ totalConsumption.toFixed(1) }}/semaine)</h3>
          <ul>
            <li>Habitants ({{ population }} × 2): -{{ (population * 2).toFixed(1) }}</li>
            <li v-for="(cons, index) in consumptions" :key="index">
              {{ cons.description }}: -{{ cons.amount.toFixed(1) }}
            </li>
          </ul>
        </section>

        <section class="net">
          <h3>Bilan: {{ (totalProduction - totalConsumption).toFixed(1) }}/semaine</h3>
        </section>
      </div>

      <button class="close-button" @click="$emit('close')">Fermer</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
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

// Calcul des productions d'énergie
const productions = computed(() => {
  const prods: { description: string; amount: number }[] = []
  
  store.levels.forEach(level => {
    const allRooms = [...level.leftRooms, ...level.rightRooms]
    allRooms.forEach(room => {
      if (room.isBuilt && room.type === 'generateur' && !room.isDisabled) {
        const config = ROOMS_CONFIG[room.type]
        if (!config || !('productionPerWorker' in config)) return

        const nbWorkers = room.occupants.length
        const gridSize = room.gridSize || 1
        const mergeConfig = store.ROOM_MERGE_CONFIG[room.type]
        const mergeMultiplier = mergeConfig?.useMultiplier 
          ? store.GAME_CONFIG.MERGE_MULTIPLIERS[Math.min(gridSize, 6) as keyof typeof store.GAME_CONFIG.MERGE_MULTIPLIERS] || 1
          : 1
        
        // Récupérer les tests de compétence récents pour cette salle
        const recentTests = store.competenceTests.filter(t => 
          t.salle === room.type && 
          room.occupants.includes(t.habitantId)
        ).slice(-3)
        
        const productionBonus = store.calculateProductionBonus(recentTests)

        const production = config.productionPerWorker.energie! * nbWorkers * gridSize * mergeMultiplier * productionBonus
        if (production > 0) {
          prods.push({
            description: `Générateur niveau ${level.id + 1} (${nbWorkers}👥 × ${gridSize}📦 × ${mergeMultiplier}✨ × ${productionBonus}⭐)`,
            amount: production
          })
        }
      }
    })
  })
  
  return prods
})

// Calcul des consommations d'énergie
const consumptions = computed(() => {
  const cons: { description: string; amount: number }[] = []
  
  store.levels.forEach(level => {
    const allRooms = [...level.leftRooms, ...level.rightRooms]
    allRooms.forEach(room => {
      if (room.isBuilt && room.type !== 'generateur') {
        const config = ROOMS_CONFIG[room.type]
        if (!config) return

        const gridSize = room.gridSize || 1
        const consumption = config.energyConsumption * gridSize
        
        if (consumption > 0) {
          cons.push({
            description: `${room.type.charAt(0).toUpperCase() + room.type.slice(1)} niveau ${level.id + 1} (taille ${gridSize})`,
            amount: consumption
          })
        }
      }
    })
  })
  
  return cons
})

const totalProduction = computed(() => 
  productions.value.reduce((sum, prod) => sum + prod.amount, 0)
)

const totalConsumption = computed(() => 
  consumptions.value.reduce((sum, cons) => sum + cons.amount, 0) + (store.population * 2)
)

const population = computed(() => store.population)

function calculateRoomProduction(room: Room): number {
  const config = ROOMS_CONFIG[room.type]
  if (!config || !('productionPerWorker' in config)) return 0
  return 0
}

function calculateRoomConsumption(room: Room): number {
  const config = ROOMS_CONFIG[room.type]
  if (!config) return 0
  return 0
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
  max-height: 80vh;
  overflow-y: auto;

  h2 {
    margin: 0 0 1rem;
    text-align: center;
    color: #ecf0f1;
  }

  h3 {
    margin: 1rem 0 0.5rem;
    font-size: 1.1rem;
    color: #bdc3c7;
  }
}

.energy-details {
  section {
    margin-bottom: 1.5rem;
    
    &:last-child {
      margin-bottom: 0;
    }
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      padding: 0.5rem;
      margin: 0.25rem 0;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }
  }
}

.production li {
  color: #2ecc71;
}

.consumption li {
  color: #e74c3c;
}

.net {
  text-align: center;
  font-size: 1.2rem;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  margin-top: 1.5rem;
}

.close-button {
  display: block;
  width: 100%;
  padding: 0.75rem;
  margin-top: 1.5rem;
  background-color: #3498db;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  font-size: 1rem;

  &:hover {
    background-color: #2980b9;
  }
}
</style> 