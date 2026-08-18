#!/bin/bash
cargo build --target wasm32-unknown-unknown --release
wasm-bindgen --target web --out-dir ./test --out-name wasm target/wasm32-unknown-unknown/release/webgpu.wasm
awk 'NR>3' ./test/wasm.d.ts > ./test/wasm.d.ts.tmp && mv ./test/wasm.d.ts.tmp ./test/wasm.d.ts
