import '@/style.css'
import { GameScene } from '@/scenes/GameScene'

class Game {
  private scene: GameScene
  
  constructor() {
    this.scene = new GameScene()
    // Attendre que la scène soit prête (chargement asynchrone des modèles)
    this.scene.ready.then(() => this.animate())
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