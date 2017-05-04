import {EntityMetadata} from "../metadata/EntityMetadata";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {ColumnOptions} from "../decorator/options/ColumnOptions";
import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
import {ColumnMetadataArgs} from "../metadata-args/ColumnMetadataArgs";
import {ColumnTypes} from "../metadata/types/ColumnTypes";
import {LazyRelationsWrapper} from "../lazy-loading/LazyRelationsWrapper";
import {Driver} from "../driver/Driver";

/**
 * Helps to create EntityMetadatas for junction tables.
 */
export interface ClosureJunctionEntityMetadataBuilderArgs {
    namingStrategy: NamingStrategyInterface;
    entityMetadata: EntityMetadata;
    primaryColumn: ColumnMetadata;
    hasTreeLevelColumn: boolean;
}

/**
 * Helps to create EntityMetadatas for junction tables for closure tables.
 */
export class ClosureJunctionEntityMetadataBuilder {

    build(driver: Driver, lazyRelationsWrapper: LazyRelationsWrapper, args: ClosureJunctionEntityMetadataBuilderArgs) {

    }

}