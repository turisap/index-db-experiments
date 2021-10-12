import React, { useEffect } from "react";

import { IndexDBController } from "./db";

const dbController = new IndexDBController<{ users: any; books: any }>({
    dbName: "testy",
    version: 3,
    stores: [
        { name: "users", params: { keyPath: "id", autoIncrement: true } },
        { name: "books", params: { keyPath: "id", autoIncrement: false } },
    ],
    onUpdateNeeded: () => alert("DB upgrade needed, please reload the page"),
});

function App() {
    useEffect(() => {
        dbController.addValue("users", {
            name: "Kirill Shakirov",
            email: "fofofo",
        });

        dbController
            .getById("users", 1)
            .then((resp) => console.log("rrr", resp))
            .catch((err) => {
                alert("oh no");
                console.error(err);
            });
    }, []);

    return (
        <div
            onClick={() => {
                dbController
                    .addValue("users", {
                        name: "Vova IVANOV",
                        email: "TRATAT",
                    })
                    .then((r) => console.log(r))
                    .catch(console.error);
            }}
        >
            index db
        </div>
    );
}

export default App;
