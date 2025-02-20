<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="habitants-list" :class="{ 'logements-tab': activeTab === 'logements', 'has-homeless': habitantsSansLogement.length > 0 }" @click.stop>
      <div class="main-content">
        <div class="modal-header">
          <h2>Gestion de l'Abri</h2>
          <div class="global-happiness">
            Bonheur global : {{ globalHappiness }}%
          </div>
          <button class="close-button" @click="$emit('close')">×</button>
        </div>

        <div class="tabs">
          <button 
            class="tab-button" 
            :class="{ active: activeTab === 'habitants' }"
            @click="activeTab = 'habitants'"
          >
            Habitants
          </button>
          <button 
            class="tab-button" 
            :class="{ active: activeTab === 'logements' }"
            @click="activeTab = 'logements'"
          >
            Logements
          </button>
        </div>

        <!-- Tab Habitants -->
        <div v-if="activeTab === 'habitants'" class="tab-content habitants-grid">
          <div 
            v-for="habitant in habitants" 
            :key="habitant.id"
            class="habitant-card"
            :class="{ 'enfant': isEnfant(habitant.age) }"
          >
            <h3>
              {{ habitant.nom }}
              <span class="genre-icon">{{ habitant.genre === 'H' ? '👨' : '👩' }}</span>
              <span class="age" :class="{ 'age-enfant': isEnfant(habitant.age) }">
                {{ formatAge(habitant.age) }}
                <span v-if="isEnfant(habitant.age)" class="enfant-tag">Enfant</span>
              </span>
            </h3>
            <div class="happiness-indicator">
              <span class="label">Bonheur:</span>
              <div class="bar">
                <div 
                  class="fill" 
                  :style="{ 
                    width: `${habitant.bonheur}%`,
                    backgroundColor: getHappinessColor(habitant.bonheur)
                  }"
                ></div>
              </div>
              <span class="value">{{ habitant.bonheur }}%</span>
            </div>
            <div class="competences">
              <div class="competence">
                <span class="label">Force:</span>
                <div class="bar">
                  <div class="fill" :style="{ width: `${habitant.competences.force * 10}%` }"></div>
                </div>
              </div>
              <div class="competence">
                <span class="label">Dextérité:</span>
                <div class="bar">
                  <div class="fill" :style="{ width: `${habitant.competences.dexterite * 10}%` }"></div>
                </div>
              </div>
              <div class="competence">
                <span class="label">Charme:</span>
                <div class="bar">
                  <div class="fill" :style="{ width: `${habitant.competences.charme * 10}%` }"></div>
                </div>
              </div>
              <div class="competence">
                <span class="label">Relations:</span>
                <div class="bar">
                  <div class="fill" :style="{ width: `${habitant.competences.relations * 10}%` }"></div>
                </div>
              </div>
              <div class="competence">
                <span class="label">Instinct:</span>
                <div class="bar">
                  <div class="fill" :style="{ width: `${habitant.competences.instinct * 10}%` }"></div>
                </div>
              </div>
              <div class="competence">
                <span class="label">Savoir:</span>
                <div class="bar">
                  <div class="fill" :style="{ width: `${habitant.competences.savoir * 10}%` }"></div>
                </div>
              </div>
            </div>
            <div class="affectation">
              <span class="label">Affectation:</span>
              <span class="value">
                <template v-if="habitant.affectation.type === 'salle'">
                  {{ getRoomInfo(habitant.affectation) }}
                </template>
                <template v-else-if="habitant.affectation.type === 'construction'">
                  Construction en cours
                </template>
                <template v-else-if="habitant.affectation.type === 'excavation'">
                  Excavation en cours
                </template>
                <template v-else>
                  Disponible
                </template>
              </span>
            </div>
            <div class="logement">
              <span class="label">Logement:</span>
              <span class="value">
                <template v-if="habitant.logement">
                  {{ getLogementInfo(habitant.logement) }}
                </template>
                <template v-else>
                  Sans logement
                </template>
              </span>
            </div>
          </div>
        </div>

        <!-- Tab Logements -->
        <div v-if="activeTab === 'logements'" class="tab-content">
          <div class="logements-header">
            <div class="logements-stats">
              <div class="stat">
                <span class="label">Habitants sans logement :</span>
                <span class="value">{{ habitantsSansLogement.length }}</span>
              </div>
              <div class="stat">
                <span class="label">Logements disponibles :</span>
                <span class="value">{{ logementsDisponibles }}</span>
              </div>
            </div>
            <button 
              class="auto-assign-button"
              :disabled="habitantsSansLogement.length === 0 || logementsDisponibles === 0"
              @click="handleAutoAssign"
            >
              <span class="icon">🏠</span>
              Attribuer automatiquement
            </button>
          </div>
          
          <div v-if="niveauxAvecLogements.length === 0" class="no-content-message">
            Aucun logement disponible dans l'abri
          </div>
          
          <div v-else class="logements-grid">
            <div 
              v-for="level in niveauxAvecLogements" 
              :key="level.id" 
              class="level-section"
            >
              <h3 class="level-title">
                Niveau {{ level.id + 1 }}
                <span class="level-stats">
                  ({{ getLogementsOccupes(level) }}/{{ getTotalLogements(level) }} occupés)
                </span>
              </h3>
              
              <div class="rooms-container">
                <!-- Salles de gauche -->
                <div class="rooms-column">
                  <template v-for="(room, index) in level.leftRooms" :key="`left-${index}`">
                    <div 
                      v-if="isLogementRoom(room?.type) && room?.isBuilt"
                      class="room-card"
                      :class="{ 
                        'room-full': isRoomFull(level.id, 'left', index),
                        'drag-over': isDragOver(level.id, 'left', index)
                      }"
                      @dragover.prevent="handleDragOver($event, level.id, 'left', index)"
                      @dragleave="handleDragLeave($event, level.id, 'left', index)"
                      @drop="handleDrop($event, level.id, 'left', index)"
                    >
                      <div class="room-header">
                        <span class="room-type">{{ getRoomName(room.type) }}</span>
                        <span class="room-position">(Gauche)</span>
                      </div>
                      <div class="room-occupants">
                        <div 
                          v-for="habitant in getOccupants(level.id, 'left', index)"
                          :key="habitant.id"
                          class="occupant"
                          draggable="true"
                          @dragstart="handleDragStart($event, habitant)"
                          @dragend="handleDragEnd"
                        >
                          {{ habitant.nom }}
                          <div class="occupant-info">
                            <span class="genre-icon">{{ habitant.genre === 'H' ? '👨' : '👩' }}</span>
                            <span class="bonheur-icon" :style="{ color: getHappinessColor(habitant.bonheur) }">
                              {{ getHappinessEmoji(habitant.bonheur) }}
                            </span>
                          </div>
                        </div>
                        <div 
                          v-if="getOccupants(level.id, 'left', index).length === 0" 
                          class="no-occupants"
                        >
                          Vacant
                        </div>
                      </div>
                    </div>
                  </template>
                </div>

                <!-- Salles de droite -->
                <div class="rooms-column">
                  <template v-for="(room, index) in level.rightRooms" :key="`right-${index}`">
                    <div 
                      v-if="isLogementRoom(room?.type) && room?.isBuilt"
                      class="room-card"
                      :class="{ 
                        'room-full': isRoomFull(level.id, 'right', index),
                        'drag-over': isDragOver(level.id, 'right', index)
                      }"
                      @dragover.prevent="handleDragOver($event, level.id, 'right', index)"
                      @dragleave="handleDragLeave($event, level.id, 'right', index)"
                      @drop="handleDrop($event, level.id, 'right', index)"
                    >
                      <div class="room-header">
                        <span class="room-type">{{ getRoomName(room.type) }}</span>
                        <span class="room-position">(Droite)</span>
                      </div>
                      <div class="room-occupants">
                        <div 
                          v-for="habitant in getOccupants(level.id, 'right', index)"
                          :key="habitant.id"
                          class="occupant"
                          draggable="true"
                          @dragstart="handleDragStart($event, habitant)"
                          @dragend="handleDragEnd"
                        >
                          {{ habitant.nom }}
                          <div class="occupant-info">
                            <span class="genre-icon">{{ habitant.genre === 'H' ? '👨' : '👩' }}</span>
                            <span class="bonheur-icon" :style="{ color: getHappinessColor(habitant.bonheur) }">
                              {{ getHappinessEmoji(habitant.bonheur) }}
                            </span>
                          </div>
                        </div>
                        <div 
                          v-if="getOccupants(level.id, 'right', index).length === 0" 
                          class="no-occupants"
                        >
                          Vacant
                        </div>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Liste des habitants sans logement -->
      <div class="sans-logement" v-if="activeTab === 'logements' && habitantsSansLogement.length > 0">
        <h3>Habitants sans logement ({{ habitantsSansLogement.length }})</h3>
        <div class="habitants-sans-logement">
          <div 
            v-for="habitant in habitantsSansLogement" 
            :key="habitant.id"
            class="occupant"
            draggable="true"
            @dragstart="handleDragStart($event, habitant)"
            @dragend="handleDragEnd"
          >
            {{ habitant.nom }}
            <div class="occupant-info">
              <span class="genre-icon">{{ habitant.genre === 'H' ? '👨' : '👩' }}</span>
              <span class="bonheur-icon" :style="{ color: getHappinessColor(habitant.bonheur) }">
                {{ getHappinessEmoji(habitant.bonheur) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useGameStore } from '../stores/gameStore'
import type { Habitant, Room, Level } from '../stores/gameStore'
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { ROOMS_CONFIG, ROOM_TYPES } from '../config/roomsConfig'

const store = useGameStore()
const { habitants, globalHappiness, levels } = storeToRefs(store)

interface DragOverState {
  levelId: number | null;
  position: 'left' | 'right' | null;
  index: number | null;
}

const draggedHabitant = ref<Habitant | null>(null)
const dragOverRoom = ref<DragOverState>({ levelId: null, position: null, index: null })

const emit = defineEmits<{
  (e: 'close'): void
}>()

const props = defineProps<{
  initialTab?: string
}>()

const activeTab = ref(props.initialTab || 'habitants')

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})

