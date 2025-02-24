<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="death-modal" @click.stop>
      <div class="modal-header">
        <h2>Décès 💀</h2>
        <button class="close-button" @click="$emit('close')">×</button>
      </div>
      <div class="modal-content">
        <div class="death-message">
          <p>{{ habitant.nom }} est décédé(e) de vieillesse à l'âge de {{ formatAge(habitant.age) }}. 😢</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
import type { Habitant } from '../stores/gameStore'
import { useModal } from '../composables/useModal'

useModal()

const props = defineProps<{
  habitant: Habitant
}>()

function formatAge(age: number): string {
  const ageEnAnnees = Math.floor(age / 52)
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

.death-modal {
  background-color: #2c3e50;
  border-radius: 8px;
  padding: 1.5rem;
  width: 90%;
  max-width: 500px;
  color: #ecf0f1;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;

  h2 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
}

.close-button {
  background: none;
  border: none;
  color: #ecf0f1;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  line-height: 1;

  &:hover {
    color: #e74c3c;
  }
}

.death-message {
  text-align: center;
  font-size: 1.2rem;
  margin: 1rem 0;
}
</style> 