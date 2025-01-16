import { CurrentUser } from '@gateway/controllers/auth/current-user';
import { authMiddleware } from '@gateway/services/auth-middleware';
import express, { Router } from 'express';

class CurrentUserRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    // Using Prototype
    // @ authMiddleware.checkAuthentication checks if currentUser exists. If
    // currentUser object does not exist, it throws an error.
    // authMiddleware.verifyUser is just to verify if the token is still valid.
    this.router.get('/auth/currentuser', authMiddleware.checkAuthentication, CurrentUser.prototype.read);
    this.router.post('/auth/resend-email', authMiddleware.checkAuthentication, CurrentUser.prototype.resendEmail);

    return this.router;
  }
}

export const currentUserRoutes: CurrentUserRoutes = new CurrentUserRoutes();