function handleDragStart(event: DragEvent, habitant: Habitant) {
  draggedHabitant.value = habitant
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function handleDragEnd() {
  draggedHabitant.value = null
}

function handleDragOver(event: DragEvent, levelId: number, position: 'left' | 'right', index: number) {
  if (!draggedHabitant.value) return
  
  const room = position === 'left' 
    ? levels.value[levelId].leftRooms[index] 
    : levels.value[levelId].rightRooms[index]
  
  if (!isLogementRoom(room.type) || !room.isBuilt) return
  if (isRoomFull(levelId, position, index)) return
  
  dragOverRoom.value = { levelId, position, index }
}

function handleDragLeave(event: DragEvent, levelId: number, position: 'left' | 'right', index: number) {
  if (dragOverRoom.value.levelId === levelId && 
      dragOverRoom.value.position === position && 
      dragOverRoom.value.index === index) {
    dragOverRoom.value = { levelId: null, position: null, index: null }
  }
}

function handleDrop(event: DragEvent, levelId: number, position: 'left' | 'right', index: number) {
  event.preventDefault()
  
  if (!draggedHabitant.value) return
  
  const room = position === 'left' 
    ? levels.value[levelId].leftRooms[index] 
    : levels.value[levelId].rightRooms[index]
  
  if (!isLogementRoom(room.type) || !room.isBuilt) return
  if (isRoomFull(levelId, position, index)) return
  
  // Utiliser la méthode du store pour affecter l'habitant au logement
  store.affecterHabitantSalle(draggedHabitant.value.id, levelId, position, index)
  
  draggedHabitant.value = null
  dragOverRoom.value = { levelId: null, position: null, index: null }
}

function isDragOver(levelId: number, position: 'left' | 'right', index: number): boolean {
  return dragOverRoom.value.levelId === levelId && 
         dragOverRoom.value.position === position && 
         dragOverRoom.value.index === index
}

function getRoomInfo(affectation: Habitant['affectation']): string {
  if (affectation.type !== 'salle') return 'Inconnu'
  
  const level = store.levels.find(l => l.id === affectation.levelId)
  if (!level) return 'Inconnu'

  const room = affectation.position === 'left'
    ? level.leftRooms[affectation.roomIndex!]
    : level.rightRooms[affectation.roomIndex!]

  if (!room) return 'Inconnu'

  return `${room.type} (Niveau ${level.id + 1})`
}

function getLogementInfo(logement: Habitant['logement']): string {
  if (!logement) return 'Sans logement'
  
  const level = store.levels.find(l => l.id === logement.levelId)
  if (!level) return 'Inconnu'

  const room = logement.position === 'left'
    ? level.leftRooms[logement.roomIndex]
    : level.rightRooms[logement.roomIndex]

  if (!room) return 'Inconnu'

  return `${room.type} (Niveau ${level.id + 1})`
}

function getHappinessColor(happiness: number): string {
  if (happiness >= 80) return '#4CAF50' // Vert
  if (happiness >= 60) return '#8BC34A' // Vert clair
  if (happiness >= 40) return '#FFC107' // Jaune
  if (happiness >= 20) return '#FF9800' // Orange
  return '#F44336' // Rouge
}

function isEnfant(age: number): boolean {
  return age < (7 * 52) // Moins de 7 ans en semaines
}

function formatAge(age: number): string {
  const ageEnAnnees = Math.floor(age / 52)
  if (isEnfant(age)) {
    // Pour les enfants, afficher aussi les mois
    const mois = Math.floor((age % 52) / 4)
    if (ageEnAnnees === 0) {
      return `${mois} mois`
    }
    return `${ageEnAnnees} ans ${mois} mois`
  }
  return `${ageEnAnnees} ans`
}

function getOccupants(levelId: number, position: 'left' | 'right', roomIndex: number): Habitant[] {
  return habitants.value.filter(h => 
    h.logement && 
    h.logement.levelId === levelId && 
    h.logement.position === position && 
    h.logement.roomIndex === roomIndex
  )
}

// Computed properties pour les logements
const habitantsSansLogement = computed(() => {
  return habitants.value.filter(h => !h.logement)
})

const niveauxAvecLogements = computed(() => {
  return levels.value.filter(level => {
    const hasLeftLogement = level.leftRooms.some(room => isLogementRoom(room.type) && room.isBuilt)
    const hasRightLogement = level.rightRooms.some(room => isLogementRoom(room.type) && room.isBuilt)
    return level.isStairsExcavated && (hasLeftLogement || hasRightLogement)
  })
})

const logementsDisponibles = computed(() => {
  let total = 0
  niveauxAvecLogements.value.forEach(level => {
    level.leftRooms.forEach((room, index) => {
      if (isLogementRoom(room.type) && room.isBuilt) {
        const occupants = getOccupants(level.id, 'left', index)
        total += Math.max(0, getRoomCapacity(room) - occupants.length)
      }
    })
    level.rightRooms.forEach((room, index) => {
      if (isLogementRoom(room.type) && room.isBuilt) {
        const occupants = getOccupants(level.id, 'right', index)
        total += Math.max(0, getRoomCapacity(room) - occupants.length)
      }
    })
  })
  return total
})

function isLogementRoom(type: string): boolean {
  return ['dortoir', 'quartiers', 'appartement', 'suite'].includes(type)
}

function getRoomCapacity(room: Room): number {
  const config = ROOMS_CONFIG[room.type]
  if (!config || !('capacityPerResident' in config)) return 2
  return (config.capacityPerResident * (room.gridSize || 1))
}

function isRoomFull(levelId: number, position: 'left' | 'right', roomIndex: number): boolean {
  const level = levels.value.find(l => l.id === levelId)
  if (!level) return false
  
  const room = position === 'left' ? level.leftRooms[roomIndex] : level.rightRooms[roomIndex]
  if (!room) return false
  
  const occupants = getOccupants(levelId, position, roomIndex)
  return occupants.length >= getRoomCapacity(room)
}

function getLogementsOccupes(level: Level): number {
  let occupied = 0
  level.leftRooms.forEach((room, index) => {
    if (isLogementRoom(room.type) && room.isBuilt) {
      occupied += getOccupants(level.id, 'left', index).length
    }
  })
  level.rightRooms.forEach((room, index) => {
    if (isLogementRoom(room.type) && room.isBuilt) {
      occupied += getOccupants(level.id, 'right', index).length
    }
  })
  return occupied
}

function getTotalLogements(level: Level): number {
  let total = 0
  level.leftRooms.forEach(room => {
    if (isLogementRoom(room.type) && room.isBuilt) {
      total += getRoomCapacity(room)
    }
  })
  level.rightRooms.forEach(room => {
    if (isLogementRoom(room.type) && room.isBuilt) {
      total += getRoomCapacity(room)
    }
  })
  return total
}

function getHappinessEmoji(happiness: number): string {
  if (happiness >= 80) return '😄'
  if (happiness >= 60) return '😊'
  if (happiness >= 40) return '😐'
  if (happiness >= 20) return '😟'
  return '😢'
}

function getRoomName(type: string): string {
  const roomType = ROOM_TYPES.find(rt => rt.id === type)
  return roomType ? roomType.name : type
}

function handleAutoAssign() {
  // Trier les habitants sans logement par âge (les plus âgés d'abord)
  const habitantsALoger = [...habitantsSansLogement.value].sort((a, b) => b.age - a.age)
  
  // Pour chaque niveau avec des logements
  for (const level of niveauxAvecLogements.value) {
    // Vérifier les salles de gauche et de droite
    for (const position of ['left', 'right'] as const) {
      const rooms = position === 'left' ? level.leftRooms : level.rightRooms
      
      // Pour chaque salle
      rooms.forEach((room, index) => {
        // Si c'est un logement construit et qu'il n'est pas plein
        if (isLogementRoom(room.type) && room.isBuilt && !isRoomFull(level.id, position, index)) {
          // Tant qu'il y a des habitants à loger et de la place
          while (habitantsALoger.length > 0 && !isRoomFull(level.id, position, index)) {
            const habitant = habitantsALoger.shift()
            if (habitant) {
              store.affecterHabitantSalle(habitant.id, level.id, position, index)
            }
          }
        }
      })
    }
  }
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

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;

  h2 {
    margin: 0;
  }

  .close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #ecf0f1;
    cursor: pointer;
    padding: 0.5rem;
    line-height: 1;

    &:hover {
      color: #e74c3c;
    }
  }
}

