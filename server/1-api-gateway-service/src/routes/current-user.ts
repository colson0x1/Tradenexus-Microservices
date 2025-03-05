import { CurrentUser } from '@gateway/controllers/auth/current-user';
import { Refresh } from '@gateway/controllers/auth/refresh-token';
import { authMiddleware } from '@gateway/services/auth-middleware';
import express, { Router } from 'express';

class CurrentUserRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    // Using Prototype
    this.router.get('/auth/refresh-token/:username', authMiddleware.checkAuthentication, Refresh.prototype.token);
    this.router.get('/auth/logged-in-user', authMiddleware.checkAuthentication, CurrentUser.prototype.getLoggedInUsers);
    // @ authMiddleware.checkAuthentication checks if currentUser exists. If
    // currentUser object does not exist, it throws an error.
    // authMiddleware.verifyUser is just to verify if the token is still valid.
    this.router.get('/auth/currentuser', authMiddleware.checkAuthentication, CurrentUser.prototype.read);

    this.router.post('/auth/resend-email', authMiddleware.checkAuthentication, CurrentUser.prototype.resendEmail);

    // `/:username` because i need the username fro params right there on
    // currentUser controller.
    // So if this delete route is called, then its going to remove the user
    // from the Redis cache. Probably when the user clicks on the logout button.
    // And then they logged out. Then i want to remove them from the cache.
    this.router.delete('/auth/logged-in-user/:username', authMiddleware.checkAuthentication, CurrentUser.prototype.getLoggedInUsers);

    return this.router;
  }
}

export const currentUserRoutes: CurrentUserRoutes = new CurrentUserRoutes();
