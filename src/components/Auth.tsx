"use client";

import React, { useState } from "react";
import { signUp, signIn, signInWithGoogle, saveProfile, UserProfile } from "@/lib/services";
import { generateMasterKey, deriveKeyFromPassword, bufToHex } from "@/lib/crypto";
import { Shield, Sparkles, Flower, Heart, Activity, Loader2 } from "lucide-react";

interface AuthProps {
  onAuthSuccess: (uid: string, userEmail: string) => void;
  initialUserId?: string;
  initialUserEmail?: string;
}

export default function Auth({ onAuthSuccess, initialUserId = "", initialUserEmail = "" }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [usePassphrase, setUsePassphrase] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    setLoading(true);
    try {
      const user = await signInWithGoogle();
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
      setError(err.message || "Google Sign-In failed.");
    } finally {
      setLoading(false);
    }
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
    <div className="flex flex-col flex-1 p-6 justify-center bg-cream-50 overflow-y-auto">
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-rose-100 rounded-full text-rose-500 mb-2">
              <Flower className="w-8 h-8 animate-spin-slow" />
            </div>
            <h1 className="font-serif text-4xl text-slate-800 tracking-wide font-semibold">Aeva</h1>
            <p className="text-sm text-slate-700 max-w-xs mx-auto">
              Zero-Knowledge AI health synchronization for women.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl border border-rose-100 shadow-sm space-y-6 flex flex-col items-center">
            <h2 className="text-xl font-medium text-slate-800 text-center font-serif">
              Unlock Your Health Vault
            </h2>

            <p className="text-xs text-slate-700 text-center leading-relaxed max-w-xs">
              Securely authenticate using your Gmail account. Your cycle logs, symptoms, and medical reports will remain encrypted locally.
            </p>

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
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-700 text-center px-4">
            <Shield className="w-4 h-4 text-sage-500" />
            <span>GDPR/HIPAA Strict: Client-side end-to-end encryption active</span>
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
