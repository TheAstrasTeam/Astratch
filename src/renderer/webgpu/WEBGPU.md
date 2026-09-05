环境准备

```bash
rustup target add wasm32-unknown-unknown
cargo install -f wasm-bindgen-cli
```

构建
Linux/macOS

```bash
./build.sh
```

Windows

```powershell
.\build.ps1
```

开启调试服务器

Linux/macOS

```bash
cd src/renderer/webgpu
python3 -m http.server 8080
```

Windows

```powershell
cd src\renderer\webgpu
python -m http.server 8080
```
