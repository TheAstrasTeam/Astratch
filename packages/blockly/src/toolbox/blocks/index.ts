import { initAssetBlocks } from './asset';
import { initAudioBlocks } from './audio';
import { initBranchBlocks } from './branch';
import { initDataBlocks } from './data';
import { initEntityBlocks } from './entity';
import { initEventBlocks } from './event';
import { initFlowBlocks } from './flow';
import { initFunctionBlocks } from './function';
import { initMathBlocks } from './math';
import { initRenderBlocks } from './render';
import { initSensingBlocks } from './sensing';

export const initBlocks = () => {
    initAssetBlocks();
    initEntityBlocks();
    initRenderBlocks();
    initAudioBlocks();
    initEventBlocks();
    initFlowBlocks();
    initBranchBlocks();
    initSensingBlocks();
    initMathBlocks();
    initDataBlocks();
    initFunctionBlocks();
};
