#![allow(unused_imports)]
#![allow(unused_variables)]
#![allow(dead_code)]
#![allow(unused_mut)]
#![allow(unused_assignments)]
#![allow(unused_must_use)]
#![allow(unused_unsafe)]
#![allow(unused_parens)]
#![allow(unused_braces)]
#![allow(unused_qualifications)]
#![allow(unused_lifetimes)]
#![allow(unused_doc_comments)]
#![allow(unused_attributes)]

use parking_lot::Mutex;
use std::sync::Arc;
pub mod brower_info;
pub mod canvas;
pub use brower_info::*;
pub use canvas::*;

#[macro_export]
macro_rules! console_log {
    ($($t:tt)*) => (web_sys::console::log_1(&format!($($t)*).into()))
}

pub struct WgpuApp {
    pub canvas: CanvasWebGPU,
    pub surface: wgpu::Surface<'static>,
    pub device: wgpu::Device,
    pub queue: wgpu::Queue,
    pub config: wgpu::SurfaceConfiguration,
}

impl WgpuApp {
    async fn new() -> Self {
        let (width, height) = get_screen_size().unwrap();
        let canvas = CanvasWebGPU::new((width, height)).unwrap();
        todo!();
    }
}
