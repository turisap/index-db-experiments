import { TStoreKeys, ValueOf } from "./types";

export abstract class ControllerClass<S> {
    public abstract getById(name: TStoreKeys<S>, id: number);

    public abstract addValue<Store>(store: TStoreKeys<S>, value: ValueOf<S>);
}
