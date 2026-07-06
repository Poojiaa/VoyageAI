import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MapPin, Calendar, DollarSign, Users, ChevronDown, Globe, ThermometerSun } from 'lucide-react';
import DestinationPicker from '../components/DestinationPicker';
import { api } from '../services/api';

const INTERESTS = ['Adventure', 'Nature', 'Beaches', 'Mountains', 'Food', 'Culture', 'Shopping', 'Wildlife', 'Luxury', 'Relaxation', 'History', 'Nightlife'];

const todayStr = () => new Date().toISOString().split('T')[0];
const oneWeekLaterStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
};

const Wizard = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [preferences, setPreferences] = useState({ 
    source: 'Delhi, India', 
    destinationType: 'Domestic',
    country: 'India',
    climate: 'Any',
    destination: '', 
    startDate: todayStr(), 
    endDate: oneWeekLaterStr(), 
    budget: '20000', 
    currency: 'INR', 
    travelers: '2', 
    travelType: 'Couple', 
    hotelPreference: 'Mid-range', 
    transportation: 'Flexible', 
    interests: ['Food', 'Culture'] as string[] 
  });

  const toggleInterest = (interest: string) => {
    setPreferences(prev => ({ ...prev, interests: prev.interests.includes(interest) ? prev.interests.filter(i => i !== interest) : [...prev.interests, interest] }));
  };

  const calculateTripDuration = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays > 0 ? diffDays : 1;
  };

  const generateTrip = async () => {
    // Budget Validation Guard
    const budgetVal = parseFloat(preferences.budget);
    if (preferences.currency === 'INR' && budgetVal < 15000) {
      alert("Minimum budget for a feasible trip is ₹15,000. Please increase your budget.");
      return;
    }

    setLoading(true);
    try {
      const duration = calculateTripDuration(preferences.startDate, preferences.endDate);
      const response = await api.destinations.recommend({
        source: preferences.source || 'Delhi, India',
        destination_type: preferences.destinationType,
        country: preferences.destinationType === 'Domestic' ? preferences.country : undefined,
        climate: preferences.climate,
        trip_duration: duration,
        destination: preferences.destination || '',
        start_date: preferences.startDate || todayStr(),
        end_date: preferences.endDate || oneWeekLaterStr(),
        budget: preferences.budget,
        currency: preferences.currency,
        travelers: preferences.travelers,
        travel_type: preferences.travelType,
        hotel_preference: preferences.hotelPreference,
        transportation: preferences.transportation,
        interests: preferences.interests,
      });
      setDestinations(response.data.recommendations);
      setStep(2);
    } catch (error: any) {
      console.error("Backend Error:", error);
      alert(error.response?.data?.detail || "Failed to reach AI Backend.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleDestinationSelect = async (destinationName: string) => { 
    setLoading(true); 
    try {
      await api.trips.generate({
        source: preferences.source || 'Delhi, India',
        destination: destinationName,
        start_date: preferences.startDate || '2025-05-12',
        end_date: preferences.endDate || '2025-05-18',
        budget: preferences.budget,
        currency: preferences.currency,
        travelers: preferences.travelers,
        travel_type: preferences.travelType,
        hotel_preference: preferences.hotelPreference,
        transportation: preferences.transportation,
        interests: preferences.interests,
      });
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error("Backend Error:", error);
      alert(error.response?.data?.detail || "Failed to generate full trip.");
    } finally {
      setLoading(false); 
    }
  };


  const input = "w-full p-3.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-800 placeholder:text-slate-400 text-sm shadow-sm";
  const sel = "w-full p-3.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-800 text-sm shadow-sm appearance-none cursor-pointer";
  const label = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2";

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            {/* Page Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 rounded-full px-5 py-2 text-xs font-bold uppercase tracking-widest mb-4">
                <Sparkles className="w-4 h-4" /> AI-Powered Trip Planner
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-3">
                Plan Your Perfect <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">Journey</span>
              </h1>
              <p className="text-slate-500 text-base max-w-xl mx-auto">Tell AtlasAI about your dream trip and our 7 specialized AI agents will craft the perfect personalized itinerary.</p>
            </div>

            {/* Two-panel form layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Panel: Basic Details */}
              <div className="bg-white rounded-3xl shadow-md border border-slate-100 p-8">
                <h2 className="font-extrabold text-slate-800 text-lg mb-6 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-500" /> Basic Details
                </h2>
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={label}><Globe className="w-3 h-3 inline mr-1" />Destination Type</label>
                      <div className="relative">
                        <select value={preferences.destinationType} onChange={e => setPreferences({ ...preferences, destinationType: e.target.value })} className={sel}>
                          <option>Domestic</option><option>International</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    {preferences.destinationType === 'Domestic' && (
                      <div>
                        <label className={label}>Country</label>
                        <input type="text" placeholder="e.g. India" value={preferences.country} onChange={e => setPreferences({ ...preferences, country: e.target.value })} className={input} />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={label}>From (Source City)</label>
                    <input type="text" placeholder="e.g. Delhi, India" value={preferences.source} onChange={e => setPreferences({ ...preferences, source: e.target.value })} className={input} />
                  </div>
                  <div>
                    <label className={label}>Specific Destination (optional)</label>
                    <input type="text" placeholder="Leave empty for AI to suggest" value={preferences.destination} onChange={e => setPreferences({ ...preferences, destination: e.target.value })} className={input} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={label}><Calendar className="w-3 h-3 inline mr-1" />Start Date</label>
                      <input
                        type="date"
                        value={preferences.startDate}
                        min={todayStr()}
                        onChange={e => {
                          const newStart = e.target.value;
                          // if end date is before new start, push end date to start + 1 day
                          const newEnd = preferences.endDate < newStart
                            ? (() => { const d = new Date(newStart); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })()
                            : preferences.endDate;
                          setPreferences({ ...preferences, startDate: newStart, endDate: newEnd });
                        }}
                        className={input}
                      />
                    </div>
                    <div>
                      <label className={label}><Calendar className="w-3 h-3 inline mr-1" />End Date</label>
                      <input
                        type="date"
                        value={preferences.endDate}
                        min={(() => { const d = new Date(preferences.startDate); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })()}
                        onChange={e => setPreferences({ ...preferences, endDate: e.target.value })}
                        className={input}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className={label}><DollarSign className="w-3 h-3 inline mr-1" />Budget</label>
                      <div className="flex gap-2">
                        <input type="number" value={preferences.budget} onChange={e => setPreferences({ ...preferences, budget: e.target.value })} className={`${input} flex-1`} />
                        <div className="relative">
                          <select value={preferences.currency} onChange={e => setPreferences({ ...preferences, currency: e.target.value })} className={`${sel} w-24`}>
                            <option>USD</option><option>EUR</option><option>GBP</option><option>INR</option><option>JPY</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={label}><Users className="w-3 h-3 inline mr-1" />Travelers</label>
                      <input type="number" min="1" value={preferences.travelers} onChange={e => setPreferences({ ...preferences, travelers: e.target.value })} className={input} />
                    </div>
                    <div>
                      <label className={label}>Travel Type</label>
                      <div className="relative">
                        <select value={preferences.travelType} onChange={e => setPreferences({ ...preferences, travelType: e.target.value })} className={sel}>
                          <option>Couple</option><option>Solo</option><option>Family</option><option>Friends</option><option>Honeymoon</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={label}>Hotel</label>
                      <div className="relative">
                        <select value={preferences.hotelPreference} onChange={e => setPreferences({ ...preferences, hotelPreference: e.target.value })} className={sel}>
                          <option>Budget</option><option>Mid-range</option><option>Luxury</option><option>Resort</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className={label}>Transport</label>
                      <div className="relative">
                        <select value={preferences.transportation} onChange={e => setPreferences({ ...preferences, transportation: e.target.value })} className={sel}>
                          <option>Flexible</option><option>Flight</option><option>Train</option><option>Bus</option><option>Car Rental</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1">
                    <div>
                      <label className={label}><ThermometerSun className="w-3 h-3 inline mr-1" />Preferred Climate</label>
                      <div className="relative">
                        <select value={preferences.climate} onChange={e => setPreferences({ ...preferences, climate: e.target.value })} className={sel}>
                          <option>Any</option><option>Tropical</option><option>Sunny</option><option>Cold</option><option>Temperate</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel: Interests */}
              <div className="bg-white rounded-3xl shadow-md border border-slate-100 p-8 flex flex-col">
                <h2 className="font-extrabold text-slate-800 text-lg mb-6 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-500" /> What are you interested in?
                </h2>
                <p className="text-slate-400 text-sm mb-6">Select all that apply. AtlasAI will use this to rank destinations.</p>
                <div className="flex flex-wrap gap-3 flex-1 content-start">
                  {INTERESTS.map(interest => {
                    const selected = preferences.interests.includes(interest);
                    return (
                      <button key={interest} onClick={() => toggleInterest(interest)} className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border-2 ${selected ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200/50' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'}`}>
                        {interest}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                  <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-2xl p-4 mb-5 text-sm text-slate-600 border border-blue-100">
                    <div className="font-bold text-slate-800 mb-1">🤖 How AtlasAI works</div>
                    7 specialized AI agents — Budget, Destination, Travel, Hotel, Itinerary, Notification — will work in concert to craft your perfect trip.
                  </div>
                  <button onClick={generateTrip} disabled={loading} className="w-full py-4 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-2xl font-bold text-base flex justify-center items-center hover:opacity-90 hover:shadow-lg hover:shadow-blue-200/50 transition-all disabled:opacity-50">
                    {loading ? (
                      <span className="flex items-center"><Sparkles className="w-5 h-5 mr-2 animate-spin" /> Finding Best Destinations…</span>
                    ) : (
                      <span className="flex items-center"><Sparkles className="w-5 h-5 mr-2" /> Find Best Destinations</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <DestinationPicker destinations={destinations} onSelect={handleDestinationSelect} isLoading={loading} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Wizard;
