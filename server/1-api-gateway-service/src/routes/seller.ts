import { Create } from '@gateway/controllers/users/seller/create';
import { Get } from '@gateway/controllers/users/seller/get';
import { SellerSeed } from '@gateway/controllers/users/seller/seed';
import { Update } from '@gateway/controllers/users/seller/update';
import express, { Router } from 'express';

class SellerRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    /* @ GET Routes */
    // This property `:sellerId`, im getting it from the `req.params`
    this.router.get('/seller/id/:sellerId', Get.prototype.id);
    this.router.get('/seller/username/:username', Get.prototype.username);
    this.router.get('/seller/random/:size', Get.prototype.random);
    /* @ POST Routes */
    this.router.post('/seller/create', Create.prototype.seller);
    /* @ PUT Routes */
    this.router.put('/seller/:sellerId', Update.prototype.seller);
    this.router.put('/seller/seed/:count', SellerSeed.prototype.seller);

    return this.router;
  }
}

export const sellerRoutes: SellerRoutes = new SellerRoutes();
