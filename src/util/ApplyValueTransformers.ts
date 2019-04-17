import { ValueTransformer } from "../decorator/options/ValueTransformer";

export class ApplyValueTransformers {
    static innerTransform(transformer: ValueTransformer | ValueTransformer[], databaseValue: any) {
        if (Array.isArray(transformer)) {
            return transformer[0].from(transformer[1].from(databaseValue));
        }
        return transformer.from(databaseValue);
    }
    static outerTransform(transformer: ValueTransformer | ValueTransformer[], entityValue: any) {
        if (Array.isArray(transformer)) {
            return transformer[1].to(transformer[0].to(entityValue));
        }
        return transformer.to(entityValue);
    }
}