export class MetadataWithSuchNameAlreadyExistsError extends Error {
    name = "MetadataWithSuchNameAlreadyExistsError";

    constructor(metadataType: string, name: string) {
        super();
        this.message = metadataType + " metadata with such name " + name + " already exists. " +
            "Do you apply something twice? Or maybe try to change a name?";
    }

}