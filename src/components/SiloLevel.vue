<template>
  <div 
    class="silo-level" 
    :class="{
      'stairs-excavated': level.isStairsExcavated
    }"
  >
    <div class="level-content" v-if="level.isStairsExcavated">
      <div class="level-rooms">
        <!-- Salles de gauche -->
        <div class="rooms-side left-side">
          <div 
            v-for="room in level.leftRooms"
            :key="room.id"
            class="room"
            :class="{
              'is-excavated': room.isExcavated,
              'is-built': room.isBuilt,
              [`room-type-${room.type}`]: room.isBuilt,
              'no-border-right': !shouldShowRightBorder(room, 'left'),
              [`grid-size-${room.gridSize || 1}`]: room.isBuilt
            }"
            :style="getRoomStyle(room)"
            @click="handleRoomClick('left', room)"
          >
            <template v-if="room.isBuilt">
              <div class="room-info" @click="openRoomInfo(room)">
                <span class="room-type">{{ room.type }}</span>
                <span class="room-size" v-if="room.gridSize && room.gridSize > 1">x{{ room.gridSize }}</span>
                <div class="room-occupants">
                  <div class="occupant" v-for="occupant in room.occupants" :key="occupant">
                    {{ getHabitantName(occupant) }}
                  </div>
                </div>
              </div>
            </template>
            <div class="room-overlay" v-else-if="room.isExcavated" @click="openRoomTypeModal('left', room.index)">
              <template v-if="room.isUnderConstruction">
                <div class="construction-progress">
                  <div 
                    class="progress-bar"
                    :style="{ width: `${getConstructionProgress(room)}%` }"
                  ></div>
                  <div class="remaining-time">Construction: {{ getRemainingConstructionTime(room) }} semaines</div>
                </div>
              </template>
              <template v-else>
                <span class="empty-room-text" v-if="habitantsLibres.length > 0">Cliquez pour construire</span>
                <span class="empty-room-text error" v-else>Pas d'habitant disponible</span>
              </template>
            </div>
            <div class="room-overlay" v-else>
              <template v-if="canExcavateRoom('left', room.index)">
                <button 
                  v-if="!isExcavating('left', room.index) && habitantsLibres.length > 0"
                  @click.stop="excavateRoom('left', room.index)"
                >
                  Excaver
                </button>
                <span class="empty-room-text error" v-else-if="!isExcavating('left', room.index)">
                  Pas d'habitant disponible
                </span>
                <div v-else class="excavation-progress">
                  <div 
                    class="progress-bar"
                    :style="{ width: `${getExcavationInfo('left', room.index).progress}%` }"
                  ></div>
                  <div class="remaining-time">{{ getExcavationInfo('left', room.index).remainingWeeks }} semaines</div>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Escalier central -->
        <div class="stairs">
          <div class="stairs-inner">
            <span class="level-number">{{ level.id + 1 }}</span>
          </div>
          <div class="stairs-overlay" v-if="!level.isStairsExcavated && canExcavateStairs">
            <template v-if="!isExcavatingStairs && habitantsLibres.length > 0">
              <button @click="excavateStairs">Excaver</button>
            </template>
            <span class="empty-room-text error" v-else-if="!isExcavatingStairs">
              Pas d'habitant disponible
            </span>
            <div v-else class="excavation-progress">
              <div 
                class="progress-bar"
                :style="{ width: `${stairsExcavationInfo.progress}%` }"
              ></div>
              <div class="remaining-time">{{ stairsExcavationInfo.remainingWeeks }} semaines</div>
            </div>
          </div>
        </div>

        <!-- Salles de droite -->
        <div class="rooms-side right-side">
          <div 
            v-for="room in level.rightRooms"
            :key="room.id"
            class="room"
            :class="{
              'is-excavated': room.isExcavated,
              'is-built': room.isBuilt,
              [`room-type-${room.type}`]: room.isBuilt,
              'no-border-left': !shouldShowLeftBorder(room, 'right'),
              [`grid-size-${room.gridSize || 1}`]: room.isBuilt
            }"
            :style="getRoomStyle(room)"
            @click="handleRoomClick('right', room)"
          >
            <template v-if="room.isBuilt">
              <div class="room-info" @click="openRoomInfo(room)">
                <span class="room-type">{{ room.type }}</span>
                <span class="room-size" v-if="room.gridSize && room.gridSize > 1">x{{ room.gridSize }}</span>
                <div class="room-occupants">
                  <div class="occupant" v-for="occupant in room.occupants" :key="occupant">
                    {{ getHabitantName(occupant) }}
                  </div>
                </div>
              </div>
            </template>
            <div class="room-overlay" v-else-if="room.isExcavated" @click="openRoomTypeModal('right', room.index)">
              <template v-if="room.isUnderConstruction">
                <div class="construction-progress">
                  <div 
                    class="progress-bar"
                    :style="{ width: `${getConstructionProgress(room)}%` }"
                  ></div>
                  <div class="remaining-time">Construction: {{ getRemainingConstructionTime(room) }} semaines</div>
                </div>
              </template>
              <template v-else>
                <span class="empty-room-text" v-if="habitantsLibres.length > 0">Cliquez pour construire</span>
                <span class="empty-room-text error" v-else>Pas d'habitant disponible</span>
              </template>
            </div>
            <div class="room-overlay" v-else>
              <template v-if="canExcavateRoom('right', room.index)">
                <button 
                  v-if="!isExcavating('right', room.index) && habitantsLibres.length > 0"
                  @click.stop="excavateRoom('right', room.index)"
                >
                  Excaver
                </button>
                <span class="empty-room-text error" v-else-if="!isExcavating('right', room.index)">
                  Pas d'habitant disponible
                </span>
                <div v-else class="excavation-progress">
                  <div 
                    class="progress-bar"
                    :style="{ width: `${getExcavationInfo('right', room.index).progress}%` }"
                  ></div>
                  <div class="remaining-time">{{ getExcavationInfo('right', room.index).remainingWeeks }} semaines</div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="level-overlay" v-else>
      <template v-if="canExcavateStairs">
        <button v-if="!isExcavatingStairs" @click="excavateStairs">Excaver</button>
        <div v-else class="excavation-progress">
          <div 
            class="progress-bar"
            :style="{ width: `${stairsExcavationInfo.progress}%` }"
          ></div>
          <div class="remaining-time">{{ stairsExcavationInfo.remainingWeeks }} semaines</div>
        </div>
      </template>
    </div>

    <RoomTypeModal 
      v-if="showRoomTypeModal"
      @close="closeRoomTypeModal"
      @select="selectRoomType"
    />

    <RoomInfoModal 
      v-if="showRoomInfoModal"
      :room="selectedRoomForInfo"
      :levelId="level.id"
      @close="closeRoomInfoModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGameStore, ROOMS_PER_SIDE } from '../stores/gameStore'
