import { IDBConfig, IDBStoreConfig } from "./types";
import { error, info, warn } from "./utils";

// @TODO build by rollup
// @TODO typings
// @TODO add generic stores
class IndexDBController {
    private request: IDBOpenDBRequest | null = null;
    private db: IDBDatabase | null;
    private readonly storesConfig: Array<IDBStoreConfig>;
    // use cb instead
    private readonly onAddValueSuccessCb?: IDBConfig["onAddValueSuccess"];
    private readonly onUpdateNeededCb?: IDBConfig["onUpdateNeeded"];
    private readonly onAddValueFailCb?: IDBConfig["onAddValueFail"];
    private readonly addStack: Array<any> = [];
    private readonly findStack: Array<any> = [];

    public error?: string;

    constructor(config: IDBConfig) {
        this.init(config);

        this.onAddValueSuccessCb = config.onAddValueSuccess;
        this.onUpdateNeededCb = config.onUpdateNeeded;
        this.onAddValueFailCb = config.onAddValueFail;
        this.storesConfig = config.stores;
    }

    private init(config: IDBConfig) {
        if (!window.indexedDB) {
            error("You browser does not support IndexDB");
        }

        this.connect(config);
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

        // get and write all values if operations on the db started before connection
        this.addStack.forEach(({ store, value }) =>
            this.processAddedValue(store, value),
        );

        this.findStack.forEach(({ store, id }) =>
            this.processGettingValue(store, id),
        );
    }

    private onUpgradeNeeded(event: Event) {
        warn("db upgrade needed");
        this.onUpdateNeededCb?.();

        this.db = (event.target as IDBOpenDBRequest)?.result;

        if (this.db) {
            const newStoresNames = this.storesConfig.map((store) => store.name);

            this.storesConfig.forEach((config) => {
                if (!this.db.objectStoreNames.contains(config.name)) {
                    this.db.createObjectStore(config.name, config.params);
                }
            });

            Array.from(this.db.objectStoreNames).forEach((name) => {
                if (!newStoresNames.includes(name)) {
                    this.db.deleteObjectStore(name);
                }
            });
        }
    }

    private static onVersionChange() {
        warn("changing DB version");
    }

    private onAddValueSuccess(value: any) {
        info("value added to the db");
        this.onAddValueSuccessCb?.(value);
    }

    private onAddValueFail(event) {
        this.onAddValueFailCb(event);
        error("Error adding to db", event);
    }

    private getStore(store: string, mode?: IDBTransactionMode) {
        const transaction = this.db.transaction(store, mode);
        const objectStore = transaction.objectStore(store);

        return objectStore;
    }

    private processAddedValue(store: string, value: any) {
        try {
            const objectStore = this.getStore(store, "readwrite");
            const request = objectStore.add(value);

            request.onsuccess = this.onAddValueSuccess.bind(this, value);
            request.onerror = this.onAddValueFail.bind(this);
        } catch (e) {
            error(e);
        }
    }

    private processGettingValue(store: string, id: number) {
        try {
            const objectStore = this.getStore(store, "readonly");
            const request = objectStore.get(id);

            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = reject;
            });
        } catch (e) {
            error(e);
        }
    }

    public addValue(store: string, value: any) {
        if (this.db) {
            return this.processAddedValue(store, value);
        }

        this.addStack.push({ store, value });
    }

    public getById(store: string, id: number) {
        if (this.db) {
            return this.processGettingValue(store, id);
        }

        this.findStack.push(store, id);
    }
}

export { IndexDBController };
