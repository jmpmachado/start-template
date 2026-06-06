/**
 * @packageDocumentation
 * @module infrastructure
 *
 * @remarks
 * Outermost implementation layer — DB drivers, HTTP clients, queue adapters.
 * Implements interfaces declared in domain; never imported by application or domain.
 */
export const INFRASTRUCTURE_LAYER = 'infrastructure' as const;
