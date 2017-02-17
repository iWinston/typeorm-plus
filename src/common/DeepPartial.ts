export type DeepPartial<T> = {
    readonly [P in keyof T]?: DeepPartial<T[P]>;
};
