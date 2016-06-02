import {ColumnOptions} from "../decorator/options/ColumnOptions";
import {ColumnMode} from "../metadata/ColumnMetadata";

/**
 * Arguments for ColumnMetadata class.
 */
export interface ColumnMetadataArgs {

    /**
     * Class to which column is applied.
     */
    readonly target?: Function|string;

    /**
     * In the case if this column is without a target, targetId must be specified. 
     * This is used for entity schemas without classes.
     */
    // readonly targetId?: string;

    /**
     * Class's property name to which column is applied.
     */
    readonly propertyName?: string;

    /**
     * Class's property type (reflected) to which column is applied.
     * 
     * todo: check when this is not set, because for the entity schemas we don't set it.
     */
    readonly propertyType?: string;

    /**
     * Column mode in which column will work.
     * 
     * todo: find name better then "mode".
     */
    readonly mode: ColumnMode;

    /**
     * Extra column options.
     */
    readonly options: ColumnOptions;
    
}
