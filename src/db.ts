import {
    ControllerClass,
    IDBConfig,
    IDBStoreConfig,
    IPostponedByIdRequest,
    TPostponedAddValueRequest,
} from "./types";
import { error, info, warn } from "./utils";

// @TODO build by rollup
// @TODO typings
// @TODO add generic stores
class IndexDBController<T> implements ControllerClass<T> {
    private request: IDBOpenDBRequest | null = null;
    private db: IDBDatabase | null;
    private readonly storesConfig: Array<IDBStoreConfig>;
    private readonly onUpdateNeededCb?: IDBConfig["onUpdateNeeded"];
    private readonly addStack: Array<TPostponedAddValueRequest> = [];
    private readonly findStack: Array<IPostponedByIdRequest> = [];

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

    private getStore(store: string, mode?: IDBTransactionMode) {
        const transaction = this.db.transaction(store, mode);
        return transaction.objectStore(store);
    }

    private processAddedValue(postponedRequest: TPostponedAddValueRequest) {
        try {
            const objectStore = this.getStore(
                postponedRequest.store,
                "readwrite",
            );
            const request = objectStore.add(postponedRequest.value);

            request.onsuccess = () => postponedRequest.resolve(request.result);
            request.onerror = postponedRequest.reject;
        } catch (e) {
            postponedRequest.reject(e);
            error(e);
        }
    }

    private processGettingValue(postponedRequest: IPostponedByIdRequest) {
        try {
            const objectStore = this.getStore(
                postponedRequest.store,
                "readonly",
            );
            const request = objectStore.get(postponedRequest.id);

            request.onsuccess = () => postponedRequest.resolve(request.result);
            request.onerror = postponedRequest.reject;
        } catch (e) {
            postponedRequest.reject(e);
            error(e);
        }
    }

    public addValue(store: string, value: any) {
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

    public getById(store: Extract<keyof T, string>, id: number) {
        return new Promise((resolve, reject) => {
            if (this.db) {
                return this.processGettingValue({ store, id, resolve, reject });
            }

            this.findStack.push({ store, id, resolve, reject });
        });
    }
}

export { IndexDBController };
