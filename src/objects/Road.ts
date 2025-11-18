// E:\Projets\lalan-dririnina\src\objects\Road.ts
import * as THREE from 'three'
import { loaderManager } from '../utils/Loaders'

export class Road {
  public mesh: THREE.Group
  private roadSegments: THREE.Mesh[] = []
  private groundSegments: THREE.Mesh[] = []
  private segmentLength: number = 100
  public roadWidth: number = 16
  private groundWidth: number = 80
  private treeModel?: THREE.Group
  private grassModel?: THREE.Group

  constructor() {
    this.mesh = new THREE.Group()
    this.loadModels()
      .then(() => this.createRoad())
      .catch(() => this.createRoad())
  }

  private async loadModels(): Promise<void> {
    try {
      console.log('🌳 Début chargement des modèles...')
      this.treeModel = await loaderManager.loadGLB('tree', '/models/arbre.glb')
      this.grassModel = await loaderManager.loadGLB('grass', '/models/grass.glb')

      this.treeModel.traverse((c) => {
        if (c instanceof THREE.Mesh) {
          c.castShadow = false
          c.receiveShadow = true
        }
      })
      this.grassModel.traverse((c) => {
        if (c instanceof THREE.Mesh) {
          c.castShadow = false
          c.receiveShadow = true
        }
      })

      // AUGMENTATION HERBE DE BASE
      this.treeModel.scale.set(2.5, 2.5, 2.5)
      this.grassModel.scale.set(2.5, 2.5, 2.5)

      console.log('🌿 Modèles chargés')
    } catch (error) {
      console.error('❌ Erreur chargement modèles:', error)
      this.createFallbackModels()
    }
  }

  private createFallbackModels(): void {
    const grassGroup = new THREE.Group()
    const gmat = new THREE.MeshStandardMaterial({ color: 0x336633, side: THREE.DoubleSide })
    for (let i = 0; i < 4; i++) {
      const blade = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 1.4), gmat)
      blade.rotation.x = Math.PI / 2
      blade.position.set((Math.random() - 0.5) * 0.6, 0.7, (Math.random() - 0.5) * 0.6)
      blade.castShadow = false
      grassGroup.add(blade)
    }
    this.grassModel = grassGroup
    console.log('🌾 Fallback grass created')
  }

  private createRoad(): void {
    for (let i = 0; i < 6; i++) {
      this.createRoadSegment(i * this.segmentLength)
    }
  }

  private createRoadSegment(zPosition: number): void {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(this.groundWidth, this.segmentLength),
      new THREE.MeshStandardMaterial({
        color: 0x5D4037,
        side: THREE.DoubleSide,
        roughness: 1.0,
        metalness: 0.0
      })
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.z = zPosition
    ground.receiveShadow = false
    ground.userData = { type: 'segment', subtype: 'ground' }
    this.mesh.add(ground)

    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(this.roadWidth, this.segmentLength),
      new THREE.MeshStandardMaterial({
        color: 0x2b2b2b,
        side: THREE.DoubleSide,
        roughness: 0.85,
        metalness: 0.05
      })
    )
    road.rotation.x = -Math.PI / 2
    road.position.z = zPosition
    road.receiveShadow = false
    road.userData = { type: 'segment', subtype: 'road' }
    this.mesh.add(road)

    this.roadSegments.push(road)
    this.groundSegments.push(ground)

    this.addTrees(zPosition)
    this.addGrass(zPosition)
    this.addNaturalElements(zPosition)
  }

  private addTrees(zPosition: number): void {
    if (!this.treeModel) return
    const treeSpacing = 25
    const treesPerSide = Math.floor(this.segmentLength / treeSpacing)
    const offsetFromRoad = this.roadWidth / 2 + 12

    for (let i = 0; i < treesPerSide; i++) {
      const z = zPosition - this.segmentLength / 2 + i * treeSpacing + Math.random() * 10

      const createTree = (side: number) => {
        const tree = this.treeModel!.clone()
        tree.position.set(side * offsetFromRoad + (Math.random() * 3 - 1.5), 0, z + Math.random() * 3 - 1.5)
        tree.rotation.y = Math.random() * Math.PI * 2
        tree.scale.setScalar(2.0 + Math.random() * 1.2)
        tree.userData = { decoration: true, subtype: 'tree' }
        this.mesh.add(tree)
      }
      createTree(-1)
      createTree(1)
    }
  }

  private addGrass(zPosition: number): void {
    if (!this.grassModel) return
    const grassSpacing = 7
    const grassPerSide = Math.floor(this.segmentLength / grassSpacing)
    const offsetFromRoad = this.roadWidth / 2 + 3

    for (let i = 0; i < grassPerSide; i++) {
      const z = zPosition - this.segmentLength / 2 + i * grassSpacing + Math.random() * 4

      const createGrass = (side: number, j: number) => {
        const grass = this.grassModel!.clone()
        const xOffset = side * offsetFromRoad + (j * 1.6) + (Math.random() * 2 - 1)
        grass.position.set(xOffset, 0, z + Math.random() * 2 - 1)
        grass.rotation.y = Math.random() * Math.PI
        grass.scale.setScalar(2.5 + Math.random() * 1.1)
        grass.userData = { decoration: true, subtype: 'grass' }
        this.mesh.add(grass)
      }

      for (let j = 0; j < 2; j++) createGrass(-1, j)
      for (let j = 0; j < 2; j++) createGrass(1, j)
    }
  }

  private addNaturalElements(zPosition: number): void {
    // inchangé
    const dirtMaterial = new THREE.MeshStandardMaterial({ color: 0x6B4423 })
    for (const side of [-1, 1]) {
      const dirt = new THREE.Mesh(new THREE.PlaneGeometry(2, this.segmentLength), dirtMaterial)
      dirt.rotation.x = -Math.PI / 2
      dirt.position.set(side * (this.roadWidth/2 + 1), 0.01, zPosition)
      dirt.userData = { decoration: true, subtype: 'dirt' }
      this.mesh.add(dirt)
    }
    this.addRocks(zPosition)
  }

  private addRocks(zPosition: number): void {
    for (let i = 0; i < 6; i++) {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.25 + Math.random() * 0.35),
        new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.9 })
      )
      const side = Math.random() > 0.5 ? 1 : -1
      rock.position.set(
        side * (this.roadWidth/2 + 6 + Math.random() * 10),
        0.25,
        zPosition - this.segmentLength/2 + Math.random() * this.segmentLength
      )
      rock.userData = { decoration: true, subtype: 'rock' }
      this.mesh.add(rock)
    }
  }

  public update(delta: number, carSpeed: number, carZ: number = 0): void {
    const move = carSpeed * 60 * delta
    const children = [...this.mesh.children]

    for (const child of children) {
      child.position.z += move

      if (child.position.z > carZ + 50 && child.userData?.type === 'segment') {
        child.position.z -= this.segmentLength * 6
      }

      if (child.userData?.decoration && child.position.z > carZ + 30) {
        child.position.z -= this.segmentLength * 6
        child.position.x += (Math.random() - 0.5) * 2
      }
    }
  }
}
