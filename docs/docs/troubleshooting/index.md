---
sidebar_position: 10
title: Troubleshooting
hide_table_of_contents: true
sidebar_label: Troubleshooting
---

# Troubleshooting Guide

This guide helps you diagnose and resolve common issues when working with Fuderu.

## Common Problems and Solutions

### Canvas Not Displaying or Drawing

#### Problem: Nothing appears on the canvas

**Possible Causes:**

- Canvas element not found or not properly referenced
- Canvas dimensions set to zero via CSS but not attributes
- JavaScript errors preventing initialization
- Browser compatibility issues

**Solutions:**

1. **Verify canvas element exists:**

   ```javascript
   const canvas = document.getElementById("my-canvas");
   if (!canvas) {
     console.error("Canvas element not found!");
   }
   ```

2. **Check canvas dimensions:**

   ```javascript
   console.log("Canvas width:", canvas.width, "height:", canvas.height);
   // Width and height attributes should be > 0
   // CSS width/height can be different but attributes must be set
   ```

3. **Look for JavaScript errors:**
   - Open browser developer tools (F12)
   - Check Console tab for error messages
   - Fix any syntax or runtime errors

4. **Verify browser compatibility:**
   ```javascript
   // Check for required features
   if (!HTMLCanvasElement || !CanvasRenderingContext2D) {
     console.error("Browser does not support required canvas APIs");
   }
   if (!window.PointerEvent) {
     console.warn("PointerEvent not supported - falling back to mouse events");
   }
   ```

#### Problem: Lines appear but are invisible or wrong color

**Possible Causes:**

- Drawing with transparent or matching background color
- Incorrect blend mode or globalAlpha
- Clearing canvas after drawing

**Solutions:**

1. **Check drawing color:**

   ```javascript
   console.log("Current brush color:", painter.brush.config.color);
   // Ensure it's not transparent or matching background
   ```

2. **Verify alpha/opacity settings:**

   ```javascript
   console.log("Brush opacity:", painter.brush.config.opacity);
   console.log("Global alpha:", painter.context?.globalAlpha);
   ```

3. **Check blend mode:**
   ```javascript
   console.log("Blend mode:", painter.context?.globalCompositeOperation);
   // Should typically be 'source-over' for normal drawing
   ```

### Performance Issues

#### Problem: Drawing feels laggy or unresponsive

**Possible Causes:**

- Canvas resolution too high for device
- Expensive operations in event handlers
- Too many points being processed
- Inefficient module combinations

**Solutions:**

1. **Measure actual performance:**

   ```javascript
   // Add FPS counter
   let frames = 0;
   let lastTime = performance.now();
   let fps = 0;

   function updateFPS() {
     const now = performance.now();
     const delta = now - lastTime;
     if (delta >= 1000) {
       fps = Math.round((frames * 1000) / delta);
       frames = 0;
       lastTime = now;
       // Update UI with FPS value
     }
     frames++;
     requestAnimationFrame(updateFPS);
   }
   requestAnimationFrame(updateFPS);
   ```

2. **Reduce canvas resolution:**

   ```javascript
   // Instead of matching screen resolution exactly, use a reasonable maximum
   const maxWidth = 1920;
   const maxHeight = 1080;
   const width = Math.min(window.innerWidth * devicePixelRatio, maxWidth);
   const height = Math.min(window.innerHeight * devicePixelRatio, maxHeight);

   painter.setDocumentSize(width, height);
   // Scale up via CSS if needed
   ```

3. **Profile expensive operations:**

   ```javascript
   // Wrap suspected slow code
   function expensiveOperation() {
     console.time("expensiveOperation");
     // ... your code ...
     console.timeEnd("expensiveOperation");
   }
   ```

4. **Optimize event handling:**

   ```javascript
   // Use coalesced events for pointer input
   function handlePointerMove(event) {
     if (!isDrawing) return;

     // Process all coalesced events at once
     const coalesced = event.getCoalescedEvents?.();
     const events = coalesced && coalesced.length > 0 ? coalesced : [event];

     for (const evt of events) {
       const point = getPoint(evt);
       painter.brush.putPoint(point.x, point.y, point.pressure);
     }

     // Render once after processing all events
     painter.brush.render();
   }
   ```

#### Problem: Memory usage increases over time

**Possible Causes:**

- Not destroying Canvas instances properly
- Event listeners not being removed
- Modules holding references to large objects
- Undo/redo stack growing without bounds

**Solutions:**

1. **Ensure proper cleanup:**

   ```javascript
   // When removing canvas component
   if (painter) {
     painter.destroy(); // This cleans up internal resources
     painter = null;
   }

   // Remove event listeners
   canvas.removeEventListener("pointerdown", pointerDownHandler);
   // ... remove other listeners
   ```

