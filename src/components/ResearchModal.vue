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
import { ROOM_TYPES, ROOM_DEPENDENCIES } from '../config/roomsConfig'
import { useGameStore } from '../stores/gameStore'

const store = useGameStore()

// Fonction pour vérifier si une salle est un prérequis pour une autre
const isPrerequisite = (roomId: string) => {
  return Object.values(ROOM_DEPENDENCIES).some(deps => deps.includes(roomId))
}

// Fonction pour vérifier si une salle peut être recherchée
const canResearch = (roomId: string): boolean => {
  const dependencies = ROOM_DEPENDENCIES[roomId as keyof typeof ROOM_DEPENDENCIES] || []
  return dependencies.every(dep => store.unlockedRooms.includes(dep))
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

interface TreeNode {
  text: {
    name: string;
    desc: string;
  };
  HTMLclass: string;
  children: TreeNode[];
}

const createTreeConfig = () => {
  const researchableRooms = getResearchableRooms()
  
  // Créer une map des nœuds pour éviter les doublons
  const nodeMap = new Map<string, TreeNode>()

  // Fonction récursive pour créer la structure de l'arbre
  const createNode = (roomId: string): TreeNode | null => {
    if (nodeMap.has(roomId)) {
      const node = nodeMap.get(roomId)
      return node || null
    }

    const room = ROOM_TYPES.find(r => r.id === roomId)
    if (!room) return null

    // Ne créer le nœud que si la salle n'est pas débloquée par défaut
    if (room.unlockedByDefault !== false) return null

    const isUnlocked = store.unlockedRooms.includes(roomId)
    const isResearchable = canResearch(roomId)
    const node: TreeNode = {
      text: {
        name: `${room.icon} ${room.name}`,
        desc: `${room.description}\nTemps de recherche: ${room.developmentTime || 0} semaines`
      },
      HTMLclass: `room-node ${isUnlocked ? 'unlocked' : isResearchable ? 'researchable' : 'locked'}`,
      children: []
    }

    nodeMap.set(roomId, node)

    // Récupérer les prérequis de cette salle
    const prerequisites = ROOM_DEPENDENCIES[roomId as keyof typeof ROOM_DEPENDENCIES] || []
    
    // Créer les nœuds pour les prérequis
    const children = prerequisites
      .map(prereqId => createNode(prereqId))
      .filter((node): node is TreeNode => node !== null)

    node.children = children
    return node
  }

  // Créer les nœuds pour toutes les salles recherchables
  const nodes = researchableRooms
    .map(room => createNode(room.id))
    .filter((node): node is TreeNode => node !== null)

  // Filtrer pour ne garder que les nœuds qui ne sont pas des prérequis d'autres salles
  const rootRooms = nodes.filter(node => {
    const roomId = researchableRooms.find(
      room => node.text.name.includes(room.name)
    )?.id
    if (!roomId) return false
    
    return !Object.values(ROOM_DEPENDENCIES).some(deps => deps.includes(roomId))
  })

  const config = {
    chart: {
      container: "#research-tree",
      levelSeparation: 120,
      siblingSeparation: 100,
      subTeeSeparation: 100,
      rootOrientation: "EAST",
      nodeAlign: "BOTTOM",
      padding: 35,
      node: {
        HTMLclass: 'research-node',
        drawLineThrough: false,
        collapsable: false
      },
      connectors: {
        type: 'straight',
        style: {
          'stroke-width': 2,
          'stroke': '#3498db'
        }
      },
      animation: {
        nodeAnimation: "easeOutBounce",
        nodeSpeed: 700,
        connectorsAnimation: "bounce",
        connectorsSpeed: 700
      },
      hideRootNode: true
    },
    nodeStructure: {
      text: { name: "" },
      HTMLclass: 'hidden-root',
      stackChildren: true,
      children: rootRooms
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

  &.researchable {
    border-color: #f1c40f;
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

:deep(.hidden-root) {
  width: 0 !important;
  height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  position: absolute !important;
  pointer-events: none !important;
}

:deep(.node-connector[data-from="0"]) {
  opacity: 0;
  pointer-events: none;
}
</style> 