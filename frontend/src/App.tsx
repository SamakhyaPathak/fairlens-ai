import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Upload, ChartBar, MessageSquare, Sun, Moon, 
  ChevronRight, ArrowRight, Download, FileText, CheckCircle2,
  AlertCircle, LayoutDashboard, Home, Search, Send, LogIn, LogOut,
  User, History, Clock
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { jsPDF } from 'jspdf';
import { toast, Toaster } from 'sonner';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import Papa from 'papaparse';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getFirebase, signInWithGoogle, saveAudit, getAuditHistory } from './lib/firebase';

// --- Utilities ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface AuditResult {
  insufficient_data: boolean;
  message?: string;
  metrics: {
    demographic_parity_gap: number;
    disparate_impact_ratio: number;
    equalized_odds_diff: number;
    selection_rates: {
      privileged: number;
      unprivileged: number;
    }
  };
  fairness_score: number;
}

// --- Components ---

const Navbar = ({ isDark, toggleDark, user }: { isDark: boolean, toggleDark: () => void, user: FirebaseUser | null }) => {
  return (
    <nav className="fixed top-0 w-full z-50 glass-nav">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <ShieldCheck className="text-white w-5 h-5" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground">
            FairLens<span className="text-primary italic">AI</span>
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <Link to="/upload" className="hover:text-primary transition-colors">Audit</Link>
          <Link to="/dashboard" className="hover:text-primary transition-colors">Workspace</Link>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleDark}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-5 h-5 text-accent" /> : <Moon className="w-5 h-5 text-secondary" />}
          </button>
          
          {user ? (
            <div className="flex items-center gap-3 bg-white/5 pr-4 rounded-full border border-white/10">
              <img src={user.photoURL || ''} alt="User" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full" />
              <span className="text-xs font-bold hidden lg:block">{user.displayName?.split(' ')[0]}</span>
            </div>
          ) : (
            <button 
              onClick={() => signInWithGoogle().catch(e => toast.error("Sign-in failed"))}
              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg flex items-center gap-2 hover:opacity-90 transition-all"
            >
              <LogIn className="w-4 h-4" /> Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

// --- Page: Landing ---
const LandingPage = () => {
  return (
    <div className="pt-24 pb-20 px-6 max-w-7xl mx-auto">
      <section className="text-center mb-24">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl md:text-8xl font-display font-bold mb-6 leading-tight"
        >
          Audit for <br />
          <span className="gradient-text">Ethical Intelligence</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          Detect, measure, and remediate algorithmic bias in seconds. 
          The unified platform for responsible AI development.
        </motion.p>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4"
        >
          <Link to="/upload" className="bg-primary text-white px-8 py-4 rounded-xl font-semibold flex items-center gap-2 hover:opacity-90 transition-all lift-glow">
            Start Free Audit <ArrowRight className="w-5 h-5" />
          </Link>
          <button className="bg-white/5 border border-white/10 text-foreground px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-all">
            See Methodology
          </button>
        </motion.div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
        {[
          { icon: Upload, title: "CSV Ingestion", desc: "Drag and drop datasets for instant mapping and bias detection.", color: "text-primary" },
          { icon: ChartBar, title: "Fairness Metrics", desc: "Analyze impact ratios, parity gaps, and equalized odds with math integrity.", color: "text-secondary" },
          { icon: MessageSquare, title: "AI Remediation", desc: "Gemini-powered insights providing actionable steps to handle imbalance.", color: "text-accent" },
        ].map((feat, i) => (
          <motion.div 
            key={feat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-8 rounded-2xl bg-card border border-white/5 lift-glow"
          >
            <feat.icon className={cn("w-10 h-10 mb-6", feat.color)} />
            <h3 className="text-xl font-display font-bold mb-3">{feat.title}</h3>
            <p className="text-muted-foreground">{feat.desc}</p>
          </motion.div>
        ))}
      </section>

      <section className="bg-white/5 rounded-3xl p-12 border border-white/10 flex flex-wrap justify-around gap-12 text-center items-center">
        <div>
          <h4 className="text-4xl font-display font-bold text-primary mb-1">1.2M+</h4>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Rows Audited</p>
        </div>
        <div>
          <h4 className="text-4xl font-display font-bold text-secondary mb-1">450+</h4>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Biases Found</p>
        </div>
        <div>
          <h4 className="text-4xl font-display font-bold text-accent mb-1">98%</h4>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Resolution Rate</p>
        </div>
      </section>
    </div>
  );
};

// --- Page: Upload ---
const UploadPage = ({ onAuditComplete }: { onAuditComplete: (res: AuditResult, data: any[], config: any) => void }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState({ target: '', sensitive: '', privileged: '', unprivileged: '' });
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  const handleFileUpload = (file: File) => {
    setIsUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setData(results.data);
        setColumns(Object.keys(results.data[0] || {}));
        setStep(2);
        setIsUploading(false);
        toast.success("Data ingested successfully!");
      }
    });
  };

  const trySample = async () => {
    setIsUploading(true);
    try {
      const resp = await fetch('/api/sample-dataset');
      const sample = await resp.json();
      setData(sample);
      setColumns(Object.keys(sample[0] || {}));
      setMapping({ target: 'Hired', sensitive: 'Gender', privileged: 'Male', unprivileged: 'Female' });
      setStep(2);
      toast.info("Using synthetic hiring dataset");
    } catch (e) {
      toast.error("Failed to load sample dataset");
    } finally {
      setIsUploading(false);
    }
  };

  const runAnalysis = async () => {
    if (!mapping.target || !mapping.sensitive) {
      toast.error("Please map core columns");
      return;
    }
    setStep(3);
    try {
      const resp = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data,
          target_col: mapping.target,
          sensitive_col: mapping.sensitive,
          privileged_value: mapping.privileged,
          unprivileged_value: mapping.unprivileged
        })
      });
      const res = await resp.json();
      if (res.insufficient_data) {
        toast.warning(res.message);
      } else {
        onAuditComplete(res, data, mapping);
        navigate('/dashboard');
      }
    } catch (e) {
      toast.error("Analysis engine failed");
      setStep(2);
    }
  };

  const progress = (step / 3) * 100;

  return (
    <div className="pt-24 pb-20 px-6 max-w-3xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
          <span className={cn(step >= 1 && "text-primary")}>1. Ingest</span>
          <span className={cn(step >= 2 && "text-secondary")}>2. Map</span>
          <span className={cn(step >= 3 && "text-accent")}>3. Analyze</span>
        </div>
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-primary to-secondary"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-card p-12 rounded-3xl border border-white/10 text-center"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <Upload className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-display font-bold mb-4">Ingest Data Source</h2>
            <p className="text-muted-foreground mb-10">Upload a CSV file to begin the ethical audit process.</p>
            
            <label className="block w-full border-2 border-dashed border-white/10 rounded-2xl p-12 hover:border-primary cursor-pointer transition-all mb-6">
              <input 
                type="file" 
                className="hidden" 
                accept=".csv"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              />
              <p className="font-medium text-lg">Click to browse or drop file</p>
              <p className="text-sm text-muted-foreground mt-2">Max limit 10MB (.csv)</p>
            </label>

            <button 
              onClick={trySample}
              disabled={isUploading}
              className="w-full bg-white/5 hover:bg-white/10 text-foreground py-4 rounded-xl font-bold transition-all"
            >
              {isUploading ? "Loading dataset..." : "Try Sample Dataset (Synthetic Hiring)"}
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-card p-12 rounded-3xl border border-white/10"
          >
            <h2 className="text-3xl font-display font-bold mb-8 flex items-center gap-3">
              <Search className="w-8 h-8 text-secondary" /> Column Mapping
            </h2>
            
            <div className="space-y-6 mb-10">
              <div>
                <label className="text-sm font-bold uppercase text-muted-foreground mb-2 block">Target Outcome (e.g., Hired)</label>
                <select 
                  value={mapping.target}
                  onChange={(e) => setMapping({...mapping, target: e.target.value})}
                  className="w-full bg-background border border-white/10 rounded-xl p-4 focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="">Select Target</option>
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-bold uppercase text-muted-foreground mb-2 block">Sensitive Attribute (e.g., Gender)</label>
                  <select 
                    value={mapping.sensitive}
                    onChange={(e) => setMapping({...mapping, sensitive: e.target.value})}
                    className="w-full bg-background border border-white/10 rounded-xl p-4 focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="">Select Column</option>
                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold uppercase text-muted-foreground mb-2 block">Privileged Val</label>
                  <input 
                    type="text" 
                    value={mapping.privileged}
                    onChange={(e) => setMapping({...mapping, privileged: e.target.value})}
                    placeholder="e.g. Male"
                    className="w-full bg-background border border-white/10 rounded-xl p-4 focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold uppercase text-muted-foreground mb-2 block">Unprivileged Val</label>
                  <input 
                    type="text" 
                    value={mapping.unprivileged}
                    onChange={(e) => setMapping({...mapping, unprivileged: e.target.value})}
                    placeholder="e.g. Female"
                    className="w-full bg-background border border-white/10 rounded-xl p-4 focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setStep(1)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-foreground py-4 rounded-xl font-bold transition-all"
              >
                Back
              </button>
              <button 
                onClick={runAnalysis}
                className="flex-[2] bg-primary text-white py-4 rounded-xl font-bold lift-glow transition-all"
              >
                Run Ethical Audit
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-24 h-24 border-4 border-primary border-t-transparent rounded-full animate-spin mb-8" />
            <h3 className="text-2xl font-display font-bold mb-3">AI Engine Processing...</h3>
            <p className="text-muted-foreground animate-pulse">Calculating Parity Gaps & Impact Ratios</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Page: Dashboard ---
const DashboardPage = ({ audit, data, config, user }: { audit: AuditResult | null, data: any[], config: any, user: FirebaseUser | null }) => {
  const [explanation, setExplanation] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);
  const [activeTab, setActiveTab] = useState<'analytics' | 'history'>('analytics');
  const [history, setHistory] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Gemini AI Setup
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  useEffect(() => {
    if (!audit && activeTab === 'analytics') {
      navigate('/upload');
      return;
    }
    if (audit && !explanation) fetchExplanation();
  }, [audit, activeTab]);

  useEffect(() => {
    if (activeTab === 'history' && user) {
      getAuditHistory(user.uid).then(setHistory);
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const fetchExplanation = async () => {
    if (!audit) return;
    setIsExplaining(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Act as a Senior AI Ethics Auditor. I have an audit result for a dataset where the Target column is '${config.target}' and the Sensitive column is '${config.sensitive}'.
        Metrics:
        - Demographic Parity Gap: ${audit.metrics.demographic_parity_gap}
        - Disparate Impact Ratio: ${audit.metrics.disparate_impact_ratio}
        - Selection Rates: Privileged (${config.privileged}): ${audit.metrics.selection_rates.privileged * 100}%, Unprivileged (${config.unprivileged}): ${audit.metrics.selection_rates.unprivileged * 100}%
        - Fairness Score: ${audit.fairness_score}/100
        
        Provide a plain-English explanation of what this means and 3 actionable suggestions to improve fairness. Format in Markdown. Use professional but accessible language.`,
      });
      setExplanation(response.text || "Failed to generate explanation.");
    } catch (err) {
      toast.error("Gemini failed to explain results");
    } finally {
      setIsExplaining(false);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Context: You are an AI Ethics Consultant for FairLens. The current audit uses dataset mapping '${config.sensitive}' to '${config.target}'. 
        Audit Result: Parity Gap is ${audit?.metrics.demographic_parity_gap}.
        Current Chat History: ${chatHistory.map(h => h.role + ': ' + h.content).join('\n')}
        User Question: ${userMsg}`,
      });
      setChatHistory(prev => [...prev, { role: 'ai', content: response.text || "I'm sorry, I couldn't process that." }]);
    } catch (err) {
      toast.error("Chat engine error");
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("FairLens AI: Ethical Audit Report", 20, 30);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Target Attribute: ${config.target}`, 20, 45);
    doc.text(`Sensitive Attribute: ${config.sensitive}`, 20, 52);
    doc.text(`Audit Timestamp: ${new Date().toLocaleString()}`, 20, 59);
    
    doc.setFont("helvetica", "bold");
    doc.text("Fairness Score:", 20, 75);
    doc.setFontSize(18);
    const scoreColor = audit?.fairness_score! > 70 ? "#10B981" : audit?.fairness_score! > 40 ? "#F59E0B" : "#EF4444";
    doc.setTextColor(scoreColor);
    doc.text(`${audit?.fairness_score}/100`, 60, 75);
    
    doc.setTextColor("#000000");
    doc.setFontSize(12);
    doc.text("Key Metrics:", 20, 90);
    doc.text(`- Demographic Parity Gap: ${audit?.metrics.demographic_parity_gap}`, 30, 100);
    doc.text(`- Disparate Impact Ratio: ${audit?.metrics.disparate_impact_ratio}`, 30, 107);
    
    doc.text("Gemini AI Remediation Plan:", 20, 120);
    const splitText = doc.splitTextToSize(explanation.replace(/[#*]/g, ''), 170);
    doc.setFont("helvetica", "normal");
    doc.text(splitText, 20, 130);
    
    doc.save(`FairLens_Report_${Date.now()}.pdf`);
    toast.success("PDF Report Downloaded");
  };

  if (!audit) return null;

  const chartData = [
    { name: config.privileged || 'Privileged', val: audit.metrics.selection_rates.privileged * 100 },
    { name: config.unprivileged || 'Unprivileged', val: audit.metrics.selection_rates.unprivileged * 100 },
  ];

  const scoreColor = audit.fairness_score > 70 ? "text-success" : audit.fairness_score > 40 ? "text-accent" : "text-red-500";
  const scoreStroke = audit.fairness_score > 70 ? "#10B981" : audit.fairness_score > 40 ? "#F59E0B" : "#EF4444";

  return (
    <div className="pt-24 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-start gap-8">
      {/* Tabs */}
      <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mb-2">
        <button 
          onClick={() => setActiveTab('analytics')}
          className={cn("px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2", activeTab === 'analytics' ? "bg-primary text-white" : "text-muted-foreground")}
        >
          <ChartBar className="w-4 h-4" /> Live Analytics
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={cn("px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2", activeTab === 'history' ? "bg-primary text-white" : "text-muted-foreground")}
        >
          <History className="w-4 h-4" /> Audit History
        </button>
      </div>

      {activeTab === 'analytics' ? (
        <div className="w-full flex flex-col lg:flex-row gap-8">
          {/* Left Column: Analytics */}
          <div className="flex-1 space-y-8">
            <section className="bg-card p-8 rounded-3xl border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-display font-bold">Audit Results</h2>
            <button 
              onClick={generatePDF}
              className="bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-primary/20 transition-all"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-12 items-center">
            {/* Visual Gauge */}
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/5" />
                <motion.circle 
                  cx="96" cy="96" r="80" 
                  stroke={scoreStroke} strokeWidth="12" fill="transparent" 
                  strokeDasharray={2 * Math.PI * 80}
                  initial={{ strokeDashoffset: 2 * Math.PI * 80 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 80 * (1 - audit.fairness_score / 100) }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className={cn("text-5xl font-display font-black", scoreColor)}>{audit.fairness_score}</span>
                <span className="text-xs uppercase font-bold text-muted-foreground">Fairness Index</span>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Impact Ratio</span>
                <span className="text-xl font-display font-bold">{audit.metrics.disparate_impact_ratio}</span>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Parity Gap</span>
                <span className="text-xl font-display font-bold">{audit.metrics.demographic_parity_gap}</span>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl col-span-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Equalized Odds</span>
                <span className="text-xl font-display font-bold">{audit.metrics.equalized_odds_diff}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-card p-8 rounded-3xl border border-white/5 h-[350px]">
          <h3 className="text-lg font-bold mb-6 tracking-tight">Selection Bias Distribution (%)</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} />
              <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{fill: '#222'}}
                contentStyle={{backgroundColor: '#111', border: 'none', borderRadius: '12px', fontSize: '12px'}}
              />
              <Bar dataKey="val" radius={[8, 8, 0, 0]} barSize={48}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={index === 0 ? '#6C63FF' : '#3B82F6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      {/* Right Column: AI Insights */}
      <div className="lg:w-96 space-y-6">
        <div className="bg-card p-6 rounded-3xl border border-white/5 flex flex-col h-[650px]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold tracking-tight">Gemini AI Audit</h3>
              <p className="text-[10px] text-accent font-bold uppercase">Active Integrity Guard</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
            {isExplaining ? (
              <div className="space-y-3">
                <div className="h-4 bg-white/5 animate-pulse rounded-full w-3/4" />
                <div className="h-4 bg-white/5 animate-pulse rounded-full w-full" />
                <div className="h-4 bg-white/5 animate-pulse rounded-full w-5/6" />
              </div>
            ) : (
              <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap prose prose-invert prose-p:my-2">
                {explanation}
              </div>
            )}
            
            {chatHistory.map((msg, i) => (
              <div key={i} className={cn(
                "p-3 rounded-2xl max-w-[90%] text-sm",
                msg.role === 'user' ? "bg-primary text-white self-end ml-auto" : "bg-white/5 text-foreground/90"
              )}>
                {msg.content}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleChat()}
              placeholder="Ask for remediation advice..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
            />
            <button 
              onClick={handleChat}
              className="bg-primary text-white p-2 rounded-xl hover:opacity-90 transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white/5 rounded-3xl border border-white/10">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground font-medium">No previous audits found.</p>
            </div>
          ) : (
            history.map((record, i) => (
              <motion.div 
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card p-6 rounded-2xl border border-white/5 lift-glow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-lg">{record.targetCol}</h4>
                    <p className="text-xs text-muted-foreground font-medium uppercase">{record.sensitiveCol} Audit</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-xs">{record.fairnessScore}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <span>{record.timestamp?.toDate ? record.timestamp.toDate().toLocaleDateString() : new Date().toLocaleDateString()}</span>
                  <span className="text-accent">{record.local ? 'Local' : 'Cloud'}</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// --- Main App ---
export default function App() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [activeDataset, setActiveDataset] = useState<any[]>([]);
  const [mappingConfig, setMappingConfig] = useState<any>(null);

  useEffect(() => {
    getFirebase().then(({ auth }) => {
      if (auth) {
        onAuthStateChanged(auth, (u) => setUser(u));
      }
    });

    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleDark = () => setIsDark(!isDark);

  const handleAuditComplete = async (res: AuditResult, data: any[], config: any) => {
    setAuditResult(res);
    setActiveDataset(data);
    setMappingConfig(config);
    
    // Auto-save if user is logged in
    if (user) {
      try {
        await saveAudit(user.uid, {
          fairnessScore: res.fairness_score,
          targetCol: config.target,
          sensitiveCol: config.sensitive,
          privilegedValue: config.privileged,
          unprivilegedValue: config.unprivileged,
          metrics: {
            demographicParityGap: res.metrics.demographic_parity_gap,
            disparateImpactRatio: res.metrics.disparate_impact_ratio,
            equalizedOddsDiff: res.metrics.equalized_odds_diff
          }
        });
        toast.success("Audit saved to cloud history");
      } catch (e) {
        toast.error("Failed to sync audit to cloud");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 font-sans selection:bg-primary/30">
      <Toaster position="top-right" richColors />
      <Navbar isDark={isDark} toggleDark={toggleDark} user={user} />
      
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/upload" element={<UploadPage onAuditComplete={handleAuditComplete} />} />
          <Route path="/dashboard" element={<DashboardPage audit={auditResult} data={activeDataset} config={mappingConfig} user={user} />} />
        </Routes>
      </main>

      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
          <div className="font-display font-bold text-sm tracking-widest uppercase">
            FairLens AI <span className="text-primary">2026</span>
          </div>
          <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-primary">Ethical Terms</a>
            <a href="#" className="hover:text-secondary">Security</a>
            <a href="#" className="hover:text-accent">Methodology</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
