#!/bin/bash
cargo build --target wasm32-unknown-unknown --release
wasm-bindgen --target web --out-dir ./test --out-name wasm target/wasm32-unknown-unknown/release/webgpu.wasm
