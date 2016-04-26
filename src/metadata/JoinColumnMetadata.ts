import {PropertyMetadata} from "./PropertyMetadata";
import {JoinColumnOptions} from "./options/JoinColumnOptions";

/**
 */
export class JoinColumnMetadata extends PropertyMetadata {

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
    readonly options: JoinColumnOptions;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(target: Function, propertyName: string, options: JoinColumnOptions) {
        super(target, propertyName);
        this.options = options;
    }

}