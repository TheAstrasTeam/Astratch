import vm from 'astratch-vm?sharedworker';
import * as Comlink from 'comlink';
import type { VM } from 'astratch-vm';
import { isChildWindow } from '../utils/window';

/**
 * @author AI
 * @checked
 */
type AsyncRemote<T> = T extends null | undefined
    ? T
    : T extends (...args: infer TArgs) => infer TReturn
      ? (...args: TArgs) => Promise<AsyncRemoteResult<Awaited<TReturn>>>
      : T extends object
        ? { [K in keyof T]: AsyncRemote<T[K]> }
        : Promise<T>;
type AsyncRemoteResult<T> = T extends Comlink.ProxyMarked ? AsyncRemote<T> : T;

const asyncVM = <T>(remote: Comlink.Remote<T>): AsyncRemote<T> =>
    remote as unknown as AsyncRemote<T>;

const vmProxy = asyncVM(Comlink.wrap<VM>(new vm().port));

if (!isChildWindow) {
    /* Test */
    await vmProxy.createProject({
        name: 'test',
        id: '0',
        author: [],
    });
    let path: string | null = null;
    for (let i = 0; i <= 20; i++) {
        path = await vmProxy.getProject!.getTargets.getPath.entities.addPath({
            name: crypto.randomUUID(),
            parent: path,
        });
        for (let j = 0; j <= 5; j++) {
            const target = await vmProxy.getProject!.getTargets.createTarget('entity', {
                parent: path,
            });
            await vmProxy.getProject!.getTargets.renameTarget(
                'entity',
                target,
                crypto.randomUUID(),
            );
        }
    }
}
export { asyncVM as proxyVM, type AsyncRemote, vmProxy as vm };
