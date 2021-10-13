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

export type TPostponedByIdRequest<Store, StoresObject> = {
    store: Store;
    id: number;
    resolve: (value: TStoreValue<Store, StoresObject>) => void;
    reject: (reason?: any) => void;
};

export type TPostponedAddValueRequest<Store, StoresObject> = {
    store: Store;
    value: TStoreValue<Store, StoresObject>;
    resolve: (id: number) => void;
    reject: (reason?: any) => void;
};

export type TStoreKeys<S> = Extract<keyof S, string>;

export type ValueOf<T> = T[keyof T];

export type TStoreValue<StoreName, StoresObject> = StoreName extends TStoreKeys<StoresObject> ? StoresObject[StoreName] : any;