.habitants-list {
  padding: 1rem;
  background-color: #34495e;
  border-radius: 8px;
  width: 95%;
  max-width: 1400px;
  height: 90vh;
  margin: 2rem auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  position: relative;

  &.logements-tab {
    grid-template-columns: 1fr;

    &.has-homeless {
      grid-template-columns: 1fr 300px;
    }
  }

  .main-content {
    overflow-y: auto;
    padding-right: 1rem;
  }

  .sans-logement {
    background-color: #2c3e50;
    border-radius: 8px;
    padding: 1rem;
    position: sticky;
    top: 0;
    height: fit-content;
    max-height: calc(90vh - 2rem);
    overflow-y: auto;

    h3 {
      color: #ecf0f1;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .habitants-sans-logement {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .no-habitants {
      color: #95a5a6;
      font-style: italic;
      text-align: center;
      padding: 1rem 0;
    }
  }
}

.habitants-grid {
  padding: 1rem;
  overflow-y: auto;
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  align-content: start;
}

.habitant-card {
  background-color: #2c3e50;
  border-radius: 4px;
  padding: 1rem;

  h3 {
    margin: 0 0 1rem;
    color: #ecf0f1;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .genre-icon {
      font-size: 1rem;
    }
  }
}

.competences {
  display: grid;
  gap: 0.5rem;
}

