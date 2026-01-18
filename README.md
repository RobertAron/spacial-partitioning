# @robertaron/spacial-partitioning

High performance spacial partitioning for javascript.

![Spacial Partitioning Diagram](readme/daigram.svg)
---

---
## Installation

```sh
npm install @robertaron/spacial-partitioning
```

---

## Example

Implementation of boids using the exported package can be seen [here](https://spacial-partitioning.vercel.app/)

## Usage

**Input**
- `positions`: Flat array of 3D coordinates (x, y, z, x, y, z, ...).
- `distance`: Maximum distance to consider two points as neighbors.

**Output**
- `Array<{ from: number; to: number; distance: number }>` - an array of edges, where each edge contains the indices of two neighboring points and the distance between them.

```ts
import { init, createNearByGraph } from "@robertaron/spacial-partitioning";

// Initialize the WASM module (required before using createNearByGraph)
await init();
const positions = new Float32Array([
  0,   0,   0,
  1.5, 0,   0,
  1.5, 1.5, 0
  // ... more points
]);
const distance = 2
const neighborGraph = createNearByGraph(positions, distance);
// [
//   { from: 0, to: 1, distance: 1.5 },
//   { from: 1, to: 2, distance: 1.5 },
// ]
```
---



### Notes

This repo includes 3 implementations of the same algorithm using `rust-wasm`,`assembly-script`, and `typescript`. The rust one is the one which is packaged.


### Performance

Benchmarks in `bun`

![Benchmarks](readme/benchmark.png)