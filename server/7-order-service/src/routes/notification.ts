/*
import { notifications } from '@order/controllers/notification/get';
import { markNotificationAsRead } from '@order/services/notification.service';
import express, { Router } from 'express';

const router: Router = express.Router();

// I can either create a separate route for this notification or just add it
// inside order routes.
// Here i have all the routes and their respective controllers from my
// notification controller
const orderRoutes = (): Router => {
  // @ GET routes
  router.get('/notification/:userTo', notifications);

  // @ PUT routes
  router.put('/notification/mark-as-read', markNotificationAsRead);

  return router;
};

export { orderRoutes };
*/
