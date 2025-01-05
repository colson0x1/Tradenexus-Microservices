import { Health } from '@gateway/controllers/health';
import express, { Router } from 'express';

// Every service will have the health route that will be needed when I set up
// Kubernetes cluster. So we can use health route to monitor if a pod is down.
// And also when monitoring, i'll use it to check on the Kibana dashboard
// if the service is down.
class HealthRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/gateway-health', Health.prototype.health);
    return this.router;
  }
}

export const healthRoutes: HealthRoutes = new HealthRoutes();
