<template>
  <div class="game-container">
    <NotificationSystem ref="notificationSystem" />
    <header class="game-header">
      <h1>L'Abri</h1>
      <div class="game-info">
        <div class="happiness">
          Bonheur:<br> {{ globalHappiness }}% 
          {{ globalHappiness >= 90 ? '🥰' : 
             globalHappiness >= 80 ? '😊' :
             globalHappiness >= 70 ? '😌' :
             globalHappiness >= 60 ? '🙂' :
             globalHappiness >= 50 ? '😐' :
             globalHappiness >= 40 ? '😕' :
             globalHappiness >= 30 ? '😟' :
             globalHappiness >= 20 ? '😢' :
             globalHappiness >= 10 ? '😭' : '😡' }}
        </div>
        <div class="population">
          Population:<br>{{ habitants.length }} 🧑
          <button 
            v-if="habitants.filter(h => !h.logement).length > 0" 
            class="warning-button"
            @click="showHabitantsList = true; activeTab = 'logements'"
          >
            ({{ habitants.filter(h => !h.logement).length }} sans abri 🏠❌)
          </button>
        </div>

        <div class="food-quality">
          Qualité nourriture:<br> {{ averageFoodQuality }}/10 {{ foodQualityEmoji }}
        </div>
        <div class="energy-status" :class="{ 'energy-surplus': energyNet > 0, 'energy-deficit': energyNet < 0 }">
          {{ energyNet > 0 ? '+' : '' }}{{ energyNet }} ⚡
        </div>
      </div>
      <div class="game-controls">
        <button @click="showSaveModal = true">💾</button>
        <button @click="showInventory = true">
          Inventaire ({{ Math.floor(inventorySpace.used) }}/{{ Math.floor(inventorySpace.total) }})
        </button>
        <button @click="togglePause">{{ isPaused ? '▶️' : '⏸️' }}</button>
        <div class="game-speed">
          <button @click="decreaseSpeed" :disabled="gameSpeed === 1">-</button>
          <span>x{{ gameSpeed }}</span>
          <button @click="increaseSpeed" :disabled="gameSpeed === 50">+</button>
        </div>
        <button @click="showHabitantsList = true">Habitants</button>
      </div>
    </header>

    <main class="game-main">
      <ResourcePanel class="resources-panel" />

      <div class="silo-container" @wheel="handleScroll">
        <div class="silo-view" :style="{ transform: `translateY(${scrollPosition}px)` }">
          <div class="silo-exterieur"></div>
          <div class="silo-background"></div>
          <div class="silo-levels">
            <SiloLevel
              v-for="level in displayableLevels"
              :key="level.id"
              :level="level"
            />
          </div>
        </div>
      </div>
    </main>

    <HabitantsList 
      v-if="showHabitantsList"
      @close="showHabitantsList = false"
      :initial-tab="activeTab"
    />
    <InventoryModal v-if="showInventory" @close="showInventory = false" />
    <SaveModal v-if="showSaveModal" @close="showSaveModal = false" />
    <DeathModal 
      v-if="showDeathModal" 
      :habitant="deceasedHabitant!"
      @close="showDeathModal = false" 
    />
    <CompetenceTestPanel :tests="competenceTests" />
    <GameOverModal v-if="isGameOver" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, provide } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from './stores/gameStore'
import ResourcePanel from './components/ResourcePanel.vue'
import SiloLevel from './components/SiloLevel.vue'
import HabitantsList from './components/HabitantsList.vue'
import InventoryModal from './components/InventoryModal.vue'
import SaveModal from './components/SaveModal.vue'
import NotificationSystem from './components/NotificationSystem.vue'
import DeathModal from './components/DeathModal.vue'
import CompetenceTestPanel from './components/CompetenceTestPanel.vue'
import GameOverModal from './components/GameOverModal.vue'

// État du jeu
const gameStore = useGameStore()
const { 
  levels, 
  inventorySpace, 
  gameSpeed, 
  globalHappiness, 
  habitants, 
  averageFoodQuality, 
  foodQualityEmoji, 
  showDeathModal, 
  deceasedHabitant, 
  isPaused,
  competenceTests 
} = storeToRefs(gameStore)
const scrollPosition = ref(0)
const showHabitantsList = ref(false)
const showInventory = ref(false)
const showSaveModal = ref(false)
const activeTab = ref('habitants')

// Niveaux affichables (excavés ou excavables)
const displayableLevels = computed(() => {
  return levels.value.filter((level, index) => {
    if (index === 0) return true // Premier niveau toujours visible
    const previousLevel = levels.value[index - 1]
    return previousLevel && previousLevel.isStairsExcavated
  })
})

// Computed pour détecter le game over
const isGameOver = computed(() => habitants.value.length === 0)

// Contrôles du jeu
const togglePause = () => {
  gameStore.togglePause()
}

const increaseSpeed = () => {
  gameStore.increaseGameSpeed()
}

const decreaseSpeed = () => {
  gameStore.decreaseGameSpeed()
}

// Gestion du scroll
const handleScroll = (event: WheelEvent) => {
  const delta = event.deltaY
  scrollPosition.value = Math.max(
    Math.min(scrollPosition.value - delta, 0),
    -2000 // Ajuster selon la hauteur totale du silo
  )
}

// Boucle de jeu
let gameLoop: number

const updateGame = () => {
  if (!isPaused.value) {
    gameStore.update(gameSpeed.value)
  }
  gameLoop = requestAnimationFrame(updateGame)
}

