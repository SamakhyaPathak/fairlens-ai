import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Upload, BarChart3, Moon, Sun, AlertTriangle, CheckCircle2, LogIn, LogOut, History as HistoryIcon, LayoutDashboard } from 'lucide-react';
import { 
  auth, 
  db, 
  signInWithGoogle, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  serverTimestamp 
} from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import Papa from 'papaparse';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js';
import { Radar, Bar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

// --- Types ---
interface AuditResult {
  score: number;
  biases: {
    gender: { score: number; observation: string };
    age: { score: number; observation: string };
    location: { score: number; observation: string };
  };
  distribution: {
    gender: { male: number; female: number; other: number };
    ageGroups: { minor: number; adult: number; senior: number };
    regions: { urban: number; rural: number; other: number };
  };
  recommendations: string[];
}

// --- Components ---

const Navbar = ({ isDark, setIsDark, user, onLogin, onLogout }: { 
  isDark: boolean; 
  setIsDark: (v: boolean) => void;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
}) => (
  <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-background/50 backdrop-blur-sm sticky top-0 z-50">
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-sm font-medium">Projects</span>
      <span className="text-border">/</span>
      <span className="text-sm font-bold tracking-tight">Bias Mitigation V2</span>
    </div>
    
    <div className="flex items-center gap-4">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setIsDark(!isDark)}
        className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </Button>
      
      {user ? (
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-muted-foreground hidden sm:block">{user.displayName || 'Researcher'}</span>
          <img src={user.photoURL || ''} className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-sm" referrerPolicy="no-referrer" />
          <Button variant="ghost" size="sm" onClick={onLogout} className="text-xs font-bold text-muted-foreground hover:text-foreground p-0 h-auto">
             Sign Out
          </Button>
        </div>
      ) : (
        <Button size="sm" onClick={onLogin} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-4 h-8 rounded-md">
           Login
        </Button>
      )}
    </div>
  </header>
);

const Hero = ({ onGetStarted }: { onGetStarted: () => void }) => (
  <div className="flex flex-col items-center justify-center py-32 text-center px-4 max-w-5xl mx-auto">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] uppercase font-bold tracking-widest mb-6 animate-pulse">
        Ethical AI Framework V2
      </div>
      <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.95] text-foreground">
        ALGORIHTMIC <br /> <span className="text-primary italic">EQUITY</span> SYSTEM
      </h1>
      <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
        Mission-critical auditing for intersectional bias. Detect gender imbalances, ageist patterns, and geographic silos before deployment.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-24">
        <Button size="lg" onClick={onGetStarted} className="bg-primary hover:bg-primary/90 text-white font-black h-14 px-12 text-lg rounded-md shadow-2xl shadow-primary/30">
          BEGIN AUDIT &rarr;
        </Button>
        <Button size="lg" variant="outline" className="h-14 px-12 text-lg font-bold border-border hover:bg-secondary">
          OUR METHODOLOGY
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left border-t border-border pt-16">
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold">Detection</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Proprietary fairness engine identifying intersectional biases in real-time.
          </p>
        </div>
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold">Radar Reporting</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Multi-dimensional visualization of equity across protected classes.
          </p>
        </div>
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold">Remediation</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Actionable intelligence to rebalance datasets and minimize algorithmic risk.
          </p>
        </div>
      </div>
    </motion.div>
  </div>
);

