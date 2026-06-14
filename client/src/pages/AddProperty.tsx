import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  FiHome, FiMapPin, FiPhone, FiDollarSign, 
  FiUsers, FiArrowLeft, FiCheck,
  FiAlertCircle, FiSave, FiSearch, FiNavigation, FiX, FiEdit3
} from 'react-icons/fi';

// Fix for default marker icon in Leaflet
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

// Custom marker for selected location
const selectedIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map clicks
function LocationMarker({ 
  position, 
  setPosition 
}: { 
  position: [number, number] | null; 
  setPosition: (pos: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? (
    <Marker position={position} icon={selectedIcon} />
  ) : null;
}

// Component to fly to location
function FlyToLocation({ position }: { position: [number, number] | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, { duration: 1.5 });
    }
  }, [position, map]);
  
  return null;
}

// Component for search functionality
function SearchControl({ 
  onLocationSelect 
}: { 
  onLocationSelect: (lat: number, lng: number, address: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchLocation = async () => {
    if (!query.trim()) return;
    
    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      setResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (result: any) => {
    onLocationSelect(
      parseFloat(result.lat),
      parseFloat(result.lon),
      result.display_name
    );
    setQuery(result.display_name.split(',')[0]);
    setShowResults(false);
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
            placeholder="Search location (e.g., Hitech City, Hyderabad)"
            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-emerald-500 outline-none transition-all font-semibold text-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setResults([]); setShowResults(false); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <FiX />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={searchLocation}
          disabled={searching}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {searching ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <FiSearch />
          )}
          Search
        </button>
      </div>
      
      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute z-[1000] w-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 max-h-60 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(result)}
              className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors border-b border-slate-100 last:border-b-0"
            >
              <p className="font-semibold text-slate-900 text-sm truncate">{result.display_name.split(',')[0]}</p>
              <p className="text-xs text-slate-500 truncate">{result.display_name}</p>
            </button>
          ))}
        </div>
      )}
      
      {showResults && results.length === 0 && !searching && (
        <div className="absolute z-[1000] w-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 text-center">
          <p className="text-slate-500 text-sm">No locations found. Try a different search.</p>
        </div>
      )}
    </div>
  );
}

