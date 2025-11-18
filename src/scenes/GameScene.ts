// E:\Projets\lalan-dririnina\src\scenes\GameScene.ts
import * as THREE from 'three'
import { Car } from '../objects/Car'
import { Road } from '../objects/Road'

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
    // Désactiver complètement le shadow map pour éviter le clignotement
    this.renderer.shadowMap.enabled = false
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    document.getElementById('app')!.appendChild(this.renderer.domElement)

    this.setupOptimizedLighting()
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
    this.setupMotorcycleLight()
  }

  private setupCamera(): void {
    this.camera.position.set(0, 1.2, 0)
    this.camera.rotation.x = -0.15
    this.camera.updateProjectionMatrix()
  }

  private setupOptimizedLighting(): void {
    // Ambient light légèrement augmenté pour mieux voir la route marron
    const ambientLight = new THREE.AmbientLight(0x445566, 0.12) // Légèrement plus fort
    this.scene.add(ambientLight)

    const moonLight = new THREE.DirectionalLight(0x445588, 0.1) // Légèrement plus fort
    moonLight.position.set(-20, 30, 10)
    moonLight.castShadow = false
    this.scene.add(moonLight)
  }

  private setupMotorcycleLight(): void {
    // Créer un spot light pour les phares de la moto
    this.motorcycleLight = new THREE.SpotLight(
      0xffffff, // Couleur blanche
      0.8, // Intensité
      50, // Distance
      Math.PI / 6, // Angle
      0.5, // Pénumbra
      1 // Decay
    )
    
    // Positionner le phare plus haut et plus en avant
    this.motorcycleLight.position.set(0, 2.5, -3) // Plus haut (2.5 au lieu de ~1.2) et plus en avant (-3)
    this.motorcycleLight.target.position.set(0, 0, -20) // Pointer loin devant
    
    this.motorcycleLight.castShadow = false // Désactiver les ombres pour éviter le clignotement
    
    // Attacher la lumière à la moto
    this.car.mesh.add(this.motorcycleLight)
    this.car.mesh.add(this.motorcycleLight.target)
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

    // Caméra suit la moto
    this.camera.position.x = this.car.mesh.position.x
    this.camera.position.z = this.car.mesh.position.z + 1.2
    this.camera.position.y = 2.7

    this.camera.rotation.z = -this.car.mesh.position.x * 0.008

    // Mettre à jour la position de la lumière des phares
    if (this.motorcycleLight) {
      // La lumière suit déjà la moto car elle est attachée au mesh
      // On peut ajuster dynamiquement l'intensité si nécessaire
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