2. **Limit undo/redo history:**

   ```javascript
   const painter = new Canvas({
     canvas: canvasElement,
     brush: {
       maxUndoRedoStackSize: 20, // Limit to 20 steps
     },
   });
   ```

3. **Check for lingering references:**
   - Use Chrome DevTools Memory panel to take heap snapshots
   - Look for detached DOM nodes or unexpected retainers
   - Ensure modules don't store references to canvas elements unnecessarily

### Event Handling Issues

#### Problem: mouse/touch events not firing or behaving strangely

**Possible Causes:**

- CSS pointer-events interfering
- Element overlapping or covering the canvas
- Incorrect coordinate translation
- Missing touch event handlers

**Solutions:**

1. **Check for overlapping elements:**

   ```javascript
   // Temporarily add outline to debug
   canvas.style.outline = "2px solid red";
   // See if anything is covering it
   ```

2. **Verify pointer-events CSS:**

   ```css
   /* Ensure canvas can receive pointer events */
   canvas {
     pointer-events: auto; /* Not 'none' */
   }
   ```

3. **Test coordinate transformation:**

   ```javascript
   function getPoint(event) {
     const rect = canvas.getBoundingClientRect();
     const scaleX = canvas.width / rect.width;
     const scaleY = canvas.height / rect.height;

     const x = (event.clientX - rect.left) * scaleX;
     const y = (event.clientY - rect.top) * scaleY;

     return { x, y };
   }

   // Verify with a test point
   console.log("Client coords:", 100, 100);
   console.log("Canvas coords:", getPoint({ clientX: 100, clientY: 100 }));
   ```

4. **Ensure all event types are handled:**

   ```javascript
   // For maximum compatibility, handle:
   canvas.addEventListener("pointerdown", handleDown);
   canvas.addEventListener("pointermove", handleMove);
   canvas.addEventListener("pointerup", handleUp);
   canvas.addEventListener("pointercancel", handleCancel);

   // Or fallback to mouse/touch if needed:
   // canvas.addEventListener('mousedown', handleDown);
   // canvas.addEventListener('mousemove', handleMove);
   // canvas.addEventListener('mouseup', handleUp);
   // canvas.addEventListener('touchstart', handleTouchStart);
   // etc.
   ```

### Module-Specific Issues

#### Problem: Module not behaving as expected

**Possible Causes:**

- Incorrect parameter values
- Module execution order issues
- Conflicting module modifications
- Not understanding when module callbacks fire

**Solutions:**

1. **Validate parameter ranges:**

   ```javascript
   // Most parameters should be 0-1 unless otherwise specified
   console.log("sizeJitter:", module.config.sizeJitter); // Should be 0-1
   console.log("opacityJitter:", module.config.opacityJitter); // Should be 0-1
   ```

2. **Check module execution order:**

   ```javascript
   // Add logging to see when callbacks fire
   class LoggingModule {
     constructor(original) {
       this.original = original;
     }

     onChangePoint(point, config) {
       console.log("onChangePoint called");
       return this.original.onChangePoint?.(point, config) ?? point;
     }

     // ... delegate other methods
   }

   // Wrap your modules with logging versions
   const loggedModule = new LoggingModule(yourModule);
   painter.useModule(loggedModule);
   ```

3. **Test modules in isolation:**
   - Disable all other modules
   - Test just the problematic module
   - Gradually add others back to identify conflicts

4. **Understand callback timing:**
   - `onChangeConfig`: Called once per stroke when config changes
   - `onChangePoint`: Called for every point in the stroke
   - `onMixinCanvas`: Called during rendering, before blending
   - `onEndStroke`: Called when stroke ends

### Image Brush Issues

#### Problem: Image brush not showing or showing incorrectly

**Possible Causes:**

- Image not loaded before drawing
- CORS restrictions blocking image loading
- Image dimensions causing performance issues
- Incorrect image format or corruption

**Solutions:**

1. **Ensure image is loaded:**

   ```javascript
   // Use loadImageAsync for promises
   await painter.loadImageAsync("path/to/image.png");
   // Now safe to draw

   // Or use callback
   painter.loadImage("path/to/image.png", (success) => {
     if (success) {
       // Safe to draw
     } else {
       console.error("Failed to load image");
     }
   });
   ```

2. **Check for CORS issues:**
   - Host images on same domain as your app
   - Ensure server sends proper CORS headers: `Access-Control-Allow-Origin: *`
   - Use crossorigin attribute if needed:
     ```javascript
     const img = new Image();
     img.crossOrigin = "anonymous";
     img.src = "image-url";
     ```

