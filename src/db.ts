interface IDBConfig {
    dbName: string,
    version?: number
}

class IndexDBController {
    private request: IDBOpenDBRequest | null = null
    private db: IDBDatabase | null = null;
    public error?: string

    constructor(config: IDBConfig) {
        this.init(config)
    }

    private init(config: IDBConfig) {
        if(!window.indexedDB){
            console.error('You browser does not support IndexDB')
        }

        this.connect(config)
    }

    private connect(config: IDBConfig) {
        this.request = window.indexedDB.open(config.dbName, config.version)

        this.request.onsuccess = this.onConnectSuccess.bind(this)
        this.request.onerror = this.onConnectError.bind(this)
        this.request.onupgradeneeded = this.onUpgradeNeeded.bind(this)
    }

    private onConnectError(event: Event){
        this.error = (event.target as IDBOpenDBRequest)?.error?.message

        console.error('Error connecting to db')
        console.error(this.error)

    }

    private onConnectSuccess(event: Event){
        this.db = (event?.target as IDBOpenDBRequest)?.result

        console.info(`successfully connected to ${this.db.name}`)
        console.info(event)
    }

    private onUpgradeNeeded(event: Event){
        console.warn('db upgrade needed')
        console.warn(event)
    }
}

export { IndexDBController }