"use client";

import React, { useState, useEffect } from "react";
import { Watch, Activity, RefreshCw, ShieldCheck, Edit3 } from "lucide-react";
import { TRANSLATIONS, LanguageCode } from "@/lib/translations";

interface DevicesPanelProps {
  language: LanguageCode;
}

export default function DevicesPanel({ language }: DevicesPanelProps) {
  const t = (key: string) => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS["en"]?.[key] || key;
  };

  const [isWatchConnected, setIsWatchConnected] = useState(false);
  const [isWatchSyncing, setIsWatchSyncing] = useState(false);
  const [watchType, setWatchType] = useState<"apple" | "android" | "manual" | null>(null);
  const [watchData, setWatchData] = useState({
    steps: 8432,
    hr: 68,
    sleep: "7h 12m",
    temp: "36.4°C",
    lastUpdated: "Not synced yet"
  });

  // Manual logging form states
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualSteps, setManualSteps] = useState("");
  const [manualHR, setManualHR] = useState("");
  const [manualSleep, setManualSleep] = useState("");
  const [manualTemp, setManualTemp] = useState("");

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedConnected = localStorage.getItem("aeva_watch_connected") === "true";
    const savedType = localStorage.getItem("aeva_watch_type") as "apple" | "android" | "manual" | null;
    const savedData = localStorage.getItem("aeva_watch_data");

    if (savedConnected) {
      setIsWatchConnected(true);
      setWatchType(savedType);
    }
    if (savedData) {
      setWatchData(JSON.parse(savedData));
    }
  }, []);

  const handleWatchSync = (typeToSync = watchType) => {
    if (typeToSync === "manual") return; // Manual inputs do not auto-randomize on sync
    setIsWatchSyncing(true);
    setTimeout(() => {
      const newData = {
        steps: Math.floor(7800 + Math.random() * 2100),
        hr: Math.floor(60 + Math.random() * 15),
        sleep: `${7 + Math.floor(Math.random() * 2)}h ${Math.floor(Math.random() * 59)}m`,
        temp: `${(36.1 + Math.random() * 0.6).toFixed(1)}°C`,
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setWatchData(newData);
      setIsWatchSyncing(false);
      
      localStorage.setItem("aeva_watch_data", JSON.stringify(newData));
    }, 1500);
  };

  const connectDevice = (type: "apple" | "android") => {
    setWatchType(type);
    setIsWatchConnected(true);
    localStorage.setItem("aeva_watch_connected", "true");
    localStorage.setItem("aeva_watch_type", type);
    handleWatchSync(type);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const stepsVal = parseInt(manualSteps) || 0;
    const hrVal = parseInt(manualHR) || 0;
    const sleepVal = manualSleep.trim() || "7h 0m";
    const tempVal = manualTemp.trim().includes("°") ? manualTemp.trim() : `${manualTemp.trim()}°C`;
    
    const newData = {
      steps: stepsVal,
      hr: hrVal,
      sleep: sleepVal,
      temp: tempVal,
      lastUpdated: `Manually set at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    };
    
    setWatchData(newData);
    setShowManualForm(false);
    
    // Set manual link status if not already connected
    setIsWatchConnected(true);
    if (!watchType || watchType !== "apple" && watchType !== "android") {
      setWatchType("manual");
      localStorage.setItem("aeva_watch_type", "manual");
    }
    localStorage.setItem("aeva_watch_connected", "true");
    localStorage.setItem("aeva_watch_data", JSON.stringify(newData));
  };

  const disconnectDevice = () => {
    setIsWatchConnected(false);
    setWatchType(null);
    setShowManualForm(false);
    localStorage.removeItem("aeva_watch_connected");
    localStorage.removeItem("aeva_watch_type");
    localStorage.removeItem("aeva_watch_data");
    setWatchData({
      steps: 8432,
      hr: 68,
      sleep: "7h 12m",
      temp: "36.4°C",
      lastUpdated: "Not synced yet"
    });
  };

  const openManualForm = () => {
    setManualSteps(watchData.steps.toString());
    setManualHR(watchData.hr.toString());
    setManualSleep(watchData.sleep);
    setManualTemp(watchData.temp.replace("°C", ""));
    setShowManualForm(true);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto pb-24 bg-cream-50">
      {/* Header banner */}
      <div className="bg-gradient-to-b from-rose-100/40 to-cream-50 px-6 pt-8 pb-4 text-center space-y-2">
        <div className="inline-flex p-3.5 bg-rose-50 text-rose-500 rounded-3xl border border-rose-100/50 shadow-xs">
          <Watch className="w-7 h-7 animate-pulse" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-slate-800">{t("devices")}</h2>
        <p className="text-xs text-slate-700 max-w-xs mx-auto">
          {language === "hi" ? "जैव-टेलीमेट्री रिकॉर्ड को सीधे सिंक करें या मैन्युअल रूप से दर्ज करें।" :
           language === "gu" ? "બાયો-ટેલીમેટ્રી રેકોર્ડ સીધા સિંક કરો અથવા મેન્યુઅલી દાખલ કરો." :
           language === "fr" ? "Synchronisez les enregistrements bio-télémétriques ou saisissez-les manuellement." :
           language === "de" ? "Synchronisieren Sie Bio-Telemetriedaten direkt oder geben Sie Protokolle manuell ein." :
           language === "es" ? "Sincronice los registros de telemetría directamente o ingrese los datos manualmente." :
           "Synchronize bio-telemetry records directly or input metric logs manually."}
        </p>
      </div>

      <div className="px-5 space-y-5 max-w-[440px] mx-auto w-full">
        {/* Device select card */}
        <div className="bg-white p-5 rounded-[32px] border border-cream-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-cream-100 pb-2">
            <h3 className="font-semibold text-xs text-slate-700 uppercase tracking-wider">{t("deviceConnection")}</h3>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
              isWatchConnected 
                ? "text-sage-600 bg-sage-50 border-sage-100/50" 
                : "text-slate-500 bg-slate-50 border-slate-200/50"
            }`}>
              {isWatchConnected ? `${t("connected")} (${watchType === 'apple' ? 'Apple Watch' : watchType === 'android' ? 'Wear OS' : 'Manual'})` : t("disconnected")}
            </span>
          </div>

          {showManualForm ? (
            /* Manual input form block */
            <form onSubmit={handleManualSubmit} className="space-y-4 pt-2">
              <div className="text-center pb-2 border-b border-cream-100">
                <h4 className="font-bold text-xs text-slate-800">{t("inputManually")}</h4>
                <p className="text-[9px] text-slate-700">Enter custom values to sync with dashboard wellness displays.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 text-left">
                  <label className="text-[9px] uppercase font-bold text-slate-700">{t("dailySteps")}</label>
                  <input
                    type="number"
                    required
                    value={manualSteps}
                    onChange={(e) => setManualSteps(e.target.value)}
                    placeholder="e.g. 8000"
                    className="w-full px-3 py-2.5 bg-cream-100/50 border border-cream-200 focus:border-rose-300 focus:outline-none rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[9px] uppercase font-bold text-slate-700">{t("restingHR")}</label>
                  <input
                    type="number"
                    required
                    value={manualHR}
                    onChange={(e) => setManualHR(e.target.value)}
                    placeholder="e.g. 68"
                    className="w-full px-3 py-2.5 bg-cream-100/50 border border-cream-200 focus:border-rose-300 focus:outline-none rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[9px] uppercase font-bold text-slate-700">{t("sleepDuration")}</label>
                  <input
                    type="text"
                    required
                    value={manualSleep}
                    onChange={(e) => setManualSleep(e.target.value)}
                    placeholder="e.g. 7h 12m"
                    className="w-full px-3 py-2.5 bg-cream-100/50 border border-cream-200 focus:border-rose-300 focus:outline-none rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[9px] uppercase font-bold text-slate-700">{t("basalTemp")}</label>
                  <input
                    type="text"
                    required
                    value={manualTemp}
                    onChange={(e) => setManualTemp(e.target.value)}
                    placeholder="e.g. 36.4"
                    className="w-full px-3 py-2.5 bg-cream-100/50 border border-cream-200 focus:border-rose-300 focus:outline-none rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualForm(false)}
                  className="flex-1 py-2.5 bg-cream-200 hover:bg-cream-300 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer transform active:scale-95"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-400 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm transform active:scale-95"
                >
                  {t("saveMetrics")}
                </button>
              </div>
            </form>
          ) : !isWatchConnected ? (
            /* Disconnected Options Block */
            <div className="space-y-4">
              <p className="text-xs text-slate-700 leading-relaxed text-center">
                Select your smartwatch platform to allow secure, client-side syncing, or input your wellness logs manually.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => connectDevice("apple")}
                  className="p-4 bg-cream-100/30 hover:bg-rose-50/40 border border-cream-200/60 hover:border-rose-200 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 group focus:outline-none"
                >
                  <Watch className="w-7 h-7 text-rose-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold text-slate-750">Apple Watch</span>
                  <span className="text-[8px] font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-cream-200">HealthKit</span>
                </button>
                <button
                  type="button"
                  onClick={() => connectDevice("android")}
                  className="p-4 bg-cream-100/30 hover:bg-emerald-50/40 border border-cream-200/60 hover:border-emerald-200 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 group focus:outline-none"
                >
                  <Activity className="w-7 h-7 text-emerald-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold text-slate-750">Android Wear</span>
                  <span className="text-[8px] font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-cream-200">Google Fit</span>
                </button>
              </div>

              <div className="flex items-center my-2 text-[9px] text-slate-700 font-bold uppercase tracking-wider before:content-[''] before:flex-1 before:border-b before:border-cream-200 before:mr-2 after:content-[''] after:flex-1 after:border-b after:border-cream-200 after:ml-2">Or</div>

              <button
                type="button"
                onClick={openManualForm}
                className="w-full py-3 border border-dashed border-rose-300 hover:bg-rose-50/20 text-rose-500 rounded-2xl font-bold text-xs shadow-sm transition-all inline-flex items-center justify-center gap-1.5 transform active:scale-95 cursor-pointer focus:outline-none"
              >
                <Edit3 className="w-4 h-4" />
                <span>{t("inputManually")}</span>
              </button>
            </div>
          ) : (
            /* Connected view block */
            <div className="space-y-4">
              {/* Connected Active Bar */}
              <div className="flex items-center gap-2 bg-cream-50 p-3 rounded-2xl border border-cream-200/40 text-[11px] text-slate-700 justify-center">
                {watchType === "apple" ? (
                  <>
                    <Watch className="w-4 h-4 text-rose-400 animate-pulse" />
                    <span className="font-semibold">Apple Watch & iOS HealthKit Link Active</span>
                  </>
                ) : watchType === "android" ? (
                  <>
                    <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                    <span className="font-semibold">Wear OS & Google Fit Link Active</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4 text-rose-400 animate-pulse" />
                    <span className="font-semibold">{t("manualActive")}</span>
                  </>
                )}
              </div>

              {/* Data display grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-cream-100/50 rounded-2xl border border-cream-200/50 space-y-0.5 text-center">
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-700">{t("dailySteps")}</span>
                  <p className="text-base font-extrabold text-slate-800">
                    {isWatchSyncing ? "..." : `${watchData.steps.toLocaleString()} ${t("stepsLabel")}`}
                  </p>
                </div>
                <div className="p-3.5 bg-cream-100/50 rounded-2xl border border-cream-200/50 space-y-0.5 text-center">
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-700">{t("restingHR")}</span>
                  <p className="text-base font-extrabold text-slate-800">
                    {isWatchSyncing ? "..." : `${watchData.hr} ${t("restingHrLabel")}`}
                  </p>
                </div>
                <div className="p-3.5 bg-cream-100/50 rounded-2xl border border-cream-200/50 space-y-0.5 text-center">
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-700">{t("sleepDuration")}</span>
                  <p className="text-base font-extrabold text-slate-800">
                    {isWatchSyncing ? "..." : watchData.sleep}
                  </p>
                </div>
                <div className="p-3.5 bg-cream-100/50 rounded-2xl border border-cream-200/50 space-y-0.5 text-center">
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-700">{t("basalTemp")}</span>
                  <p className="text-base font-extrabold text-slate-800">
                    {isWatchSyncing ? "..." : watchData.temp}
                  </p>
                </div>
              </div>

              {/* Action sync bar */}
              <div className="flex items-center justify-between text-[10px] text-slate-700 bg-cream-50 p-2.5 rounded-2xl border border-cream-200/40">
                <span>{t("lastSync")}: {watchData.lastUpdated}</span>
                {watchType !== "manual" ? (
                  <button
                    type="button"
                    onClick={() => handleWatchSync()}
                    disabled={isWatchSyncing}
                    className="flex items-center gap-1 font-bold text-rose-500 hover:text-rose-600 focus:outline-none disabled:text-slate-400 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isWatchSyncing ? "animate-spin" : ""}`} />
                    <span>{isWatchSyncing ? "Syncing..." : t("syncNow")}</span>
                  </button>
                ) : (
                  <span className="font-semibold text-rose-500 uppercase tracking-widest text-[8px] bg-white px-2 py-0.5 rounded border border-cream-250">Offline manual</span>
                )}
              </div>

              {/* Connected Operations */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={openManualForm}
                  className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-500 rounded-xl font-bold text-[10px] transition-all cursor-pointer transform active:scale-95"
                >
                  {t("overrideLog")}
                </button>
                <button
                  type="button"
                  onClick={disconnectDevice}
                  className="flex-1 py-2.5 bg-cream-200 hover:bg-cream-300 text-slate-800 rounded-xl font-bold text-[10px] transition-all cursor-pointer transform active:scale-95"
                >
                  {t("disconnectLink")}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security Warning Notice */}
        <div className="p-4.5 bg-sage-50/50 border border-sage-100 rounded-3xl flex gap-3">
          <ShieldCheck className="w-5 h-5 text-sage-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-850">{t("clientPrivacy")}</h4>
            <p className="text-[10px] text-slate-700 leading-relaxed">
              {t("privacyNotice")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
