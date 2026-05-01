use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn get_smooth_point(x1: f32, y1: f32, x2: f32, y2: f32) -> Vec<f32> {
    vec![(x1 + x2) / 2.0, (y1 + y2) / 2.0]
}