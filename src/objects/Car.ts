import * as THREE from 'three'
import { loaderManager } from '../utils/Loaders'

export class Car {
  public mesh: THREE.Group
  public speed: number
  public position: THREE.Vector3
  public currentLane: number = 1
  public steeringWheel?: THREE.Mesh
  public headlights!: THREE.SpotLight

  private maxSpeed: number
  private targetX: number = 0
  private laneWidth: number = 4
  private roadWidth: number = 16
  private wheelRotation: number = 0
  private motorcycle?: THREE.Group

  // Pivots séparés pour différents éléments
  private tiltPivot: THREE.Group = new THREE.Group() // Pour l'inclinaison de la moto
  private headlightPivot: THREE.Group = new THREE.Group() // Pour les phares (indépendant)
  private currentTilt: number = 0

  // Nouveaux paramètres pour le comportement réaliste
  private currentAcceleration: number = 0
  private accelerationRate: number = 0.0005
  private decelerationRate: number = 0.002
  private engineBrakeRate: number = 0.001
  private maxAcceleration: number = 0.001
  private isAccelerating: boolean = false
  private isBraking: boolean = false

  // Vibration - PARAMÈTRES AUGMENTÉS
  private vibrationIntensity: number = 0
  private vibrationFrequency: number = 25 // Fréquence augmentée
  private engineVibration: number = 0
  private roadVibration: number = 0

  // Feux de freinage
  private brakeLight?: THREE.PointLight
  private brakeLightIntensity: number = 0

  constructor() {
    this.mesh = new THREE.Group()
    this.speed = 0
    this.position = new THREE.Vector3(0, 0, 0)
    
    // Paramètres ajustés pour une moto réaliste
    this.maxSpeed = 0.6
    this.laneWidth = this.roadWidth / 4

    // Ajouter les pivots à la mesh principale
    this.mesh.add(this.tiltPivot)
    this.mesh.add(this.headlightPivot)

    this.createMotorcycle()
    this.updateLanePosition()
  }

