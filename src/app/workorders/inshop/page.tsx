import { redirect } from 'next/navigation';

/**
 * /workorders/inshop — legacy route
 * Redirects to the real new in-shop job creation page.
 */
export default function WorkOrderInShopRedirect() {
  redirect('/shop/new-inshop-job');
}
