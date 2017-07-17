import {ObjectLiteral} from "../common/ObjectLiteral";

export interface InsertResult {
    result: ObjectLiteral[]|undefined;
    generatedMap: ObjectLiteral|undefined;
}