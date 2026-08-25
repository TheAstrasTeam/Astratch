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

        body.set_attribute("style", "margin: 0; padding: 0; overflow: hidden;")?;

        canvas.set_attribute(
            "style",
            "display: block; \
            position: fixed; \
            top: 0; \
            left: 0; \
            margin: 0; \
            padding: 0; \
            background: #66ccff;",
        )?;
        Ok(Self { canvas })
    }

    pub fn size(&self) -> (u32, u32) {
        let width = self.canvas.width();
        let height = self.canvas.height();
        (width, height)
    }

    pub fn resize(&self, width: u32, height: u32) -> Result<(), JsValue> {
        self.canvas.set_width(width);
        self.canvas.set_height(height);
        Ok(())
    }
}
