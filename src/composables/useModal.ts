import { onMounted, onUnmounted } from 'vue'

export function useModal() {
  console.log('useModal initialized')
  let siloContainer: HTMLElement | null = null

  const addModalClass = () => {
    console.log('Adding modal-open class')
    document.body.classList.add('modal-open')
    siloContainer = document.querySelector('.silo-container')
    if (siloContainer) {
      siloContainer.style.overflow = 'hidden'
      siloContainer.style.height = '100vh'
    }
  }

  const removeModalClass = () => {
    console.log('Removing modal-open class')
    document.body.classList.remove('modal-open')
    if (siloContainer) {
      siloContainer.style.overflow = ''
      siloContainer.style.height = ''
    }
  }

  onMounted(() => {
    console.log('Modal component mounted')
    addModalClass()
  })

  onUnmounted(() => {
    console.log('Modal component unmounted')
    removeModalClass()
  })

  return {
    addModalClass,
    removeModalClass
  }
} 