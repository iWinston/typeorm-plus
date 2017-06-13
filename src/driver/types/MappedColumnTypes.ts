import {ColumnType} from "./ColumnTypes";

/**
 * Orm has special columns and we need to know what database column types should be for those types.
 * Column types are driver dependant.
 */
export interface MappedColumnTypes {

    /**
     * Column type for the create date column.
     */
    createDate: ColumnType;

    /**
     * Column type for the update date column.
     */
    updateDate: ColumnType;

    /**
     * Column type for the version column.
     */
    version: ColumnType;

    /**
     * Column type for the tree level column.
     */
    treeLevel: ColumnType;

    /**
     * Column type of timestamp column used for migrations table.
     */
    migrationTimestamp: ColumnType;

    /**
     * Column type for migration name column used for migrations table.
     */
    migrationName: ColumnType;

}