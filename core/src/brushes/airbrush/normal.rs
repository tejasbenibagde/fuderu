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
    ) -> Vec<f64> {
        let size = 10.0 + 60.0 * pressure.powf(1.2);

        let opacity =
            pressure.powf(1.2) * 0.2 + (1.0 - speed.min(1.0)) * 0.1;

        vec![x, y, size, opacity]
    }

    pub fn reset(&mut self) {}
}