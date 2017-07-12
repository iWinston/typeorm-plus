import {ObjectLiteral} from "../common/ObjectLiteral";

export interface InsertResult {
    result: ObjectLiteral[];
    generatedMap: ObjectLiteral|undefined;
}