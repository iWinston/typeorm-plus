import {CompositeIndexOptions} from "../options/CompositeIndexOptions";

/**
 */
export interface CompositeIndexMetadataArgs {

    /**
     * Class to which this column is applied.
     */
    target: Function;
    
    name: string|undefined,
    
    columns: ((object: any) => any[])|string[],
    
    options?: CompositeIndexOptions;
    
}
