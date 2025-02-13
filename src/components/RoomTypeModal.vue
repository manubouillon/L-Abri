<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <h2>{{ selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'Choisir une catégorie' }}</h2>
      
      <!-- Affichage des catégories -->
      <div v-if="!selectedCategory" class="categories">
        <button 
          v-for="category in categories" 
          :key="category.id"
          class="category-button"
          :class="`category-${category.id}`"
          @click="selectedCategory = category.id"
        >
          <div class="category-info">
            <h3>{{ category.name }}</h3>
          </div>
        </button>
      </div>

      <!-- Affichage des salles de la catégorie -->
      <div v-else class="room-types">
        <button 
          v-for="type in getRoomsByCategory(selectedCategory)" 
          :key="type.id"
          class="room-type-button"
          :class="[
            `room-type-${type.id}`,
            { 'disabled': !canAffordRoom(type.id) }
          ]"
          @click="canAffordRoom(type.id) && $emit('select', type.id)"
          :disabled="!canAffordRoom(type.id)"
        >
          <div class="room-type-icon">{{ type.icon }}</div>
          <div class="room-type-info">
            <h3>{{ type.name }}</h3>
            <p>{{ type.description }}</p>
            <p class="construction-cost">
              Coût: {{ getConstructionCosts(type.id) }}
            </p>
            <div v-if="!canAffordRoom(type.id)" class="missing-resources">
              <p class="missing-resources-title">Ressources manquantes:</p>
              <ul class="missing-resources-list">
                <li v-for="(amount, resource) in getMissingResources(type.id)" :key="resource">
                  {{ ITEMS_CONFIG[resource as keyof typeof ITEMS_CONFIG].name }}: {{ amount }}
                </li>
              </ul>
            </div>
          </div>
        </button>

        <button class="back-button" @click="selectedCategory = null">
          Retour aux catégories
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ROOM_CATEGORIES, ROOM_CONSTRUCTION_COSTS, ITEMS_CONFIG, useGameStore } from '../stores/gameStore'
import type { ItemType } from '../stores/gameStore'

const store = useGameStore()

const selectedCategory = ref<string | null>(null)

const categories = ROOM_CATEGORIES

const roomTypes = [
  {
    id: 'entrepot',
    name: 'Entrepôt',
    icon: '📦',
    description: 'Augmente la capacité de stockage des ressources',
    category: 'stockage'
  },
  {
    id: 'dortoir',
    name: 'Dortoir',
    icon: '🛏️',
    description: 'Héberge les habitants',
    category: 'logements'
  },
  {
    id: 'cuisine',
    name: 'Cuisine',
    icon: '🍳',
    description: 'Produit de la nourriture',
    category: 'alimentation'
  },
  {
    id: 'station-traitement',
    name: 'Station de traitement',
    icon: '💧',
    description: 'Produit de l\'eau potable',
    category: 'eau'
  },
  {
    id: 'generateur',
    name: 'Générateur',
    icon: '⚡',
    description: 'Produit de l\'énergie',
    category: 'energie'
  },
  {
    id: 'infirmerie',
    name: 'Infirmerie',
    icon: '🏥',
    description: 'Produit des médicaments',
    category: 'sante'
  },
  {
    id: 'serre',
    name: 'Serre',
    icon: '🌱',
    description: 'Produit de la nourriture',
    category: 'alimentation'
  },
  {
    id: 'raffinerie',
    name: 'Raffinerie',
    icon: '⚒️',
    description: 'Raffine les minerais en lingots',
    category: 'production'
  },
  {
    id: 'derrick',
    name: 'Derrick',
    icon: '🛢️',
    description: 'Extrait du pétrole pour alimenter les générateurs',
    category: 'production'
  },
  {
    id: 'salle-controle',
    name: 'Salle de contrôle',
    icon: '🎮',
    description: 'Permet de contrôler et surveiller l\'ensemble de l\'abri',
    category: 'production'
  }
]

function getRoomsByCategory(categoryId: string) {
  return roomTypes.filter(room => room.category === categoryId)
}

