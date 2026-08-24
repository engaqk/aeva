"use client";

import React, { useState, useEffect } from "react";
import { subscribeAuth, getProfile, UserProfile, signOut, sendChatMessage, getChatMessages, ChatMessage, recordActivity } from "@/lib/services";
import Auth from "@/components/Auth";
import Dashboard from "@/components/Dashboard";
import SymptomLog from "@/components/SymptomLog";
import AIClinic from "@/components/AIClinic";
import PrivacyVault from "@/components/PrivacyVault";
import DevicesPanel from "@/components/DevicesPanel";
import SocialCircle from "@/components/SocialCircle";
import { Heart, ClipboardList, Sparkles, Shield, Loader2, Users, Globe, LogOut, MessageSquare, Send } from "lucide-react";
import { TRANSLATIONS, LanguageCode } from "@/lib/translations";

type TabType = "dashboard" | "symptom_log" | "ai_clinic" | "privacy_vault" | "social_circle" | "devices";

export default function Home() {
  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [authChecking, setAuthChecking] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>("en");

  // Support Chat States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const chatEndRef = React.useRef<HTMLDivElement | null>(null);

  // Load and poll support chat messages when drawer is open
  useEffect(() => {
    if (!user || !isChatOpen) return;
    
    const fetchChats = async () => {
      try {
        const msgs = await getChatMessages(user.uid);
        setChats(msgs);
      } catch (e) {
        console.warn(e);
      }
    };

    fetchChats();
    const interval = setInterval(fetchChats, 4000);
    return () => clearInterval(interval);
  }, [user, isChatOpen]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chats]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !chatInput.trim() || chatSending) return;

    setChatSending(true);
    try {
      const email = user.email || `${user.uid.substring(0, 8)}@aeva.com`;
      const sent = await sendChatMessage(user.uid, "user", chatInput.trim(), email);
      setChats((prev) => [...prev, sent]);
      setChatInput("");
    } catch (err) {
      console.error(err);
    } finally {
      setChatSending(false);
    }
  };

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    recordActivity('App Session Started', user?.uid || 'guest', user?.email || 'guest');
  }, [user?.uid]);

  // Monitor PWA installation support
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect standalone app mode
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isStandaloneMode) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // If iOS and not standalone, show install guidance
    if (isIOSDevice && !isStandaloneMode) {
      setShowInstallBanner(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User choice outcome: ${outcome}`);
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    } else if (isIOS) {
      alert(
        language === "hi" ? "आईफोन पर ऐप इंस्टॉल करने के लिए: शेयर (Share) आइकन पर टैप करें और फिर 'होम स्क्रीन में जोड़ें' (Add to Home Screen) चुनें।" :
        language === "gu" ? "આઇફોન પર એપ ઇન્સ્ટોલ કરવા માટે: શેર (Share) આઇકોન પર ટેપ કરો અને પછી 'હોમ સ્ક્રીન પર ઉમેરો' (Add to Home Screen) પસંદ કરો." :
        language === "fr" ? "Pour installer sur iOS : appuyez sur Partager puis sur 'Sur l'écran d'accueil'." :
        language === "de" ? "Für iOS: Tippen Sie auf Teilen und dann auf 'Zum Home-Bildschirm'." :
        language === "es" ? "Para iOS: toque Compartir y luego 'Agregar a pantalla de inicio'." :
        "To install on iOS: tap the Share button in Safari, then select 'Add to Home Screen'."
      );
    }
  };

  // Load language from LocalStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("aeva_language") as LanguageCode | null;
      if (savedLang && ["en", "fr", "de", "es", "hi", "gu"].includes(savedLang)) {
        setLanguage(savedLang);
      }
    }
  }, []);

  const handleLanguageChange = (lang: LanguageCode) => {
    setLanguage(lang);
    localStorage.setItem("aeva_language", lang);
  };

  const t = (key: string) => {
    return TRANSLATIONS[language]?.[key] || key;
  };

  // Subscribe to authentication state
  useEffect(() => {
    if (typeof window !== "undefined") {
      const impUid = localStorage.getItem("aeva_impersonate_uid");
      const impEmail = localStorage.getItem("aeva_impersonate_email");
      if (impUid) {
        setUser({ uid: impUid, email: impEmail });
        setAuthChecking(false);
        
        const loadImpersonatedProfile = async () => {
          setProfileLoading(true);
          try {
            const uProfile = await getProfile(impUid);
            if (uProfile) {
              setProfile(uProfile);
            } else {
              setProfile({ mode: "cycle_sync" });
            }
          } catch (err) {
            console.error(err);
          } finally {
            setProfileLoading(false);
          }
        };
        loadImpersonatedProfile();
        return;
      }
    }

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
      
      if (currUser) {
        // Auto-heal master key if missing from localStorage on refresh
        const keyKey = `aeva_master_key_${currUser.uid}`;
        if (typeof window !== "undefined" && !localStorage.getItem(keyKey)) {
          try {
            const { deriveKeyFromPassword, bufToHex } = await import("@/lib/crypto");
            const salt = bufToHex(new TextEncoder().encode((currUser.email || "google_user") + "_aevasalt"));
            const derived = await deriveKeyFromPassword(currUser.uid, salt);
            localStorage.setItem(keyKey, derived);
          } catch (e) {
            console.error("Auto-heal master key failed:", e);
          }
        }

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
          setAuthChecking(false);
        }
      } else {
        setProfile(null);
        setAuthChecking(false);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const handleAuthSuccess = async (uid: string, email: string, completedProfile?: UserProfile) => {
    setUser({ uid, email });
    if (completedProfile) {
      setProfile(completedProfile);
      setActiveTab("dashboard");
      return;
    }
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

  const handleLogout = async () => {
    const confirmMsg = language === "hi" ? "क्या आप वाकई साइन आउट करना चाहते हैं?" :
                       language === "gu" ? "શું તમે ખરેખર સાઇન આઉટ કરવા માંગો છો?" :
                       "Are you sure you want to sign out?";
    if (window.confirm(confirmMsg)) {
      await signOut();
      setUser(null);
      setProfile(null);
      setActiveTab("dashboard");
    }
  };

  if (authChecking || (user && profileLoading)) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 space-y-3 bg-cream-50">
        <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
        <p className="text-xs text-slate-700 font-semibold uppercase tracking-wider">Unlocking Aeva...</p>
      </div>
    );
  }

  const hasMasterKey = user ? (typeof window !== "undefined" && !!localStorage.getItem(`aeva_master_key_${user.uid}`)) : false;
  const isUserAuthenticated = !!user && hasMasterKey && !!profile && !!profile.demographicsFilled;

  return (
    <div className="relative flex flex-col flex-1 h-full overflow-hidden bg-cream-50">
      
      {/* Impersonation Warning Banner */}
      {typeof window !== "undefined" && localStorage.getItem("aeva_impersonate_uid") && (
        <div className="w-full bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-xs font-bold z-[100] shrink-0 shadow-md">
          <div className="flex items-center gap-2">
            <span className="animate-pulse">⚠️</span>
            <span>Impersonation Session: {localStorage.getItem("aeva_impersonate_email")}</span>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("aeva_impersonate_uid");
              localStorage.removeItem("aeva_impersonate_email");
              window.location.href = "/admin";
            }}
            className="bg-white hover:bg-cream-100 text-amber-600 font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider text-[9px] cursor-pointer transition-colors shadow-xs"
          >
            Exit Impersonation
          </button>
        </div>
      )}
      
      {/* Premium Persistent Top Header Bar */}
      <div className="w-full h-16 bg-white/90 backdrop-blur-md border-b border-cream-200/50 flex items-center justify-between px-5 shrink-0 z-50 animate-fade-in">
        <div className="flex items-center gap-2">
          {user && profile?.demographics?.photoHex ? (
            <img 
              src={profile.demographics.photoHex} 
              alt="Profile" 
              className="w-8 h-8 rounded-full object-cover border-2 border-rose-200 cursor-pointer shadow-sm hover:opacity-80 transition-opacity" 
              onClick={() => setActiveTab('privacy_vault')}
            />
          ) : user ? (
            <div 
              className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-400 cursor-pointer hover:bg-rose-100 transition-colors border-2 border-rose-100" 
              onClick={() => setActiveTab('privacy_vault')}
            >
              <Users className="w-4 h-4" />
            </div>
          ) : (
            <span className="text-xl">🌸</span>
          )}
          <span className="font-serif font-bold text-lg tracking-wider text-rose-500">Aeva</span>
          <span className="text-[8px] tracking-widest font-extrabold text-slate-700 bg-cream-100 px-2 py-0.5 rounded uppercase">Sync</span>
        </div>
        
        {/* Language selector */}
        <div className="flex items-center gap-1.5 bg-cream-100/50 hover:bg-cream-100 border border-cream-200/40 px-3 py-1.5 rounded-2xl transition-all shadow-xs">
          <Globe className="w-3.5 h-3.5 text-rose-400" />
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as LanguageCode)}
            className="bg-transparent text-[10px] font-extrabold text-slate-700 focus:outline-none cursor-pointer border-none p-0 pr-1"
          >
            <option value="en">English 🇬🇧</option>
            <option value="fr">Français 🇫🇷</option>
            <option value="de">Deutsch 🇩🇪</option>
            <option value="es">Español 🇪🇸</option>
            <option value="hi">हिन्दी 🇮🇳</option>
            <option value="gu">ગુજરાતી 🇮🇳</option>
          </select>
        </div>
      </div>

      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="w-full bg-rose-50 border-b border-rose-100 px-4 py-2 flex items-center justify-between text-xs text-rose-800 z-40 animate-slide-in shrink-0">
          <div className="flex items-center gap-2 text-left">
            <span>📲</span>
            <span className="font-semibold text-[10px]">
              {language === "hi" ? "ऐवा: एक टैप में अपना चक्र ट्रैक करें और गोपनीयता सुरक्षित रखें।" :
               language === "gu" ? "એવા: એક ટેપમાં તમારું ચક્ર ટ્રૅક કરો અને પ્રાઇવસી લૉક કરો." :
               language === "fr" ? "Aeva : Suivez votre cycle, verrouillez votre vie privée en un clic." :
               language === "de" ? "Aeva: Zyklus verfolgen, Privatsphäre schützen mit einem Klick." :
               language === "es" ? "Aeva: Sigue tu ciclo, bloquea tu privacidad con un toque." :
               "Aeva: Track your cycle, lock your privacy in one tap."}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="bg-rose-500 hover:bg-rose-600 text-white font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider text-[9px] cursor-pointer transition-colors shadow-xs"
            >
              {language === "hi" ? "इंस्टॉल" :
               language === "gu" ? "ઇન્સ્ટોલ" :
               language === "fr" ? "Installer" :
               language === "de" ? "Installieren" :
               language === "es" ? "Instalar" :
               "Install"}
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="text-rose-450 hover:text-rose-600 font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main viewport body */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {!isUserAuthenticated ? (
          <Auth 
            onAuthSuccess={handleAuthSuccess} 
            initialUserId={user?.uid} 
            initialUserEmail={user?.email || undefined} 
            language={language}
          />
        ) : (profileLoading || !profile) ? (
          <div className="flex flex-col items-center justify-center flex-1 space-y-3 bg-cream-50">
            <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
            <p className="text-xs text-slate-700">Accessing Encrypted Profile...</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Active Tab Screen Area */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {activeTab === "dashboard" && (
                <Dashboard 
                  uid={user.uid} 
                  profile={profile} 
                  onProfileUpdate={handleProfileUpdate} 
                  onNavigate={setActiveTab}
                  language={language}
                />
              )}
              {activeTab === "symptom_log" && (
                <SymptomLog 
                  uid={user.uid} 
                  profile={profile} 
                  language={language}
                />
              )}
              {activeTab === "ai_clinic" && (
                <AIClinic 
                  uid={user.uid} 
                  profile={profile} 
                  language={language}
                />
              )}
              {activeTab === "privacy_vault" && (
                <PrivacyVault 
                  uid={user.uid} 
                  userEmail={user.email || "local_user"} 
                  profile={profile}
                  onProfileUpdate={handleProfileUpdate}
                  onLogout={handleLogout} 
                  language={language}
                />
              )}
              {activeTab === "social_circle" && (
                <SocialCircle 
                  uid={user.uid}
                  userEmail={user.email || "local_user"}
                  profile={profile}
                  language={language}
                />
              )}
              {activeTab === "devices" && (
                <DevicesPanel language={language} />
              )}
            </div>

            {/* Bottom Tab Navigation Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-lg border-t border-cream-200/50 flex items-center justify-around px-4 pb-4.5 pt-2 z-50">
              {[
                { id: "dashboard", label: "Dashboard", icon: Heart },
                { id: "symptom_log", label: "Log Daily", icon: ClipboardList },
                { id: "ai_clinic", label: "AI Clinic", icon: Sparkles },
                { id: "social_circle", label: "Circle", icon: Users },
                { id: "privacy_vault", label: "Privacy", icon: Shield },
                { id: "logout", label: "Logout", icon: LogOut }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.id === "logout") {
                        handleLogout();
                      } else {
                        setActiveTab(tab.id as TabType);
                      }
                    }}
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
                      {tab.id === "dashboard" ? (TRANSLATIONS[language]?.dashboard || "Dashboard") :
                       tab.id === "symptom_log" ? (TRANSLATIONS[language]?.logDaily || "Log Daily") :
                       tab.id === "ai_clinic" ? (TRANSLATIONS[language]?.aiClinic || "AI Clinic") :
                       tab.id === "social_circle" ? (TRANSLATIONS[language]?.circle || "Circle") :
                       tab.id === "privacy_vault" ? (TRANSLATIONS[language]?.privacy || "Privacy") :
                       (language === "hi" ? "लॉगआउट" : language === "gu" ? "લોગઆઉટ" : "Logout")}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Support Chat Floating Button */}
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="fixed bottom-24 right-6 bg-rose-400 hover:bg-rose-500 text-white p-3.5 rounded-full shadow-lg z-[150] transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center border border-rose-300"
              title="Help & Chat with Admin"
            >
              <MessageSquare className="w-5.5 h-5.5" />
            </button>

            {/* Chat Drawer Overlay */}
            {isChatOpen && (
              <div className="fixed bottom-38 right-6 w-80 h-96 bg-white/95 backdrop-blur-md rounded-3xl border border-rose-100 shadow-2xl z-[150] flex flex-col overflow-hidden animate-scale-up text-left">
                {/* Header */}
                <div className="bg-rose-450 text-white p-4.5 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base">💬</span>
                    <div>
                      <h4 className="text-xs font-bold font-serif leading-none">Aeva Support</h4>
                      <span className="text-[9px] text-rose-100 font-bold block mt-1">Chatting with Admin</span>
                    </div>
                  </div>
                  <button onClick={() => setIsChatOpen(false)} className="text-white/80 hover:text-white font-bold text-xs p-1 cursor-pointer">✕</button>
                </div>

                {/* Messages Timeline */}
                <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-cream-50/20 text-xs scrollbar-none">
                  {chats.length === 0 ? (
                    <div className="text-center py-16 text-slate-700 font-medium px-4">
                      <span className="text-2xl block mb-2">👋</span>
                      Need help? Ask us anything! Your conversation with Admin is fully secure.
                    </div>
                  ) : (
                    chats.map((c, i) => {
                      const isAdmin = c.sender === "admin";
                      return (
                        <div key={i} className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}>
                          <div className={`max-w-[78%] p-2.5 rounded-2xl leading-relaxed ${
                            isAdmin 
                              ? "bg-white border border-cream-200 text-slate-800 rounded-tl-none" 
                              : "bg-rose-450 text-white rounded-tr-none shadow-xs"
                          }`}>
                            <p className="m-0 text-[11px] font-medium leading-normal">{c.message}</p>
                            <span style={{ fontSize: '7.5px' }} className={`block mt-1 text-right ${isAdmin ? "text-slate-500" : "text-rose-100"}`}>
                              {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Form Input */}
                <form onSubmit={handleSendChat} className="p-2 border-t border-cream-200/50 bg-white flex gap-1.5 shrink-0">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-cream-100/50 border border-cream-200/45 px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-rose-300 text-slate-850"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || chatSending}
                    className="bg-rose-450 hover:bg-rose-500 disabled:bg-rose-350 text-white p-2 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0 flex items-center justify-center"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

