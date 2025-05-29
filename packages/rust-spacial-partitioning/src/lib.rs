use std::collections::HashMap;
use wasm_bindgen::prelude::*;

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
pub fn create_nearby_graph(vec_tuples: &[f32], distance: f32) -> Vec<u32> {
    let squared_distance = distance * distance;
    let item_count = vec_tuples.len() / 3;
    let mut nearby_lookup = Vec::with_capacity(item_count * item_count);

    let mut bucketed_vec_indexes: HashMap<u64, Vec<usize>> = HashMap::new();

    for i in 0..item_count {
        let offset = i * 3;
        let x = vec_tuples[offset];
        let y = vec_tuples[offset + 1];
        let z = vec_tuples[offset + 2];
        let bucket_id = pack_xyz_bits(
            bucket_value(x, distance),
            bucket_value(y, distance),
            bucket_value(z, distance),
        );
        bucketed_vec_indexes.entry(bucket_id).or_default().push(i);
    }

    for (&key, items_in_bucket) in bucketed_vec_indexes.iter() {
        let sample_index = items_in_bucket[0];
        let offset = sample_index * 3;
        let x = vec_tuples[offset];
        let y = vec_tuples[offset + 1];
        let z = vec_tuples[offset + 2];
        let bx = bucket_value(x, distance);
        let by = bucket_value(y, distance);
        let bz = bucket_value(z, distance);

        let mut nearish_bucket = Vec::new();
        for dx in -1..=1 {
            for dy in -1..=1 {
                for dz in -1..=1 {
                    let neighbor_key = pack_xyz_bits(bx + dx, by + dy, bz + dz);
                    if let Some(neighbors) = bucketed_vec_indexes.get(&neighbor_key) {
                        nearish_bucket.extend(neighbors);
                    }
                }
            }
        }

        for &i in items_in_bucket.iter() {
            let xi = vec_tuples[i * 3];
            let yi = vec_tuples[i * 3 + 1];
            let zi = vec_tuples[i * 3 + 2];
            for &j in nearish_bucket.iter() {
                if i >= j {
                    continue;
                }
                let xj = vec_tuples[j * 3];
                let yj = vec_tuples[j * 3 + 1];
                let zj = vec_tuples[j * 3 + 2];
                let dist_sq = (xj - xi).powi(2) + (yj - yi).powi(2) + (zj - zi).powi(2);
                if dist_sq < squared_distance {
                    nearby_lookup.push(i as u32);
                    nearby_lookup.push(j as u32);
                }
            }
        }
    }

    nearby_lookup
}
