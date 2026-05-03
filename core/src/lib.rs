use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct StrokeProcessor {
    last_x: f64,
    last_y: f64,
    last_pressure: f64,
    smoothing: f64,
    points: Vec<f64>,
}

#[wasm_bindgen]
impl StrokeProcessor {
    pub fn new() -> StrokeProcessor {
        StrokeProcessor {
            last_x: 0.0,
            last_y: 0.0,
            last_pressure: 0.5,
            smoothing: 0.5,
            points: Vec::new(),
        }
    }

    pub fn process_point(&mut self, x: f64, y: f64, pressure: f64) -> Vec<f64> {
        self.points.clear();
        
        // Apply smoothing (simple weighted average)
        let smooth_x = if self.last_x == 0.0 {
            x
        } else {
            x * (1.0 - self.smoothing) + self.last_x * self.smoothing
        };
        
        let smooth_y = if self.last_y == 0.0 {
            y
        } else {
            y * (1.0 - self.smoothing) + self.last_y * self.smoothing
        };
        
        self.points.push(smooth_x);
        self.points.push(smooth_y);
        self.points.push(pressure);
        
        self.last_x = smooth_x;
        self.last_y = smooth_y;
        self.last_pressure = pressure;
        
        self.points.clone()
    }
    
    pub fn calculate_size(&self, pressure: f64, min_size: f64, max_size: f64) -> f64 {
        let calibrated = pressure.powf(1.2);
        min_size + (max_size - min_size) * calibrated
    }
    
    pub fn calculate_opacity(&self, pressure: f64, speed: f64) -> f64 {
        let calibrated = pressure.powf(1.2);
        let speed_factor = (1.0 - speed.min(1.0)) * 0.6;
        (calibrated * 0.7 + speed_factor).min(1.0)
    }

    pub fn set_smoothing(&mut self, value: f64) {
        self.smoothing = value.clamp(0.0, 1.0);
    }
    
    pub fn reset(&mut self) {
        self.last_x = 0.0;
        self.last_y = 0.0;
        self.points.clear();
    }
}

#[wasm_bindgen]
pub struct BrushRenderer {
    processor: StrokeProcessor,
}

#[wasm_bindgen]
impl BrushRenderer {
    pub fn new() -> BrushRenderer {
        BrushRenderer {
            processor: StrokeProcessor::new(),
        }
    }
    
    pub fn process_stroke(&mut self, x: f64, y: f64, pressure: f64) -> JsValue {
        let processed = self.processor.process_point(x, y, pressure);
        serde_wasm_bindgen::to_value(&processed).unwrap()
    }
    
    pub fn calculate_brush_params(&self, pressure: f64, speed: f64) -> JsValue {
        let size = self.processor.calculate_size(pressure, 2.0, 50.0);
        let opacity = self.processor.calculate_opacity(pressure, speed);
        serde_wasm_bindgen::to_value(&vec![size, opacity]).unwrap()
    }
    
    pub fn reset_stroke(&mut self) {
        self.processor.reset();
    }
    
    pub fn set_smoothing(&mut self, value: f64) {
        self.processor.set_smoothing(value);
    }
}