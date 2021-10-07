import React, { useEffect } from 'react';

import { IndexDBController }  from './db'

const dbController = new IndexDBController({ dbName: 'testy', version: 1})

function App() {
    useEffect(() => {
        // dbController
    }, [])

    return (
        <div>
            index db
        </div>
    )
}

export default App;
