import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  Timestamp 
} from 'firebase/firestore';
import { db, auth, signInWithGoogle, isAdmin } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandling';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  LayoutDashboard, 
  Users, 
  Download, 
  LogOut, 
  Search, 
  Filter,
  TrendingUp,
  BarChart3,
  Mail,
  ShieldCheck,
  ChevronRight,
  FileSpreadsheet,
  Camera,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Registration {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  facebookUrl?: string;
  instagramHandle?: string;
  telegramHandle?: string;
  contactNumber: string;
  department: string;
  role: string;
  churchBranch: string;
  experience: string;
  topics: string[];
  learnGoals: string;
  equipment: string[];
  challenges: string[];
  cameraFraming: string;
  lightingTerms: string;
  soundMixer: string;
  preferredSchedule: string;
  willAttend: string;
  questions: string;
  committed: boolean;
  createdAt: Timestamp;
}

export default function AdminPortal() {
  const [user, setUser] = useState<User | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'table'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u && isAdmin(u.email)) {
        const q = query(collection(db, 'registrations'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          setRegistrations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Registration)));
          setLoading(false);
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'registrations');
        });
        return unsubscribe;
      } else {
        setLoading(false);
      }
    });
  }, []);

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans focus:outline-none">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-12 h-12 border-4 border-[#002D62] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !isAdmin(user.email)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 border border-slate-100 text-center"
        >
          <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg rotate-3 overflow-hidden">
             <div className="bg-[#002D62] w-full h-full flex items-center justify-center">
               <ShieldCheck className="text-white w-10 h-10" />
             </div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase">Admin Access Required</h2>
          <p className="text-slate-500 mb-10 leading-relaxed italic">
            This area is restricted to authorized personnel. Please sign in with your admin account to continue.
          </p>
          <button 
            onClick={signInWithGoogle}
            className="w-full py-4 bg-[#002D62] text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl active:scale-95"
          >
            <Mail className="w-5 h-5" />
            Sign in with Google
          </button>
          {!user && (
            <p className="mt-6 text-sm text-slate-400">Authorized emails only</p>
          )}
          {user && !isAdmin(user.email) && (
            <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 animate-pulse">
              User <strong>{user.email}</strong> is not authorized.
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  const exportCSV = () => {
    const headers = [
      'First Name', 'Last Name', 'Email', 'Facebook', 'Instagram', 'Telegram', 'Contact', 'Department', 'Role', 'Branch', 'Experience', 
      'Topics', 'Learn Goals', 'Equipment', 'Challenges', 
      'Camera Framing', 'Lighting Terms', 'Sound Mixer', 
      'Schedule', 'Attending', 'Questions', 'Registered At'
    ];
    
    const rows = registrations.map(r => [
      r.firstName, r.lastName, r.email, r.facebookUrl, r.instagramHandle, r.telegramHandle, r.contactNumber, r.department, r.role, r.churchBranch, r.experience,
      r.topics.join(', '), r.learnGoals, r.equipment.join(', '), r.challenges.join(', '),
      r.cameraFraming, r.lightingTerms, r.soundMixer,
      r.preferredSchedule, r.willAttend, r.questions,
      r.createdAt.toDate().toLocaleString()
    ]);

    const csvContent = [headers, ...rows].map(e => e.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `registrations_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Analytics Helpers
  const experienceData = [
    { name: 'Beginner', value: registrations.filter(r => r.experience === 'Beginner').length },
    { name: 'Intermediate', value: registrations.filter(r => r.experience === 'Intermediate').length },
    { name: 'Advanced', value: registrations.filter(r => r.experience === 'Advanced').length },
  ];

  const topicsCount: Record<string, number> = {};
  registrations.forEach(r => r.topics.forEach(t => topicsCount[t] = (topicsCount[t] || 0) + 1));
  const topicsData = Object.entries(topicsCount).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

  const COLORS = ['#002D62', '#0055A4', '#007FFF', '#50BFE6', '#00C7B1', '#00843D'];

  const filteredRegistrations = registrations.filter(r => 
    (r.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (r.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (r.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.churchBranch || '').toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <div className="min-h-screen bg-slate-50 flex font-sans italic">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col p-6 sticky top-0 h-screen hidden lg:flex">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-[#002D62] rounded-xl flex items-center justify-center">
            <LayoutDashboard className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Dashboard</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarTab 
            icon={<BarChart3 className="w-5 h-5" />} 
            label="Analytics" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarTab 
            icon={<Users className="w-5 h-5" />} 
            label="Registrations" 
            active={activeTab === 'table'} 
            onClick={() => setActiveTab('table')} 
          />
        </nav>

        <div className="pt-6 border-t border-slate-100 flex flex-col gap-4">
           <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-xl overflow-hidden">
             <div className="w-8 h-8 rounded-full bg-[#002D62] text-white flex items-center justify-center text-xs font-bold shrink-0 uppercase">
               {user.email?.[0]}
             </div>
             <div className="truncate min-w-0">
               <p className="text-xs font-bold text-slate-900 truncate tracking-tight">{user.displayName || 'Admin'}</p>
               <p className="text-[10px] text-slate-500 truncate lowercase">{user.email}</p>
             </div>
           </div>
           <button 
             onClick={handleLogout}
             className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium text-sm"
           >
             <LogOut className="w-4 h-4" />
             Sign Out
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center gap-4 lg:hidden">
             <LayoutDashboard className="text-[#002D62] w-6 h-6" />
             <h1 className="text-lg font-black text-slate-900 uppercase">Admin Portal</h1>
          </div>
          <div className="hidden lg:block">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              {activeTab === 'dashboard' ? 'Insight Overview' : 'Participant Data'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={exportCSV}
              className="px-4 py-2 bg-[#002D62] text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-all uppercase tracking-wider"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </header>

        <div className="p-8 space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' ? (
              <motion.div 
                key="dash"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-sans">
                  <StatCard icon={<Users />} label="Total Registered" value={registrations.length} color="blue" />
                  <StatCard icon={<TrendingUp />} label="Will Attend" value={registrations.filter(r => r.willAttend === 'Yes').length} color="green" />
                  <StatCard icon={<Camera />} label="Beginners" value={registrations.filter(r => r.experience === 'Beginner').length} color="orange" />
                  <StatCard icon={<Star />} label="Advanced" value={registrations.filter(r => r.experience === 'Advanced').length} color="purple" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Experience Chart */}
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                     <div className="flex items-center justify-between mb-8">
                       <h3 className="text-lg font-black text-slate-900 uppercase">Experience Levels</h3>
                       <div className="p-2 bg-slate-50 rounded-lg"><BarChart3 className="w-4 h-4 text-[#002D62]" /></div>
                     </div>
                     <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={experienceData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} 
                            />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <Tooltip 
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                              {experienceData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  {/* Topics Pie Chart */}
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                     <div className="flex items-center justify-between mb-8">
                       <h3 className="text-lg font-black text-slate-900 uppercase">Interest Breakdown</h3>
                       <div className="p-2 bg-slate-50 rounded-lg"><TrendingUp className="w-4 h-4 text-[#002D62]" /></div>
                     </div>
                     <div className="h-72 flex font-sans">
                        <ResponsiveContainer width="60%" height="100%">
                          <PieChart>
                            <Pie
                              data={topicsData}
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {topicsData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="w-40 flex flex-col justify-center gap-2">
                          {topicsData.slice(0, 5).map((t, idx) => (
                            <div key={t.name} className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                              <span className="text-[10px] font-bold text-slate-500 uppercase truncate whitespace-pre italic">{t.name}</span>
                            </div>
                          ))}
                        </div>
                     </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="table"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Table Header/Search */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                      type="text" 
                      placeholder="Search participants, email, or department..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-[#002D62]/10 focus:border-[#002D62] transition-all text-sm italic"
                    />
                  </div>
                  <div className="flex items-center gap-4 text-slate-400 text-sm font-bold uppercase tracking-tighter">
                    Showing {filteredRegistrations.length} of {registrations.length} entries
                  </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-sans italic">
                      <thead>
                        <tr className="bg-[#002D62] text-white uppercase text-[10px] tracking-widest">
                          <th className="px-6 py-5 font-black">Participant</th>
                          <th className="px-6 py-5 font-black">Experience</th>
                          <th className="px-6 py-5 font-black">Interest</th>
                          <th className="px-6 py-5 font-black">Schedule</th>
                          <th className="px-6 py-5 font-black text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredRegistrations.map((r, i) => (
                          <motion.tr 
                            key={r.id} 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            transition={{ delay: i * 0.05 }}
                            className="hover:bg-slate-50 transition-colors group"
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 uppercase border border-slate-200">
                                  {r.firstName ? r.firstName[0] : (r as any).fullName?.[0]}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 tracking-tight">{r.firstName} {r.lastName}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{r.churchBranch}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest italic",
                                r.experience === 'Beginner' ? "bg-orange-50 text-orange-600" :
                                r.experience === 'Intermediate' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                              )}>
                                {r.experience}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {r.topics.slice(0, 2).map(t => (
                                  <span key={t} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase truncate">{t}</span>
                                ))}
                                {r.topics.length > 2 && <span className="text-[9px] font-bold text-slate-300">+{r.topics.length - 2}</span>}
                              </div>
                            </td>
                            <td className="px-6 py-5">
                               <p className="text-xs font-bold text-slate-500 italic truncate max-w-[150px]">{r.preferredSchedule || 'Not stated'}</p>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <button className="p-2 text-slate-300 group-hover:text-[#002D62] transition-colors"><ChevronRight className="w-5 h-5" /></button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredRegistrations.length === 0 && (
                      <div className="p-20 text-center text-slate-300 italic">
                        No registrations found matching your search.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function SidebarTab({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold uppercase tracking-widest text-xs",
        active ? "bg-[#002D62] text-white shadow-lg" : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: 'blue' | 'green' | 'orange' | 'purple' }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center justify-center group hover:shadow-md transition-shadow">
      <div className={cn("p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform", colors[color])}>
        {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6" })}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">{label}</p>
      <h4 className="text-3xl font-black text-slate-900 italic">{value}</h4>
    </div>
  );
}
