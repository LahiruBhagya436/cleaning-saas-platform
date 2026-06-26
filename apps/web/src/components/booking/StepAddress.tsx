'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Plus, MapPin, Check } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/index'
import { propertiesApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { BookingData } from '@/app/book/page'

const newAddressSchema = z.object({
  addressLine1: z.string().min(5, 'Ange fullständig gatuadress'),
  postalCode:   z.string().min(5, 'Ange postnummer').max(10),
  city:         z.string().min(2, 'Ange stad'),
  notes:        z.string().max(500).optional(),
})
type NewAddressForm = z.infer<typeof newAddressSchema>

interface Props {
  data:    BookingData
  update:  (p: Partial<BookingData>) => void
  onNext:  () => void
  onBack:  () => void
  session: any
}

export function StepAddress({ data, update, onNext, onBack, session }: Props) {
  const [properties, setProperties] = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [saving,     setSaving]     = useState(false)

  const { register, handleSubmit, formState: { errors } } =
    useForm<NewAddressForm>({ resolver: zodResolver(newAddressSchema) })

  useEffect(() => {
    if (!session) { setLoading(false); return }
    propertiesApi.list()
      .then((res) => {
        setProperties(res.data ?? [])
        if (res.data?.length === 0) setShowForm(true)
      })
      .catch((err) => {
        console.error('Failed to load properties:', err)
        setShowForm(true)
      })
      .finally(() => setLoading(false))
  }, [session])

  const selectProperty = (p: any) => {
    update({
      propertyId:  p.id,
      addressLine1:p.addressLine1,
      city:        p.city,
      postalCode:  p.postalCode,
    })
  }

  const saveAndSelect = async (form: NewAddressForm) => {
    setSaving(true)
    try {
      const res = await propertiesApi.create({
        addressLine1: form.addressLine1,
        postalCode:   form.postalCode,
        city:         form.city,
      })
      const prop = res.data
      setProperties((prev) => [...prev, prop])
      update({
        propertyId:  prop.id,
        addressLine1:prop.addressLine1,
        city:        prop.city,
        postalCode:  prop.postalCode,
        notes:       form.notes ?? '',
      })
      setShowForm(false)
    } catch {
      // If not logged in, just store locally
      update({
        propertyId:  'local',
        addressLine1:form.addressLine1,
        city:        form.city,
        postalCode:  form.postalCode,
        notes:       form.notes ?? '',
      })
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  const canContinue = !!data.propertyId

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-20 bg-neutral-100 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="font-sans font-medium text-neutral-900">
        Välj städadress
      </h2>

      {/* Saved properties */}
      {properties.length > 0 && (
        <div className="space-y-3">
          {properties.map((p) => {
            const isSelected = data.propertyId === p.id
            return (
              <button
                key={p.id}
                onClick={() => selectProperty(p)}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all',
                  isSelected
                    ? 'border-brand-400 bg-brand-50 ring-2 ring-brand-100'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                  isSelected ? 'bg-brand-100' : 'bg-neutral-100'
                )}>
                  <MapPin size={18} className={isSelected ? 'text-brand-600' : 'text-neutral-500'} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900">
                    {p.label ?? p.addressLine1}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {p.addressLine1}, {p.postalCode} {p.city}
                  </p>
                </div>
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                  isSelected ? 'border-brand-600 bg-brand-600' : 'border-neutral-300'
                )}>
                  {isSelected && <Check size={11} className="text-white" strokeWidth={3} />}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Add new address button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center gap-3 p-4 rounded-xl border border-dashed border-neutral-300 text-neutral-500 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all"
        >
          <Plus size={18} />
          <span className="text-sm font-medium">Lägg till ny adress</span>
        </button>
      )}

      {/* New address form */}
      {showForm && (
        <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-medium text-neutral-900">Ny adress</h3>

          <form onSubmit={handleSubmit(saveAndSelect)} className="space-y-4">
            <div>
              <Label htmlFor="addressLine1">Gatuadress</Label>
              <Input
                id="addressLine1"
                placeholder="Drottninggatan 45"
                {...register('addressLine1')}
                error={errors.addressLine1?.message}
              />
              {errors.addressLine1 && (
                <p className="mt-1 text-xs text-red-500">{errors.addressLine1.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="postalCode">Postnummer</Label>
                <Input
                  id="postalCode"
                  placeholder="111 21"
                  {...register('postalCode')}
                  error={errors.postalCode?.message}
                />
                {errors.postalCode && (
                  <p className="mt-1 text-xs text-red-500">{errors.postalCode.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="city">Stad</Label>
                <Input
                  id="city"
                  placeholder="Stockholm"
                  {...register('city')}
                  error={errors.city?.message}
                />
                {errors.city && (
                  <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="notes">
                Anteckningar{' '}
                <span className="text-neutral-400 font-normal">(valfritt)</span>
              </Label>
              <Input
                id="notes"
                placeholder="T.ex. portkod 1234, 3:e våning"
                {...register('notes')}
              />
            </div>

            <div className="flex gap-2">
              {properties.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(false)}
                >
                  Avbryt
                </Button>
              )}
              <Button type="submit" size="sm" loading={saving} className="flex-1">
                Spara adress
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Notes for selected property */}
      {canContinue && !showForm && (
        <div>
          <Label htmlFor="booking-notes">
            Övriga önskemål{' '}
            <span className="text-neutral-400 font-normal">(valfritt)</span>
          </Label>
          <Input
            id="booking-notes"
            placeholder="T.ex. allergiker, husdjur, speciella instruktioner"
            value={data.notes}
            onChange={(e) => update({ notes: e.target.value })}
          />
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft size={16} />
          Tillbaka
        </Button>
        <Button
          className="flex-1 group"
          size="lg"
          disabled={!canContinue}
          onClick={onNext}
        >
          Fortsätt — välj datum
          <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </div>
    </div>
  )
}
