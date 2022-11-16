export class TimedArray<V> extends Array<V> {
    private _duration : number;
    private _timeout : NodeJS.Timeout | null;
    private _array : V[];

    public constructor (duration: number) {
        super();
        this._duration = duration * 1000.0;
        this._timeout = null;
        this._array = [];
    }

    public get data () : V[] {
        return this._array;
    }

    public set data (v: V[]) {
        this._array = v;
        this.refresh();
    }

    public refresh () : void {
        if (this._timeout !== null) {
            clearTimeout (this._timeout);
        }
        this._timeout = setTimeout(this.onTimeout.bind(this), this._duration);
    }

    private onTimeout () : void {
        this._timeout = null;
        this._array.length = 0;
    }
}
