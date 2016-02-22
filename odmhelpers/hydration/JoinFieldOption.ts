
export interface JoinFieldOption {

    inner?: boolean;
    field: string|any;
    condition?: any;
    joins: JoinFieldOption|any[]; // todo: check its type - looks wrong

}