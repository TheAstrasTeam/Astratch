/*
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
*/


#![no_main]

use wasm_bindgen::prelude::*;

macro_rules! console_log {
    ($($t:tt)*) => {
        web_sys::console::log_1(&format!($($t)*).into())
    }
}

struct WgpuApp {
    surface: wgpu::Surface<'static>,
    device: wgpu::Device,
    queue: wgpu::Queue,
    config: wgpu::SurfaceConfiguration,
}



#[wasm_bindgen(start)]
pub fn run() {
    let oobe = r#"
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
    console_log!("{oobe}");
}
