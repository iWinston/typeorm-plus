import {PropertyMetadata} from "./PropertyMetadata";
import {JoinTableOptions} from "./options/JoinTableOptions";

/**
 */
export class JoinTableMetadata extends PropertyMetadata {

    // ---------------------------------------------------------------------
    // Public Properties
    // ---------------------------------------------------------------------

    /**
     * Naming strategy used to generate and normalize column name.
     */
    // namingStrategy: NamingStrategyInterface;

    // ---------------------------------------------------------------------
    // Readonly Properties
    // ---------------------------------------------------------------------

    /**
     * Join table options.
     */
    readonly options: JoinTableOptions;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(target: Function, propertyName: string, options: JoinTableOptions) {
        super(target, propertyName);
        this.options = options;
    }

}