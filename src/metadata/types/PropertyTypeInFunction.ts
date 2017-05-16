/**
 * Contains the name of the property of the object, or the function that returns this name.
 */
export type PropertyTypeInFunction<T> = string|((t: T) => string|any);
