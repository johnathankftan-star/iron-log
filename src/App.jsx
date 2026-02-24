import React, { useState, useEffect, useMemo } from 'react';
import { 
  Dumbbell, 
  History, 
  Target, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Search,
  Calendar,
  BarChart3,
  Flame,
  X,
  ExternalLink,
  Info,
  Activity,
  Layers,
  Sparkles,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  onSnapshot, 
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken,
  onAuthStateChanged 
} from 'firebase/auth';

// --- CONFIGURATION ---
// 1. Get your Gemini Key from https://aistudio.google.com/
const apiKey = "AIzaSyDW7ddyMiYRO19nsEZj8jg3Jv1Wt0Z_CiQ"; 
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";

// 2. Firebase Config
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBgCyssT3tqnXaWn6MqnVHEtLwIXL3FmYo",
  authDomain: "ironlog-df469.firebaseapp.com",
  projectId: "ironlog-df469",
  storageBucket: "ironlog-df469.firebasestorage.app",
  messagingSenderId: "581810726969",
  appId: "1:581810726969:web:8af286130608c902a5c5e8",
  measurementId: "G-FK6W6GZR5G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// FIX: Sanitizing appId to prevent "Invalid collection reference" errors due to slashes in paths
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'iron-log-v1';
const appId = rawAppId.split('/').join('_');

const MUSCLE_DETAILS = {
  'Chest': 'Primary pushing muscles.', 'Back': 'Large pulling group.', 
  'Shoulders': 'Overhead power.', 'Biceps': 'Arm pulling.', 
  'Triceps': 'Arm pushing.', 'Quads': 'Front thigh.', 
  'Hamstrings': 'Back thigh.', 'Glutes': 'Explosive power.', 
  'Calves': 'Ankle stability.', 'Core': 'Spine stability.', 'Cardio': 'Endurance.'
};

const MUSCLE_GROUPS = Object.keys(MUSCLE_DETAILS);

const DEFAULT_WORKOUTS = [
  { id: 'fw1', name: "Farmer's Walk", muscles: ['Core', 'Back', 'Shoulders', 'Quads'], difficulty: 'Beginner', url: 'https://www.youtube.com/results?search_query=proper+farmers+walk+form' },
  { id: 'fw2', name: 'Walking Lunges', muscles: ['Quads', 'Glutes', 'Hamstrings'], difficulty: 'Beginner', url: 'https://www.youtube.com/results?search_query=walking+lunges+form' },
  { id: 'fw3', name: 'Kettlebell Swings', muscles: ['Glutes', 'Hamstrings', 'Back', 'Core'], difficulty: 'Intermediate', url: 'https://www.youtube.com/results?search_query=kettlebell+swing+form' },
  { id: '1', name: 'Barbell Bench Press', muscles: ['Chest', 'Shoulders', 'Triceps'], difficulty: 'Intermediate', url: 'https://www.youtube.com/results?search_query=bench+press+form' },
  { id: '4', name: 'Barbell Deadlift', muscles: ['Back', 'Glutes', 'Hamstrings', 'Core'], difficulty: 'Advanced', url: 'https://www.youtube.com/results?search_query=deadlift+form' },
  { id: '9', name: 'Barbell Squats', muscles: ['Quads', 'Glutes', 'Hamstrings', 'Core'], difficulty: 'Intermediate', url: 'https://www.youtube.com/results?search_query=squat+form' },
  { id: 'm1', name: 'Chest Press Machine', muscles: ['Chest', 'Shoulders', 'Triceps'], difficulty: 'Beginner', url: 'https://www.youtube.com/results?search_query=chest+press+machine' },
  { id: 'm5', name: 'Lat Pulldown Machine', muscles: ['Back', 'Biceps'], difficulty: 'Beginner', url: 'https://www.youtube.com/results?search_query=lat+pulldown' },
  { id: 'm15', name: 'Leg Press Machine', muscles: ['Quads', 'Glutes', 'Hamstrings'], difficulty: 'Beginner', url: 'https://www.youtube.com/results?search_query=leg+press+machine' },
  { id: 'c1', name: 'Treadmill', muscles: ['Cardio', 'Quads', 'Calves'], difficulty: 'Beginner', url: 'https://www.youtube.com/results?search_query=treadmill+tips' }
];

