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

export interface IPostponedByIdRequest<T> {
    store: TStoreKeys<T>;
    id: number;
    resolve: (value: unknown) => void;
    reject: (reason?: any) => void;
}

export type TPostponedAddValueRequest<T> = Omit<IPostponedByIdRequest<T>, "id"> & {
    value: any;
};

export type TStoreKeys<S> = Extract<keyof S, string>;

export type ValueOf<T> = T[keyof T];
