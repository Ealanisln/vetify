'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StaffModal from '../../../../components/staff/StaffModal';

export default function NewStaffPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleClose = () => {
    setIsModalOpen(false);
    router.push('/dashboard/staff');
  };

  const handleStaffSaved = () => {
    router.push('/dashboard/staff');
  };

  return (
    <StaffModal
      isOpen={isModalOpen}
      onClose={handleClose}
      mode="create"
      onStaffSaved={handleStaffSaved}
    />
  );
} 