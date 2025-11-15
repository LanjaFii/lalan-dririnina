import * as THREE from 'three'
import { loaderManager } from '../utils/Loaders'

export class Road {
  public mesh: THREE.Group
  private roadSegments: THREE.Mesh[] = []
  private groundSegments: THREE.Mesh[] = []
  private segmentLength: number = 100
  public roadWidth: number = 16
  private laneCount: number = 4
  private groundWidth: number = 80
  private treeModel?: THREE.Group

  constructor() {
    this.mesh = new THREE.Group()
    this.loadTreeModel()
    this.createRoad()
  }

  private async loadTreeModel(): Promise<void> {
    try {
      console.log('🌳 Début chargement arbre GLB...')
      
      // Utilisez loadGLB pour les arbres
      this.treeModel = await loaderManager.loadGLB('tree', '/models/arbre.glb')
      
      console.log('✅ Arbre GLB chargé, configuration...')
      
      // Ajustement d'échelle - ESSAYEZ DIFFÉRENTES VALEURS
      this.treeModel.scale.set(2.5, 2.5, 2.5) // Commencez par 2.5
      
      // Position de base
      this.treeModel.position.y = 0
      
      console.log(`🌳 Arbre configuré: ${this.treeModel.children.length} enfants`)
      
    } catch (error) {
      console.error('❌ Erreur chargement arbre GLB:', error)
      console.log('🔄 Création arbre de secours...')
      this.createFallbackTree()
    }
  }

  private createFallbackTree(): void {
    console.log('🔄 Création arbre de secours...')
    const treeGroup = new THREE.Group()
    
    const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.5, 4, 8)
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial)
    trunk.position.y = 2
    
    const foliageGeometry = new THREE.SphereGeometry(2.5, 10, 8)
    const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x228822 })
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial)
    foliage.position.y = 5
    
    treeGroup.add(trunk)
    treeGroup.add(foliage)
    
    this.treeModel = treeGroup
    console.log('✅ Arbre de secours créé')
  }

  private createRoad(): void {
    console.log('🛣️ Création de la route...')
    for (let i = 0; i < 4; i++) {
      this.createRoadSegment(i * this.segmentLength)
    }
    console.log('✅ Route créée avec 4 segments')
  }

  private createRoadSegment(zPosition: number): void {
    const laneWidth = this.roadWidth / this.laneCount
    
    // SOL
    const groundGeometry = new THREE.PlaneGeometry(this.groundWidth, this.segmentLength)
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x5D4037,
      side: THREE.DoubleSide,
      roughness: 1.0,
      metalness: 0.0
    })

    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.position.z = zPosition
    ground.receiveShadow = true

    // ROUTE
    const roadGeometry = new THREE.PlaneGeometry(this.roadWidth, this.segmentLength)
    const roadMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0.1
    })

    const road = new THREE.Mesh(roadGeometry, roadMaterial)
    road.rotation.x = -Math.PI / 2
    road.position.z = zPosition
    road.receiveShadow = true

    // LIGNES DE VOIE
    const lineGeometry = new THREE.PlaneGeometry(0.2, this.segmentLength * 0.8)
    const lineMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffff00,
      transparent: true,
      opacity: 0.9
    })

    for (let i = 1; i < this.laneCount; i++) {
      const x = -this.roadWidth / 2 + laneWidth * i
      const line = new THREE.Mesh(lineGeometry, lineMaterial)
      line.rotation.x = -Math.PI / 2
      line.position.set(x, 0.05, zPosition)
      this.mesh.add(line)
    }

    this.mesh.add(ground)
    this.mesh.add(road)
    
    this.roadSegments.push(road)
    this.groundSegments.push(ground)

    // ARBRES
    this.addTrees(zPosition)
    this.addNaturalElements(zPosition)
  }

  private addTrees(zPosition: number): void {
    if (!this.treeModel) {
      console.log('⚠️ Utilisation arbres de secours')
      return
    }

    console.log(`🌳 Ajout des arbres pour segment ${zPosition}...`)
    const treeSpacing = 20
    const treesPerSide = Math.floor(this.segmentLength / treeSpacing)
    const offsetFromRoad = this.roadWidth / 2 + 10

    for (let i = 0; i < treesPerSide; i++) {
      const z = zPosition - this.segmentLength / 2 + i * treeSpacing + Math.random() * 8
      
      // Arbre côté gauche
      const leftTree = this.treeModel.clone()
      leftTree.position.set(-offsetFromRoad, 0, z)
      leftTree.rotation.y = Math.random() * Math.PI * 2
      this.mesh.add(leftTree)

      // Arbre côté droit
      const rightTree = this.treeModel.clone()
      rightTree.position.set(offsetFromRoad, 0, z)
      rightTree.rotation.y = Math.random() * Math.PI * 2
      this.mesh.add(rightTree)
    }
  }

  private addNaturalElements(zPosition: number): void {
    // Herbe entre route et terre
    const grassMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x336633,
      side: THREE.DoubleSide,
      roughness: 0.9
    })

    const grassWidth = 5
    const leftGrass = new THREE.Mesh(
      new THREE.PlaneGeometry(grassWidth, this.segmentLength),
      grassMaterial
    )
    leftGrass.rotation.x = -Math.PI / 2
    leftGrass.position.set(-this.roadWidth/2 - grassWidth/2, 0.02, zPosition)

    const rightGrass = new THREE.Mesh(
      new THREE.PlaneGeometry(grassWidth, this.segmentLength),
      grassMaterial
    )
    rightGrass.rotation.x = -Math.PI / 2
    rightGrass.position.set(this.roadWidth/2 + grassWidth/2, 0.02, zPosition)

    this.mesh.add(leftGrass)
    this.mesh.add(rightGrass)
  }

  public update(delta: number, carSpeed: number): void {
    const move = carSpeed * 60 * delta
    
    this.mesh.children.forEach(child => {
      child.position.z += move

      if (child.position.z > 200) {
        child.position.z -= this.segmentLength * 3
      }
    })
  }
}