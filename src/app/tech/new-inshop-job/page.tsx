'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';

// Techs use the same in-shop job form as the shop.
// shop/new-inshop-job accepts both 'shop' and 'tech' roles.
export default function TechNewInShopJobRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/shop/new-inshop-job' as Route);
  }, [router]);
  return null;
}
