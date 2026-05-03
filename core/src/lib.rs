// core/src/lib.rs

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct StrokeProcessor {
    last_x: f64,
    last_y: f64,
    smoothing: f64,
}

#[wasm_bindgen]
impl StrokeProcessor {
    pub fn new() -> StrokeProcessor {
        StrokeProcessor {
            last_x: 0.0,
            last_y: 0.0,
            smoothing: 0.5,
        }
    }

    pub fn process_point(&mut self, x: f64, y: f64) -> Vec<f64> {
        let points = vec![
            x,
            y,
            (x + self.last_x) * 0.5,
            (y + self.last_y) * 0.5,
        ];
        self.last_x = x;
        self.last_y = y;
        points
    }

    pub fn set_smoothing(&mut self, value: f64) {
        self.smoothing = value.clamp(0.0, 1.0);
    }
}

#[wasm_bindgen]
pub fn calculate_opacity(pressure: f64, speed: f64) -> f64 {
    let calibrated = pressure.powf(1.2);
    let speed_factor = (1.0 - speed.min(1.0)) * 0.6;
    (calibrated * 0.7 + speed_factor).min(1.0)
}