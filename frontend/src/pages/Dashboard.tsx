import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, MapPin, DollarSign, Bell, Hotel, Map, Calendar, Download, CheckCircle, Shield, Plane, Train, Bus, Loader2 } from 'lucide-react';
import { api } from '../services/api';

const Dashboard = () => {
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Get all trips for user
        const res = await api.trips.list();
        const trips = res.data.trips;
        
        if (trips && trips.length > 0) {
          // Get full details of the latest trip
          const latestTripId = trips[trips.length - 1].id;
          const fullTripRes = await api.trips.get(latestTripId);
          setTrip(fullTripRes.data);
          
          // Get notifications
          const notifRes = await api.notifications.list();
          setNotifications(notifRes.data.notifications || []);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <div className="text-slate-500 font-medium">Loading your travel dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50">
        <div className="text-center bg-white p-10 rounded-3xl shadow-sm border border-slate-100">
          <Globe className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">No Active Trips</h2>
          <p className="text-slate-500 mb-6">You haven't planned any trips yet.</p>
          <a href="/plan" className="inline-flex bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-all">
            Plan a Trip Now
          </a>
        </div>
      </div>
    );
  }

  // Derived data
  const budgetAnalysis = trip.budget_analysis || {};
  const breakdown = budgetAnalysis.breakdown || {};
  const flightData = trip.flight_data || [];
  const hotelData = trip.hotel_data || [];
  const itineraryData = trip.itinerary_data || [];
  const weatherNotifs = notifications.filter(n => n.type === 'weather');
  const latestWeather = weatherNotifs.length > 0 ? weatherNotifs[0].message : "Weather info unavailable";

  const totalBudget = trip.budget;
  const currency = trip.currency;
  
  const bItems = [
    { label: 'Transport', amount: breakdown.transport || breakdown.flights || 0, color: '#3b82f6' },
    { label: 'Hotels', amount: breakdown.hotels || 0, color: '#14b8a6' },
    { label: 'Food', amount: breakdown.food || 0, color: '#f59e0b' },
    { label: 'Activities', amount: breakdown.activities || 0, color: '#a855f7' },
  ];
  
  const totalBreakdown = Object.values(breakdown).reduce((a: any, b: any) => a + b, 0) as number;
  const bList = bItems.map(b => ({
    ...b,
    pct: totalBreakdown > 0 ? Math.round((b.amount / totalBreakdown) * 100) : 0,
    amountFormatted: `${currency} ${b.amount.toLocaleString()}`
  }));

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 p-6 gap-2">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center">
            <Globe className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">AtlasAI</span>
        </div>
        {[
          { icon: <MapPin className="w-4 h-4" />, label: 'My Trips', active: true },
          { icon: <DollarSign className="w-4 h-4" />, label: 'Budget', active: false },
          { icon: <Bell className="w-4 h-4" />, label: 'Notifications', active: false },
          { icon: <Hotel className="w-4 h-4" />, label: 'Saved Places', active: false },
          { icon: <Globe className="w-4 h-4" />, label: 'Explore', active: false },
        ].map((item, i) => (
          <button key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${item.active ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
            {item.icon} {item.label}
          </button>
        ))}
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-8 pb-28 md:pb-8 overflow-y-auto">
        {/* Trip Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">My Active Trip</div>
            <h1 className="text-3xl font-extrabold text-slate-900">{trip.title} 🌴</h1>
            <div className="flex items-center gap-3 mt-2 text-slate-500 text-sm">
              <Calendar className="w-4 h-4" /> {trip.start_date} – {trip.end_date} &nbsp;·&nbsp; {trip.travelers} Travelers
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors">
              <Download className="w-4 h-4" /> Export PDF
            </button>
            <a href={`/destination/${trip.destination}`} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity whitespace-nowrap">
              View Guide
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Budget Overview */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-500" /> Budget Overview</h3>
            <div className="flex rounded-full overflow-hidden h-4 mb-6">
              {bList.map((b, i) => (
                <div key={i} style={{ width: `${b.pct}%`, backgroundColor: b.color }} title={b.label} />
              ))}
            </div>
            <div className="space-y-3">
              {bList.map((b, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: b.color }} />
                    <span className="text-slate-600 font-medium">{b.label}</span>
                  </div>
                  <span className="font-bold text-slate-800">{b.amountFormatted}</span>
                </div>
              ))}
              <div className="border-t border-slate-100 pt-3 flex justify-between font-extrabold text-base">
                <span>Total</span> <span className="text-blue-600">{currency} {totalBudget.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Transport Info */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Map className="w-5 h-5 text-sky-500" /> Transport Options</h3>
            <div className="space-y-4">
              {flightData.length > 0 ? flightData.slice(0, 2).map((f: any, i: number) => {
                const isTrain = f.type?.toLowerCase().includes('train');
                const isBus = f.type?.toLowerCase().includes('bus');
                const TransportIcon = isTrain ? Train : (isBus ? Bus : Plane);
                
                return (
                  <div key={i} className="bg-slate-50 rounded-xl p-4">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-2">{f.airline || f.operator || f.type}</div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-black text-slate-800">{f.departure}</div>
                      <div className="flex-1 flex items-center justify-center px-2">
                        <div className="h-px w-full bg-slate-300 relative">
                          <TransportIcon className="w-4 h-4 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-50 p-0.5" />
                        </div>
                      </div>
                      <div className="text-sm font-black text-slate-800">{f.arrival}</div>
                    </div>
                    <div className="text-xs text-slate-400 mt-2">{f.duration} · {currency} {f.price_per_person}/pp</div>
                  </div>
                );
              }) : (
                <div className="text-sm text-slate-500">No transport options generated.</div>
              )}
            </div>
          </div>

          {/* Hotel Info + Notifications */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Hotel className="w-5 h-5 text-indigo-500" /> Hotel</h3>
              {hotelData.length > 0 ? (
                <>
                  <div className="relative rounded-xl overflow-hidden h-28 mb-3">
                    <img src={hotelData[0].img} alt="Hotel" className="w-full h-full object-cover" />
                  </div>
                  <div className="font-bold text-slate-800">{hotelData[0].name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{hotelData[0].stars}-Star · {hotelData[0].location} · ⭐ {hotelData[0].rating}</div>
                </>
              ) : (
                <div className="text-sm text-slate-500">No hotel options generated.</div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center gap-2 text-green-600 font-bold text-sm mb-2"><CheckCircle className="w-4 h-4" /> Travel & Safety</div>
              <div className="text-xs text-slate-500">✅ No active travel advisories for {trip.destination}</div>
              <div className="text-xs text-slate-500 mt-1">☀️ {latestWeather}</div>
            </div>
          </div>
        </div>

        {/* Day-wise Itinerary */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 text-lg mb-6 flex items-center gap-2"><Map className="w-5 h-5 text-blue-500" /> Day-by-Day Itinerary</h3>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-100" />
            <div className="space-y-6">
              {itineraryData.map((d: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex gap-6">
                  <div className="relative z-10 w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 flex flex-col items-center justify-center text-white shadow-md">
                    <div className="font-black text-lg leading-none">D{d.day}</div>
                    <div className="text-[10px] font-semibold opacity-80">{d.date}</div>
                  </div>
                  <div className="flex-1 bg-slate-50 rounded-2xl p-5 border border-slate-100">
                    <div className="font-bold text-slate-900 mb-1">{d.title}</div>
                    <ul className="text-sm text-slate-600 mt-3 space-y-2">
                      {d.activities?.map((a: any, j: number) => (
                        <li key={j} className="flex gap-3">
                          <span className="font-semibold text-slate-400 shrink-0 w-16">{a.time}</span>
                          <span>{a.activity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
              {itineraryData.length === 0 && (
                <div className="text-sm text-slate-500">No itinerary generated.</div>
              )}
            </div>
          </div>
        </div>

        {/* International Travel Guide */}
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-teal-50 rounded-2xl border border-blue-100 p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900">International Travel Guide Ready</h3>
              </div>
              <p className="text-slate-500 text-sm">Your complete PDF guide for {trip.destination}, {trip.country || ''} — Visa requirements, customs, emergency contacts, currency, local tips.</p>
            </div>
            <button className="flex items-center gap-2 bg-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors whitespace-nowrap shadow-md">
              <Download className="w-4 h-4" /> Download Travel Guide (PDF)
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
