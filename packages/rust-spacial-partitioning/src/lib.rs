use rustc_hash::FxHashMap;
use wasm_bindgen::prelude::*;
use smallvec::SmallVec;

fn pack_xyz_bits(x: i32, y: i32, z: i32) -> u64 {
    let bias = 1 << 20;
    let x_int = ((x + bias) & 0x1fffff) as u64;
    let y_int = ((y + bias) & 0x1fffff) as u64;
    let z_int = ((z + bias) & 0x1fffff) as u64;
    (x_int << 42) | (y_int << 21) | z_int
}
fn bucket_value(value: f32, distance: f32) -> i32 {
    (value / distance).floor() as i32
}

#[wasm_bindgen]
pub fn create_nearby_graph(vec_tuples: &[f32], distance: f32) -> Vec<f32> {
    let points: Vec<[f32; 3]> = vec_tuples
        .chunks_exact(3)
        .map(|c| [c[0], c[1], c[2]])
        .collect();
    let item_count = vec_tuples.len() / 3;
    let squared_distance = distance * distance;
    let mut nearby_lookup = Vec::new();

    let mut bucketed_vec_indexes: FxHashMap<u64, Vec<usize>> = FxHashMap::default();

    for i in 0..item_count {
        let [x, y, z] = points[i];
        let bucket_id = pack_xyz_bits(
            bucket_value(x, distance),
            bucket_value(y, distance),
            bucket_value(z, distance),
        );
        bucketed_vec_indexes.entry(bucket_id).or_default().push(i);
    }

    let mut nearish_bucket: SmallVec<[usize; 64]> = SmallVec::new();
    for (&_key, items_in_bucket) in bucketed_vec_indexes.iter() {
        nearish_bucket.clear();
        let sample_index = items_in_bucket[0];
        let [x, y, z] = points[sample_index];
        let bx = bucket_value(x, distance);
        let by = bucket_value(y, distance);
        let bz = bucket_value(z, distance);

        for dx in -1..=1 {
            for dy in -1..=1 {
                for dz in -1..=1 {
                    let neighbor_key = pack_xyz_bits(bx + dx, by + dy, bz + dz);
                    if let Some(neighbors) = bucketed_vec_indexes.get(&neighbor_key) {
                        nearish_bucket.extend(neighbors.iter().copied());
                    }
                }
            }
        }

        for &i in items_in_bucket.iter() {
            let [xi, yi, zi] = points[i];
            for &j in nearish_bucket.iter() {
                if i >= j {
                    continue;
                }
                let [xj, yj, zj] = points[j];
                let dx = xj - xi;
                let dy = yj - yi;
                let dz = zj - zi;
                let dist_sq = dx * dx + dy * dy + dz * dz;
                if dist_sq < squared_distance {
                    let actual_distance = dist_sq.sqrt();
                    nearby_lookup.push(i as f32);
                    nearby_lookup.push(j as f32);
                    nearby_lookup.push(actual_distance);
                }
            }
        }
    }

    nearby_lookup
}
