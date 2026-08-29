use wasm_bindgen::JsValue;
use web_sys::window;

// 获取web窗口尺寸
pub fn get_screen_size() -> Result<(u32, u32), JsValue> {
    let _window = window().ok_or_else(|| JsValue::from_str("No window"))?;

    let width = _window
        .inner_width()
        .map_err(|_| JsValue::from_str("Failed to get screen width"))?
        .as_f64()
        .ok_or_else(|| JsValue::from_str("Screen width is not a number"))? as u32;

    let height = _window
        .inner_height()
        .map_err(|_| JsValue::from_str("Failed to get screen height"))?
        .as_f64()
        .ok_or_else(|| JsValue::from_str("Screen height is not a number"))? as u32;
    Ok((width, height))
}
