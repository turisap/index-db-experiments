import {
    IDBConfig,
    IDBStoreConfig,
    TKeys,
    TPossibleRequests,
    TPostponedAddValueRequest,
    TPostponedByIdRequest,
    TPostponedGetAllRequest,
    TProcessFunctions,
    TStackMap,
    TStoreValue,
} from "./types";
import { error, info, warn } from "./utils";

// @TODO yarn2 pnp
class IndexDBController<Stores> {
    private request: IDBOpenDBRequest | null = null;
    private db: IDBDatabase | null = null;
    private readonly storesConfig: Array<IDBStoreConfig>;
    private readonly onUpdateNeededCb?: IDBConfig["onUpdateNeeded"];

    private readonly stackMap: TStackMap<any, Stores> = {
        addOne: {
            requests: [],
        },
        getOne: {
            requests: [],
        },
        getAll: {
            requests: [],
        },
    };

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
        Object.values(this.stackMap).forEach((operationSet) => {
            operationSet.requests.forEach((request) => {
                const processFn = this.getProcessFn(request);

                processFn(request);
            });
        });
    }

    private getProcessFn<Request extends TPossibleRequests<any, Stores>>(
        req: Request,
    ): TProcessFunctions<any, Stores>[Request["store"]] {
        switch (req.kind) {
            case "addOne":
                return this.processAddValue.bind(this);
            case "getOne":
                return this.processGettingValueById.bind(this);
            case "getAll":
                return this.processGetAllValues.bind(this);
            // this is a check if we miss newly added operations
            // https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking
            default:
                const _exhaustiveCheck: never = req;

                return _exhaustiveCheck;
        }
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

    private getStore<StoreName extends TKeys<Stores>>(store: StoreName, mode?: IDBTransactionMode) {
        if (this.db) {
            const transaction = this.db.transaction(store, mode);

            return transaction.objectStore(store);
        } else {
            throw new Error("Index DB is not connected");
        }
    }

    private handleRequest<StoreName extends TKeys<Stores>>(
        dbRequest: IDBRequest<IDBValidKey> | IDBRequest<Stores[StoreName]> | IDBRequest<Array<Stores[StoreName]>>,
        postponedRequest: TPossibleRequests<StoreName, Stores>,
    ) {
        dbRequest.onsuccess = () => postponedRequest.resolve(dbRequest.result as any);
        dbRequest.onerror = postponedRequest.reject;
    }

    private processAddValue<StoreName extends TKeys<Stores>>(
        postponedRequest: TPostponedAddValueRequest<StoreName, Stores>,
    ) {
        try {
            const objectStore = this.getStore(postponedRequest.store, "readwrite");
            const request = objectStore.add(postponedRequest.value);

            this.handleRequest(request, postponedRequest);
        } catch (e) {
            postponedRequest.reject(e);
            error(e);
        }
    }

    private processGettingValueById<StoreName extends TKeys<Stores>>(
        postponedRequest: TPostponedByIdRequest<StoreName, Stores>,
    ) {
        try {
            const objectStore = this.getStore<StoreName>(postponedRequest.store, "readonly");
            const request = objectStore.get(postponedRequest.id);

            this.handleRequest(request, postponedRequest);
        } catch (e) {
            postponedRequest.reject(e);
            error(e);
        }
    }

    private processGetAllValues<StoreName extends TKeys<Stores>>(
        postponedRequest: TPostponedGetAllRequest<StoreName, Stores>,
    ) {
        try {
            const objectStore = this.getStore<StoreName>(postponedRequest.store, "readonly");
            const request = objectStore.getAll(postponedRequest.range);

            this.handleRequest(request, postponedRequest);
        } catch (e) {
            postponedRequest.reject(e);
            error(e);
        }
    }

    public addValue<StoreName extends TKeys<Stores>>(
        store: StoreName,
        value: TStoreValue<StoreName, Stores>,
    ): Promise<number> {
        return new Promise((resolve, reject) => {
            const requestPayload = { store, value, resolve, reject, kind: "addOne" as const };

            if (this.db) {
                return this.processAddValue<StoreName>(requestPayload);
            }

            this.stackMap["addOne"].requests.push(requestPayload);
        });
    }

    public getById<StoreName extends TKeys<Stores>>(store: StoreName, id: number): Promise<Stores[StoreName]> {
        return new Promise((resolve, reject) => {
            const requestPayload = { store, id, resolve, reject, kind: "getOne" as const };

            if (this.db) {
                return this.processGettingValueById<StoreName>(requestPayload);
            }

            this.stackMap["getOne"].requests.push(requestPayload);
        });
    }

    public getAllValues<StoreName extends TKeys<Stores>>(
        store: StoreName,
        range?: IDBKeyRange,
    ): Promise<Array<Stores[StoreName]>> {
        return new Promise((resolve, reject) => {
            const requestPayload = { store, range, resolve, reject, kind: "getAll" as const };

            if (this.db) {
                return this.processGetAllValues<StoreName>(requestPayload);
            }

            this.stackMap["getAll"].requests.push(requestPayload);
        });
    }
}

export { IndexDBController };