import type { Level, Room } from '../stores/gameStore'
import RoomTypeModal from './RoomTypeModal.vue'
import RoomInfoModal from './RoomInfoModal.vue'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  level: Level
}>()

const store = useGameStore()
const { habitantsLibres } = storeToRefs(store)

const showRoomTypeModal = ref(false)
const selectedRoom = ref<{ position: 'left' | 'right', index: number } | null>(null)
const showRoomInfoModal = ref(false)
const selectedRoomForInfo = ref<Room | null>(null)

const availableRoomTypes = [
  'stockage',
  'dortoir',
  'cuisine',
  'eau',
  'energie',
  'medical',
  'serre'
]

const canExcavateStairs = computed(() => {
  const previousLevel = store.levels[props.level.id - 1]
  return previousLevel && previousLevel.isStairsExcavated
})

const isExcavatingStairs = computed(() => 
  store.isExcavationInProgress(props.level.id, 'stairs')
)

const stairsExcavationInfo = computed(() => 
  store.getExcavationInfo(props.level.id, 'stairs')
)

function canExcavateRoom(position: 'left' | 'right', index: number): boolean {
  if (!props.level.isStairsExcavated) return false
  
  const rooms = position === 'left' ? props.level.leftRooms : props.level.rightRooms
  const room = rooms[index]
  if (!room || room.isExcavated) return false

  if (position === 'left') {
    return index === ROOMS_PER_SIDE - 1 || (rooms[index + 1] && rooms[index + 1].isExcavated)
  }
  
  return index === 0 || (rooms[index - 1] && rooms[index - 1].isExcavated)
}

