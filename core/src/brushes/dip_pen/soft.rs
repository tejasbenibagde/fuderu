pub struct DipPenSoft {
    last_x: f64,
    last_y: f64,
    smoothing: f64,
}

impl DipPenSoft {
    pub fn new() -> Self {
        Self {
            last_x: 0.0,
            last_y: 0.0,
            smoothing: 0.7,
        }
    }

    pub fn process(
        &mut self,
        x: f64,
        y: f64,
        pressure: f64,
        _speed: f64,
    ) -> Vec<f64> {
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

        let size = 2.0 + 40.0 * pressure.powf(1.5);
        let opacity = 0.6 + pressure.powf(1.5) * 0.4;

        self.last_x = smooth_x;
        self.last_y = smooth_y;

        vec![smooth_x, smooth_y, size, opacity]
    }

    pub fn reset(&mut self) {
        self.last_x = 0.0;
        self.last_y = 0.0;
    }
}