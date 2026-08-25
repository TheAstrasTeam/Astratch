// use parking_lot::Mutex;
use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::JsCast;
use wasm_bindgen::closure::Closure;
use web_sys::window;
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
    pub size: Rc<RefCell<(u32, u32)>>,
    pub surface: wgpu::Surface<'static>,
    pub device: wgpu::Device,
    pub queue: wgpu::Queue,
    pub config: wgpu::SurfaceConfiguration,
}

impl WgpuApp {
    pub async fn new() -> Self {
        let (width, height) = get_screen_size().unwrap();

        // 初始化canvas
        let canvas = CanvasWebGPU::new((width, height)).unwrap();
        console_log!("Canvas init done, size: {} x {}.", width, height);
        let size = Rc::new(RefCell::new((width, height)));

        // 获取WebGPU表面
        let instance = wgpu::Instance::new(wgpu::InstanceDescriptor {
            backends: wgpu::Backends::BROWSER_WEBGPU,
            ..wgpu::InstanceDescriptor::new_without_display_handle()
        });
        let surface_target = wgpu::SurfaceTarget::Canvas(canvas.canvas.clone());

        // type(surface) = wgpu::Surface
        let surface = instance.create_surface(surface_target).unwrap();

        // 获取适配器
        // type(adapter) = wgpu::Adapter
        let adapter = instance
            .request_adapter(&wgpu::RequestAdapterOptions {
                power_preference: wgpu::PowerPreference::default(),      
                force_fallback_adapter: false,
                compatible_surface: Some(&surface),
                apply_limit_buckets: false,
            })
            .await
            .unwrap();

        // 获取设备和队列
        let (device, queue) = adapter
            .request_device(&wgpu::DeviceDescriptor {
                label: None,
                required_features: wgpu::Features::empty(),
                required_limits: wgpu::Limits::downlevel_webgl2_defaults(),
                experimental_features: wgpu::ExperimentalFeatures::disabled(),
                memory_hints: wgpu::MemoryHints::Performance,
                // 追踪 API 调用路径
                trace: wgpu::Trace::Off,
            })
            .await
            .unwrap();
        
        // 获取表面能力和配置
        // type(caps) = wgpu::SurfaceCapabilities
        let caps = surface.get_capabilities(&adapter);
        let config = wgpu::SurfaceConfiguration {
            usage: wgpu::TextureUsages::RENDER_ATTACHMENT,
            format: caps.formats[0],
            color_space: wgpu::SurfaceColorSpace::Auto,
            width,
            height,
            present_mode: wgpu::PresentMode::Fifo,
            desired_maximum_frame_latency: 2,
            alpha_mode: caps.alpha_modes[0],
            view_formats: vec![],
        };

        let mut app = Self {
            canvas,
            size,
            surface,
            device,
            queue,
            config,
        };
        
        app.setup_resize_handler();
        app
    }

    pub fn setup_resize_handler(&mut self) {
        let win = window().unwrap();
        let canvas_clone = self.canvas.canvas.clone();
        let size_clone = self.size.clone();
        let value = win.clone();

        // 不要对 closure 进行Dorp!!!
        let resize_closure = Closure::wrap(Box::new(move || {
            // JsValue -> u32
            let width = value.inner_width().unwrap().as_f64().unwrap() as u32;
            let height = value.inner_height().unwrap().as_f64().unwrap() as u32;

            // 更新canvas尺寸
            canvas_clone.set_width(width);
            canvas_clone.set_height(height);
            *size_clone.borrow_mut() = (width, height);

            // 如果屏幕尺寸变化, 打印变化日志
            console_log!("Resized: {} x {}", width, height);
        }) as Box<dyn FnMut()>);

        win.add_event_listener_with_callback("resize", resize_closure.as_ref().unchecked_ref())
            .unwrap();

        resize_closure.forget();
    }
}
