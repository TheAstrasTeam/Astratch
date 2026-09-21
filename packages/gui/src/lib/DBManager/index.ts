const DB_ID = 'astratch-db' as const;
const STORE_ID = 'astratch' as const;

interface IDBManager {
    DB: IDBDatabase;
    getData(key: string): Promise<unknown | undefined>;
    setData(key: string, data: unknown): Promise<void>;
    deleteData(key: string): Promise<void>;
}

class DBManager implements IDBManager {
    DB!: IDBDatabase;

    async init(): Promise<void> {
        this.DB = await new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(DB_ID, 1);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
            request.onupgradeneeded = event => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_ID)) {
                    db.createObjectStore(STORE_ID);
                }
            };
        });
    }

    async getData(key: string): Promise<unknown | undefined> {
        return new Promise((resolve, reject) => {
            const transaction = this.DB.transaction(STORE_ID, 'readonly');
            const request = transaction.objectStore(STORE_ID).get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async setData(key: string, data: unknown): Promise<void> {
        return new Promise((resolve, reject) => {
            const transaction = this.DB.transaction(STORE_ID, 'readwrite');
            const request = transaction.objectStore(STORE_ID).put(data, key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async deleteData(key: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const transaction = this.DB.transaction(STORE_ID, 'readwrite');
            const request = transaction.objectStore(STORE_ID).delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

const DB = new DBManager();
await DB.init();
export { DB };
