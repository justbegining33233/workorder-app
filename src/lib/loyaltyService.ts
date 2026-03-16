import prisma from '@/lib/prisma';

const POINTS_PER_DOLLAR = 1;

/**
 * Award loyalty points to a customer based on the amount paid on a work order.
 * Called when a work order status transitions to 'closed' or payment is made.
 */
export async function awardLoyaltyPoints(
  customerId: string,
  workOrderId: string,
  amountPaid: number,
): Promise<{ points: number; totalPoints: number } | null> {
  if (!amountPaid || amountPaid <= 0) return null;

  const points = Math.floor(amountPaid * POINTS_PER_DOLLAR);
  if (points <= 0) return null;

  try {
    // Count total completed work orders for this customer to compute cumulative points
    const completed = await prisma.workOrder.findMany({
      where: {
        customerId,
        status: { in: ['closed', 'completed', 'Completed'] },
      },
      select: { amountPaid: true, estimatedCost: true },
    });

    // Total points = sum of all payments * POINTS_PER_DOLLAR
    const totalPoints = completed.reduce((sum, wo) => {
      const paid = wo.amountPaid || wo.estimatedCost || 0;
      return sum + Math.floor(paid * POINTS_PER_DOLLAR);
    }, 0);

    // Create an in-app notification about points earned
    await prisma.notification.create({
      data: {
        customerId,
        type: 'loyalty_points',
        title: 'Points Earned!',
        message: `You earned ${points} loyalty points! Total balance: ${totalPoints} points.`,
        workOrderId,
        deliveryMethod: 'in-app',
      },
    });

    return { points, totalPoints };
  } catch (err) {
    console.error('[loyaltyService] Failed to award points:', err);
    return null;
  }
}
