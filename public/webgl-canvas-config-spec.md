# WebGL Canvas Configuration Specification

## Version 1.4.20

A comprehensive guide to the JSON-based configuration format for declarative WebGL canvas rendering with layers, effects, shapes, and responsive breakpoints.

---

## Table of Contents

1. [Overview](#overview)
2. [Document Structure](#document-structure)
3. [Global Options](#global-options)
4. [Layer System](#layer-system)
5. [Layer Types](#layer-types)
   - [Effect Layers](#effect-layers)
   - [Shape Layers](#shape-layers)
6. [Responsive Breakpoints](#responsive-breakpoints)
7. [Shader System](#shader-system)
8. [Uniforms Reference](#uniforms-reference)
9. [Interactivity](#interactivity)
10. [Animation](#animation)
11. [Compositing & Blend Modes](#compositing--blend-modes)
12. [States & Transitions](#states--transitions)
13. [Complete Property Reference](#complete-property-reference)
14. [Implementation Guide](#implementation-guide)
15. [Examples](#examples)

---

## Overview

This configuration format defines a **layer-based WebGL rendering pipeline** that renders interactive, animated graphics to an HTML canvas element. The system supports:

- Multiple layer types (gradients, shapes, post-processing effects)
- Responsive layouts with breakpoint-based property overrides
- Mouse/touch interactivity
- Time-based animations
- Pre-compiled GLSL ES 3.0 shaders
- Multi-pass rendering for complex effects

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Configuration JSON                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Layer 0   │  │   Layer 1   │  │   Layer N   │   ...   │
│  │  (Bottom)   │  │             │  │    (Top)    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│                     WebGL Renderer                           │
├─────────────────────────────────────────────────────────────┤
│                     HTML Canvas                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Document Structure

The root JSON object contains four top-level properties:

```json
{
    "history": [],      // Array of layer configurations
    "options": {},      // Global rendering settings
    "version": "1.4.20", // Specification version
    "id": "uniqueId"    // Document identifier
}
```

### Root Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `history` | `Layer[]` | Yes | Ordered array of layers (bottom to top) |
| `options` | `Options` | Yes | Global rendering configuration |
| `version` | `string` | Yes | Specification version for compatibility |
| `id` | `string` | Yes | Unique document identifier |

---

## Global Options

The `options` object controls canvas-wide rendering settings:

```json
{
    "options": {
        "name": "My Canvas Effect",
        "fps": 60,
        "dpi": 1.5,
        "scale": 1,
        "includeLogo": false,
        "isProduction": false
    }
}
```

### Options Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | `string` | `""` | Human-readable name for the configuration |
| `fps` | `number` | `60` | Target frames per second (16-120) |
| `dpi` | `number` | `1` | Device pixel ratio multiplier. Higher values = sharper but more GPU intensive |
| `scale` | `number` | `1` | Global scale factor applied to all layers |
| `includeLogo` | `boolean` | `false` | Whether to render a watermark |
| `isProduction` | `boolean` | `false` | Production mode flag (may disable debug features) |

### DPI Guidelines

| DPI Value | Use Case |
|-----------|----------|
| `1` | Standard displays, performance priority |
| `1.5` | Balance of quality and performance |
| `2` | Retina/HiDPI displays |
| `window.devicePixelRatio` | Match device native resolution |

---

## Layer System

Layers are rendered sequentially from index 0 (bottom) to the last index (top). Each layer can be an **effect** (post-processing) or a **shape** (geometric element).

### Render Order

```
Canvas Output
     ↑
┌─────────────┐
│  Layer N    │  ← Top (rendered last)
├─────────────┤
│  Layer 2    │
├─────────────┤
│  Layer 1    │
├─────────────┤
│  Layer 0    │  ← Bottom (rendered first, typically background)
└─────────────┘
```

### Common Layer Properties

All layers share these base properties:

```json
{
    "visible": true,
    "aspectRatio": 1,
    "userDownsample": 1,
    "layerType": "effect",
    "type": "gradient",
    "breakpoints": [],
    "compiledFragmentShaders": [],
    "compiledVertexShaders": [],
    "data": {}
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `visible` | `boolean` | Yes | Whether the layer is rendered |
| `aspectRatio` | `number` | No | Aspect ratio constraint (width/height) |
| `userDownsample` | `number` | No | Resolution multiplier (0.5 = half resolution) |
| `layerType` | `"effect"` \| `"shape"` | Yes | Layer category |
| `type` | `string` | Yes | Specific layer type identifier |
| `breakpoints` | `Breakpoint[]` | Yes | Responsive property overrides |
| `compiledFragmentShaders` | `string[]` | Yes | GLSL ES 3.0 fragment shader source(s) |
| `compiledVertexShaders` | `string[]` | Yes | GLSL ES 3.0 vertex shader source(s) |
| `data` | `object` | Yes | Layer-specific configuration |

---

## Layer Types

### Effect Layers

Effect layers (`layerType: "effect"`) apply post-processing to previous layers or generate backgrounds.

#### Gradient Effect (`type: "gradient"`)

Renders a procedural gradient as a background layer.

```json
{
    "layerType": "effect",
    "type": "gradient",
    "speed": 0.25,
    "trackMouse": 0,
    "mouseMomentum": 0,
    "animating": false,
    "usesPingPong": false,
    "isMask": 0,
    "data": {
        "depth": false,
        "isBackground": true,
        "uniforms": {
            "gradientAngle": { "name": "uAngle", "type": "1f", "value": 0.5 },
            "scale": { "name": "uScale", "type": "1f", "value": 0.5 }
        }
    }
}
```

**Gradient-Specific Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `speed` | `number` | `0` | Animation speed multiplier |
| `usesPingPong` | `boolean` | `false` | Reverse animation direction at extremes |

**Gradient Uniforms:**

| Uniform | Type | Range | Description |
|---------|------|-------|-------------|
| `gradientAngle` | `1f` | `0-1` | Rotation angle (0.5 = no rotation) |
| `scale` | `1f` | `0-2` | Gradient scale/zoom |

**Gradient Types (defined in shader):**
- Radial gradient (distance from center)
- Linear gradient (directional)
- Conic gradient (angular)

**Color Interpolation:**
Colors are interpolated in **OKLab color space** for perceptually uniform blending. Colors are defined directly in the fragment shader via a `getColor(int index)` function.

---

#### Blur Effect (`type: "blur"`)

Applies Gaussian blur with optional depth-of-field behavior.

```json
{
    "layerType": "effect",
    "type": "blur",
    "trackMouse": 0.01,
    "mouseMomentum": 0,
    "animating": false,
    "data": {
        "downSample": 0.25,
        "depth": false,
        "isBackground": false,
        "passes": [
            { "prop": "vertical", "value": 1, "downSample": 0.25 },
            { "prop": "vertical", "value": 2, "downSample": 0.5 },
            { "prop": "vertical", "value": 3, "downSample": 0.5 }
        ],
        "uniforms": {
            "amount": { "name": "uAmount", "type": "1f", "value": 0.2 }
        }
    }
}
```

**Blur-Specific Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `data.downSample` | `number` | Initial render resolution (0.25 = quarter resolution) |
| `data.passes` | `Pass[]` | Multi-pass configuration for separable blur |

**Pass Configuration:**

| Property | Type | Description |
|----------|------|-------------|
| `prop` | `string` | Pass type identifier |
| `value` | `number` | Pass index/value |
| `downSample` | `number` | Resolution for this pass |

**Blur Uniforms:**

| Uniform | Type | Range | Description |
|---------|------|-------|-------------|
| `amount` | `1f` | `0-5` | Blur intensity |

**Breakpoint-Specific Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `amount` | `number` | Blur intensity override |
| `pos` | `Vec2` | Focal point center |
| `easing` | `number` | Easing function index for falloff |

---

#### FBM Distortion Effect (`type: "fbm"`)

Fractal Brownian Motion noise-based distortion for organic warping effects.

```json
{
    "layerType": "effect",
    "type": "fbm",
    "speed": 0.2,
    "trackMouse": 0,
    "mouseMomentum": 0,
    "animating": true,
    "data": {
        "depth": false,
        "isBackground": false,
        "uniforms": {
            "angle": { "name": "uAngle", "type": "1f", "value": 0 },
            "frequency": { "name": "uFrequency", "type": "1f", "value": 0.2 }
        }
    }
}
```

**FBM Uniforms:**

| Uniform | Type | Range | Description |
|---------|------|-------|-------------|
| `angle` | `1f` | `0-1` | Noise rotation angle |
| `frequency` | `1f` | `0-3` | Noise frequency/scale |

**Breakpoint-Specific Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `frequency` | `number` | Noise frequency |
| `angle` | `number` | Rotation angle |
| `drift` | `number` | Continuous motion speed |
| `phase` | `number` | Animation phase offset |
| `mixRadius` | `number` | Effect blend radius |
| `pos` | `Vec2` | Effect center point |

---

#### Halftone Effect (`type: "halftone"`)

CMYK halftone dot pattern overlay.

```json
{
    "layerType": "effect",
    "type": "halftone",
    "animating": false,
    "mouseMomentum": 0,
    "data": {
        "depth": false,
        "isBackground": false,
        "uniforms": {
            "rotation": { "name": "uRotation", "type": "1f", "value": 0 },
            "amount": { "name": "uAmount", "type": "1f", "value": 0.75 },
            "mix": { "name": "uMix", "type": "1f", "value": 0 },
            "threshold": { "name": "uThreshold", "type": "1f", "value": 0.5 }
        }
    }
}
```

**Halftone Uniforms:**

| Uniform | Type | Range | Description |
|---------|------|-------|-------------|
| `rotation` | `1f` | `-1 to 1` | Global dot rotation |
| `amount` | `1f` | `0-5` | Dot density/size |
| `mix` | `1f` | `0-1` | Blend with original image |
| `threshold` | `1f` | `0-1` | Dot cutoff threshold |

**Breakpoint-Specific Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `amount` | `number` | Dot density |
| `mix` | `number` | Effect blend amount |
| `rotation` | `number` | Dot pattern rotation |
| `threshold` | `number` | Dot threshold |
| `pos` | `Vec2` | Pattern center point |

---

### Shape Layers

Shape layers (`layerType: "shape"`) render geometric primitives.

#### Circle/Ellipse Shape (`type: "circle"`)

```json
{
    "layerType": "shape",
    "type": "circle",
    "isElement": true,
    "locked": false,
    "layerName": "",
    "opacity": 1,
    "blendMode": "NORMAL",

    "width": 0.5,
    "widthMode": "relative",
    "height": 0.4,
    "heightMode": "auto",
    "left": 0.25,
    "leftMode": "relative",
    "top": 0.1,
    "topMode": "relative",
    "rotation": 0,

    "fill": ["#FFFFFF"],
    "stroke": ["#000000"],
    "strokeWidth": 0,
    "borderRadius": 0,
    "gradientAngle": 0,
    "gradientType": "linear",

    "anchorPoint": "center",
    "pos": { "type": "Vec2", "_x": 0.5, "_y": 0.5 },
    "coords": [[0,0], [0.5,0], [0.5,0.4], [0,0.4]],
    "fitToCanvas": false,
    "numSides": 3,

    "effects": [],
    "displace": 0,
    "bgDisplace": 0,
    "dispersion": 0,
    "axisTilt": 0,

    "mask": 0,
    "maskBackground": { "type": "Vec3", "_x": 0, "_y": 0, "_z": 0 },
    "maskAlpha": 0,
    "maskDepth": 0,

    "states": {
        "appear": [],
        "scroll": [],
        "hover": []
    },

    "data": { "uniforms": {} }
}
```

**Dimension Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `width` | `number` | Shape width |
| `widthMode` | `"relative"` \| `"absolute"` \| `"auto"` | Width unit mode |
| `height` | `number` | Shape height |
| `heightMode` | `"relative"` \| `"absolute"` \| `"auto"` | Height unit mode |
| `left` | `number` | X position |
| `leftMode` | `"relative"` \| `"absolute"` | Position unit mode |
| `top` | `number` | Y position |
| `topMode` | `"relative"` \| `"absolute"` | Position unit mode |

**Mode Values:**
- `"relative"`: Value is a fraction of canvas dimension (0-1)
- `"absolute"`: Value is in pixels
- `"auto"`: Automatically calculated (e.g., maintain aspect ratio)

**Appearance Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `fill` | `string[]` | Fill color(s) as hex codes. Multiple = gradient |
| `stroke` | `string[]` | Stroke color(s) as hex codes |
| `strokeWidth` | `number` | Stroke width in pixels |
| `borderRadius` | `number` | Corner radius (0-1 for circles) |
| `opacity` | `number` | Layer opacity (0-1) |
| `gradientAngle` | `number` | Fill gradient rotation |
| `gradientType` | `"linear"` \| `"radial"` | Fill gradient type |

**Transform Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `rotation` | `number` | Rotation in radians |
| `anchorPoint` | `string` | Transform origin (`"center"`, `"top-left"`, etc.) |
| `pos` | `Vec2` | Normalized position (0-1 range) |
| `coords` | `number[][]` | Bounding box coordinates |

**Shape Types:**

| Type | `numSides` | Description |
|------|------------|-------------|
| `"circle"` | N/A | Circle or ellipse |
| `"polygon"` | `3+` | Regular polygon |
| `"rectangle"` | N/A | Rectangle |

---

## Responsive Breakpoints

Each layer can define property overrides for different viewport widths.

### Breakpoint Structure

```json
{
    "breakpoints": [
        {
            "name": "Desktop",
            "min": 992,
            "max": null,
            "props": {
                "gradientAngle": 0.2295,
                "scale": 0.92
            }
        },
        {
            "name": "Tablet",
            "min": 576,
            "max": 991,
            "props": {
                "gradientAngle": 0.5103,
                "scale": 0.92
            }
        },
        {
            "name": "Mobile",
            "min": 0,
            "max": 575,
            "props": {
                "scale": 1.168,
                "gradientAngle": 0.5076
            }
        }
    ]
}
```

### Breakpoint Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Human-readable breakpoint name |
| `min` | `number` | Minimum viewport width (inclusive) |
| `max` | `number \| null` | Maximum viewport width (inclusive). `null` = no maximum |
| `props` | `object` | Property overrides for this breakpoint |

### Standard Breakpoints

| Name | Min | Max | Typical Use |
|------|-----|-----|-------------|
| Desktop | 992 | null | Large screens, full experience |
| Tablet | 576 | 991 | Medium screens, adjusted layout |
| Mobile | 0 | 575 | Small screens, simplified effects |

### Property Override Behavior

1. Base layer properties are used as defaults
2. Active breakpoint's `props` are merged on top
3. Only specified properties are overridden; others retain base values

### Breakpoint Selection Logic

```javascript
function getActiveBreakpoint(breakpoints, viewportWidth) {
    return breakpoints.find(bp =>
        viewportWidth >= bp.min &&
        (bp.max === null || viewportWidth <= bp.max)
    );
}
```

---

## Shader System

Layers use GLSL ES 3.0 shaders for GPU-accelerated rendering.

### Shader Types

| Array | Purpose |
|-------|---------|
| `compiledVertexShaders` | Transform vertices, pass data to fragment shader |
| `compiledFragmentShaders` | Calculate final pixel colors |

### Multiple Shaders

When multiple shaders are present, they represent **render passes**:

```json
{
    "compiledFragmentShaders": [
        "// Pass 0: Horizontal blur",
        "// Pass 1: Vertical blur",
        "// Pass 2: Horizontal blur (2nd iteration)",
        "// Pass 3: Vertical blur (2nd iteration) + dithering"
    ]
}
```

### Standard Vertex Shader

```glsl
#version 300 es
precision mediump float;

in vec3 aVertexPosition;
in vec2 aTextureCoord;

uniform mat4 uMVMatrix;      // Model-View matrix
uniform mat4 uPMatrix;       // Projection matrix
uniform mat4 uTextureMatrix; // Texture coordinate transform
uniform vec2 uMousePos;      // Normalized mouse position

out vec2 vTextureCoord;
out vec3 vVertexPosition;

void main() {
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
    vTextureCoord = (uTextureMatrix * vec4(aTextureCoord, 0.0, 1.0)).xy;
}
```

### Standard Fragment Shader Structure

```glsl
#version 300 es
precision highp float;

in vec2 vTextureCoord;

uniform sampler2D uTexture;     // Previous pass output
uniform sampler2D uBgTexture;   // Background texture
uniform float uTime;            // Animation time
uniform vec2 uMousePos;         // Mouse position
uniform vec2 uResolution;       // Canvas dimensions
// ... layer-specific uniforms

out vec4 fragColor;

void main() {
    vec2 uv = vTextureCoord;
    // ... effect calculations
    fragColor = vec4(color, alpha);
}
```

### Built-in Uniform Variables

| Uniform | Type | Description |
|---------|------|-------------|
| `uMVMatrix` | `mat4` | Model-view transformation matrix |
| `uPMatrix` | `mat4` | Projection matrix |
| `uTextureMatrix` | `mat4` | Texture coordinate transformation |
| `uTexture` | `sampler2D` | Previous pass/layer output |
| `uBgTexture` | `sampler2D` | Background layer texture |
| `uTime` | `float` | Animation time (seconds) |
| `uMousePos` | `vec2` | Normalized mouse position (0-1) |
| `uResolution` | `vec2` | Canvas dimensions in pixels |
| `uSampleBg` | `int` | Whether to sample background (0 or 1) |

---

## Uniforms Reference

Uniforms are defined in `data.uniforms` and pass values from JavaScript to shaders.

### Uniform Definition

```json
{
    "data": {
        "uniforms": {
            "propertyName": {
                "name": "uShaderUniformName",
                "type": "1f",
                "value": 0.5
            }
        }
    }
}
```

### Uniform Types

| Type | GLSL Type | JavaScript Value |
|------|-----------|------------------|
| `"1f"` | `float` | `number` |
| `"2f"` | `vec2` | `[x, y]` or `{_x, _y}` |
| `"3f"` | `vec3` | `[x, y, z]` or `{_x, _y, _z}` |
| `"4f"` | `vec4` | `[x, y, z, w]` |
| `"1i"` | `int` | `number` (integer) |
| `"1fv"` | `float[]` | `number[]` |
| `"m4"` | `mat4` | `Float32Array(16)` |

### Common Uniforms by Effect Type

#### Gradient
| Property | Uniform | Type | Range |
|----------|---------|------|-------|
| `gradientAngle` | `uAngle` | `1f` | `0-1` |
| `scale` | `uScale` | `1f` | `0-2` |

#### Blur
| Property | Uniform | Type | Range |
|----------|---------|------|-------|
| `amount` | `uAmount` | `1f` | `0-5` |

#### FBM
| Property | Uniform | Type | Range |
|----------|---------|------|-------|
| `angle` | `uAngle` | `1f` | `0-1` |
| `frequency` | `uFrequency` | `1f` | `0-3` |

#### Halftone
| Property | Uniform | Type | Range |
|----------|---------|------|-------|
| `amount` | `uAmount` | `1f` | `0-5` |
| `rotation` | `uRotation` | `1f` | `-1 to 1` |
| `mix` | `uMix` | `1f` | `0-1` |
| `threshold` | `uThreshold` | `1f` | `0-1` |

---

## Interactivity

### Mouse Tracking

```json
{
    "trackMouse": 0.01,
    "mouseMomentum": 0
}
```

| Property | Type | Range | Description |
|----------|------|-------|-------------|
| `trackMouse` | `number` | `0-1` | Mouse influence strength. `0` = no tracking |
| `mouseMomentum` | `number` | `0-1` | Smoothing/inertia for mouse movement |

### Mouse Position in Shaders

```glsl
uniform vec2 uMousePos; // Range: 0-1, (0,0) = top-left

// Apply mouse offset to effect center
vec2 pos = vec2(0.5, 0.5) + mix(vec2(0), (uMousePos - 0.5), trackMouse);
```

### 3D Tilt Effect

Shape layers can tilt based on mouse position:

```glsl
// In vertex shader
float angleX = uMousePos.y * 0.5 - 0.25;
float angleY = (1.0 - uMousePos.x) * 0.5 - 0.25;

mat4 rotateX = mat4(
    1.0, 0.0, 0.0, 0.0,
    0.0, cos(angleX), -sin(angleX), 0.0,
    0.0, sin(angleX), cos(angleX), 0.0,
    0.0, 0.0, 0.0, 1.0
);
```

---

## Animation

### Animation Properties

```json
{
    "animating": true,
    "speed": 0.25
}
```

| Property | Type | Description |
|----------|------|-------------|
| `animating` | `boolean` | Whether time-based animation is enabled |
| `speed` | `number` | Animation speed multiplier |

### Time in Shaders

```glsl
uniform float uTime; // Seconds since start, multiplied by speed

// Example: Animated gradient position
float animatedPos = fract(position - uTime * 0.01);
```

### Ping-Pong Animation

```json
{
    "usesPingPong": true
}
```

When enabled, animations reverse direction at extremes instead of looping:

```glsl
float cycle = floor(position);
bool reverse = int(cycle) % 2 == 0;
float animatedPos = reverse ? 1.0 - fract(position) : fract(position);
```

---

## Compositing & Blend Modes

### Layer Blending

```json
{
    "opacity": 0.93,
    "blendMode": "NORMAL"
}
```

### Blend Mode Values

| Mode | Description |
|------|-------------|
| `"NORMAL"` | Standard alpha compositing |
| `"MULTIPLY"` | Darken by multiplying colors |
| `"SCREEN"` | Lighten (inverse multiply) |
| `"OVERLAY"` | Combines multiply and screen |
| `"ADD"` | Additive blending (glow effect) |

### Alpha Compositing in Shaders

```glsl
// Standard alpha blend
color = mix(background, foreground / max(foreground.a, 0.0001), foreground.a * opacity);
```

---

## States & Transitions

Shape layers support state-based animations:

```json
{
    "states": {
        "appear": [],
        "scroll": [],
        "hover": []
    }
}
```

### State Types

| State | Trigger | Description |
|-------|---------|-------------|
| `appear` | Page load | Entrance animation |
| `scroll` | Scroll position | Scroll-linked animation |
| `hover` | Mouse hover | Hover interaction |

### State Definition (within arrays)

```json
{
    "property": "opacity",
    "from": 0,
    "to": 1,
    "duration": 500,
    "easing": "easeOutCubic",
    "delay": 0
}
```

---

## Complete Property Reference

### Effect Layer Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `visible` | `boolean` | `true` | Layer visibility |
| `aspectRatio` | `number` | `1` | Aspect ratio constraint |
| `userDownsample` | `number` | `1` | Resolution multiplier |
| `layerType` | `string` | - | Always `"effect"` |
| `type` | `string` | - | Effect type identifier |
| `usesPingPong` | `boolean` | `false` | Ping-pong animation |
| `speed` | `number` | `0` | Animation speed |
| `trackMouse` | `number` | `0` | Mouse tracking strength |
| `mouseMomentum` | `number` | `0` | Mouse smoothing |
| `animating` | `boolean` | `false` | Enable animation |
| `isMask` | `number` | `0` | Use as mask layer |

### Shape Layer Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `visible` | `boolean` | `true` | Layer visibility |
| `locked` | `boolean` | `false` | Prevent editing |
| `isElement` | `boolean` | `true` | Is a DOM-like element |
| `layerName` | `string` | `""` | Human-readable name |
| `layerType` | `string` | - | Always `"shape"` |
| `type` | `string` | - | Shape type (`"circle"`, etc.) |
| `opacity` | `number` | `1` | Layer opacity |
| `blendMode` | `string` | `"NORMAL"` | Blend mode |
| `width` | `number` | - | Shape width |
| `widthMode` | `string` | `"relative"` | Width unit mode |
| `height` | `number` | - | Shape height |
| `heightMode` | `string` | `"auto"` | Height unit mode |
| `left` | `number` | - | X position |
| `leftMode` | `string` | `"relative"` | X position mode |
| `top` | `number` | - | Y position |
| `topMode` | `string` | `"relative"` | Y position mode |
| `rotation` | `number` | `0` | Rotation (radians) |
| `fill` | `string[]` | - | Fill color(s) |
| `stroke` | `string[]` | - | Stroke color(s) |
| `strokeWidth` | `number` | `0` | Stroke width |
| `borderRadius` | `number` | `0` | Corner radius |
| `gradientAngle` | `number` | `0` | Fill gradient angle |
| `gradientType` | `string` | `"linear"` | Gradient type |
| `anchorPoint` | `string` | `"center"` | Transform origin |
| `pos` | `Vec2` | `{0.5, 0.5}` | Position |
| `coords` | `number[][]` | - | Bounding coordinates |
| `fitToCanvas` | `boolean` | `false` | Stretch to fill |
| `numSides` | `number` | `3` | Polygon sides |
| `effects` | `array` | `[]` | Per-shape effects |
| `displace` | `number` | `0` | Displacement amount |
| `bgDisplace` | `number` | `0` | Background displacement |
| `dispersion` | `number` | `0` | Color dispersion |
| `axisTilt` | `number` | `0` | 3D axis tilt |
| `mask` | `number` | `0` | Mask mode |
| `maskBackground` | `Vec3` | `{0,0,0}` | Mask background color |
| `maskAlpha` | `number` | `0` | Mask alpha |
| `maskDepth` | `number` | `0` | Mask depth |
| `trackMouse` | `number` | `0` | Mouse tracking |
| `mouseMomentum` | `number` | `0` | Mouse smoothing |
| `states` | `object` | `{}` | Animation states |

### Data Object Properties

| Property | Type | Description |
|----------|------|-------------|
| `uniforms` | `object` | Shader uniform definitions |
| `depth` | `boolean` | Enable depth testing |
| `isBackground` | `boolean` | Render as background |
| `downSample` | `number` | Resolution reduction |
| `passes` | `Pass[]` | Multi-pass configuration |

---

## Implementation Guide

### Minimum Viable Renderer

```javascript
class CanvasRenderer {
    constructor(canvas, config) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2');
        this.config = config;
        this.layers = [];
        this.time = 0;
        this.mousePos = { x: 0.5, y: 0.5 };

        this.init();
    }

    init() {
        const { gl, config } = this;

        // Set up canvas
        this.resize();

        // Initialize layers
        config.history.forEach((layerConfig, index) => {
            if (!layerConfig.visible) return;

            const layer = this.createLayer(layerConfig);
            this.layers.push(layer);
        });

        // Start render loop
        this.render();
    }

    createLayer(config) {
        const { gl } = this;

        // Compile shaders
        const vertexShader = this.compileShader(
            gl.VERTEX_SHADER,
            config.compiledVertexShaders[0]
        );
        const fragmentShader = this.compileShader(
            gl.FRAGMENT_SHADER,
            config.compiledFragmentShaders[0]
        );

        // Create program
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        // Get uniform locations
        const uniforms = {};
        if (config.data?.uniforms) {
            Object.entries(config.data.uniforms).forEach(([key, def]) => {
                uniforms[key] = {
                    location: gl.getUniformLocation(program, def.name),
                    type: def.type,
                    value: def.value
                };
            });
        }

        return { config, program, uniforms };
    }

    compileShader(type, source) {
        const { gl } = this;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        return shader;
    }

    getActiveBreakpoint(breakpoints) {
        const width = this.canvas.clientWidth;
        return breakpoints.find(bp =>
            width >= bp.min && (bp.max === null || width <= bp.max)
        );
    }

    render() {
        const { gl } = this;
        const now = performance.now() / 1000;
        this.time = now;

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);

        this.layers.forEach(layer => {
            const bp = this.getActiveBreakpoint(layer.config.breakpoints);
            const props = { ...layer.config, ...bp?.props };

            gl.useProgram(layer.program);

            // Set common uniforms
            const timeLoc = gl.getUniformLocation(layer.program, 'uTime');
            if (timeLoc) gl.uniform1f(timeLoc, this.time * (props.speed || 1));

            const mouseLoc = gl.getUniformLocation(layer.program, 'uMousePos');
            if (mouseLoc) gl.uniform2f(mouseLoc, this.mousePos.x, this.mousePos.y);

            const resLoc = gl.getUniformLocation(layer.program, 'uResolution');
            if (resLoc) gl.uniform2f(resLoc, gl.canvas.width, gl.canvas.height);

            // Set layer-specific uniforms
            Object.entries(layer.uniforms).forEach(([key, uniform]) => {
                const value = props[key] ?? uniform.value;
                if (uniform.type === '1f') {
                    gl.uniform1f(uniform.location, value);
                } else if (uniform.type === '2f') {
                    gl.uniform2f(uniform.location, value._x || value[0], value._y || value[1]);
                }
            });

            // Draw fullscreen quad
            this.drawQuad();
        });

        requestAnimationFrame(() => this.render());
    }

    drawQuad() {
        // Implementation: draw a fullscreen quad covering clip space
    }

    resize() {
        const { canvas, config } = this;
        const dpi = config.options.dpi || 1;
        canvas.width = canvas.clientWidth * dpi;
        canvas.height = canvas.clientHeight * dpi;
    }

    setMousePosition(x, y) {
        this.mousePos = {
            x: x / this.canvas.clientWidth,
            y: y / this.canvas.clientHeight
        };
    }
}
```

### Event Handling

```javascript
// Resize handler
window.addEventListener('resize', () => renderer.resize());

// Mouse tracking
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    renderer.setMousePosition(
        e.clientX - rect.left,
        e.clientY - rect.top
    );
});

// Touch support
canvas.addEventListener('touchmove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    renderer.setMousePosition(
        touch.clientX - rect.left,
        touch.clientY - rect.top
    );
});
```

### Multi-Pass Rendering

For effects like blur that require multiple passes:

```javascript
renderMultiPass(layer) {
    const { gl } = this;
    const passes = layer.config.data.passes || [];

    // Create framebuffers for ping-pong
    const fb1 = this.createFramebuffer();
    const fb2 = this.createFramebuffer();

    let source = this.previousLayerTexture;
    let target = fb1;

    passes.forEach((pass, index) => {
        // Resize framebuffer for downsampling
        const scale = pass.downSample || 1;
        this.resizeFramebuffer(target, scale);

        // Bind target framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);

        // Use pass-specific shader
        gl.useProgram(layer.programs[index]);

        // Bind source texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, source);

        // Draw
        this.drawQuad();

        // Swap for next pass
        source = target.texture;
        target = target === fb1 ? fb2 : fb1;
    });

    return source; // Final output texture
}
```

---

## Examples

### Minimal Gradient Background

```json
{
    "history": [
        {
            "visible": true,
            "layerType": "effect",
            "type": "gradient",
            "breakpoints": [
                { "name": "All", "min": 0, "max": null, "props": {} }
            ],
            "compiledFragmentShaders": ["...gradient shader..."],
            "compiledVertexShaders": ["...vertex shader..."],
            "data": {
                "isBackground": true,
                "uniforms": {
                    "gradientAngle": { "name": "uAngle", "type": "1f", "value": 0.5 },
                    "scale": { "name": "uScale", "type": "1f", "value": 0.5 }
                }
            }
        }
    ],
    "options": { "fps": 60, "dpi": 1 },
    "version": "1.4.20",
    "id": "example1"
}
```

### Shape with Responsive Sizing

```json
{
    "history": [
        {
            "visible": true,
            "layerType": "shape",
            "type": "circle",
            "opacity": 1,
            "blendMode": "NORMAL",
            "fill": ["#FF5500"],
            "breakpoints": [
                {
                    "name": "Desktop",
                    "min": 992,
                    "max": null,
                    "props": {
                        "width": 0.3,
                        "height": 0.5,
                        "left": 0.35,
                        "top": 0.25
                    }
                },
                {
                    "name": "Mobile",
                    "min": 0,
                    "max": 991,
                    "props": {
                        "width": 0.8,
                        "height": 0.4,
                        "left": 0.1,
                        "top": 0.3
                    }
                }
            ],
            "compiledFragmentShaders": ["..."],
            "compiledVertexShaders": ["..."],
            "data": { "uniforms": {} }
        }
    ],
    "options": { "fps": 60, "dpi": 1.5 },
    "version": "1.4.20",
    "id": "example2"
}
```

### Layered Composition with Effects

```json
{
    "history": [
        {
            "layerType": "effect",
            "type": "gradient",
            "data": { "isBackground": true }
        },
        {
            "layerType": "shape",
            "type": "circle",
            "fill": ["#FFFFFF"],
            "opacity": 0.8
        },
        {
            "layerType": "effect",
            "type": "blur",
            "data": {
                "uniforms": {
                    "amount": { "name": "uAmount", "type": "1f", "value": 0.3 }
                }
            }
        },
        {
            "layerType": "effect",
            "type": "halftone",
            "data": {
                "uniforms": {
                    "mix": { "name": "uMix", "type": "1f", "value": 0.2 }
                }
            }
        }
    ],
    "options": { "fps": 60, "dpi": 1.5 },
    "version": "1.4.20",
    "id": "example3"
}
```

---

## Appendix

### Vec2 Type

```json
{
    "type": "Vec2",
    "_x": 0.5,
    "_y": 0.5
}
```

### Vec3 Type

```json
{
    "type": "Vec3",
    "_x": 0,
    "_y": 0,
    "_z": 0
}
```

### Color Format

Colors use hex notation:
- `"#RGB"` - Short hex (expanded to full)
- `"#RRGGBB"` - Full hex
- `"#RRGGBBAA"` - Hex with alpha

### Easing Functions

Easing index values used in shaders:

| Index | Function |
|-------|----------|
| 0 | Linear |
| 1 | Ease In Quad |
| 2 | Ease Out Quad |
| 3 | Ease In Out Quad |
| 4 | Ease In Cubic |
| 5 | Ease Out Cubic |
| 6 | Ease In Out Cubic |
| 7+ | Various other easings |

---

## Version History

| Version | Changes |
|---------|---------|
| 1.4.20 | Current version |

---

*Document generated from reverse-engineering analysis. Implementation details may vary.*
