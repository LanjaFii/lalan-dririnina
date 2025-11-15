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
  private grassModel?: THREE.Group

  constructor() {
    this.mesh = new THREE.Group()
    // Charger les modèles en arrière-plan, puis créer la route quand prêts
    this.loadModels()
      .then(() => {
        this.createRoad()
      })
      .catch(() => {
        // En cas d'erreur, createRoad() est appelée depuis loadModels via createFallbackModels
        // mais on s'assure de la créer ici aussi
        this.createRoad()
      })
  }

  private async loadModels(): Promise<void> {
    try {
      console.log('🌳 Début chargement des modèles...')
      
      // Charger l'arbre
      this.treeModel = await loaderManager.loadGLB('tree', '/models/arbre.glb')
      console.log('✅ Arbre GLB chargé')
      
      // Charger l'herbe
      this.grassModel = await loaderManager.loadGLB('grass', '/models/grass.glb')
      console.log('✅ Herbe GLB chargée')
      
      // Ajustement d'échelle des arbres
      this.treeModel.scale.set(2.5, 2.5, 2.5)
      this.treeModel.position.y = 0
      
      // Ajustement d'échelle de l'herbe (peut nécessiter des ajustements)
      this.grassModel.scale.set(1.5, 1.5, 1.5)
      this.grassModel.position.y = 0
      
      console.log('🌿 Tous les modèles chargés et configurés')
      
    } catch (error) {
      console.error('❌ Erreur chargement modèles:', error)
      this.createFallbackModels()
    }
  }

  private createFallbackModels(): void {
    console.log('🔄 Création modèles de secours...')
    
    // Arbre de secours
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

    // Herbe de secours
    const grassGroup = new THREE.Group()
    const grassBladeGeometry = new THREE.PlaneGeometry(0.3, 0.8)
    const grassMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x336633, 
      side: THREE.DoubleSide 
    })
    
    // Créer plusieurs brins d'herbe
    for (let i = 0; i < 5; i++) {
      const grassBlade = new THREE.Mesh(grassBladeGeometry, grassMaterial)
      grassBlade.rotation.x = Math.PI / 2
      grassBlade.position.set(
        (Math.random() - 0.5) * 0.5,
        0.4,
        (Math.random() - 0.5) * 0.5
      )
      grassBlade.rotation.y = Math.random() * Math.PI
      grassGroup.add(grassBlade)
    }
    
    this.grassModel = grassGroup
    console.log('✅ Modèles de secours créés')
  }

  private createRoad(): void {
    console.log('🛣️ Création de la route avec décor...')
    for (let i = 0; i < 4; i++) {
      this.createRoadSegment(i * this.segmentLength)
    }
    console.log('✅ Route créée avec 4 segments')
  }

  private createRoadSegment(zPosition: number): void {
    const laneWidth = this.roadWidth / this.laneCount
    
    // SOL (terre)
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

    // ROUTE (asphalte)
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

    // AJOUT DU DÉCOR
    this.addTrees(zPosition)
    this.addGrass(zPosition)
    this.addNaturalElements(zPosition)
  }

  private addTrees(zPosition: number): void {
    if (!this.treeModel) {
      console.log('⚠️ Utilisation arbres de secours')
      return
    }

    const treeSpacing = 25 // Plus espacés pour éviter la surcharge
    const treesPerSide = Math.floor(this.segmentLength / treeSpacing)
    const offsetFromRoad = this.roadWidth / 2 + 12

    for (let i = 0; i < treesPerSide; i++) {
      const z = zPosition - this.segmentLength / 2 + i * treeSpacing + Math.random() * 10
      
      // Arbre côté gauche
      const leftTree = this.treeModel.clone()
      leftTree.position.set(-offsetFromRoad, 0, z)
      leftTree.rotation.y = Math.random() * Math.PI * 2
      leftTree.scale.setScalar(2.2 + Math.random() * 0.6) // Variation de taille
      this.mesh.add(leftTree)

      // Arbre côté droit
      const rightTree = this.treeModel.clone()
      rightTree.position.set(offsetFromRoad, 0, z)
      rightTree.rotation.y = Math.random() * Math.PI * 2
      rightTree.scale.setScalar(2.2 + Math.random() * 0.6)
      this.mesh.add(rightTree)

      // Quelques arbres supplémentaires plus éloignés
      if (Math.random() > 0.7) {
        const farTree = this.treeModel.clone()
        const farOffset = offsetFromRoad + 8 + Math.random() * 6
        const side = Math.random() > 0.5 ? 1 : -1
        farTree.position.set(side * farOffset, 0, z + Math.random() * 15 - 7.5)
        farTree.rotation.y = Math.random() * Math.PI * 2
        farTree.scale.setScalar(1.8 + Math.random() * 0.8)
        this.mesh.add(farTree)
      }
    }
  }

  private addGrass(zPosition: number): void {
    if (!this.grassModel) {
      console.log('⚠️ Utilisation herbe de secours')
      return
    }

    const grassSpacing = 8 // Très rapprochés pour un effet dense
    const grassPerSide = Math.floor(this.segmentLength / grassSpacing)
    const offsetFromRoad = this.roadWidth / 2 + 3

    for (let i = 0; i < grassPerSide; i++) {
      const z = zPosition - this.segmentLength / 2 + i * grassSpacing + Math.random() * 4
      
      // Herbe côté gauche - plusieurs patches
      for (let j = 0; j < 3; j++) {
        const leftGrass = this.grassModel.clone()
        const xOffset = -offsetFromRoad - j * 2 + Math.random() * 3
        leftGrass.position.set(xOffset, 0, z + Math.random() * 3 - 1.5)
        leftGrass.rotation.y = Math.random() * Math.PI * 2
        leftGrass.scale.setScalar(1.2 + Math.random() * 0.4)
        this.mesh.add(leftGrass)
      }

      // Herbe côté droit - plusieurs patches
      for (let j = 0; j < 3; j++) {
        const rightGrass = this.grassModel.clone()
        const xOffset = offsetFromRoad + j * 2 - Math.random() * 3
        rightGrass.position.set(xOffset, 0, z + Math.random() * 3 - 1.5)
        rightGrass.rotation.y = Math.random() * Math.PI * 2
        rightGrass.scale.setScalar(1.2 + Math.random() * 0.4)
        this.mesh.add(rightGrass)
      }
    }
  }

  private addNaturalElements(zPosition: number): void {
    // Bande de terre entre la route et l'herbe
    const dirtMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x6B4423,
      side: THREE.DoubleSide,
      roughness: 1.0
    })

    const dirtWidth = 2
    const leftDirt = new THREE.Mesh(
      new THREE.PlaneGeometry(dirtWidth, this.segmentLength),
      dirtMaterial
    )
    leftDirt.rotation.x = -Math.PI / 2
    leftDirt.position.set(-this.roadWidth/2 - dirtWidth/2, 0.01, zPosition)

    const rightDirt = new THREE.Mesh(
      new THREE.PlaneGeometry(dirtWidth, this.segmentLength),
      dirtMaterial
    )
    rightDirt.rotation.x = -Math.PI / 2
    rightDirt.position.set(this.roadWidth/2 + dirtWidth/2, 0.01, zPosition)

    this.mesh.add(leftDirt)
    this.mesh.add(rightDirt)

    // Rochers aléatoires
    this.addRocks(zPosition)
  }

  private addRocks(zPosition: number): void {
    const rockCount = 8 // Nombre de rochers par segment
    
    for (let i = 0; i < rockCount; i++) {
      const rockGeometry = new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.4, 0)
      const rockMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x666666,
        roughness: 0.9
      })
      const rock = new THREE.Mesh(rockGeometry, rockMaterial)
      
      const side = Math.random() > 0.5 ? 1 : -1
      const x = side * (this.roadWidth/2 + 6 + Math.random() * 10)
      const z = zPosition - this.segmentLength/2 + Math.random() * this.segmentLength
      
      rock.position.set(x, 0.3, z)
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI, 
        Math.random() * Math.PI
      )
      rock.castShadow = true
      rock.receiveShadow = true
      
      this.mesh.add(rock)
    }
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