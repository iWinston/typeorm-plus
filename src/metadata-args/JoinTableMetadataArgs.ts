import {JoinColumnOptions} from "../decorator/options/JoinColumnOptions";

/**
 * Arguments for JoinTableMetadata class.
 */
export interface JoinTableMetadataArgs {

    /**
     * Class to which this column is applied.
     */
    readonly target: Function|string;

    /**
     * Class's property name to which this column is applied.
     */
    readonly propertyName: string;

    /**
     * Name of the table that will be created to store values of the both tables (join table).
     * By default is auto generated.
     */
    readonly name?: string;

    /**
     * First column of the join table.
     */
    readonly joinColumn?: JoinColumnOptions;

    /**
     * Second (inverse) column of the join table.
     */
    readonly inverseJoinColumn?: JoinColumnOptions;

}
