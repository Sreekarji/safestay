import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { FiSearch, FiX, FiNavigation, FiMapPin, FiClock, FiZap } from 'react-icons/fi';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

L.Marker.prototype.options.icon = DefaultIcon;

function createColoredIcon(color: string) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
}

const searchIcon = L.divIcon({
  className: 'search-marker',
  html: `<div style="
    background-color: #3b82f6;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 4px solid white;
    box-shadow: 0 2px 8px rgba(59,130,246,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <div style="
      width: 8px;
      height: 8px;
      background: white;
      border-radius: 50%;
    "></div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

const greenIcon = createColoredIcon('#22c55e');
const yellowIcon = createColoredIcon('#eab308');
const redIcon = createColoredIcon('#ef4444');

interface Accommodation {
  _id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  totalReports?: number;
  type?: string;
  trustScore?: number;
  trustScoreLabel?: string;
  trustScoreColor?: string;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface AccommodationMapProps {
  accommodations?: Accommodation[];
}

// Component to move map to searched location
const FlyToLocation: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
};

// Calculate distance between two coordinates in km
const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const COLLEGES: { name: string; lat: number; lng: number }[] = [
  { name: 'IIT Hyderabad', lat: 17.5933, lng: 78.1256 },
  { name: 'IIIT Hyderabad', lat: 17.4456, lng: 78.3496 },
  { name: 'NIT Warangal', lat: 17.9840, lng: 79.5580 },
  { name: 'Osmania University', lat: 17.4126, lng: 78.5280 },
  { name: 'JNTU Hyderabad', lat: 17.4932, lng: 78.3910 },
  { name: 'BITS Pilani Hyderabad', lat: 17.5449, lng: 78.5716 },
  { name: 'University of Hyderabad', lat: 17.4575, lng: 78.3287 },
  { name: 'BITS Hyderabad', lat: 17.5449, lng: 78.5716 },
  { name: 'VIT Vellore', lat: 12.9716, lng: 79.1593 },
  { name: 'SRM Chennai', lat: 12.8231, lng: 80.0452 },
  { name: 'Manipal Academy', lat: 13.3525, lng: 74.7906 },
];

const AccommodationMap: React.FC<AccommodationMapProps> = ({ accommodations: propAccommodations }) => {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const navigate = useNavigate();
  const [accommodations, setAccommodations] = useState<Accommodation[]>(propAccommodations || []);
  const [loading, setLoading] = useState(!propAccommodations);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchedLocation, setSearchedLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [nearbyRadius, setNearbyRadius] = useState(5); // km
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Map center state
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [mapZoom, setMapZoom] = useState(13);

  // Route Intelligence & Safety History states
  const [mapMode, setMapMode] = useState<'safety-history' | 'route-intelligence'>('safety-history');
  const [timelineMonth, setTimelineMonth] = useState(0);
  const [routeAccId, setRouteAccId] = useState('');
  const [routeCollege, setRouteCollege] = useState('');

  useEffect(() => {
    if (!propAccommodations) {
      fetchAccommodations();
    }
  }, [propAccommodations]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAccommodations = async () => {
    try {
      const response = await fetch(`${API}/api/accommodations/with-location`);
      const data = await response.json();
      if (data.success) {
        setAccommodations(data.data);
      }
    } catch (err) {
      console.error('Error fetching accommodations for map');
    } finally {
      setLoading(false);
    }
  };

  // Search location using OpenStreetMap Nominatim API (FREE)
  const searchLocation = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'StudentAccommodationSafetyPlatform/1.0'
          }
        }
      );
      const data = await response.json();
      setSearchResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search - waits 500ms after user stops typing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(value);
    }, 500);
  };

  // When user selects a search result
  const handleSelectLocation = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    setSearchedLocation({ lat, lng, name: result.display_name });
    setMapCenter([lat, lng]);
    setMapZoom(14);
    setShowResults(false);
    setSearchQuery(result.display_name.split(',')[0]); // Show short name
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setSearchedLocation(null);
    setMapCenter(null);
    setMapZoom(13);
  };

  // Use browser's geolocation
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setSearchedLocation({ lat: latitude, lng: longitude, name: 'Your Location' });
        setMapCenter([latitude, longitude]);
        setMapZoom(14);
        setSearchQuery('My Location');
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to get your location. Please allow location access.');
      }
    );
  };

  const getMarkerIcon = (acc: Accommodation) => {
    const score = acc.trustScore ?? 100;
    if (score >= 80) return greenIcon;
    if (score >= 50) return yellowIcon;
    return redIcon;
  };

  const getStatusLabel = (acc: Accommodation) => {
    const score = acc.trustScore ?? 100;
    if (score >= 80) return { text: `Safe (${score})`, color: 'text-green-600' };
    if (score >= 50) return { text: `Caution (${score})`, color: 'text-yellow-600' };
    return { text: `Unsafe (${score})`, color: 'text-red-600' };
  };

  const mappableAccommodations = (accommodations || []).filter(
    acc => acc.latitude && acc.longitude && acc.latitude !== 0 && acc.longitude !== 0
  );

  // Filter nearby accommodations if a location is searched
  const nearbyAccommodations = searchedLocation
    ? mappableAccommodations
        .map(acc => ({
          ...acc,
          distance: getDistanceKm(searchedLocation.lat, searchedLocation.lng, acc.latitude!, acc.longitude!)
        }))
        .filter(acc => acc.distance <= nearbyRadius)
        .sort((a, b) => a.distance - b.distance)
    : mappableAccommodations;

  // Route intelligence computed values
  const selectedRouteAcc = mappableAccommodations.find(a => a._id === routeAccId);
  const selectedCollege = routeCollege !== '' ? COLLEGES[parseInt(routeCollege)] : null;
  const routeDistance = selectedRouteAcc && selectedCollege
    ? getDistanceKm(selectedRouteAcc.latitude!, selectedRouteAcc.longitude!, selectedCollege.lat, selectedCollege.lng)
    : null;
  const routeScore = selectedRouteAcc?.trustScore ?? 100;
  const routeColor = routeScore >= 80 ? '#22c55e' : routeScore >= 50 ? '#eab308' : '#ef4444';
  const routeTravelMin = routeDistance ? Math.round(routeDistance / 0.5) : null;
  const routeNightSafety = routeScore >= 80 ? 'Very Safe' : routeScore >= 50 ? 'Moderate' : 'Not Recommended';

  const defaultCenter: [number, number] = [17.385, 78.4867];

  const center: [number, number] = mapCenter || (
    mappableAccommodations.length > 0
      ? [
          mappableAccommodations.reduce((sum, a) => sum + (a.latitude || 0), 0) / mappableAccommodations.length,
          mappableAccommodations.reduce((sum, a) => sum + (a.longitude || 0), 0) / mappableAccommodations.length
        ]
      : defaultCenter
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96 bg-gray-50 rounded-xl">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">🗺️ Accommodation Map</h2>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span> Safe
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span> Caution
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> Unsafe
          </span>
          {searchedLocation && (
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span> Searched
            </span>
          )}
        </div>
      </div>

      {/* Mode Toggle: Safety History / Route Intelligence */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMapMode('safety-history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            mapMode === 'safety-history' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <FiClock /> Safety History
        </button>
        <button
          onClick={() => setMapMode('route-intelligence')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            mapMode === 'route-intelligence' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <FiZap /> Route Intelligence
        </button>
      </div>

      {/* Safety History Mode: Timeline Slider */}
      {mapMode === 'safety-history' && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-4">
            <FiClock className="text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <input
                type="range"
                min={0}
                max={11}
                value={timelineMonth}
                onChange={(e) => setTimelineMonth(parseInt(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>12 months ago</span>
                <span className="font-bold text-blue-600">
                  {(() => {
                    const d = new Date();
                    d.setMonth(d.getMonth() - (11 - timelineMonth));
                    return d.toLocaleString('default', { month: 'short', year: 'numeric' });
                  })()}
                </span>
                <span>Now</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Showing historical safety context for {(() => {
              const d = new Date();
              d.setMonth(d.getMonth() - (11 - timelineMonth));
              return d.toLocaleString('default', { month: 'long', year: 'numeric' });
            })()}
          </p>
        </div>
      )}

      {/* Route Intelligence Mode: Dropdowns & Info */}
      {mapMode === 'route-intelligence' && (
        <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <select
              value={routeAccId}
              onChange={(e) => setRouteAccId(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Accommodation...</option>
              {mappableAccommodations.map(acc => (
                <option key={acc._id} value={acc._id}>{acc.name}</option>
              ))}
            </select>
            <select
              value={routeCollege}
              onChange={(e) => setRouteCollege(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select College...</option>
              {COLLEGES.map((c, i) => (
                <option key={i} value={i.toString()}>{c.name}</option>
              ))}
            </select>
          </div>
          {routeDistance !== null && selectedRouteAcc && selectedCollege && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xs font-bold text-blue-600 uppercase">Distance</p>
                <p className="text-lg font-black text-blue-900">{routeDistance.toFixed(1)} km</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-xs font-bold text-green-600 uppercase">Travel Time</p>
                <p className="text-lg font-black text-green-900">~{routeTravelMin} min</p>
              </div>
              <div className={`rounded-lg p-3 text-center ${routeScore >= 80 ? 'bg-green-50' : routeScore >= 50 ? 'bg-yellow-50' : 'bg-red-50'}`}>
                <p className={`text-xs font-bold uppercase ${routeScore >= 80 ? 'text-green-600' : routeScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>Route Safety</p>
                <p className={`text-lg font-black ${routeScore >= 80 ? 'text-green-900' : routeScore >= 50 ? 'text-yellow-900' : 'text-red-900'}`}>{routeScore}/100</p>
              </div>
              <div className={`rounded-lg p-3 text-center ${routeScore >= 80 ? 'bg-emerald-50' : routeScore >= 50 ? 'bg-amber-50' : 'bg-red-50'}`}>
                <p className={`text-xs font-bold uppercase ${routeScore >= 80 ? 'text-emerald-600' : routeScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>Night Safety</p>
                <p className={`text-sm font-black ${routeScore >= 80 ? 'text-emerald-900' : routeScore >= 50 ? 'text-amber-900' : 'text-red-900'}`}>{routeNightSafety}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 relative" ref={searchContainerRef}>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search location (e.g., Nampally, Hyderabad, Ameerpet...)"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FiX className="h-4 w-4" />
                </button>
              )}
              {searchLoading && (
                <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectLocation(result)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 flex items-start gap-2"
                  >
                    <FiMapPin className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 line-clamp-2">{result.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Use My Location Button */}
          <button
            onClick={handleUseMyLocation}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap text-sm font-medium"
          >
            <FiNavigation className="h-4 w-4" />
            My Location
          </button>

          {/* Radius Selector */}
          {searchedLocation && (
            <select
              value={nearbyRadius}
              onChange={(e) => setNearbyRadius(parseInt(e.target.value))}
              className="px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value={2}>Within 2 km</option>
              <option value={5}>Within 5 km</option>
              <option value={10}>Within 10 km</option>
              <option value={20}>Within 20 km</option>
              <option value={50}>Within 50 km</option>
            </select>
          )}
        </div>

        {/* Search Info Bar */}
        {searchedLocation && (
          <div className="mt-3 flex items-center justify-between bg-blue-50 px-4 py-2 rounded-lg">
            <div className="flex items-center gap-2">
              <FiMapPin className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                <strong>{nearbyAccommodations.length}</strong> accommodation{nearbyAccommodations.length !== 1 ? 's' : ''} found 
                within <strong>{nearbyRadius} km</strong> of <strong>{searchedLocation.name.split(',')[0]}</strong>
              </span>
            </div>
            <button
              onClick={clearSearch}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Nearby Accommodations List (when searched) */}
      {searchedLocation && nearbyAccommodations.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            📍 Nearby Accommodations (sorted by distance)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {nearbyAccommodations.map((acc: any) => {
              const status = getStatusLabel(acc);
              return (
                <div
                  key={acc._id}
                  onClick={() => navigate(`/accommodations/${acc._id}`)}
                  className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md cursor-pointer transition-all"
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium text-gray-900 text-sm">{acc.name}</h4>
                    <span className={`text-xs font-semibold ${status.color}`}>
                      {acc.trustScore ?? 100}
                    </span>
                  </div>
                  {acc.address && (
                    <p className="text-xs text-gray-500 mb-1">📍 {acc.address}{acc.city ? `, ${acc.city}` : ''}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {acc.distance.toFixed(1)} km away
                    </span>
                    <span className="text-xs text-gray-400">
                      {acc.totalReports || 0} reports
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No Results Message */}
      {searchedLocation && nearbyAccommodations.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
          <p className="text-amber-700 font-medium">No accommodations found within {nearbyRadius} km</p>
          <p className="text-amber-600 text-sm mt-1">
            Try increasing the search radius or searching a different location.
          </p>
        </div>
      )}

      {/* Map */}
      {mappableAccommodations.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center border-2 border-dashed border-gray-200">
          <span className="text-4xl mb-3 block">🗺️</span>
          <p className="text-gray-500 font-medium">No accommodations with location data yet.</p>
          <p className="text-gray-400 text-sm mt-1">Owners can add locations from their dashboard.</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg" style={{ height: '500px' }}>
          <MapContainer
            center={center}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Fly to searched location */}
            {mapCenter && <FlyToLocation center={mapCenter} zoom={mapZoom} />}

            {/* Route Intelligence Polyline */}
            {mapMode === 'route-intelligence' && selectedRouteAcc && selectedCollege && (
              <Polyline
                positions={[
                  [selectedRouteAcc.latitude!, selectedRouteAcc.longitude!],
                  [selectedCollege.lat, selectedCollege.lng]
                ]}
                pathOptions={{ color: routeColor, weight: 4, dashArray: '10 8', opacity: 0.8 }}
              />
            )}

            {/* Searched location marker */}
            {searchedLocation && (
              <Marker
                position={[searchedLocation.lat, searchedLocation.lng]}
                icon={searchIcon}
              >
                <Popup>
                  <div className="p-1">
                    <h3 className="font-bold text-blue-900 text-sm mb-1">📍 Searched Location</h3>
                    <p className="text-gray-600 text-xs">{searchedLocation.name}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Accommodation markers */}
            {(searchedLocation ? nearbyAccommodations : mappableAccommodations).map((acc) => {
              const status = getStatusLabel(acc);
              return (
                <Marker
                  key={acc._id}
                  position={[acc.latitude!, acc.longitude!]}
                  icon={getMarkerIcon(acc)}
                >
                  <Popup>
                    <div className="p-1 min-w-[200px]">
                      <h3 className="font-bold text-gray-900 text-base mb-1">{acc.name}</h3>
                      {acc.address && (
                        <p className="text-gray-500 text-xs mb-1">📍 {acc.address}</p>
                      )}
                      {acc.type && (
                        <p className="text-gray-500 text-xs mb-1">🏠 {acc.type}</p>
                      )}
                      {'distance' in acc && (
                        <p className="text-blue-500 text-xs mb-1">
                          📏 {(acc as any).distance.toFixed(1)} km from searched location
                        </p>
                      )}
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-semibold text-sm ${status.color}`}>
                          {status.text}
                        </span>
                        <span className="text-xs text-gray-400">
                          {acc.totalReports || 0} reports
                        </span>
                      </div>
                      <button
                        onClick={() => navigate(`/accommodations/${acc._id}`)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3 rounded transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        {searchedLocation
          ? `${nearbyAccommodations.length} accommodations within ${nearbyRadius} km shown on map`
          : `${mappableAccommodations.length} accommodations shown on map`
        }
      </p>
    </div>
  );
};

export default AccommodationMap;
