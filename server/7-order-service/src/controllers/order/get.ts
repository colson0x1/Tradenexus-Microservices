import { IOrderDocument } from '@colson0x1/tradenexus-shared';
import { getOrderByOrderId, getOrdersByBuyerId, getOrdersBySellerId } from '@order/services/order.service';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

const orderId = async (req: Request, res: Response): Promise<void> => {
  const order: IOrderDocument = await getOrderByOrderId(req.params.orderId);
  res.status(StatusCodes.CREATED).json({ message: 'Order by order id', order });
};

const sellerOrders = async (req: Request, res: Response): Promise<void> => {
  const orders: IOrderDocument[] = await getOrdersBySellerId(req.params.sellerId);
  res.status(StatusCodes.CREATED).json({ message: 'Seller orders', orders });
};

const buyerOrders = async (req: Request, res: Response): Promise<void> => {
  const orders: IOrderDocument[] = await getOrdersByBuyerId(req.params.buyerId);
  res.status(StatusCodes.CREATED).json({ message: 'Buyer orders', orders });
};

export { orderId, sellerOrders, buyerOrders };
