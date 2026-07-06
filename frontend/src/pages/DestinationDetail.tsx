import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, CloudSun, Star, Heart, Share2, ArrowRight, CheckCircle, Loader2, Plane, Shield, FileText, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

const TABS = [
  { label: 'Overview', icon: '🗺️' },
  { label: 'Attractions', icon: '📸' },
  { label: 'Hotels', icon: '🏨' },
  { label: 'Food & Dining', icon: '🍽️' },
  { label: 'Experiences', icon: '🧭' },
  { label: 'Travel Guide', icon: '📋' },
];

const PlaceCard = ({ place, type }: { place: any; type: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4 }}
    className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-md group"
  >
    <div className="h-40 overflow-hidden relative">
      <img
        src={place.img || `https://source.unsplash.com/400x300/?${encodeURIComponent(place.name)},${type}`}
        alt={place.name}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://source.unsplash.com/400x300/?${type},travel`;
        }}
      />
    </div>
    <div className="p-4">
      <div className="font-bold text-slate-900 text-sm mb-1 leading-tight">{place.name}</div>
      {place.rating > 0 && (
        <div className="text-amber-500 text-xs font-semibold mb-1">⭐ {place.rating} / 5.0</div>
      )}
      {place.address && (
        <div className="text-xs text-slate-400 flex items-center gap-1 line-clamp-1">
          <MapPin className="w-3 h-3 shrink-0" /> {place.address}
        </div>
      )}
    </div>
  </motion.div>
);

const TabLoader = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    <div className="text-slate-400 text-sm font-medium">Fetching real-time data...</div>
  </div>
);

