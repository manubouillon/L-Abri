<template>
  <button 
    class="toggle-panel-button"
    @click="isPanelVisible = !isPanelVisible"
  >
    {{ isPanelVisible ? '❌' : '📊' }}
  </button>
  <div class="resource-panel" :class="{ 'hidden': !isPanelVisible }">
    <h2>Ressources</h2>
    
    <div class="resources-grid">
      <div 
        v-for="[name, resource] in resourcesList" 
        :key="name"
        class="resource-item"
        :class="{ 
          'resource-surplus': resource.production > resource.consumption,
          'resource-deficit': resource.production < resource.consumption
        }"
      >
        <div class="resource-header">
          <span class="resource-name">
            {{ name }}
            <span v-if="name === 'nourriture'" class="food-quality">
              {{ foodQualityEmoji }}
            </span>
          </span>
          <span v-if="name === 'energie'" class="resource-amount">
            {{ (resource.production - resource.consumption) > 0 ? '+' : '' }}{{ Math.floor(resource.production - resource.consumption) }} ⚡
          </span>
          <span v-else class="resource-amount">{{ Math.floor(resource.amount) }}/{{ resource.capacity }}</span>
          <button v-if="name === 'energie'" 
                  class="details-button"
                  @click="showEnergyDetails = true">
            Détails
          </button>
          <button v-if="name === 'eau'" 
                  class="details-button"
                  @click="showWaterDetails = true">
            Détails
          </button>
          <button v-if="name === 'nourriture'" 
                  class="details-button"
                  @click="showFoodDetails = true">
            Détails
          </button>
          <button v-if="name === 'vetements'" 
                  class="details-button"
                  @click="showClothesDetails = true">
            Détails
          </button>
          <button v-if="name === 'medicaments'" 
                  class="details-button"
                  @click="showMedicineDetails = true">
            Détails
          </button>
        </div>
        
        <div v-if="name !== 'energie'" class="resource-progress">
          <div 
            class="progress-bar"
            :style="{ width: `${(resource.amount / resource.capacity) * 100}%` }"
            :class="{ 'low-level': resource.amount < resource.capacity * 0.2 }"
          ></div>
        </div>
        
        <div class="resource-details">
          <div class="production">
            +{{ (resource.production ?? 0).toFixed(1) }}/semaine
          </div>
          <div class="consumption">
            -{{ (resource.consumption ?? 0).toFixed(1) }}/semaine
          </div>
        </div>
      </div>
    </div>

    <div class="stats">
      <div class="stat-item">
        <span class="stat-label">Population:</span>
        <span class="stat-value">{{ population }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Habitants libres:</span>
        <span class="stat-value">{{ habitantsLibres.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Habitants occupés:</span>
        <span class="stat-value">{{ habitantsOccupes.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Enfants:</span>
        <span class="stat-value">{{ enfants.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Bonheur:</span>
        <span class="stat-value">{{ globalHappiness }}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Date:</span>
        <span class="stat-value">
          <template v-if="formattedTime.years > 0">{{ formattedTime.years }}A </template>
          <template v-if="formattedTime.months > 0">{{ formattedTime.months }}M </template>
          <template v-if="formattedTime.weeks > 0">{{ Math.floor(formattedTime.weeks) }}S </template>
          <template>{{ formattedTime.days }}J </template>
        </span>
      </div>
    </div>

    <EnergyDetailsModal v-if="showEnergyDetails" @close="showEnergyDetails = false" />
    <WaterDetailsModal v-if="showWaterDetails" @close="showWaterDetails = false" />
    <FoodDetailsModal v-if="showFoodDetails" @close="showFoodDetails = false" />
    <ClothesDetailsModal v-if="showClothesDetails" @close="showClothesDetails = false" />
    <MedicineDetailsModal v-if="showMedicineDetails" @close="showMedicineDetails = false" />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import EnergyDetailsModal from './EnergyDetailsModal.vue'
import WaterDetailsModal from './WaterDetailsModal.vue'
import FoodDetailsModal from './FoodDetailsModal.vue'
import ClothesDetailsModal from './ClothesDetailsModal.vue'
import MedicineDetailsModal from './MedicineDetailsModal.vue'

const store = useGameStore()
const { resourcesList, population, happiness, formattedTime, habitantsLibres, habitantsOccupes, enfants } = storeToRefs(store)
const showEnergyDetails = ref(false)
const showWaterDetails = ref(false)
const showFoodDetails = ref(false)
const showClothesDetails = ref(false)
const showMedicineDetails = ref(false)
const gameStore = useGameStore()
const { globalHappiness, averageFoodQuality, foodQualityEmoji } = storeToRefs(gameStore)
const isPanelVisible = ref(window.innerWidth > 768)
</script>

<style lang="scss" scoped>
.resource-panel {
  padding: 1rem;
  background-color: #2c3e50;
  color: #ecf0f1;
  
  h2 {
    margin: 0 0 1rem;
    font-size: 1.2rem;
  }
}

.resources-grid {
  display: grid;
  gap: 1rem;
}

.resource-item {
  background-color: #34495e;
  padding: 0.75rem;
  border-radius: 4px;
  transition: background-color 0.3s ease;

  &.resource-surplus {
    background-color: #2d4f3c; // Vert foncé subtil
  }

  &.resource-deficit {
    background-color: #4f2d2d; // Rouge foncé subtil
  }
}

.resource-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  
  .resource-name {
    text-transform: capitalize;
    font-weight: bold;

    .food-quality {
      font-size: 0.9em;
      opacity: 0.8;
      margin-left: 0.5rem;
    }
  }
}

.resource-progress {
  height: 4px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.5rem;
  
  .progress-bar {
    height: 100%;
    background-color: #2ecc71;
    transition: width 0.3s ease;
    
    &.low-level {
      background-color: #e74c3c;
    }
  }
}

.resource-details {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  
  .production {
    color: #2ecc71;
  }
  
  .consumption {
    color: #e74c3c;
  }
}

.stats {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  
  .stat-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .stat-label {
      color: #bdc3c7;
    }
    
    .stat-value {
      font-weight: bold;
    }
  }
}

.details-button {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  background-color: #3498db;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;

  &:hover {
    background-color: #2980b9;
  }
}

.toggle-panel-button {
  display: none;
  position: fixed;
  bottom: 80px;
  right: 20px;
  z-index: 1000;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #3498db;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding:0;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);

  &:hover {
    background-color: #2980b9;
  }
}

@media (max-width: 768px) {
  .toggle-panel-button {
    display: block;
  }

  .resource-panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 80%;
    max-width: 300px;
    z-index: 999;
    overflow-y: auto;
    transition: transform 0.3s ease;

    &.hidden {
      transform: translateX(100%);
    }
  }
}
</style> 