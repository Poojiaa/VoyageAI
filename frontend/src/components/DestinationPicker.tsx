import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Loader2, Share2, ArrowRight, CloudSun, Plane, Hotel, Star, MapPin, Bus, Utensils, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Destination {
  name: string;
  country: string;
  description: string;
  reasons: string[];
  estimated_cost: number;
  budget_compatibility_pct: number;
  match_score: number;
  weather: string;
  weather_condition: string;
  weather_icon: string;
  temp_range: string;
  flight_cost: number;
  hotel_cost: number;
  food_cost: number;
  local_transport_cost: number;
  safety_rating: number;
  best_time: string;
  img: string;
  attractions: string[];
}

interface Props {
  destinations: Destination[];
  onSelect: (destination: string) => void;
  isLoading: boolean;
}

const DestinationPicker: React.FC<Props> = ({ destinations, onSelect, isLoading }) => {
  const [otherDestination, setOtherDestination] = useState('');
  const navigate = useNavigate();

  return (
    <div className="w-full">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 rounded-full px-5 py-2 text-xs font-bold uppercase tracking-widest mb-4">
          <Target className="w-4 h-4" /> Top {destinations.length} Destinations (AI Recommendations)
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">
          Your Perfect Matches
        </h2>
        <p className="text-slate-500 max-w-2xl mx-auto">Our AI agents have analyzed your budget, climate preferences, and interests to rank the most realistic and beautiful destinations for you.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
        {destinations.map((dest, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            whileHover={{ y: -6 }}
            className="bg-white rounded-3xl overflow-hidden shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col group relative"
          >
            {/* Image Header */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={dest.img}
                alt={dest.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent" />
              
              {/* Rank & Match Score */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center font-black text-sm border border-white/30 shadow-sm">
                  #{idx + 1}
                </div>
              </div>
              <div className="absolute top-3 right-3 bg-gradient-to-r from-teal-400 to-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-white" /> {dest.match_score}% Match
              </div>

              {/* Title & Weather */}
              <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                <div>
                  <h3 className="text-white font-black text-xl leading-tight mb-0.5">{dest.name}</h3>
                  <div className="text-white/80 text-xs font-semibold flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {dest.country}
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  {dest.weather_icon && <img src={`https://openweathermap.org/img/wn/${dest.weather_icon}.png`} alt="weather" className="w-8 h-8 -mb-1 filter brightness-0 invert" />}
                  <span className="text-white font-bold text-sm">{dest.weather.split('•')[0]}</span>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 flex-1 flex flex-col">
              
              {/* Cost & Safety */}
              <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Est. Total Cost</div>
                  <div className="font-black text-blue-700 text-lg">₹{(dest.estimated_cost).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Safety</div>
                  <div className={`font-black text-sm px-2 py-0.5 rounded ${dest.safety_rating >= 8.5 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {dest.safety_rating}/10
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="mb-4">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Cost Breakdown</div>
                <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-600">
                  <div className="flex items-center gap-1.5"><Plane className="w-3.5 h-3.5 text-slate-400" /> ₹{(dest.flight_cost).toLocaleString()}</div>
                  <div className="flex items-center gap-1.5"><Hotel className="w-3.5 h-3.5 text-slate-400" /> ₹{(dest.hotel_cost).toLocaleString()}</div>
                  <div className="flex items-center gap-1.5"><Utensils className="w-3.5 h-3.5 text-slate-400" /> ₹{(dest.food_cost).toLocaleString()}</div>
                  <div className="flex items-center gap-1.5"><Bus className="w-3.5 h-3.5 text-slate-400" /> ₹{(dest.local_transport_cost).toLocaleString()}</div>
                </div>
              </div>

              {/* AI Reasons */}
              <div className="mb-4 flex-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Why this destination?</div>
                <ul className="space-y-1.5">
                  {dest.reasons?.slice(0, 3).map((reason, i) => (
                    <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5 leading-snug">
                      <CheckCircle2 className="w-3 h-3 text-teal-500 shrink-0 mt-0.5" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 mt-auto">
                <button
                  onClick={() => onSelect(dest.name)}
                  className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md shadow-blue-200"
                >
                  Generate Itinerary
                </button>
                <button
                  onClick={() => navigate(`/destination/${dest.name}`, { 
                    state: { 
                      score: dest.match_score, 
                      img: dest.img,
                      budget: dest.estimated_cost,
                      flight_cost: dest.flight_cost,
                      hotel_cost: dest.hotel_cost
                    } 
                  })}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-colors border border-slate-200"
                >
                  View Map & Details
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-md z-50 flex flex-col items-center justify-center">
          <div className="relative mb-8">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center animate-pulse shadow-2xl shadow-blue-500/30">
              <Loader2 className="w-14 h-14 text-white animate-spin" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">AI Agents Orchestrating…</h3>
          <p className="text-slate-500 text-center max-w-md text-base leading-relaxed">
            AtlasAI is communicating with the Budget, Destination, Travel, Hotel, and Itinerary agents to negotiate the perfect real-time plan for you.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {['💰 Budget Check', '🗺️ Geo-Routing', '🏨 Fetching Hotels', '📅 Building Itinerary'].map((agent, i) => (
              <div key={i} className="bg-blue-50 text-blue-700 text-xs font-black tracking-wide uppercase px-4 py-2 rounded-full animate-pulse border border-blue-100" style={{ animationDelay: `${i * 0.2}s` }}>
                {agent}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DestinationPicker;
