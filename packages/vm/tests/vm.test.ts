import { beforeEach, describe, expect, test } from 'vitest';
import { VM } from '../src/index';

describe('VM', () => {
    let vm: VM;
    beforeEach(() => {
        vm = new VM();
    });
    describe('目标', () => {
        test('创建目标', () => {
            for (let i = 0; i <= 200; i += 1)
                expect(vm.runtime.createTarget('entity')).toEqual(expect.any(String));
        });
        test('创建并删除目标', () => {
            const id = vm.runtime.createTarget('entity');
            expect(id).toEqual(expect.any(String));
            expect(vm.runtime.removeTarget('entity', id)).toEqual(true);
            expect(vm.runtime.removeTarget('module', id)).toEqual(false);
        });
        describe('使用自定义元信息', () => {
            test('使用自定义元信息导入目标', () => {
                expect(
                    vm.runtime.createTarget('entity', {
                        workspaceSvg: null,
                        effects: {
                            brightness: 0,
                            color: 0,
                            fisheye: 0,
                            ghost: 0,
                            mosaic: 0,
                            pixelate: 0,
                            whirl: 0,
                            blur: 0,
                        },
                        mixMode: 'normal',
                        position: {
                            x: 0,
                            y: 0,
                        },
                        direction: 0,
                        size: 0,
                        costume: {
                            usingCostume: undefined,
                            isShowText: false,
                            text: '',
                            textColor: '',
                            strokeColor: '',
                            strokeWidth: 0,
                            fontAssetID: '',
                        },
                        clipPath: [],
                        isHidden: false,
                        audio: new Map(),
                        align: 0,
                        tempData: new Map(),
                        linkData: {
                            function: new Map(),
                            cloneTemple: new Map(),
                            data: new Map(),
                            custom: {},
                        },
                        name: '',
                        id: 'test!',
                        blocks: {
                            script: {},
                            blocks: { blocks: { languageVersion: 1, blocks: [] } },
                        },
                    }),
                ).toEqual('test!');
            });
            test('使用不完整的元信息导入Target', () => {
                expect(
                    // @ts-expect-error 缺失是有意的
                    vm.runtime.createTarget('entity', {
                        id: 'test!',
                    }),
                ).toEqual('test!');
            });
        });
    });
});
