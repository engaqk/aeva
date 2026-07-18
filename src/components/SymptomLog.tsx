"use client";

import React, { useState, useEffect } from "react";
import { saveDailyLog, getDailyLog, UserProfile, DailyLogData } from "@/lib/services";
import { encryptJSON, decryptJSON, fileToHex, hexToBlob } from "@/lib/crypto";
import { Shield, Sparkles, Smile, Flame, Moon, Compass, Upload, Check, Loader2, FileText, Image as ImageIcon } from "lucide-react";
import { TRANSLATIONS, LanguageCode } from "@/lib/translations";

interface SymptomLogProps {
  uid: string;
  profile: UserProfile;
  language?: any;
}

export default function SymptomLog({ uid, profile, language = "en" }: SymptomLogProps) {
  const [dateStr, setDateStr] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const t = (key: string) => {
    return TRANSLATIONS[language as LanguageCode]?.[key] || TRANSLATIONS["en"]?.[key] || key;
  };

  // Form Fields
  const [energy, setEnergy] = useState<number>(3);
  const [focus, setFocus] = useState<number>(3);
  const [hotFlashSeverity, setHotFlashSeverity] = useState<number>(0); // 0 = None, 1 = Mild, 2 = Mod, 3 = Severe
  const [jointPain, setJointPain] = useState<number>(0); // 0-5
  const [bloating, setBloating] = useState<number>(1); // 1-5
  const [bleeding, setBleeding] = useState<string>("none"); // none, light, medium, heavy
  const [sleepHours, setSleepHours] = useState<number>(7);
  const [wakeUpMetric, setWakeUpMetric] = useState<string>("Rested"); // Rested, Groggy, Tired
  
  // Moods selection
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const moodsOptions = language === "hi" ? ["शांत", "केंद्रित", "ऊर्जावान", "चिंतित", "कम ऊर्जा", "चिड़चिड़ा", "चिंतनशील", "उदास"] :
                       language === "gu" ? ["શાંત", "કેન્દ્રિત", "ઉર્જાવાન", "ચિંતિત", "ઓછી ઉર્જા", "ચીડિયાપણું", "ચિંતનશીલ", "ઉદાસ"] :
                       language === "fr" ? ["Calme", "Concentré", "Vibrant", "Anxieux", "Fatigué", "Irritable", "Pensif", "Triste"] :
                       language === "de" ? ["Ruhig", "Fokussiert", "Vibrant", "Ängstlich", "Müde", "Gereizt", "Nachdenklich", "Traurig"] :
                       language === "es" ? ["Calma", "Enfoque", "Activa", "Ansiosa", "Cansada", "Irritable", "Pensativa", "Triste"] :
                       ["Calm", "Focused", "Vibrant", "Anxious", "Low Energy", "Irritable", "Reflective", "Sad"];

  // Physical symptoms checklist
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const symptomsOptions = language === "hi" ? ["ऐंठन", "सूजन", "साफ़ त्वचा", "स्तनों में दर्द", "हॉट फ़्लैशेस", "जोड़ों का दर्द", "सिरदर्द", "कोई नहीं"] :
                          language === "gu" ? ["ખેંચાણ", "સોજો", "સાફ ત્વચા", "સ્તનોમાં દુખાવો", "હોટ ફ્લેશ", "સાંધાનો દુખાવો", "માથાનો દુખાવો", "કોઈ નહીં"] :
                          language === "fr" ? ["Crampes", "Ballonnements", "Peau Nette", "Seins Tendus", "Bouffées de Chaleur", "Douleurs Articulaires", "Maux de Tête", "Aucun"] :
                          language === "de" ? ["Krämpfe", "Blähungen", "Reine Haut", "Empfindliche Brüste", "Hitzewallungen", "Gelenkschmerzen", "Kopfschmerzen", "Keine"] :
                          language === "es" ? ["Cólicos", "Hinchazón", "Piel Clara", "Senos Sensibles", "Sofocos", "Dolor Articular", "Dolor de Cabeza", "Ninguno"] :
                          ["Cramps", "Bloating", "Clear Skin", "Tender Breasts", "Hot Flashes", "Joint Pain", "Headache", "None"];

  // Binary File/Image attachment state
  const [attachedFileName, setAttachedFileName] = useState("");
  const [attachedFileMime, setAttachedFileMime] = useState("");
  const [attachedFileHex, setAttachedFileHex] = useState("");
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");

  // Load existing log for the selected date
  useEffect(() => {
    async function loadLog() {
      setLoading(true);
      setError("");
      setMessage("");
      // Reset form fields
      setEnergy(3);
      setFocus(3);
      setHotFlashSeverity(0);
      setJointPain(0);
      setBloating(1);
      setBleeding("none");
      setSleepHours(7);
      setWakeUpMetric("Rested");
      setSelectedMoods([]);
      setSelectedSymptoms([]);
      setAttachedFileName("");
      setAttachedFileMime("");
      setAttachedFileHex("");
      setImagePreviewUrl("");

      try {
        const encryptedLog = await getDailyLog(uid, dateStr);
        if (encryptedLog) {
          const keyHex = localStorage.getItem(`aeva_master_key_${uid}`);
          if (!keyHex) {
            setError("Encryption key missing. Cannot decrypt logs. Please configure your key in the Privacy Vault.");
            setLoading(false);
            return;
          }

          // Handle decrypt
          // IV might be stored inside metadata or as direct property
          const ivHex = (encryptedLog as any).iv || (encryptedLog.metadata as any).iv || "";
          
          if (!encryptedLog.encryptedPayload) {
            setLoading(false);
            return;
          }

          const decrypted = await decryptJSON(encryptedLog.encryptedPayload, keyHex, ivHex);
          if (decrypted) {
            setEnergy(decrypted.energy || 3);
            setFocus(decrypted.focus || 3);
            setHotFlashSeverity(decrypted.hotFlashSeverity || 0);
            setJointPain(decrypted.jointPain || 0);
            setBloating(decrypted.bloating || 1);
            setBleeding(decrypted.bleeding || "none");
            setSleepHours(decrypted.sleepHours || 7);
            setWakeUpMetric(decrypted.wakeUpMetric || "Rested");
            setSelectedMoods(decrypted.selectedMoods || []);
            setSelectedSymptoms(decrypted.selectedSymptoms || []);
            
            if (decrypted.attachedFileHex) {
              setAttachedFileName(decrypted.attachedFileName || "Attached Document");
              setAttachedFileMime(decrypted.attachedFileMime || "application/octet-stream");
              setAttachedFileHex(decrypted.attachedFileHex);
              
              if (decrypted.attachedFileMime?.startsWith("image/")) {
                const blob = hexToBlob(decrypted.attachedFileHex, decrypted.attachedFileMime);
                setImagePreviewUrl(URL.createObjectURL(blob));
              }
            }
          }
        }
      } catch (err: any) {
        console.error("Failed to decrypt log:", err);
        setError("This log exists but could not be decrypted. It might have been encrypted with a different Master Key.");
      } finally {
        setLoading(false);
      }
    }

    loadLog();
  }, [uid, dateStr]);

  const handleMoodToggle = (mood: string) => {
    if (selectedMoods.includes(mood)) {
      setSelectedMoods(selectedMoods.filter((m) => m !== mood));
    } else {
      setSelectedMoods([...selectedMoods, mood]);
    }
  };

  const handleSymptomToggle = (symptom: string) => {
    if (symptom === "None") {
      setSelectedSymptoms(["None"]);
      return;
    }
    const filtered = selectedSymptoms.filter((s) => s !== "None");
    if (filtered.includes(symptom)) {
      setSelectedSymptoms(filtered.filter((s) => s !== symptom));
    } else {
      setSelectedSymptoms([...filtered, symptom]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      setError("File exceeds 500KB limit. Please choose a smaller image or compressed report to prevent database limits.");
      return;
    }

    setAttachmentLoading(true);
    setError("");

    try {
      const hex = await fileToHex(file);
      setAttachedFileName(file.name);
      setAttachedFileMime(file.type);
      setAttachedFileHex(hex);

      if (file.type.startsWith("image/")) {
        setImagePreviewUrl(URL.createObjectURL(file));
      } else {
        setImagePreviewUrl("");
      }
      setMessage("Document attached and staging for encryption.");
    } catch (err) {
      console.error(err);
      setError("Failed to process file binary.");
    } finally {
      setAttachmentLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    const keyHex = localStorage.getItem(`aeva_master_key_${uid}`);
    if (!keyHex) {
      setError("No local encryption key found. Configure your key in the Privacy Vault first.");
      setSaving(false);
      return;
    }

    try {
      // 1. Package Plaintext Log Object
      const plaintextPayload = {
        energy,
        focus,
        hotFlashSeverity,
        jointPain,
        bloating,
        bleeding,
        sleepHours,
        wakeUpMetric,
        selectedMoods,
        selectedSymptoms,
        attachedFileName,
        attachedFileMime,
        attachedFileHex // Stored as raw encrypted Hex inside Firestore!
      };

      // 2. Encrypt Client-Side
      const encrypted = await encryptJSON(plaintextPayload, keyHex);

      // Determine Phase Context for unencrypted metadata index
      let phaseContext = "Follicular";
      if (profile.lastPeriodStart && profile.cycleLength && profile.periodLength) {
        const lastStart = new Date(profile.lastPeriodStart);
        const logDate = new Date(dateStr);
        const diffTime = Math.abs(logDate.getTime() - lastStart.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const day = (diffDays % profile.cycleLength) + 1;
        
        if (day <= profile.periodLength) phaseContext = "Menstrual";
        else if (day <= 13) phaseContext = "Follicular";
        else if (day <= 16) phaseContext = "Ovulatory";
        else phaseContext = "Luteal";
      } else if (profile.mode === "menopause") {
        phaseContext = "Menopause Support";
      } else {
        phaseContext = "General Tracking";
      }

      // 3. Save to Firestore
      const dailyLog: DailyLogData = {
        encryptedPayload: encrypted.ciphertext,
        metadata: {
          phaseContext,
          updatedTimestamp: new Date().toISOString()
        }
      };

      // Inject the IV into dailyLog.metadata so we can decrypt it later (IV is non-secret, so storing unencrypted is safe)
      (dailyLog as any).iv = encrypted.iv;

      await saveDailyLog(uid, dateStr, dailyLog);
      setMessage("Day log successfully encrypted & locked in vault.");
    } catch (err: any) {
      console.error(err);
      setError("Failed to encrypt and upload log data.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 p-5 space-y-6 bg-cream-50 scrollbar-none">
      
      {/* Header */}
      <div>
        <span className="text-[10px] tracking-widest uppercase font-semibold text-slate-700">
          {language === "hi" ? "तिजोरी सेवन" :
           language === "gu" ? "તિજોરી લોગ" :
           language === "fr" ? "Saisie Sécurisée" :
           language === "de" ? "Sicherer Einlass" :
           language === "es" ? "Entrada del Compartimento" :
           "Vault Intake"}
        </span>
        <h1 className="font-serif text-2xl font-bold text-slate-800">{t("logDaily")}</h1>
      </div>

      <div className="bg-white p-4.5 rounded-3xl border border-rose-100 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {language === "hi" ? "लॉगिंग तिथि चुनें" :
             language === "gu" ? "લોગીંગ તારીખ પસંદ કરો" :
             language === "fr" ? "Sélectionner la Date" :
             language === "de" ? "Datum auswählen" :
             language === "es" ? "Seleccionar Fecha" :
             "Select Logging Date"}
          </label>
          <input
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-cream-100/50 border border-cream-200 focus:border-rose-300 focus:outline-none text-sm transition-all"
            max={new Date().toISOString().split("T")[0]}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-2">
          <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
          <p className="text-xs text-slate-700">
            {language === "hi" ? "सुरक्षित लॉग खोला जा रहा है..." :
             language === "gu" ? "સુરક્ષિત લોગ ખોલી રહ્યાં છીએ..." :
             language === "fr" ? "Ouverture du journal sécurisé..." :
             language === "de" ? "Sicheres Protokoll wird geöffnet..." :
             language === "es" ? "Abriendo registro seguro..." :
             "Opening secure log..."}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-600 rounded-xl">
              {error}
            </div>
          )}

          {message && (
            <div className="p-3 bg-sage-50 border border-sage-200 text-xs text-sage-600 rounded-xl flex items-center gap-1.5 font-semibold">
              <Check className="w-4 h-4 text-sage-500" />
              {message}
            </div>
          )}

          {/* Slider 1: Energy */}
          <div className="bg-white p-5 rounded-3xl border border-cream-200/60 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {language === "hi" ? "शारीरिक ऊर्जा" :
                 language === "gu" ? "શારીરિક ઉર્જા" :
                 language === "fr" ? "Énergie Subjective" :
                 language === "de" ? "Subjektive Energie" :
                 language === "es" ? "Energía Subjetiva" :
                 "Subjective Energy"}
              </label>
              <span className="text-sm font-black text-rose-500 px-2.5 py-0.5 bg-rose-50 rounded-full border border-rose-100">{energy} / 5</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={energy}
              onChange={(e) => setEnergy(Number(e.target.value))}
              className="w-full accent-rose-400 bg-cream-200 rounded-lg appearance-none h-2 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-700 font-semibold">
              <span>
                {language === "hi" ? "गंभीर थकान" :
                 language === "gu" ? "ખૂબ થાક" :
                 language === "fr" ? "Fatigue Sévère" :
                 language === "de" ? "Müdigkeit" :
                 language === "es" ? "Fatiga Severa" :
                 "Severe Fatigue"}
              </span>
              <span>
                {language === "hi" ? "सामान्य" :
                 language === "gu" ? "સામાન્ય" :
                 language === "fr" ? "Modérée" :
                 language === "de" ? "Mittel" :
                 language === "es" ? "Moderado" :
                 "Moderate"}
              </span>
              <span>
                {language === "hi" ? "ऊर्जावान" :
                 language === "gu" ? "ઉર્જાવાન" :
                 language === "fr" ? "Vitalité Vibrante" :
                 language === "de" ? "Sehr Vital" :
                 language === "es" ? "Vibrante" :
                 "Vibrant Vitality"}
              </span>
            </div>
          </div>

          {/* Slider 2: Focus */}
          <div className="bg-white p-5 rounded-3xl border border-cream-200/60 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {language === "hi" ? "मानसिक ध्यान" :
                 language === "gu" ? "માનસિક ધ્યાન" :
                 language === "fr" ? "Concentration Cognitive" :
                 language === "de" ? "Kognitiver Fokus" :
                 language === "es" ? "Enfoque Cognitivo" :
                 "Cognitive Focus"}
              </label>
              <span className="text-sm font-black text-sage-600 px-2.5 py-0.5 bg-sage-50 rounded-full border border-sage-100">{focus} / 5</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={focus}
              onChange={(e) => setFocus(Number(e.target.value))}
              className="w-full accent-sage-500 bg-cream-200 rounded-lg appearance-none h-2 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-700 font-semibold">
              <span>
                {language === "hi" ? "मस्तिष्क कोहरा" :
                 language === "gu" ? "માનસિક અસ્પષ્ટતા" :
                 language === "fr" ? "Brouillard Mental" :
                 language === "de" ? "Konzentrationsschwäche" :
                 language === "es" ? "Neblina Mental" :
                 "Brain Fog / Dispersed"}
              </span>
              <span>
                {language === "hi" ? "सामान्य" :
                 language === "gu" ? "સામાન્ય" :
                 language === "fr" ? "Modérée" :
                 language === "de" ? "Mittel" :
                 language === "es" ? "Moderado" :
                 "Moderate"}
              </span>
              <span>
                {language === "hi" ? "एकाग्र" :
                 language === "gu" ? "એકાગ્ર" :
                 language === "fr" ? "Ultra Concentré" :
                 language === "de" ? "Sehr Fokussiert" :
                 language === "es" ? "Muy Enfocado" :
                 "Laser Centered"}
              </span>
            </div>
          </div>

          {/* Sleep Hours & Metric */}
          <div className="bg-white p-5 rounded-3xl border border-cream-200/60 shadow-sm space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">{t("sleepDuration")}</label>
            <div className="flex items-center justify-between border-b border-cream-100 pb-3">
              <span className="text-xs font-semibold text-slate-800">
                {language === "hi" ? "सोने के घंटे" :
                 language === "gu" ? "ઊંઘના કલાકો" :
                 language === "fr" ? "Heures de Sommeil" :
                 language === "de" ? "Schlafstunden" :
                 language === "es" ? "Horas de Sueño" :
                 "Hours Slept"}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSleepHours(Math.max(3, sleepHours - 0.5))}
                  className="w-8 h-8 rounded-full bg-cream-200 font-bold hover:bg-cream-300 text-slate-800 flex items-center justify-center cursor-pointer"
                >
                  -
                </button>
                <span className="text-sm font-bold text-slate-800 w-12 text-center">{sleepHours}h</span>
                <button
                  type="button"
                  onClick={() => setSleepHours(Math.min(14, sleepHours + 0.5))}
                  className="w-8 h-8 rounded-full bg-cream-200 font-bold hover:bg-cream-300 text-slate-800 flex items-center justify-center cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700">
                {language === "hi" ? "जागने का अनुभव" :
                 language === "gu" ? "જાગ્યા પછીનો અનુભવ" :
                 language === "fr" ? "Réveil" :
                 language === "de" ? "Gefühl beim Aufwachen" :
                 language === "es" ? "Sensación al Despertar" :
                 "Wake-up Feeling"}
              </span>
              <div className="flex gap-2">
                {["Rested", "Groggy", "Tired"].map((m) => {
                  const localizedMetric = m === "Rested" ? (language === "hi" ? "ताज़ा" : language === "gu" ? "તાજગી" : language === "fr" ? "Reposé" : language === "de" ? "Ausgeruht" : language === "es" ? "Descansado" : "Rested") :
                                          m === "Groggy" ? (language === "hi" ? "भारी" : language === "gu" ? "ઘેન" : language === "fr" ? "Fatigué" : language === "de" ? "Träge" : language === "es" ? "Somnoliento" : "Groggy") :
                                          (language === "hi" ? "थका हुआ" : language === "gu" ? "થાકેલું" : language === "fr" ? "Épuisé" : language === "de" ? "Müde" : language === "es" ? "Cansado" : "Tired");
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setWakeUpMetric(m)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                        wakeUpMetric === m
                          ? "bg-rose-50 border-rose-300 text-rose-500 font-bold"
                          : "bg-white border-cream-200/80 text-slate-700 hover:bg-cream-50"
                      }`}
                    >
                      {localizedMetric}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Menopause / Perimenopause vasomotor tracking */}
          {(profile.mode === "menopause" || selectedSymptoms.includes("Hot Flashes")) && (
            <div className="bg-white p-5 rounded-3xl border border-sage-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Hot Flash Severity
                </label>
                <span className="text-xs font-bold text-slate-700 bg-cream-100 px-2 py-0.5 rounded-full">
                  {hotFlashSeverity === 0 && "None"}
                  {hotFlashSeverity === 1 && "Mild"}
                  {hotFlashSeverity === 2 && "Moderate"}
                  {hotFlashSeverity === 3 && "Severe"}
                </span>
              </div>
              <div className="flex gap-2">
                {[
                  { level: 0, label: "None" },
                  { level: 1, label: "Mild" },
                  { level: 2, label: "Mod" },
                  { level: 3, label: "Sev" }
                ].map((item) => (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => setHotFlashSeverity(item.level)}
                    className={`flex-1 py-2.5 text-xs font-semibold rounded-xl border transition-all ${
                      hotFlashSeverity === item.level
                        ? "bg-orange-50 border-orange-300 text-orange-600 font-bold"
                        : "bg-white border-cream-200/80 text-slate-700 hover:bg-cream-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Joint discomfort / bloating sliders */}
          <div className="bg-white p-5 rounded-3xl border border-cream-200/60 shadow-sm space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {language === "hi" ? "जोड़ों की परेशानी" :
                   language === "gu" ? "સાંધાનો દુખાવો" :
                   language === "fr" ? "Disconfort Articulaire" :
                   language === "de" ? "Gelenkbeschwerden" :
                   language === "es" ? "Malestar Articular" :
                   "Joint Discomfort"}
                </label>
                <span className="text-xs font-bold text-slate-800 bg-cream-100 px-2 py-0.5 rounded-full">{jointPain} / 5</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                value={jointPain}
                onChange={(e) => setJointPain(Number(e.target.value))}
                className="w-full accent-slate-600 bg-cream-200 rounded-lg appearance-none h-2 cursor-pointer"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {language === "hi" ? "सूजन स्तर" :
                   language === "gu" ? "પેટ ફૂલવાનો સ્તર" :
                   language === "fr" ? "Niveau de Ballonnement" :
                   language === "de" ? "Blähungsgrad" :
                   language === "es" ? "Nivel de Hinchazón" :
                   "Bloating Level"}
                </label>
                <span className="text-xs font-bold text-slate-800 bg-cream-100 px-2 py-0.5 rounded-full">{bloating} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={bloating}
                onChange={(e) => setBloating(Number(e.target.value))}
                className="w-full accent-slate-600 bg-cream-200 rounded-lg appearance-none h-2 cursor-pointer"
              />
            </div>
          </div>

          {/* Bleeding intensity pill picker */}
          <div className="bg-white p-5 rounded-3xl border border-cream-200/60 shadow-sm space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              {language === "hi" ? "रक्तस्राव तीव्रता" :
               language === "gu" ? "રક્તસ્ત્રાવની તીવ્રતા" :
               language === "fr" ? "Intensité des Saignements" :
               language === "de" ? "Blutungsintensität" :
               language === "es" ? "Intensidad del Sangrado" :
               "Bleeding Intensity"}
            </label>
            <div className="flex gap-2">
              {["none", "light", "medium", "heavy"].map((b) => {
                const localizedBleed = b === "none" ? (language === "hi" ? "कोई नहीं" : language === "gu" ? "કોઈ નહીં" : language === "fr" ? "aucun" : language === "de" ? "keine" : language === "es" ? "ninguno" : "none") :
                                       b === "light" ? (language === "hi" ? "हल्का" : language === "gu" ? "હળવો" : language === "fr" ? "léger" : language === "de" ? "leicht" : language === "es" ? "leve" : "light") :
                                       b === "medium" ? (language === "hi" ? "मध्यम" : language === "gu" ? "મધ્યમ" : language === "fr" ? "moyen" : language === "de" ? "mittel" : language === "es" ? "moderado" : "medium") :
                                       (language === "hi" ? "भारी" : language === "gu" ? "ભારે" : language === "fr" ? "abondant" : language === "de" ? "stark" : language === "es" ? "abundante" : "heavy");
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBleeding(b)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-xl border capitalize transition-all cursor-pointer ${
                      bleeding === b
                        ? "bg-rose-50 border-rose-300 text-rose-500 font-bold"
                        : "bg-white border-cream-200/80 text-slate-700 hover:bg-cream-50"
                    }`}
                  >
                    {localizedBleed}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mood Matrix Tags */}
          <div className="bg-white p-5 rounded-3xl border border-cream-200/60 shadow-sm space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
              <Smile className="w-4 h-4 text-rose-400" />
              {language === "hi" ? "मनोदशा मैट्रिक्स" :
               language === "gu" ? "મનોદશા મેટ્રિક્સ" :
               language === "fr" ? "Matrice des Humeurs" :
               language === "de" ? "Stimmungsmatrix" :
               language === "es" ? "Matriz de Ánimo" :
               "Mood Matrix"}
            </label>
            <div className="flex flex-wrap gap-2">
              {moodsOptions.map((mood) => {
                const isSelected = selectedMoods.includes(mood);
                return (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => handleMoodToggle(mood)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-rose-100 border-rose-300 text-rose-600 font-bold"
                        : "bg-cream-100/50 border-cream-200/80 text-slate-700 hover:bg-cream-100"
                    }`}
                  >
                    {mood}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Physical Symptoms Tags */}
          <div className="bg-white p-5 rounded-3xl border border-cream-200/60 shadow-sm space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
              <Compass className="w-4 h-4 text-sage-500" />
              {language === "hi" ? "बायोमार्कर और शारीरिक लक्षण" :
               language === "gu" ? "બાયોમાર્કર્સ અને શારીરિક લક્ષણો" :
               language === "fr" ? "Biomarqueurs & Symptômes" :
               language === "de" ? "Biomarker & Symptome" :
               language === "es" ? "Biomarcadores y Síntomas" :
               "Biomarkers & Physical Symptoms"}
            </label>
            <div className="flex flex-wrap gap-2">
              {symptomsOptions.map((symptom) => {
                const isSelected = selectedSymptoms.includes(symptom);
                return (
                  <button
                    key={symptom}
                    type="button"
                    onClick={() => handleSymptomToggle(symptom)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-sage-100 border-sage-300 text-sage-600 font-bold"
                        : "bg-cream-100/50 border-cream-200/80 text-slate-700 hover:bg-cream-100"
                    }`}
                  >
                    {symptom}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Zero-Knowledge Binary Attachment Upload */}
          <div className="bg-white p-5 rounded-3xl border border-cream-200/60 shadow-sm space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-slate-700" />
              {language === "hi" ? "सुरक्षित एन्क्रिप्टेड अटैचमेंट" :
               language === "gu" ? "સુરક્ષિત એન્ક્રિપ્ટેડ જોડાણ" :
               language === "fr" ? "Pièce Jointe Sécurisée" :
               language === "de" ? "Sicherer Anhang" :
               language === "es" ? "Archivo Adjunto Seguro" :
               "Secure Encrypted Attachment"}
            </label>
            <p className="text-[10px] text-slate-700 leading-normal">
              {language === "hi" ? "लक्षण चित्र या परीक्षण रिपोर्ट संलग्न करें। फ़ाइल को एन्क्रिप्ट करके ही संग्रहीत किया जाता है।" :
               language === "gu" ? "લક્ષણોના ફોટા અથવા રિપોર્ટ જોડો. ફાઈલ એન્ક્રિપ્ટ કરીને જ સ્ટોર કરવામાં આવે છે." :
               language === "fr" ? "Joignez des photos ou rapports médicaux. Le fichier est chiffré côté client." :
               language === "de" ? "Hängen Sie Symptombilder oder Berichte an. Die Datei wird clientseitig verschlüsselt." :
               language === "es" ? "Adjunte fotos o informes médicos. El archivo se cifra en el dispositivo." :
               "Attach symptom images (e.g. rashes/swelling) or test reports. The file is read, converted to hex binary format, and encrypted client-side. The database server never sees the plaintext file."}
            </p>

            <div className="flex items-center gap-3">
              <input
                type="file"
                id="file-attachment"
                className="hidden"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
              />
              <label
                htmlFor="file-attachment"
                className="flex items-center gap-2 px-4 py-2.5 bg-cream-200 hover:bg-cream-300 text-slate-800 rounded-2xl font-semibold text-xs border border-cream-300/50 cursor-pointer transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-slate-600" />
                {language === "hi" ? "फ़ोटो या दस्तावेज़ चुनें" :
                 language === "gu" ? "ફોટો અથવા દસ્તાવેજ પસંદ કરો" :
                 language === "fr" ? "Choisir Fichier" :
                 language === "de" ? "Datei auswählen" :
                 language === "es" ? "Seleccionar Archivo" :
                 "Select Photo or Document"}
              </label>
              
              {attachmentLoading && (
                <Loader2 className="w-4 h-4 text-rose-400 animate-spin" />
              )}
              
              {attachedFileName && !attachmentLoading && (
                <div className="flex items-center gap-1 px-3 py-1 bg-sage-50 text-sage-600 rounded-full border border-sage-100 text-[10px] font-bold truncate max-w-[200px]">
                  <FileText className="w-3.5 h-3.5" />
                  <span className="truncate">{attachedFileName}</span>
                </div>
              )}
            </div>

            {imagePreviewUrl && (
              <div className="mt-2 border border-cream-200 rounded-2xl overflow-hidden max-w-[120px]">
                <img
                  src={imagePreviewUrl}
                  alt="Symptom preview"
                  className="w-full h-auto object-cover aspect-square"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-rose-400 hover:bg-rose-500 text-white rounded-2xl font-semibold text-sm transition-colors shadow-sm disabled:bg-rose-300 flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {language === "hi" ? "एन्क्रिप्ट और संग्रहीत किया जा रहा है..." :
                 language === "gu" ? "એન્ક્રિપ્ટ અને સ્ટોર કરી રહ્યાં છીએ..." :
                 "Encrypting & Storing..."}
              </>
            ) : (
              <>
                <Shield className="w-4.5 h-4.5" />
                {language === "hi" ? "लॉग एन्क्रिप्ट और लॉक करें" :
                 language === "gu" ? "લોગ એન્ક્રિપ્ટ અને લોક કરો" :
                 language === "fr" ? "Chiffrer le Journal" :
                 language === "de" ? "Protokoll verschlüsseln" :
                 language === "es" ? "Cifrar y Guardar Registro" :
                 "Encrypt & Lock Log"}
              </>
            )}
          </button>
        </form>
      )}

    </div>
  );
}
