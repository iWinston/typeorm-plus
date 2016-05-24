import {CompositeIndexOptions} from "../options/CompositeIndexOptions";
import {TargetMetadataArgs} from "./TargetMetadataArgs";

/**
 */
export interface CompositeIndexMetadataArgs extends TargetMetadataArgs {

    /**
     * Class to which this column is applied.
     */
    target: Function;
    
    name?: string;
    
    columns: ((object: any) => any[])|string[];
    
    options?: CompositeIndexOptions;
    
}
