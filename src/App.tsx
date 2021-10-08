import React, { useEffect } from "react";

import { IndexDBController } from "./db";

const dbController = new IndexDBController({
    dbName: "testy",
    version: Date.now(),
    stores: [
        { name: "users", params: { keyPath: "id", autoIncrement: true } },
        { name: "books", params: { keyPath: "id", autoIncrement: false } },
    ],
});

function App() {
    useEffect(() => {
        console.error(dbController.error);
    }, []);

    return <div>index db</div>;
}

export default App;
