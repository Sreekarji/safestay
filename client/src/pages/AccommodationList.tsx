import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiSearch, FiMapPin, FiShield, FiAlertTriangle, FiTrendingUp, 
  FiMap, FiList, FiGrid, FiArrowRight, FiCheckCircle, FiAlertCircle, FiXCircle, FiHome, FiTool
} from 'react-icons/fi';
import AccommodationMap from '../components/AccommodationMap';
import { 
  ScrollReveal, 
  StaggerReveal, 
  FadeIn,
  ScaleIn 
} from '../components/ParallaxEffect';

export const AccommodationList: React.FC = () => {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [accommodations, setAccommodations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showMap, setShowMap] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchAccommodations();
  }, []);

  const fetchAccommodations = async () => {
    try {
      const response = await fetch(`${API}/api/accommodations`);
      const data = await response.json();
      if (data.success) {
        setAccommodations(data.data);
      } else {
        setError('Failed to load accommodations');
      }
    } catch {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const filteredAccommodations = (accommodations || []).filter(acc => {
    const matchesSearch = !searchTerm || 
      acc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    if (selectedFilter === 'safe') matchesFilter = (acc.trustScore >= 80);
    else if (selectedFilter === 'caution') matchesFilter = (acc.trustScore >= 50 && acc.trustScore < 80);
    else if (selectedFilter === 'avoid') matchesFilter = (acc.trustScore < 50);

    return matchesSearch && matchesFilter;
  });

  const getScoreBadge = (score: number) => {
    if (score >= 80) return (
      <div className="bg-green-100 text-green-700 px-3 py-1 rounded-xl font-bold inline-flex items-center gap-1.5 text-sm">
        <FiShield className="text-xs" /> {score} - Safe
      </div>
    );
    if (score >= 50) return (
      <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-xl font-bold inline-flex items-center gap-1.5 text-sm">
        <FiAlertCircle className="text-xs" /> {score} - Caution
      </div>
    );
    return (
      <div className="bg-red-100 text-red-700 px-3 py-1 rounded-xl font-bold inline-flex items-center gap-1.5 text-sm">
        <FiXCircle className="text-xs" /> {score} - Avoid
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 font-medium">Finding safe accommodations...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal delay={0} distance={30}>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-white">
              Find Safe Accommodations
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={100} distance={20}>
            <p className="mt-4 text-lg text-blue-200 max-w-2xl">
              Search verified properties with transparent safety ratings and real student feedback.
            </p>
          </ScrollReveal>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
        {/* Search and Filters Card */}
        <ScrollReveal delay={0} distance={40}>
          <div className="bg-white rounded-3xl shadow-xl p-6 lg:p-8 mb-8 border border-gray-100 relative z-10">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Search Input */}
              <div className="flex-grow relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by name, location, or city..."
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-700 placeholder-gray-400 font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filter Pills & View Toggles */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex gap-2 flex-wrap bg-gray-50 p-1 rounded-2xl border border-gray-100">
                  <StaggerReveal stagger={50}>
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'safe', label: '🟢 Safe (80+)' },
                      { id: 'caution', label: '🟡 Caution (50-79)' },
                      { id: 'avoid', label: '🔴 Avoid (<50)' }
                    ].map(filter => (
                      <button
                        key={filter.id}
                        onClick={() => setSelectedFilter(filter.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                          selectedFilter === filter.id
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </StaggerReveal>
                </div>

                <div className="h-8 w-[1px] bg-gray-200 hidden lg:block mx-2"></div>

                <FadeIn delay={200}>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                      title="Grid View"
                    >
                      <FiGrid className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                      title="List View"
                    >
                      <FiList className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setShowMap(!showMap)}
                      className={`p-3 rounded-xl transition-all ${showMap ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                      title="Map View"
                    >
                      <FiMap className="h-5 w-5" />
                    </button>
                  </div>
                </FadeIn>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-gray-50">
              <FadeIn delay={100}>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                  Showing <span className="text-blue-600">{filteredAccommodations.length}</span> verified accommodations
                </p>
              </FadeIn>
            </div>
          </div>
        </ScrollReveal>

        {/* Map Section */}
        {showMap && (
          <ScrollReveal delay={0} direction="down" distance={30}>
            <div className="mb-8 rounded-3xl shadow-xl border-4 border-white overflow-hidden h-[500px]">
              <AccommodationMap />
            </div>
          </ScrollReveal>
        )}

        {/* Error Message */}
        {error && (
          <ScaleIn delay={0} scale={0.95}>
            <div className="bg-red-50 border border-red-100 text-red-700 p-6 rounded-2xl mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiAlertTriangle className="h-6 w-6 text-red-500" />
                <p className="font-bold">{error}</p>
              </div>
              <button 
                onClick={() => { setError(""); setLoading(true); fetchAccommodations(); }}
                className="bg-white text-red-600 px-6 py-2 rounded-xl font-bold border border-red-200 hover:bg-red-50 transition-all"
              >
                Retry Search
              </button>
            </div>
          </ScaleIn>
        )}

        {/* Results */}
        {filteredAccommodations.length === 0 ? (
          <ScaleIn delay={0} scale={0.9}>
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiSearch className="text-gray-300 text-3xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No accommodations found in this area</h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto px-4">
                Know a property that should be here? Ask owners to register for free and join the safety movement.
              </p>
              <Link 
                to="/owner/register" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold inline-flex items-center gap-2 hover:shadow-xl transition-all"
              >
                Register Property <FiArrowRight />
              </Link>
            </div>
          </ScaleIn>
        ) : (
          <StaggerReveal 
            stagger={80} 
            className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" 
              : "space-y-6"
            }
          >
            {filteredAccommodations.map(accommodation => (
              <Link 
                key={accommodation._id} 
                to={`/accommodations/${accommodation._id}`}
                className={`group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden flex ${viewMode === 'list' ? 'flex-row items-center p-4' : 'flex-col'}`}
              >
                {/* Image / Thumbnail */}
                <div className={`${viewMode === 'list' ? 'w-40 h-40 rounded-2xl' : 'w-full h-56'} bg-slate-50 relative overflow-hidden flex-shrink-0`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                    <FiHome className="h-12 w-12 text-slate-200 group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="absolute top-4 left-4">
                    {getScoreBadge(accommodation.trustScore ?? 0)}
                  </div>
                  <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors duration-500"></div>
                </div>

                <div className={`${viewMode === 'list' ? 'px-8 flex-grow' : 'p-6 lg:p-8'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                      {accommodation.name}
                    </h3>
                  </div>
                  
                  <div className="flex items-center text-gray-500 mb-6 text-sm font-medium">
                    <FiMapPin className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="truncate">{accommodation.address}, {accommodation.city}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6 py-5 border-y border-gray-50">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Reports</p>
                      <p className="text-lg font-black text-gray-900 flex items-center gap-1.5">
                        <FiAlertTriangle className="text-red-500 h-4 w-4" /> {accommodation.totalReports || 0}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resolved</p>
                      <p className="text-lg font-black text-gray-900 flex items-center gap-1.5">
                        <FiCheckCircle className="text-green-500 h-4 w-4" /> {accommodation.resolvedReports || 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-400">
                      {accommodation.type || 'Hostel/PG'}
                    </span>
                    <span className="text-blue-600 font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      View Safety Profile <FiArrowRight className="text-xs" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </StaggerReveal>
        )}
      </div>
    </div>
  );
};