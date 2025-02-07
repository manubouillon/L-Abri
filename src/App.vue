<template>
  <div class="game-container">
    <header class="game-header">
      <h1>L'Abri</h1>
      <div class="game-controls">
        <button @click="resetGame">Réinitialiser</button>
        <button @click="togglePause">{{ isPaused ? 'Reprendre' : 'Pause' }}</button>
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
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from './stores/gameStore'
import ResourcePanel from './components/ResourcePanel.vue'
import SiloLevel from './components/SiloLevel.vue'
import HabitantsList from './components/HabitantsList.vue'

// État du jeu
const gameStore = useGameStore()
const { levels } = storeToRefs(gameStore)
const isPaused = ref(false)
const gameSpeed = ref(1)
const scrollPosition = ref(0)
const showHabitantsList = ref(false)

// Niveaux affichables (excavés ou excavables)
const displayableLevels = computed(() => {
  return levels.value.filter((level, index) => {
    if (index === 0) return true // Premier niveau toujours visible
    const previousLevel = levels.value[index - 1]
    return previousLevel && previousLevel.isStairsExcavated
  })
})

// Contrôles du jeu
const togglePause = () => {
  isPaused.value = !isPaused.value
}

const increaseSpeed = () => {
  if (gameSpeed.value < 50) gameSpeed.value++
}

const decreaseSpeed = () => {
  if (gameSpeed.value > 1) gameSpeed.value--
}

const resetGame = () => {
  if (confirm('Êtes-vous sûr de vouloir réinitialiser le jeu ?')) {
    gameStore.resetGame()
  }
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
})

onUnmounted(() => {
  cancelAnimationFrame(gameLoop)
})
</script>

<style lang="scss">
:root {
  --room-stockage-color: #e67e22;
  --room-dortoir-color: #3498db;
  --room-cuisine-color: #e74c3c;
  --room-eau-color: #2980b9;
  --room-energie-color: #f1c40f;
  --room-medical-color: #2ecc71;
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
  width: 250px;
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
</style>
