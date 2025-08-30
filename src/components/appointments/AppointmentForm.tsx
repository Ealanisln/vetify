'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { appointmentFormSchema, AppointmentFormData } from '../../lib/validations/appointments';
import { useAvailability } from '../../hooks/useCalendar';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Loader2, Clock, AlertCircle, CheckCircle, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  customerId: string;
}

interface Staff {
  id: string;
  name: string;
  position: string;
}

interface AppointmentFormProps {
  customers: Customer[];
  pets: Pet[];
  staff: Staff[];
  initialData?: Partial<AppointmentFormData>;
  onSubmit: (data: AppointmentFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  className?: string;
}

export function AppointmentForm({
  customers,
  pets,
  staff,
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  className,
}: AppointmentFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialData?.dateTime || new Date()
  );
  const [selectedCustomer, setSelectedCustomer] = useState<string>(
    initialData?.customerId || ''
  );
  const [availablePets, setAvailablePets] = useState<Pet[]>([]);
  // Time slots are shown based on availability data
  
  const { checkAvailability, availability, loading: availabilityLoading } = useAvailability();
  
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
  } = useForm({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      customerId: initialData?.customerId || '',
      petId: initialData?.petId || '',
      dateTime: initialData?.dateTime || new Date(),
      duration: initialData?.duration || 30,
      reason: initialData?.reason || '',
      notes: initialData?.notes || '',
      staffId: initialData?.staffId || '',
      status: initialData?.status || 'SCHEDULED',
      priority: 'medium',
    },
  });

  const watchedDuration = watch('duration');
  const watchedStaffId = watch('staffId');

  // Filtrar mascotas por cliente seleccionado
  useEffect(() => {
    if (selectedCustomer) {
      const customerPets = pets.filter(pet => pet.customerId === selectedCustomer);
      setAvailablePets(customerPets);
      
      // Si solo hay una mascota, seleccionarla automáticamente
      if (customerPets.length === 1) {
        setValue('petId', customerPets[0].id);
      }
    } else {
      setAvailablePets([]);
    }
  }, [selectedCustomer, pets, setValue]);

  // Verificar disponibilidad cuando cambia la fecha
  useEffect(() => {
    if (selectedDate) {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      checkAvailability(dateString, watchedDuration, watchedStaffId)
        .catch(() => {
          // Handle availability check errors silently
        });
    }
  }, [selectedDate, watchedDuration, watchedStaffId, checkAvailability]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleTimeSlotSelect = (dateTime: string) => {
    const selectedDateTime = new Date(dateTime);
    setValue('dateTime', selectedDateTime);
    setSelectedDate(selectedDateTime);
  };

  const handleFormSubmit = async (data: Parameters<typeof onSubmit>[0]) => {
    try {
      await onSubmit(data);
      toast.success('Cita guardada exitosamente');
      reset();
    } catch (error) {
      toast.error('Error al guardar la cita');
      console.error('Error submitting appointment form:', error);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomer(customerId);
    setValue('customerId', customerId);
    setValue('petId', ''); // Reset pet selection
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={cn("space-y-6 p-6", className)}>
      {/* Customer Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="form-label" htmlFor="customerId">Cliente *</label>
          <Controller
            name="customerId"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className="form-select"
                onChange={(e) => {
                  field.onChange(e.target.value);
                  handleCustomerChange(e.target.value);
                }}
              >
                <option value="">Seleccionar cliente</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.phone && `- ${customer.phone}`}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.customerId && (
            <p className="text-sm text-red-500">{errors.customerId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="form-label" htmlFor="petId">Mascota *</label>
          <Controller
            name="petId"  
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className="form-select"
                disabled={!selectedCustomer}
              >
                <option value="">
                  {selectedCustomer ? "Seleccionar mascota" : "Primero selecciona un cliente"}
                </option>
                {availablePets.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name} - {pet.species} {pet.breed && `(${pet.breed})`}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.petId && (
            <p className="text-sm text-red-500">{errors.petId.message}</p>
          )}
        </div>
      </div>

      {/* Date and Time Selection */}
      <div className="appointment-form-grid grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Calendar - Responsive sizing */}
        <div className="calendar-section xl:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3">
                             <CardTitle className="text-lg flex items-center gap-2">
                 <CalendarIcon className="h-5 w-5" />
                 Seleccionar Fecha
               </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={{ before: new Date() }}
                  locale={es}
                  className="appointment-calendar w-full max-w-sm"
                  showOutsideDays={true}
                  fixedWeeks={true}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time Slots - Now takes more space */}
        <div className="time-slots-section xl:col-span-3">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horarios Disponibles
                {availabilityLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              </CardTitle>
              {selectedDate && (
                <p className="text-sm text-gray-500">
                  {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              )}
            </CardHeader>
            <CardContent className="p-3">
              {!selectedDate ? (
                <div className="flex items-center justify-center py-8 text-center">
                  <div>
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Selecciona una fecha para ver los horarios disponibles</p>
                  </div>
                </div>
              ) : availabilityLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : availability && availability.availableSlots.length > 0 ? (
                <div className="time-slots-container space-y-4 max-h-[500px] overflow-y-auto">
                  {/* Morning slots */}
                  {availability.availableSlots.filter(slot => slot.period === 'morning').length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                          🌅 Mañana
                        </div>
                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {availability.availableSlots.filter(slot => slot.period === 'morning').length} disponibles
                        </div>
                      </div>
                      <div className="time-slots-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 gap-2">
                        {availability.availableSlots
                          .filter(slot => slot.period === 'morning')
                          .map((slot) => (
                          <Button
                            key={slot.dateTime}
                            type="button"
                            variant={watch('dateTime')?.toISOString() === slot.dateTime ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleTimeSlotSelect(slot.dateTime)}
                            className="time-slot-button h-9 text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:scale-[1.02] border-gray-200 hover:border-primary"
                          >
                            {slot.time}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Afternoon slots */}
                  {availability.availableSlots.filter(slot => slot.period === 'afternoon').length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                          🌆 Tarde
                        </div>
                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {availability.availableSlots.filter(slot => slot.period === 'afternoon').length} disponibles
                        </div>
                      </div>
                      <div className="time-slots-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 gap-2">
                        {availability.availableSlots
                          .filter(slot => slot.period === 'afternoon')
                          .map((slot) => (
                          <Button
                            key={slot.dateTime}
                            type="button"
                            variant={watch('dateTime')?.toISOString() === slot.dateTime ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleTimeSlotSelect(slot.dateTime)}
                            className="time-slot-button h-9 text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:scale-[1.02] border-gray-200 hover:border-primary"
                          >
                            {slot.time}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Summary stats */}
                  <div className="text-xs text-gray-500 pt-3 border-t border-gray-100 bg-gray-50 -mx-3 px-3 py-2 rounded-b-lg">
                    <div className="flex items-center justify-between">
                      <span>📅 {availability.availableCount} espacios disponibles</span>
                      <span className="text-gray-400">de {availability.totalSlots} total</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 px-4">
                  <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-2">No hay horarios disponibles para esta fecha</p>
                  <p className="text-xs text-gray-500">Intenta seleccionar otra fecha o revisa la configuración de horarios</p>
                  {availability && (
                    <div className="mt-3 text-xs text-gray-400">
                      <p>• Horarios configurados: {availability.totalSlots} espacios</p>
                      <p>• Ocupados: {availability.occupiedCount}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Selected DateTime Display */}
      {watch('dateTime') && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">
                  Fecha y hora seleccionada:
                </p>
                <p className="text-sm text-green-700">
                  {format(watch('dateTime'), 'PPP \'a las\' HH:mm', { locale: es })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointment Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="form-label" htmlFor="duration">Duración (minutos) *</label>
          <input
            type="number"
            min={15}
            max={300}
            step={15}
            className="form-input"
            {...register('duration', { valueAsNumber: true })}
          />
          {errors.duration && (
            <p className="text-sm text-red-500">{errors.duration.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="form-label" htmlFor="staffId">Veterinario</label>
          <Controller
            name="staffId"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className="form-select"
                value={field.value || ''}
              >
                <option value="">Seleccionar veterinario (opcional)</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} - {member.position}
                  </option>
                ))}
              </select>
            )}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="form-label" htmlFor="reason">Motivo de la cita *</label>
        <input
          type="text"
          className="form-input"
          placeholder="Ej: Consulta general, vacunación, revisión..."
          {...register('reason')}
        />
        {errors.reason && (
          <p className="text-sm text-red-500">{errors.reason.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="form-label" htmlFor="notes">Notas adicionales</label>
        <textarea
          className="form-input"
          placeholder="Información adicional sobre la cita..."
          rows={3}
          {...register('notes')}
        />
        {errors.notes && (
          <p className="text-sm text-red-500">{errors.notes.message}</p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting || loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || loading || !watch('dateTime')}
        >
          {(isSubmitting || loading) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {initialData ? 'Actualizar Cita' : 'Crear Cita'}
        </Button>
      </div>
    </form>
  );
}