import * as THREE from 'three'
import { Car } from '../objects/Car'
import { Road } from '../objects/Road'
import { CreatureManager } from '../objects/Creature'

export class GameScene {
  public scene: THREE.Scene
  public camera: THREE.PerspectiveCamera
  public renderer: THREE.WebGLRenderer
  private car: Car
  private road: Road
  private creatureManager: CreatureManager
  private clock: THREE.Clock
  private cameraShake: number = 0

  constructor() {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.car = null as any
    this.road = null as any
    this.creatureManager = null as any
    this.clock = new THREE.Clock()
    
    this.init()
  }

  private async init(): Promise<void> {
    console.log('🎮 Initialisation du jeu...')
    
    // Scene - brouillard réduit pour mieux voir
    this.scene.fog = new THREE.Fog(0x0b0a12, 30, 250)
    this.scene.background = new THREE.Color(0x0b1020)

    // Renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setClearColor(0x000011)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    document.getElementById('app')!.appendChild(this.renderer.domElement)

    // ÉCLAIRAGE AMBIANT TRES FAIBLE pour laisser place aux phares
    this.setupMinimalLighting()
    
    await this.setupGameObjects()
    this.setupEvents()

    console.log('✅ Jeu initialisé')
  }

  private async setupGameObjects(): Promise<void> {
    console.log('🚗 Création de la moto...')
    this.car = new Car()
    
    console.log('🛣️ Création de la route...')
    this.road = new Road()
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    this.scene.add(this.road.mesh)
    this.scene.add(this.car.mesh)
    console.log('✅ Objets ajoutés à la scène')

    // CAMÉRA
    this.setupCamera()

    this.creatureManager = new CreatureManager(this.scene, this.road.roadWidth)
    console.log('👹 CreatureManager créé')
  }

  private setupCamera(): void {
    this.camera.position.set(0, 1.2, 0)
    this.camera.rotation.x = -0.15
  }

  private setupMinimalLighting(): void {
    // ÉCLAIRAGE AMBIANT MINIMAL - juste assez pour voir les contours
    const ambientLight = new THREE.AmbientLight(0x334455, 0.08) // Très faible
    this.scene.add(ambientLight)

    // Lune très discrète
    const moonLight = new THREE.DirectionalLight(0x445588, 0.1) // Très faible
    moonLight.position.set(-20, 30, 10)
    moonLight.castShadow = false // Pas d'ombre de la lune
    this.scene.add(moonLight)

    console.log('💡 Éclairage ambiant minimal configuré')
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
    this.road.update(delta, this.car.speed)
    this.creatureManager.update(delta, this.car.position)

    // Caméra suit la moto
    this.camera.position.x = this.car.mesh.position.x
    this.camera.position.z = this.car.mesh.position.z + 1.2
    this.camera.position.y = 2.7

    // Légère rotation de caméra dans les virages
    this.camera.rotation.z = -this.car.mesh.position.x * 0.008

    // Collisions
    if (this.creatureManager.checkCollision(this.car.mesh)) {
      this.car.hit()
      this.cameraShake = 1.0
    }

    // Secousse de caméra
    if (this.cameraShake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * 0.1 * this.cameraShake
      this.camera.position.y += (Math.random() - 0.5) * 0.05 * this.cameraShake
      this.cameraShake -= delta * 2
    }

    this.renderer.render(this.scene, this.camera)
  }
}