const DestinationDetail = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('Overview');
  const [dest, setDest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Per-tab data
  const [tabLoading, setTabLoading] = useState(false);
  const [attractions, setAttractions] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);

  const score = location.state?.score || 95;
  const imgUrl = location.state?.img || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=90';

  // Initial load: overview + attractions
  useEffect(() => {
    const fetchDest = async () => {
      try {
        setLoading(true);
        if (name) {
          const [destRes, attRes] = await Promise.all([
            api.destinations.getDetail(name),
            api.places.getAttractions(name, 8),
          ]);
          setDest(destRes.data);
          setAttractions(attRes.data.attractions || []);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load destination details');
      } finally {
        setLoading(false);
      }
    };
    fetchDest();
  }, [name]);

  // Lazy load tab data when switching
  useEffect(() => {
    if (!name) return;

    const loadTabData = async () => {
      setTabLoading(true);
      try {
        if (activeTab === 'Attractions' && attractions.length === 0) {
          const res = await api.places.getAttractions(name, 8);
          setAttractions(res.data.attractions || []);
        } else if (activeTab === 'Hotels' && hotels.length === 0) {
          const res = await api.places.getHotels(name, 'Mid-range', 6);
          setHotels(res.data.hotels || []);
        } else if (activeTab === 'Food & Dining' && restaurants.length === 0) {
          const res = await api.places.getRestaurants(name, 6);
          setRestaurants(res.data.restaurants || []);
        } else if (activeTab === 'Experiences' && experiences.length === 0) {
          const res = await api.places.getExperiences(name, 6);
          setExperiences(res.data.experiences || []);
        }
      } catch (e) {
        console.error('Tab data fetch error:', e);
      } finally {
        setTabLoading(false);
      }
    };

    loadTabData();
  }, [activeTab, name]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <div className="text-slate-500 font-medium">Loading destination from AI & Google Places...</div>
        </div>
      </div>
    );
  }

  if (error || !dest) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50">
        <div className="text-red-500">{error || 'Destination not found'}</div>
      </div>
    );
  }

  const renderTabContent = () => {
    if (tabLoading) return <TabLoader />;

    switch (activeTab) {
      case 'Overview':
        return (
          <div>
            <p className="text-slate-600 mb-6 leading-relaxed text-base">{dest.description}</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Best Season', value: dest.best_time, icon: '☀️' },
                { label: 'Crowd Level', value: dest.crowd, icon: '👥' },
                { label: 'Safety', value: `${dest.safety_rating}/10`, icon: '🛡️' },
                { label: 'Currency', value: dest.currency, icon: '💱' },
                { label: 'Language', value: dest.language, icon: '🗣️' },
                { label: 'Time Zone', value: dest.timezone, icon: '🕐' },
              ].map((f, i) => (
                <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3">
                  <span className="text-2xl">{f.icon}</span>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{f.label}</div>
                    <div className="text-sm font-bold text-slate-800">{f.value}</div>
                  </div>
                </div>
              ))}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Why visit {name}?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
              {dest.reasons?.map((r: string, i: number) => (
                <div key={i} className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700 font-medium">{r}</span>
                </div>
              ))}
            </div>
            {attractions.length > 0 && (
              <>
                <h3 className="text-lg font-bold text-slate-900 mb-4">🏛️ Top Attractions (Live from Google Places)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {attractions.slice(0, 4).map((a: any, i: number) => (
                    <PlaceCard key={i} place={a} type="attraction" />
                  ))}
                </div>
              </>
            )}
          </div>
        );

      case 'Attractions':
        return (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-lg font-bold text-slate-900">Top Attractions in {name}</h3>
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">Live via Google Places</span>
            </div>
            {attractions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {attractions.map((a: any, i: number) => (
                  <PlaceCard key={i} place={a} type="attraction" />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400">No attractions found.</div>
            )}
          </div>
        );

      case 'Hotels':
        return (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-lg font-bold text-slate-900">Recommended Hotels in {name}</h3>
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">Live via Google Places</span>
            </div>
            {hotels.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {hotels.map((h: any, i: number) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} whileHover={{ y: -4 }} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-md group">
                    <div className="h-44 overflow-hidden">
                      <img src={h.img || `https://source.unsplash.com/400x300/?hotel,${name}`} alt={h.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80'; }} />
                    </div>
                    <div className="p-4">
                      <div className="font-bold text-slate-900 mb-1">{h.name}</div>
                      {h.rating > 0 && <div className="text-amber-500 text-xs font-semibold mb-2">⭐ {h.rating} / 5.0</div>}
                      {h.address && <div className="text-xs text-slate-400 flex items-start gap-1"><MapPin className="w-3 h-3 shrink-0 mt-0.5" /> {h.address}</div>}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400">No hotels found.</div>
            )}
          </div>
        );

      case 'Food & Dining':
        return (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-lg font-bold text-slate-900">Restaurants & Dining in {name}</h3>
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">Live via Google Places</span>
            </div>
            {restaurants.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {restaurants.map((r: any, i: number) => (
                  <PlaceCard key={i} place={r} type="restaurant" />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400">No restaurants found.</div>
            )}
          </div>
        );

      case 'Experiences':
        return (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-lg font-bold text-slate-900">Things To Do in {name}</h3>
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">Live via Google Places</span>
            </div>
            {experiences.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {experiences.map((e: any, i: number) => (
                  <PlaceCard key={i} place={e} type="activity" />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400">No experiences found.</div>
            )}
          </div>
        );

      case 'Travel Guide':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900">Complete Travel Guide for {name}</h3>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Plane className="w-5 h-5 text-blue-500" /> Getting There</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                <div><span className="font-semibold text-slate-800">By Air:</span> Nearest airport connects to major Indian cities. Est. flight: {dest.flight_cost}</div>
                <div><span className="font-semibold text-slate-800">By Train:</span> Well-connected railway station with overnight sleeper trains from major cities.</div>
                <div><span className="font-semibold text-slate-800">By Bus:</span> State-run and private luxury buses available.</div>
                <div><span className="font-semibold text-slate-800">Local:</span> Auto-rickshaws, taxis, and rental bikes are widely available.</div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-purple-500" /> Documents & Visa</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                {['Valid government-issued photo ID required', 'Travel insurance strongly recommended', 'Keep hotel bookings and return ticket copies', 'Emergency contact list and embassy numbers'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> {item}</li>
                ))}
              </ul>
            </div>
            <div className="bg-amber-50 rounded-2xl border border-amber-100 p-6">
              <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" /> Safety Tips</h4>
              <ul className="space-y-2 text-sm text-slate-700">
                {['Always carry a copy of your ID documents', 'Use registered taxis and avoid unlicensed operators', 'Drink bottled or filtered water only', 'Be aware of local customs and dress codes', 'Keep emergency numbers handy: 112 (India)'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">⚠️ {item}</li>
                ))}
              </ul>
            </div>
            <div className="bg-blue-50 rounded-2xl border border-blue-100 p-6">
              <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><CloudSun className="w-5 h-5 text-blue-500" /> Best Time & Weather</h4>
              <div className="text-sm text-slate-700 mb-2">📅 <strong>Recommended:</strong> {dest.best_time}</div>
              <div className="text-sm text-slate-700 mb-2">🌡️ <strong>Current Weather:</strong> {dest.weather}</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h4 className="font-bold text-slate-900 mb-4">🎒 Packing Essentials</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {['Light cotton clothes', 'Comfortable walking shoes', 'Sunscreen & sunglasses', 'Power bank & adapters', 'First aid kit', 'Local currency cash', 'Rain jacket/umbrella', 'Travel pillow', 'Reusable water bottle'].map((item, i) => (
                  <div key={i} className="text-sm text-slate-600 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" /> {item}</div>
                ))}
              </div>
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden h-72 md:h-96 mb-8">
        <img src={imgUrl} alt={name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />
        <div className="absolute top-5 right-5 bg-gradient-to-r from-teal-400 to-emerald-500 text-white font-black px-4 py-2 rounded-full flex items-center gap-1.5 text-sm shadow-lg">
          <Star className="w-4 h-4 fill-white" /> {score}% AI Match
        </div>
        <div className="absolute bottom-6 left-6">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-2">{name}</h1>
          <div className="flex items-center gap-2 text-white/80 text-sm mb-3">
            <MapPin className="w-4 h-4" /> {dest.country}
          </div>
          <div className="flex flex-wrap gap-2">
            {dest.tags?.map((t: string) => (
              <span key={t} className="bg-white/20 backdrop-blur text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/30">{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1.5 mb-8 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.label)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${activeTab === tab.label ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Main + Sidebar */}
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 min-w-0">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {renderTabContent()}
          </motion.div>
        </div>

        <div className="lg:w-72 space-y-5 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Star className="w-4 h-4 text-teal-500" /> Why recommended?</h3>
            <ul className="space-y-3">
              {dest.reasons?.map((r: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" /> {r}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-600">Safety Rating</span>
              <span className={`font-black text-sm px-2 py-0.5 rounded ${dest.safety_rating >= 8.5 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{dest.safety_rating}/10</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div className="bg-gradient-to-r from-teal-400 to-blue-500 rounded-full h-2.5" style={{ width: `${(dest.safety_rating || 0) * 10}%` }} />
            </div>
            <div className="mt-3 text-xs text-slate-400 flex items-center gap-1">
              <Shield className="w-3 h-3" /> {dest.safety_rating >= 8.5 ? 'Very Safe for travelers' : 'Exercise normal precautions'}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Current Weather</div>
            <div className="text-lg font-black text-slate-900">{dest.weather}</div>
          </div>

          <button onClick={() => navigate('/plan')} className="w-full py-4 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 hover:scale-[1.02] transition-all shadow-md">
            <ArrowRight className="w-5 h-5" /> Generate Full Trip
          </button>
          <div className="flex gap-3">
            <button className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
              <Heart className="w-4 h-4" /> Save
            </button>
            <button className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DestinationDetail;
