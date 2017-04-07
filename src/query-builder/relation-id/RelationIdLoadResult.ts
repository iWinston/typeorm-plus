import {RelationIdAttribute} from "./RelationIdAttribute";

export interface RelationIdLoadResult {
    relationIdAttribute: RelationIdAttribute;
    results: { id: any, parentId: any, manyToManyId?: any }[];
}