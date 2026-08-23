use wasm_bindgen::JsValue;
use web_sys::HtmlCanvasElement;
use web_sys::wasm_bindgen::JsCast;
use web_sys::window;

pub type Canvas = web_sys::HtmlCanvasElement;

pub struct CanvasWebGPU {
    pub canvas: Canvas,
}

impl CanvasWebGPU {
    pub fn new(size: (u32, u32)) -> Result<Self, JsValue> {
        let win = window().ok_or_else(|| JsValue::from_str("Window not available"))?;

        let doc = win
            .document()
            .ok_or_else(|| JsValue::from_str("Document not available"))?;

        let canvas = doc
            .create_element("canvas")
            .map_err(|_| JsValue::from_str("Failed to create canvas"))?
            .dyn_into::<HtmlCanvasElement>()
            .map_err(|_| JsValue::from_str("Failed to convert to HtmlCanvasElement"))?;

        canvas.set_width(size.0);
        canvas.set_height(size.1);

        let body = doc
            .body()
            .ok_or_else(|| JsValue::from_str("Body not available"))?;
        body.append_child(&canvas)
            .map_err(|_| JsValue::from_str("Failed to append canvas"))?;

        let style = canvas.style();
        style.set_property("display", "block")?;
        style.set_property("margin", "0 auto")?;
        
        style.set_property("background", "#66ccff")?;

        Ok(Self { canvas })
    }

    pub fn size(&self) -> (u32, u32) {
        let width = self.canvas.width();
        let height = self.canvas.height();
        (width, height)
    }
}
