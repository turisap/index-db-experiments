import React, { useEffect } from "react";

import { IndexDBController } from "./db";

interface IStore {
    users: { name: string; email: string };
    books: { title: string };
}

const dbController = new IndexDBController<IStore>({
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
        dbController
            .getById("users", 1)
            .then((resp) => console.log("rrr", resp))
            .catch((err) => {
                alert("oh no");
                console.error(err);
            });

        dbController
            .addValue("users", {
                name: "Vova IVANOV",
                email: "TRATAT",
            })
            .then((r) => console.log(r))
            .catch(console.error);

        dbController
            .getAllValues("users")
            .then((resp) => console.log("all", resp))
            .catch((err) => {
                alert("oh");
                console.log(err);
            });
    }, []);

    return (
        <div
            onClick={() => {
                dbController
                    .addValue<"users">("users", {
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
