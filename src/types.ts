export interface IDBConfig {
    dbName: string;
    version?: number;
    stores: Array<IDBStoreConfig>;
    onAddValueSuccess?: (value: any) => void;
    onUpdateNeeded?: () => void;
    onAddValueFail?: (error: Event) => void;
}

export interface IDBStoreConfig {
    name: string;
    params: IDBObjectStoreParameters;
}

export interface IStores {
    [key: string]: any;
}
