import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {QueryRunner} from "../driver/QueryRunner";
import {ForeignKeySchema} from "./ForeignKeySchema";

export class ColumnSchema {

    name: string;
    type: string;
    default: string;
    isNullable: boolean;
    isGenerated: boolean = false;
    isPrimary: boolean;
    comment: string|undefined;
    foreignKeys: ForeignKeySchema[] = [];

    constructor(existColumnSchema?: ColumnSchema) {
        if (existColumnSchema) {
            this.name = existColumnSchema.name;
            this.type = existColumnSchema.type;
            this.default = existColumnSchema.default;
            this.isNullable = existColumnSchema.isNullable;
            this.isGenerated = existColumnSchema.isGenerated;
            this.isPrimary = existColumnSchema.isPrimary;
            this.comment = existColumnSchema.comment;
            this.foreignKeys = existColumnSchema.foreignKeys;
        }
    }

    static create(queryRunner: QueryRunner, columnMetadata: ColumnMetadata) {
        const columnSchema = new ColumnSchema();
        columnSchema.name = columnMetadata.name;
        // columnSchema.default = columnMetadata.default;
        columnSchema.comment = columnMetadata.comment;
        columnSchema.isGenerated = columnMetadata.isGenerated;
        columnSchema.isNullable = columnMetadata.isNullable;
        columnSchema.type = queryRunner.normalizeType(columnMetadata);
        columnSchema.isPrimary = columnMetadata.isPrimary;
        return columnSchema;
    }

}