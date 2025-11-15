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
    // Intérieur de la voiture (première personne)
    const cabinGroup = new THREE.Group()
    
    // Tableau de bord
    const dashboardGeometry = new THREE.BoxGeometry(2.5, 0.8, 0.3)
    const dashboardMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2a2a2a, 
      metalness: 0.1, 
      roughness: 0.8 
    })
    const dashboard = new THREE.Mesh(dashboardGeometry, dashboardMaterial)
    dashboard.position.set(0, 0.4, -0.5)
    dashboard.name = 'dashboard'
    cabinGroup.add(dashboard)

    // Volant
    const steeringWheelGeometry = new THREE.TorusGeometry(0.3, 0.05, 16, 32)
    const steeringWheelMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333333, 
      metalness: 0.3, 
      roughness: 0.4 
    })
    this.steeringWheel = new THREE.Mesh(steeringWheelGeometry, steeringWheelMaterial)
    this.steeringWheel.rotation.x = Math.PI / 2
    this.steeringWheel.position.set(0.4, 0.7, -0.3)
    cabinGroup.add(this.steeringWheel)

    // Cadran de vitesse
    const speedometerGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.02, 32)
    const speedometerMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x001122,
      emissive: 0x0044ff,
      emissiveIntensity: 0.3
    })
    const speedometer = new THREE.Mesh(speedometerGeometry, speedometerMaterial)
    speedometer.rotation.x = Math.PI / 2
    speedometer.position.set(-0.3, 0.6, -0.4)
    cabinGroup.add(speedometer)

    // Pare-brise (verre)
    const windshieldGeometry = new THREE.PlaneGeometry(2.2, 0.8)
    const windshieldMaterial = new THREE.MeshStandardMaterial({
      color: 0x88aaff,
      transparent: true,
      opacity: 0.1,
      metalness: 0.9,
      roughness: 0.1
    })
    const windshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial)
    windshield.position.set(0, 0.9, -0.6)
    windshield.rotation.x = Math.PI * 0.1
    cabinGroup.add(windshield)

    this.mesh.add(cabinGroup)

    // Corps de la voiture (extérieur, moins visible en première personne)
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x3366ff, 
      metalness: 0.3, 
      roughness: 0.4 
    })
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 4), bodyMaterial)
    body.position.y = -0.5
    body.castShadow = true
    this.mesh.add(body)

    // Position initiale
    this.mesh.position.set(0, 0, 0)
  }

  private updateLanePosition(): void {
    const laneCenter = -this.roadWidth / 2 + this.laneWidth * (this.currentLane + 0.5)
    this.targetX = laneCenter
  }

  public hit(): void {
    this.speed = Math.max(0, this.speed - 0.1)
    // Flash rouge dans la cabine
    this.mesh.traverse((child) => {
      if ((child as THREE.Mesh).material && child.name === 'dashboard') {
        const m = (child as THREE.Mesh).material as any
        if (m.color) {
          m.color.set(0xff2222)
          setTimeout(() => m.color.set(0x2a2a2a), 200)
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
    const targetWheelRotation = (this.targetX - this.mesh.position.x) * 2
    this.wheelRotation += (targetWheelRotation - this.wheelRotation) * 0.1
    if (this.steeringWheel) {
      this.steeringWheel.rotation.z = this.wheelRotation
    }

    // Avancer
    this.mesh.position.z -= this.speed * delta * 60

    this.position.copy(this.mesh.position)
  }
}