.competence {
  display: grid;
  grid-template-columns: 100px 1fr;
  align-items: center;
  gap: 0.5rem;

  .label {
    color: #bdc3c7;
    font-size: 0.9rem;
  }

  .bar {
    height: 8px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;

    .fill {
      height: 100%;
      background-color: #3498db;
      transition: width 0.3s ease;
    }
  }
}

.affectation {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;

  .label {
    color: #bdc3c7;
  }

  .value {
    color: #ecf0f1;
    font-weight: bold;
  }
}

.logement {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;

  .label {
    color: #bdc3c7;
  }

  .value {
    color: #ecf0f1;
    font-weight: bold;
  }
}

.global-happiness {
  font-size: 1.2em;
  color: #ecf0f1;
  margin-right: 20px;
}

.happiness-indicator {
  margin: 10px 0;
}

.happiness-indicator .bar {
  height: 12px;
  background-color: #eee;
  border-radius: 6px;
  overflow: hidden;
  margin: 0 5px;
  flex-grow: 1;
}

.happiness-indicator .fill {
  height: 100%;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.happiness-indicator {
  display: flex;
  align-items: center;
  gap: 5px;
}

.happiness-indicator .label {
  min-width: 70px;
}

.happiness-indicator .value {
  min-width: 45px;
  text-align: right;
}

.age {
  font-size: 0.9rem;
  color: #bdc3c7;
  margin-left: auto;
}

.enfant {
  border: 2px solid #e74c3c;
  position: relative;
}

.age-enfant {
  color: #e74c3c;
}

.enfant-tag {
  font-size: 0.8rem;
  background-color: #e74c3c;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 6px;
}

.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.5rem;
}

