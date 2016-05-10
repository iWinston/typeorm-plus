/**
 * @internal
 */
export class InsertOperation {
    
    public treeLevel: number;
    
    constructor(public entity: any,
                public entityId?: number,
                public date = new Date()) {
    }
}