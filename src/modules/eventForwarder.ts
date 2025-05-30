import { Container } from 'pixi.js';

export class EventForwarder {
  private canvas: HTMLCanvasElement;
  private pixiStage: Container;
  private eventHandlers: { [key: string]: (event: Event) => void } = {};

  constructor(canvas: HTMLCanvasElement, pixiStage: Container) {
    this.canvas = canvas;
    this.pixiStage = pixiStage;
    this.setupEventForwarding();
  }

  private setupEventForwarding() {
    this.addEventForwarder('pointerdown');
    this.addEventForwarder('pointerup');
    this.addEventForwarder('pointermove');
    this.addEventForwarder('pointerenter');
    this.addEventForwarder('pointerleave');
    this.addEventForwarder('pointercancel');
  }

  private addEventForwarder(eventType: string) {
    const handler = (event: Event) => {
      // Create a new event with the same properties but targeting the Pixi stage
      const syntheticEvent = this.createSyntheticEvent(event, eventType);
      
      // Perform hit testing to find the actual target
      const hitTarget = this.performHitTest(syntheticEvent);
      
      if (eventType === 'pointerdown') {
        //console.log(`Event at (${syntheticEvent.offsetX}, ${syntheticEvent.offsetY}), hit target:`, hitTarget);
      }
      
      if (hitTarget) {
        // Set the actual target that was hit
        syntheticEvent.target = hitTarget;
        syntheticEvent.currentTarget = hitTarget;
        
        // Dispatch the event to the hit target
        hitTarget.emit(eventType, syntheticEvent);
      }
    };

    this.eventHandlers[eventType] = handler;
    this.canvas.addEventListener(eventType, handler);
  }

  private performHitTest(syntheticEvent: any): Container | null {
    if (!syntheticEvent.offsetX || !syntheticEvent.offsetY) {
      return null;
    }

    const point = { x: syntheticEvent.offsetX, y: syntheticEvent.offsetY };
    
    // Recursively check all children for hit testing
    return this.hitTestRecursive(this.pixiStage, point);
  }

  private hitTestRecursive(container: Container, point: { x: number, y: number }): Container | null {
    // Check if this container is interactive and has a hit area
    if (container.eventMode !== 'none' && container.eventMode !== 'passive') {
      // Check children first (front to back)
      for (let i = container.children.length - 1; i >= 0; i--) {
        const child = container.children[i] as Container;
        const hit = this.hitTestRecursive(child, point);
        if (hit) {
          return hit;
        }
      }
      
      // Check if this container itself is hit
      if (this.isPointInContainer(container, point)) {
        return container;
      }
    }
    
    return null;
  }

  private isPointInContainer(container: Container, point: { x: number, y: number }): boolean {
    // Get the bounds of the container in global coordinates
    const bounds = container.getBounds();
    
    // Check if point is within bounds
    return point.x >= bounds.x && 
           point.x <= bounds.x + bounds.width &&
           point.y >= bounds.y && 
           point.y <= bounds.y + bounds.height;
  }

  private createSyntheticEvent(originalEvent: Event, eventType: string): any {
    const rect = this.canvas.getBoundingClientRect();
    
    // Base event properties
    const syntheticEvent: any = {
      type: eventType,
      bubbles: originalEvent.bubbles,
      cancelable: originalEvent.cancelable,
      composed: originalEvent.composed,
      target: this.pixiStage,
      currentTarget: this.pixiStage,
      preventDefault: () => originalEvent.preventDefault(),
      stopPropagation: () => originalEvent.stopPropagation(),
      stopImmediatePropagation: () => originalEvent.stopImmediatePropagation(),
    };

    // Add position data for pointer events
    
    if (originalEvent instanceof PointerEvent) {
      syntheticEvent.clientX = originalEvent.clientX;
      syntheticEvent.clientY = originalEvent.clientY;
      syntheticEvent.button = originalEvent.button;
      syntheticEvent.buttons = originalEvent.buttons;
      syntheticEvent.pointerId = originalEvent.pointerId;
      syntheticEvent.pointerType = originalEvent.pointerType;
      syntheticEvent.isPrimary = originalEvent.isPrimary;
      syntheticEvent.pressure = originalEvent.pressure;
      syntheticEvent.tangentialPressure = originalEvent.tangentialPressure;
      syntheticEvent.tiltX = originalEvent.tiltX;
      syntheticEvent.tiltY = originalEvent.tiltY;
      syntheticEvent.twist = originalEvent.twist;
      syntheticEvent.width = originalEvent.width;
      syntheticEvent.height = originalEvent.height;
      syntheticEvent.altKey = originalEvent.altKey;
      syntheticEvent.ctrlKey = originalEvent.ctrlKey;
      syntheticEvent.metaKey = originalEvent.metaKey;
      syntheticEvent.shiftKey = originalEvent.shiftKey;
      
      // Calculate local coordinates relative to canvas
      syntheticEvent.offsetX = originalEvent.clientX - rect.left;
      syntheticEvent.offsetY = originalEvent.clientY - rect.top;
    }

    if (originalEvent instanceof WheelEvent) {
      syntheticEvent.deltaX = originalEvent.deltaX;
      syntheticEvent.deltaY = originalEvent.deltaY;
      syntheticEvent.deltaZ = originalEvent.deltaZ;
      syntheticEvent.deltaMode = originalEvent.deltaMode;
    }

    return syntheticEvent;
  }

  // Clean up event listeners
  destroy() {
    Object.keys(this.eventHandlers).forEach(eventType => {
      this.canvas.removeEventListener(eventType, this.eventHandlers[eventType]);
    });
    this.eventHandlers = {};
  }
}