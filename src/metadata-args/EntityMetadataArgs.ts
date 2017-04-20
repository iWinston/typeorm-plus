import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {TableMetadata} from "../metadata/TableMetadata";
import {RelationMetadata} from "../metadata/RelationMetadata";
import {IndexMetadata} from "../metadata/IndexMetadata";
import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
import {EmbeddedMetadata} from "../metadata/EmbeddedMetadata";
import {RelationIdMetadata} from "../metadata/RelationIdMetadata";
import {RelationCountMetadata} from "../metadata/RelationCountMetadata";

/**
 * Arguments for EntityMetadata class.
 */
export interface EntityMetadataArgs {

    readonly junction: boolean;
    readonly target: Function|string;
    readonly tablesPrefix?: string;
    readonly inheritanceType?: "single-table"|"class-table";
    readonly discriminatorValue?: string;
    readonly namingStrategy: NamingStrategyInterface;
    readonly tableMetadata: TableMetadata;
    readonly columnMetadatas?: ColumnMetadata[];
    readonly relationMetadatas?: RelationMetadata[];
    readonly relationIdMetadatas?: RelationIdMetadata[];
    readonly relationCountMetadatas?: RelationCountMetadata[];
    readonly indexMetadatas?: IndexMetadata[];
    readonly foreignKeyMetadatas?: ForeignKeyMetadata[];
    readonly embeddedMetadatas?: EmbeddedMetadata[];

}
