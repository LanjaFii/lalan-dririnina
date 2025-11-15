import * as THREE from 'three'
import { Car } from '../objects/Car'
import { Road } from '../objects/Road'
import { CreatureManager } from '../objects/Creature'

export class GameScene {
  public scene: THREE.Scene = new THREE.Scene()
  public camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  public renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({ antialias: true })
  private car: Car = null as any
  private road: Road = null as any
  private creatureManager: CreatureManager = null as any
  private clock: THREE.Clock = new THREE.Clock()
  private cameraShake: number = 0

  constructor() {
    this.init()
  }

  private init(): void {
    this.scene = new THREE.Scene()
    // Fog plus léger pour mieux voir les lignes
    this.scene.fog = new THREE.Fog(0x0b0a12, 30, 300)
    this.scene.background = new THREE.Color(0x0b1020)

    // Camera première personne avec meilleur champ de vision
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000)
    
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance"
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setClearColor(0x000011)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    document.getElementById('app')!.appendChild(this.renderer.domElement)

    this.setupLighting()
    this.setupGameObjects()
    this.setupEvents()
  }

  private setupGameObjects(): void {
    this.car = new Car()
    this.road = new Road()
    
    this.scene.add((this.road as any).mesh)
    this.scene.add((this.car as any).mesh)

    // IMPORTANT: Ne PAS attacher la caméra au mesh de la voiture
    // La caméra reste indépendante mais suit la voiture manuellement
    this.camera.position.set(0, 0.6, 0) // Position de vue première personne
    
    // Phares comme source de lumière principale
    const headlights = new THREE.SpotLight(0xffffcc, 3)
    headlights.angle = Math.PI / 5
    headlights.penumbra = 0.4
    headlights.decay = 1
    headlights.distance = 100
    headlights.castShadow = true
    headlights.position.set(0, 0.5, 1) // Position relative à la scène
    headlights.target.position.set(0, 0.3, -50)
    
    this.scene.add(headlights)
    this.scene.add(headlights.target)

    this.creatureManager = new CreatureManager(this.scene, (this.road as any).roadWidth)
  }

  private setupLighting(): void {
    // Ambiance nuit - éclairage plus fort pour mieux voir la route
    const ambientLight = new THREE.AmbientLight(0x556677, 0.25)
    this.scene.add(ambientLight)

    // Lune plus forte
    const moonLight = new THREE.DirectionalLight(0x445588, 0.3)
    moonLight.position.set(-20, 30, 10)
    moonLight.castShadow = true
    moonLight.shadow.mapSize.width = 1024
    moonLight.shadow.mapSize.height = 1024
    this.scene.add(moonLight)

    // Lueur d'horizon réduite
    const hemi = new THREE.HemisphereLight(0xff8844, 0x080820, 0.05)
    this.scene.add(hemi)
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

    // La caméra suit la voiture manuellement (position et rotation)
    this.camera.position.x = this.car.mesh.position.x
    this.camera.position.z = this.car.mesh.position.z + 0.5 // Léger décalage avant
    
    // Légère rotation de la caméra avec le mouvement latéral
    this.camera.rotation.z = -this.car.mesh.position.x * 0.02

    // Gestion des collisions
    if (this.creatureManager.checkCollision(this.car.mesh)) {
      this.car.hit()
      this.cameraShake = 1.0
    }

    // Effet de secousse de caméra
    if (this.cameraShake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * 0.1 * this.cameraShake
      this.camera.position.y += (Math.random() - 0.5) * 0.05 * this.cameraShake
      this.cameraShake -= delta * 2
    }

    this.renderer.render(this.scene, this.camera)
  }
}