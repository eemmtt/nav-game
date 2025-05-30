import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { InstanceManager } from './InstanceManager';
import { Point } from 'pixi.js';

export class SceneManager{
    scene: THREE.Scene;
    gridOrigin: Point;
    gridSize: number;
    cellScale: number;
    floors: InstanceManager | null;
    walls: InstanceManager | null;

    constructor(scene: THREE.Scene, gridSize: number, cellScale: number){
        this.scene = scene;
        this.gridSize = gridSize;
        this.cellScale = cellScale;
        this.gridOrigin = new Point(-2 * cellScale * (gridSize / 2) + cellScale, -2 * cellScale * (gridSize / 2) + cellScale); //center grid on world origin
        //this.gridOrigin = new Point(0,0);
        this.floors = null;
        this.walls = null;
    }

    async init(){
        const loader = new GLTFLoader();
    
        const wallGltf = await new Promise<any>((resolve, reject) => {
            loader.load('./static/navGame_wall_1a.glb', resolve, undefined, reject);
        });
        
        const floorGltf = await new Promise<any>((resolve, reject) => {
            loader.load('./static/navGame_floor_1.glb', resolve, undefined, reject);
        });
    
        const wallMesh = wallGltf.scene.children[0] as THREE.Mesh;
        const floorMesh = floorGltf.scene.children[0] as THREE.Mesh;
    
        // Create Lambert materials for lighting
        const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xaa2366 }); 
        const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x6623aa });
    
        // Initialize InstanceManagers
        this.walls = new InstanceManager(
            wallMesh.geometry,
            wallMaterial,
            4 * this.gridSize * this.gridSize,
        );
        
        this.floors = new InstanceManager(
            floorMesh.geometry, 
            floorMaterial,
            1 * this.gridSize * this.gridSize,
        );
    
        // Add the instanced meshes to the scene
        this.scene.add(this.walls.getInstancedMesh());
        this.scene.add(this.floors.getInstancedMesh());
    }

    addWall(x:number, y:number, dir: number): number | null{
        //adds a wall instance at grid position x, y and returns it's instance index
        const pos = new THREE.Vector3(this.gridOrigin.x + x * this.cellScale * 2, 0, this.gridOrigin.y + y * this.cellScale * 2);
        
        const wallRotations = [
            new THREE.Euler(0, Math.PI/2, 0),      // North wall
            new THREE.Euler(0, 0, 0),              // East wall 
            new THREE.Euler(0, -Math.PI/2, 0),     // South wall 
            new THREE.Euler(0, Math.PI, 0)         // West wall
        ];
        const rot = wallRotations[dir];
        const scale = new THREE.Vector3(this.cellScale, this.cellScale, this.cellScale);

        const index = this.walls!.addInstance(pos, rot, scale);
        return index;
    }

    removeWall(index: number): boolean{
        const result = this.walls!.removeInstance(index);
        return result;
    }

    addFloor(x: number, y: number): number | null{
        const pos = new THREE.Vector3(this.gridOrigin.x + x * this.cellScale * 2, 0, this.gridOrigin.y + y * this.cellScale * 2);
        const rot = new THREE.Euler(0,0,0);
        const scale = new THREE.Vector3(this.cellScale, this.cellScale, this.cellScale);

        const index = this.floors!.addInstance(pos, rot, scale);
        return index;
    }

    removeFloor(index: number): boolean{
        const result = this.floors!.removeInstance(index);
        return result;
    }
}