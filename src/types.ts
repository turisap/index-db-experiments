export type TStoreKeys<S> = Extract<keyof S, string>;

export type ValueOf<T> = T[keyof T];

export type TStoreValue<StoreName, StoresObject> = StoreName extends TStoreKeys<StoresObject> ? StoresObject[StoreName] : any;

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

export type TPostponedByIdRequest<Store, StoresObject> = TReject & {
    store: Store;
    id: number;
    resolve: (value: TStoreValue<Store, StoresObject>) => void;
};

export type TPostponedAddValueRequest<Store, StoresObject> = TReject & {
    store: Store;
    value: TStoreValue<Store, StoresObject>;
    resolve: (id: number) => void;
};

export type TPostponedGetAllRequest<Store, StoresObject> = TReject & {
    store: Store;
    range?: IDBKeyRange;
    resolve: (value: Array<TStoreValue<Store, StoresObject>>) => void;
};

export type TStackSet<PostponedRequest> = {
    postponedRequests: Array<PostponedRequest>;
    processFn: (value: PostponedRequest) => void;
};

type TAddOneStackSet<Store, StoresObject> = TStackSet<TPostponedAddValueRequest<Store, StoresObject>>;

type TGetOneStackSet<Store, StoresObject> = TStackSet<TPostponedByIdRequest<Store, StoresObject>>;

type TGetAllStackSet<Store, StoresObject> = TStackSet<TPostponedGetAllRequest<Store, StoresObject>>;

export type TStackMap<Store, StoresObject> = {
    addOne: TAddOneStackSet<Store, StoresObject>;
    getOne: TGetOneStackSet<Store, StoresObject>;
    getAll: TGetAllStackSet<Store, StoresObject>;
};