onMounted(() => {
  gameLoop = requestAnimationFrame(updateGame)

  // Écouter les événements d'excavation
  window.addEventListener('excavation-complete', ((event: CustomEvent) => {
    const { title, message, type } = event.detail
    notificationSystem.value?.addNotification(title, message, type)
  }) as EventListener)

  // Écouter les événements de notification
  window.addEventListener('notification', ((event: CustomEvent) => {
    const { title, message, type } = event.detail
    notificationSystem.value?.addNotification(title, message, type)
  }) as EventListener)

  // Ajouter l'écouteur pour la touche Espace
  window.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
      event.preventDefault() // Empêcher le défilement de la page
      togglePause()
    }
  })
})

onUnmounted(() => {
  cancelAnimationFrame(gameLoop)

  // Supprimer les écouteurs d'événements
  window.removeEventListener('excavation-complete', ((event: CustomEvent) => {
    const { title, message, type } = event.detail
    notificationSystem.value?.addNotification(title, message, type)
  }) as EventListener)

  // Supprimer l'écouteur de notification
  window.removeEventListener('notification', ((event: CustomEvent) => {
    const { title, message, type } = event.detail
    notificationSystem.value?.addNotification(title, message, type)
  }) as EventListener)

  // Supprimer l'écouteur de la touche Espace
  window.removeEventListener('keydown', (event) => {
    if (event.code === 'Space') {
      event.preventDefault()
      togglePause()
    }
  })
})

const notificationSystem = ref()

// Fournir le système de notification à tous les composants enfants
provide('notifications', {
  addNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    notificationSystem.value?.addNotification(title, message, type)
  }
})

// Ajouter le calcul du bilan énergétique
const energyNet = computed(() => {
  const energie = gameStore.resourcesList.find(([name]: [string, any]) => name === 'energie')?.[1]
  return energie ? Math.floor(energie.production - energie.consumption) : 0
})
</script>

<style lang="scss">
:root {
  font-family: Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;

  color-scheme: light dark;
  color: #ecf0f1;
  background-color: #2c3e50;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  /* Couleurs des catégories */
  --category-stockage-color: #3498db;
  --category-logements-color: #2ecc71;
  --category-alimentation-color: #e67e22;
  --category-eau-color: #3498db;
  --category-energie-color: #f1c40f;
  --category-sante-color: #e74c3c;
  --category-production-color: #9b59b6;

  /* Couleurs des types de salles */
  --room-stockage-color: var(--category-stockage-color);
  --room-logements-color: var(--category-logements-color);
  --room-alimentation-color: var(--category-alimentation-color);
  --room-eau-color: var(--category-eau-color);
  --room-energie-color: var(--category-energie-color);
  --room-sante-color: var(--category-sante-color);
  --room-production-color: var(--category-production-color);

  /* Couleurs des pièces spécifiques */
  --room-type-chambre-froide-color: var(--category-stockage-color);
  --room-type-entrepot-color: var(--category-stockage-color);
  --room-type-cuve-color: var(--category-eau-color);
  --room-type-dortoir-color: var(--category-logements-color);
  --room-type-quartiers-color: var(--category-logements-color);
  --room-type-appartement-color: var(--category-logements-color);
  --room-type-suite-color: var(--category-logements-color);
  --room-type-cuisine-color: var(--category-alimentation-color);
  --room-type-station-traitement-color: var(--category-eau-color);
  --room-type-generateur-color: var(--category-energie-color);
  --room-type-infirmerie-color: var(--category-sante-color);
  --room-type-serre-color: var(--category-alimentation-color);
  --room-type-raffinerie-color: var(--category-production-color);
  --room-type-derrick-color: var(--category-production-color);
  --room-type-atelier-color: var(--category-production-color);
  --room-type-salle-controle-color: var(--category-production-color);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
}

.game-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #2c3e50;
  color: #ecf0f1;
}

.game-header {
  padding: 1rem;
  background-color: #34495e;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h1 {
    margin: 0;
    font-size: 1.5rem;
    width: 270px;
  }

  .game-header {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .game-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    color: #ecf0f1;
    font-size: 1.1em;
    flex: 1;
    justify-content: space-around;

    .happiness, .food-quality {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .population {
      gap: 0.5rem;
    }

    .warning {
      color: #e74c3c;
      font-size: 0.9em;
    }
  }

  .energy-status {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    transition: all 0.3s ease;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);

    &.energy-surplus {
      background-color: rgba(46, 204, 113, 0.2);
      color: #2ecc71;
      box-shadow: 0 0 10px rgba(46, 204, 113, 0.3);
    }

    &.energy-deficit {
      background-color: rgba(231, 76, 60, 0.2);
      color: #e74c3c;
      box-shadow: 0 0 10px rgba(231, 76, 60, 0.3);
    }
  }

  .game-controls {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .game-speed {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
}

.game-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.resources-panel {
  overflow-y: auto;
}

.silo-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.silo-view {
  position: absolute;
  width: 100%;
  transition: transform 0.1s ease-out;
}

.silo-background {
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: #795548;
}

.silo-levels {
  position: relative;
  z-index: 1;
}

button {
  padding: 0.5rem 1rem;
  background-color: #3498db;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;

  &:hover {
    background-color: #2980b9;
  }

  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
}

.warning-button {
  background: none;
  border: none;
  color: #e74c3c;
  font-size: 0.9em;
  padding: 0.2rem 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(231, 76, 60, 0.1);
    border-radius: 4px;
  }
}
</style>
