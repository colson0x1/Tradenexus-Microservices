// Controller to mark notifications as read.
import { IOrderNotifcation } from '@colson0x1/tradenexus-shared';
import { markNotificationAsRead } from '@order/services/notification.service';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

// Controller to get notifications.
const markSingleNotificationAsRead = async (req: Request, res: Response): Promise<void> => {
  const { notificationId } = req.body;
  // Here im getting ony one notification. not multiple notifications.
  const notification: IOrderNotifcation = await markNotificationAsRead(notificationId);
  res.status(StatusCodes.OK).json({ message: 'Notification updated successfully.', notification });
};

export { markSingleNotificationAsRead };
