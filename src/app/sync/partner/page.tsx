"use client";

import React, { useEffect, useState } from "react";
import { getProfile, UserProfile } from "@/lib/services";
import { Heart, Sparkles, Coffee, ShoppingBag, Flame, Shield, Activity, Calendar } from "lucide-react";

export default function PartnerSyncPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState("Luteal");
  const [cycleDay, setCycleDay] = useState(18);

  useEffect(() => {
    // Parse query string client-side
    const params = new URLSearchParams(window.location.search);
    const vaultId = params.get("vault") || "google_local";

    const fetchSyncData = async () => {
      try {
        if (vaultId === "google_local" || vaultId.startsWith("google_local")) {
          // Mock data for test user
          setProfile({
            mode: "cycle_sync",
            cycleLength: 28,
            periodLength: 5,
            lastPeriodStart: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
          });
          setPhase("Luteal");
          setCycleDay(18);
        } else {
          const fetchedProfile = await getProfile(vaultId);
          if (fetchedProfile) {
            setProfile(fetchedProfile);
            
            // Calculate phase
            if (fetchedProfile.mode === "cycle_sync" && fetchedProfile.lastPeriodStart && fetchedProfile.cycleLength) {
              const lastStart = new Date(fetchedProfile.lastPeriodStart);
              const diffTime = Math.abs(Date.now() - lastStart.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              const currentDay = ((diffDays - 1) % fetchedProfile.cycleLength) + 1;
              setCycleDay(currentDay);

              if (currentDay <= (fetchedProfile.periodLength || 5)) {
                setPhase("Menstrual");
              } else if (currentDay <= 13) {
                setPhase("Follicular");
              } else if (currentDay <= 15) {
                setPhase("Ovulatory");
              } else {
                setPhase("Luteal");
              }
            } else if (fetchedProfile.mode === "menopause") {
              setPhase("Menopause");
            } else {
              setPhase("Wellness Triage");
            }
          } else {
            // Default fallback mockup
            setProfile({ mode: "cycle_sync" });
          }
        }
      } catch (e) {
        console.error("Failed to load synced partner profile:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchSyncData();
  }, []);

  const getSupportAdvice = () => {
    switch (phase) {
      case "Menstrual":
        return {
          title: "Rest & Recovery Support",
          desc: "Hormone levels are at their lowest baseline. Uterine shedding is active.",
          tips: [
            "Keep tasks low-intensity. Excellent time to take over dinner preparation.",
            "Bring warming ginger tea or raspberry leaf infusions to soothe smooth muscle spasms.",
            "Prioritize cozy, restful evenings. Avoid scheduling heavy social activities."
          ],
          energy: "Low / Restorative"
        };
      case "Follicular":
        return {
          title: "High Energy & Brainstorms",
          desc: "Estrogen is ramping up, boosting social capacity and physical strength.",
          tips: [
            "Plan adventurous dates, workout runs, or social dinners.",
            "Great time for collaborative planning and launching new projects together.",
            "Energy is high—no need to hold back on activities!"
          ],
          energy: "High / Rising"
        };
      case "Ovulatory":
        return {
          title: "Peak Social Charisma",
          desc: "Estrogen and testosterone peak. Social battery and verbal confidence are at 100%.",
          tips: [
            "Excellent time for hosting gatherings or going to dynamic group functions.",
            "Support her pitches and creative presentations—her communication centers are highly active.",
            "Keep meal planning light and vibrant."
          ],
          energy: "Peak Battery ⚡"
        };
      case "Luteal":
        return {
          title: "Comfort & Pacing Mode",
          desc: "Progesterone is high, accelerating metabolism. Sugar drops can trigger low energy.",
          tips: [
            "Proactively take over cooking. Focus on complex carbohydrates (sweet potatoes, beans).",
            "Bring home dark chocolate (85%) and almonds (rich in magnesium to curb PMS cravings).",
            "Joint relaxin peaks. Suggest lower impact walks rather than intense runs or gym loads."
          ],
          energy: "Steady / Declining"
        };
      default: // Menopause / Wellness
        return {
          title: "Vasomotor Cooling Support",
          desc: "Hormones are transitioning. Vasomotor stability may trigger temperature fluctuations.",
          tips: [
            "Ensure access to cold water and cool ventilated environments.",
            "Practice paced breathing together to soothe autonomic arousal.",
            "Prioritize resistance strength exercises twice a week to protect bone mineral density."
          ],
          energy: "Variable / Paced"
        };
    }
  };

  const advice = getSupportAdvice();

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center space-y-3 p-6">
        <Activity className="w-8 h-8 text-rose-400 animate-spin" />
        <p className="text-xs text-slate-700 font-semibold uppercase tracking-wider">Accessing Partner Sync Core...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 p-5 flex flex-col items-center justify-start space-y-6 max-w-md mx-auto">
      
      {/* Header Banner */}
      <div className="w-full text-center space-y-2 pt-6">
        <div className="inline-flex p-3.5 bg-rose-100 rounded-full text-rose-500 mb-1 shadow-sm">
          <Heart className="w-6 h-6 fill-current animate-pulse" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-slate-800">Aeva Partner Sync</h1>
        <p className="text-xs text-slate-700 px-4">
          Real-time, zero-knowledge hormone synchronization. Supporting her biological clock.
        </p>
      </div>

      {/* Main Status card */}
      <div className="w-full bg-white p-6 rounded-[32px] border border-rose-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-cream-100 pb-3">
          <span className="text-[10px] uppercase font-bold tracking-wider text-rose-500 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100/50">
            {phase} Phase
          </span>
          {profile?.mode === "cycle_sync" && (
            <span className="text-xs text-slate-700 font-semibold">
              Cycle Day {cycleDay} / {profile.cycleLength || 28}
            </span>
          )}
        </div>

        <div className="space-y-1">
          <h2 className="font-serif font-bold text-lg text-slate-800">{advice.title}</h2>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">{advice.desc}</p>
        </div>

        <div className="p-3.5 bg-cream-100/40 rounded-2xl border border-cream-200/50 flex justify-between items-center">
          <span className="text-[10px] uppercase font-bold text-slate-700">Estimated Energy Level:</span>
          <span className="text-xs font-bold text-rose-500">{advice.energy}</span>
        </div>
      </div>

      {/* Action Plan Suggestions */}
      <div className="w-full bg-white p-6 rounded-[32px] border border-cream-200 shadow-sm space-y-4">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-cream-100 pb-2 flex items-center gap-1.5">
          <ShoppingBag className="w-4 h-4 text-rose-400" />
          Support Playbook today
        </h3>

        <div className="space-y-3.5">
          {advice.tips.map((tip, idx) => (
            <div key={idx} className="flex gap-3 items-start">
              <div className="p-1.5 bg-rose-50 text-rose-500 rounded-lg shrink-0 mt-0.5">
                <Coffee className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs text-slate-700 leading-normal font-medium">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Vault Badge */}
      <div className="w-full bg-sage-50/50 p-4 rounded-2xl border border-sage-100/50 flex items-center gap-3">
        <Shield className="w-5 h-5 text-sage-600 shrink-0" />
        <p className="text-[10px] text-slate-700 leading-normal">
          <strong>Privacy note:</strong> Decryption of metrics was computed locally. Deep medical symptoms, moods, and files are protected inside her zero-knowledge client vault.
        </p>
      </div>

    </div>
  );
}
