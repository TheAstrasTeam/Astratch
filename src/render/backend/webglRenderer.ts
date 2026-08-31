/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IRenderCommand, IRenderer, IStageBackground, IStageGeometry } from '../types';
import { composeModel, composeView, type Mat4 } from '../matrix';

/**
 * 单位 quad，顶点 0..1。绘制时把中心移到 (-0.5,-0.5) 再按纹理像素尺寸拉伸。
 * 纹理坐标直接取顶点自身坐标，保证不翻转。
 */
const VERTEX_GLSL = `
precision mediump float;
attribute vec2 a_position;
uniform mat4 u_model;
uniform mat4 u_view;
uniform vec2 u_size;
varying vec2 v_uv;
void main() {
    vec2 p = (a_position - 0.5) * u_size;
    v_uv = a_position;
    gl_Position = u_view * u_model * vec4(p, 0.0, 1.0);
}
`;

const FRAGMENT_GLSL = `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_texture;
uniform vec4 u_tint;       // rgb 倍率, a = 不透明度
uniform float u_brightness; // -100..100 加性偏移（归一化）
void main() {
    vec4 c = texture2D(u_texture, v_uv);
    float b = u_brightness / 100.0;
    vec3 rgb = clamp(c.rgb * u_tint.rgb + vec3(b), 0.0, 1.0);
    gl_FragColor = vec4(rgb, c.a * u_tint.a);
}
`;

interface IProgramLocations {
    aPosition: number;
    uModel: WebGLUniformLocation | null;
    uView: WebGLUniformLocation | null;
    uSize: WebGLUniformLocation | null;
    uTexture: WebGLUniformLocation | null;
    uTint: WebGLUniformLocation | null;
    uBrightness: WebGLUniformLocation | null;
}

const NULL_BACKGROUND: IStageBackground = { color: [0, 0, 0, 255] };

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('webgl: 无法创建 shader');
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(shader) ?? '';
        gl.deleteShader(shader);
        throw new Error(`webgl: shader 编译失败 ${log}`);
    }
    return shader;
}

function linkProgram(gl: WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram {
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const log = gl.getProgramInfoLog(program) ?? '';
        gl.deleteProgram(program);
        throw new Error(`webgl: program 链接失败 ${log}`);
    }
    return program;
}

export class WebGLRenderer implements IRenderer {
    readonly backend = 'webgl' as const;

    private gl: WebGLRenderingContext | null = null;
    private program: WebGLProgram | null = null;
    private locations: IProgramLocations | null = null;
    private quadBuffer: WebGLBuffer | null = null;
    private textures = new Map<string, WebGLTexture>();

    private background: IStageBackground = NULL_BACKGROUND;
    private canvasWidth = 1;
    private canvasHeight = 1;
    private viewMatrix: Mat4 | null = null;

    mount(canvas: HTMLCanvasElement, geometry: IStageGeometry, background: IStageBackground): void {
        void geometry; // canvas 尺寸在 render/resize 由 geometry 重算，mount 阶段不需要
        if (this.gl) throw new Error('webgl: renderer 已挂载');
        const gl =
            canvas.getContext('webgl2', { antialias: true, premultipliedAlpha: true }) ??
            canvas.getContext('webgl', { antialias: true, premultipliedAlpha: true });
        if (!gl) throw new Error('webgl: 无法获取 WebGL 上下文');
        this.gl = gl;
        this.background = background;

        this.program = linkProgram(
            gl,
            compileShader(gl, gl.VERTEX_SHADER, VERTEX_GLSL),
            compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_GLSL),
        );
        gl.useProgram(this.program);
        const attr = gl.getAttribLocation(this.program, 'a_position');
        gl.enableVertexAttribArray(attr);
        this.locations = {
            aPosition: attr,
            uModel: gl.getUniformLocation(this.program, 'u_model'),
            uView: gl.getUniformLocation(this.program, 'u_view'),
            uSize: gl.getUniformLocation(this.program, 'u_size'),
            uTexture: gl.getUniformLocation(this.program, 'u_texture'),
            uTint: gl.getUniformLocation(this.program, 'u_tint'),
            uBrightness: gl.getUniformLocation(this.program, 'u_brightness'),
        };

