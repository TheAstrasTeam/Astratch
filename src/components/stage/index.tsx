/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IVM, ITarget } from '../../types/vm/vm';
import { events } from '../../types/vm/vm';
import type { IAsset } from '../../types/vm/assets';
import { useEffect, useRef, useState } from 'react';
import { createRenderer } from '../../render';
import type { IRenderCommand, IRenderer } from '../../render/types';
import { decodeImageBitmap } from '../../render/decodeImage';
import styles from './index.module.scss';

/**
 * 舞台逻辑坐标。原点居中，y 向上（Scratch 舞台规格）。
 */
const STAGE_GEOMETRY = { width: 480, height: 360 } as const;

interface ISpriteState {
    assetId: string;
    bitmap: ImageBitmap;
    width: number;
    height: number;
}

/**
 * 舞台面板：用统一的渲染器接口把项目的实体（entity）画到 canvas 上。
 *
 * - 渲染器由 {@link createRenderer} 创建（WebGPU 优先，自动降级 WebGL）。
 * - 每个实体的"造型"取自当前项目的图片资源（按 `currentCostume` 从图片列表
 *   取模选中），表现为可替换的纹理；将来接入造型系统后只需替换这里的映射。
 * - 没有执行引擎时场景是静态的，故采用"状态变更时按需重绘"，不常驻 rAF。
 */
const StageView = ({ vm }: { vm: IVM }): React.ReactNode => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<IRenderer | null>(null);
    const spriteRef = useRef<Map<string, ISpriteState>>(new Map());
    const decodingRef = useRef<Set<string>>(new Set());
    const rafRef = useRef(0);
    const [backend, setBackend] = useState<string | null>(null);
    const [hasSprite, setHasSprite] = useState(true);

    const scheduleRender = () => {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = window.requestAnimationFrame(() => {
            const renderer = rendererRef.current;
            if (!renderer) return;
            const sprites = spriteRef.current;
            const imageAssets = vm.runtime.assets.listAssets().filter(a => a.type === 'image');
            setHasSprite(imageAssets.length > 0);

            const commands: IRenderCommand[] = [];
            for (const target of vm.runtime.targets.values()) {
                if (target.mode !== 'entity') continue;
                const sprite = getSprite(target, imageAssets, sprites);
                if (!sprite) continue;
                commands.push({
                    id: target.id,
                    textureId: sprite.assetId,
                    x: target.x ?? 0,
                    y: target.y ?? 0,
                    // Scratch 方向：0=上、90=右、顺时针。默认 90 朝右。
                    rotation: -(((target.direction ?? 90) - 90) * Math.PI) / 180,
                    scale: (target.size ?? 100) / 100,
                    width: sprite.width,
                    height: sprite.height,
                    alpha: 1 - (target.effects?.ghost ?? 0) / 100,
                    brightness: target.effects?.brightness ?? 0,
                });
            }
            renderer.render(commands, STAGE_GEOMETRY);
        });
    };

    // 取出实体当前应绘制的造型位图；首次出现时异步解码并上传纹理后触发重绘。
    const getSprite = (
        target: ITarget,
        imageAssets: IAsset[],
        sprites: Map<string, ISpriteState>,
    ): ISpriteState | null => {
        if (imageAssets.length === 0) return null;
        const asset = imageAssets[(target.currentCostume ?? 0) % imageAssets.length];
        const cached = sprites.get(asset.id);
        if (cached) return cached;
        if (decodingRef.current.has(asset.id)) return null; // 已在解码中，跳过

        decodingRef.current.add(asset.id);
        void decodeImageBitmap(asset.blob, asset.mimeType)
            .then(bitmap => {
                decodingRef.current.delete(asset.id);
                sprites.set(asset.id, {
                    assetId: asset.id,
                    bitmap,
                    width: bitmap.width,
                    height: bitmap.height,
                });
                rendererRef.current?.createTexture(asset.id, bitmap);
                scheduleRender();
            })
            .catch(() => {
                decodingRef.current.delete(asset.id);
            });
        return null;
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;
        let disposed = false;

        void createRenderer(canvas).then(renderer => {
            if (disposed) {
                renderer?.dispose();
                return;
            }
            if (!renderer) {
                setBackend(null);
                return;
            }
            rendererRef.current = renderer;
            renderer.mount(canvas, STAGE_GEOMETRY, { color: [255, 255, 255, 255] });
            setBackend(renderer.backend);
            scheduleRender();
        });

        const schedule = () => {
            scheduleRender();
        };
        vm.on(events.UPDATE_TARGET_STRUCTURE, schedule);
        vm.on(events.CREATE_PROJECT, schedule);
        vm.on(events.SWITCH_TARGET, schedule);
        vm.on(events.LOAD_ASSET, schedule);
        vm.on(events.REMOVE_ASSET, schedule);

        const resizeObserver = new ResizeObserver(() => {
            rendererRef.current?.resize();
            scheduleRender();
        });
        resizeObserver.observe(container);

        return () => {
            disposed = true;
            window.cancelAnimationFrame(rafRef.current);
            resizeObserver.disconnect();
            vm.off(events.UPDATE_TARGET_STRUCTURE, schedule);
            vm.off(events.CREATE_PROJECT, schedule);
            vm.off(events.SWITCH_TARGET, schedule);
            vm.off(events.LOAD_ASSET, schedule);
            vm.off(events.REMOVE_ASSET, schedule);
            rendererRef.current?.dispose();
            rendererRef.current = null;
            // 清理时读 ref 当前值是正确的：关闭此刻仍存活的所有位图
            // eslint-disable-next-line react-hooks/exhaustive-deps
            for (const sprite of spriteRef.current.values()) sprite.bitmap.close();
            spriteRef.current.clear();
        };
        // scheduleRender/getSprite 每次渲染都是新闭包，这里只需依赖 vm
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vm]);

    return (
        <div ref={containerRef} className={styles.root}>
            <canvas ref={canvasRef} className={styles.canvas} />
            {backend === null ? (
                <div className={styles.hint}>{'渲染器不可用（需要 WebGPU 或 WebGL）'}</div>
            ) : (
                <>
                    <span className={`${styles.badge} ${styles[backend]}`}>{backend}</span>
                    {!hasSprite && (
                        <div className={styles.hint}>{'暂无精灵· 请先添加图片资源'}</div>
                    )}
                </>
            )}
        </div>
    );
};

export default StageView;
