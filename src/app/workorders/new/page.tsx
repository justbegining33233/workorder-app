import { redirect } from 'next/navigation';

/**
 * /workorders/new — legacy route
 * Redirects to the real new in-shop job creation page.
 */
export default function WorkOrderNewRedirect() {
  redirect('/shop/new-inshop-job');
}
