export class TouchControls {
  private upButton: HTMLDivElement
  private downButton: HTMLDivElement
  private leftButton: HTMLDivElement
  private rightButton: HTMLDivElement
  private controlsContainer: HTMLDivElement

  public keys: Set<string> = new Set()

  constructor() {
    this.controlsContainer = document.createElement('div')
    this.controlsContainer.className = 'touch-controls'
    
    this.upButton = this.createButton('up', '↑')
    this.downButton = this.createButton('down', '↓')
    this.leftButton = this.createButton('left', '←')
    this.rightButton = this.createButton('right', '→')

    this.setupControls()
    this.setupEvents()
  }

  private createButton(direction: string, label: string): HTMLDivElement {
    const button = document.createElement('div')
    button.className = `touch-button ${direction}`
    button.textContent = label
    return button
  }

  private setupControls(): void {
    // Container gauche (haut/bas)
    const leftContainer = document.createElement('div')
    leftContainer.className = 'touch-container left'
    leftContainer.appendChild(this.upButton)
    leftContainer.appendChild(this.downButton)

    // Container droit (gauche/droite)
    const rightContainer = document.createElement('div')
    rightContainer.className = 'touch-container right'
    rightContainer.appendChild(this.leftButton)
    rightContainer.appendChild(this.rightButton)

    this.controlsContainer.appendChild(leftContainer)
    this.controlsContainer.appendChild(rightContainer)
    document.getElementById('app')!.appendChild(this.controlsContainer)
  }

  private setupEvents(): void {
    // Événements pour les boutons haut/bas
    this.setupButtonEvents(this.upButton, 'z')
    this.setupButtonEvents(this.downButton, 's')

    // Événements pour les boutons gauche/droite
    this.setupButtonEvents(this.leftButton, 'q')
    this.setupButtonEvents(this.rightButton, 'd')
  }

  private setupButtonEvents(button: HTMLDivElement, key: string): void {
    const addKey = () => this.keys.add(key)
    const removeKey = () => this.keys.delete(key)

    // Événements tactiles
    button.addEventListener('touchstart', (e) => {
      e.preventDefault()
      addKey()
    })

    button.addEventListener('touchend', (e) => {
      e.preventDefault()
      removeKey()
    })

    button.addEventListener('touchcancel', (e) => {
      e.preventDefault()
      removeKey()
    })

    // Événements souris (pour les tests sur desktop)
    button.addEventListener('mousedown', (e) => {
      e.preventDefault()
      addKey()
    })

    button.addEventListener('mouseup', (e) => {
      e.preventDefault()
      removeKey()
    })

    button.addEventListener('mouseleave', (e) => {
      e.preventDefault()
      removeKey()
    })
  }

  public updateCarInput(car: any): void {
    // Mettre à jour les entrées de la voiture/moto basées sur les touches actives
    this.keys.forEach(key => {
      car.handleInput(key, true)
    })
  }

  public isEnabled(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }

  public destroy(): void {
    this.controlsContainer.remove()
  }
}