3. **Optimize image size:**

   ```javascript
   // Large images hurt performance
   // Resize to reasonable dimensions before using as brush
   function resizeImageForBrush(img, maxSize = 256) {
     const canvas = document.createElement("canvas");
     let width = img.width;
     let height = img.height;

     if (width > height && width > maxSize) {
       height = Math.round((height * maxSize) / width);
       width = maxSize;
     } else if (height > maxSize) {
       width = Math.round((width * maxSize) / height);
       height = maxSize;
     }

     canvas.width = width;
     canvas.height = height;
     const ctx = canvas.getContext("2d");
     ctx.drawImage(img, 0, 0, width, height);
     return canvas;
   }
   ```

4. **Verify image format:**
   - PNG and WebP work best (support transparency)
   - JPEG works but doesn't support transparency
   - SVG works but may need rasterization first
   - Avoid extremely large file sizes (>5MB)

### Framework-Specific Issues

#### Problem: Works in vanilla JS but not in React/Vue/Svelte

**Possible Causes:**

- Component lifecycle mismatches
- SSR (Server-Side Rendering) issues
- React Strict Mode double-execution
- Reactive system not updating as expected
- Incorrect ref/binding handling

**Solutions:**

1. **Check mounting/unmounting:**

   ```javascript
   // Use proper lifecycle hooks
   // React: useEffect with cleanup
   // Vue: onMounted/onBeforeUnmount
   // Svelte: onMount/onDestroy
   ```

2. **Handle SSR appropriately:**

   ```javascript
   // Only initialize in browser environment
   if (typeof window !== "undefined") {
     // Safe to use window, document, etc.
     const painter = new Canvas({
       /* ... */
     });
   }
   ```

3. **Account for React Strict Mode:**

   ```javascript
   // In development, effects may run twice
   // Ensure your cleanup logic handles this
   let painter = null;

   useEffect(
     () => {
       if (!canvasRef.current) return;

       // Only create if not already created
       if (!painter) {
         painter = new Canvas({
           canvas: canvasRef.current,
           // ... options
         });
       }

       return () => {
         if (painter) {
           painter.destroy();
           painter = null;
         }
       };
     },
     [
       /* dependencies */
     ],
   );
   ```

4. **Verify reactivity is working:**

   ```javascript
   // Vue example - ensure you're using refs/reactive correctly
   import { ref } from "vue";

   const brushSize = ref(20);

   // In template: <input v-model.number="brushSize" @input="updateBrush" />
   // In script: watch(brushSize, (newVal) => { /* update painter */ });
   ```

   ```svelte
   // Svelte example - ensure you're using $: correctly
   let brushSize = 20;

   // $: statements run when dependencies change
   $: if (painter) {
     painter.brush.config.size = brushSize;
   }
   ```

### Build and Deployment Issues

#### Problem: Works in development but not in production build

**Possible Causes:**

- Code splitting or tree shaking removing needed code
- Different behavior between development and production builds
- Environment-specific configuration issues
- Minification breaking code

**Solutions:**

1. **Check for tree shaking issues:**

   ```javascript
   // Ensure you're importing correctly
   // Some bundlers might remove unused imports if they can't statically analyze
   import { Canvas, Brush } from "fuderu"; // Explicit imports

   // Avoid dynamic imports that might confuse tree shakers unless necessary
   // import(`fuderu/${moduleName}`) // Risky for tree shaking
   ```

2. **Verify production build behaves like development:**
   - Temporarily disable minification to test
   - Check if any polyfills are missing in production
   - Ensure environment variables are correctly set
3. **Look for console errors in production:**
   - Use source maps to debug
   - Check network tab for failed resource loads
   - Monitor for runtime errors

4. **Test with production build locally:**

   ```bash
   # For Create React App
   npm run build
   npx serve -s build

   # For Vue CLI
   npm run build
   npx serve -s dist

   # For SvelteKit
   npm run build
   npm run preview
   ```

## Debugging Tools and Techniques

### Using browser.devtools

1. **Elements Panel:**
   - Inspect canvas element
   - Check computed styles (width, height, display, visibility)
   - Look for overlapping elements with z-index issues

2. **Console:**
   - Look for error messages
   - Use `console.log()` to trace execution flow
   - Check variable values at breakpoints

3. **Sources Panel:**
   - Set breakpoints in your code
   - Step through execution to see exactly what's happening
   - Watch variables and expressions

4. **Performance Panel:**
   - Record a session of drawing activity
   - Identify long-running tasks
   - See frame rate and rendering performance

5. **Memory Panel:**
   - Take heap snapshots before and after operations
   - Look for growing memory usage (potential leaks)
   - Identify detached DOM trees

### Custom Debugging Utilities

#### FPS Counter

