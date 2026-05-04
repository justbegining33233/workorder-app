import { redirect } from 'next/navigation';

/**
 * /workorders/list — legacy route
 * Redirects to the shop's home page where work orders are managed.
 */
export default function WorkOrderListRedirect() {
  redirect('/shop/home');
}
