import type { IRender } from '../../../types/vm/render';
import type { IVM } from '../../../types/vm/vm';
import { log, sendError } from '../../../utils/debug';

export class Render implements IRender {
    vm: IVM;
    _DOM: HTMLCanvasElement | null;
    webGPUAvailable: boolean;
    gl: WebGL2RenderingContext | WebGLRenderingContext | null;
    selectedRenderer: 'webgl' | 'webgpu';
    constructor(vm: IVM) {
        this.vm = vm;
        this._DOM = null;
        this.webGPUAvailable = !!navigator.gpu;
        this.selectedRenderer = 'webgl';
        this.gl = null;
    }

    setCanvas(DOM: HTMLCanvasElement, needInit = false): void {
        this._DOM = DOM;
        if (needInit) this.initRenderer();
    }

    getCanvas(): HTMLCanvasElement | null {
        return this._DOM;
    }

    initRenderer(): void {
        if (this.webGPUAvailable && this.selectedRenderer === 'webgpu') {
            this.initWebGPURenderer();
            return;
        }
        this.initWebGLRenderer();
    }
    initWebGPURenderer(): void {
        // TODO: webGPU
        return;
    }
    initWebGLRenderer(): void {
        log(this.getCanvas());
        this.gl =
            this.getCanvas()?.getContext('webgl2') ?? this.getCanvas()?.getContext('webgl') ?? null;
        if (!this.gl) {
            sendError({ text: 'vm:render.getWebGLFailed' });
            return;
        }
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }
}
