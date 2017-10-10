import {TableColumnOptions} from "../options/TableColumnOptions";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";

export class TableUtils {

    static createTableColumnOptions(column: ColumnMetadata, normalizedType: string, normalizedDefault: string, normalizedLength: string): TableColumnOptions {
        return {
            name: column.databaseName,
            length: normalizedLength,
            charset: column.charset,
            collation: column.collation,
            precision: column.precision,
            scale: column.scale,
            default: normalizedDefault,
            comment: column.comment,
            isGenerated: column.isGenerated,
            generationStrategy: column.generationStrategy,
            isNullable: column.isNullable,
            type: normalizedType,
            isPrimary: column.isPrimary,
            isUnique: column.isUnique,
            isArray: column.isArray || false,
            enum: column.enum
        };
    }

}