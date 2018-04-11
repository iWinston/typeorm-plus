/**
 * Options for columns that can define a length of the column type.
 */
export interface ColumnWithWidthOptions {

    /**
     * Column type's display width. Used only on some column types in MySQL.
     * For example, INT(4) specifies an INT with a display width of four digits.
     */
    width?: number;

}