```javascript
class FPSCounter {
  constructor() {
    this.frames = 0;
    this.lastTime = performance.now();
    this.fps = 0;
    this.element = null;
  }

  start() {
    this.element = document.createElement("div");
    this.element.style.position = "fixed";
    this.element.style.top = "10px";
    this.element.style.right = "10px";
    this.element.style.background = "rgba(0,0,0,0.7)";
    this.element.style.color = "white";
    this.element.style.padding = "5px 10px";
    this.element.style.borderRadius = "4px";
    this.element.style.fontFamily = "monospace";
    this.element.style.fontSize = "14px";
    this.element.style.zIndex = "9999";
    document.body.appendChild(this.element);

    this.update();
  }

  update() {
    const now = performance.now();
    const delta = now - this.lastTime;

    if (delta >= 1000) {
      this.fps = Math.round((this.frames * 1000) / delta);
      this.frames = 0;
      this.lastTime = now;
      this.element.textContent = `FPS: ${this.fps}`;
    }

    this.frames++;
    requestAnimationFrame(() => this.update());
  }

  stop() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

// Usage:
// const fpsCounter = new FPSCounter();
// fpsCounter.start();
// // Later...
// fpsCounter.stop();
```

#### Event Logger

```javascript
class EventLogger {
  constructor(canvas, enabled = true) {
    this.canvas = canvas;
    this.enabled = enabled;
    this.log = [];

    if (!this.enabled) return;

    this.boundHandlers = {
      pointerdown: this.logEvent.bind(this, "pointerdown"),
      pointermove: this.logEvent.bind(this, "pointermove"),
      pointerup: this.logEvent.bind(this, "pointerup"),
      pointercancel: this.logEvent.bind(this, "pointercancel"),
      wheel: this.logEvent.bind(this, "wheel"),
    };

    Object.entries(this.boundHandlers).forEach(([type, handler]) => {
      canvas.addEventListener(type, handler, { passive: true });
    });
  }

  logEvent(type, event) {
    if (!this.enabled) return;

    const entry = {
      time: performance.now(),
      type,
      clientX: event.clientX,
      clientY: event.clientY,
      pressure: event.pressure ?? 0,
      timestamp: event.timeStamp,
    };

    this.log.push(entry);

    // Keep only last 100 events
    if (this.log.length > 100) {
      this.log.shift();
    }

    // Uncomment to see real-time logging
    // console.log(`${type} at (${event.clientX}, ${event.clientY})`);
  }

  getRecentEvents(count = 10) {
    return this.log.slice(-count);
  }

  clear() {
    this.log = [];
  }

  destroy() {
    Object.entries(this.boundHandlers).forEach(([type, handler]) => {
      this.canvas.removeEventListener(type, handler);
    });
  }
}

// Usage:
// const eventLogger = new EventLogger(canvas, true);
// // Later to see events:
// console.log(eventLog.getRecentEvents(5));
// // Cleanup:
// eventLogger.destroy();
```

## When to Seek Help

If you've tried the solutions above and are still experiencing issues, consider:

1. **Checking the GitHub Issues page** - Search for similar problems
2. **Creating a minimal reproduction** - Strip down to the bare essentials that still show the problem
3. **Asking in community forums** - Discord, Stack Overflow, etc.
4. **Contacting maintainers** - Provide:
   - Browser and version
   - Operating system
   - Fuderu version
   - Steps to reproduce
   - Expected vs actual behavior
   - Any error messages
   - Minimal code sample demonstrating the issue

## Reference: Error Messages and Their Meanings

### "Failed to construct 'CanvasRenderingContext2D'"

- **Meaning:** Browser doesn't support the Canvas API
- **Solution:** Check browser compatibility, consider polyfill for very old browsers

### "Cannot read property 'getContext' of null"

- **Meaning:** Trying to access canvas.getContext() on a null or undefined canvas element
- **Solution:** Verify the canvas element exists and is properly referenced

### "Maximum call stack size exceeded"

- **Meaning:** Infinite recursion in your code
- **Solution:** Check for recursive function calls without proper base cases

### "Permission denied to access property"

- **Meaning:** Cross-origin security restriction (often with images)
- **Solution:** Ensure proper CORS headers or use same-origin resources

### "IndexSizeError: Index or size is negative or greater than the allowed amount"

- **Meaning:** Trying to access canvas pixels outside valid bounds
- **Solution:** Check coordinate calculations, ensure values are within [0, width] and [0, height]

By following this troubleshooting guide, you should be able to identify and resolve most issues encountered when working with Fuderu. Remember that the most effective debugging approach is to:

1. Reproduce the issue consistently
2. Isolate the problem to the smallest possible code sample
3. Apply the scientific method: form hypotheses, test them, and iterate
4. Leverage browser developer tools to inspect runtime state
