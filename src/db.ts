import { IDBConfig, IDBStoreConfig, IPostponedByIdRequest, TPostponedAddValueRequest, TStoreKeys } from "./types";
import { error, info, warn } from "./utils";

// @TODO build by rollup
// @TODO yarn2 pnp
// @TODO types linting
class IndexDBController<Stores> {
    private request: IDBOpenDBRequest | null = null;
    private db: IDBDatabase | null = null;
    private readonly storesConfig: Array<IDBStoreConfig>;
    private readonly onUpdateNeededCb?: IDBConfig["onUpdateNeeded"];
    private readonly addStack: Array<TPostponedAddValueRequest<Stores>> = [];
    private readonly findStack: Array<IPostponedByIdRequest<Stores>> = [];

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

    private processStacksOnConnect() {
        this.addStack.forEach((postponedRequest) => {
            this.processAddedValue(postponedRequest);
        });

        this.findStack.forEach((request) => this.processGettingValue(request));
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

    private getStore(store: TStoreKeys<Stores>, mode?: IDBTransactionMode) {
        if (this.db) {
            const transaction = this.db.transaction(store, mode);
            return transaction.objectStore(store);
        } else {
            throw new Error("Index DB is not connected");
        }
    }

    private processAddedValue(postponedRequest: TPostponedAddValueRequest<Stores>) {
        try {
            const objectStore = this.getStore(postponedRequest.store, "readwrite");
            const request = objectStore.add(postponedRequest.value);

            request.onsuccess = () => postponedRequest.resolve(request.result);
            request.onerror = postponedRequest.reject;
        } catch (e) {
            postponedRequest.reject(e);
            error(e);
        }
    }

    private processGettingValue(postponedRequest: IPostponedByIdRequest<Stores>) {
        try {
            const objectStore = this.getStore(postponedRequest.store, "readonly");
            const request = objectStore.get(postponedRequest.id);

            request.onsuccess = () => postponedRequest.resolve(request.result);
            request.onerror = postponedRequest.reject;
        } catch (e) {
            postponedRequest.reject(e);
            error(e);
        }
    }

    public addValue<K extends TStoreKeys<Stores>>(store: K, value: Stores[K]) {
        return new Promise((resolve, reject) => {
            if (this.db) {
                return this.processAddedValue({
                    store,
                    value,
                    resolve,
                    reject,
                });
            }

            this.addStack.push({ store, value, resolve, reject });
        });
    }

    // public getById<K extends TStoreKeys<Stores>>(store: K, id: number): Promise<Stores[K] | undefined> {
    public getById<K extends TStoreKeys<Stores>>(store: K, id: number) {
        // const a: boolean = 4;
        //
        // return { a, store, id };
        return new Promise((resolve, reject) => {
            if (this.db) {
                return this.processGettingValue({ store, id, resolve, reject });
            }

            this.findStack.push({ store, id, resolve, reject });
        });
    }
}

export { IndexDBController };
