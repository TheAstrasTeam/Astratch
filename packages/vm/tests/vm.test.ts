import { beforeEach, describe, expect, test } from 'vitest';
import { vm } from '../src/index';

describe('VM', () => {
    let testVM: typeof vm;
    beforeEach(() => {
        testVM = vm;
        testVM.createProject({
            name: 'test',
            id: '0',
            author: [],
        });
    });
    describe('目标', () => {
        test('创建目标', () => {
            for (let i = 0; i <= 200; i += 1)
                expect(testVM.getProject!.getTargets.createTarget('entity')).toEqual(
                    expect.any(String),
                );
        });
        test('创建并删除目标', () => {
            const id = testVM.getProject!.getTargets.createTarget('entity');
            expect(id).toEqual(expect.any(String));
            expect(testVM.getProject!.getTargets.removeTarget('entity', id)).toEqual(true);
            expect(testVM.getProject!.getTargets.removeTarget('module', id)).toEqual(false);
        });
        describe('使用自定义元信息', () => {
            test('使用自定义元信息导入目标', () => {
                expect(
                    testVM.getProject!.getTargets.createTarget('entity', {
                        isTemplate: false,
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
                            data: new Map(),
                            custom: {},
                        },
                        name: '',
                        id: 'test!',
                        blocks: {
                            script: {},
                            blocks: { blocks: { languageVersion: 1, blocks: [] } },
                        },
                        parent: null,
                    }),
                ).toEqual('test!');
            });
            test('使用不完整的元信息导入Target', () => {
                expect(
                    // @ts-expect-error 缺失是有意的
                    testVM.getProject!.Targets.createTarget('entity', {
                        id: 'test!',
                    }),
                ).toEqual('test!');
            });
        });
    });
});
