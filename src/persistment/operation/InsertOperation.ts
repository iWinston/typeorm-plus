/**
 * @internal
 */
export class InsertOperation {
    constructor(public entity: any,
                public entityId?: number,
                public date = new Date()) {
    }
}