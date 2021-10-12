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

export interface IPostponedByIdRequest {
    store: string;
    id: number;
    resolve: (value: unknown) => void;
    reject: (reason?: any) => void;
}

export type TPostponedAddValueRequest = Omit<IPostponedByIdRequest, "id"> & {
    value: any;
};

export abstract class ControllerClass<S> {
    public abstract getById(name: Extract<keyof S, string>, id: number);
}
