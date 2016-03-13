import {ColumnMetadata} from "../../metadata-builder/metadata/ColumnMetadata";

export interface UpdateOperation {
    entity: any;
    columns: ColumnMetadata[];
}