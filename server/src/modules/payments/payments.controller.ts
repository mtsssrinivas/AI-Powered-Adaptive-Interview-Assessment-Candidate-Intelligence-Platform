import { Request, Response, NextFunction } from 'express';
import {
  CreateOrderInputSchema,
  VerifyPaymentInputSchema,
} from '@interviewiq/shared';
import { PaymentsService } from './payments.service';

export class PaymentsController {
  static getPlans(_req: Request, res: Response): void {
    const plans = PaymentsService.getAvailablePlans();
    res.status(200).json(plans);
  }

  static async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const validated = CreateOrderInputSchema.parse(req.body);

      const order = await PaymentsService.createOrder(
        userId,
        validated.planId,
        validated.idempotencyKey
      );
      res.status(201).json(order);
    } catch (error) {
      next(error);
    }
  }

  static async verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const validated = VerifyPaymentInputSchema.parse(req.body);

      const result = await PaymentsService.verifyPayment(
        userId,
        validated.razorpayOrderId,
        validated.razorpayPaymentId,
        validated.razorpaySignature,
        validated.planId,
        validated.idempotencyKey
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
