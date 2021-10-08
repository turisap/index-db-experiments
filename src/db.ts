interface IDBConfig {
    dbName: string,
    version?: number,
    stores: Array<IDBStoreConfig>
}

interface IDBStoreConfig {
    name: string,
    params: IDBObjectStoreParameters
}

class IndexDBController {
    private request: IDBOpenDBRequest | null = null
    private storesConfig: Array<IDBStoreConfig>
    public error?: string

    constructor(config: IDBConfig) {
        this.init(config)
        this.storesConfig = config.stores
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

    private onConnectError(event: Event) {
        this.error = (event.target as IDBOpenDBRequest)?.error?.message

        console.error('Error connecting to db')
        console.error(this.error)

    }

    private onConnectSuccess(event: Event){
        const db = (event.target as IDBOpenDBRequest)?.result
        db.onversionchange = this.onVersionChange.bind(this)

        console.info(`successfully connected to ${db.name}`)
        console.info(event)
    }

    private onUpgradeNeeded(event: Event) {
        console.warn('db upgrade needed')

        const db = (event.target as IDBOpenDBRequest)?.result

        if(db){
            const newStoresNames = this.storesConfig.map(store => store.name);

            this.storesConfig.forEach(config => {
                if(!db.objectStoreNames.contains(config.name)){
                    db.createObjectStore(config.name, config.params)
                }
            })

            Array.from(db.objectStoreNames).forEach(name => {
                if(!newStoresNames.includes(name)) {
                    db.deleteObjectStore(name)
                }
            })
        }
    }

    private onVersionChange() {
        console.warn('changing DB version')
    }

}

export { IndexDBController }