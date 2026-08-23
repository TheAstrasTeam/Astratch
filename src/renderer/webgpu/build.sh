#!/bin/bash
cargo build --target wasm32-unknown-unknown --release
wasm-bindgen --target web --out-dir ./pkg --out-name renderer target/wasm32-unknown-unknown/release/webgpu.wasm
awk 'NR>3' ./pkg/renderer.d.ts > ./pkg/renderer.d.ts.tmp && mv ./pkg/renderer.d.ts.tmp ./pkg/renderer.d.ts
awk 'NR>3' ./pkg/renderer_bg.wasm.d.ts > ./pkg/renderer_bg.wasm.d.ts.tmp && mv ./pkg/renderer_bg.wasm.d.ts.tmp ./pkg/renderer_bg.wasm.d.ts
