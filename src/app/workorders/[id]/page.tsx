import { redirect } from 'next/navigation';

/**
 * /workorders/[id] — legacy route
 * Work order details are managed inline within the shop home page.
 * Redirects there so the user isn't left on a 404.
 */
export default function WorkOrderDetailRedirect() {
  redirect('/shop/home');
}
