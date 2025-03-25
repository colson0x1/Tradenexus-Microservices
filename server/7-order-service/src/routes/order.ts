import { notifications } from '@order/controllers/notification/get';
import { intent, order } from '@order/controllers/order/create';
import { buyerOrders, orderId, sellerOrders } from '@order/controllers/order/get';
import { buyerApproveOrder, cancel, deliverOrder, deliveryDate, requestExtension } from '@order/controllers/order/update';
import { markNotificationAsRead } from '@order/services/notification.service';
import express, { Router } from 'express';

const router: Router = express.Router();

// Here i have all the routes and their respective controllers from my
// order controller
const orderRoutes = (): Router => {
  // @ GET routes
  router.get('/notification/:userTo', notifications);
  router.get('/:orderId', orderId);
  router.get('/seller/:sellerId', sellerOrders);
  router.get('/buyer/:buyerId', buyerOrders);

  // @ CREATE/POST routes
  // create an order
  router.post('/', order);
  router.post('/create-payment-intent', intent);

  // @ PUT routes
  router.put('/cancel/:orderId', cancel);
  // extension request
  router.put('/extension/:orderId', requestExtension);
  router.put('/deliver-order/:orderId', deliverOrder);
  router.put('/approve-order/:orderId', buyerApproveOrder);
  // delivery date
  router.put('/gig/:type/:orderId', deliveryDate);
  router.put('/notification/mark-as-read', markNotificationAsRead);

  return router;
};

export { orderRoutes };
