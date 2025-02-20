<template>
  <div class="modal-overlay">
    <div class="game-over-modal">
      <h2>Game Over</h2>
      <p>Tous les habitants de l'abri sont morts.</p>
      <div class="actions">
        <button @click="resetGame" class="reset-button">Recommencer une partie</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '../stores/gameStore'

const store = useGameStore()

function resetGame() {
  store.resetGame()
}
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.game-over-modal {
  background-color: #c0392b;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  animation: fadeIn 0.5s ease-out;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);

  h2 {
    font-size: 2.5rem;
    margin: 0 0 1rem;
    color: #fff;
    text-transform: uppercase;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  }

  p {
    font-size: 1.2rem;
    color: #fff;
    margin-bottom: 2rem;
  }

  .actions {
    .reset-button {
      background-color: #fff;
      color: #c0392b;
      font-size: 1.1rem;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background-color: #ecf0f1;
        transform: scale(1.05);
      }
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style> 