  private async createMotorcycle(): Promise<void> {
    try {
      console.log('🏍️ Chargement moto...')

      this.motorcycle = await loaderManager.loadGLB('motorcycle', '/models/moto.glb')

      console.log('✅ Moto GLB OK')

      // Échelle
      this.motorcycle.scale.set(1.5, 1.5, 1.5)

      // Décalage avant
      this.motorcycle.position.set(0, 0, 1.0)

      // ORIENTATION FIXE
      this.motorcycle.rotation.y = Math.PI / 2

      // Ombres - DÉSACTIVER LES OMBRES PORTÉES PAR LA MOTO
      this.motorcycle.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = false
          child.receiveShadow = true
        }
      })

      // METTRE LA MOTO DANS LE PIVOT D'INCLINAISON
      this.tiltPivot.add(this.motorcycle)

      // CONFIGURER LES PHARES APRÈS AVOIR LA MOTO
      this.setupHeadlights()
      this.setupBrakeLight()

      this.createFirstPersonView()

      console.log('🏁 Moto + guidon ajoutés')

    } catch (error) {
      console.error('❌ Erreur GLB moto:', error)
      this.createFallbackMotorcycle()
    }
  }

  private setupHeadlights(): void {
    console.log('💡 Configuration des phares de moto...')
    
    // CRÉER UN GROUPE POUR LES PHARES QUI SUIT LA MOTO
    const headlightGroup = new THREE.Group()
    
    // POSITION RELATIVE PAR RAPPORT À LA MOTO
    // On place les phares sur l'avant de la moto, pas dans le monde absolu
    
    // PHARE PRINCIPAL - positionné sur l'avant de la moto
    this.headlights = new THREE.SpotLight(0xffffcc, 6)
    this.headlights.angle = Math.PI / 5
    this.headlights.penumbra = 0.4
    this.headlights.decay = 0.8
    this.headlights.distance = 100
    this.headlights.castShadow = true
    
    // POSITION RELATIVE : sur l'avant de la moto
    this.headlights.position.set(0, 0.5, 2.0) // Devant la moto
    
    // Cible sur la route devant
    this.headlights.target.position.set(0, -0.3, -40)
    
    headlightGroup.add(this.headlights)
    headlightGroup.add(this.headlights.target)
    
    // PHARE SECONDAIRE pour un éclairage plus large
    const wideBeam = new THREE.SpotLight(0xffffaa, 3)
    wideBeam.angle = Math.PI / 3
    wideBeam.penumbra = 0.5
    wideBeam.decay = 0.8
    wideBeam.distance = 60
    wideBeam.castShadow = false
    
    wideBeam.position.set(0, 0.4, 1.8)
    wideBeam.target.position.set(0, -0.1, -25)
    
    headlightGroup.add(wideBeam)
    wideBeam.target.position.set(0, -0.1, -25)
    headlightGroup.add(wideBeam.target)
    
    // LUMIÈRE D'APPUI pour éliminer les ombres résiduelles
    const fillLight = new THREE.PointLight(0xffffcc, 1, 15)
    fillLight.position.set(0, 0.8, 0.5)
    fillLight.castShadow = false
    headlightGroup.add(fillLight)
    
    // AJOUTER LE GROUPE DES PHARES AU HEADLIGHT PIVOT
    this.headlightPivot.add(headlightGroup)
    
    console.log('💡 Phares configurés - position relative à la moto')
  }

  private setupBrakeLight(): void {
    console.log('🔴 Configuration du feu de freinage...')
    
    // Créer un feu de freinage rouge à l'arrière de la moto
    this.brakeLight = new THREE.PointLight(0xff0000, 0, 8) // Intensité initiale à 0
    this.brakeLight.position.set(0, 0.5, -1.5) // Arrière de la moto
    this.brakeLight.castShadow = false
    
    // Ajouter le feu de freinage à la moto
    this.tiltPivot.add(this.brakeLight)
    
    console.log('🔴 Feu de freinage configuré')
  }

  private createFirstPersonView(): void {
    const handlebarGroup = new THREE.Group()

    const mainBarGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8)
    const mainBarMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.2,
    })
    const mainBar = new THREE.Mesh(mainBarGeometry, mainBarMaterial)
    mainBar.rotation.z = Math.PI / 2

    const gripGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.1, 8)
    const gripMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 })

    const leftGrip = new THREE.Mesh(gripGeometry, gripMaterial)
    leftGrip.position.set(-0.35, 0, 0)

    const rightGrip = new THREE.Mesh(gripGeometry, gripMaterial)
    rightGrip.position.set(0.35, 0, 0)

    handlebarGroup.add(mainBar, leftGrip, rightGrip)

    handlebarGroup.position.set(0.3, 0.4, -0.2)
    handlebarGroup.rotation.x = Math.PI * 0.1

    this.mesh.add(handlebarGroup)
    this.steeringWheel = mainBar
  }

  private createFallbackMotorcycle(): void {
    const group = new THREE.Group()

    const frame = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 1.6, 8),
      new THREE.MeshStandardMaterial({ color: 0xcc0000 })
    )
    frame.rotation.z = Math.PI / 2
    frame.position.set(0, 0.6, 1.0)
    frame.castShadow = false

    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.08, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    )
    seat.position.set(0, 0.65, 0.9)
    seat.castShadow = false

    const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.12, 16)
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 })

    const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial)
    frontWheel.rotation.z = Math.PI / 2
    frontWheel.position.set(0.8, 0.3, 1.0)
    frontWheel.castShadow = false

    const backWheel = new THREE.Mesh(wheelGeometry, wheelMaterial)
    backWheel.rotation.z = Math.PI / 2
    backWheel.position.set(-0.6, 0.3, 1.0)
    backWheel.castShadow = false

    group.add(frame, seat, frontWheel, backWheel)

    this.tiltPivot.add(group)
    
    // Configurer les phares après la moto de secours
    this.setupHeadlights()
    this.setupBrakeLight()
  }

  private updateLanePosition(): void {
    const laneCenter = -this.roadWidth / 2 + this.laneWidth * (this.currentLane + 0.5)
    this.targetX = laneCenter
  }

  public hit(): void {
    this.speed = Math.max(0, this.speed - 0.2)

    if (this.tiltPivot) {
      this.tiltPivot.rotation.z = 0.3
      setTimeout(() => {
        this.tiltPivot.rotation.z = 0
      }, 200)
    }
  }

  public handleInput(key: string, isPressed: boolean): void {
    switch (key.toLowerCase()) {
      case 'arrowleft':
      case 'a':
      case 'q': // Ajout de Q pour ZQSD
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
      case 'z': // Ajout de Z pour ZQSD
        this.isAccelerating = isPressed
        if (!isPressed && !this.isBraking) {
          // Frein moteur quand on relève l'accélérateur et qu'on ne freine pas activement
          this.currentAcceleration = -this.engineBrakeRate
        }
        break

      case 'arrowdown':
      case 's':
        this.isBraking = isPressed
        if (isPressed) {
          // Freinage actif - plus fort que le frein moteur
          this.currentAcceleration = -this.decelerationRate * 3
        } else {
          // Retour au comportement normal quand on relâche le frein
          if (this.isAccelerating) {
            this.currentAcceleration = this.accelerationRate
          } else {
            this.currentAcceleration = -this.engineBrakeRate
          }
        }
        break
    }
  }

  public update(delta: number): void {
    // Augmentation progressive de la difficulté
    this.accelerationRate += 0.0000002
    this.maxSpeed += 0.000002

    // Gestion réaliste de l'accélération
    if (this.isAccelerating && !this.isBraking) {
      // Augmentation progressive de l'accélération
      this.currentAcceleration = Math.min(
        this.currentAcceleration + this.accelerationRate * delta * 60,
        this.maxAcceleration
      )
    } else if (this.isBraking) {
      // Freinage actif - décélération forte
      this.currentAcceleration = Math.max(
        this.currentAcceleration - this.decelerationRate * delta * 60 * 2,
        -this.decelerationRate * 4
      )
    } else {
      // Décélération progressive (frein moteur) quand on n'accélère pas et ne freine pas
      this.currentAcceleration = Math.max(
        this.currentAcceleration - this.decelerationRate * delta * 60,
        -this.engineBrakeRate
      )
    }

    // Application de l'accélération à la vitesse
    this.speed += this.currentAcceleration * delta * 60
    
    // Limites de vitesse
    this.speed = Math.max(0, Math.min(this.speed, this.maxSpeed))

    // CALCUL DES VIBRATIONS AMÉLIORÉ
    this.updateVibrations()

    // Gestion du feu de freinage (delta utilisé maintenant)
    this.updateBrakeLight(delta)

    // Déplacement latéral smooth
    this.mesh.position.x += (this.targetX - this.mesh.position.x) * 0.1

    // Rotation du guidon
    const targetWheelRotation = (this.targetX - this.mesh.position.x) * 2
    this.wheelRotation += (targetWheelRotation - this.wheelRotation) * 0.1
    if (this.steeringWheel) {
      this.steeringWheel.rotation.z = this.wheelRotation
    }

    // INCLINAISON DE LA MOTO (séparée des vibrations)
    const tiltAmount = -(this.targetX - this.mesh.position.x) * 0.08
    this.currentTilt += (tiltAmount - this.currentTilt) * 0.15
    this.tiltPivot.rotation.z = this.currentTilt

    // APPLICATION DES VIBRATIONS AMÉLIORÉES
    this.applyVibrations()

    // Avancer
    this.mesh.position.z -= this.speed * delta * 60

    this.position.copy(this.mesh.position)
  }

  private updateVibrations(): void {
    // Vibration du moteur - plus intense à basse vitesse et quand on accélère
    const engineBaseIntensity = this.isAccelerating ? 0.3 : 0.1
    const engineSpeedFactor = (1 - this.speed / this.maxSpeed) * 0.7 + 0.3 // Plus fort à basse vitesse
    this.engineVibration = engineBaseIntensity * engineSpeedFactor * this.speed

    // Vibration de la route - proportionnelle à la vitesse
    this.roadVibration = this.speed * 0.25 // INTENSITÉ AUGMENTÉE (0.15 → 0.25)

    // Vibration totale combinée
    this.vibrationIntensity = this.engineVibration + this.roadVibration
    
    // Fréquence qui augmente avec la vitesse
    this.vibrationFrequency = 20 + this.speed * 30 // 20-50 Hz selon la vitesse
  }

  private applyVibrations(): void {
    if (this.vibrationIntensity > 0) {
      const time = Date.now() * 0.001
      
      // Vibration verticale principale - PLUS INTENSE
      const verticalVib = Math.sin(time * this.vibrationFrequency) * this.vibrationIntensity
      const verticalVib2 = Math.cos(time * this.vibrationFrequency * 1.7) * this.vibrationIntensity * 0.6
      this.mesh.position.y += (verticalVib + verticalVib2) * 0.02 // AMPLITUDE AUGMENTÉE
      
      // Vibration latérale subtile
      const lateralVib = Math.sin(time * this.vibrationFrequency * 0.8) * this.vibrationIntensity * 0.3
      this.mesh.position.x += lateralVib * 0.01
      
      // Vibration de rotation du moteur - PLUS PRONONCÉE
      const rotationVib = Math.sin(time * this.vibrationFrequency * 2.5) * this.vibrationIntensity
      const pitchVib = Math.sin(time * this.vibrationFrequency * 1.2) * this.vibrationIntensity * 0.4
      
      this.tiltPivot.rotation.x = rotationVib * 0.03 // AMPLITUDE AUGMENTÉE
      this.tiltPivot.rotation.y = pitchVib * 0.01
      
      // Vibration supplémentaire à haute vitesse
      if (this.speed > this.maxSpeed * 0.7) {
        const highSpeedVib = Math.sin(time * this.vibrationFrequency * 3) * (this.speed - this.maxSpeed * 0.7) * 0.5
        this.mesh.position.y += highSpeedVib * 0.015
      }
    } else {
      // Réinitialiser les rotations quand il n'y a pas de vibration
      this.tiltPivot.rotation.x = 0
      this.tiltPivot.rotation.y = 0
    }
  }

  private updateBrakeLight(delta: number): void {
    if (!this.brakeLight) return

    // Intensité du feu de freinage basée sur l'état de freinage
    const targetIntensity = this.isBraking ? 3 : 0
    // Utilisation de delta pour un lissage temporel correct
    this.brakeLightIntensity += (targetIntensity - this.brakeLightIntensity) * (delta * 10)
    
    // Appliquer l'intensité avec un effet de pulsation subtile pendant le freinage
    if (this.isBraking) {
      const pulse = Math.sin(Date.now() * 0.01) * 0.5 + 1.0
      this.brakeLight.intensity = this.brakeLightIntensity * pulse
    } else {
      this.brakeLight.intensity = this.brakeLightIntensity
    }
  }
}