import {ColumnType} from "../../metadata/types/ColumnTypes";

/**
 * Describes all column's options.
 */
export interface ColumnOptions {

    /**
     * Column type. Must be one of the value from the ColumnTypes class.
     */
    type?: ColumnType;

    /**
     * Column name.
     */
    readonly name?: string;

    /**
     * Column type's length. For example type = "string" and length = 100 means that ORM will create a column with
     * type varchar(100).
     */
    readonly length?: string;

    /**
     * Specifies if this column will use AUTO_INCREMENT or not (e.g. generated number).
     */
    readonly generated?: boolean;

    /**
     * Specifies if column's value must be unique or not.
     */
    readonly unique?: boolean;   

    /**
     * Indicates if column's value can be set to NULL.
     */
    readonly nullable?: boolean;

    /**
     * Extra column definition. Should be used only in emergency situations. Note that if you'll use this property
     * auto schema generation will not work properly anymore.
     */
    readonly columnDefinition?: string;

    /**
     * Column comment.
     */
    readonly comment?: string;

    /**
     * Column name used previously for this column. Used to make safe schema updates. Experimental and most probably
     * will be removed in the future. Avoid using it.
     */
    readonly oldColumnName?: string;

    /**
     * The precision for a decimal (exact numeric) column (applies only for decimal column), which is the maximum
     * number of digits that are stored for the values.
     */
    readonly precision?: number;

    /**
     * The scale for a decimal (exact numeric) column (applies only for decimal column), which represents the number
     * of digits to the right of the decimal point and must not be greater than precision.
     */
    readonly scale?: number;

    /**
     * Column collation. Note that not all databases support it.
     */
    readonly collation?: string; // todo: looks like this is not used
    
}
