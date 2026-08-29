cargo build --lib --release --target wasm32-unknown-unknown
wasm-bindgen --target web --out-dir ./pkg --out-name renderer target/wasm32-unknown-unknown/release/webgpu.wasm
if (Test-Path ./pkg/renderer.d.ts) {
    $content = Get-Content ./pkg/renderer.d.ts
    if ($content.Count -gt 3) {
        $content[3..($content.Count - 1)] | Set-Content ./pkg/renderer.d.ts
    }
}