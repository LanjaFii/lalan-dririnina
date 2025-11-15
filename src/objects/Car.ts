import * as THREE from 'three'

export class Car {
  public mesh: THREE.Group
  public speed: number
  public position: THREE.Vector3
  public currentLane: number = 1 // 0, 1, 2, 3 (4 voies)
  public steeringWheel?: THREE.Mesh
  
  private maxSpeed: number
  private acceleration: number
  private deceleration: number
  private targetX: number = 0
  private laneWidth: number = 3
  private roadWidth: number = 12
  private wheelRotation: number = 0

  constructor() {
    this.mesh = new THREE.Group()
    this.speed = 0
    this.position = new THREE.Vector3(0, 0, 0)
    this.maxSpeed = 0.5
    this.acceleration = 0.0005
    this.deceleration = 0.001
    this.laneWidth = this.roadWidth / 4
    
    this.createCar()
    this.updateLanePosition()
  }

  private createCar(): void {
    // Intérieur de la voiture (première personne) - ULTRA MINIMALISTE
    const cabinGroup = new THREE.Group()
    
    // Tableau de bord (très discret)
    const dashboardGeometry = new THREE.BoxGeometry(1.5, 0.2, 0.05)
    const dashboardMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x0a0a0a, 
      metalness: 0.1, 
      roughness: 0.9 
    })
    const dashboard = new THREE.Mesh(dashboardGeometry, dashboardMaterial)
    dashboard.position.set(0, 0.15, -0.3) // Très bas
    dashboard.name = 'dashboard'
    cabinGroup.add(dashboard)

    // Volant seulement (élément principal visible)
    const steeringWheelGeometry = new THREE.TorusGeometry(0.15, 0.02, 8, 16)
    const steeringWheelMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x222222, 
      metalness: 0.4, 
      roughness: 0.3 
    })
    this.steeringWheel = new THREE.Mesh(steeringWheelGeometry, steeringWheelMaterial)
    this.steeringWheel.rotation.x = Math.PI / 2
    this.steeringWheel.position.set(0.25, 0.35, -0.25) // Position latérale basse
    cabinGroup.add(this.steeringWheel)

    // SUPPRIMÉ: Pare-brise, capot, et autres éléments qui créent des filtres
    // SUPPRIMÉ: Cadran de vitesse qui peut obstruer

    this.mesh.add(cabinGroup)

    // Corps de la voiture (extérieur - BIEN EN DESSOUS de la caméra)
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x3366ff, 
      metalness: 0.3, 
      roughness: 0.4 
    })
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 4), bodyMaterial)
    body.position.y = -2.0 // TRÈS BAS pour être sûr qu'il soit hors de vue
    body.castShadow = true
    this.mesh.add(body)

    // Roues (également très basses)
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 })
    const wheelGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.3, 12)
    
    const wheelPositions = [
      [-0.7, -1.8, 0.8],  // Y position très basse
      [0.7, -1.8, 0.8],
      [-0.7, -1.8, -0.8],
      [0.7, -1.8, -0.8]
    ]
    
    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial)
      wheel.rotation.z = Math.PI / 2
      wheel.position.set(pos[0], pos[1], pos[2])
      wheel.castShadow = true
      this.mesh.add(wheel)
    })

    // Position initiale
    this.mesh.position.set(0, 0, 0)
  }

  private updateLanePosition(): void {
    const laneCenter = -this.roadWidth / 2 + this.laneWidth * (this.currentLane + 0.5)
    this.targetX = laneCenter
  }

  public hit(): void {
    this.speed = Math.max(0, this.speed - 0.1)
    // Flash rouge très subtil
    this.mesh.traverse((child) => {
      if ((child as THREE.Mesh).material && child.name === 'dashboard') {
        const m = (child as THREE.Mesh).material as any
        if (m.color) {
          const originalColor = m.color.clone()
          m.color.set(0x442222)
          setTimeout(() => m.color.copy(originalColor), 200)
        }
      }
    })
  }

  public handleInput(key: string, isPressed: boolean): void {
    switch (key.toLowerCase()) {
      case 'arrowleft':
      case 'a':
        if (isPressed && this.currentLane > 0) {
          this.currentLane--
          this.updateLanePosition()
        }
        break
      case 'arrowright':
      case 'd':
        if (isPressed && this.currentLane < 3) {
          this.currentLane++
          this.updateLanePosition()
        }
        break
      case 'arrowup':
      case 'w':
        if (isPressed) {
          this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed)
        }
        break
      case 'arrowdown':
      case 's':
        if (isPressed) {
          this.speed = Math.max(this.speed - this.deceleration * 2, 0)
        }
        break
    }
  }

  public update(delta: number): void {
    // Accélération progressive
    this.acceleration += 0.000001
    this.maxSpeed += 0.00001

    // Maintien de la vitesse
    this.speed = Math.max(this.speed - this.deceleration * 0.05, 0)

    // Déplacement latéral fluide vers la voie cible
    this.mesh.position.x += (this.targetX - this.mesh.position.x) * 0.1

    // Animation du volant
    const targetWheelRotation = (this.targetX - this.mesh.position.x) * 3
    this.wheelRotation += (targetWheelRotation - this.wheelRotation) * 0.1
    if (this.steeringWheel) {
      this.steeringWheel.rotation.z = this.wheelRotation
    }

    // Avancer
    this.mesh.position.z -= this.speed * delta * 60

    this.position.copy(this.mesh.position)
  }
}