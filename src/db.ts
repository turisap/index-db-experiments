import { IDBConfig, IDBStoreConfig } from "./types";
import { error, info, warn } from "./utils";

// @TODO build by rollup
// @TODO linting
// @TODO typings
// @TODO add generic stores
class IndexDBController {
    private request: IDBOpenDBRequest | null = null;
    private storesConfig: Array<IDBStoreConfig>;
    private db: IDBDatabase | null;
    private onAddValueSuccessCb?: IDBConfig["onAddValueSuccess"];
    private onUpdateNeededCb?: IDBConfig["onUpdateNeeded"];
    private onAddValueFailCb?: IDBConfig["onAddValueFail"];
    private stack: Array<any> = [];

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
        info(event);

        this.stack.forEach(({ store, value }) =>
            this.processAddedValue(store, value),
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

    private processAddedValue(store: string, value: any) {
        try {
            const transaction = this.db.transaction(store, "readwrite");
            const objectStore = transaction.objectStore(store);
            const request = objectStore.add(value);

            request.onsuccess = this.onAddValueSuccess.bind(this, value);
            request.onerror = this.onAddValueFail.bind(this);
        } catch (e) {
            error(e);
        }
    }

    public addValue(store: string, value: any) {
        if (this.db) {
            return this.processAddedValue(store, value);
        }

        this.stack.push({ store, value });
    }
}

export { IndexDBController };
