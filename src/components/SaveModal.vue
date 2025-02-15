<template>
  <div class="modal-overlay" @click="$emit('close')">
    <NotificationSystem ref="notificationSystem" />
    <div class="modal-content" @click.stop>
      <h2>Sauvegardes</h2>
      
      <div class="save-actions">
        <button @click="createNewSave" class="save-button">
          Sauvegarder l'état actuel
        </button>
        <button @click="resetGame" class="reset-button">
          Réinitialiser le jeu
        </button>
      </div>

      <div class="saves-list">
        <div v-for="save in saves" :key="save.timestamp" class="save-item" @click="loadSave(save)">
          <div class="save-info">
            <div class="save-date">{{ formatDate(save.timestamp) }}</div>
            <div class="save-details">
              Niveau max: {{ getMaxLevel(save) }} | 
              Population: {{ save.population }} habitants
            </div>
          </div>
          <button class="delete-button" @click.stop="deleteSave(save)">×</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGameStore } from '../stores/gameStore'
import NotificationSystem from './NotificationSystem.vue'

const gameStore = useGameStore()
const notificationSystem = ref<InstanceType<typeof NotificationSystem> | null>(null)

interface SaveGame {
  timestamp: number
  gameState: any
  population: number
}

const saves = ref<SaveGame[]>([])

const emit = defineEmits(['close'])

onMounted(() => {
  loadSaves()
})

function loadSaves() {
  const savedGames = localStorage.getItem('abriSavedGames')
  if (savedGames) {
    saves.value = JSON.parse(savedGames)
  }
}

function createNewSave() {
  const newSave: SaveGame = {
    timestamp: Date.now(),
    gameState: gameStore.getCurrentState(),
    population: gameStore.population
  }
  
  saves.value.push(newSave)
  localStorage.setItem('abriSavedGames', JSON.stringify(saves.value))
  notificationSystem.value?.addNotification(
    'Sauvegarde réussie',
    'Votre partie a été sauvegardée avec succès',
    'success'
  )
}

function loadSave(save: SaveGame) {
  if (confirm('Êtes-vous sûr de vouloir charger cette sauvegarde ? Les données non sauvegardées seront perdues.')) {
    gameStore.loadState(save.gameState)
    notificationSystem.value?.addNotification(
      'Chargement réussi',
      'La sauvegarde a été chargée avec succès',
      'success'
    )
    emit('close')
  }
}

function deleteSave(save: SaveGame) {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette sauvegarde ?')) {
    saves.value = saves.value.filter(s => s.timestamp !== save.timestamp)
    localStorage.setItem('abriSavedGames', JSON.stringify(saves.value))
  }
}

function resetGame() {
  if (confirm('Êtes-vous sûr de vouloir réinitialiser le jeu ? Toute progression sera perdue.')) {
    gameStore.resetGame()
    emit('close')
  }
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getMaxLevel(save: SaveGame): number {
  return save.gameState.levels.filter((l: any) => l.isStairsExcavated).length
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #34495e;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

h2 {
  margin-bottom: 1.5rem;
  color: #ecf0f1;
}

.save-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.save-button {
  background-color: #2ecc71;
}

.reset-button {
  background-color: #e74c3c;
}

.saves-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.save-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #2c3e50;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.save-item:hover {
  background-color: #243342;
}

.save-info {
  flex: 1;
}

.save-date {
  font-weight: bold;
  color: #3498db;
  margin-bottom: 0.25rem;
}

.save-details {
  color: #bdc3c7;
  font-size: 0.9rem;
}

.delete-button {
  background-color: transparent;
  color: #e74c3c;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  line-height: 1;
  border-radius: 4px;
}

.delete-button:hover {
  background-color: rgba(231, 76, 60, 0.1);
}

button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover {
  filter: brightness(1.1);
}
</style> 