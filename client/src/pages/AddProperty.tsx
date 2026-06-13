import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  MapPin,
  Building2,
  Save,
  ArrowLeft,
  Loader2,
  Upload,
  X,
  Plus,
  Phone,
  DollarSign,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollReveal, FadeIn } from '@/components/ParallaxEffect';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// --- Zod Schema ---

const propertySchema = z.object({
  name: z.string().min(2, 'Property name must be at least 2 characters'),
  type: z.enum(['hostel', 'pg', 'apartment', 'other'], {
    required_error: 'Please select a property type',
  }),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City is required'),
  area: z.string().min(2, 'Area / locality is required'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  contactPhone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number is too long'),
  monthlyRent: z
    .string()
    .min(1, 'Monthly rent is required')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Rent must be a positive number'),
  roomTypes: z.array(z.string()).min(1, 'Select at least one room type'),
});

type PropertyFormData = z.infer<typeof propertySchema>;

// --- Constants ---

const PROPERTY_TYPES = [
  { value: 'hostel', label: 'Hostel' },
  { value: 'pg', label: 'Paying Guest (PG)' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'other', label: 'Other' },
];

const ROOM_TYPE_OPTIONS = ['Single', 'Double', 'Triple', 'Dormitory', 'Studio', '1BHK', '2BHK', '3BHK'];

// Default center: Hyderabad
const DEFAULT_CENTER: [number, number] = [17.385, 78.4867];

// Custom marker icon (fixes default Leaflet icon path issue in bundlers)
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// --- Map Click Handler ---

interface MapClickHandlerProps {
  onLocationSelect: (lat: number, lng: number) => void;
}

function MapClickHandler({ onLocationSelect }: MapClickHandlerProps) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// --- Main Component ---

export default function AddProperty() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuthStore();
  const editId = searchParams.get('edit');

  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingProperty, setLoadingProperty] = useState(!!editId);
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<string[]>([]);

  const isEditMode = Boolean(editId);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: '',
      type: undefined,
      address: '',
      city: '',
      area: '',
      description: '',
      contactPhone: '',
      monthlyRent: '',
      roomTypes: [],
    },
  });

  // Fetch existing property in edit mode
  useEffect(() => {
    if (!editId) return;
    setLoadingProperty(true);
    fetch(`${API}/api/owner/properties/${editId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        const prop = json.data || json;
        reset({
          name: prop.name || '',
          type: prop.type || undefined,
          address: prop.address || '',
          city: prop.city || '',
          area: prop.area || '',
          description: prop.description || '',
          contactPhone: prop.contactPhone || '',
          monthlyRent: prop.monthlyRent != null ? String(prop.monthlyRent) : '',
          roomTypes: prop.roomTypes || [],
        });
        setSelectedRoomTypes(prop.roomTypes || []);
        if (prop.location?.coordinates) {
          // GeoJSON stores [lng, lat]
          setMarkerPosition([prop.location.coordinates[1], prop.location.coordinates[0]]);
        }
      })
      .catch(() => toast.error('Failed to load property data'))
      .finally(() => setLoadingProperty(false));
  }, [editId, token, reset]);

  // Sync roomTypes into form whenever selection changes
  useEffect(() => {
    setValue('roomTypes', selectedRoomTypes, { shouldValidate: true });
  }, [selectedRoomTypes, setValue]);

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setMarkerPosition([lat, lng]);
  }, []);

  const toggleRoomType = (rt: string) => {
    setSelectedRoomTypes((prev) =>
      prev.includes(rt) ? prev.filter((r) => r !== rt) : [...prev, rt]
    );
  };

  const onSubmit = async (data: PropertyFormData) => {
    if (!markerPosition) {
      toast.error('Please click on the map to set the property location');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...data,
        monthlyRent: Number(data.monthlyRent),
        location: {
          type: 'Point',
          coordinates: [markerPosition[1], markerPosition[0]], // GeoJSON: [lng, lat]
        },
      };

      const url = isEditMode
        ? `${API}/api/owner/properties/${editId}`
        : `${API}/api/owner/properties`;

      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || 'Failed to save property');
      }

      toast.success(isEditMode ? 'Property updated successfully' : 'Property created successfully');
      navigate('/owner/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Loading state ---
  if (loadingProperty) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <span className="ml-3 text-slate-500">Loading property...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <button
          onClick={() => navigate('/owner/dashboard')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-slate-900">
          {isEditMode ? 'Edit Property' : 'Add New Property'}
        </h1>
        <p className="text-slate-500 mt-1">
          {isEditMode
            ? 'Update your property details below'
            : 'List your accommodation on SafeStay and reach verified students'}
        </p>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ---- Basic Info Card ---- */}
        <ScrollReveal>
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <Building2 className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-slate-900">Basic Information</h2>
            </div>
            <div className="space-y-5">
              {/* Property Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Property Name
                </label>
                <Input
                  placeholder="e.g. Sunshine Hostels, Green PG"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* Property Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Property Type
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PROPERTY_TYPES.map((pt) => (
                    <button
                      key={pt.value}
                      type="button"
                      onClick={() => setValue('type', pt.value as any, { shouldValidate: true })}
                      className={cn(
                        'rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all',
                        watch('type') === pt.value
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      )}
                    >
                      {pt.label}
                    </button>
                  ))}
                </div>
                {errors.type && (
                  <p className="mt-1 text-xs text-red-500">{errors.type.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  placeholder="Describe your property -- amenities, rules, nearby landmarks..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
                )}
              </div>
            </div>
          </Card>
        </ScrollReveal>

        {/* ---- Location Card ---- */}
        <ScrollReveal delay={100}>
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <MapPin className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-slate-900">Location</h2>
            </div>
            <div className="space-y-5">
              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Street Address
                </label>
                <Input
                  placeholder="Full street address"
                  {...register('address')}
                />
                {errors.address && (
                  <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    City
                  </label>
                  <Input
                    placeholder="e.g. Hyderabad"
                    {...register('city')}
                  />
                  {errors.city && (
                    <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>
                  )}
                </div>

                {/* Area */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Area / Locality
                  </label>
                  <Input
                    placeholder="e.g. Madhapur, Kondapur"
                    {...register('area')}
                  />
                  {errors.area && (
                    <p className="mt-1 text-xs text-red-500">{errors.area.message}</p>
                  )}
                </div>
              </div>

              {/* Map Picker */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Pin Location on Map
                </label>
                <p className="text-xs text-slate-400 mb-2">
                  Click on the map to set the exact location of your property
                </p>
                <div className="rounded-xl overflow-hidden border border-slate-200" style={{ height: 320 }}>
                  <MapContainer
                    center={markerPosition || DEFAULT_CENTER}
                    zoom={markerPosition ? 15 : 12}
                    className="w-full h-full"
                    style={{ height: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapClickHandler onLocationSelect={handleLocationSelect} />
                    {markerPosition && (
                      <Marker position={markerPosition} icon={markerIcon} />
                    )}
                  </MapContainer>
                </div>
                {markerPosition && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    <span>
                      Location set: {markerPosition[0].toFixed(5)}, {markerPosition[1].toFixed(5)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </ScrollReveal>

        {/* ---- Contact & Pricing Card ---- */}
        <ScrollReveal delay={200}>
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <Phone className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-slate-900">Contact & Pricing</h2>
            </div>
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* Contact Phone */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Contact Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="10-digit phone number"
                      className="pl-10"
                      {...register('contactPhone')}
                    />
                  </div>
                  {errors.contactPhone && (
                    <p className="mt-1 text-xs text-red-500">{errors.contactPhone.message}</p>
                  )}
                </div>

                {/* Monthly Rent */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Monthly Rent (INR)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="e.g. 8000"
                      className="pl-10"
                      type="number"
                      min={0}
                      {...register('monthlyRent')}
                    />
                  </div>
                  {errors.monthlyRent && (
                    <p className="mt-1 text-xs text-red-500">{errors.monthlyRent.message}</p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </ScrollReveal>

        {/* ---- Room Types Card ---- */}
        <ScrollReveal delay={300}>
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <FileText className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-slate-900">Room Types</h2>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Select all room types available at your property
            </p>
            <div className="flex flex-wrap gap-2">
              {ROOM_TYPE_OPTIONS.map((rt) => {
                const active = selectedRoomTypes.includes(rt);
                return (
                  <button
                    key={rt}
                    type="button"
                    onClick={() => toggleRoomType(rt)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all',
                      active
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    )}
                  >
                    {active && <CheckCircle className="h-3.5 w-3.5" />}
                    {!active && <Plus className="h-3.5 w-3.5" />}
                    {rt}
                  </button>
                );
              })}
            </div>
            {selectedRoomTypes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {selectedRoomTypes.map((rt) => (
                  <span
                    key={rt}
                    className="inline-flex items-center gap-1 rounded-full bg-primary-100 text-primary-700 px-2.5 py-0.5 text-xs font-semibold"
                  >
                    {rt}
                    <button
                      type="button"
                      onClick={() => toggleRoomType(rt)}
                      className="hover:text-primary-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {errors.roomTypes && (
              <p className="mt-2 text-xs text-red-500">{errors.roomTypes.message}</p>
            )}
          </Card>
        </ScrollReveal>

        {/* ---- Actions ---- */}
        <FadeIn delay={400}>
          <div className="flex items-center justify-between pt-2 pb-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/owner/dashboard')}
              disabled={submitting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="min-w-[160px]">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditMode ? 'Update Property' : 'Create Property'}
                </>
              )}
            </Button>
          </div>
        </FadeIn>
      </form>
    </div>
  );
}
