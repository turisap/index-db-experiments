import React, { useEffect } from "react";

import { IndexDBController } from "./db";

const dbController = new IndexDBController({
    dbName: "testy",
    version: 3,
    stores: [
        { name: "users", params: { keyPath: "id", autoIncrement: true } },
        { name: "books", params: { keyPath: "id", autoIncrement: false } },
    ],
    onAddValueSuccess: () => console.log("yahoo, value has been added"),
    onUpdateNeeded: () => alert("DB upgrade needed, please reload the page"),
    onAddValueFail: () => alert("oh no, could not add the value"),
});

function App() {
    useEffect(() => {
        dbController.addValue("users", {
            name: "Kirill Shakirov",
            email: "fofofo",
        });
        const id = setTimeout(() => {
            dbController
                .getById("users", 239423)
                .then((resp) => console.log(resp))
                .catch((err) => {
                    alert("oh no");
                    console.error(err);
                });
        }, 200);

        return () => window.clearTimeout(id);
    }, []);

    return <div>index db</div>;
}

export default App;
