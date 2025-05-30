import { Container, FederatedPointerEvent, Graphics, Point, Rectangle } from "pixi.js";
import * as THREE from 'three';
import { InstanceManager } from './InstanceManager';
import type { SceneManager } from "./SceneManager";

export interface CellProps{
    rect: Rectangle,
    graphic: Graphics,
    grid: Cell[][],
    gridIndices: Point,
    sceneManager: SceneManager   
}

export class Cell{
    rect: Rectangle;
    graphic: Graphics;
    gridIndices: Point;
    sceneManager: SceneManager;
    floorIndex: number | null = null;
    wallIndices: (number | null)[] = [null, null, null, null]; // [North, South, East, West]
    isVisible = false;
    cellGrid: Cell[][];
    gridSize: number;

    constructor(props: CellProps){
        this.rect = props.rect;
        this.graphic = props.graphic;
        this.sceneManager = props.sceneManager;
        this.cellGrid = props.grid;
        this.gridIndices = props.gridIndices;
        this.gridSize = props.sceneManager.gridSize;
    }

    private getNeighbor(dirIndex: number): Cell | null {
        const directions = [
            [0, -1],  // North
            [1, 0],   // East  
            [0, 1],   // South
            [-1, 0]   // West
        ];
        
        const [dx, dy] = directions[dirIndex];
        const newX = this.gridIndices.x + dx;
        const newY = this.gridIndices.y + dy;
        
        if (newX >= 0 && newX < this.gridSize && newY >= 0 && newY < this.gridSize) {
            return this.cellGrid[newY][newX];
        }
        return null;
    }

    private updateWalls() {
        if (!this.isVisible) return;

        // Check each direction and manage walls
        for (let i = 0; i < 4; i++) {
            const neighbor = this.getNeighbor(i);
            const visibleNeighbor = neighbor !== null && neighbor.isVisible;
            
            if (visibleNeighbor) {
                // Remove wall if it exists (neighbor is visible)
                if (this.wallIndices[i] !== null){
                    const success = this.sceneManager.removeWall(this.wallIndices[i]!);
                    if (success){
                        this.wallIndices[i] = null;    
                    } else {
                        console.log("Failed to remove wall", this.wallIndices[i], );
                    }
                }
            } else {
                // Add wall if it doesn't exist (no visible neighbor)
                if (this.wallIndices[i] === null) {
                    const wallIndex = this.sceneManager.addWall(this.gridIndices.x, this.gridIndices.y, i);
                    if (wallIndex){
                        this.wallIndices[i] = wallIndex;
                    } else {
                        console.log("Failed to add wall");
                    }
                }
            }
            
        }
    }

    public toggleVisibility(){
        this.isVisible = !this.isVisible;
        
        if (this.isVisible) {
            this.graphic.visible = true;

            //console.log(this);

            // Add floor instance at corresponding 3D position
           
            const floorIndex = this.sceneManager.addFloor(this.gridIndices.x, this.gridIndices.y);
            if (floorIndex){
                this.floorIndex = floorIndex;
            } else {
                console.log("Failed to add floor");
            }
            
            // Update walls for this cell
            this.updateWalls();
            
            // Update walls for all neighbors
            for (let i = 0; i < 4; i++) {
                const neighbor = this.getNeighbor(i);
                if (neighbor) {
                    neighbor.updateWalls();
                }
            }
            
            //console.log(this.floors.getActiveCount(), this.floors.getPos(this.floorIndex!));
        } else {
            this.graphic.visible = false;
            
            // Remove floor instance
            if (this.floorIndex !== null) {
                const success = this.sceneManager.removeFloor(this.floorIndex);
                if (success){
                    this.floorIndex = null;
                } else {
                    console.log("Failed to remove floor");
                }
                
            }
            
            // Remove all wall instances for this cell
            for (let i = 0; i < 4; i++) {
                if (this.wallIndices[i] !== null) {
                    const success = this.sceneManager.removeWall(this.wallIndices[i]!);
                    if (success){
                        this.wallIndices[i] = null;    
                    } else {
                        console.log("Failed to remove wall", this.wallIndices[i], );
                    }
                }
            }
            
            // Update walls for all neighbors (they might need to add walls back)
            for (let i = 0; i < 4; i++) {
                const neighbor = this.getNeighbor(i);
                if (neighbor) {
                    neighbor.updateWalls();
                }
            }
        }
    }
}