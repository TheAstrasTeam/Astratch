struct Vertex {
    @location(0) pos : vec2f,
    @location(1) color : vec4f,
};

struct VertexOutput {
    @builtin(position) clip_position : vec4f,
    @location(0) out_color : vec4f,
};

@vertex
fn vs_main(v:Vertex) -> VertexOutput {
    var out:VertexOutput;
    out.clip_position = vec4f(v.pos,0.0,1.0);
    out.out_color = v.color;
    return out;
}

@fragment
fn fs_main(in:VertexOutput) -> @location(0) vec4f {
    return in.out_color;
}
