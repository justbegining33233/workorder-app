'use client';

// Manager admin settings - redirects to manager settings
import { redirect } from 'next/navigation';

export default function ManagerAdminSettingsPage() {
  redirect('/manager/settings');
}
