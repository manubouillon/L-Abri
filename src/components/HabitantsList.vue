<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="habitants-list" @click.stop>
      <div class="modal-header">
        <h2>Liste des habitants</h2>
        <button class="close-button" @click="$emit('close')">×</button>
      </div>
      <div class="habitants-grid">
        <div 
          v-for="habitant in habitants" 
          :key="habitant.id"
          class="habitant-card"
        >
          <h3>
            {{ habitant.nom }}
            <span class="genre-icon">{{ habitant.genre === 'H' ? '👨' : '👩' }}</span>
          </h3>
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useGameStore } from '../stores/gameStore'
import type { Habitant } from '../stores/gameStore'
import { onMounted, onUnmounted } from 'vue'

const store = useGameStore()
const { habitants } = storeToRefs(store)

const emit = defineEmits<{
  (e: 'close'): void
}>()

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
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  margin: 2rem auto;
  display: flex;
  flex-direction: column;

  h2 {
    margin-bottom: 1rem;
    text-align: center;
    color: #ecf0f1;
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
</style> 