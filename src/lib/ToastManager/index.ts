// 本功能由Ai润色

import type { IToast, IToastManger, IEvent, TToastMode, TToastEvent } from '../../types/lib';

/**
 * 通知管理
 *
 * # 类型语义
 *
 * - info:     普通通知
 * - warn:     警告
 * - error:    错误，永久，直到被点击或程序移除
 * - spinner:  滚动动画，永久，直到程序移除
 * - progress: 进度，需通过 setProgress 更新 progress 值，永久，直到程序移除
 *
 * # 自动消失时长（未显式传 duration 时）
 *
 * - info:     10s
 * - warn:     15s
 * - error:    永久
 * - spinner:  永久
 * - progress: 永久
 *
 * # action 触发时机
 *
 * - interact: 触发 action 并归档
 * - trigger:  仅触发 action，不归档（供历史面板使用）
 * - removeToast / 定时器到期: 不触发 action，仅归档
 *
 * # 归档机制
 *
 * dismiss 时 toast 从 history 移到 archive，仍可通过 getFullHistory 查询。
 */
const DEFAULT_DURATION: Record<TToastMode, number> = {
    info: 10_000,
    warn: 15_000,
    error: Infinity,
    spinner: Infinity,
    progress: Infinity,
};

class toastManager implements IToastManger {
    private history = new Map<string, IToast>();
    private archive = new Map<string, IToast>();
    private events = new Map<string, IEvent>();
    private timers = new Map<string, ReturnType<typeof setTimeout>>();

    create(meta: IToast) {
        // 已存在同 id 通知：先静默移除旧的（含定时器，不归档、不触发 action）
        // history 和 archive 都要清，否则历史面板会出现两条
        if (this.history.has(meta.id)) {
            this.clearTimer(meta.id);
            this.history.delete(meta.id);
        }
        this.archive.delete(meta.id);

        const record: IToast = { ...meta, createdAt: Date.now() };
        this.history.set(meta.id, record);
        this.emit({ type: 'refresh' });
        this.armTimer(record);
        return true;
    }

    getAllHistory() {
        return this.history;
    }

    getFullHistory() {
        return [...Array.from(this.history.values()), ...Array.from(this.archive.values())].sort(
            (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0),
        );
    }

    removeToast(id: string) {
        return this.dismiss(id);
    }

    interact(id: string) {
        const toast = this.history.get(id);
        if (!toast) return false;
        this.runAction(toast);
        return this.dismiss(id);
    }

    trigger(id: string) {
        const toast = this.history.get(id) ?? this.archive.get(id);
        if (!toast) return false;
        this.runAction(toast);
        return true;
    }

    setProgress(id: string, progress: number) {
        const toast = this.history.get(id);
        if (!toast) return false;
        if (toast.type !== 'progress') return false;
        toast.progress = progress;
        this.emit({ type: 'progress', id, progress });
        return true;
    }

    on(id: string, callback: (data: TToastEvent) => void, opts?: { once?: boolean }) {
        this.events.set(id, {
            id,
            callback,
            once: opts?.once,
        });
        return () => {
            this.off(id);
        };
    }

    off(id: string) {
        this.events.delete(id);
    }

    emit(data: TToastEvent = { type: 'refresh' }) {
        this.events.forEach(event => {
            event.callback?.(data);
            if (event.once) this.events.delete(event.id);
        });
    }

    private runAction(toast: IToast) {
        try {
            toast.action?.(true);
        } catch {
            /* swallow */
        }
    }

    private dismiss(id: string) {
        const toast = this.history.get(id);
        if (!toast) return false;
        this.clearTimer(id);
        const archived: IToast = { ...toast, archivedAt: Date.now() };
        this.history.delete(id);
        this.archive.set(id, archived);
        this.emit({ type: 'refresh' });
        return true;
    }

    private armTimer(meta: IToast) {
        const duration = meta.duration ?? DEFAULT_DURATION[meta.type];
        if (!Number.isFinite(duration)) return;
        const timer = setTimeout(() => this.dismiss(meta.id), duration);
        this.timers.set(meta.id, timer);
    }

    private clearTimer(id: string) {
        const timer = this.timers.get(id);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(id);
        }
    }
}

export const Toast = new toastManager();
