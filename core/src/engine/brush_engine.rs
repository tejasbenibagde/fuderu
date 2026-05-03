use wasm_bindgen::prelude::*;

use crate::brushes::dip_pen::soft::DipPenSoft;
use crate::brushes::airbrush::normal::AirbrushNormal;

enum BrushType {
    DipPenSoft(DipPenSoft),
    AirbrushNormal(AirbrushNormal),
}

#[wasm_bindgen]
pub struct BrushEngine {
    brush: BrushType,
}

#[wasm_bindgen]
impl BrushEngine {
    #[wasm_bindgen(constructor)]
    pub fn new(brush_type: String) -> BrushEngine {
        let brush = match brush_type.as_str() {
            "dip-pen-soft" => BrushType::DipPenSoft(DipPenSoft::new()),
            "airbrush-normal" => BrushType::AirbrushNormal(AirbrushNormal::new()),
            _ => panic!("Unknown brush type"),
        };

        BrushEngine { brush }
    }

    pub fn process(
        &mut self,
        x: f64,
        y: f64,
        pressure: f64,
        speed: f64,
    ) -> Vec<f64> {
        match &mut self.brush {
            BrushType::DipPenSoft(b) => b.process(x, y, pressure, speed),
            BrushType::AirbrushNormal(b) => b.process(x, y, pressure, speed),
        }
    }

    pub fn reset(&mut self) {
        match &mut self.brush {
            BrushType::DipPenSoft(b) => b.reset(),
            BrushType::AirbrushNormal(b) => b.reset(),
        }
    }
}