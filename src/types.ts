export type TStoreKeys<S> = Extract<keyof S, string>;

export type ValueOf<T> = T[keyof T];

export type TStoreValue<StoreName, StoreShape> = StoreName extends TStoreKeys<StoreShape> ? StoreShape[StoreName] : any;

export type TReject = {
    reject: (reason?: any) => void;
};

export interface IDBConfig {
    dbName: string;
    version?: number;
    stores: Array<IDBStoreConfig>;
    onUpdateNeeded?: () => void;
}

export interface IDBStoreConfig {
    name: string;
    params: IDBObjectStoreParameters;
}

export type TPostponedByIdRequest<StoreName, StoreShape> = TReject & {
    kind: "getOne";
    store: StoreName;
    id: number;
    resolve: (value: TStoreValue<StoreName, StoreShape>) => void;
};

export type TPostponedAddValueRequest<StoreName, StoreShape> = TReject & {
    kind: "addOne";
    store: StoreName;
    value: TStoreValue<StoreName, StoreShape>;
    resolve: (id: number) => void;
};

export type TPostponedGetAllRequest<StoreName, StoreShape> = TReject & {
    kind: "getAll";
    store: StoreName;
    range?: IDBKeyRange;
    resolve: (value: Array<TStoreValue<StoreName, StoreShape>>) => void;
};

export type TStackMap<StoreName, StoreShape> = {
    addOne: {
        readonly requests: Array<TPostponedAddValueRequest<StoreName, StoreShape>>;
    };
    getOne: {
        readonly requests: Array<TPostponedByIdRequest<StoreName, StoreShape>>;
    };
    getAll: {
        readonly requests: Array<TPostponedGetAllRequest<StoreName, StoreShape>>;
    };
};

export type TPossibleRequests<StoreName, StoreShape> =
    | TPostponedByIdRequest<StoreName, StoreShape>
    | TPostponedAddValueRequest<StoreName, StoreShape>
    | TPostponedGetAllRequest<StoreName, StoreShape>;

export type TProcessFunctions<StoreName, StoreShape> = {
    addOne: (request: TPostponedAddValueRequest<StoreName, StoreShape>) => void;
    getOne: (request: TPostponedByIdRequest<StoreName, StoreShape>) => void;
    getAll: (request: TPostponedGetAllRequest<StoreName, StoreShape>) => void;
};