function canAffordRoom(type: string): boolean {
  const costs = ROOM_CONSTRUCTION_COSTS[type]
  if (!costs) return true

  for (const [resource, amount] of Object.entries(costs)) {
    if (store.getItemQuantity(resource) < amount) {
      return false
    }
  }
  return true
}

function getConstructionCosts(type: string): string {
  const costs = ROOM_CONSTRUCTION_COSTS[type]
  if (!costs) return 'Gratuit'

  return Object.entries(costs)
    .map(([resource, amount]) => `${ITEMS_CONFIG[resource].name}: ${amount}`)
    .join(', ')
}

function getMissingResources(type: string): Record<ItemType, number> {
  const costs = ROOM_CONSTRUCTION_COSTS[type]
  if (!costs) return {} as Record<ItemType, number>

  const missing: Record<ItemType, number> = {} as Record<ItemType, number>
  for (const [resource, amount] of Object.entries(costs)) {
    const currentAmount = store.getItemQuantity(resource as ItemType)
    if (currentAmount < amount) {
      missing[resource as ItemType] = amount - currentAmount
    }
  }
  return missing
}

defineEmits<{
  (e: 'close'): void
  (e: 'select', type: string): void
}>()
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
  max-width: 500px;
  width: 90%;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  position: fixed;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  h2 {
    margin: 0 0 1rem;
    text-align: center;
    color: #ecf0f1;
  }
}

.categories {
  display: grid;
  gap: 1rem;
}

.category-button {
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: #2c3e50;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;

  @each $type, $color in (
    stockage: var(--category-stockage-color),
    logements: var(--category-logements-color),
    alimentation: var(--category-alimentation-color),
    eau: var(--category-eau-color),
    energie: var(--category-energie-color),
    sante: var(--category-sante-color),
    production: var(--room-production-color)
  ) {
    &.category-#{$type} {
      border-color: $color;
      
      &:hover {
        background-color: rgba($color, 0.1);
      }
    }
  }

  &:hover {
    transform: translateY(-2px);
  }

  h3 {
    margin: 0;
    color: #ecf0f1;
  }
}

.room-types {
  display: grid;
  gap: 1rem;
}

.room-type-button {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 1rem;
  background-color: #2c3e50;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }

  @each $type, $color in (
    entrepot: var(--room-entrepot-color),
    dortoir: var(--room-dortoir-color),
    cuisine: var(--room-cuisine-color),
    station-traitement: var(--room-station-traitement-color),
    generateur: var(--room-generateur-color),
    infirmerie: var(--room-infirmerie-color),
    serre: var(--room-serre-color),
    raffinerie: var(--room-raffinerie-color),
    derrick: var(--room-derrick-color),
    salle-controle: var(--room-salle-controle-color)
  ) {
    &.room-type-#{$type} {
      border-color: $color;
      
      &:hover {
        background-color: rgba($color, 0.1);
      }
    }
  }

  &.disabled {
    opacity: 0.7;
    cursor: not-allowed;
    
    &:hover {
      transform: none;
      background-color: #2c3e50;
    }
  }
}

.room-type-icon {
  font-size: 2rem;
  min-width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #34495e;
  border-radius: 4px;
}

.room-type-info {
  flex: 1;

  h3 {
    margin: 0 0 0.25rem;
    color: #ecf0f1;
  }

  p {
    margin: 0;
    font-size: 0.9rem;
    color: #bdc3c7;
  }
}

.back-button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #2c3e50;
  border: 2px solid #95a5a6;
  border-radius: 4px;
  color: #ecf0f1;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #95a5a622;
  }
}

.construction-cost {
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: #f1c40f;
}

.missing-resources {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: rgba(231, 76, 60, 0.1);
  border-radius: 4px;
  border: 1px solid rgba(231, 76, 60, 0.3);
}

.missing-resources-title {
  color: #e74c3c;
  font-size: 0.8rem;
  margin: 0 0 0.25rem 0;
}

.missing-resources-list {
  margin: 0;
  padding-left: 1rem;
  font-size: 0.8rem;
  color: #e74c3c;
}
</style> 