import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, Plane, ArrowRight, Star, MapPin, Brain, RefreshCw, FileText, Share2, Search } from 'lucide-react';

const POPULAR_SEARCHES = ['Bali', 'Switzerland', 'Thailand', 'Dubai', 'Singapore'];

const POPULAR_DESTINATIONS = [
  { name: 'Bali, Indonesia', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=85', score: '96%', tag: 'Adventure • Beach' },
  { name: 'Switzerland', img: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=600&q=85', score: '94%', tag: 'Nature • Luxury' },
  { name: 'Japan', img: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=85', score: '92%', tag: 'Culture • Food' },
  { name: 'Maldives', img: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600&q=85', score: '90%', tag: 'Beach • Luxury' },
  { name: 'Thailand', img: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600&q=85', score: '88%', tag: 'Culture • Food' },
];

const STATS = [
  { value: '50K+', label: 'Happy Travelers' },
  { value: '120+', label: 'Countries' },
  { value: '98%', label: 'Satisfaction' },
  { value: '4.9 ★', label: 'User Rating' },
];

const FEATURES = [
  { icon: <Brain className="w-5 h-5 text-blue-600" />, title: 'AI-Powered Planning', desc: '7 AI Agents handle every aspect of your trip', bg: 'bg-blue-50' },
  { icon: <Globe className="w-5 h-5 text-teal-600" />, title: 'Top 5 Recommendations', desc: 'Compare & choose the best destinations', bg: 'bg-teal-50' },
  { icon: <RefreshCw className="w-5 h-5 text-purple-600" />, title: 'Real-Time Updates', desc: 'Flights, prices, weather and alerts', bg: 'bg-purple-50' },
  { icon: <FileText className="w-5 h-5 text-orange-600" />, title: 'International Travel', desc: 'Visa info, travel guides as PDF', bg: 'bg-orange-50' },
  { icon: <Share2 className="w-5 h-5 text-pink-600" />, title: 'Save & Share', desc: 'Export and share with your friends', bg: 'bg-pink-50' },
];

const Landing = () => {
  const navigate = useNavigate();
  const [from, setFrom] = React.useState('Delhi, India');
  const [to, setTo] = React.useState('');
  const [travelers, setTravelers] = React.useState('2 Adults');

  return (
    <div className="flex flex-col">
      {/* ── HERO ── */}
      <section className="relative min-h-[88vh] flex items-center">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=90')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-sky-900/80 via-sky-800/60 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-xl">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300 mb-4">
              Agentic AI Smart Travel Planner
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-4">
              Plan Smarter.<br />Travel <span className="text-teal-300">Better.</span>
            </h1>
            <p className="text-blue-100 text-lg mb-10 leading-relaxed max-w-md">
              AtlasAI uses advanced AI Agents to understand your preferences, research real-time information, and craft the perfect trip for you.
            </p>

            {/* Quick Search Bar */}
            <div className="bg-white rounded-2xl p-3 shadow-2xl flex flex-wrap md:flex-nowrap gap-2">
              <div className="flex-1 min-w-[140px]">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">From</div>
                <input
                  value={from}
                  onChange={e => setFrom(e.target.value)}
                  className="w-full px-2 py-1 text-sm font-medium text-slate-800 outline-none"
                  placeholder="Delhi, India"
                />
              </div>
              <div className="w-px bg-slate-200 hidden md:block" />
              <div className="flex-1 min-w-[160px]">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">Where do you want to go?</div>
                <input
                  value={to}
                  onChange={e => setTo(e.target.value)}
                  className="w-full px-2 py-1 text-sm font-medium text-slate-800 outline-none"
                  placeholder="Ex: Switzerland, Bali, Tokyo"
                />
              </div>
              <div className="w-px bg-slate-200 hidden md:block" />
              <div className="flex-1 min-w-[130px]">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">Date</div>
                <div className="px-2 py-1 text-sm font-medium text-slate-500">12 May – 18 May</div>
              </div>
              <div className="w-px bg-slate-200 hidden md:block" />
              <div className="w-[120px]">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">Travelers</div>
                <div className="px-2 py-1 text-sm font-medium text-slate-500">{travelers}</div>
              </div>
              <button
                onClick={() => navigate('/plan')}
                className="bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 hover:scale-105 transition-all whitespace-nowrap flex items-center text-sm"
              >
                Plan My Trip <ArrowRight className="w-4 h-4 ml-1.5" />
              </button>
            </div>

            {/* Popular Searches */}
            <div className="mt-5 flex items-center flex-wrap gap-2">
              <span className="text-white/70 text-sm font-medium">Popular Searches:</span>
              {POPULAR_SEARCHES.map(s => (
                <button key={s} onClick={() => navigate('/plan')} className="bg-white/20 backdrop-blur text-white text-xs font-semibold border border-white/30 rounded-full px-4 py-1.5 hover:bg-white/30 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Stats */}
          <div className="mt-16 flex flex-wrap gap-10">
            {STATS.map((s, i) => (
              <div key={i} className="text-white">
                <div className="text-3xl font-black text-teal-300">{s.value}</div>
                <div className="text-sm text-white/70 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE PILLS ── */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-wrap md:flex-nowrap items-stretch gap-4">
            {FEATURES.map((f, i) => (
              <div key={i} className={`flex items-start gap-3 flex-1 min-w-[160px] p-4 rounded-xl ${f.bg}`}>
                <div className="shrink-0 mt-0.5">{f.icon}</div>
                <div>
                  <div className="font-bold text-sm text-slate-800">{f.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOP 5 DESTINATIONS (AI RECOMMENDATIONS) ── */}
      <section className="py-20 px-6 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-end mb-10">
          <div>
            <p className="text-blue-600 font-bold text-xs uppercase tracking-widest mb-2">Top 5 Destinations (AI Recommendations)</p>
            <h2 className="text-3xl font-extrabold text-slate-900">Discover Your Perfect Match</h2>
          </div>
          <button onClick={() => navigate('/plan')} className="flex items-center text-blue-600 font-semibold text-sm hover:underline">
            Compare All <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-5">
          {POPULAR_DESTINATIONS.map((dest, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -6 }}
              className="group rounded-2xl overflow-hidden shadow-md border border-slate-100 cursor-pointer bg-white"
              onClick={() => navigate(`/destination/${dest.name.split(',')[0]}`)}
            >
              <div className="relative h-44 overflow-hidden">
                <img src={dest.img} alt={dest.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                <div className="absolute top-3 right-3 bg-teal-500 text-white text-xs font-black px-2.5 py-1 rounded-full">
                  {idx + 1}
                </div>
                <div className="absolute bottom-3 left-3">
                  <div className="text-white font-bold text-sm leading-tight">{dest.name}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="bg-white/20 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-full">AI Score</div>
                    <div className="text-teal-300 font-black text-sm">{dest.score}</div>
                  </div>
                </div>
              </div>
              <div className="p-3">
                <div className="text-[10px] text-slate-400 font-medium mb-2">{dest.tag}</div>
                <button className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold py-2 rounded-lg transition-colors">
                  View Details
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-600 to-teal-500">
        <div className="max-w-7xl mx-auto text-center text-white">
          <p className="text-teal-200 font-bold text-xs uppercase tracking-widest mb-3">The AtlasAI Way</p>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">How AtlasAI Works</h2>
          <p className="text-blue-100 max-w-xl mx-auto mb-16">Seven specialized AI agents, each an expert at their task, orchestrated by a Supervisor to plan your perfect trip.</p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: '✏️', step: '01', title: 'Share Preferences', desc: 'Budget, dates, interests, travel style' },
              { icon: '🤖', step: '02', title: 'AI Agents Collaborate', desc: 'Budget → Destination → Travel → Hotels → Itinerary' },
              { icon: '🗺️', step: '03', title: 'Plan Generated', desc: 'Complete day-wise itinerary with maps' },
              { icon: '🔔', step: '04', title: 'Live Monitoring', desc: 'Weather alerts, flight updates, live notifications' },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-left border border-white/20">
                <div className="text-3xl mb-4">{s.icon}</div>
                <div className="text-teal-200 text-xs font-black mb-2">Step {s.step}</div>
                <div className="font-bold text-lg mb-2">{s.title}</div>
                <div className="text-blue-100 text-sm">{s.desc}</div>
              </div>
            ))}
          </div>

          <button onClick={() => navigate('/plan')} className="mt-14 bg-white text-blue-700 font-black py-4 px-12 rounded-full text-lg hover:scale-105 transition-transform shadow-xl">
            Start Planning Free
          </button>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-blue-600 font-bold text-xs uppercase tracking-widest mb-3">Happy Travelers</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">What Travelers Say</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Sarah Mitchell', role: 'Travel Blogger', text: 'AtlasAI planned our honeymoon in Bali flawlessly — hotels, restaurants, everything! The AI recommendations were spot on.', avatar: 'https://i.pravatar.cc/64?img=47' },
            { name: 'James Patel', role: 'Business Traveler', text: 'Saves me hours of research. The AI knows exactly what I need for each trip. The real-time monitoring is incredible.', avatar: 'https://i.pravatar.cc/64?img=14' },
            { name: 'Priya Nair', role: 'Family Vacation', text: 'Found the perfect family resort within our budget. The international travel PDF guide was super helpful for our Japan trip!', avatar: 'https://i.pravatar.cc/64?img=23' },
          ].map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <div className="flex mb-4">
                {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
              </div>
              <p className="text-slate-600 italic mb-6 leading-relaxed text-sm">"{t.text}"</p>
              <div className="flex items-center">
                <img src={t.avatar} alt={t.name} className="w-11 h-11 rounded-full mr-3 object-cover" />
                <div>
                  <div className="font-bold text-slate-900 text-sm">{t.name}</div>
                  <div className="text-xs text-slate-400">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── BOTTOM FEATURE BAR ── */}
      <section className="bg-slate-900 py-5 px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-6 md:gap-10 text-slate-300 text-xs font-semibold">
          {[
            { icon: '📊', label: 'Real-time Price Tracking' },
            { icon: '🤖', label: 'AI Travel Assistant (24h)' },
            { icon: '🔔', label: 'Price Alerts' },
            { icon: '🔗', label: 'Trip Sharing' },
            { icon: '📄', label: 'PDF Itinerary' },
            { icon: '🌐', label: 'Multi-language Support' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </div>
          ))}
          <div className="w-full text-center text-slate-500 text-xs mt-2 border-t border-slate-800 pt-4">
            ✈️ AtlasAI makes every journey smarter, safer and more memorable.
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
