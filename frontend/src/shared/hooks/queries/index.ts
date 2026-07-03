/**
 * Feature-specific query hooks
 *
 * These hooks wrap useApiQuery with feature-specific configuration,
 * including proper typing and demo data handling.
 */

export { useCoursesQuery } from './use-courses-query';
export type { Course, UseCoursesParams } from './use-courses-query';

export { useTemplesQuery } from './use-temples-query';
export type { UseTemplesParams } from './use-temples-query';

export { useCirclesQuery } from './use-circles-query';
export type { Circle, UseCirclesParams } from './use-circles-query';

export { useEventsQuery } from './use-events-query';
export type { Event, UseEventsParams } from './use-events-query';
