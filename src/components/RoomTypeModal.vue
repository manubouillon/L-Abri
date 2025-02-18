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
                  {{ ITEMS_CONFIG[resource as keyof typeof ITEMS_CONFIG].name }}: {{ Math.ceil(amount) }}
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
import { ROOM_CATEGORIES, ROOM_CONSTRUCTION_COSTS, ROOM_TYPES, ROOM_COLORS } from '../config/roomsConfig'
import { useGameStore } from '../stores/gameStore'
import { ITEMS_CONFIG, type ItemType } from '../config/itemsConfig'

const store = useGameStore()

const selectedCategory = ref<string | null>(null)

const categories = ROOM_CATEGORIES

function getRoomsByCategory(categoryId: string) {
  return ROOM_TYPES.filter(room => room.category === categoryId)
}

function isItemType(resource: string): resource is ItemType {
  return Object.prototype.hasOwnProperty.call(ITEMS_CONFIG, resource)
}

function canAffordRoom(type: string): boolean {
  const costs = ROOM_CONSTRUCTION_COSTS[type]
  if (!costs) return true

  return Object.entries(costs).every(([resource, amount]) => {
    if (!isItemType(resource) || amount === undefined) return true
    return store.getItemQuantity(resource) >= amount
  })
}

function getConstructionCosts(type: string): string {
  const costs = ROOM_CONSTRUCTION_COSTS[type]
  if (!costs) return 'Gratuit'

  return Object.entries(costs)
    .filter(([resource]) => isItemType(resource))
    .map(([resource, amount]) => {
      const itemConfig = ITEMS_CONFIG[resource as ItemType]
      return `${itemConfig.name}: ${amount}`
    })
    .join(', ')
}

function getMissingResources(type: string): Record<ItemType, number> {
  const costs = ROOM_CONSTRUCTION_COSTS[type]
  if (!costs) return {} as Record<ItemType, number>

  const missing: Record<ItemType, number> = {} as Record<ItemType, number>
  Object.entries(costs).forEach(([resource, amount]) => {
    if (isItemType(resource) && amount !== undefined) {
      const currentAmount = store.getItemQuantity(resource)
      if (currentAmount < amount) {
        missing[resource] = amount - currentAmount
      }
    }
  })
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

  &.category-stockage { border-color: v-bind('ROOM_COLORS.categories.stockage'); }
  &.category-logements { border-color: v-bind('ROOM_COLORS.categories.logements'); }
  &.category-alimentation { border-color: v-bind('ROOM_COLORS.categories.alimentation'); }
  &.category-eau { border-color: v-bind('ROOM_COLORS.categories.eau'); }
  &.category-energie { border-color: v-bind('ROOM_COLORS.categories.energie'); }
  &.category-sante { border-color: v-bind('ROOM_COLORS.categories.sante'); }
  &.category-production { border-color: v-bind('ROOM_COLORS.categories.production'); }

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

  &.room-type-chambre-froide { border-color: v-bind('ROOM_COLORS.rooms["chambre-froide"]'); }
  &.room-type-entrepot { border-color: v-bind('ROOM_COLORS.rooms.entrepot'); }
  &.room-type-cuve { border-color: v-bind('ROOM_COLORS.rooms.cuve'); }
  &.room-type-dortoir { border-color: v-bind('ROOM_COLORS.rooms.dortoir'); }
  &.room-type-quartiers { border-color: v-bind('ROOM_COLORS.rooms.quartiers'); }
  &.room-type-appartement { border-color: v-bind('ROOM_COLORS.rooms.appartement'); }
  &.room-type-suite { border-color: v-bind('ROOM_COLORS.rooms.suite'); }
  &.room-type-cuisine { border-color: v-bind('ROOM_COLORS.rooms.cuisine'); }
  &.room-type-station-traitement { border-color: v-bind('ROOM_COLORS.rooms["station-traitement"]'); }
  &.room-type-generateur { border-color: v-bind('ROOM_COLORS.rooms.generateur'); }
  &.room-type-infirmerie { border-color: v-bind('ROOM_COLORS.rooms.infirmerie'); }
  &.room-type-serre { border-color: v-bind('ROOM_COLORS.rooms.serre'); }
  &.room-type-raffinerie { border-color: v-bind('ROOM_COLORS.rooms.raffinerie'); }
  &.room-type-derrick { border-color: v-bind('ROOM_COLORS.rooms.derrick'); }
  &.room-type-atelier { border-color: v-bind('ROOM_COLORS.rooms.atelier'); }
  &.room-type-salle-controle { border-color: v-bind('ROOM_COLORS.rooms["salle-controle"]'); }

  &.room-type-chambre-froide:hover { background-color: v-bind('`${ROOM_COLORS.rooms["chambre-froide"]}22`'); }
  &.room-type-entrepot:hover { background-color: v-bind('`${ROOM_COLORS.rooms.entrepot}22`'); }
  &.room-type-cuve:hover { background-color: v-bind('`${ROOM_COLORS.rooms.cuve}22`'); }
  &.room-type-dortoir:hover { background-color: v-bind('`${ROOM_COLORS.rooms.dortoir}22`'); }
  &.room-type-quartiers:hover { background-color: v-bind('`${ROOM_COLORS.rooms.quartiers}22`'); }
  &.room-type-appartement:hover { background-color: v-bind('`${ROOM_COLORS.rooms.appartement}22`'); }
  &.room-type-suite:hover { background-color: v-bind('`${ROOM_COLORS.rooms.suite}22`'); }
  &.room-type-cuisine:hover { background-color: v-bind('`${ROOM_COLORS.rooms.cuisine}22`'); }
  &.room-type-station-traitement:hover { background-color: v-bind('`${ROOM_COLORS.rooms["station-traitement"]}22`'); }
  &.room-type-generateur:hover { background-color: v-bind('`${ROOM_COLORS.rooms.generateur}22`'); }
  &.room-type-infirmerie:hover { background-color: v-bind('`${ROOM_COLORS.rooms.infirmerie}22`'); }
  &.room-type-serre:hover { background-color: v-bind('`${ROOM_COLORS.rooms.serre}22`'); }
  &.room-type-raffinerie:hover { background-color: v-bind('`${ROOM_COLORS.rooms.raffinerie}22`'); }
  &.room-type-derrick:hover { background-color: v-bind('`${ROOM_COLORS.rooms.derrick}22`'); }
  &.room-type-atelier:hover { background-color: v-bind('`${ROOM_COLORS.rooms.atelier}22`'); }
  &.room-type-salle-controle:hover { background-color: v-bind('`${ROOM_COLORS.rooms["salle-controle"]}22`'); }

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