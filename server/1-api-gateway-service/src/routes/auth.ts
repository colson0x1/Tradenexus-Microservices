/* @ This will handle all the routes related to authentication service */

import { Password } from '@gateway/controllers/auth/password';
import { AuthSeed } from '@gateway/controllers/auth/seed';
import { SignIn } from '@gateway/controllers/auth/signin';
import { SignUp } from '@gateway/controllers/auth/signup';
import { VerifyEmail } from '@gateway/controllers/auth/verify-email';
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

    // Using instance
    /*
    const signUpController = new SignUp();
    this.router.post('/auth/signup', (req, res) => signUpController.create(req, res));
    */

    // Using Prototype
    this.router.post('/auth/signup', SignUp.prototype.create);
    this.router.post('/auth/signin', SignIn.prototype.read);
    this.router.put('/auth/verify-email', VerifyEmail.prototype.update);
    this.router.put('/auth/forgot-password', Password.prototype.forgotPassword);
    this.router.put('/auth/reset-password/:token', Password.prototype.resetPassword);
    this.router.put('/auth/change-password', Password.prototype.changePassword);
    this.router.put('/auth/seed/:count', AuthSeed.prototype.create);

    return this.router;
  }
}

export const authRoutes: AuthRoutes = new AuthRoutes();
