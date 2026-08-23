/*
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
*/

#![no_main]

use wasm_bindgen::prelude::*;
use webgpu::*;

#[wasm_bindgen(start)]
pub fn run() {
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
    console_log!("Init canvas");
    let (width, height) = get_screen_size().unwrap();
    let canvas = CanvasWebGPU::new((width, height)).unwrap();
    console_log!("Canvas init done, size: {} x {}.", width, height);
}
