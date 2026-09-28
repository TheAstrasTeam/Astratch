import { describe, expect, test } from 'vitest';
import { DB } from '../src/lib/DBManager';

describe('IndexedDB', () => {
    test('输入输出数据', async () => {
        const testData: Record<string, unknown> = {};
        // 数字
        for (let i = 0; i <= 30; i++) {
            testData[crypto.randomUUID()] = Math.random();
        }
        // 字符串
        for (let i = 0; i <= 30; i++) {
            testData[crypto.randomUUID()] = crypto.randomUUID();
        }
        // 对象
        for (let i = 0; i <= 30; i++) {
            testData[crypto.randomUUID()] = { a: crypto.randomUUID() };
        }
        // Map
        for (let i = 0; i <= 30; i++) {
            testData[crypto.randomUUID()] = new Map().set('a', 'hello');
        }
        for (const [id, data] of Object.entries(testData)) {
            await DB.setData(id, data);
            expect(await DB.getData(id)).toEqual(data);
        }
    });
    test('删除数据', async () => {
        for (let i = 0; i <= 30; i++) {
            const id = crypto.randomUUID();
            const data = Math.random();
            await DB.setData(id, data);
            expect(await DB.getData(id)).toEqual(data);
            await DB.deleteData(id);
            expect(await DB.getData(id)).toEqual(undefined);
        }
    });
});