        this.quadBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        // 两个三角形组成 unit quad
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1]),
            gl.STATIC_DRAW,
        );
        gl.vertexAttribPointer(attr, 2, gl.FLOAT, false, 0, 0);

        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        gl.uniform1i(this.locations.uTexture, 0);
        // 立即按加载时的尺寸适配（首次 mount 后由调用方继续 resize）
        this.resizeInternal();
    }

    createTexture(id: string, bitmap: ImageBitmap): unknown {
        if (!this.gl || !this.locations) throw new Error('webgl: renderer 未挂载');
        const gl = this.gl;
        let texture = this.textures.get(id);
        if (!texture) {
            texture = gl.createTexture();
            this.textures.set(id, texture);
        }
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // 舞台 y 向上，quad 顶部(uv.y=1)应对应图片顶部；翻转后 texcoord(0,0)=图片底部
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        // NPOT 友好：不生成 mipmap，wrap 用 CLAMP_TO_EDGE
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return id;
    }

    disposeTexture(id: string): void {
        if (!this.gl) return;
        const texture = this.textures.get(id);
        if (texture) {
            this.gl.deleteTexture(texture);
            this.textures.delete(id);
        }
    }

    render(commands: readonly IRenderCommand[], geometry: IStageGeometry): void {
        const gl = this.gl;
        const loc = this.locations;
        if (!gl || !loc || !this.program) throw new Error('webgl: renderer 未挂载');
        // 几何/尺寸变化后重算视口矩阵
        this.viewMatrix = composeView(
            this.canvasWidth,
            this.canvasHeight,
            geometry.width,
            geometry.height,
        );
        this.resizeInternal();

        gl.useProgram(this.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        gl.vertexAttribPointer(loc.aPosition, 2, gl.FLOAT, false, 0, 0);

        const [br, bg, bb, ba] = this.background.color;
        gl.clearColor(br / 255, bg / 255, bb / 255, ba / 255);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.activeTexture(gl.TEXTURE0);
        gl.uniformMatrix4fv(
            loc.uView,
            false,
            this.viewMatrix as NonNullable<typeof this.viewMatrix>,
        );

        for (const command of commands) {
            const texture = this.textures.get(command.textureId);
            if (!texture) continue; // 纹理未就绪，跳过本帧
            gl.bindTexture(gl.TEXTURE_2D, texture);
            const model = composeModel(command.x, command.y, command.rotation, command.scale);
            gl.uniformMatrix4fv(loc.uModel, false, model);
            gl.uniform2f(loc.uSize, command.width, command.height);
            gl.uniform4f(loc.uTint, 1, 1, 1, command.alpha);
            gl.uniform1f(loc.uBrightness, command.brightness);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
    }

    private resizeInternal(): void {
        const gl = this.gl;
        if (!gl) return;
        const host = gl.canvas as HTMLCanvasElement;
        const dpr = window.devicePixelRatio || 1;
        const cssWidth = Math.max(1, host.clientWidth || host.width);
        const cssHeight = Math.max(1, host.clientHeight || host.height);
        if (
            host.width !== Math.round(cssWidth * dpr) ||
            host.height !== Math.round(cssHeight * dpr)
        ) {
            host.width = Math.round(cssWidth * dpr);
            host.height = Math.round(cssHeight * dpr);
        }
        this.canvasWidth = host.width;
        this.canvasHeight = host.height;
        gl.viewport(0, 0, host.width, host.height);
    }

    resize(): void {
        this.resizeInternal();
    }

    dispose(): void {
        const gl = this.gl;
        if (!gl) return;
        for (const texture of this.textures.values()) gl.deleteTexture(texture);
        this.textures.clear();
        if (this.quadBuffer) gl.deleteBuffer(this.quadBuffer);
        if (this.program) gl.deleteProgram(this.program);
        this.gl = null;
        this.program = null;
        this.locations = null;
        this.quadBuffer = null;
        this.viewMatrix = null;
    }
}
