"use client";

import React, { useState, useEffect } from "react";
import { subscribeAuth, getProfile, UserProfile } from "@/lib/services";
import Auth from "@/components/Auth";
import Dashboard from "@/components/Dashboard";
import SymptomLog from "@/components/SymptomLog";
import AIClinic from "@/components/AIClinic";
import PrivacyVault from "@/components/PrivacyVault";
import AdminPanel from "@/components/AdminPanel";
import SocialCircle from "@/components/SocialCircle";
import { Heart, ClipboardList, Sparkles, Shield, Loader2, BarChart3, Users } from "lucide-react";

type TabType = "dashboard" | "symptom_log" | "ai_clinic" | "admin" | "privacy_vault" | "social_circle";

export default function Home() {
  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [authChecking, setAuthChecking] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Subscribe to authentication state
  useEffect(() => {
    // Fail-safe timeout: force bypass if Firebase Auth hangs
    const timeoutId = setTimeout(() => {
      setAuthChecking((checking) => {
        if (checking) {
          console.warn("Authentication checking timed out. Bypassing to main interface.");
          return false;
        }
        return checking;
      });
    }, 2500);

    const unsubscribe = subscribeAuth(async (currUser) => {
      clearTimeout(timeoutId);
      setUser(currUser);
      setAuthChecking(false);
      
      if (currUser) {
        setProfileLoading(true);
        try {
          const uProfile = await getProfile(currUser.uid);
          if (uProfile) {
            setProfile(uProfile);
          } else {
            // Default profile structure if missing
            const fallbackProfile: UserProfile = { mode: "cycle_sync" };
            setProfile(fallbackProfile);
          }
        } catch (err) {
          console.error("Error loading user profile:", err);
        } finally {
          setProfileLoading(false);
        }
      } else {
        setProfile(null);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const handleAuthSuccess = async (uid: string, email: string) => {
    setUser({ uid, email });
    setProfileLoading(true);
    try {
      const uProfile = await getProfile(uid);
      if (uProfile) {
        setProfile(uProfile);
        setActiveTab("dashboard");
      } else {
        const fallbackProfile: UserProfile = { mode: "cycle_sync" };
        setProfile(fallbackProfile);
        setActiveTab("dashboard");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileUpdate = (newProfile: UserProfile) => {
    setProfile(newProfile);
  };

  const handleLogout = () => {
    setUser(null);
    setProfile(null);
    setActiveTab("dashboard");
  };

  if (authChecking) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 space-y-3 bg-cream-50">
        <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
        <p className="text-xs text-slate-700 font-semibold uppercase tracking-wider">Unlocking Aeva...</p>
      </div>
    );
  }

  // Render Onboarding / Login if no active user session
  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  const isAdminUser = !!(user.email && (user.email.toLowerCase().includes("admin") || user.email.toLowerCase() === "admin@aeva.com"));

  if (profileLoading || !profile) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 space-y-3 bg-cream-50">
        <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
        <p className="text-xs text-slate-700">Accessing Encrypted Profile...</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col flex-1 h-full overflow-hidden bg-cream-50">
      
      {/* Active Tab Screen Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === "dashboard" && (
          <Dashboard 
            uid={user.uid} 
            profile={profile} 
            onProfileUpdate={handleProfileUpdate} 
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === "symptom_log" && (
          <SymptomLog 
            uid={user.uid} 
            profile={profile} 
          />
        )}
        {activeTab === "ai_clinic" && (
          <AIClinic 
            uid={user.uid} 
            profile={profile} 
          />
        )}
        {activeTab === "privacy_vault" && (
          <PrivacyVault 
            uid={user.uid} 
            userEmail={user.email || "local_user"} 
            onLogout={handleLogout} 
          />
        )}
        {activeTab === "social_circle" && (
          <SocialCircle 
            uid={user.uid}
            userEmail={user.email || "local_user"}
            profile={profile}
          />
        )}
        {activeTab === "admin" && isAdminUser && (
          <AdminPanel />
        )}
      </div>

      {/* Bottom Tab Navigation Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-lg border-t border-cream-200/50 flex items-center justify-around px-4 pb-4.5 pt-2 z-50">
        {[
          { id: "dashboard", label: "Dashboard", icon: Heart },
          { id: "symptom_log", label: "Log Daily", icon: ClipboardList },
          { id: "ai_clinic", label: "AI Clinic", icon: Sparkles },
          { id: "social_circle", label: "Circle", icon: Users },
          ...(isAdminUser ? [{ id: "admin", label: "Admin", icon: BarChart3 }] : []),
          { id: "privacy_vault", label: "Privacy", icon: Shield }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className="flex flex-col items-center justify-center w-16 h-12 transition-all group relative"
            >
              <div className={`p-1.5 rounded-2xl transition-all ${
                isActive ? "bg-rose-50 text-rose-500 scale-110" : "text-slate-700 group-hover:text-slate-800"
              }`}>
                <tab.icon className="w-5.5 h-5.5" />
              </div>
              <span className={`text-[10px] mt-0.5 font-bold transition-all ${
                isActive ? "text-rose-500 font-extrabold" : "text-slate-700"
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

    </div>
  );
}
