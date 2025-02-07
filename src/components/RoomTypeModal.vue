<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <h2>Choisir le type de salle</h2>
      <div class="room-types">
        <button 
          v-for="type in roomTypes" 
          :key="type.id"
          class="room-type-button"
          :class="`room-type-${type.id}`"
          @click="$emit('select', type.id)"
        >
          <div class="room-type-icon">{{ type.icon }}</div>
          <div class="room-type-info">
            <h3>{{ type.name }}</h3>
            <p>{{ type.description }}</p>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const roomTypes = [
  {
    id: 'stockage',
    name: 'Stockage',
    icon: '📦',
    description: 'Augmente la capacité de stockage des ressources'
  },
  {
    id: 'dortoir',
    name: 'Dortoir',
    icon: '🛏️',
    description: 'Héberge les habitants'
  },
  {
    id: 'cuisine',
    name: 'Cuisine',
    icon: '🍳',
    description: 'Produit de la nourriture'
  },
  {
    id: 'eau',
    name: 'Station de traitement',
    icon: '💧',
    description: 'Produit de l\'eau potable'
  },
  {
    id: 'energie',
    name: 'Générateur',
    icon: '⚡',
    description: 'Produit de l\'énergie'
  },
  {
    id: 'medical',
    name: 'Infirmerie',
    icon: '🏥',
    description: 'Produit des médicaments'
  },
  {
    id: 'serre',
    name: 'Serre',
    icon: '🌱',
    description: 'Produit de la nourriture et de l\'oxygène'
  }
]

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
  max-height: 90vh;
  overflow-y: auto;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  h2 {
    margin: 0 0 1rem;
    text-align: center;
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
    stockage: var(--room-stockage-color),
    dortoir: var(--room-dortoir-color),
    cuisine: var(--room-cuisine-color),
    eau: var(--room-eau-color),
    energie: var(--room-energie-color),
    medical: var(--room-medical-color)
  ) {
    &.room-type-#{$type} {
      border-color: $color;
      
      &:hover {
        background-color: rgba($color, 0.1);
      }
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
</style> 