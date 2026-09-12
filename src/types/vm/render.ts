import type { IVM } from './vm';

export interface IRender {
    vm: IVM;
    _DOM: HTMLCanvasElement | null;
    gl: WebGL2RenderingContext | WebGLRenderingContext | null;
    webGPUAvailable: boolean;
    selectedRenderer: 'webgl' | 'webgpu';
    getCanvas(): HTMLCanvasElement | null;
    setCanvas(DOM: HTMLCanvasElement, needInit?: boolean): void;

    /** 初始化渲染器 */
    initRenderer(): void;
    initWebGPURenderer(): void;
    initWebGLRenderer(): void;
}
