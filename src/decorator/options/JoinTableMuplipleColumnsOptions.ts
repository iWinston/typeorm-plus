import {JoinColumnOptions} from "./JoinColumnOptions";

/**
 * Describes all relation's options.
 */
export interface JoinTableMuplipleColumnsOptions {

    /**
     * Name of the table that will be created to store values of the both tables (join table).
     * By default is auto generated.
     */
    readonly name?: string;

    /**
     * First column of the join table.
     */
    readonly joinColumns?: JoinColumnOptions[];

    /**
     * Second (inverse) column of the join table.
     */
    readonly inverseJoinColumns?: JoinColumnOptions[];

}