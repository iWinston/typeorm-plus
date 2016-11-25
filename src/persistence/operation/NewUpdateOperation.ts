import {Subject} from "../subject/Subject";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {RelationMetadata} from "../../metadata/RelationMetadata";

export class NewUpdateOperation {

    constructor(private subject: Subject,
                private updatedColumns: ColumnMetadata[],
                private updatedRelations: RelationMetadata[]) {
    }

}