export default function AddProperty() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // ✅ EDIT MODE DETECTION
  const editId = searchParams.get('edit');
  const isEditMode = !!editId;

  const [loading, setLoading] = useState(false);
  const [fetchingProperty, setFetchingProperty] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Map state
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]); // India center

  const [formData, setFormData] = useState({
    name: '',
    type: 'hostel',
    address: '',
    city: '',
    state: '',
    pincode: '',
    contactPhone: '',
    description: '',
    pricePerMonth: '',
    totalRooms: '',
    amenities: [] as string[]
  });

  const amenitiesList = [
    'WiFi', 'AC', 'Parking', 'Laundry', 'Mess/Food', 
    'Gym', 'Security', 'CCTV', 'Power Backup', 'Water Supply',
    'Attached Bathroom', 'Study Room', 'Common Area'
  ];

  // ✅ FETCH EXISTING PROPERTY DATA FOR EDIT MODE
  useEffect(() => {
    if (isEditMode && editId) {
      fetchPropertyData();
    }
  }, [editId, isEditMode]);

  const fetchPropertyData = async () => {
    setFetchingProperty(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/accommodations/${editId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const property = data.data;
        
        // Pre-fill form with existing data
        setFormData({
          name: property.name || '',
          type: property.type || 'hostel',
          address: property.address || '',
          city: property.city || '',
          state: property.state || '',
          pincode: property.pincode || '',
          contactPhone: property.contactPhone || '',
          description: property.description || '',
          pricePerMonth: property.pricePerMonth?.toString() || '',
          totalRooms: property.totalRooms?.toString() || '',
          amenities: property.amenities || []
        });
        
        // Set map position if coordinates exist
        if (property.latitude && property.longitude) {
          const pos: [number, number] = [property.latitude, property.longitude];
          setSelectedPosition(pos);
          setMapCenter(pos);
        }
      } else {
        setError('Failed to load property data');
      }
    } catch (err) {
      console.error('Fetch property error:', err);
      setError('Error loading property data');
    } finally {
      setFetchingProperty(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  // Handle location selection from search
  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setSelectedPosition([lat, lng]);
    setMapCenter([lat, lng]);
    
    const parts = address.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      const possibleCity = parts[0] || parts[1];
      const possibleState = parts[parts.length - 2] || '';
      
      setFormData(prev => ({
        ...prev,
        address: parts.slice(0, -2).join(', ') || address,
        city: prev.city || possibleCity,
        state: prev.state || possibleState
      }));
    }
  };

  // Handle map position change
  const handlePositionChange = async (pos: [number, number]) => {
    setSelectedPosition(pos);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos[0]}&lon=${pos[1]}`
      );
      const data = await response.json();
      
      if (data.address) {
        setFormData(prev => ({
          ...prev,
          address: data.display_name?.split(',').slice(0, 3).join(',') || prev.address,
          city: data.address.city || data.address.town || data.address.village || prev.city,
          state: data.address.state || prev.state,
          pincode: data.address.postcode || prev.pincode
        }));
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const pos: [number, number] = [position.coords.latitude, position.coords.longitude];
        setSelectedPosition(pos);
        setMapCenter(pos);
        await handlePositionChange(pos);
        setGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to get your location. Please select manually on the map.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation for required fields
    if (!selectedPosition) {
      setError('Please select a location on the map');
      return;
    }

    if (!formData.name.trim()) {
      setError('Property name is required');
      return;
    }

    if (!formData.address.trim()) {
      setError('Address is required');
      return;
    }

    if (!formData.city.trim()) {
      setError('City is required');
      return;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    if (!formData.totalRooms || parseInt(formData.totalRooms) <= 0) {
      setError('Total rooms is required (must be greater than 0)');
      return;
    }

    if (!formData.pricePerMonth || parseInt(formData.pricePerMonth) <= 0) {
      setError('Price per month is required (must be greater than 0)');
      return;
    }

    if (!formData.contactPhone.trim()) {
      setError('Contact phone is required');
      return;
    }

    setLoading(true);

    // Prepare data matching schema exactly
    const requestData = {
      name: formData.name.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      description: formData.description.trim(),
      totalRooms: parseInt(formData.totalRooms),
      pricePerMonth: parseInt(formData.pricePerMonth),
      contactPhone: formData.contactPhone.trim(),
      amenities: formData.amenities,
      latitude: selectedPosition[0],
      longitude: selectedPosition[1],
      location: {
        type: 'Point',
        coordinates: [selectedPosition[1], selectedPosition[0]] // GeoJSON: [lng, lat]
      }
    };

    console.log('Sending data:', requestData);

    try {
      const token = localStorage.getItem('token');
      
      // ✅ USE PUT FOR EDIT, POST FOR ADD
      const url = isEditMode 
        ? `${API}/api/owner/accommodations/${editId}` 
        : `${API}/api/owner/accommodations`;
      
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      console.log('Response:', data);

      if (response.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/owner/dashboard');
        }, 2000);
      } else {
        setError(data.message || `Failed to ${isEditMode ? 'update' : 'add'} property. Please check all fields.`);
      }
    } catch (err) {
      console.error('Property error:', err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ LOADING STATE FOR EDIT MODE
  if (fetchingProperty) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading property data...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white p-12 rounded-3xl shadow-xl text-center max-w-md">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheck className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">
            {isEditMode ? 'Property Updated!' : 'Property Added!'}
          </h2>
          <p className="text-slate-500 mb-6">
            {isEditMode 
              ? 'Your property has been updated successfully.' 
              : 'Your property has been registered successfully.'
            } Redirecting to dashboard...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-slate-900 text-white pt-10 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            to="/owner/dashboard" 
            className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-bold mb-8 transition-colors"
          >
            <FiArrowLeft /> Back to Dashboard
          </Link>
          {/* ✅ DYNAMIC TITLE BASED ON MODE */}
          <h1 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-3">
            {isEditMode ? (
              <>
                <FiEdit3 className="text-emerald-400" /> Edit Property
              </>
            ) : (
              <>
                <FiHome className="text-emerald-400" /> Add New Property
              </>
            )}
          </h1>
          <p className="text-slate-400 font-medium">
            {isEditMode 
              ? 'Update your property details below' 
              : 'Register your accommodation to start building trust with students'
            }
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-8 lg:p-12">
          
          {/* Error Message */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
              <FiAlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-red-700">{error}</p>
            </div>
          )}

          {/* Edit Mode Notice */}
          {isEditMode && (
            <div className="mb-8 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3">
              <FiEdit3 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-emerald-700">
                You are editing an existing property. Changes will be saved when you click "Update Property".
              </p>
            </div>
          )}

          {/* Required Fields Notice */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-sm text-blue-700">
              <span className="font-bold">Note:</span> Fields marked with <span className="text-red-500">*</span> are required
            </p>
          </div>

          {/* Basic Information */}
          <div className="mb-10">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <FiHome className="text-emerald-600" /> Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                  Property Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-semibold"
                  placeholder="e.g., Sunshine Hostel"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                  Property Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-semibold cursor-pointer"
                >
                  <option value="hostel">Hostel</option>
                  <option value="pg">PG (Paying Guest)</option>
                  <option value="apartment">Apartment</option>
                  <option value="flat">Flat</option>
                  <option value="room">Single Room</option>
                </select>
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-semibold resize-none"
                placeholder="Describe your property, facilities, rules, nearby landmarks, etc."
              />
            </div>
          </div>

          {/* Location with Map */}
          <div className="mb-10">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <FiMapPin className="text-emerald-600" /> Select Location on Map <span className="text-red-500">*</span>
            </h2>
            
            {/* Search and GPS buttons */}
            <div className="mb-4 space-y-4">
              <SearchControl onLocationSelect={handleLocationSelect} />
              
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                >
                  {gettingLocation ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FiNavigation />
                  )}
                  Use My Location
                </button>
                
                <span className="text-sm text-slate-500">
                  Or click directly on the map to select location
                </span>
              </div>
            </div>

            {/* Map Container */}
            <div className="rounded-2xl overflow-hidden border-2 border-slate-200 shadow-lg">
              <MapContainer
                center={mapCenter}
                zoom={isEditMode && selectedPosition ? 16 : 5}
                style={{ height: '400px', width: '100%' }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker position={selectedPosition} setPosition={handlePositionChange} />
                <FlyToLocation position={selectedPosition} />
              </MapContainer>
            </div>

            {/* Selected Coordinates Display */}
            {selectedPosition && (
              <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="flex items-center gap-2 text-emerald-700 font-bold mb-2">
                  <FiCheck className="text-emerald-600" />
                  Location Selected
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Latitude:</span>
                    <span className="ml-2 font-mono font-bold text-slate-900">{selectedPosition[0].toFixed(6)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Longitude:</span>
                    <span className="ml-2 font-mono font-bold text-slate-900">{selectedPosition[1].toFixed(6)}</span>
                  </div>
                </div>
              </div>
            )}

            {!selectedPosition && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <p className="text-yellow-700 text-sm font-semibold">
                  ⚠️ Please select a location on the map by clicking or using search/GPS
                </p>
              </div>
            )}

            {/* Address Fields */}
            <div className="mt-6 space-y-6">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                  Full Address <span className="text-red-500">*</span>
                </label>
                <input
                  name="address"
                  type="text"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-semibold"
                  placeholder="Building name, street, area"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="city"
                    type="text"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-semibold"
                    placeholder="e.g., Hyderabad"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">State</label>
                  <input
                    name="state"
                    type="text"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-semibold"
                    placeholder="e.g., Telangana"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">Pincode</label>
                  <input
                    name="pincode"
                    type="text"
                    value={formData.pincode}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-semibold"
                    placeholder="e.g., 500001"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="mb-10">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <FiPhone className="text-emerald-600" /> Contact Information
            </h2>
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                Contact Phone <span className="text-red-500">*</span>
              </label>
              <input
                name="contactPhone"
                type="tel"
                required
                value={formData.contactPhone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-semibold"
                placeholder="e.g., +91 9876543210"
              />
            </div>
          </div>

          {/* Pricing & Capacity */}
          <div className="mb-10">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <FiDollarSign className="text-emerald-600" /> Pricing & Capacity
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                  Price Per Month (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  name="pricePerMonth"
                  type="number"
                  required
                  min="1"
                  value={formData.pricePerMonth}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-semibold"
                  placeholder="e.g., 5000"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                  Total Rooms <span className="text-red-500">*</span>
                </label>
                <input
                  name="totalRooms"
                  type="number"
                  required
                  min="1"
                  value={formData.totalRooms}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-semibold"
                  placeholder="e.g., 20"
                />
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="mb-10">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <FiUsers className="text-emerald-600" /> Amenities (Optional)
            </h2>
            <div className="flex flex-wrap gap-3">
              {amenitiesList.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                    formData.amenities.includes(amenity)
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {formData.amenities.includes(amenity) && <FiCheck className="inline mr-1" />}
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          {/* Submit - ✅ DYNAMIC BUTTON TEXT */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={loading || !selectedPosition}
              className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {isEditMode ? 'Updating Property...' : 'Adding Property...'}
                </>
              ) : (
                <>
                  {isEditMode ? <FiEdit3 /> : <FiSave />}
                  {isEditMode ? 'Update Property' : 'Add Property'}
                </>
              )}
            </button>
            <Link
              to="/owner/dashboard"
              className="py-4 px-8 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-lg transition-all text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}