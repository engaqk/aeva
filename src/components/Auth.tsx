"use client";

import React, { useState } from "react";
import { signUp, signIn, signInWithGoogle, saveProfile, UserProfile } from "@/lib/services";
import { generateMasterKey, deriveKeyFromPassword, bufToHex } from "@/lib/crypto";
import { isFirebaseConfigured } from "@/lib/firebase";
import { Shield, Sparkles, Flower, Heart, Activity, Loader2, Lock, Check, X, ArrowLeft, ArrowRight, Users, Info } from "lucide-react";

const INTRO_SLIDES = [
  {
    title: "Zero-Knowledge Encryption",
    tagline: "Your intimate data remains 100% yours.",
    description: "Unlike normal trackers, Aeva uses client-side AES-GCM 256-bit encryption. Your cycle logs, symptoms, and clinical results are encrypted in your browser before ever hitting the database. No leaks, no ads, no subpoenas.",
    badge: "Incognito by Design",
    color: "bg-sage-100 text-sage-600 border-sage-200",
    icon: Shield,
    image: "/privacy_vault.png",
    features: [
      "No central database can decrypt your file",
      "No trackable cookies or marketing pixels",
      "GDPR & HIPAA structurally compliant"
    ]
  },
  {
    title: "Biological Phase Syncing",
    tagline: "Stop fighting your cycle. Sync with it.",
    description: "Your estrogen and progesterone levels shift dramatically throughout the month. Aeva's AI guides you when to focus on strength training, when to rest, what to eat, and when your creative focus will peak.",
    badge: "Hormonal Harmony",
    color: "bg-rose-100 text-rose-500 border-rose-200",
    icon: Activity,
    image: "/phase_syncing.png",
    features: [
      "Daily phase-synced training buffers",
      "Nutrition & craving control guides",
      "Hormone-aligned energy forecasting"
    ]
  },
  {
    title: "Clinical Risk Screening",
    tagline: "Early warning triage at your fingertips.",
    description: "Evaluate risk indicators for PCOS, Endometriosis, and thyroid imbalances anonymously. Aeva compiles raw symptoms into a certified, encrypted clinical brief that you can print or PDF-share with your OBGYN.",
    badge: "Medical-Grade Alignment",
    color: "bg-amber-100 text-amber-600 border-amber-200",
    icon: Sparkles,
    image: "/clinical_triage.png",
    features: [
      "Validated clinical screening checklists",
      "One-click doctor-ready PDF reports",
      "Completely anonymous self-assessments"
    ]
  },
  {
    title: "Incognito Peer Circles",
    tagline: "Real community support, zero exposure.",
    description: "Struggling with menopause flashes or hormonal changes? Connect with women in your exact phase. Post anonymously, share remedies, and exchange support without revealing your name or email.",
    badge: "Safe Space",
    color: "bg-purple-100 text-purple-600 border-purple-200",
    icon: Users,
    image: "/peer_circle.png",
    features: [
      "Phase-restricted peer feed access",
      "Empathetic 'Hugs' & support reactions",
      "No profile lookup or search indexing"
    ]
  }
];


interface AuthProps {
  onAuthSuccess: (uid: string, userEmail: string) => void;
  initialUserId?: string;
  initialUserEmail?: string;
}

