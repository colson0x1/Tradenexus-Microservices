/* @ This will handle all the routes related to authentication service */

import { SignUp } from '@gateway/controllers/auth/signup';
import express, { Router } from 'express';

class AuthRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    // Im using `prototype` here because i defined the `create` method inside
    // a class `SignUp` in gateway controllers/auth/signup.ts AND im using it
    // without creating an instance.
    /* this.router.post('/auth/signup', SignUp.prototype.create); */

    const signUpController = new SignUp();
    this.router.post('/auth/signup', (req, res) => signUpController.create(req, res));

    return this.router;
  }
}

export const authRoutes: AuthRoutes = new AuthRoutes();
