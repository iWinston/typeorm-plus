import {ObjectLiteral} from "../../common/ObjectLiteral";
/**
 */
export class InsertOperation {
    
    public treeLevel: number;
    
    constructor(public target: Function|string, // todo: probably should be metadata here
                public entity: any,
                public entityId?: ObjectLiteral|undefined, // entity ids it should be instead
                public date = new Date()) {
    }
}