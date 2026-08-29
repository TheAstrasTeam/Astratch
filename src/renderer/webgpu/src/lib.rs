// use parking_lot::Mutex;
use bytemuck;
use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::JsCast;
use wasm_bindgen::JsValue;
use wasm_bindgen::closure::Closure;
use wasm_bindgen::prelude::*;
use web_sys::window;
use wgpu::util::DeviceExt;
pub mod brower_info;
pub mod canvas;
pub use brower_info::*;
pub use canvas::*;

#[macro_export]
macro_rules! console_log {
    ($($t:tt)*) => (web_sys::console::log_1(&format!($($t)*).into()))
}

#[repr(C)]
#[derive(Copy, Clone, Debug)]
struct Vertex {
    position: [f32; 2],
    color: [f32; 4],
}

#[repr(C)]
#[derive(Copy, Clone, Debug)]
struct Triangle(Vertex, Vertex, Vertex);

pub struct WgpuApp {
    canvas: CanvasWebGPU,
    size: Rc<RefCell<(u32, u32)>>,
    surface: wgpu::Surface<'static>,
    device: wgpu::Device,
    queue: wgpu::Queue,
    config: wgpu::SurfaceConfiguration,
    pending_resize: Rc<RefCell<Option<(u32, u32)>>>,
    render_pipeline: wgpu::RenderPipeline,
    triangle_queue: Vec<Triangle>,
}