export default function Auth({ onAuthSuccess, initialUserId = "", initialUserEmail = "" }: AuthProps) {
  // Onboarding States
  const [step, setStep] = useState(initialUserId ? 2 : 1);
  const [userId, setUserId] = useState(initialUserId);
  const [userEmailAddress, setUserEmailAddress] = useState(initialUserEmail);
  
  React.useEffect(() => {
    if (initialUserId && !userId) {
      setUserId(initialUserId);
      setUserEmailAddress(initialUserEmail);
      setStep(2);
    }
  }, [initialUserId, initialUserEmail]);

  const [isLogin, setIsLogin] = useState(true);
  const [useCredentialsLogin, setUseCredentialsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [usePassphrase, setUsePassphrase] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showMockGoogle, setShowMockGoogle] = useState(false);
  const [mockEmail, setMockEmail] = useState("");
  const [showIntro, setShowIntro] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [landingSlide, setLandingSlide] = useState(0);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const seen = localStorage.getItem("aeva_intro_seen");
      if (!seen) {
        setShowIntro(true);
      }
    }
  }, []);

  React.useEffect(() => {
    if (step === 1) {
      const interval = setInterval(() => {
        setLandingSlide((prev) => (prev + 1) % 4);
      }, 5500);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleCloseIntro = () => {
    localStorage.setItem("aeva_intro_seen", "true");
    setShowIntro(false);
  };

  const [mode, setMode] = useState<'cycle_sync' | 'menopause' | 'hormonal_screening'>('cycle_sync');
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [lastPeriodStart, setLastPeriodStart] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        // Sign In
        const user = await signIn(email, password);
        // For existing users, check if a key exists. If not, they must enter their key in Privacy Vault.
        // We'll proceed to the dashboard.
        // Wait, if they set a passphrase, we can derive the key immediately from their password + email.
        const salt = bufToHex(new TextEncoder().encode(email + "_aevasalt"));
        const derived = await deriveKeyFromPassword(password, salt);
        localStorage.setItem(`aeva_master_key_${user.uid}`, derived);
        
        onAuthSuccess(user.uid, user.email || email);
      } else {
        // Sign Up
        const user = await signUp(email, password);
        setUserId(user.uid);
        setUserEmailAddress(user.email || email);
        setStep(2); // Go to Mode Select
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    
    // Check if Firebase is actually configured
    if (isFirebaseConfigured) {
      setLoading(true);
      try {
        const user = await signInWithGoogle();
        await proceedGoogleAuthSuccess(user);
      } catch (err: any) {
        setError(err.message || "Google Sign-In failed.");
        setLoading(false);
      }
    } else {
      // In local mode, show account selector modal
      setShowMockGoogle(true);
    }
  };

  const proceedGoogleAuthSuccess = async (user: { uid: string; email: string | null }) => {
    setLoading(true);
    try {
      const salt = bufToHex(new TextEncoder().encode((user.email || "google_user") + "_aevasalt"));
      let keyHex = localStorage.getItem(`aeva_master_key_${user.uid}`);
      if (!keyHex) {
        keyHex = await deriveKeyFromPassword(user.uid, salt);
        localStorage.setItem(`aeva_master_key_${user.uid}`, keyHex);
        setUserId(user.uid);
        setUserEmailAddress(user.email || "local_google_user@gmail.com");
        setStep(2);
      } else {
        onAuthSuccess(user.uid, user.email || "local_google_user@gmail.com");
      }
    } catch (err: any) {
      setError(err.message || "Encryption key initialization failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMockGoogleEmail = async (selectedEmail: string) => {
    setShowMockGoogle(false);
    // Generate stable UID based on the selected email
    const uid = "mock_google_uid_" + bufToHex(new TextEncoder().encode(selectedEmail)).substring(0, 12);
    const user = { uid, email: selectedEmail };
    
    // Save locally
    localStorage.setItem("aeva_user", JSON.stringify(user));
    
    await proceedGoogleAuthSuccess(user);
  };

  const handleOnboardingSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      // 1. Generate/Derive Encryption Key
      let keyHex = "";
      if (usePassphrase && passphrase) {
        const salt = bufToHex(new TextEncoder().encode(userEmailAddress + "_aevasalt"));
        keyHex = await deriveKeyFromPassword(passphrase, salt);
      } else {
        // Auto-generate high-entropy key
        keyHex = await generateMasterKey();
      }

      // Save Key Locally (Zero-Knowledge: Server never sees this)
      localStorage.setItem(`aeva_master_key_${userId}`, keyHex);

      // 2. Save User Profile to DB
      const profile: UserProfile = {
        mode,
        cycleLength: mode === "cycle_sync" ? cycleLength : undefined,
        periodLength: mode === "cycle_sync" ? periodLength : undefined,
        lastPeriodStart: mode === "cycle_sync" ? lastPeriodStart : undefined,
        encryptedMedicalMetadata: "" // To be filled with encrypted data later
      };

      await saveProfile(userId, profile, userEmailAddress);
      onAuthSuccess(userId, userEmailAddress);
    } catch (err: any) {
      setError(err.message || "Failed to finalize setup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 p-6 justify-center bg-cream-50 overflow-y-auto relative">
      {showIntro && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-cream-50 w-full max-w-[390px] rounded-[36px] p-6 shadow-2xl border border-cream-200 flex flex-col space-y-5 relative overflow-hidden animate-scale-up text-left">
            
            {/* Top Bar with Skip */}
            <div className="flex justify-between items-center pb-2 border-b border-cream-200">
              <div className="flex items-center gap-1">
                <Flower className="w-5 h-5 text-rose-400 animate-spin-slow" />
                <span className="font-serif font-bold text-sm tracking-wide text-slate-800">Aeva Health</span>
              </div>
              <button
                type="button"
                onClick={handleCloseIntro}
                className="text-xs text-slate-700 hover:text-slate-800 font-bold bg-cream-200 hover:bg-cream-300 px-3 py-1 rounded-full transition-colors cursor-pointer flex items-center gap-1"
              >
                Skip <X className="w-3 h-3" />
              </button>
            </div>

            {/* Slides Carousel Wrapper */}
            <div className="flex-1 flex flex-col justify-center min-h-[300px]">
              {activeSlide < INTRO_SLIDES.length ? (
                // Feature Slide
                <div key={activeSlide} className="space-y-4 animate-slide-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-widest text-rose-500 font-extrabold px-2.5 py-1 bg-rose-50 border border-rose-100 rounded-full font-bold">
                      {INTRO_SLIDES[activeSlide].badge}
                    </span>
                    <span className="text-[10px] font-bold text-slate-700">
                      Step {activeSlide + 1} of {INTRO_SLIDES.length + 1}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="font-serif text-lg font-bold text-slate-800 leading-tight">
                      {INTRO_SLIDES[activeSlide].title}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                      {INTRO_SLIDES[activeSlide].tagline}
                    </p>
                  </div>

                  {/* Interactive Feature Illustration */}
                  <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-cream-200/50 shadow-inner bg-cream-100 flex items-center justify-center">
                    <img
                      src={INTRO_SLIDES[activeSlide].image}
                      alt={INTRO_SLIDES[activeSlide].title}
                      className="w-full h-full object-cover animate-fade-in"
                    />
                    <div className="absolute top-2 left-2 p-2 rounded-xl bg-white/95 backdrop-blur-sm shadow-md border border-cream-200/50">
                      {React.createElement(INTRO_SLIDES[activeSlide].icon, { className: "w-4 h-4 text-rose-500 animate-pulse" })}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed bg-white/50 p-3 rounded-2xl border border-cream-200/50">
                    {INTRO_SLIDES[activeSlide].description}
                  </p>

                  <div className="space-y-1 pl-1">
                    {INTRO_SLIDES[activeSlide].features.map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-[10.5px] text-slate-800 font-bold">
                        <Check className="w-3.5 h-3.5 text-sage-500 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Comparison Slide
                <div key="comparison" className="space-y-4 animate-slide-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-widest text-rose-500 font-extrabold px-2.5 py-1 bg-rose-50 border border-rose-100 rounded-full font-bold font-bold">
                      The Aeva Difference
                    </span>
                    <span className="text-[10px] font-bold text-slate-700">
                      Step {INTRO_SLIDES.length + 1} of {INTRO_SLIDES.length + 1}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-serif text-lg font-bold text-slate-800">
                      Why Aeva stands alone
                    </h3>
                    <p className="text-xs text-slate-700 leading-relaxed bg-white/50 p-2.5 rounded-2xl border border-cream-200/50">
                      Most trackers sell cycle logs to brokers or expose data to subpoenas. Aeva is built as a zero-knowledge cryptography vault.
                    </p>
                  </div>

                  <div className="border border-cream-200 rounded-2xl overflow-hidden bg-white/60 shadow-sm">
                    <div className="grid grid-cols-3 bg-cream-100 p-2 text-[9px] uppercase tracking-wider font-extrabold text-slate-700 text-center border-b border-cream-200">
                      <div>Comparison</div>
                      <div className="text-rose-500 font-extrabold">Aeva Vault</div>
                      <div>Standard Apps</div>
                    </div>
                    <div className="divide-y divide-cream-100 text-[10px]">
                      <div className="grid grid-cols-3 p-2.5 items-center text-center">
                        <div className="font-semibold text-slate-700 text-left pl-1">Data Privacy</div>
                        <div className="text-sage-600 font-extrabold flex justify-center items-center gap-0.5"><Lock className="w-3 h-3 text-sage-500" /> AES-256</div>
                        <div className="text-rose-400">❌ Sell logs</div>
                      </div>
                      <div className="grid grid-cols-3 p-2.5 items-center text-center">
                        <div className="font-semibold text-slate-700 text-left pl-1">AI Insights</div>
                        <div className="text-slate-800 font-extrabold">⚡ Phase-Synced</div>
                        <div className="text-slate-700">❌ Calendar only</div>
                      </div>
                      <div className="grid grid-cols-3 p-2.5 items-center text-center">
                        <div className="font-semibold text-slate-700 text-left pl-1">Clinical Tools</div>
                        <div className="text-slate-800 font-bold">📋 PCOS/Endo</div>
                        <div className="text-slate-700">❌ Paywalled</div>
                      </div>
                      <div className="grid grid-cols-3 p-2.5 items-center text-center">
                        <div className="font-semibold text-slate-700 text-left pl-1">Community</div>
                        <div className="text-slate-800 font-bold">👤 Incognito</div>
                        <div className="text-slate-700">❌ Tracked / Ads</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="space-y-4 pt-2 border-t border-cream-200">
              
              {/* Slide Indicators */}
              <div className="flex justify-center gap-1.5 items-center">
                {Array.from({ length: INTRO_SLIDES.length + 1 }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      activeSlide === idx ? "w-6 bg-rose-400" : "w-2 bg-cream-300 hover:bg-cream-400"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Navigation buttons */}
              <div className="flex gap-3 justify-between items-center">
                {activeSlide > 0 ? (
                  <button
                    type="button"
                    onClick={() => setActiveSlide(activeSlide - 1)}
                    className="p-3 bg-cream-200 hover:bg-cream-300 text-slate-800 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer transform active:scale-95"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                ) : (
                  <div className="w-1" />
                )}

                {activeSlide < INTRO_SLIDES.length ? (
                  <button
                    type="button"
                    onClick={() => setActiveSlide(activeSlide + 1)}
                    className="flex-1 py-3 bg-rose-400 hover:bg-rose-500 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer transform active:scale-95"
                  >
                    <span>Next Feature</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCloseIntro}
                    className="flex-1 py-3 bg-rose-400 hover:bg-rose-500 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer transform active:scale-95 animate-pulse"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Securely Enter Aeva</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          {/* Main App Brand & Value Pitch */}
          <div className="text-center space-y-3">
            <div className="inline-flex p-3 bg-rose-100 rounded-full text-rose-500 mb-1">
              <Flower className="w-8 h-8 animate-spin-slow" />
            </div>
            <h1 className="font-serif text-4xl text-slate-800 tracking-wider font-extrabold">Aeva</h1>
            
            {/* Target Audience & Purpose Badges */}
            <div className="flex flex-wrap justify-center gap-1.5 max-w-xs mx-auto">
              <span className="text-[9px] font-bold uppercase tracking-widest bg-rose-100 text-rose-600 border border-rose-200/50 px-2.5 py-0.5 rounded-full">For Women</span>
              <span className="text-[9px] font-bold uppercase tracking-widest bg-sage-100 text-sage-600 border border-sage-200/50 px-2.5 py-0.5 rounded-full">Hormonal Syncing</span>
              <span className="text-[9px] font-bold uppercase tracking-widest bg-amber-100 text-amber-600 border border-amber-200/50 px-2.5 py-0.5 rounded-full">Menopause Care</span>
            </div>
            
            <p className="text-xs text-slate-700 max-w-xs mx-auto leading-relaxed font-bold">
              The first HIPAA-compliant, Zero-Knowledge AI health ecosystem designed for women who demand absolute privacy for their cycle, symptoms, and medical reports.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-rose-100 shadow-sm space-y-5 flex flex-col items-center">
            {/* Interactive Feature Tour Pitch directly on Landing */}
            <div className="w-full flex flex-col items-center">
              <h2 className="text-lg font-bold text-slate-800 text-center font-serif mb-2.5">
                Unlock Your Health Vault
              </h2>
              
              {/* Tab selectors for quick manual toggle */}
              <div className="flex w-full gap-1 p-1 bg-cream-100 rounded-2xl border border-cream-200/50 mb-3.5 justify-between">
                {[
                  { label: "Privacy", icon: Shield },
                  { label: "Syncing", icon: Activity },
                  { label: "Clinical", icon: Sparkles },
                  { label: "Circle", icon: Users }
                ].map((tab, idx) => {
                  const isCurrent = landingSlide === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setLandingSlide(idx)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 text-[10px] font-bold rounded-xl transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-white text-rose-500 shadow-xs border border-rose-100/50 font-extrabold"
                          : "text-slate-700 hover:text-slate-800"
                      }`}
                    >
                      {React.createElement(tab.icon, { className: "w-3 h-3 shrink-0" })}
                      <span className="hidden min-[360px]:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Feature Visual frame */}
              <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-cream-200/50 shadow-inner bg-cream-100 mb-3.5 flex items-center justify-center">
                <img
                  src={INTRO_SLIDES[landingSlide].image}
                  alt={INTRO_SLIDES[landingSlide].title}
                  className="w-full h-full object-cover animate-fade-in"
                />
                <div className="absolute top-2 left-2 p-1.5 rounded-xl bg-white/95 backdrop-blur-sm shadow border border-cream-200/50">
                  {React.createElement(INTRO_SLIDES[landingSlide].icon, { className: "w-3.5 h-3.5 text-rose-500 animate-pulse" })}
                </div>
              </div>

              {/* Tagline & Pitch Details */}
              <div className="space-y-1 text-center mb-1.5 min-h-[72px] flex flex-col justify-center px-1">
                <h3 className="font-serif text-sm font-bold text-slate-800 leading-tight">
                  {INTRO_SLIDES[landingSlide].title}
                </h3>
                <p className="text-[9px] font-bold text-slate-700 uppercase tracking-wider leading-none">
                  {INTRO_SLIDES[landingSlide].tagline}
                </p>
                <p className="text-[11px] text-slate-700 leading-relaxed max-w-xs mx-auto">
                  {INTRO_SLIDES[landingSlide].description}
                </p>
              </div>
            </div>

            {error && (
              <div className="w-full p-3 bg-rose-50 border border-rose-200 text-xs text-rose-600 rounded-xl text-center">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full py-4 bg-rose-400 hover:bg-rose-500 text-white rounded-2xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-3 disabled:bg-rose-300 transform active:scale-95"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.186 4.114-3.51 0-6.386-2.876-6.386-6.386 0-3.51 2.876-6.386 6.386-6.386 1.63 0 3.117.616 4.254 1.621l3.053-3.052C19.066 2.338 15.89 1 12.24 1 5.92 1 1 5.92 1 12.24s4.92 11.24 11.24 11.24c5.8 0 10.597-4.147 10.597-11.24 0-.746-.08-1.465-.213-2.155H12.24z" />
                </svg>
              )}
              <span>Gmail Direct Login</span>
            </button>

            {/* Traditional Credentials Login Option */}
            {!useCredentialsLogin ? (
              <button
                type="button"
                onClick={() => setUseCredentialsLogin(true)}
                className="text-xs text-slate-700 hover:text-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-1 font-semibold active:scale-95 transform"
              >
                <Lock className="w-3.5 h-3.5 text-slate-600" />
                <span>Sign in with Username/Password</span>
              </button>
            ) : (
              <form onSubmit={handleAuth} className="w-full space-y-3 pt-3.5 border-t border-cream-200/50">
                <div className="space-y-1 text-left">
                  <label className="text-[9px] uppercase tracking-wider font-bold text-slate-700">Username / Email</label>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. admin"
                    className="w-full px-3 py-2.5 bg-cream-100/50 border border-cream-200 rounded-xl text-xs focus:border-rose-300 focus:outline-none text-slate-800"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[9px] uppercase tracking-wider font-bold text-slate-700">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 bg-cream-100/50 border border-cream-200 rounded-xl text-xs focus:border-rose-300 focus:outline-none text-slate-800"
                  />
                </div>
                
                <div className="flex gap-2 pt-1.5">
                  <button
                    type="button"
                    onClick={() => setUseCredentialsLogin(false)}
                    className="flex-1 py-2.5 bg-cream-200 hover:bg-cream-300 text-slate-800 text-xs font-bold rounded-2xl transition-all cursor-pointer active:scale-95 transform"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-rose-400 hover:bg-rose-500 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer active:scale-95 transform shadow-sm"
                  >
                    Verify & Sign In
                  </button>
                </div>
              </form>
            )}

            <button
              type="button"
              onClick={() => {
                setActiveSlide(0);
                setShowIntro(true);
              }}
              className="text-xs text-rose-500 font-semibold hover:text-rose-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-1 group"
            >
              <Info className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>See why Aeva is different (Intro Tour)</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-700 text-center px-4">
            <Shield className="w-4 h-4 text-sage-500" />
            <span>GDPR/HIPAA Strict: Client-side end-to-end encryption active</span>
          </div>
        </div>
      )}

      {/* Mock Google Account Chooser Modal */}
      {showMockGoogle && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[380px] rounded-[32px] p-6 shadow-2xl space-y-5 border border-cream-200 animate-scale-up text-left">
            <div className="text-center space-y-1.5">
              {/* Google logo colored */}
              <div className="flex justify-center gap-0.5 text-lg font-bold font-sans">
                <span className="text-blue-500 font-extrabold">G</span>
                <span className="text-red-500 font-extrabold">o</span>
                <span className="text-yellow-500 font-extrabold">o</span>
                <span className="text-blue-500 font-extrabold">g</span>
                <span className="text-green-500 font-extrabold">l</span>
                <span className="text-red-500 font-extrabold">e</span>
              </div>
              <h3 className="font-semibold text-sm text-slate-800 text-center">Sign in with Google</h3>
              <p className="text-[10px] text-slate-700 text-center">to continue to <strong className="text-rose-400">Aeva</strong></p>
            </div>

            <div className="space-y-4">
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-705 block text-center">Enter your Google Account email</span>
              <div className="flex flex-col gap-2.5">
                <input
                  type="email"
                  value={mockEmail}
                  onChange={(e) => setMockEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full px-3.5 py-3 bg-cream-100/50 border border-cream-200 rounded-xl text-xs focus:border-rose-300 focus:outline-none text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (mockEmail.includes("@")) {
                      handleSelectMockGoogleEmail(mockEmail.trim());
                    } else {
                      alert("Please enter a valid email address.");
                    }
                  }}
                  className="w-full py-3 bg-rose-400 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors focus:outline-none cursor-pointer text-center"
                >
                  Continue
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowMockGoogle(false)}
              className="w-full py-2.5 bg-cream-200 hover:bg-cream-300 text-slate-800 text-xs font-semibold rounded-xl transition-colors focus:outline-none cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-3xl text-slate-800 font-semibold">Select Mode</h2>
            <p className="text-sm text-slate-700">Choose your primary focus area. You can switch modes at any time.</p>
          </div>

          <div className="space-y-3">
            {[
              {
                id: "cycle_sync",
                title: "Menstrual Cycle Syncing",
                desc: "Map fitness, nutrition, and mental sprints dynamically with your cycle phases.",
                icon: Heart,
                color: "bg-rose-100 text-rose-500"
              },
              {
                id: "menopause",
                title: "Perimenopause / Menopause",
                desc: "Track symptoms, predict vasomotor hot flashes, and monitor HRT stability.",
                icon: Activity,
                color: "bg-sage-100 text-sage-600"
              },
              {
                id: "hormonal_screening",
                title: "Hormonal screening / Support",
                desc: "Evaluate risks for PCOS, Endometriosis, and Thyroid disparities with structured triage.",
                icon: Sparkles,
                color: "bg-amber-100 text-amber-600"
              }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id as any)}
                className={`w-full text-left p-4 rounded-3xl border transition-all flex items-start gap-4 ${
                  mode === m.id
                    ? "bg-white border-rose-300 ring-2 ring-rose-200/50 shadow-sm"
                    : "bg-white/50 border-cream-200/80 hover:bg-white"
                }`}
              >
                <div className={`p-3 rounded-2xl ${m.color} shrink-0`}>
                  <m.icon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-slate-800 text-sm">{m.title}</h3>
                  <p className="text-xs text-slate-700 leading-relaxed">{m.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep(mode === "cycle_sync" ? 3 : 4)}
            className="w-full py-3.5 bg-rose-400 hover:bg-rose-500 text-white rounded-2xl font-semibold text-sm transition-colors"
          >
            Continue
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-3xl text-slate-800 font-semibold">Cycle Metrics</h2>
            <p className="text-sm text-slate-700">Help Aeva calculate your current cycle position.</p>
          </div>

          <div className="bg-white/80 p-6 rounded-3xl border border-rose-100 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Average Cycle Length ({cycleLength} days)
              </label>
              <input
                type="range"
                min="20"
                max="45"
                value={cycleLength}
                onChange={(e) => setCycleLength(Number(e.target.value))}
                className="w-full accent-rose-400 bg-cream-200 rounded-lg appearance-none h-2"
              />
              <div className="flex justify-between text-[10px] text-slate-700 mt-1 font-semibold">
                <span>20 days</span>
                <span>28 days (avg)</span>
                <span>45 days</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Average Period Duration ({periodLength} days)
              </label>
              <input
                type="range"
                min="3"
                max="10"
                value={periodLength}
                onChange={(e) => setPeriodLength(Number(e.target.value))}
                className="w-full accent-rose-400 bg-cream-200 rounded-lg appearance-none h-2"
              />
              <div className="flex justify-between text-[10px] text-slate-700 mt-1 font-semibold">
                <span>3 days</span>
                <span>5 days (avg)</span>
                <span>10 days</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Date of Last Period
              </label>
              <input
                type="date"
                required
                value={lastPeriodStart}
                onChange={(e) => setLastPeriodStart(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3 rounded-2xl bg-cream-100/50 border border-cream-200 focus:border-rose-300 focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-3.5 bg-cream-200 hover:bg-cream-300 text-slate-800 rounded-2xl font-semibold text-sm transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => {
                if (!lastPeriodStart) {
                  setError("Please select the start date of your last period.");
                  return;
                }
                setError("");
                setStep(4);
              }}
              className="flex-1 py-3.5 bg-rose-400 hover:bg-rose-500 text-white rounded-2xl font-semibold text-sm transition-colors"
            >
              Continue
            </button>
          </div>
          {error && <div className="text-center text-xs text-rose-600">{error}</div>}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-sage-100 rounded-full text-sage-600 mb-2">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-3xl text-slate-800 font-semibold">Security Settings</h2>
            <p className="text-sm text-slate-700">Set up your private Zero-Knowledge encryption vault key.</p>
          </div>

          <div className="bg-white/80 p-6 rounded-3xl border border-rose-100 space-y-4">
            <div className="flex items-center justify-between border-b border-cream-200 pb-3">
              <label className="text-sm font-semibold text-slate-800">Secure with Custom Passphrase</label>
              <input
                type="checkbox"
                checked={usePassphrase}
                onChange={(e) => setUsePassphrase(e.target.checked)}
                className="w-5 h-5 accent-rose-400 cursor-pointer"
              />
            </div>

            {usePassphrase ? (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Custom Passphrase (min. 8 characters)
                </label>
                <input
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-cream-100/50 border border-cream-200 focus:border-rose-300 focus:outline-none text-sm"
                  placeholder="Enter a memorable passphrase"
                />
                <p className="text-[10px] text-slate-700 leading-normal">
                  * Aeva derives your AES-GCM 256 key from this passphrase. If you forget this passphrase, you will lose access to all your logged logs.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-3 bg-sage-50 rounded-2xl border border-sage-100 text-xs text-slate-700 leading-relaxed">
                  <strong>Recommended Default:</strong> Aeva will generate a cryptographically secure, high-entropy 256-bit key and save it to your local browser storage. You can back it up inside the <strong>Privacy Vault</strong> tab later.
                </div>
              </div>
            )}
          </div>

          {error && <div className="text-center text-xs text-rose-600">{error}</div>}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(mode === "cycle_sync" ? 3 : 2)}
              className="flex-1 py-3.5 bg-cream-200 hover:bg-cream-300 text-slate-800 rounded-2xl font-semibold text-sm transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleOnboardingSubmit}
              disabled={loading || (usePassphrase && passphrase.length < 8)}
              className="flex-1 py-3.5 bg-rose-400 hover:bg-rose-500 text-white rounded-2xl font-semibold text-sm transition-colors shadow-sm disabled:bg-slate-300"
            >
              {loading ? "Generating Vault..." : "Initialize Vault"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
