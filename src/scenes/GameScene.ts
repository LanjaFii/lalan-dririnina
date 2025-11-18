// E:\Projets\lalan-dririnina\src\scenes\GameScene.ts
import * as THREE from 'three'
import { Car } from '../objects/Car'
import { Road } from '../objects/Road'
// removed CreatureManager import (on veut pas de créatures)

export class GameScene {
  public scene: THREE.Scene
  public camera: THREE.PerspectiveCamera
  public renderer: THREE.WebGLRenderer
  public ready: Promise<void>
  private _readyResolve: (() => void) | null = null
  private car: Car
  private road: Road
  // private creatureManager: CreatureManager  <-- removed
  private clock: THREE.Clock
  private cameraShake: number = 0

  constructor() {
    this.scene = new THREE.Scene()
    // increase far plane A LOT so decor never disappear
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 4000)
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.car = null as any
    this.road = null as any
    this.clock = new THREE.Clock()
    this.ready = new Promise((resolve) => { this._readyResolve = resolve })

    this.init()
  }

  private async init(): Promise<void> {
    console.log('🎮 Initialisation du jeu...')
    // Fog étendu (loin)
    this.scene.fog = new THREE.Fog(0x0b0a12, 30, 3000)
    this.scene.background = new THREE.Color(0x0b1020)

    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setClearColor(0x000011)
    // désactiver shadows full cost si tu veux perf (les phares peuvent rester)
    this.renderer.shadowMap.enabled = false
    document.getElementById('app')!.appendChild(this.renderer.domElement)

    this.setupMinimalLighting()
    await this.setupGameObjects()
    this.setupEvents()
    console.log('✅ Jeu initialisé')
    this._readyResolve && this._readyResolve()
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

    // plus de CreatureManager (tu as demandé pas de créatures)
    // this.creatureManager = new CreatureManager(this.scene, this.road.roadWidth)
  }

  private setupCamera(): void {
    this.camera.position.set(0, 1.2, 0)
    this.camera.rotation.x = -0.15
    this.camera.updateProjectionMatrix()
  }

  private setupMinimalLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x334455, 0.08)
    this.scene.add(ambientLight)

    const moonLight = new THREE.DirectionalLight(0x445588, 0.08)
    moonLight.position.set(-20, 30, 10)
    moonLight.castShadow = false
    this.scene.add(moonLight)
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
    // now pass car position z so road can recycle decorations properly
    this.road.update(delta, this.car.speed, this.car.mesh.position.z)
    // removed creature update call

    // Caméra suit la moto
    this.camera.position.x = this.car.mesh.position.x
    this.camera.position.z = this.car.mesh.position.z + 1.2
    this.camera.position.y = 2.7

    this.camera.rotation.z = -this.car.mesh.position.x * 0.008

    // collisions removed (no creatures)
    if (this.cameraShake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * 0.1 * this.cameraShake
      this.camera.position.y += (Math.random() - 0.5) * 0.05 * this.cameraShake
      this.cameraShake -= delta * 2
    }

    this.renderer.render(this.scene, this.camera)
  }
}
