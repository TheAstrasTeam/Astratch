#!/bin/bash
cargo build --target wasm32-unknown-unknown --release
wasm-bindgen --target web --out-dir ./test --out-name wasm target/wasm32-unknown-unknown/release/webgpu.wasm
awk 'NR>3' ./test/wasm.d.ts > ./test/wasm.d.ts.tmp && mv ./test/wasm.d.ts.tmp ./test/wasm.d.ts
awk 'NR>3' ./test/wasm_bg.wasm.d.ts > ./test/wasm_bg.wasm.d.ts.tmp && mv ./test/wasm_bg.wasm.d.ts.tmp ./test/wasm_bg.wasm.d.ts