const UploadPortal = ({ onAudit }: { onAudit: (data: any[]) => void }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
      toast.error("Please upload a CSV or JSON file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (file.name.endsWith('.csv')) {
        Papa.parse(content, {
          header: true,
          complete: (results) => onAudit(results.data.slice(0, 50)), // Sample 50 rows
        });
      } else {
        try {
          const json = JSON.parse(content);
          onAudit(Array.isArray(json) ? json.slice(0, 50) : [json]);
        } catch (err) {
          toast.error("Failed to parse JSON file");
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div 
        className={`border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer p-20 flex flex-col items-center justify-center gap-6 bg-card ${
          isDragging ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-border hover:border-primary/50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
        }}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.csv,.json';
          input.onchange = (e) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            if (file) handleFile(file);
          };
          input.click();
        }}
      >
        <div className="p-5 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
          <Upload className="w-10 h-10" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold mb-1">Drop your datasets here</h3>
          <p className="text-sm text-muted-foreground">CSV or JSON (Max 50MB)</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white font-bold px-8 h-11 rounded-md shadow-lg shadow-primary/20">
          Browse Research Files
        </Button>
      </div>
    </div>
  );
};

const ResultsDashboard = ({ result }: { result: AuditResult }) => {
  const radarData = {
    labels: ['Gender Fairness', 'Age Fairness', 'Location Fairness'],
    datasets: [
      {
        label: 'Fairness Score',
        data: [result.biases.gender.score, result.biases.age.score, result.biases.location.score],
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(16, 185, 129, 1)',
      },
    ],
  };

  const genderBarData = {
    labels: ['Male', 'Female', 'Other'],
    datasets: [{
      label: 'Count',
      data: [result.distribution.gender.male, result.distribution.gender.female, result.distribution.gender.other],
      backgroundColor: ['rgba(16, 185, 129, 0.6)', 'rgba(56, 189, 248, 0.6)', 'rgba(168, 85, 247, 0.6)'],
      borderRadius: 4,
    }]
  };

  const ageBarData = {
    labels: ['Minors', 'Adults', 'Seniors'],
    datasets: [{
      label: 'Count',
      data: [result.distribution.ageGroups.minor, result.distribution.ageGroups.adult, result.distribution.ageGroups.senior],
      backgroundColor: 'rgba(245, 158, 11, 0.6)',
      borderRadius: 4,
    }]
  };

  const regionBarData = {
    labels: ['Urban', 'Rural', 'Other'],
    datasets: [{
      label: 'Count',
      data: [result.distribution.regions.urban, result.distribution.regions.rural, result.distribution.regions.other],
      backgroundColor: 'rgba(16, 185, 129, 0.6)',
      borderRadius: 4,
    }]
  };
  
  return (
    <div className="grid grid-cols-12 gap-6 pb-20">
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border rounded-lg p-6 flex flex-col shadow-none">
            <div className="text-muted-foreground text-xs font-bold uppercase mb-1">Fairness Score</div>
            <div className="text-3xl font-bold text-primary">{result.score}/100</div>
            <div className="text-[10px] mt-2 text-muted-foreground">Verified Audit Accuracy</div>
          </Card>
          <Card className="bg-card border-border rounded-lg p-6 flex flex-col shadow-none">
            <div className="text-muted-foreground text-xs font-bold uppercase mb-1">Data Samples</div>
            <div className="text-3xl font-bold">50 Rows</div>
            <div className="text-[10px] mt-2 text-primary">Certified Secure</div>
          </Card>
          <Card className="bg-card border-border rounded-lg p-6 flex flex-col shadow-none">
            <div className="text-muted-foreground text-xs font-bold uppercase mb-1">Bias Classes</div>
            <div className="text-3xl font-bold text-amber-500">3</div>
            <div className="text-[10px] mt-2 text-muted-foreground">Intersectional Analysis</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card border-border p-6 flex flex-col shadow-none min-h-[400px]">
             <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
               <HistoryIcon className="w-4 h-4" /> Bias Distribution
             </h3>
             <div className="flex-1 flex items-center justify-center">
               <Radar data={radarData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
             </div>
             <div className="grid grid-cols-2 gap-2 mt-4 text-[10px]">
               <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary" /> Gender Equity</div>
               <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> Age Variance</div>
             </div>
          </Card>

          <Card className="bg-card border-border p-6 flex flex-col shadow-none">
             <h3 className="text-sm font-bold mb-4">Intersectional Insights</h3>
             <div className="space-y-4 flex-1">
                {Object.entries(result.biases).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase opacity-70">{key}</span>
                      <span className="text-xs font-mono font-bold text-primary">{value.score}%</span>
                    </div>
                    <Progress value={value.score} className="h-1" />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{value.observation}</p>
                  </div>
                ))}
             </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="p-4 bg-card shadow-none">
             <h4 className="text-[10px] font-bold uppercase mb-3 opacity-50">Gender Balance</h4>
             <div className="h-[150px]">
               <Bar data={genderBarData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
             </div>
           </Card>
           <Card className="p-4 bg-card shadow-none">
             <h4 className="text-[10px] font-bold uppercase mb-3 opacity-50">Age Demographics</h4>
             <div className="h-[150px]">
               <Bar data={ageBarData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
             </div>
           </Card>
           <Card className="p-4 bg-card shadow-none">
             <h4 className="text-[10px] font-bold uppercase mb-3 opacity-50">Region Distribution</h4>
             <div className="h-[150px]">
               <Bar data={regionBarData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
             </div>
           </Card>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
        <Card className="bg-card border-border shadow-none overflow-hidden h-full">
           <CardHeader>
             <CardTitle className="text-sm font-bold">Recommendations</CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
              {result.recommendations.map((rec, i) => (
                <div key={i} className="pb-4 border-b border-border last:border-0 border-dashed">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Priority {i + 1}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{rec}</p>
                </div>
              ))}
           </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'hero' | 'upload' | 'loading' | 'results' | 'history'>('hero');
  const [result, setResult] = useState<AuditResult | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const loadHistory = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, "users", user.uid, "audits"),
        orderBy("timestamp", "desc")
      );
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setHistory(docs);
    } catch (err) {
      console.error("History fetch failed", err);
      const local = JSON.parse(localStorage.getItem(`audits_${user.uid}`) || '[]');
      setHistory(local);
    }
  };

  const saveAudit = async (res: AuditResult, filename: string) => {
    const auditData = {
      ...res,
      filename,
      timestamp: serverTimestamp()
    };

    if (user) {
      try {
        await addDoc(collection(db, "users", user.uid, "audits"), auditData);
      } catch (err) {
        console.error("Cloud save failed", err);
        const local = JSON.parse(localStorage.getItem(`audits_${user.uid}`) || '[]');
        localStorage.setItem(`audits_${user.uid}`, JSON.stringify([{ ...auditData, timestamp: new Date().toISOString() }, ...local]));
      }
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      toast.success("Welcome back!");
    } catch (err) {
      toast.error("Authentication failed");
    }
  };

  const performAudit = async (data: any[], filename: string = 'dataset.csv') => {
    setView('loading');
    try {
      const resp = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, type: 'csv/json' }),
      });
      const res = await resp.json();
      if (res.error) throw new Error(res.error);
      setResult(res);
      await saveAudit(res, filename);
      setView('results');
      toast.success("Audit complete!");
    } catch (err: any) {
      toast.error("Audit failed: " + err.message);
      setView('upload');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Navbar 
        isDark={isDark} 
        setIsDark={(v) => setIsDark(v)} 
        user={user} 
        onLogin={handleLogin} 
        onLogout={() => auth.signOut()} 
      />
      
      <div className="flex h-full min-h-[calc(100vh-64px)]">
        {user && (
          <aside className="w-64 bg-card border-r border-border p-6 flex flex-col justify-between sticky top-16 h-[calc(100vh-64px)] hidden lg:flex">
            <nav className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-primary-foreground">FL</div>
                  <span className="text-xl font-bold tracking-tight">FairLens AI</span>
                </div>
                <ul className="space-y-2">
                  <li 
                    className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium cursor-pointer transition-colors ${
                      view === 'hero' || view === 'upload' ? 'bg-secondary text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setView('upload')}
                  >
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </li>
                  <li 
                    className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium cursor-pointer transition-colors ${
                      view === 'history' ? 'bg-secondary text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => { setView('history'); loadHistory(); }}
                  >
                    <HistoryIcon className="w-4 h-4" /> Audit History
                  </li>
                  <li className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                    <BarChart3 className="w-4 h-4" /> Reports
                  </li>
                </ul>
              </div>
            </nav>
            <div className="p-4 bg-background/50 rounded-xl border border-border">
              <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2">Status</div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <span className="text-sm font-medium">Engine Online</span>
              </div>
            </div>
          </aside>
        )}

        <main className="flex-1 p-8">
          <AnimatePresence mode="wait">
            {view === 'hero' && (
              <motion.div key="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Hero onGetStarted={() => user ? setView('upload') : handleLogin()} />
              </motion.div>
            )}

            {view === 'upload' && (
              <motion.div key="upload" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <div className="text-center mt-12 mb-8">
                  <h2 className="text-3xl font-bold mb-2">Data Integrity Hub</h2>
                  <p className="text-muted-foreground">Upload your files for ethical auditing</p>
                </div>
                <UploadPortal onAudit={(data) => performAudit(data)} />
              </motion.div>
            )}

            {view === 'history' && (
              <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto p-8">
                 <h2 className="text-3xl font-bold mb-6">Audit History</h2>
                 <div className="grid gap-4">
                    {history.length === 0 ? (
                      <Card className="border-dashed py-12 flex flex-col items-center opacity-50">
                        <HistoryIcon className="w-12 h-12 mb-4" />
                        <p>No audits found yet.</p>
                      </Card>
                    ) : history.map((h, i) => (
                      <Card key={i} className="hover:border-primary/40 transition-colors cursor-pointer" onClick={() => { setResult(h as any); setView('results'); }}>
                         <CardContent className="p-4 flex items-center justify-between">
                             <div className="flex items-center gap-4">
                               <div className="p-2 rounded bg-muted">
                                  <Shield className={`w-5 h-5 ${h.score > 80 ? 'text-primary' : 'text-amber-500'}`} />
                               </div>
                               <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-sm">{h.filename}</h4>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                      h.score > 80 ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                    }`}>
                                      {h.score > 80 ? 'FAIR' : 'RISK'}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">{new Date(h.timestamp?.seconds * 1000 || h.timestamp).toLocaleString()}</p>
                               </div>
                            </div>
                            <div className="text-right">
                               <span className="text-2xl font-mono font-bold">{h.score}%</span>
                               <p className="text-[10px] uppercase font-bold opacity-50">Score</p>
                            </div>
                         </CardContent>
                      </Card>
                    ))}
                 </div>
              </motion.div>
            )}

          {view === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 gap-6"
            >
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-medium mb-1">Scanning for Biases...</h3>
                <p className="text-muted-foreground animate-pulse text-sm">Consulting Gemini Fairness Engine</p>
              </div>
            </motion.div>
          )}

          {view === 'results' && result && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between max-w-6xl mx-auto px-8 py-8">
                 <div>
                   <h2 className="text-3xl font-bold">Audit Results</h2>
                   <p className="text-muted-foreground">Dataset Evaluation Report</p>
                 </div>
                 <Button variant="outline" onClick={() => setView('upload')}>
                   New Audit
                 </Button>
              </div>
              <ResultsDashboard result={result} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>

    <Toaster position="top-center" richColors />
  </div>
  );
}
