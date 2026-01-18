# @robertaron/spacial-partitioning

Efficient spatial partitioning and neighbor graph generation for 3D simulations, powered by Rust and WebAssembly. This package provides a fast way to compute nearby relationships between points in 3D space, useful for flocking, boids, crowd simulation, and other spatial algorithms.

---

## Features

- **High performance**: Core logic implemented in Rust and compiled to WebAssembly.
- **Works in Node.js and browsers**: Supports both ESM and CommonJS.
- **Typed API**: TypeScript types included.

---
## Installation

```sh
npm install @robertaron/spacial-partitioning
```

---

## Usage

```js
import { init, createNearByGraph } from "@robertaron/spacial-partitioning";

// Initialize the WASM module (required before using createNearByGraph)
await init();
const positions = new Float32Array([
  0, 0, 0,
  1, 0, 0,
  0, 10, 0,
  0, 10, 1,
  // ... more points
]);
const neighborGraph = createNearByGraph(positions, 2);
// neighborGraph is an array of edges:
// [
//   { from: 0, to: 1, distance: 1.0 },
//   { from: 2, to: 3, distance: 1.0 },
// ]
```

---

## API

### `async init(): Promise<void>`

Initializes the WASM module. **Must be called before using `createNearByGraph`.**

### `createNearByGraph(positions: Float32Array, distance: number): Array<{ from: number; to: number; distance: number }>`

- `positions`: Flat array of 3D coordinates (x, y, z, x, y, z, ...).
- `distance`: Maximum distance to consider two points as neighbors.
- Returns: An array of edges, where each edge contains `from` and `to` (indices of neighboring points) and `distance` (the distance between them).

---

## Use Cases

- Flocking/boids simulations
- Crowd and agent-based modeling
- Efficient spatial queries in 3D environments

---

## License

MIT

---

## Credits

- Rust WASM core by [@robertaron](https://github.com/robertaron)
- Inspired by spatial partitioning techniques in game development and simulation

---

For more details,