function isExcavating(position: 'left' | 'right', index: number): boolean {
  return store.isExcavationInProgress(props.level.id, position, index)
}

function getExcavationInfo(position: 'left' | 'right', index: number) {
  return store.getExcavationInfo(props.level.id, position, index)
}

function shouldShowRightBorder(room: Room, position: 'left' | 'right'): boolean {
  if (room.isExcavated) return true
  const rooms = position === 'left' ? props.level.leftRooms : props.level.rightRooms
  const nextRoom = rooms[room.index + 1]
  return nextRoom && nextRoom.isExcavated
}

function shouldShowLeftBorder(room: Room, position: 'left' | 'right'): boolean {
  if (room.isExcavated) return true
  const rooms = position === 'left' ? props.level.leftRooms : props.level.rightRooms
  const prevRoom = rooms[room.index - 1]
  return prevRoom && prevRoom.isExcavated
}

function handleRoomClick(position: 'left' | 'right', room: Room) {
  if (room.isExcavated && !room.isBuilt) {
    openRoomTypeModal(position, room.index)
  }
}

function excavateStairs() {
  if (canExcavateStairs.value && !isExcavatingStairs.value) {
    store.excavateStairs(props.level.id)
  }
}

function excavateRoom(position: 'left' | 'right', index: number) {
  if (canExcavateRoom(position, index) && !isExcavating(position, index)) {
    store.excavateRoom(props.level.id, position, index)
  }
}

function openRoomTypeModal(position: 'left' | 'right', index: number) {
  selectedRoom.value = { position, index }
  showRoomTypeModal.value = true
}

function closeRoomTypeModal() {
  showRoomTypeModal.value = false
  selectedRoom.value = null
}

function selectRoomType(type: string) {
  if (selectedRoom.value) {
    const { position, index } = selectedRoom.value
    store.buildRoom(props.level.id, position, index, type)
    closeRoomTypeModal()
  }
}

function getConstructionProgress(room: Room): number {
  if (!room.isUnderConstruction || room.constructionStartTime === undefined || room.constructionDuration === undefined) {
    return 0
  }
  const elapsedTime = store.gameTime - room.constructionStartTime
  return Math.min(100, (elapsedTime / room.constructionDuration) * 100)
}

function getRemainingConstructionTime(room: Room): number {
  if (!room.isUnderConstruction || room.constructionStartTime === undefined || room.constructionDuration === undefined) {
    return 0
  }
  const elapsedTime = store.gameTime - room.constructionStartTime
  return Math.max(0, room.constructionDuration - elapsedTime)
}

function getHabitantName(habitantId: string): string {
  const habitant = store.habitants.find(h => h.id === habitantId)
  return habitant ? habitant.nom : 'Inconnu'
}

function openRoomInfo(room: Room) {
  selectedRoomForInfo.value = room
  showRoomInfoModal.value = true
}

function closeRoomInfoModal() {
  showRoomInfoModal.value = false
  selectedRoomForInfo.value = null
}

function getRoomStyle(room: Room) {
  if (!room.isBuilt) return {}
  
  const gridSize = room.gridSize || 1
  return {
    gridColumn: `span ${gridSize}`,
    width: gridSize > 1 ? `calc(${100 * gridSize}% + ${(gridSize - 1) * 0.5}rem)` : undefined,
    marginRight: gridSize > 1 ? '0' : undefined
  }
}

