import { Container, FederatedPointerEvent, Graphics, Point, Rectangle } from "pixi.js";
import * as THREE from 'three';
import { Cell, type CellProps } from "./Cell";
import type { SceneManager } from "./SceneManager";


export interface UiProps{
    parent: Container,
    rect: Rectangle,
    sceneManager: SceneManager
}

interface InteractionHandlers{
    pointerDown: (event: FederatedPointerEvent) => void;
    pointerUp: (event: FederatedPointerEvent) => void;
    pointerMove: (event: FederatedPointerEvent) => void;
}

export class Ui2D{

    parent: Container;
    root: Container;
    cellShapes: Container;
    gridLines: Container;
    gridInset: number;
    gridOrigin: Point;
    gridSize: number;
    gridCellWidth: number;
    cells: Cell[][];
    sceneManager: SceneManager;
    isDrawing: boolean;
    state: number;
    cellEventHandlers: InteractionHandlers;
    pathEventHandlers: InteractionHandlers;
    button0: Graphics;
    button1: Graphics;
    button2: Graphics;



    constructor(props: UiProps){
        this.parent = props.parent;
        this.sceneManager = props.sceneManager;

        //states: 0 = draw cells, 1 = draw paths
        this.state = 0 //

        this.root = new Container();
        this.root.eventMode = 'static';

        this.gridLines = new Container();
        this.cellShapes = new Container();

        const bg = new Graphics()
            .roundRect(props.rect.top, props.rect.left, props.rect.width, props.rect.height * 1.1, 10)
            .fill(0xffffff)
        ;
        this.root.addChild(bg, this.cellShapes, this.gridLines);
        
        //draw grid
        this.gridInset = props.rect.width / 12;
        this.gridSize = props.sceneManager.gridSize;
        this.gridCellWidth = (props.rect.width - 2 * this.gridInset) / this.gridSize;
        
        const origin = new Point(props.rect.left + this.gridInset, props.rect.top + this.gridInset);
        
        for (let i = 0; i <= this.gridSize; i++){
            const hLine = new Graphics()
            .moveTo(origin.x, origin.y + i * this.gridCellWidth)
            .lineTo(origin.x + this.gridCellWidth * this.gridSize, origin.y + i * this.gridCellWidth)
            .stroke({pixelLine: true, color: 0x000000})
            ;
            const vLine = new Graphics()
            .moveTo(origin.x + i * this.gridCellWidth, origin.y)
            .lineTo(origin.x + i * this.gridCellWidth, origin.y + this.gridCellWidth * this.gridSize)
            .stroke({pixelLine: true, color: 0x000000})
            ;
            this.gridLines.addChild(hLine, vLine);
        }
        this.gridOrigin = origin;
        
        // Create buttons below the grid
        const buttonY = props.rect.top + this.gridInset + this.gridSize * this.gridCellWidth + 20;
        const buttonWidth = 60;
        const buttonHeight = 15;
        const buttonSpacing = 20;

        // Button 0
        this.button0 = new Graphics()
            .roundRect(0, 0, buttonWidth, buttonHeight, 5)
            .fill(this.state === 0 ? 0x4CAF50 : 0xE0E0E0)
            .stroke({ color: 0x000000, width: 1 });
        this.button0.position.set(props.rect.left + this.gridInset, buttonY);
        this.button0.eventMode = 'static';
        this.button0.cursor = 'pointer';
        this.button0.on('pointerdown', () => {
            this.state = 0;
            this.updateButtonAppearance();
        });

        // Button 1
        this.button1 = new Graphics()
            .roundRect(0, 0, buttonWidth, buttonHeight, 5)
            .fill(this.state === 1 ? 0x4CAF50 : 0xE0E0E0)
            .stroke({ color: 0x000000, width: 1 });
        this.button1.position.set(props.rect.left + this.gridInset + buttonWidth + buttonSpacing, buttonY);
        this.button1.eventMode = 'static';
        this.button1.cursor = 'pointer';
        this.button1.on('pointerdown', () => {
            this.state = 1;
            this.updateButtonAppearance();
        });

        // Button 2
        this.button2 = new Graphics()
            .roundRect(0, 0, buttonWidth, buttonHeight, 5)
            .fill(this.state === 2 ? 0x4CAF50 : 0xE0E0E0)
            .stroke({ color: 0x000000, width: 1 });
        this.button2.position.set(props.rect.left + this.gridInset + (buttonWidth + buttonSpacing) * 2, buttonY);
        this.button2.eventMode = 'static';
        this.button2.cursor = 'pointer';
        this.button2.on('pointerdown', () => {
            this.state = 2;
            this.updateButtonAppearance();
        });

        this.root.addChild(this.button0, this.button1, this.button2);


        // init cells
        this.cells = [];
        for (let y = 0; y < this.gridSize; y++) {
            const cellRow: Cell[] = [];
            for (let x = 0; x < this.gridSize; x++) {
                const cX = origin.x + x * this.gridCellWidth;
                const cY = origin.y + y * this.gridCellWidth;
                const cW = this.gridCellWidth;
                const cH = this.gridCellWidth;
                const cG = new Graphics()
                    .rect(cX, cY, cW, cH)
                    .fill(0xFFFFFF)
                ;
                cG.tint = 0xFF1133;
                cG.visible = false;
                this.cellShapes.addChild(cG);

                const cellProps: CellProps = {
                    rect: new Rectangle(cX, cY, cW, cH),
                    graphic: cG,
                    grid: this.cells,
                    gridIndices: new Point(x, y),
                    sceneManager: this.sceneManager,
                }
                cellRow.push(new Cell(cellProps));
            }
            this.cells.push(cellRow);
        }

        this.isDrawing = false;

        this.cellEventHandlers = {
            pointerDown: (event) => {
                console.log(this.state);
                const pt = this.checkGrid(event, this.gridOrigin, this.gridSize, this.gridCellWidth);
                if (pt){
                    this.isDrawing = !this.cells[pt.y][pt.x].isVisible;
                    this.drawCell(pt);
                }
                this.root.on('pointermove', this.cellEventHandlers.pointerMove);
                this.root.on('pointerup', this.cellEventHandlers.pointerUp);
    
                this.root.off('pointerdown', this.cellEventHandlers.pointerDown);
            },
            pointerMove: (event) => {
                //console.log("pointer move");
                const pt = this.checkGrid(event, this.gridOrigin, this.gridSize, this.gridCellWidth);
                if(pt) {
                    this.drawCell(pt);
                }
            },
            pointerUp: (event) => {
                //console.log("pointer up");
                this.root.off('pointermove', this.cellEventHandlers.pointerMove);
                this.root.off('pointerup', this.cellEventHandlers.pointerUp);

                this.root.on('pointerdown', this.cellEventHandlers.pointerDown);
            }
        }

        this.pathEventHandlers = {
            pointerDown: (event) => {
                console.log(this.state);
                const pt = this.checkGrid(event, this.gridOrigin, this.gridSize, this.gridCellWidth);
                if (pt && this.cells[pt.y][pt.x].isVisible){
                    this.cells[pt.y][pt.x].togglePath();
                }
                this.root.off('pointerdown', this.pathEventHandlers.pointerDown);
                this.root.on('pointerdown', this.pathEventHandlers.pointerDown);
            },
            pointerMove: (event) => {
                // No dragging behavior for paths
            },
            pointerUp: (event) => {
                // No special up behavior for paths
            }
        }

        this.updateEventHandlers();

        this.parent.addChild(this.root);
    }

