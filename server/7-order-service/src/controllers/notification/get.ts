import { IOrderNotifcation } from '@colson0x1/tradenexus-shared';
import { getNotificationsById } from '@order/services/notification.service';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

// Controller to get notifications.
const notifications = async (req: Request, res: Response): Promise<void> => {
  const notifications: IOrderNotifcation[] = await getNotificationsById(req.params.userTo);
  res.status(StatusCodes.OK).json({ message: 'Notifications', notifications });
};

export { notifications };
