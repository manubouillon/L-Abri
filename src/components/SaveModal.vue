<template>
  <div class="modal-overlay" @click="$emit('close')">
    <NotificationSystem ref="notificationSystem" />
    <div class="modal-content" @click.stop>
      <h2>Sauvegardes</h2>
      
      <div class="tabs">
        <button 
          :class="['tab-button', { active: activeTab === 'manual' }]" 
          @click="activeTab = 'manual'"
        >
          Sauvegardes manuelles
        </button>
        <button 
          :class="['tab-button', { active: activeTab === 'auto' }]" 
          @click="activeTab = 'auto'"
        >
          Sauvegardes Auto
        </button>
      </div>

      <div class="save-actions" v-if="activeTab === 'manual'">
        <button @click="createNewSave" class="save-button">
          Sauvegarder l'état actuel
        </button>
        <button @click="resetGame" class="reset-button">
          Réinitialiser le jeu
        </button>
      </div>

      <div class="saves-list">
        <div 
          v-for="save in filteredSaves" 
          :key="save.timestamp" 
          class="save-item" 
          @click="loadSave(save)"
        >
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
import { ref, onMounted, computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import NotificationSystem from './NotificationSystem.vue'
import { useModal } from '../composables/useModal'

useModal()

const gameStore = useGameStore()
const notificationSystem = ref<InstanceType<typeof NotificationSystem> | null>(null)

interface SaveGame {
  timestamp: number
  gameState: any
  population: number
  isAuto: boolean
  isMonthly?: boolean
  gameWeek?: number
}

const saves = ref<SaveGame[]>([])

const activeTab = ref('manual')
const lastAutoSaveWeek = ref(0)

const sortedSaves = computed(() => {
  return [...saves.value].sort((a, b) => b.timestamp - a.timestamp)
})

const filteredSaves = computed(() => {
  return sortedSaves.value.filter(save => 
    activeTab.value === 'manual' ? !save.isAuto : save.isAuto
  )
})

const emit = defineEmits(['close'])

// Exposer la fonction checkMonthlyAutoSave pour qu'elle soit accessible depuis le store
defineExpose({
  checkMonthlyAutoSave
})

onMounted(() => {
  loadSaves()
  
  // Initialiser lastAutoSaveWeek avec la dernière sauvegarde mensuelle
  const monthlySaves = saves.value.filter(s => s.isMonthly)
  if (monthlySaves.length > 0) {
    const lastSave = monthlySaves.sort((a, b) => b.gameWeek! - a.gameWeek!)[0]
    lastAutoSaveWeek.value = lastSave.gameWeek || 0
  }
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
    population: gameStore.population,
    isAuto: false
  }
  
  saves.value.push(newSave)
  localStorage.setItem('abriSavedGames', JSON.stringify(saves.value))
  notificationSystem.value?.addNotification(
    'Sauvegarde réussie',
    'Votre partie a été sauvegardée avec succès',
    'success'
  )
}

function createAutoSave(isMonthly = false) {
  const currentGameWeek = Math.floor(gameStore.gameTime)
  const newSave: SaveGame = {
    timestamp: Date.now(),
    gameState: gameStore.getCurrentState(),
    population: gameStore.population,
    isAuto: true,
    isMonthly,
    gameWeek: currentGameWeek
  }
  
  // Si c'est une sauvegarde mensuelle, on garde que les 120 dernières
  if (isMonthly) {
    const monthlySaves = saves.value.filter(s => s.isMonthly)
    if (monthlySaves.length >= 120) {
      // Supprime les plus anciennes sauvegardes mensuelles
      const oldestSaves = monthlySaves
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(0, monthlySaves.length - 119)
      
      saves.value = saves.value.filter(save => 
        !oldestSaves.some(oldSave => oldSave.timestamp === save.timestamp)
      )
    }
  }
  
  saves.value.push(newSave)
  localStorage.setItem('abriSavedGames', JSON.stringify(saves.value))
}

// Fonction pour vérifier si une sauvegarde mensuelle est nécessaire
function checkMonthlyAutoSave() {
  const currentGameWeek = Math.floor(gameStore.gameTime)
  
  // Sauvegarde tous les 4 semaines (1 mois)
  if (currentGameWeek >= lastAutoSaveWeek.value + 4) {
    createAutoSave(true)
    lastAutoSaveWeek.value = currentGameWeek
  }
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
    // Supprimer toutes les sauvegardes automatiques
    saves.value = saves.value.filter(save => !save.isAuto)
    localStorage.setItem('abriSavedGames', JSON.stringify(saves.value))
    
    // Réinitialiser le compteur de sauvegarde automatique
    lastAutoSaveWeek.value = 0
    
    // Réinitialiser le jeu
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

.tabs {
  display: flex;
  margin-bottom: 2rem;
  border-bottom: 2px solid #2c3e50;
  position: relative;
}

.tab-button {
  flex: 1;
  padding: 1rem 2rem;
  background-color: transparent;
  color: #bdc3c7;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  border-radius: 8px 8px 0 0;
  margin-bottom: -2px;
}

.tab-button.active {
  background-color: #2c3e50;
  color: #3498db;
  border-bottom: 2px solid #3498db;
}

.tab-button:hover:not(.active) {
  background-color: rgba(44, 62, 80, 0.5);
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