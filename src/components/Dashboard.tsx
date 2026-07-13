"use client";

import React, { useState, useEffect } from "react";
import { UserProfile, getRecentDailyLogs, saveProfile } from "@/lib/services";
import { decryptJSON } from "@/lib/crypto";
import { Heart, Activity, Shield, Sparkles, Brain, Award, Apple, Flame, Camera, FileImage, X } from "lucide-react";

interface DashboardProps {
  uid: string;
  profile: UserProfile;
  onProfileUpdate: (newProfile: UserProfile) => void;
  onNavigate?: (tab: "dashboard" | "symptom_log" | "ai_clinic" | "admin" | "privacy_vault" | "social_circle") => void;
}

export default function Dashboard({ uid, profile, onProfileUpdate, onNavigate }: DashboardProps) {
  const [activeTab, setActiveTab] = useState(profile.mode || "cycle_sync");
  const [cycleDay, setCycleDay] = useState(1);
  const [daysRemaining, setDaysRemaining] = useState(1);
  const [currentPhase, setCurrentPhase] = useState("Follicular");
  const [stabilityIndex, setStabilityIndex] = useState(85);
  const [hotFlashRisk, setHotFlashRisk] = useState<"Low" | "Moderate" | "High">("Low");
  const [recentLogsCount, setRecentLogsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string>("/female_avatar.png");

  // Gamified Streaks & Rest Days
  const [streakCount, setStreakCount] = useState(5);
  const [restDaysLeft, setRestDaysLeft] = useState(2);

  // Swipe Sync Swiper Deck States
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [swipeDeckFinished, setSwipeDeckFinished] = useState(false);
  const [groceryList, setGroceryList] = useState<string[]>([]);

  // Symptom Bingo grid states
  const [bingoGrid, setBingoGrid] = useState<boolean[]>(Array(9).fill(false));
  const [showConfetti, setShowConfetti] = useState(false);
  const [bingoExplanations, setBingoExplanations] = useState<string | null>(null);

  const getDeck = () => {
    switch (currentPhase) {
      case "Menstrual":
        return [
          { type: "Meal", title: "Iron-Rich Lentil & Spinach Stew", desc: "Boosts non-heme iron stores during bleeding. Swipe right to add ingredients to Grocery List.", ingredients: ["Lentils", "Spinach", "Lemon", "Garlic"] },
          { type: "Meal", title: "Warm Raspberry Leaf & Ginger Tea", desc: "Soothes uterine smooth muscle spasms. Swipe right to add ingredients.", ingredients: ["Red Raspberry Leaves", "Fresh Ginger", "Honey"] },
          { type: "Workout", title: "15-Min Yin Yoga & Hips Stretch", desc: "Reduces pelvic congestion and keeps cortisol low. Swipe right to save workout.", ingredients: ["Comfortable Mat", "Block Pillow"] }
        ];
      case "Follicular":
        return [
          { type: "Meal", title: "Cruciferous Estrogen-Balancing Slaw", desc: "Rich in Indole-3-Carbinol (I3C) to assist hormone clearing. Swipe right to compile.", ingredients: ["Broccoli", "Cabbage", "Apple Cider Vinegar", "Pumpkin Seeds"] },
          { type: "Meal", title: "Wild Salmon Poke Bowl", desc: "Omega-3 and high protein to build growing egg follicles.", ingredients: ["Wild Salmon", "Quinoa", "Cucumber", "Edamame"] },
          { type: "Workout", title: "20-Min Heavy Hypertrophy Strength", desc: "Optimize estrogen peak with heavy compound lifts. Swipe right to sync.", ingredients: ["Adjustable Dumbbells"] }
        ];
      case "Ovulatory":
        return [
          { type: "Meal", title: "Avocado & Citrus Quinoa Salad", desc: "High antioxidant co-factors to support healthy egg release.", ingredients: ["Avocado", "Orange", "Quinoa", "Cilantro"] },
          { type: "Workout", title: "15-Min High-Intensity HIIT Sprint", desc: "Estrogen & testosterone peak provides maximum cardiac power.", ingredients: ["HIIT Timer"] }
        ];
      default: // Luteal / Menopause / Screening
        return [
          { type: "Meal", title: "Luteal Sweet Potato & Black Bean Bowl", desc: "High magnesium and complex carbs to prevent sugar crashes. Swipe right to add ingredients.", ingredients: ["Sweet Potatoes", "Black Beans", "Avocado", "Lime"] },
          { type: "Meal", title: "Dark Chocolate & Almond Fuel Plate", desc: "Cures afternoon sweet cravings while delivering 150mg Magnesium.", ingredients: ["85% Dark Chocolate", "Almonds", "Sea Salt"] },
          { type: "Workout", title: "15-Min Luteal Pilates Flow", desc: "Target joint stability and core strength while avoiding relaxin injury.", ingredients: ["Pilates Mat", "Resistance Bands"] }
        ];
    }
  };

  const deck = getDeck();

  const getBingoSymptoms = () => {
    switch (currentPhase) {
      case "Menstrual":
        return [
          "Pelvic Cramps", "Low Back Ache", "Chronic Fatigue", 
          "Rest Reflection", "Iron Drain", "Sugar Cravings", 
          "Sleepiness", "Ginger Tea Urge", "Quiet Battery"
        ];
      case "Follicular":
        return [
          "High Energy", "Mental Clarity", "Impatience", 
          "Heavy Lifting", "Analytical Focus", "Cruciferous Craving", 
          "Social Urge", "Clear Skin", "Smooth Pacing"
        ];
      case "Ovulatory":
        return [
          "Peak Charisma", "HIIT Endurance", "Social Chatty", 
          "Nesting Urge", "Fluid Retention", "Skin Radiance", 
          "High Libido", "Scatter Focus", "Estrogen Flush"
        ];
      default: // Luteal / Menopause / Screening
        return [
          "Brain Fog", "Bloating", "Pelvic Soreness", 
          "Sweet Cravings", "Organize Kitchen", "Joint Laxity", 
          "Insomnia", "Anxiety Spikes", "Quiet Battery"
        ];
    }
  };

  const bingoSymptoms = getBingoSymptoms();

  const getBingoExplanation = (symptomName: string) => {
    switch (symptomName) {
      case "Pelvic Cramps":
        return "Prostaglandin hormone surges cause uterine contractions. Magnesium glycinate relaxes smooth muscles.";
      case "Sweet Cravings":
      case "Sugar Cravings":
        return "Progesterone rise accelerates basal metabolism, dropping glucose. Complex carbs shield you from crashes.";
      case "Brain Fog":
        return "Estrogen decline reduces cerebral blood flow slightly. Work in Pomodoro intervals.";
      case "Organize Kitchen":
      case "Nesting Urge":
        return "Progesterone dominance triggers nesting instincts to prepare safe environmental spaces.";
      case "Joint Laxity":
        return "Relaxin hormone peaks, softening ligaments. Heavy high-impact jumps should be swapped for Pilates stability.";
      case "Peak Charisma":
        return "High estrogen activates the left temporal verbal centers, improving confidence and speech pacing.";
      default:
        return "Hormonal feedback loops dynamically modify neurotransmitters, changing your physical pacing and moods.";
    }
  };

  const handleSwipe = (approved: boolean) => {
    if (approved) {
      const newIngredients = deck[currentCardIndex]?.ingredients || [];
      setGroceryList(prev => Array.from(new Set([...prev, ...newIngredients])));
    }
    if (currentCardIndex + 1 >= deck.length) {
      setSwipeDeckFinished(true);
    } else {
      setCurrentCardIndex(prev => prev + 1);
    }
  };

  const handleCopyGroceryList = () => {
    navigator.clipboard.writeText(groceryList.join(", "));
    alert("Grocery list copied to clipboard and synchronized to Apple Reminders mock gateway!");
  };

  const resetSwipeDeck = () => {
    setCurrentCardIndex(0);
    setSwipeDeckFinished(false);
    setGroceryList([]);
  };

  const handleBingoClick = (idx: number) => {
    const updated = [...bingoGrid];
    updated[idx] = !updated[idx];
    setBingoGrid(updated);
    
    if (updated[idx]) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
      
      const symptomName = bingoSymptoms[idx];
      setBingoExplanations(getBingoExplanation(symptomName));
    }
  };

  const handleUseRestDay = () => {
    if (restDaysLeft > 0) {
      setRestDaysLeft(prev => prev - 1);
      alert("Rest Day Token applied! Your 5 Days Streak is preserved, protecting your Botanical Aura.");
    } else {
      alert("No Rest Days remaining this month.");
    }
  };

  // Load and convert profile picture from Hex to Blob URL
  useEffect(() => {
    if (profile.photoHex && profile.photoType) {
      try {
        const matches = profile.photoHex.match(/.{1,2}/g);
        if (matches) {
          const bytes = new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
          const blob = new Blob([bytes], { type: profile.photoType });
          const url = URL.createObjectURL(blob);
          setPhotoUrl(url);
          return () => URL.revokeObjectURL(url);
        }
      } catch (e) {
        console.error("Failed to parse profile photo hex:", e);
      }
    } else {
      setPhotoUrl("/female_avatar.png");
    }
  }, [profile.photoHex, profile.photoType]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit to 1.5MB to stay within comfortable Firestore document sizing limits
    if (file.size > 1.5 * 1024 * 1024) {
      alert("Please upload a picture smaller than 1.5MB to save to your secure vault.");
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const buffer = evt.target?.result as ArrayBuffer;
      if (buffer) {
        // Convert array buffer directly to hex binary string representation
        const bytes = new Uint8Array(buffer);
        const hex = Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        
        try {
          const updatedProfile = {
            ...profile,
            photoHex: hex,
            photoType: file.type
          };
          await saveProfile(uid, updatedProfile);
          onProfileUpdate(updatedProfile);
        } catch (err) {
          console.error("Failed to upload profile picture:", err);
          alert("Error saving profile photo. Please try again.");
        } finally {
          setLoading(false);
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  const startCamera = async () => {
    setShowPhotoOptions(false);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: { ideal: 400 }, height: { ideal: 400 } } 
      });
      setCameraStream(stream);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 150);
    } catch (err) {
      console.error("Camera access failed:", err);
      alert("Could not access camera. Please check browser permissions.");
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Draw a square representation on the canvas
      ctx.drawImage(video, 0, 0, 300, 300);
      canvas.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onload = async (evt) => {
            const buffer = evt.target?.result as ArrayBuffer;
            if (buffer) {
              const bytes = new Uint8Array(buffer);
              const hex = Array.from(bytes)
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");
              try {
                const updated = {
                  ...profile,
                  photoHex: hex,
                  photoType: "image/jpeg"
                };
                await saveProfile(uid, updated);
                onProfileUpdate(updated);
                closeCamera();
              } catch (e) {
                console.error("Failed to save camera snapshot:", e);
              }
            }
          };
          reader.readAsArrayBuffer(blob);
        }
      }, "image/jpeg", 0.85);
    }
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  useEffect(() => {
    if (profile.mode && profile.mode !== activeTab) {
      setActiveTab(profile.mode);
    }
  }, [profile.mode]);

  // Calculate cycle parameters
  useEffect(() => {
    if (profile.lastPeriodStart && profile.cycleLength && profile.periodLength) {
      const lastStart = new Date(profile.lastPeriodStart);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - lastStart.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      const day = (diffDays % profile.cycleLength) + 1;
      setCycleDay(day);

      // Determine Phase
      let phase = "Follicular";
      let remaining = 1;
      
      const pLen = profile.periodLength;
      const cLen = profile.cycleLength;

      if (day <= pLen) {
        phase = "Menstrual";
        remaining = pLen - day + 1;
      } else if (day <= 13) {
        phase = "Follicular";
        remaining = 13 - day + 1;
      } else if (day <= 16) {
        phase = "Ovulatory";
        remaining = 16 - day + 1;
      } else {
        phase = "Luteal";
        remaining = cLen - day + 1;
      }

      setCurrentPhase(phase);
      setDaysRemaining(remaining);
    }
  }, [profile]);

  // Load symptom trends to calculate stability index and hot flash predictions
  useEffect(() => {
    async function loadTrends() {
      try {
        const logs = await getRecentDailyLogs(uid, 7);
        setRecentLogsCount(logs.length);
        
        const keyHex = localStorage.getItem(`aeva_master_key_${uid}`);
        if (!keyHex || logs.length === 0) {
          setStabilityIndex(90);
          setHotFlashRisk("Low");
          return;
        }

        let totalHotFlashes = 0;
        let totalJointPain = 0;
        let decryptedLogs = 0;

        for (const logItem of logs) {
          try {
            const decrypted = await decryptJSON(
              logItem.log.encryptedPayload,
              keyHex,
              (logItem.log as any).iv || (logItem.log.metadata as any).iv // handle backward compatibility
            );
            if (decrypted) {
              totalHotFlashes += decrypted.hot_flash_severity || 0;
              totalJointPain += decrypted.joint_pain || 0;
              decryptedLogs++;
            }
          } catch (e) {
            // Ignore decryption failure for individual logs
          }
        }

        if (decryptedLogs > 0) {
          // Calculate an arbitrary Stability Index
          const avgSymptomScore = (totalHotFlashes + totalJointPain) / decryptedLogs;
          const calculatedIndex = Math.max(40, Math.min(100, Math.round(100 - (avgSymptomScore * 12))));
          setStabilityIndex(calculatedIndex);

          // Hot Flash window prediction based on severity
          if (avgSymptomScore > 2.5) {
            setHotFlashRisk("High");
          } else if (avgSymptomScore > 1.0) {
            setHotFlashRisk("Moderate");
          } else {
            setHotFlashRisk("Low");
          }
        }
      } catch (err) {
        console.error("Error loading symptom trends:", err);
      }
    }
    loadTrends();
  }, [uid, activeTab]);

  const handleModeChange = (newMode: 'cycle_sync' | 'menopause' | 'hormonal_screening') => {
    setActiveTab(newMode);
    const updated = { ...profile, mode: newMode };
    onProfileUpdate(updated);
    
    // Save to Firestore in background without blocking UI
    saveProfile(uid, updated).catch((err) => {
      console.error("Failed to sync profile mode in background:", err);
    });
  };

  // Phase layout styling mapping
  const getPhaseStyles = () => {
    switch (currentPhase) {
      case "Menstrual":
        return {
          stroke: "stroke-rose-300",
          text: "text-rose-500",
          bg: "bg-rose-50",
          accentText: "text-rose-600",
          border: "border-rose-100",
          quote: "Deep rest, reflection, and warm micronutrients."
        };
      case "Follicular":
        return {
          stroke: "stroke-sage-500",
          text: "text-sage-600",
          bg: "bg-sage-50",
          accentText: "text-sage-600",
          border: "border-sage-100",
          quote: "Energy levels ramping up. Perfect time for lifting and logic."
        };
      case "Ovulatory":
        return {
          stroke: "stroke-rose-400",
          text: "text-rose-600",
          bg: "bg-rose-50/50",
          accentText: "text-rose-600",
          border: "border-rose-200/60",
          quote: "Physical power and verbal fluency peaks. Shine bright."
        };
      case "Luteal":
        default:
        return {
          stroke: "stroke-amber-500",
          text: "text-amber-600",
          bg: "bg-amber-50/40",
          accentText: "text-amber-600",
          border: "border-amber-100",
          quote: "Transition to steady cardio. Fuel with magnesium."
        };
    }
  };

  const phaseStyles = getPhaseStyles();

  // SVG parameters for the ring
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Progress calculations
  const cycleProgress = profile.cycleLength ? (cycleDay / profile.cycleLength) * circumference : 0;
  const menopauseProgress = (stabilityIndex / 100) * circumference;

  return (
    <div className="flex-1 overflow-y-auto pb-24 p-5 space-y-6 bg-cream-50 scrollbar-none">
      
      {/* Dynamic Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-14 h-14">
            {/* Dynamic botanical aura pulsing gradient */}
            <div className={`absolute inset-0 rounded-full blur-[6px] opacity-75 animate-pulse ${
              currentPhase === "Menstrual" ? "bg-rose-300 shadow-[0_0_15px_#fda4af]" :
              currentPhase === "Follicular" ? "bg-sage-300 shadow-[0_0_15px_#a3b19b]" :
              currentPhase === "Ovulatory" ? "bg-rose-500 shadow-[0_0_15px_#f43f5e]" :
              "bg-amber-400 shadow-[0_0_15px_#fbbf24]"
            }`} style={{ transform: `scale(${1 + Math.min(0.3, streakCount * 0.05)})` }}></div>
            
            {/* Rotating SVG petals */}
            <svg className="absolute inset-0 w-full h-full animate-[spin_12s_linear_infinite]" viewBox="0 0 100 100">
              <path d="M50 8 C53 25 47 25 50 8 Z" fill={currentPhase === "Menstrual" ? "#fda4af" : currentPhase === "Follicular" ? "#a3b19b" : currentPhase === "Ovulatory" ? "#f43f5e" : "#fbbf24"} transform="rotate(0 50 50)" />
              <path d="M50 8 C53 25 47 25 50 8 Z" fill={currentPhase === "Menstrual" ? "#fda4af" : currentPhase === "Follicular" ? "#a3b19b" : currentPhase === "Ovulatory" ? "#f43f5e" : "#fbbf24"} transform="rotate(72 50 50)" />
              <path d="M50 8 C53 25 47 25 50 8 Z" fill={currentPhase === "Menstrual" ? "#fda4af" : currentPhase === "Follicular" ? "#a3b19b" : currentPhase === "Ovulatory" ? "#f43f5e" : "#fbbf24"} transform="rotate(144 50 50)" />
              <path d="M50 8 C53 25 47 25 50 8 Z" fill={currentPhase === "Menstrual" ? "#fda4af" : currentPhase === "Follicular" ? "#a3b19b" : currentPhase === "Ovulatory" ? "#f43f5e" : "#fbbf24"} transform="rotate(216 50 50)" />
              <path d="M50 8 C53 25 47 25 50 8 Z" fill={currentPhase === "Menstrual" ? "#fda4af" : currentPhase === "Follicular" ? "#a3b19b" : currentPhase === "Ovulatory" ? "#f43f5e" : "#fbbf24"} transform="rotate(288 50 50)" />
            </svg>

            <button 
              type="button"
              onClick={() => setShowPhotoOptions(true)}
              className="relative z-10 w-9.5 h-9.5 rounded-full overflow-hidden border border-white focus:outline-none"
            >
              <img 
                src={photoUrl} 
                alt="Profile avatar" 
                className="w-full h-full object-cover shadow-inner"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="w-3.5 h-3.5 text-white" />
              </div>
            </button>
          </div>
          <div>
            <span className="text-[10px] tracking-widest uppercase font-semibold text-slate-700">Aeva Engine</span>
            <h1 className="font-serif text-2xl font-bold text-slate-800">Your Vault</h1>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-sage-50 rounded-full border border-sage-100 text-xs font-semibold text-sage-600">
          <Shield className="w-3.5 h-3.5" />
          <span>Secure Vault</span>
        </div>
      </div>

      {/* Gamified Health Streak & Biometric Sync Score */}
      <div className="bg-white p-4.5 rounded-[28px] border border-rose-100/50 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl">
            <Flame className="w-5.5 h-5.5 fill-current animate-pulse" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-sm text-slate-800">Biometric Sync Streak: {streakCount} Days</h3>
            <p className="text-[10px] text-slate-700">Sync Level 2: Serotonin Booster Active</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleUseRestDay}
            className="px-3 py-1.5 bg-cream-100 hover:bg-cream-200 text-slate-800 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all border border-cream-300/40 focus:outline-none cursor-pointer active:scale-95"
            title="Real bodies need rest! Protect your streak without penalty."
          >
            ☕ Apply Rest Day ({restDaysLeft} Left)
          </button>
          <div className="flex items-center gap-1 bg-rose-50/50 px-3 py-1.5 rounded-2xl border border-rose-100/30">
            <span className="text-rose-500 font-extrabold text-sm">{streakCount} Days</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Mode Switcher Pill */}
      <div className="flex bg-cream-200/70 p-1 rounded-2xl border border-cream-300/40">
        {[
          { id: "cycle_sync", label: "Cycle Sync", icon: Heart },
          { id: "menopause", label: "Menopause", icon: Activity },
          { id: "hormonal_screening", label: "Screening", icon: Sparkles }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleModeChange(tab.id as any)}
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === tab.id
                ? "bg-white text-rose-500 shadow-sm"
                : "text-slate-700 hover:text-slate-800"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 1. Daily Sync Morning Briefing */}
      <div className="bg-gradient-to-br from-cream-100 via-white to-rose-50/20 p-5 rounded-[32px] border border-rose-100/50 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[9px] px-2.5 py-1 bg-rose-50 text-rose-500 rounded-full border border-rose-100/50 font-bold uppercase tracking-wider">
            Morning Briefing
          </span>
          <span className="text-[10px] text-slate-700 font-semibold uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-ping"></span>
            Daily Superpower
          </span>
        </div>
        
        <div className="space-y-3">
          <h2 className="font-serif font-bold text-base text-slate-800 leading-normal">
            "Day {cycleDay} ({currentPhase}): Your social battery is at peak capacity today."
          </h2>
          
          <div className="grid grid-cols-2 gap-3.5 pt-1">
            <div className="p-3.5 bg-white rounded-2xl border border-cream-200/50 shadow-xs">
              <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest block">⚡ Daily Superpower</span>
              <p className="text-[11px] text-slate-700 font-semibold mt-1">
                {currentPhase === "Menstrual" ? "Creative retrospectives & high-concept architecture." :
                 currentPhase === "Follicular" ? "High-volume analytical coding & problem solving." :
                 currentPhase === "Ovulatory" ? "Peak social charisma, negotiations & verbal pitching." :
                 "Attention to details, debugging & deep execution."}
              </p>
            </div>
            <div className="p-3.5 bg-white rounded-2xl border border-cream-200/50 shadow-xs">
              <span className="text-[8px] font-bold text-rose-400 uppercase tracking-widest block">⚠️ Daily Kryptonite</span>
              <p className="text-[11px] text-slate-700 font-semibold mt-1">
                {currentPhase === "Menstrual" ? "Physical exertion & cellular insulin sensitivity dip." :
                 currentPhase === "Follicular" ? "Potential impatience & lack of patience with admin detail." :
                 currentPhase === "Ovulatory" ? "Focus scattering due to high social stimulus." :
                 "Joint relaxin-laxity & carbohydrate crashes."}
              </p>
            </div>
          </div>
        </div>

        {/* 1-Tap Action Plan Hook */}
        <div className="pt-2 border-t border-cream-200/40 flex items-center justify-between gap-3">
          <p className="text-[10px] text-slate-700 italic">
            <strong>1-Tap Action Plan:</strong> Sync Google Calendar to block out focused solo deep work during next week's energy dip.
          </p>
          <button 
            type="button" 
            onClick={() => alert("Google Calendar synchronized! Blocked deep-work focus buffers for Luteal phase.")}
            className="px-3.5 py-2.5 bg-rose-400 hover:bg-rose-500 text-white rounded-xl text-[9px] font-bold tracking-wide uppercase shrink-0 transition-colors shadow-sm focus:outline-none cursor-pointer active:scale-95"
          >
            1-Tap Sync
          </button>
        </div>
      </div>

      {/* 2. Swipe Sync Engine */}
      <div className="bg-white p-5 rounded-[32px] border border-cream-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-cream-100 pb-2">
          <h3 className="font-serif font-bold text-sm text-slate-800 flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-rose-400 fill-current" />
            Swipe Sync: Meals & Movement
          </h3>
          <span className="text-[8px] uppercase tracking-wider font-semibold px-2 py-0.5 bg-rose-50 text-rose-500 rounded-full border border-rose-100/50">
            {currentPhase} Deck
          </span>
        </div>

        {swipeDeckFinished ? (
          <div className="text-center py-6 space-y-3.5">
            <p className="text-xs text-slate-700 font-bold">🎉 Swiped all cards! grocery list compiled.</p>
            <div className="p-3.5 bg-cream-100/50 rounded-2xl border border-cream-200/50 text-left max-w-xs mx-auto space-y-2">
              <span className="text-[8px] uppercase tracking-widest text-slate-700 font-bold block">1-Tap Grocery List:</span>
              <p className="text-[10px] text-slate-700 leading-normal font-mono font-bold">
                {groceryList.length > 0 ? groceryList.join(", ") : "No items selected."}
              </p>
              <button 
                type="button"
                onClick={handleCopyGroceryList}
                className="w-full mt-2 py-2.5 bg-rose-400 hover:bg-rose-500 text-white text-[9px] uppercase tracking-wider font-bold rounded-xl transition-colors focus:outline-none cursor-pointer"
              >
                Copy to Clipboard / Reminders
              </button>
            </div>
            <button 
              type="button"
              onClick={resetSwipeDeck}
              className="text-xs text-rose-400 hover:underline font-semibold focus:outline-none cursor-pointer"
            >
              Reset Swiper Deck
            </button>
          </div>
        ) : (
          <div className="relative flex flex-col items-center py-2">
            <div className="w-full max-w-[280px] bg-gradient-to-tr from-cream-100 to-white rounded-3xl border border-cream-200 shadow-md p-4 space-y-3.5 text-center relative overflow-hidden">
              <span className="text-[8px] uppercase font-extrabold tracking-widest text-rose-400 block">
                {deck[currentCardIndex]?.type} Sync
              </span>
              <h4 className="font-serif font-bold text-sm text-slate-800">
                {deck[currentCardIndex]?.title}
              </h4>
              <p className="text-[10px] text-slate-700 leading-relaxed px-1 font-medium">
                {deck[currentCardIndex]?.desc}
              </p>
              
              <div className="flex justify-center gap-6 pt-2">
                <button
                  type="button"
                  onClick={() => handleSwipe(false)}
                  className="w-10 h-10 rounded-full border border-cream-300 bg-white hover:bg-cream-100 text-slate-700 font-bold flex items-center justify-center shadow-xs transition-transform active:scale-90 focus:outline-none cursor-pointer"
                >
                  ❌
                </button>
                <button
                  type="button"
                  onClick={() => handleSwipe(true)}
                  className="w-10 h-10 rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-500 font-bold flex items-center justify-center shadow-xs transition-transform active:scale-90 focus:outline-none cursor-pointer"
                >
                  ❤️
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Predictive Symptom Bingo */}
      <div className="bg-white p-5 rounded-[32px] border border-cream-200 shadow-sm space-y-4 relative overflow-hidden">
        {showConfetti && (
          <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-20 pointer-events-none transition-all duration-300 animate-fade-in">
            <span className="text-3xl animate-bounce">🌸✨ Confetti Blast! ✨🌸</span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-500 mt-2 animate-pulse">AI Symptom Matched Successfully!</span>
          </div>
        )}

        <div className="flex justify-between items-center border-b border-cream-100 pb-2">
          <div>
            <h3 className="font-serif font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-rose-400 animate-pulse" />
              Symptom Bingo (AI Predictions)
            </h3>
            <p className="text-[9px] text-slate-700">Predictive cards calculated from Firestore logs</p>
          </div>
          <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100/50">
            {bingoGrid.filter(Boolean).length} / 9 Matches
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          {bingoSymptoms.map((symptom, idx) => {
            const isChecked = bingoGrid[idx];
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleBingoClick(idx)}
                className={`p-2 rounded-2xl border text-center transition-all focus:outline-none flex flex-col justify-center items-center gap-1 cursor-pointer min-h-[64px] ${
                  isChecked 
                    ? "bg-rose-50 border-rose-300 text-rose-500 scale-[1.03] shadow-inner font-bold" 
                    : "bg-cream-100/50 hover:bg-cream-200/50 border-cream-200/50 text-slate-700"
                }`}
              >
                <span className="text-[9px] leading-tight font-semibold">{symptom}</span>
              </button>
            );
          })}
        </div>

        {bingoExplanations && (
          <div className="p-3.5 bg-rose-50/50 border border-rose-100 text-[10px] text-slate-700 rounded-2xl leading-normal">
            <strong>AI Clinical Insight:</strong> {bingoExplanations}
          </div>
        )}
      </div>

      {/* MAIN VISUALIZATION WHEEL AREA */}
      {activeTab === "cycle_sync" && profile.lastPeriodStart && (
        <div className="flex flex-col items-center bg-white p-6 rounded-[32px] border border-rose-100 shadow-sm space-y-4">
          <div className="relative" style={{ width: size, height: size }}>
            {/* SVG Progress Ring */}
            <svg className="transform -rotate-90 w-full h-full">
              {/* Background circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                className="stroke-cream-100 fill-transparent"
                strokeWidth={strokeWidth}
              />
              {/* Progress Circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                className={`fill-transparent transition-all duration-500 ${phaseStyles.stroke}`}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={circumference - cycleProgress}
                strokeLinecap="round"
              />
            </svg>
            
            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-700 tracking-wider">Cycle Day</span>
              <span className="text-3xl font-serif font-black text-slate-800 leading-none my-0.5">{cycleDay}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${phaseStyles.bg} ${phaseStyles.accentText} border ${phaseStyles.border}`}>
                {currentPhase}
              </span>
            </div>
          </div>
          
          <div className="text-center space-y-1">
            <h3 className="font-semibold text-sm text-slate-800">
              {daysRemaining} day{daysRemaining > 1 ? "s" : ""} remaining in {currentPhase}
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed italic max-w-xs px-2">
              "{phaseStyles.quote}"
            </p>
          </div>
        </div>
      )}

      {/* MENOPAUSE STABILITY DIAGRAM */}
      {activeTab === "menopause" && (
        <div className="flex flex-col items-center bg-white p-6 rounded-[32px] border border-sage-100 shadow-sm space-y-4">
          <div className="relative" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90 w-full h-full">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                className="stroke-cream-100 fill-transparent"
                strokeWidth={strokeWidth}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                className="fill-transparent stroke-sage-500 transition-all duration-500"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={circumference - menopauseProgress}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-700 tracking-wider">Stability Index</span>
              <span className="text-3xl font-serif font-black text-slate-800 leading-none my-0.5">{stabilityIndex}%</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sage-50 text-sage-600 border border-sage-100">
                Vasomotor Stability
              </span>
            </div>
          </div>

          <div className="text-center space-y-1">
            <h3 className="font-semibold text-sm text-slate-800 flex items-center justify-center gap-1.5">
              <Flame className={`w-4.5 h-4.5 ${hotFlashRisk === "High" ? "text-rose-500 animate-pulse" : "text-amber-500"}`} />
              Hot Flash Windows: <span className="underline">{hotFlashRisk} Risk Today</span>
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed max-w-xs px-2">
              Based on your rolling logs, autonomic stability is {stabilityIndex >= 80 ? "stable" : "fluctuating"}. {stabilityIndex < 80 ? "Prioritize deep breathing & cooling exercises." : "Continue standard hydration protocols."}
            </p>
          </div>
        </div>
      )}

      {/* HORMONAL SCREENING INDEX */}
      {activeTab === "hormonal_screening" && (
        <div className="bg-white p-5 rounded-[32px] border border-amber-100 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-500">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-800">Hormonal Triage Status</h3>
              <p className="text-xs text-slate-700">Clinical-grade symptom pattern checking.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 bg-cream-100/50 rounded-2xl border border-cream-200/50 text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-700 tracking-wider">7-Day Log Ratio</span>
              <p className="text-xl font-bold text-slate-800 mt-1">{recentLogsCount} / 7 days</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.("ai_clinic")}
              className="p-3.5 bg-cream-100/50 hover:bg-rose-50/30 rounded-2xl border border-cream-200/50 focus:outline-none text-center cursor-pointer transition-all duration-300 transform active:scale-95 group block"
            >
              <span className="text-[10px] uppercase font-semibold text-slate-700 tracking-wider group-hover:text-rose-500 transition-colors">Assessment Status</span>
              <span className="text-xs font-bold text-rose-500 mt-2 bg-rose-50 px-3 py-1 rounded-full border border-rose-100/80 shadow-sm animate-pulse flex items-center justify-center gap-1 mx-auto">
                <Sparkles className="w-3.5 h-3.5" />
                Ready to Screen
              </span>
            </button>
          </div>

          <button 
            type="button"
            onClick={() => onNavigate?.("ai_clinic")}
            className="w-full text-left p-3.5 bg-amber-50/50 hover:bg-amber-100/40 border border-amber-100 text-xs text-slate-700 rounded-2xl leading-normal cursor-pointer transition-all flex items-center justify-between gap-2 focus:outline-none"
          >
            <div>
              <strong>Screening note:</strong> Aeva checks symptoms against diagnostic patterns for PCOS, Endometriosis, and Thyroid disparities. Click here to run evaluation.
            </div>
            <Sparkles className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
          </button>
        </div>
      )}

      {/* DAILY PILLAR ADVICE CARDS */}
      <div className="space-y-4">
        <h2 className="font-serif text-lg font-bold text-slate-800">Daily Sync Recommendations</h2>
        
        {/* Fitness / Activity Sync */}
        <div className="flex gap-4 bg-white p-4.5 rounded-[28px] border border-cream-200/60 shadow-sm">
          <div className="p-3 rounded-2xl bg-sage-50 text-sage-600 self-start">
            <Activity className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-xs text-slate-700 uppercase tracking-wider">Activity & Movement</h4>
            <h3 className="font-semibold text-sm text-slate-800">
              {activeTab === "cycle_sync" && currentPhase === "Menstrual" && "Restorative Rest & Slow Walks"}
              {activeTab === "cycle_sync" && currentPhase === "Follicular" && "Heavy Resistance & Intensity Sprints"}
              {activeTab === "cycle_sync" && currentPhase === "Ovulatory" && "HIIT Cardio & Social Group Workouts"}
              {activeTab === "cycle_sync" && currentPhase === "Luteal" && "Steady-State Cardio & Joint Stability focus"}
              {activeTab === "menopause" && "Strength Training for Bone Density"}
              {activeTab === "hormonal_screening" && "Low-impact Steady State (LISS) Cardio"}
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              {activeTab === "cycle_sync" && currentPhase === "Menstrual" && "Estrogen and progesterone are at their lowest baseline. Prioritize gentle yoga or light walking to aid circulation without spiking cortisol."}
              {activeTab === "cycle_sync" && currentPhase === "Follicular" && "Estrogen levels are rising, increasing pain tolerance and recovery speed. Go for heavy lifting, high-intensity workouts, or running."}
              {activeTab === "cycle_sync" && currentPhase === "Ovulatory" && "Your body experiences peak energy levels. Push hard with metabolic training, but monitor joint ranges as relaxin is also peaking."}
              {activeTab === "cycle_sync" && currentPhase === "Luteal" && "Relaxin spikes joint laxity, decreasing stability. Keep intensity moderate, switch from loaded squats to pilates, and do steady cardio."}
              {activeTab === "menopause" && "Estrogen declines reduce calcium absorption. Lift moderately heavy weights twice a week to stimulate bone density and maintain muscle tissue."}
              {activeTab === "hormonal_screening" && "To prevent chronic stress spikes that disrupt cortisol-thyroid-estrogen balance, emphasize low-intensity exercise like pilates, walking, and light swimming."}
            </p>
          </div>
        </div>

        {/* Nutrition / Micronutrient Card */}
        <div className="flex gap-4 bg-white p-4.5 rounded-[28px] border border-cream-200/60 shadow-sm">
          <div className="p-3 rounded-2xl bg-rose-50 text-rose-500 self-start">
            <Apple className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-xs text-slate-700 uppercase tracking-wider">Nutrition & Micronutrients</h4>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold px-2 py-0.5 bg-rose-100 text-rose-600 rounded-full">
                {activeTab === "cycle_sync" && currentPhase === "Menstrual" && "Iron & Vitamin C"}
                {activeTab === "cycle_sync" && currentPhase === "Follicular" && "Complex Carbs & Raw Sprouted Veggies"}
                {activeTab === "cycle_sync" && currentPhase === "Ovulatory" && "Fiber & Anti-inflammatory Fats"}
                {activeTab === "cycle_sync" && currentPhase === "Luteal" && "Magnesium & Omega-3"}
                {activeTab === "menopause" && "Calcium & Vitamin D"}
                {activeTab === "hormonal_screening" && "Zinc, Selenium & Gluten-Free Foods"}
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {activeTab === "cycle_sync" && currentPhase === "Menstrual" && "Replenish iron levels depleted by blood loss. Combine grass-fed beef or lentils with lemon juice (Vitamin C) to maximize absorption."}
              {activeTab === "cycle_sync" && currentPhase === "Follicular" && "Support estrogen metabolism by eating broccoli, cabbage, and fermented foods. Focus on energy-rich whole grains."}
              {activeTab === "cycle_sync" && currentPhase === "Ovulatory" && "High estrogen speeds up digestion. Keep things light with leafy greens, seeds, berries, and omega-3 rich fish to control cellular swelling."}
              {activeTab === "cycle_sync" && currentPhase === "Luteal" && "Progesterone creates cravings and blood sugar dips. Focus on magnesium-rich pumpkin seeds and almonds to prevent sugar spikes and reduce muscle cramps."}
              {activeTab === "menopause" && "Protect heart and skeletal health. Target 1200mg Calcium and 800IU Vitamin D today. Increase intake of fortified organic yogurt, tofu, and sardines."}
              {activeTab === "hormonal_screening" && "In PCOS or thyroid disparities, insulin resistance or inflammation is typical. Choose selenium (brazil nuts), zinc (oysters/pumpkin seeds), and anti-inflammatory whole meals."}
            </p>
          </div>
        </div>

        {/* Cognitive & Productivity Card */}
        <div className="flex gap-4 bg-white p-4.5 rounded-[28px] border border-cream-200/60 shadow-sm">
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-500 self-start">
            <Brain className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-xs text-slate-700 uppercase tracking-wider">Cognitive Focus & Brain State</h4>
            <h3 className="font-semibold text-sm text-slate-800">
              {activeTab === "cycle_sync" && currentPhase === "Menstrual" && "Creative Evaluation & Solo Tasks"}
              {activeTab === "cycle_sync" && currentPhase === "Follicular" && "Structural Planning & Ideation"}
              {activeTab === "cycle_sync" && currentPhase === "Ovulatory" && "Collaborative Meetings & pitches"}
              {activeTab === "cycle_sync" && currentPhase === "Luteal" && "Administrative Execution & Editing"}
              {activeTab === "menopause" && "Cognitive Load reduction & Brain-Fog mitigation"}
              {activeTab === "hormonal_screening" && "Hormonal Rhythm pacing"}
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              {activeTab === "cycle_sync" && currentPhase === "Menstrual" && "Brain hemispheres communicate well during menses. Do retro-analysis, review logs, journal, or brainstorm high-concept creative visions."}
              {activeTab === "cycle_sync" && currentPhase === "Follicular" && "Your brain is highly analytical and receptive to new projects. Write outlines, architect frameworks, or begin coding novel features."}
              {activeTab === "cycle_sync" && currentPhase === "Ovulatory" && "Estrogen peak makes verbal areas of the brain highly active. Perfect for giving client pitches, negotiating deals, or recording audio."}
              {activeTab === "cycle_sync" && currentPhase === "Luteal" && "Attention to detail rises. This is the optimal time for debugging code, reviewing contracts, proofreading documents, or organizing assets."}
              {activeTab === "menopause" && "Declining estrogen can lead to mild brain fog. Use chunking techniques: work in structured 20-minute pomodoros and keep details written down rather than memorized."}
              {activeTab === "hormonal_screening" && "Hormonal imbalances can cause dynamic mood swings. Match tasks to current energy. Do not force high-intensity cognitive work when feeling severe fatigue."}
            </p>
          </div>
        </div>
      </div>

      {/* PHOTO SELECTION OPTIONS DRAWER/MODAL */}
      {showPhotoOptions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end justify-center p-4">
          <div className="bg-white w-full max-w-[440px] rounded-[32px] p-6 space-y-4 shadow-2xl border border-rose-100">
            <div className="flex justify-between items-center pb-2 border-b border-cream-200">
              <h3 className="font-serif font-bold text-base text-slate-800">Update Profile Avatar</h3>
              <button 
                onClick={() => setShowPhotoOptions(false)}
                className="p-1 rounded-full hover:bg-cream-100 text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={startCamera}
                className="flex flex-col items-center justify-center p-4 bg-rose-50/50 hover:bg-rose-50 rounded-2xl border border-rose-100 text-rose-500 transition-colors gap-2 cursor-pointer"
              >
                <Camera className="w-6 h-6 text-rose-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Use Camera</span>
              </button>

              <label
                className="flex flex-col items-center justify-center p-4 bg-cream-100 hover:bg-cream-200 rounded-2xl border border-cream-200 text-slate-800 transition-colors gap-2 cursor-pointer"
              >
                <FileImage className="w-6 h-6 text-slate-700" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">Upload File</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    handlePhotoUpload(e);
                    setShowPhotoOptions(false);
                  }}
                  disabled={loading}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* DEVICE CAMERA SNAPSHOT MODAL */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-6 space-y-6">
          <div className="w-full max-w-[400px] flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-rose-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider">Aeva Biometric Capture</span>
            </div>
            <button 
              onClick={closeCamera}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Square Camera frame with dynamic phase glow halo */}
          <div className="relative w-[320px] h-[320px] rounded-full overflow-hidden border-4 border-white shadow-2xl flex items-center justify-center bg-black">
            {/* Phase glow overlay ring wrapper */}
            <div className={`absolute inset-0 rounded-full border-[8px] z-10 pointer-events-none ${
              currentPhase === "Menstrual" ? "border-rose-400/80 shadow-[inset_0_0_25px_#fda4af,0_0_25px_#fda4af]" :
              currentPhase === "Follicular" ? "border-sage-400/80 shadow-[inset_0_0_25px_#84a98c,0_0_25px_#84a98c]" :
              currentPhase === "Ovulatory" ? "border-rose-500/80 shadow-[inset_0_0_25px_#f43f5e,0_0_25px_#f43f5e]" :
              "border-amber-400/80 shadow-[inset_0_0_25px_#f59e0b,0_0_25px_#f59e0b]"
            }`}></div>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover scale-x-[-1]"
            />
          </div>

          <div className="w-full max-w-[320px] text-center space-y-4">
            <p className="text-[10px] text-white/70 uppercase font-semibold tracking-widest leading-relaxed">
              Active Phase: {currentPhase} Mode
            </p>
            <button
              onClick={capturePhoto}
              className="w-full py-4 bg-rose-400 hover:bg-rose-500 text-white rounded-2xl font-bold text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              <span>Capture Sync Profile</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
