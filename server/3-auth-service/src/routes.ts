import { Application } from 'express';

/* This is where im going to define all the that we're going to have in the
 * Auth Service
 **/
export function appRoutes(app: Application): void {
  app.use('', () => console.log('appRoutes'));
}
