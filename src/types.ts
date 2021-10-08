export interface IDBConfig {
    dbName: string;
    version?: number;
    stores: Array<IDBStoreConfig>;
}

export interface IDBStoreConfig {
    name: string;
    params: IDBObjectStoreParameters;
}

export interface IStores {
    [key: string]: any;
}
