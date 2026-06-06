/**
 * @packageDocumentation
 * @module domain
 *
 * @remarks
 * Innermost layer — pure business logic only. No framework imports, no I/O.
 * All other layers depend inward on this one; this layer depends on nothing.
 * @see {@link https://github.com/cleancoders/cleanarchitecture} Clean Architecture
 */
export const DOMAIN_LAYER = 'domain' as const;