    checkGrid(event: FederatedPointerEvent, origin: Point, size: number, cellWidth: number): Point | null{
        const mousePos = new Point(event.clientX, event.clientY);
        //console.log(event);
        
        // Check if mouse position is within the grid bounds
        const gridWidth = size * cellWidth;
        const gridHeight = size * cellWidth;
        
        if (mousePos.x >= origin.x && mousePos.x <= origin.x + gridWidth &&
            mousePos.y >= origin.y && mousePos.y <= origin.y + gridHeight) {
            
            // Calculate which cell was clicked
            const cellX = Math.floor((mousePos.x - origin.x) / cellWidth);
            const cellY = Math.floor((mousePos.y - origin.y) / cellWidth);
            
            // Make sure the cell indices are within bounds
            if (cellX >= 0 && cellX < size && cellY >= 0 && cellY < size) {
                // Toggle visibility of the corresponding cell
                return new Point(cellX, cellY);
            }
        } 

        return null;
        
    }

    drawCell(pt: Point){
        if (this.cells[pt.y][pt.x].isVisible == true && this.isDrawing == false){
            this.cells[pt.y][pt.x].toggleVisibility();
        } else if (this.cells[pt.y][pt.x].isVisible == false && this.isDrawing == true){
            this.cells[pt.y][pt.x].toggleVisibility();
        };
    }

    updateButtonAppearance(){
        this.button0.clear()
            .roundRect(0, 0, 60, 15, 5)
            .fill(this.state === 0 ? 0x4CAF50 : 0xE0E0E0)
            .stroke({ color: 0x000000, width: 1 });
        
        this.button1.clear()
            .roundRect(0, 0, 60, 15, 5)
            .fill(this.state === 1 ? 0x4CAF50 : 0xE0E0E0)
            .stroke({ color: 0x000000, width: 1 });
        
        this.button2.clear()
            .roundRect(0, 0, 60, 15, 5)
            .fill(this.state === 2 ? 0x4CAF50 : 0xE0E0E0)
            .stroke({ color: 0x000000, width: 1 });
        
        this.updateEventHandlers();
    }

    updateEventHandlers(){
        // Remove all existing event handlers
        this.root.off('pointerdown', this.cellEventHandlers.pointerDown);
        this.root.off('pointerdown', this.pathEventHandlers.pointerDown);
        this.root.off('pointermove', this.cellEventHandlers.pointerMove);
        this.root.off('pointerup', this.cellEventHandlers.pointerUp);
        
        // Add appropriate handlers based on state
        if (this.state === 0) {
            this.root.on('pointerdown', this.cellEventHandlers.pointerDown);
        } else if (this.state === 1) {
            this.root.on('pointerdown', this.pathEventHandlers.pointerDown);
        }
        // State 2 can be added later for other functionality
    }
}