struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
};

@vertex
fn vs_main(@builtin(vertex_index) idx: u32) -> VertexOutput {
    // 定义矩形四个顶点（三角形条带顺序：左下、右上、左上、右下）
    let positions = array(
        vec2(-0.5, -0.5), // 0
                          vec2( 0.5,  0.5), // 1
                          vec2(-0.5,  0.5), // 2
                          vec2( 0.5, -0.5), // 3
    );
    let colors = array(
        vec4(1.0, 0.0, 0.0, 1.0), // 红
                       vec4(0.0, 1.0, 0.0, 1.0), // 绿
                       vec4(0.0, 0.0, 1.0, 1.0), // 蓝
                       vec4(1.0, 1.0, 0.0, 1.0), // 黄
    );
    let pos = positions[idx];
    var output: VertexOutput;
    output.position = vec4(pos, 0.0, 1.0);
    output.color = colors[idx];
    return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
    return input.color; // 显示插值后的颜色（每个顶点不同颜色）
}
