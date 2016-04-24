/**
 * @internal
 */
export class CannotSetNamingStrategyError extends Error {
    name = "CannotSetNamingStrategyError";
    message = "Cannot set naming strategy. Naming strategy must be set right after ConnectionManager is created, and before any entity importing is done.";
}