// E:\Projets\lalan-dririnina\src\scenes\GameScene.ts
import * as THREE from 'three'
import { Car } from '../objects/Car'
import { Road } from '../objects/Road'

interface Firefly {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  target: THREE.Vector3
  timer: number
  originalIntensity: number
}

export class GameScene {
  public scene: THREE.Scene
  public camera: THREE.PerspectiveCamera
  public renderer: THREE.WebGLRenderer
  public ready: Promise<void>
  private _readyResolve: (() => void) | null = null
  private car: Car
  private road: Road
  private clock: THREE.Clock
  private cameraShake: number = 0
  private motorcycleLight?: THREE.SpotLight
  private fireflies: Firefly[] = []
  private fireflyGroup: THREE.Group

  constructor() {
    this.scene = new THREE.Scene()
    // increase far plane A LOT so decor never disappear
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 4000)
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance" // Optimisation performance
    })
    this.car = null as any
    this.road = null as any
    this.clock = new THREE.Clock()
    this.fireflyGroup = new THREE.Group()
    this.ready = new Promise((resolve) => { this._readyResolve = resolve })

    this.init()
  }

  private async init(): Promise<void> {
    console.log('🎮 Initialisation du jeu...')
    // Fog étendu (loin) - maintenant plus sombre
    this.scene.fog = new THREE.Fog(0x000000, 20, 200) // Fog noir et plus court
    this.scene.background = new THREE.Color(0x000000) // CIEL NOIR COMPLET

    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setClearColor(0x000000) // Fond noir
    // Désactiver complètement le shadow map pour éviter le clignotement
    this.renderer.shadowMap.enabled = false
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    document.getElementById('app')!.appendChild(this.renderer.domElement)

    this.createFireflies()
    this.setupOptimizedLighting()
    await this.setupGameObjects()
    this.setupEvents()
    console.log('✅ Jeu initialisé')
    this._readyResolve && this._readyResolve()
  }

  private createFireflies(): void {
    console.log('🪰 Création des lucioles...')
    
    const fireflyCount = 15 // Pas beaucoup de lucioles comme demandé
    
    for (let i = 0; i < fireflyCount; i++) {
      this.createFirefly(i)
    }
    
    this.scene.add(this.fireflyGroup)
    console.log('🪰 Lucioles créées')
  }

  private createFirefly(index: number): void {
    // Créer une sphère très petite pour la luciole
    const geometry = new THREE.SphereGeometry(0.08, 8, 6)
    const material = new THREE.MeshBasicMaterial({
      color: 0x88ff88, // Vert lumineux
      transparent: true,
      opacity: 0.9
    })
    
    const mesh = new THREE.Mesh(geometry, material)
    
    // Position aléatoire autour de la route
    const angle = Math.random() * Math.PI * 2
    const distance = 8 + Math.random() * 15 // 8-23 unités de la route
    const height = 0.5 + Math.random() * 3 // Entre 0.5 et 3.5 de hauteur
    
    mesh.position.set(
      Math.cos(angle) * distance,
      height,
      Math.random() * 50 - 25 // Réparties sur 50 unités en Z
    )
    
    const firefly: Firefly = {
      mesh,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.02
      ),
      target: new THREE.Vector3().copy(mesh.position),
      timer: Math.random() * Math.PI * 2,
      originalIntensity: 0.8 + Math.random() * 0.4
    }
    
    // Initialiser la cible
    this.updateFireflyTarget(firefly)
    
    this.fireflies.push(firefly)
    this.fireflyGroup.add(mesh)
  }

  private updateFireflyTarget(firefly: Firefly): void {
    // Nouvelle position cible aléatoire
    const currentPos = firefly.mesh.position
    firefly.target.set(
      currentPos.x + (Math.random() - 0.5) * 10,
      Math.max(0.3, Math.min(4, currentPos.y + (Math.random() - 0.5) * 2)),
      currentPos.z + (Math.random() - 0.5) * 8
    )
    
    // Nouvelle vitesse aléatoire
    firefly.velocity.set(
      (Math.random() - 0.5) * 0.03,
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.03
    )
  }

  private updateFireflies(delta: number): void {
    const time = Date.now() * 0.001
    
    for (const firefly of this.fireflies) {
      // Mouvement vers la cible
      const direction = new THREE.Vector3()
        .subVectors(firefly.target, firefly.mesh.position)
        .normalize()
        .multiplyScalar(0.01)
      
      firefly.velocity.add(direction)
      firefly.velocity.multiplyScalar(0.98) // Friction
      
      firefly.mesh.position.add(firefly.velocity)
      
      // Vérifier si on est proche de la cible
      if (firefly.mesh.position.distanceTo(firefly.target) < 2) {
        this.updateFireflyTarget(firefly)
      }
      
      // Clignotement de la lumière
      firefly.timer += delta * 3
      const intensity = Math.sin(firefly.timer) * 0.3 + 0.7
      const pulse = Math.sin(firefly.timer * 2) * 0.2 + 0.8
      
      // Animation de clignotement
      const currentOpacity = intensity * pulse * firefly.originalIntensity
      ;(firefly.mesh.material as THREE.MeshBasicMaterial).opacity = currentOpacity
      
      // Changement de taille subtil
      const scale = 0.8 + Math.sin(firefly.timer * 3) * 0.2
      firefly.mesh.scale.setScalar(scale)
      
      // Recyclage si trop loin derrière
      if (firefly.mesh.position.z > this.car.mesh.position.z + 30) {
        firefly.mesh.position.z -= 60
        this.updateFireflyTarget(firefly)
      }
      
      // Empêcher les lucioles de sortir des limites
      if (Math.abs(firefly.mesh.position.x) > 40) {
        firefly.velocity.x *= -0.5
      }
      if (firefly.mesh.position.y < 0.2 || firefly.mesh.position.y > 5) {
        firefly.velocity.y *= -0.5
      }
    }
  }

  private async setupGameObjects(): Promise<void> {
    this.car = new Car()
    this.road = new Road()

    // léger delay pour s'assurer que la road a créé ses segments (si async)
    await new Promise(resolve => setTimeout(resolve, 600))

    this.scene.add(this.road.mesh)
    this.scene.add(this.car.mesh)
    console.log('✅ Objets ajoutés à la scène')

    this.setupCamera()
    this.setupMotorcycleLight()
  }

  private setupCamera(): void {
    this.camera.position.set(0, 1.2, 0)
    this.camera.rotation.x = -0.15
    this.camera.updateProjectionMatrix()
  }

  private setupOptimizedLighting(): void {
    // Ambient light très faible pour un environnement nocturne sombre
    const ambientLight = new THREE.AmbientLight(0x223344, 0.04) // Très faible
    this.scene.add(ambientLight)

    // Lune très faible ou supprimée pour plus de noirceur
    const moonLight = new THREE.DirectionalLight(0x334455, 0.03) // Extrêmement faible
    moonLight.position.set(-20, 30, 10)
    moonLight.castShadow = false
    this.scene.add(moonLight)
  }

  private setupMotorcycleLight(): void {
    // Créer un spot light pour les phares de la moto
    this.motorcycleLight = new THREE.SpotLight(
      0xffffff, // Couleur blanche
      1.2, // Intensité augmentée pour contraster avec l'obscurité
      60, // Distance augmentée
      Math.PI / 6, // Angle
      0.4, // Pénumbra
      1 // Decay
    )
    
    // Positionner le phare plus haut et plus en avant
    this.motorcycleLight.position.set(0, 2.5, -3)
    this.motorcycleLight.target.position.set(0, 0, -25) // Pointer plus loin
    
    this.motorcycleLight.castShadow = false
    
    // Attacher la lumière à la moto
    this.car.mesh.add(this.motorcycleLight)
    this.car.mesh.add(this.motorcycleLight.target)

    // Ajouter une légère lumière ambiante autour des phares
    const headlightGlow = new THREE.PointLight(0x88aaff, 0.3, 10)
    headlightGlow.position.set(0, 2, -2)
    this.car.mesh.add(headlightGlow)
  }

  private setupEvents(): void {
    window.addEventListener('resize', this.onWindowResize.bind(this))
    window.addEventListener('keydown', this.handleKeyDown.bind(this))
    window.addEventListener('keyup', this.handleKeyUp.bind(this))
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  private handleKeyDown(event: KeyboardEvent): void {
    this.car.handleInput(event.key, true)
  }

  private handleKeyUp(event: KeyboardEvent): void {
    this.car.handleInput(event.key, false)
  }

  public update(): void {
    const delta = this.clock.getDelta()

    this.car.update(delta)
    this.road.update(delta, this.car.speed, this.car.mesh.position.z)

    // Mettre à jour les lucioles
    this.updateFireflies(delta)

    // Caméra suit la moto
    this.camera.position.x = this.car.mesh.position.x
    this.camera.position.z = this.car.mesh.position.z + 1.2
    this.camera.position.y = 2.7

    this.camera.rotation.z = -this.car.mesh.position.x * 0.008

    // Mettre à jour la position de la lumière des phares
    if (this.motorcycleLight) {
      // La lumière suit déjà la moto car elle est attachée au mesh
    }

    // collisions removed (no creatures)
    if (this.cameraShake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * 0.1 * this.cameraShake
      this.camera.position.y += (Math.random() - 0.5) * 0.05 * this.cameraShake
      this.cameraShake -= delta * 2
    }

    this.renderer.render(this.scene, this.camera)
  }
}