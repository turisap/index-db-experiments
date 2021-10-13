import {
    IDBConfig,
    IDBStoreConfig,
    TPostponedAddValueRequest,
    TPostponedByIdRequest,
    TPostponedGetAllRequest,
    TStoreKeys,
    TStoreValue,
} from "./types";
import { error, info, warn } from "./utils";

// @TODO build by rollup
// @TODO yarn2 pnp
class IndexDBController<Stores> {
    private request: IDBOpenDBRequest | null = null;
    private db: IDBDatabase | null = null;
    private readonly storesConfig: Array<IDBStoreConfig>;
    private readonly onUpdateNeededCb?: IDBConfig["onUpdateNeeded"];
    private readonly addStack: Array<TPostponedAddValueRequest<any, Stores>> = [];
    private readonly findStack: Array<TPostponedByIdRequest<any, Stores>> = [];
    private readonly getAllStack: Array<TPostponedGetAllRequest<any, Stores>> = [];

    public error?: string;

    constructor(config: IDBConfig) {
        this.init(config);

        this.onUpdateNeededCb = config.onUpdateNeeded;
        this.storesConfig = config.stores;
    }

    private init(config: IDBConfig) {
        if (!window.indexedDB) {
            error("You browser does not support IndexDB");
        }

        this.connect(config);
    }

    private static onVersionChange() {
        warn("changing DB version");
    }

    private connect(config: IDBConfig) {
        this.request = window.indexedDB.open(config.dbName, config.version);

        this.request.onsuccess = this.onConnectSuccess.bind(this);
        this.request.onerror = this.onConnectError.bind(this);
        this.request.onupgradeneeded = this.onUpgradeNeeded.bind(this);
    }

    private onConnectError(event: Event) {
        this.error = (event.target as IDBOpenDBRequest)?.error?.message;

        error("Error connecting to db");
        error(this.error);
    }

    private onConnectSuccess(event: Event) {
        this.db = (event.target as IDBOpenDBRequest)?.result;

        this.db.onversionchange = IndexDBController.onVersionChange;

        info(`successfully connected to ${this.db.name}`);

        this.processStacksOnConnect();
    }

    // @TODO convert to a stack -> cb pair
    private processStacksOnConnect() {
        this.addStack.forEach(this.processAddedValue.bind(this));
        this.findStack.forEach(this.processGettingValue.bind(this));
        this.getAllStack.forEach(this.processGetAllValues.bind(this));
    }

    private onUpgradeNeeded(event: Event) {
        warn("db upgrade needed");
        this.onUpdateNeededCb?.();

        this.db = (event.target as IDBOpenDBRequest)?.result;

        const newStoresNames = this.storesConfig.map((store) => store.name);

        this.storesConfig.forEach((config) => {
            if (this.db && !this.db.objectStoreNames.contains(config.name)) {
                this.db.createObjectStore(config.name, config.params);
            }
        });

        Array.from(this.db.objectStoreNames).forEach((name) => {
            if (this.db && !newStoresNames.includes(name)) {
                this.db.deleteObjectStore(name);
            }
        });
    }

    private getStore<StoreName extends TStoreKeys<Stores>>(store: StoreName, mode?: IDBTransactionMode) {
        if (this.db) {
            const transaction = this.db.transaction(store, mode);

            return transaction.objectStore(store);
        } else {
            throw new Error("Index DB is not connected");
        }
    }

    // @TODO@ all these three functions are very similar. it might need to be refactored
    private processAddedValue<StoreName extends TStoreKeys<Stores>>(postponedRequest: TPostponedAddValueRequest<StoreName, Stores>) {
        try {
            const objectStore = this.getStore(postponedRequest.store, "readwrite");
            const request = objectStore.add(postponedRequest.value);

            request.onsuccess = () => postponedRequest.resolve(Number(request.result));
            request.onerror = postponedRequest.reject;
        } catch (e) {
            postponedRequest.reject(e);
            error(e);
        }
    }

    private processGettingValue<StoreName extends TStoreKeys<Stores>>(postponedRequest: TPostponedByIdRequest<StoreName, Stores>) {
        try {
            const objectStore = this.getStore<StoreName>(postponedRequest.store, "readonly");
            const request = objectStore.get(postponedRequest.id);

            request.onsuccess = () => postponedRequest.resolve(request.result);
            request.onerror = postponedRequest.reject;
        } catch (e) {
            postponedRequest.reject(e);
            error(e);
        }
    }

    private processGetAllValues<StoreName extends TStoreKeys<Stores>>(postponedRequest: TPostponedGetAllRequest<StoreName, Stores>) {
        try {
            const objectStore = this.getStore<StoreName>(postponedRequest.store, "readonly");
            const request = objectStore.getAll(postponedRequest.range);

            request.onsuccess = () => postponedRequest.resolve(request.result);
            request.onerror = postponedRequest.reject;
        } catch (e) {
            postponedRequest.reject(e);
            error(e);
        }
    }

    // @TODO these three are also kind of the same
    public addValue<StoreName extends TStoreKeys<Stores>>(store: StoreName, value: TStoreValue<StoreName, Stores>): Promise<number> {
        return new Promise((resolve, reject) => {
            const requestPayload = { store, value, resolve, reject };

            if (this.db) {
                return this.processAddedValue<StoreName>(requestPayload);
            }

            this.addStack.push(requestPayload);
        });
    }

    public getById<StoreName extends TStoreKeys<Stores>>(store: StoreName, id: number): Promise<Stores[StoreName]> {
        return new Promise((resolve, reject) => {
            const requestPayload = { store, id, resolve, reject };

            if (this.db) {
                return this.processGettingValue<StoreName>(requestPayload);
            }

            this.findStack.push(requestPayload);
        });
    }

    public getAllValues<StoreName extends TStoreKeys<Stores>>(store: StoreName, range?: IDBKeyRange): Promise<Array<Stores[StoreName]>> {
        return new Promise((resolve, reject) => {
            const requestPayload = { store, range, resolve, reject };

            if (this.db) {
                return this.processGetAllValues<StoreName>(requestPayload);
            }

            this.getAllStack.push(requestPayload);
        });
    }
}

export { IndexDBController };