.tab-button {
  background: none;
  border: none;
  color: #bdc3c7;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 1rem;
  border-radius: 4px;
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  &.active {
    color: #3498db;
    background-color: rgba(52, 152, 219, 0.1);
  }
}

.tab-content {
  flex: 1;
  overflow-y: auto;
}

.placeholder-message {
  color: #bdc3c7;
  text-align: center;
  padding: 2rem;
  font-style: italic;
}

.logements-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding: 0 1rem;
}

.auto-assign-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #2980b9;
  }

  .icon {
    font-size: 1.2rem;
  }
}

.logements-grid {
  padding: 0 1rem;
}

.level-section {
  margin-bottom: 2rem;

  &:last-child {
    margin-bottom: 0;
  }
}

.level-title {
  color: #ecf0f1;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.rooms-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.rooms-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.room-card {
  background-color: #2c3e50;
  border-radius: 4px;
  padding: 1rem;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  color: #ecf0f1;

  .room-type {
    font-weight: bold;
  }

  .room-position {
    font-size: 0.9rem;
    color: #bdc3c7;
  }
}

.room-occupants {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.occupant {
  cursor: grab;
  user-select: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  
  &:active {
    cursor: grabbing;
  }

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
}

.occupant-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 0.5rem;
}

.genre-icon, .bonheur-icon {
  font-size: 1rem;
  display: flex;
  align-items: center;
}

.no-occupants {
  color: #95a5a6;
  font-style: italic;
  text-align: center;
  padding: 0.5rem 0;
}

.logements-stats {
  display: flex;
  gap: 2rem;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ecf0f1;

  .label {
    color: #bdc3c7;
  }

  .value {
    font-weight: bold;
    font-size: 1.1rem;
  }
}

.level-stats {
  font-size: 0.9rem;
  color: #bdc3c7;
  font-weight: normal;
  margin-left: 0.5rem;
}

.room-card {
  &.drag-over {
    border: 2px dashed #3498db;
    background-color: rgba(52, 152, 219, 0.1);
  }
  
  &.room-full {
    cursor: not-allowed;
  }
}

.no-content-message {
  color: #bdc3c7;
  text-align: center;
  padding: 2rem;
  font-style: italic;
}

.auto-assign-button {
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    
    &:hover {
      background-color: #3498db;
    }
  }
}
</style> 