<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <h2>Arbre de Recherche 🔬</h2>
      <div id="research-tree" class="research-tree"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { ROOM_TYPES } from '../config/roomsConfig'
import { useGameStore } from '../stores/gameStore'

const store = useGameStore()

// Définir les dépendances entre les salles
const ROOM_DEPENDENCIES = {
  'quartiers': ['dortoir'],
  'appartement': ['quartiers'],
  'suite': ['appartement'],
  'derrick': ['raffinerie'],
  'salle-controle': ['laboratoire']
}

// Fonction pour vérifier si une salle est un prérequis pour une autre
const isPrerequisite = (roomId: string) => {
  return Object.values(ROOM_DEPENDENCIES).some(deps => deps.includes(roomId))
}

// Fonction pour obtenir les salles à afficher dans l'arbre
const getResearchableRooms = () => {
  return ROOM_TYPES.filter(room => {
    // Si la salle n'est pas débloquée par défaut, elle doit être affichée
    if (room.unlockedByDefault === false) return true
    // Si la salle est un prérequis pour une autre, elle doit être affichée
    if (isPrerequisite(room.id)) return true
    return false
  })
}

const createTreeConfig = () => {
  const researchableRooms = getResearchableRooms()
  
  // Créer les nœuds pour chaque salle
  const nodes = researchableRooms.map(room => {
    const isUnlocked = store.unlockedRooms.includes(room.id)
    const prerequisites = ROOM_DEPENDENCIES[room.id as keyof typeof ROOM_DEPENDENCIES] || []
    
    return {
      text: {
        name: `${room.icon} ${room.name}`,
        desc: `${room.description}\nTemps de recherche: ${room.developmentTime || 0} semaines`
      },
      HTMLclass: `room-node ${isUnlocked ? 'unlocked' : 'locked'}`,
      children: prerequisites.map(prereqId => {
        const prereqRoom = ROOM_TYPES.find(r => r.id === prereqId)
        if (!prereqRoom) return null
        
        return {
          text: {
            name: `${prereqRoom.icon} ${prereqRoom.name}`,
            desc: prereqRoom.description
          },
          HTMLclass: `room-node ${store.unlockedRooms.includes(prereqId) ? 'unlocked' : 'locked'}`
        }
      }).filter(Boolean)
    }
  })

  const config = {
    chart: {
      container: "#research-tree",
      levelSeparation: 80,
      siblingSeparation: 80,
      subTeeSeparation: 80,
      rootOrientation: "WEST",
      nodeAlign: "BOTTOM",
      padding: 35,
      node: {
        HTMLclass: 'research-node'
      },
      connectors: {
        type: 'step',
        style: {
          'stroke-width': 2,
          'stroke': '#3498db'
        }
      }
    },
    nodeStructure: {
      text: { name: "Technologies 🔬" },
      HTMLclass: 'root-node',
      children: nodes
    }
  }

  return config
}

onMounted(() => {
  setTimeout(() => {
    try {
      // @ts-ignore
      new window.Treant(createTreeConfig())
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de Treant:', error)
    }
  }, 100)
})
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

.modal-content {
  background-color: #34495e;
  border-radius: 8px;
  padding: 1.5rem;
  width: 90%;
  height: 90vh;
  overflow: auto;
  position: relative;

  h2 {
    margin: 0 0 1rem;
    text-align: center;
    color: #ecf0f1;
  }
}

.research-tree {
  width: 100%;
  height: calc(90vh - 4rem);
  background-color: #2c3e50;
  border-radius: 8px;
  padding: 1rem;
  overflow: auto;
}

:deep(.research-node) {
  padding: 10px;
  border-radius: 8px;
  background-color: #34495e;
  border: 2px solid #3498db;
  min-width: 200px;

  &.unlocked {
    border-color: #2ecc71;
  }

  &.locked {
    border-color: #e74c3c;
  }

  .node-name {
    color: #ecf0f1;
    font-size: 14px;
    margin-bottom: 5px;
  }

  .node-desc {
    color: #bdc3c7;
    font-size: 12px;
    white-space: pre-line;
  }
}

:deep(.root-node) {
  background-color: #2980b9;
  border: none;
}
</style> 