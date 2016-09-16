import {TargetMetadata} from "./TargetMetadata";

/**
 * This represents metadata of some object's property.
 */
export interface PropertyMetadata extends TargetMetadata {

    /**
     * Target's property name to which this metadata is applied.
     */
    readonly propertyName: string;

}