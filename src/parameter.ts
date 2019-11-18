type Callback = (...args: any) => void;
export class Parameter<T>{
    _value: T;
    setterCallbacks: Callback[];
    getterCallbacks: Callback[]
    constructor(value: T) {
        this._value = value;   
        this.getterCallbacks = [];
        this.setterCallbacks = [];
    }

    addSetterCallback(callback: Callback) {
        this.setterCallbacks.push(callback)
    }

    addGetterCallback(callback: Callback) {
        this.getterCallbacks.push(callback)
    }

    get value() {
        this.getterCallbacks.forEach(callback => {
            callback(this._value);
        })
        return this._value
    }
    set value(value) {
        this.setterCallbacks.forEach(callback => {
            callback(value, this._value);
        })
        this._value = value;
    }
}