// core/src/brushes/airbrush/normal.rs

pub struct AirbrushNormal;

impl AirbrushNormal {
    pub fn new() -> Self {
        Self
    }

    pub fn process(
        &mut self,
        x: f64,
        y: f64,
        pressure: f64,
        speed: f64,
        size: f64,
        opacity: f64,
    ) -> Vec<f64> {
        let final_size = size * (0.5 + 0.5 * pressure.powf(1.2));

        let final_opacity = opacity * (
            pressure.powf(1.2) * 0.2 + (1.0 - speed.min(1.0)) * 0.1
        );

        vec![x, y, final_size, final_opacity]
    }

    pub fn reset(&mut self) {}
}