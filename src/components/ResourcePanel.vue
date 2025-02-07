<template>
  <div class="resource-panel">
    <h2>Ressources</h2>
    
    <div class="resources-grid">
      <div 
        v-for="[name, resource] in resourcesList" 
        :key="name"
        class="resource-item"
      >
        <div class="resource-header">
          <span class="resource-name">{{ name }}</span>
          <span class="resource-amount">{{ Math.floor(resource.amount) }}/{{ resource.capacity }}</span>
        </div>
        
        <div class="resource-progress">
          <div 
            class="progress-bar"
            :style="{ width: `${(resource.amount / resource.capacity) * 100}%` }"
            :class="{ 'low-level': resource.amount < resource.capacity * 0.2 }"
          ></div>
        </div>
        
        <div class="resource-details">
          <div class="production">
            +{{ resource.production }}/s
          </div>
          <div class="consumption">
            -{{ resource.consumption * population }}/s
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
        <span class="stat-value">{{ happiness }}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Date:</span>
        <span class="stat-value">
          <template v-if="formattedTime.years > 0">{{ formattedTime.years }}A </template>
          <template v-if="formattedTime.months > 0">{{ formattedTime.months }}M </template>
          <template v-if="formattedTime.weeks > 0">{{ formattedTime.weeks }}S</template>
          <template v-if="formattedTime.years === 0 && formattedTime.months === 0 && formattedTime.weeks === 0">0S</template>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useGameStore } from '../stores/gameStore'

const store = useGameStore()
const { resourcesList, population, happiness, formattedTime, habitantsLibres, habitantsOccupes, enfants } = storeToRefs(store)
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
}

.resource-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  
  .resource-name {
    text-transform: capitalize;
    font-weight: bold;
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
</style> 