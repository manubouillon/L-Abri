<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <h2>Détails de l'Eau</h2>

      <div class="water-details">
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
            <li>Habitants ({{ population }} × 1): -{{ population.toFixed(1) }}</li>
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
import { computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import type { Room } from '../stores/gameStore'

const store = useGameStore()

// Calcul des productions d'eau
const productions = computed(() => {
  const prods: { description: string; amount: number }[] = []
  
  store.levels.forEach(level => {
    const allRooms = [...level.leftRooms, ...level.rightRooms]
    allRooms.forEach(room => {
      if (room.isBuilt && room.type === 'station-traitement') {
        const config = store.ROOM_CONFIGS[room.type]
        if (!config || !('productionPerWorker' in config)) return

        const nbWorkers = room.occupants.length
        const gridSize = room.gridSize || 1
        const mergeConfig = store.ROOM_MERGE_CONFIG[room.type]
        const mergeMultiplier = mergeConfig?.useMultiplier 
          ? store.GAME_CONFIG.MERGE_MULTIPLIERS[Math.min(gridSize, 6) as keyof typeof store.GAME_CONFIG.MERGE_MULTIPLIERS] || 1
          : 1

        const production = config.productionPerWorker.eau! * nbWorkers * gridSize * mergeMultiplier
        if (production > 0) {
          prods.push({
            description: `Station de traitement niveau ${level.id + 1} (${nbWorkers}👥 × ${gridSize}📦 × ${mergeMultiplier}✨)`,
            amount: production
          })
        }
      }
    })
  })
  
  return prods
})

// Calcul des consommations d'eau
const consumptions = computed(() => {
  const cons: { description: string; amount: number }[] = []
  
  store.levels.forEach(level => {
    const allRooms = [...level.leftRooms, ...level.rightRooms]
    allRooms.forEach(room => {
      if (room.isBuilt && room.type === 'serre') {
        const gridSize = room.gridSize || 1
        const waterConsumption = 2 * gridSize // 2 unités d'eau par cellule de serre
        
        if (waterConsumption > 0) {
          cons.push({
            description: `Serre niveau ${level.id + 1} (taille ${gridSize})`,
            amount: waterConsumption
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
  consumptions.value.reduce((sum, cons) => sum + cons.amount, 0) + store.population
)

const population = computed(() => store.population)
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

.water-details {
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