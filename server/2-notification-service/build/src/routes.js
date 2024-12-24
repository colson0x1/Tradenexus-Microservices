"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = healthRoutes;
const express_1 = __importDefault(require("express"));
const http_status_codes_1 = require("http-status-codes");
const router = express_1.default.Router();
// Health route is only exception route that will not pass through API Gateway
// i.e We're going to be able to access health route from outside and its
// going to return either 200 or 500. It will just be used to check the status
// of the service.
function healthRoutes() {
    router.get('/notification-health', (_req, res) => {
        res.status(http_status_codes_1.StatusCodes.OK).send('Notification service is healthy and OK.');
    });
    return router;
}
//# sourceMappingURL=routes.js.map