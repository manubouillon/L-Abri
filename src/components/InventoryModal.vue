<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Inventaire</h2>
        <div class="inventory-space">
          Espace: {{ Math.ceil(inventorySpace.used) }}/{{ inventorySpace.total }}
        </div>
        <button class="close-button" @click="$emit('close')">×</button>
      </div>

      <div class="categories-tabs">
        <button 
          v-for="(category, key) in ITEM_CATEGORIES" 
          :key="key"
          :class="['category-tab', { active: selectedCategory === key }]"
          :style="{ borderColor: category.color }"
          @click="selectedCategory = key as ItemCategory"
        >
          {{ category.name }}
        </button>
      </div>

      <div class="inventory-content">
        <div class="category-description" v-if="selectedCategory">
          {{ ITEM_CATEGORIES[selectedCategory].description }}
        </div>

        <div class="items-grid">
          <template v-for="item in filteredItems" :key="item.id">
            <div 
              v-if="isValidItem(item)"
              class="item-card"
              :style="{ borderColor: ITEM_CATEGORIES[item.category].color }"
            >
              <div class="item-header">
                <span class="item-name">{{ ITEMS_CONFIG[item.type as ItemType].name }}</span>
                <span class="item-quantity">{{ Math.floor(item.quantity) }}/{{ item.stackSize }}</span>
              </div>
              <div class="item-description">{{ item.description }}</div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '../stores/gameStore'
import { ITEMS_CONFIG, type ItemType, type ItemCategory } from '../config/itemsConfig'
import type { Item } from '../stores/gameStore'

const store = useGameStore()
const { inventoryItems, inventorySpace } = storeToRefs(store)

const selectedCategory = ref<ItemCategory | null>(null)

interface ItemCategoryConfig {
  name: string
  description: string
  color: string
}

const ITEM_CATEGORIES: Record<ItemCategory, ItemCategoryConfig> = {
  'ressource-brute': {
    name: 'Ressources brutes',
    description: 'Ressources extraites qui nécessitent un raffinage',
    color: '#e74c3c'
  },
  'ressource': {
    name: 'Ressources raffinées',
    description: 'Ressources transformées prêtes à l\'utilisation',
    color: '#3498db'
  },
  'nourriture': {
    name: 'Nourriture',
    description: 'Aliments pour nourrir les habitants',
    color: '#2ecc71'
  },
  'biologique': {
    name: 'Biologique',
    description: 'Matériel biologique sensible',
    color: '#9b59b6'
  },
  'conteneur': {
    name: 'Conteneurs',
    description: 'Récipients pour stocker d\'autres ressources',
    color: '#f1c40f'
  }
}

// Fonction pour vérifier si un item est valide
function isValidItem(item: any): item is Item {
  return (
    item &&
    typeof item.type === 'string' &&
    typeof item.category === 'string' &&
    typeof item.quantity === 'number' &&
    typeof item.stackSize === 'number' &&
    item.type in ITEMS_CONFIG &&
    item.category in ITEM_CATEGORIES
  )
}

// Ajouter un log pour déboguer
const filteredItems = computed(() => {
  if (!selectedCategory.value) {
    return inventoryItems.value.filter(isValidItem)
  }
  return inventoryItems.value.filter(item => 
    isValidItem(item) && item.category === selectedCategory.value
  )
})

defineEmits<{
  (e: 'close'): void
}>()
</script>

<style lang="scss" scoped>
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
  background-color: #2c3e50;
  border-radius: 8px;
  width: 80%;
  max-width: 800px;
  max-height: calc(100vh - 200px);
  margin-top: 100px;
  display: flex;
  flex-direction: column;
  color: #ecf0f1;
  overflow-y: auto;
}

.modal-header {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  h2 {
    margin: 0;
  }
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #ecf0f1;
  cursor: pointer;
  padding: 0.5rem;

  &:hover {
    color: #e74c3c;
  }
}

.categories-tabs {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.category-tab {
  padding: 0.5rem 1rem;
  background-color: #34495e;
  border: none;
  border-bottom: 3px solid transparent;
  color: #ecf0f1;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #2c3e50;
  }

  &.active {
    background-color: #2c3e50;
    border-bottom-width: 3px;
    border-bottom-style: solid;
  }
}

.inventory-content {
  padding: 1rem;
  overflow-y: auto;
}

.category-description {
  margin-bottom: 1rem;
  color: #bdc3c7;
  font-style: italic;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.item-card {
  background-color: #34495e;
  border-radius: 4px;
  padding: 1rem;
  border: 2px solid transparent;

  .item-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    
    .item-name {
      font-weight: bold;
    }
    
    .item-quantity {
      color: #bdc3c7;
    }
  }

  .item-description {
    font-size: 0.9rem;
    color: #bdc3c7;
  }
}

.inventory-space {
  background-color: #34495e;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
}
</style> 