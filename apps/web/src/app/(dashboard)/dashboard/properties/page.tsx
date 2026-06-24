'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  MapPin, Plus, Pencil, Trash2,
  Loader2, Star, X, Check
} from 'lucide-react'
import { toast } from 'sonner'
import { propertiesApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/index'
import { EmptyState } from '@/components/dashboard/EmptyState'

const schema = z.object({
  label:        z.string().max(100).optional(),
  addressLine1: z.string().min(5, 'Ange fullständig gatuadress'),
  postalCode:   z.string().min(5, 'Ange postnummer'),
  city:         z.string().min(2, 'Ange stad'),
  floors:       z.coerce.number().int().min(1).default(1),
  areaSqm:      z.coerce.number().int().positive().optional(),
  entryNotes:   z.string().max(500).optional(),
  hasPets:      z.boolean().default(false),
})
type FormData = z.infer<typeof schema>

export default function PropertiesPage() {
  const [properties, setProperties] = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [editing,    setEditing]    = useState<any>(null)
  const [deleting,   setDeleting]   = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) })

  const fetchProperties = async () => {
    setLoading(true)
    try {
      const res = await propertiesApi.list()
      setProperties(res.data ?? [])
    } catch {
      toast.error('Kunde inte hämta adresser.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProperties() }, [])

  const openAdd = () => {
    setEditing(null)
    reset({ label: '', addressLine1: '', postalCode: '', city: 'Stockholm', floors: 1 })
    setShowForm(true)
  }

  const openEdit = (property: any) => {
    setEditing(property)
    reset({
      label:        property.label ?? '',
      addressLine1: property.addressLine1,
      postalCode:   property.postalCode,
      city:         property.city,
      floors:       property.floors,
      areaSqm:      property.areaSqm,
      entryNotes:   property.entryNotes ?? '',
      hasPets:      property.hasPets,
    })
    setShowForm(true)
  }

  const onSubmit = async (data: FormData) => {
    try {
      if (editing) {
        await propertiesApi.update(editing.id, data)
        toast.success('Adress uppdaterad.')
      } else {
        await propertiesApi.create(data)
        toast.success('Adress tillagd.')
      }
      setShowForm(false)
      setEditing(null)
      fetchProperties()
    } catch (err: any) {
      toast.error(err?.message ?? 'Kunde inte spara adress.')
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await propertiesApi.delete(id)
      toast.success('Adress borttagen.')
      fetchProperties()
    } catch (err: any) {
      toast.error(err?.message ?? 'Kunde inte ta bort adress.')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-neutral-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-neutral-900">Mina adresser</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {properties.length} sparade adresser
          </p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus size={14} />
          Lägg till adress
        </Button>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="bg-white border border-brand-200 rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-sans font-medium text-neutral-900">
              {editing ? 'Redigera adress' : 'Ny adress'}
            </h2>
            <button
              onClick={() => { setShowForm(false); setEditing(null) }}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="label">
                Namn på adressen{' '}
                <span className="text-neutral-400 font-normal">(valfritt)</span>
              </Label>
              <Input
                id="label"
                placeholder="t.ex. Hem, Sommarstuga"
                {...register('label')}
              />
            </div>

            <div>
              <Label htmlFor="addressLine1">Gatuadress *</Label>
              <Input
                id="addressLine1"
                placeholder="Drottninggatan 45"
                error={errors.addressLine1?.message}
                {...register('addressLine1')}
              />
              {errors.addressLine1 && (
                <p className="mt-1 text-xs text-red-500">{errors.addressLine1.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="postalCode">Postnummer *</Label>
                <Input
                  id="postalCode"
                  placeholder="111 21"
                  error={errors.postalCode?.message}
                  {...register('postalCode')}
                />
                {errors.postalCode && (
                  <p className="mt-1 text-xs text-red-500">{errors.postalCode.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="city">Stad *</Label>
                <Input
                  id="city"
                  placeholder="Stockholm"
                  error={errors.city?.message}
                  {...register('city')}
                />
                {errors.city && (
                  <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="areaSqm">
                  Area (m²){' '}
                  <span className="text-neutral-400 font-normal">(valfritt)</span>
                </Label>
                <Input
                  id="areaSqm"
                  type="number"
                  placeholder="75"
                  {...register('areaSqm')}
                />
              </div>
              <div>
                <Label htmlFor="floors">Antal våningar</Label>
                <Input
                  id="floors"
                  type="number"
                  min="1"
                  {...register('floors')}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="entryNotes">
                Instrukioner{' '}
                <span className="text-neutral-400 font-normal">(valfritt)</span>
              </Label>
              <Input
                id="entryNotes"
                placeholder="t.ex. portkod 1234, ring på 3 ringen"
                {...register('entryNotes')}
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="hasPets"
                className="w-4 h-4 rounded border-neutral-300 text-brand-600 accent-brand-600"
                {...register('hasPets')}
              />
              <Label htmlFor="hasPets" className="mb-0 cursor-pointer">
                Det finns husdjur på adressen
              </Label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowForm(false); setEditing(null) }}
              >
                Avbryt
              </Button>
              <Button type="submit" loading={isSubmitting} className="flex-1">
                <Check size={14} />
                {editing ? 'Spara ändringar' : 'Spara adress'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Properties list */}
      {properties.length === 0 && !showForm ? (
        <EmptyState
          icon={MapPin}
          title="Inga adresser sparade"
          description="Lägg till din hemadress så kan du boka städning snabbare nästa gång."
          action={{ label: 'Lägg till adress', onClick: openAdd }}
        />
      ) : (
        <div className="space-y-3">
          {properties.map((property) => (
            <div
              key={property.id}
              className="bg-white border border-neutral-200 rounded-xl p-5 flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                <MapPin size={18} className="text-brand-600" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-neutral-900">
                    {property.label ?? property.addressLine1}
                  </p>
                  {property.isPrimary && (
                    <span className="inline-flex items-center gap-1 text-2xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                      <Star size={9} className="fill-amber-500 text-amber-500" />
                      Primär
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500">
                  {property.addressLine1}, {property.postalCode} {property.city}
                </p>
                <div className="flex gap-3 mt-1.5">
                  {property.areaSqm && (
                    <span className="text-xs text-neutral-400">{property.areaSqm} m²</span>
                  )}
                  {property.floors > 1 && (
                    <span className="text-xs text-neutral-400">{property.floors} våningar</span>
                  )}
                  {property.hasPets && (
                    <span className="text-xs text-neutral-400">🐾 Husdjur</span>
                  )}
                  {property.entryNotes && (
                    <span className="text-xs text-neutral-400 truncate max-w-[200px]">
                      📝 {property.entryNotes}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEdit(property)}
                  className="p-2 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                  title="Redigera"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDelete(property.id)}
                  disabled={deleting === property.id}
                  className="p-2 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="Ta bort"
                >
                  {deleting === property.id
                    ? <Loader2 size={15} className="animate-spin" />
                    : <Trash2 size={15} />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
