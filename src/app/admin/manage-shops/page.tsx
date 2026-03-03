'use client';
import { useRequireAuth } from '@/contexts/AuthContext';

export default function ManageShops() {
  const { user, isLoading } = useRequireAuth(['admin', 'superadmin']);
  if (isLoading || !user) return null;
  return <div>Manage Shops</div>;
}
