import React, { Suspense } from 'react';
import NewAppointmentClient from '@/components/NewAppointmentClient';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewAppointmentClient />
    </Suspense>
  );
}
