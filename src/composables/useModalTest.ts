import { onMounted, onUnmounted } from 'vue'

export function useModalTest() {
  console.log('useModalTest mounted')
  
  onMounted(() => {
    console.log('Adding modal-open class')
    document.body.classList.add('modal-open')
  })

  onUnmounted(() => {
    console.log('Removing modal-open class')
    document.body.classList.remove('modal-open')
  })
} 