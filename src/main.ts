import '@/style.css'
import { GameScene } from '@/scenes/GameScene'

class Game {
  private scene: GameScene
  
  constructor() {
    this.scene = new GameScene()
    this.animate()
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate)
    this.scene.update()
  }
}

// Initialisation quand la page est chargée
window.addEventListener('DOMContentLoaded', () => {
  new Game()
})