impl WgpuApp {
    async fn new() -> Self {
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

        // Surface 画布配置
        // type(caps) = wgpu::SurfaceCapabilities
        let caps = surface.get_capabilities(&adapter);
        let surface_format = caps
            .formats
            .iter()
            .find(|f| f.is_srgb())
            .copied()
            .unwrap_or(caps.formats[0]);
        let config = wgpu::SurfaceConfiguration {
            usage: wgpu::TextureUsages::RENDER_ATTACHMENT,
            format: surface_format,
            color_space: wgpu::SurfaceColorSpace::Auto,
            width: width.max(1),
            height: height.max(1),
            present_mode: wgpu::PresentMode::Fifo,
            desired_maximum_frame_latency: 2,
            alpha_mode: caps.alpha_modes[0],
            view_formats: vec![],
        };

        let pending_resize = Rc::new(RefCell::new(Some((width, height))));

        let shader = device.create_shader_module(wgpu::ShaderModuleDescriptor {
            label: Some("Shader"),
            source: wgpu::ShaderSource::Wgsl(include_str!("shader.wgsl").into()),
        });

        let render_pipeline_layout =
            device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
                label: Some("Render Pipeline Layout"),
                bind_group_layouts: &[],
                immediate_size: 0,
            });

        let render_pipeline = device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
            label: Some("Render Pipeline"),
            layout: Some(&render_pipeline_layout),
            vertex: wgpu::VertexState {
                module: &shader,
                compilation_options: Default::default(),
                entry_point: Some("vs_main"),
                buffers: &[Some(wgpu::VertexBufferLayout {
                    array_stride: (2 * 4 + 4 * 4) as u64,
                    step_mode: wgpu::VertexStepMode::Vertex,
                    attributes: &[
                        wgpu::VertexAttribute {
                            offset: 0,
                            shader_location: 0,
                            format: wgpu::VertexFormat::Float32x2,
                        },
                        wgpu::VertexAttribute {
                            offset: 8,
                            shader_location: 1,
                            format: wgpu::VertexFormat::Float32x4,
                        },
                    ],
                })],
            },
            fragment: Some(wgpu::FragmentState {
                module: &shader,
                compilation_options: Default::default(),
                entry_point: Some("fs_main"),
                targets: &[Some(wgpu::ColorTargetState {
                    format: config.format,
                    blend: Some(wgpu::BlendState {
                        color: wgpu::BlendComponent {
                            src_factor: wgpu::BlendFactor::SrcAlpha,
                            dst_factor: wgpu::BlendFactor::OneMinusSrcAlpha,
                            operation: wgpu::BlendOperation::Add,
                        },
                        alpha: wgpu::BlendComponent {
                            src_factor: wgpu::BlendFactor::SrcAlpha,
                            dst_factor: wgpu::BlendFactor::OneMinusSrcAlpha,
                            operation: wgpu::BlendOperation::Add,
                        },
                    }),
                    write_mask: wgpu::ColorWrites::ALL,
                })],
            }),
            primitive: wgpu::PrimitiveState {
                topology: wgpu::PrimitiveTopology::TriangleList,
                strip_index_format: None,
                front_face: wgpu::FrontFace::Ccw,
                cull_mode: None,
                polygon_mode: wgpu::PolygonMode::Fill,
                unclipped_depth: false,
                conservative: false,
            },
            depth_stencil: None,
            multisample: wgpu::MultisampleState {
                count: 1,
                mask: !0,
                alpha_to_coverage_enabled: false,
            },
            multiview_mask: None,
            cache: None,
        });

        let mut app = Self {
            canvas,
            size,
            surface,
            device,
            queue,
            config,
            pending_resize,
            render_pipeline,
            triangle_queue: Vec::new(),
        };
        app.surface.configure(&app.device, &app.config);
        app.setup_resize_handler();
        app
    }

    pub fn setup_resize_handler(&mut self) {
        let win = window().unwrap();
        let canvas_clone = self.canvas.canvas.clone();
        let size_clone = self.size.clone();
        let pending_resize = self.pending_resize.clone();
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

            *pending_resize.borrow_mut() = Some((width, height));

            // 如果屏幕尺寸变化, 打印变化日志
            console_log!("Resized: {} x {}", width, height);
        }) as Box<dyn FnMut()>);

        win.add_event_listener_with_callback("resize", resize_closure.as_ref().unchecked_ref())
            .unwrap();

        resize_closure.forget();
    }

    pub fn redraw(&mut self) {
        todo!();
    }

    pub fn render(&mut self) -> Result<(), JsValue> {
        console_log!("Rendering frame...");
        if let Some((width, height)) = self.pending_resize.borrow_mut().take() {
            self.config.width = width.max(1);
            self.config.height = height.max(1);
            self.surface.configure(&self.device, &self.config);
            console_log!("Surface reconfigured to: {} x {}", width, height);
        };

        let texture = match self.surface.get_current_texture() {
            wgpu::CurrentSurfaceTexture::Success(tx) => tx,
            _ => return Err(JsValue::from_str("Surface get texture timeout")),
        };
        let view = texture
            .texture
            .create_view(&wgpu::TextureViewDescriptor::default());
        let mut encoder = self
            .device
            .create_command_encoder(&wgpu::CommandEncoderDescriptor {
                label: Some("Render Encoder"),
            });

        // ====== 上传顶点数据 ======
        let mut vertex_data: Vec<f32> = Vec::new();
        for tri in &self.triangle_queue {
            //顶点0
            vertex_data.extend_from_slice(&[
                tri.0.position[0],
                tri.0.position[1],
                tri.0.color[0],
                tri.0.color[1],
                tri.0.color[2],
                tri.0.color[3],
            ]);
            //顶点1
            vertex_data.extend_from_slice(&[
                tri.1.position[0],
                tri.1.position[1],
                tri.1.color[0],
                tri.1.color[1],
                tri.1.color[2],
                tri.1.color[3],
            ]);
            //顶点2
            vertex_data.extend_from_slice(&[
                tri.2.position[0],
                tri.2.position[1],
                tri.2.color[0],
                tri.2.color[1],
                tri.2.color[2],
                tri.2.color[3],
            ]);
        }

        // 创建临时顶点缓冲区
        let vertex_buf = self
            .device
            .create_buffer_init(&wgpu::util::BufferInitDescriptor {
                label: Some("Triangle vertex buffer"),
                contents: bytemuck::cast_slice(&vertex_data),
                usage: wgpu::BufferUsages::VERTEX,
            });
        {
            let mut render_pass = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
                label: Some("Render-Pass"),
                color_attachments: &[Some(wgpu::RenderPassColorAttachment {
                    view: &view,
                    resolve_target: None,
                    depth_slice: None,
                    ops: wgpu::Operations {
                        load: wgpu::LoadOp::Clear(wgpu::Color {
                            r: 1.0,
                            g: 1.0,
                            b: 1.0,
                            a: 1.0,
                        }),
                        store: wgpu::StoreOp::Store,
                    },
                })],
                ..Default::default()
            });

            render_pass.set_pipeline(&self.render_pipeline);
            render_pass.set_vertex_buffer(0, vertex_buf.slice(..));
            //每个三角形3个顶点，循环绘制
            let tri_count = self.triangle_queue.len() as u32;
            if tri_count > 0 {
                render_pass.draw(0..tri_count * 3, 0..1);
            }
        }
        self.queue.submit(Some(encoder.finish()));
        Ok(())
    }
}

