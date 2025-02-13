<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="habitants-list" @click.stop>
      <div class="modal-header">
        <h2>Liste des habitants</h2>
        <div class="global-happiness">
          Bonheur global : {{ globalHappiness }}%
        </div>
        <button class="close-button" @click="$emit('close')">×</button>
      </div>
      <div class="habitants-grid">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useGameStore } from '../stores/gameStore'
import type { Habitant } from '../stores/gameStore'
import { onMounted, onUnmounted } from 'vue'

const store = useGameStore()
const { habitants, globalHappiness } = storeToRefs(store)

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
</style> 