import { requireAuth } from '@/lib/auth';
import { AppointmentsPageClient } from './AppointmentsPageClient';
import { getCustomersByTenant } from '@/lib/customers';
import { getPetsByTenant } from '@/lib/pets';
import { getStaffMembers } from '@/lib/medical';
// Serializers not needed for this simple data transformation

export default async function AppointmentsPage() {
  const { tenant } = await requireAuth();
  
  // Fetch all necessary data for the appointments page
  const [customers, pets, staff] = await Promise.all([
    getCustomersByTenant(tenant.id),
    getPetsByTenant(tenant.id),
    getStaffMembers(tenant.id),
  ]);

  // Serialize data for client components
  const serializedCustomers = customers.map((customer: { id: string; name: string; email?: string; phone?: string }) => ({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
  }));

  const serializedPets = pets.map((pet: { id: string; name: string; species: string; breed?: string; customerId: string }) => ({
    id: pet.id,
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    customerId: pet.customerId,
  }));

  const serializedStaff = staff.map((member: { id: string; name: string; position: string }) => ({
    id: member.id,
    name: member.name,  
    position: member.position,
  }));

  return (
    <AppointmentsPageClient 
      customers={serializedCustomers}
      pets={serializedPets}
      staff={serializedStaff}
    />
  );
}