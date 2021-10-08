import { IDBConfig, IDBStoreConfig } from "./types";
import { error, info, warn } from "./utils";

// @TODO build by rollup
// @TODO linting
// @TODO typings
// @TODO add generic stores
class IndexDBController {
    private request: IDBOpenDBRequest | null = null;
    private storesConfig: Array<IDBStoreConfig>;
    // private db: IDBDatabase | null;

    public error?: string;

    constructor(config: IDBConfig) {
        this.init(config);

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
        const db = (event.target as IDBOpenDBRequest)?.result;
        db.onversionchange = IndexDBController.onVersionChange;

        info(`successfully connected to ${db.name}`);
        info(event);
    }

    private onUpgradeNeeded(event: Event) {
        warn("db upgrade needed");

        const db = (event.target as IDBOpenDBRequest)?.result;

        if (db) {
            const newStoresNames = this.storesConfig.map((store) => store.name);

            this.storesConfig.forEach((config) => {
                if (!db.objectStoreNames.contains(config.name)) {
                    db.createObjectStore(config.name, config.params);
                }
            });

            Array.from(db.objectStoreNames).forEach((name) => {
                if (!newStoresNames.includes(name)) {
                    db.deleteObjectStore(name);
                }
            });
        }
    }

    private static onVersionChange() {
        warn("changing DB version");
    }

    // public addValue(store, value) {}
}

export { IndexDBController };