onMounted(() => {
  document.documentElement.style.setProperty('--rooms-per-side', ROOMS_PER_SIDE.toString())
})
</script>

<style lang="scss" scoped>
.silo-level {
  position: relative;
  height: 150px;
  margin: 10px;
  transition: all 0.3s ease;
  
  &.stairs-excavated {
    background-color: transparent;
  }
}

.level-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.level-rooms {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 80px 1fr;
  gap: 1rem;
  align-items: stretch;
}

.rooms-side {
  display: grid;
  grid-template-columns: repeat(var(--rooms-per-side), 1fr);
  gap: 0.5rem;
  position: relative;
  
  &.left-side {
    justify-content: end;
  }
  
  &.right-side {
    justify-content: start;
  }

  .room {
    min-width: 0;
    width: 100%;
    position: relative;

    &.grid-size-2 {
      grid-column: span 2;
      width: calc(100%) !important;
    }

    &.grid-size-3 {
      grid-column: span 3;
      width: calc(100%) !important;
    }

    &.grid-size-4 {
      grid-column: span 4;
      width: calc(100%) !important;
    }

    &.grid-size-5 {
      grid-column: span 5;
      width: calc(100%) !important;
    }
  }
}

.room {
  background-color: transparent;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  border: none;
  min-height: 100px;
  
  &.is-excavated {
    background-color: #37474f;
    border: 2px solid #34495e;
    border-radius: 4px;
  }
  
  &.is-built {
    border: 2px solid var(--room-color, #34495e);
    cursor: pointer;
  }

  &.no-border-right {
    border-right: none;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    margin-right: -2px;
  }

  &.no-border-left {
    border-left: none;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    margin-left: -2px;
  }
}

.room-info {
  padding: 0.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .room-type {
    text-transform: capitalize;
    font-weight: bold;
    text-align: center;
    margin-bottom: 0.25rem;
    font-size: 0.7rem;
  }

  .room-size {
    text-align: center;
    font-size: 0.6rem;
    color: #95a5a6;
    margin-bottom: 0.25rem;
  }
}

.room-occupants {
  flex: 1;
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
  align-items: flex-start;
  
  .occupant {
    background-color: rgba(255, 255, 255, 0.1);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.7rem;
  }
}

.room-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  cursor: pointer;

  .empty-room-text {
    color: #95a5a6;
    font-size: 0.8rem;
    
    &.error {
      color: #e74c3c;
    }
  }
}

.room-actions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.25rem;
  
  button {
    font-size: 0.7rem;
    padding: 0.25rem;
    white-space: nowrap;
  }
}

.stairs {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #34495e;
  border-radius: 4px;
  position: relative;
  
  .stairs-inner {
    width: 40px;
    height: 80%;
    background: repeating-linear-gradient(
      0deg,
      #2c3e50,
      #2c3e50 10px,
      #34495e 10px,
      #34495e 20px
    );
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    .level-number {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      background-color: #34495e;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: bold;
      color: #ecf0f1;
    }
  }

  .stairs-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.5);
  }
}

.level-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
}

.excavation-progress {
  width: 80%;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: visible;
  position: relative;

  .progress-bar {
    height: 100%;
    background-color: #3498db;
    transition: width 0.3s ease;
  }

  .remaining-time {
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
    font-size: 0.7rem;
    color: #ecf0f1;
  }
}

.construction-progress {
  width: 80%;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: visible;
  position: relative;

  .progress-bar {
    height: 100%;
    background-color: #f1c40f;
    transition: width 0.3s ease;
  }

  .remaining-time {
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
    font-size: 0.7rem;
    color: #ecf0f1;
  }
}

// Styles spécifiques pour chaque type de salle
@each $type in (stockage, dortoir, cuisine, eau, energie, medical, serre) {
  .room-type-#{$type} {
    --room-color: var(--room-#{$type}-color);
  }
}

// Centrer la modale en hauteur
:deep(.room-type-modal) {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
}

:deep(.modal-overlay) {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
}
</style> 