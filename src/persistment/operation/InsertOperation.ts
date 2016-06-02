/**
 * @internal
 */
export class InsertOperation {
    
    public treeLevel: number;
    
    constructor(public target: Function|string, // todo: probably should be metadata here
                public entity: any,
                public entityId?: number,
                public date = new Date()) {
    }
}