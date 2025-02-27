<!-- Panneau d'affichage des tests de compétences -->
<template>
  <div class="competence-test-panel" :class="{ 'minimized': isMinimized }">
    <div class="panel-header" @click="toggleMinimize">
      <h3>Tests de Compétences</h3>
      <button class="minimize-button">
        {{ isMinimized ? '🔼' : '🔽' }}
      </button>
    </div>
    
    <div v-if="!isMinimized" class="panel-content">
      <div class="filter-section">
        <select v-model="selectedRoom" class="filter-select">
          <option value="">Toutes les salles</option>
          <option v-for="room in availableRooms" 
                  :key="room.id" 
                  :value="room.id">
            {{ room.name }}
          </option>
        </select>
        
        <select v-model="selectedHabitant" class="filter-select">
          <option value="">Tous les habitants</option>
          <option v-for="habitant in availableHabitants" 
                  :key="habitant" 
                  :value="habitant">
            {{ habitant }}
          </option>
        </select>
      </div>
      <div class="test-list" ref="testList">
        <div v-for="test in displayedTests" 
             :key="test.id" 
             class="test-item"
             :style="{ borderColor: getResultatColor(test.type) }">
          <div class="test-header">
            <span class="habitant-name">{{ test.habitantNom }}</span>
            <span class="timestamp">{{ formatTimestamp(test.timestamp) }}</span>
          </div>
          <div class="test-details">
            <span class="room-type">{{ getRoomName(test.salle) }}</span>
            <span class="competence">
              {{ formatCompetence(test.competence) }} ({{ test.valeurCompetence }}/10)
            </span>
          </div>
          <div class="test-result" :style="{ color: getResultatColor(test.type) }">
            {{ getResultatEmoji(test.type) }} {{ test.resultat }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { CompetenceTest } from '../services/competenceTestService'
import { getResultatEmoji, getResultatColor } from '../services/competenceTestService'
import { ROOM_TYPES } from '../config/roomsConfig'
import { useGameStore } from '../stores/gameStore'

const props = defineProps<{
  tests: CompetenceTest[]
}>()

const gameStore = useGameStore()
const isMinimized = ref(false)
const testList = ref<HTMLElement | null>(null)
const selectedRoom = ref('')
const selectedHabitant = ref('')

const availableRooms = computed(() => {
  return [...new Set(props.tests.map(test => test.salle))]
    .map(roomId => ({
      id: roomId,
      name: getRoomName(roomId)
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
})

const availableHabitants = computed(() => {
  return [...new Set(props.tests.map(test => test.habitantNom))]
    .sort((a, b) => a.localeCompare(b))
})

// Modifier le computed property displayedTests
const displayedTests = computed(() => {
  let filteredTests = [...props.tests]
  
  if (selectedRoom.value) {
    filteredTests = filteredTests.filter(test => test.salle === selectedRoom.value)
  }
  
  if (selectedHabitant.value) {
    filteredTests = filteredTests.filter(test => test.habitantNom === selectedHabitant.value)
  }
  
  return filteredTests.reverse().slice(0, 10)
})

function toggleMinimize() {
  isMinimized.value = !isMinimized.value
}

function formatTimestamp(timestamp: number): string {
  // Le timestamp est déjà en semaines
  return `Semaine ${Math.floor(timestamp)}`
}

function getRoomName(roomType: string): string {
  return ROOM_TYPES.find(rt => rt.id === roomType)?.name || roomType
}

function formatCompetence(competence: string): string {
  const competenceMap: { [key: string]: string } = {
    force: 'Force',
    dexterite: 'Dextérité',
    charme: 'Charme',
    relations: 'Relations',
    instinct: 'Instinct',
    savoir: 'Savoir'
  }
  return competenceMap[competence] || competence
}
</script>

<style scoped lang="scss">
.competence-test-panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 350px;
  background-color: rgba(44, 62, 80, 0.95);
  border-radius: 8px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  z-index: 1000;
  
  &.minimized {
    height: 40px;
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: rgba(52, 73, 94, 0.95);
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  
  h3 {
    margin: 0;
    color: #ecf0f1;
    font-size: 1.1em;
  }
  
  .minimize-button {
    background: none;
    border: none;
    color: #ecf0f1;
    cursor: pointer;
    font-size: 1.2em;
    padding: 0;
    
    &:hover {
      opacity: 0.8;
    }
  }
}

.panel-content {
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;
}

.filter-section {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.filter-select {
  flex: 1;
  padding: 6px;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ecf0f1;
  font-size: 0.9em;
  
  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.4);
  }
  
  option {
    background-color: #2c3e50;
  }
}

.test-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.test-item {
  background-color: rgba(255, 255, 255, 0.05);
  border-left: 4px solid;
  border-radius: 4px;
  padding: 8px 12px;
  
  .test-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
    
    .habitant-name {
      font-weight: bold;
      color: #ecf0f1;
    }
    
    .timestamp {
      font-size: 0.9em;
      color: #bdc3c7;
    }
  }
  
  .test-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
    
    .room-type {
      color: #95a5a6;
    }
    
    .competence {
      color: #7f8c8d;
      font-size: 0.9em;
    }
  }
  
  .test-result {
    font-size: 1.1em;
    font-weight: bold;
    text-align: right;
  }
}

// Personnalisation de la barre de défilement
.panel-content {
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
    
    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
}
</style> 