const MusclePictorial = ({ muscles = [], size = 80 }) => {
  const isSelected = (m) => Array.isArray(muscles) && muscles.includes(m);
  const colorActive = "fill-blue-500 dark:fill-blue-400";
  const colorInactive = "fill-slate-200 dark:fill-slate-800";
  const strokeColor = "stroke-slate-300 dark:stroke-slate-700";
  return (
    <svg viewBox="0 0 100 160" width={size} height={size * 1.6} className="drop-shadow-sm transition-all duration-300">
      <circle cx="50" cy="15" r="10" className={`${isSelected('Core') || isSelected('Shoulders') ? 'fill-blue-200 dark:fill-blue-900' : colorInactive} ${strokeColor}`} strokeWidth="1" />
      <path d="M35 30 Q50 25 65 30 L70 40 L30 40 Z" className={`${isSelected('Shoulders') ? colorActive : colorInactive} ${strokeColor}`} strokeWidth="1" />
      <path d="M32 42 H68 V60 H32 Z" className={`${isSelected('Chest') ? colorActive : colorInactive} ${strokeColor}`} strokeWidth="1" />
      <path d="M35 62 H65 V85 H35 Z" className={`${isSelected('Core') ? colorActive : colorInactive} ${strokeColor}`} strokeWidth="1" />
      <path d="M25 40 L30 40 L30 65 L20 65 Z" className={`${isSelected('Biceps') || isSelected('Triceps') ? colorActive : colorInactive} ${strokeColor}`} strokeWidth="1" />
      <path d="M70 40 L75 40 L80 65 L70 65 Z" className={`${isSelected('Biceps') || isSelected('Triceps') ? colorActive : colorInactive} ${strokeColor}`} strokeWidth="1" />
      <path d="M35 87 H49 V120 H30 Z" className={`${isSelected('Quads') || isSelected('Glutes') || isSelected('Hamstrings') ? colorActive : colorInactive} ${strokeColor}`} strokeWidth="1" />
      <path d="M51 87 H65 V120 H51 Z" className={`${isSelected('Quads') || isSelected('Glutes') || isSelected('Hamstrings') ? colorActive : colorInactive} ${strokeColor}`} strokeWidth="1" />
      <path d="M32 122 H47 V155 H35 Z" className={`${isSelected('Calves') ? colorActive : colorInactive} ${strokeColor}`} strokeWidth="1" />
      <path d="M53 122 H68 V155 H65 Z" className={`${isSelected('Calves') ? colorActive : colorInactive} ${strokeColor}`} strokeWidth="1" />
      {isSelected('Cardio') && <path d="M50 55 Q55 50 60 55 Q55 60 50 65 Q45 60 40 55 Q45 50 50 55" className="fill-red-500 animate-pulse" />}
    </svg>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('library');
  const [logs, setLogs] = useState([]);
  const [mastered, setMastered] = useState([]);
  const [customWorkouts, setCustomWorkouts] = useState([]);
  const [isLogging, setIsLogging] = useState(null);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('All');
  
  // AI States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error("Auth Error:", err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const logsCol = collection(db, 'artifacts', appId, 'users', user.uid, 'logs');
    const masteredCol = collection(db, 'artifacts', appId, 'users', user.uid, 'mastered');
    const customCol = collection(db, 'artifacts', appId, 'users', user.uid, 'custom_workouts');

    const unsubLogs = onSnapshot(logsCol, (s) => {
      setLogs(s.docs.map(doc => ({ id: doc.id, ...doc.data(), date: doc.data().date?.toDate() || new Date() })).sort((a,b) => b.date - a.date));
    }, (err) => console.error("Logs Snapshot Error:", err));

    const unsubMastered = onSnapshot(masteredCol, (s) => setMastered(s.docs.map(doc => doc.id)));
    const unsubCustom = onSnapshot(customCol, (s) => setCustomWorkouts(s.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

    return () => { unsubLogs(); unsubMastered(); unsubCustom(); };
  }, [user]);

  const allWorkouts = useMemo(() => [...DEFAULT_WORKOUTS, ...customWorkouts], [customWorkouts]);

  const filteredWorkouts = useMemo(() => {
    return allWorkouts.filter(w => {
      const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMuscle = selectedMuscle === 'All' || (Array.isArray(w.muscles) && w.muscles.includes(selectedMuscle));
      return matchesSearch && matchesMuscle;
    });
  }, [allWorkouts, searchQuery, selectedMuscle]);

  const muscleUsage = useMemo(() => {
    const counts = {};
    logs.forEach(log => {
      if (Array.isArray(log.muscles)) {
        log.muscles.forEach(m => counts[m] = (counts[m] || 0) + 1);
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [logs]);

  const callGemini = async (prompt, system = "You are a pro fitness coach.") => {
    setAiLoading(true); setShowAiModal(true); setAiResponse("");
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], systemInstruction: { parts: [{ text: system }] } })
      });
      const result = await response.json();
      setAiResponse(result.candidates?.[0]?.content?.parts?.[0]?.text || "No response received.");
    } catch (e) { setAiResponse("Error connecting to AI. Check your API key."); }
    setAiLoading(false);
  };

  const getProTips = (name) => {
    callGemini(`Give me 3 short pro-tips for ${name}. Focus on safety and muscle recruitment.`, "You are a biomechanics expert.");
  };

  const toggleMastery = async (id) => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'mastered', id);
    if (mastered.includes(id)) await deleteDoc(docRef);
    else await setDoc(docRef, { mastered: true, at: Timestamp.now() });
  };

  const Modal = ({ title, children, onClose }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-500" /></button>
        </div>
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24 transition-colors">
      <header className="p-4 border-b bg-white dark:bg-slate-900 sticky top-0 z-40 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg"><Dumbbell size={20} /></div>
          <h1 className="text-xl font-black italic uppercase">IronLog</h1>
        </div>
        <button onClick={() => setShowAddCustom(true)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full hover:bg-blue-600 hover:text-white transition-all"><Plus size={20} /></button>
      </header>

      <main className="p-4 max-w-xl mx-auto space-y-6">
        {activeTab === 'library' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
               <div className="relative z-10">
                <h2 className="text-xl font-black mb-2 flex items-center gap-2">✨ AI Planner</h2>
                <div className="flex gap-2">
                  <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Target today..." className="flex-1 bg-white/10 rounded-xl px-4 py-2 text-sm outline-none placeholder:text-blue-200" />
                  <button onClick={() => callGemini(`Plan a workout for goal: ${aiPrompt}`)} disabled={!aiPrompt} className="bg-white text-blue-600 font-black px-4 py-2 rounded-xl text-xs uppercase disabled:opacity-50 shadow-md">✨</button>
                </div>
               </div>
               <Sparkles className="absolute -right-4 -bottom-4 text-white/5 rotate-12" size={120} />
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Search exercises..." className="w-full bg-white dark:bg-slate-900 border rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 outline-none border-slate-200 dark:border-slate-800" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              <button onClick={() => setSelectedMuscle('All')} className={`px-4 py-2 rounded-full whitespace-nowrap text-xs font-bold border transition-all ${selectedMuscle === 'All' ? 'bg-blue-600 border-blue-600 text-white' : 'text-slate-500'}`}>All</button>
              {MUSCLE_GROUPS.map(m => <button key={m} onClick={() => setSelectedMuscle(m)} className={`px-4 py-2 rounded-full whitespace-nowrap text-xs font-bold border transition-all ${selectedMuscle === m ? 'bg-blue-600 border-blue-600 text-white' : 'text-slate-500'}`}>{m}</button>)}
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredWorkouts.map(w => (
                <div key={w.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex gap-4 transition-all hover:border-blue-400 group">
                  <div className="shrink-0 bg-slate-50 dark:bg-slate-950 p-2 rounded-2xl border border-slate-100 dark:border-slate-800"><MusclePictorial muscles={w.muscles} size={48} /></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-sm uppercase leading-tight tracking-tight">{w.name}</h3>
                      <a href={w.url} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-blue-600 transition-colors"><ExternalLink size={16} /></a>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {w.muscles.map(m => <span key={m} className="text-[8px] bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase font-black text-slate-400">{m}</span>)}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => toggleMastery(w.id)} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-black uppercase border transition-all ${mastered.includes(w.id) ? 'bg-green-50 text-green-600 border-green-200' : 'text-slate-400'}`}>
                        {mastered.includes(w.id) ? <CheckCircle2 size={12} /> : <Circle size={12} />} Master
                      </button>
                      <button onClick={() => setIsLogging(w)} className="flex-[2] bg-blue-600 text-white py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-blue-500/20 active:scale-95 transition-all">Log Training</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4 animate-in fade-in">
            {logs.length === 0 ? <div className="text-center py-20 opacity-30 font-black uppercase tracking-widest text-sm">No training logged</div> : logs.map(log => (
              <div key={log.id} className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <MusclePictorial muscles={log.muscles} size={28} />
                  <div><h4 className="font-bold text-sm uppercase">{log.workoutName}</h4><p className="text-xs font-bold text-slate-400">{log.date.toLocaleDateString()} • {log.weight}kg</p></div>
                </div>
                <button onClick={async () => await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'logs', log.id))} className="text-slate-200 hover:text-red-500 p-2"><X size={18} /></button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="text-center space-y-8 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 inline-block relative shadow-2xl">
              <MusclePictorial muscles={muscleUsage.map(m => m[0])} size={150} />
              <div className="absolute top-6 right-6 bg-blue-600 text-white p-2 rounded-full animate-pulse shadow-lg"><Target size={24} /></div>
            </div>
            
            <button onClick={() => callGemini(`Muscle Activations: ${muscleUsage.map(m => m[0]+':'+m[1]).join(', ')}. Analyze my imbalances.`)} className="w-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 py-4 rounded-3xl text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">✨ AI Coach Performance Audit</button>

            <div className="space-y-6 text-left pb-10">
              {muscleUsage.map(([m, c]) => (
                <div key={m} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 tracking-wider"><span>{m}</span><span>{c} Activations</span></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 transition-all duration-1000 shadow-[0_0_8px_rgba(37,99,235,0.3)]" style={{ width: `${(c / Math.max(1, ...muscleUsage.map(x => x[1]))) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-2 rounded-[2rem] flex gap-2 shadow-2xl border border-white/20 dark:border-slate-800/50 z-50">
        <button onClick={() => setActiveTab('library')} className={`p-4 rounded-2xl transition-all duration-300 ${activeTab === 'library' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 scale-105' : 'text-slate-400'}`}><Dumbbell size={22} /></button>
        <button onClick={() => setActiveTab('history')} className={`p-4 rounded-2xl transition-all duration-300 ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 scale-105' : 'text-slate-400'}`}><History size={22} /></button>
        <button onClick={() => setActiveTab('stats')} className={`p-4 rounded-2xl transition-all duration-300 ${activeTab === 'stats' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 scale-105' : 'text-slate-400'}`}><BarChart3 size={22} /></button>
      </nav>

      {showAiModal && (
        <Modal title="✨ Coach Gemini" onClose={() => setShowAiModal(false)}>
          {aiLoading ? <div className="py-12 flex flex-col items-center gap-4 text-slate-400"><Loader2 className="animate-spin" /> <span className="text-[10px] font-black uppercase tracking-widest">Training AI...</span></div> : <div className="text-sm leading-relaxed whitespace-pre-wrap">{aiResponse}</div>}
        </Modal>
      )}

      {isLogging && (
        <Modal title={`Log ${isLogging.name}`} onClose={() => setIsLogging(null)}>
          <div className="flex flex-col items-center mb-6 gap-4">
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-3xl border border-slate-100 dark:border-slate-800"><MusclePictorial muscles={isLogging.muscles} size={100} /></div>
            <button onClick={() => getProTips(isLogging.name)} className="w-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-blue-100 transition-all">
              <Sparkles size={14} /> Get AI Pro-Tips
            </button>
          </div>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const val = e.target.w.value;
            if (!user) return;
            await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'logs'), {
              workoutName: isLogging.name, muscles: isLogging.muscles, weight: val, date: Timestamp.now()
            });
            setIsLogging(null);
          }}>
            <input name="w" type="number" step="0.5" placeholder="Weight (kg)" className="w-full p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-center" required />
            <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-600/30 active:scale-95 transition-all">Save Set</button>
          </form>
        </Modal>
      )}

      {showAddCustom && (
        <Modal title="Add Custom Exercise" onClose={() => setShowAddCustom(false)}>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const secondary = formData.get('sec').split(',').map(s => s.trim()).filter(s => s);
            if (!user) return;
            await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'custom_workouts'), {
              name: formData.get('name'), muscles: [formData.get('primary'), ...secondary], difficulty: 'Custom', createdAt: Timestamp.now()
            });
            setShowAddCustom(false);
          }}>
            <div className="space-y-4">
              <input name="name" placeholder="Exercise Name" className="w-full p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" required />
              <select name="primary" className="w-full p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold">
                {MUSCLE_GROUPS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <input name="sec" placeholder="Secondary Muscles (e.g. Core, Back)" className="w-full p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" />
              <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-600/30">Add to Library</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
