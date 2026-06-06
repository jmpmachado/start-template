/**
 * @packageDocumentation
 * @module application
 *
 * @remarks
 * Use-case orchestration layer. Depends on domain interfaces only — never on
 * infrastructure or interface-layer concretions (Dependency Rule).
 */
export const APPLICATION_LAYER = 'application' as const;