thread_local! {
    static APP: RefCell<Option<Rc<RefCell<WgpuApp>>>> = RefCell::new(None);
}

#[wasm_bindgen]
pub async fn init_app() -> Result<(), JsValue> {
    let render_init = r#"
  _
 | |
 | |__  _   _
 | '_ \| | | |
 | |_) | |_| |
 |_.__/ \__, | _              _______
     /\  __/ || |            |__   __|
    /  \|___/_| |_ _ __ __ _ ___| | ___  __ _ _ __ ___
   / /\ \ / __| __| '__/ _` / __| |/ _ \/ _` | '_ ` _ \
  / ____ \\__ \ |_| | | (_| \__ \ |  __/ (_| | | | | | |
 /_/    \_\___/\__|_|  \__,_|___/_|\___|\__,_|_| |_| |_|
    "#;
    console_log!("{render_init}");
    let app = WgpuApp::new().await;
    APP.with(|cell| *cell.borrow_mut() = Some(Rc::new(RefCell::new(app))));
    Ok(())
}

#[wasm_bindgen]
pub fn app_render() -> Result<(), JsValue> {
    APP.with(|cell| {
        let opt = cell.borrow();
        match opt.as_ref() {
            Some(rc) => rc.borrow_mut().render(),
            None => Err(JsValue::from_str("WgpuApp not initialized")),
        }
    })
}

#[wasm_bindgen]
pub fn submit_triangles(data: &[f32]) -> Result<(), JsValue> {
    APP.with(|cell| {
        let opt = cell.borrow();
        match opt.as_ref() {
            Some(rc) => {
                let mut app = rc.borrow_mut();
                app.triangle_queue.clear();

                // 每18个数字 = 1个三角形
                for chunk in data.chunks_exact(18) {
                    let tri = Triangle(
                        Vertex {
                            position: [chunk[0], chunk[1]],
                            color: [chunk[2], chunk[3], chunk[4], chunk[5]],
                        },
                        Vertex {
                            position: [chunk[6], chunk[7]],
                            color: [chunk[8], chunk[9], chunk[10], chunk[11]],
                        },
                        Vertex {
                            position: [chunk[12], chunk[13]],
                            color: [chunk[14], chunk[15], chunk[16], chunk[17]],
                        },
                    );
                    app.triangle_queue.push(tri);
                }
                Ok(())
            }
            None => Err(JsValue::from_str("WgpuApp not initialized")),
        }
    })
}

// 清空所有待绘制三角形
#[wasm_bindgen]
pub fn clear_triangles() -> Result<(), JsValue> {
    APP.with(|cell| {
        let opt = cell.borrow();
        if let Some(rc) = opt.as_ref() {
            rc.borrow_mut().triangle_queue.clear();
            Ok(())
        } else {
            Err(JsValue::from_str("WgpuApp not initialized"))
        }
    })
}
