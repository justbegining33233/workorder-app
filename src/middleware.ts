/**
 * Next.js middleware entry point.
 * All auth / native-detection logic lives in app-middleware.ts.
 */
export { proxy as middleware, config } from './app-middleware';
