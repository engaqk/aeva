"use client";

import React, { useState, useEffect } from "react";
import { generateMasterKey, deriveKeyFromPassword, bufToHex } from "@/lib/crypto";
import { Shield, Key, Eye, EyeOff, Copy, Check, Upload, AlertTriangle, RefreshCw, LogOut, Users, Sparkles, X, Flower } from "lucide-react";
import { signOut, saveProfile, UserProfile } from "@/lib/services";
import { TRANSLATIONS, LanguageCode } from "@/lib/translations";

interface PrivacyVaultProps {
  uid: string;
  userEmail: string;
  profile: UserProfile | null;
  onProfileUpdate: (newProfile: UserProfile) => void;
  onLogout: () => void;
  language?: any;
}

export default function PrivacyVault({ uid, userEmail, profile, onProfileUpdate, onLogout, language = "en" }: PrivacyVaultProps) {
  const t = (key: string) => {
    return TRANSLATIONS[language as LanguageCode]?.[key] || TRANSLATIONS["en"]?.[key] || key;
  };

  const isAdmin = !!(userEmail && (userEmail.toLowerCase().includes("admin") || userEmail.toLowerCase() === "admin@aeva.com"));
  const [keyHex, setKeyHex] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [passphrase, setPassphrase] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [partnerLinkGenerated, setPartnerLinkGenerated] = useState(false);
  const [partnerLinkCopied, setPartnerLinkCopied] = useState(false);
  const [partnerLinkUrl, setPartnerLinkUrl] = useState("");

  // Advanced section accordion state
  const [showAdvanced, setShowAdvanced] = useState(false);

  const generatePartnerLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://aeva.com";
    setPartnerLinkUrl(`${origin}/sync/partner?vault=${uid.substring(0, 12)}`);
    setPartnerLinkGenerated(true);
  };

  const handleCopyPartnerLink = () => {
    navigator.clipboard.writeText(partnerLinkUrl);
    setPartnerLinkCopied(true);
    setTimeout(() => setPartnerLinkCopied(false), 2000);
  };

  useEffect(() => {
    const key = localStorage.getItem(`aeva_master_key_${uid}`);
    if (key) {
      setKeyHex(key);
    }
  }, [uid]);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(keyHex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateKey = async () => {
    const warningMsg = language === "hi" ? "चेतावनी: आपकी मास्टर कुंजी पुनर्जीवित करने से पिछली सभी दैनिक रिपोर्ट अपठनीय हो जाएगी। क्या आप जारी रखना चाहते हैं?" :
                       language === "gu" ? "ચેતવણી: માસ્ટર કી ફરીથી બનાવવાથી તમારા જૂના તમામ લોગ વાંચી શકાશે નહીં. શું તમે ચાલુ રાખવા માંગો છો?" :
                       "WARNING: Regenerating your Master Key will create a new key. Your previous daily logs will become unreadable unless you have backed up your current key. Do you wish to continue?";

    if (window.confirm(warningMsg)) {
      setError("");
      setMessage("");
      try {
        const newKey = await generateMasterKey();
        localStorage.setItem(`aeva_master_key_${uid}`, newKey);
        setKeyHex(newKey);
        setMessage("New Master Key generated. Make sure to back it up!");
      } catch (err) {
        setError("Failed to generate new key.");
      }
    }
  };

  const handleImportKey = () => {
    setError("");
    setMessage("");
    if (!keyInput) {
      setError("Please paste a valid hex key.");
      return;
    }
    if (keyInput.length !== 64) {
      setError("Invalid key length. Key must be exactly 64 hex characters (256-bit).");
      return;
    }
    
    localStorage.setItem(`aeva_master_key_${uid}`, keyInput);
    setKeyHex(keyInput);
    setKeyInput("");
    setMessage("Master Key successfully imported. Your vaults are unlocked.");
  };

  const handleDerivePassphrase = async () => {
    setError("");
    setMessage("");
    if (passphrase.length < 8) {
      setError("Passphrase must be at least 8 characters.");
      return;
    }

    try {
      const salt = bufToHex(new TextEncoder().encode(userEmail + "_aevasalt"));
      const derivedKey = await deriveKeyFromPassword(passphrase, salt);
      localStorage.setItem(`aeva_master_key_${uid}`, derivedKey);
      setKeyHex(derivedKey);
      setPassphrase("");
      setMessage("Master Key derived from passphrase and locked in browser.");
    } catch (err) {
      setError("Failed to derive key from passphrase.");
    }
  };

  const handleSignOut = async () => {
    const confirmMsg = language === "hi" ? "क्या आप वाकई साइन आउट करना चाहते हैं? आपकी एन्क्रिप्शन कुंजी सुरक्षित कैश में सुरक्षित रहेगी।" :
                       language === "gu" ? "શું તમે ખરેખર સાઇન આઉટ કરવા માંગો છો? તમારી કી આ બ્રાઉઝરમાં સુરક્ષિત રહેશે." :
                       "Are you sure you want to lock the vault and sign out? Your encryption key will remain saved in this browser's secure cache.";

    if (window.confirm(confirmMsg)) {
      await signOut();
      onLogout();
    }
  };

  const handleClearCache = () => {
    const dangerMsg = language === "hi" ? "खतरा: स्थानीय कैश साफ़ करने से आपकी मास्टर कुंजी नष्ट हो जाएगी। क्या आप जारी रखना चाहते हैं?" :
                      language === "gu" ? "જોખમ: કેશ સાફ કરવાથી તમારી માસ્ટર એન્ક્રિપ્શન કી કાયમ માટે ડિલીટ થઈ જશે. શું તમે ચાલુ રાખવા માંગો છો?" :
                      "DANGER: Wiping local cache will delete your master encryption key from this browser. You will lose access to all your clinical files forever unless you have backed up your key. Continue?";

    if (window.confirm(dangerMsg)) {
      localStorage.removeItem(`aeva_master_key_${uid}`);
      localStorage.removeItem("aeva_user");
      signOut().then(() => {
        onLogout();
      });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 p-5 space-y-6 bg-cream-50 scrollbar-none">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] tracking-widest uppercase font-semibold text-slate-700">
            {language === "hi" ? "सुरक्षा कोर" :
             language === "gu" ? "સુરક્ષા કોર" :
             language === "fr" ? "Noyau de Sécurité" :
             language === "de" ? "Sicherheitskern" :
             language === "es" ? "Núcleo de Seguridad" :
             "Security Core"}
          </span>
          <h1 className="font-serif text-2xl font-bold text-slate-800">{t("privacy")}</h1>
        </div>
        <button
          onClick={isAdmin ? handleClearCache : handleSignOut}
          className="p-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-full text-rose-500 transition-colors cursor-pointer"
          title={isAdmin ? "Wipe Vault & Log Out" : "Lock & Log Out"}
        >
          {isAdmin ? <AlertTriangle className="w-4 h-4 animate-bounce" /> : <LogOut className="w-4 h-4" />}
        </button>
      </div>

      {/* User Profile Demographics & Avatar Upload */}
      {profile?.demographics && (
        <div className="bg-white p-5 rounded-3xl border border-cream-200/60 shadow-sm space-y-4 animate-fade-in text-left">
          <div className="flex items-center gap-2 border-b border-cream-200 pb-2">
            <Users className="w-5 h-5 text-rose-400" />
            <h3 className="font-serif text-sm font-bold text-slate-800">
              {language === "hi" ? "उपयोगकर्ता प्रोफ़ाइल विवरण" :
               language === "gu" ? "વપરાશકર્તા પ્રોફાઇલ વિગતો" :
               "User Profile Demographics"}
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-cream-50/30 p-4 rounded-2xl border border-cream-100/60">
            {/* Avatar & Photo Picker */}
            <div className="flex flex-col items-center space-y-2 shrink-0">
              {profile.demographics.photoHex ? (
                <img 
                  src={profile.demographics.photoHex} 
                  alt="User Avatar" 
                  className="w-16 h-16 rounded-full object-cover border-2 border-rose-350 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-400 border-2 border-rose-100 flex items-center justify-center shrink-0">
                  <Flower className="w-9 h-9" />
                </div>
              )}
              
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-rose-500 hover:text-rose-600 cursor-pointer transition-colors bg-white px-2.5 py-1 rounded-full border border-rose-100 shadow-xs">
                {language === "hi" ? "फ़ोटो बदलें" :
                 language === "gu" ? "ફોટો બદલો" :
                 "Change Photo"}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 2 * 1024 * 1024) {
                        alert("Photo size must be under 2MB");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = async () => {
                        const hex = reader.result as string;
                        if (!profile || !profile.demographics) return;
                        const updatedDemo = {
                          name: profile.demographics.name || "",
                          city: profile.demographics.city || "",
                          country: profile.demographics.country || "",
                          mobile: profile.demographics.mobile || "",
                          gender: profile.demographics.gender || "",
                          dob: profile.demographics.dob || "",
                          photoHex: hex
                        };
                        const updatedProf: UserProfile = {
                          ...profile,
                          demographics: updatedDemo,
                          photoHex: hex
                        };
                        
                        try {
                          await saveProfile(uid, updatedProf, userEmail);
                          localStorage.setItem(`aeva_profile_${uid}`, JSON.stringify(updatedProf));
                          localStorage.setItem(`aeva_demographics_${uid}`, JSON.stringify(updatedDemo));
                          onProfileUpdate(updatedProf);
                        } catch (err) {
                          console.error("Failed to update profile pic:", err);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }} 
                  className="hidden" 
                />
              </label>
            </div>

            {/* Profile Fields Summary */}
            <div className="flex-1 space-y-2.5 w-full text-center sm:text-left">
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 leading-none">{profile.demographics.name}</h4>
                <span className="text-[10px] text-slate-700 block font-mono mt-1">{userEmail}</span>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] text-slate-700 font-semibold border-t border-cream-100 pt-2 text-left">
                <div>
                  <span className="text-[8px] text-slate-700 uppercase block leading-none">Gender</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{profile.demographics.gender}</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-700 uppercase block leading-none">Date of Birth</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{profile.demographics.dob}</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-700 uppercase block leading-none">Location</span>
                  <span className="font-bold text-slate-800 mt-0.5 block truncate">{profile.demographics.city}, {profile.demographics.country}</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-700 uppercase block leading-none">Mobile</span>
                  <span className="font-bold text-slate-800 mt-0.5 block truncate">{profile.demographics.mobile}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Privacy Status */}
      <div className="bg-white p-5 rounded-3xl border border-sage-100 shadow-sm flex items-start gap-4">
        <div className="p-3 bg-sage-50 rounded-2xl text-sage-600 shrink-0">
          <Shield className="w-6 h-6 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-sm text-slate-800">
            {language === "hi" ? "शून्य-ज्ञान सुरक्षा सक्रिय" :
             language === "gu" ? "ઝીરો-નોલેજ ગાર્ડ સક્રિય" :
             language === "fr" ? "Protection Zero-Knowledge Active" :
             language === "de" ? "Zero-Knowledge Schutz aktiv" :
             language === "es" ? "Protección Zero-Knowledge Activa" :
             "Zero-Knowledge Guard Active"}
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed">
            {language === "hi" ? "आपकी दैनिक रिपोर्ट और मेडिकल डेटा स्थानीय रूप से AES-GCM-256 का उपयोग करके एन्क्रिप्ट किया गया है।" :
             language === "gu" ? "તમારા દૈનિક લોગ અને મેડિકલ ડેટા સ્થાનિક રીતે AES-GCM-256 નો ઉપયોગ કરીને સુરક્ષિત છે." :
             language === "fr" ? "Vos journaux et données sont cryptés localement à l'aide de AES-GCM-256." :
             language === "de" ? "Ihre Wellness-Daten werden lokal mittels AES-GCM-256 verschlüsselt gespeichert." :
             language === "es" ? "Sus registros de bienestar se encriptan localmente usando AES-GCM-256." :
             "Your reproductive logs, moods, symptoms, and attachment files are encrypted client-side using AES-GCM-256."}
          </p>
          <div className="pt-1 flex items-center gap-1 text-[10px] font-bold text-sage-600">
            <span className="w-1.5 h-1.5 bg-sage-500 rounded-full"></span>
            <span>{language === "hi" ? "फायरबेस केवल एन्क्रिप्टेड डेटा देखता है" :
                   language === "gu" ? "ફાયરબેઝ ફક્ત એન્ક્રિપ્ટેડ લખાણ જ જોઈ શકે છે" :
                   language === "fr" ? "Firebase ne voit que le texte chiffré" :
                   language === "de" ? "Firebase sieht nur verschlüsselte Texte" :
                   language === "es" ? "Firebase solo ve texto cifrado" :
                   "Firebase & Vercel see ciphertext only"}</span>
          </div>
        </div>
      </div>

      {/* Active User Session Details */}
      <div className="bg-white p-5 rounded-3xl border border-cream-200/60 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-cream-100 pb-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
            {language === "hi" ? "सक्रिय सत्र" :
             language === "gu" ? "સક્રિય સત્ર" :
             language === "fr" ? "Session Active" :
             language === "de" ? "Aktive Sitzung" :
             language === "es" ? "Sesión Activa" :
             "Active Sync Session"}
          </h3>
          <span className="text-[10px] px-2.5 py-0.5 bg-rose-50 border border-rose-100 text-rose-500 rounded-full font-bold">Gmail Connected</span>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-700 tracking-wider block">
              {language === "hi" ? "लॉग इन ईमेल:" :
               language === "gu" ? "લોગ ઇન ઇમેઇલ:" :
               language === "fr" ? "Connecté en tant que :" :
               language === "de" ? "Eingeloggt als:" :
               language === "es" ? "Sesión iniciada como:" :
               "Logged In As:"}
            </span>
            <span className="text-xs font-semibold text-slate-800 font-mono">{userEmail || "local_user_default@gmail.com"}</span>
          </div>
          {isAdmin ? (
            <button
              onClick={handleClearCache}
              className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer active:scale-95 animate-pulse"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Wipe Vault & Log Out</span>
            </button>
          ) : (
            <button
              onClick={handleSignOut}
              className="px-4 py-2.5 bg-rose-400 hover:bg-rose-500 text-white rounded-2xl font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t("disconnectLink")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Messaging */}
      {message && (
        <div className="p-3 bg-sage-50 border border-sage-200 text-xs text-sage-600 rounded-2xl flex items-center gap-1.5 font-semibold">
          <Check className="w-4 h-4 text-sage-500" />
          {message}
        </div>
      )}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-600 rounded-2xl">
          {error}
        </div>
      )}

      {/* Partner / BFF Sync Loop */}
      <div className="bg-white p-5 rounded-3xl border border-cream-200/60 shadow-sm space-y-4">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-cream-100 pb-2 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-rose-400" />
          {language === "hi" ? "पार्टनर और मित्र जीवविज्ञान सिंक" :
           language === "gu" ? "ભાગીદાર અને મિત્ર બાયોલોજી સિંક" :
           language === "fr" ? "Sync Biologique Partenaire" :
           language === "de" ? "Partner & BFF Biologie-Sync" :
           language === "es" ? "Sincro de Pareja y Amigos" :
           "Partner & BFF Biology Sync"}
        </h3>
        <p className="text-[10px] text-slate-700 leading-normal">
          {language === "hi" ? "अपने साथी के लिए एक सुरक्षित, स्थानीय-डिक्रिप्टेड सिंक लिंक उत्पन्न करें ताकि वे आपके ऊर्जा स्तर गिरने पर आपका समर्थन कर सकें।" :
           language === "gu" ? "તમારા જીવનસાથી માટે એક સુરક્ષિત સિંક લિંક બનાવો જેથી જ્યારે તમારી શારીરિક ઉર્જા ઓછી થાય ત્યારે તેઓ તમને સપોર્ટ કરી શકે." :
           language === "fr" ? "Générez un lien de synchronisation décrypté localement pour votre partenaire afin qu'il puisse vous soutenir lorsque votre énergie baisse." :
           language === "de" ? "Erstellen Sie einen sicheren, lokal entschlüsselten Sync-Link für Ihren Partner, damit dieser Sie bei Bedarf unterstützen kann." :
           language === "es" ? "Genere un enlace de sincronización seguro y descifrado localmente para su pareja para que pueda apoyarla cuando sus niveles de energía bajen." :
           "Generate a secure, view-only, local-decrypted sync link for your partner or best friend. This sends automated, gentle biological insights so they can support you when your energy levels drop."}
        </p>

        {partnerLinkGenerated ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-cream-100/50 border border-cream-200 p-3 rounded-2xl">
              <input
                type="text"
                readOnly
                value={partnerLinkUrl}
                className="flex-1 bg-transparent border-none text-xs font-mono focus:outline-none text-slate-800 select-all"
              />
              <button
                onClick={handleCopyPartnerLink}
                className="p-1.5 text-slate-600 hover:text-slate-800 transition-colors flex items-center justify-center focus:outline-none"
              >
                {partnerLinkCopied ? <Check className="w-4 h-4 text-sage-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            
            {/* Visual SMS Mockup to demonstrate virality/experience */}
            <div className="bg-sage-50/50 p-3.5 rounded-2xl border border-sage-100/50 space-y-2">
              <span className="text-[9px] text-sage-700 font-bold uppercase tracking-wider block">Preview SMS Hint Sent to Partner:</span>
              <p className="text-xs text-slate-700 italic bg-white p-2.5 rounded-xl border border-sage-100/30 shadow-sm leading-normal">
                "Aeva is entering her Luteal Phase today. Autonomic stability indexes indicate energy levels might be lower over the next 4 days. Great time to take over dinner prep, bring home dark chocolate, or run standard warm tea protocols!"
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={generatePartnerLink}
            className="w-full py-3 bg-rose-400 hover:bg-rose-500 text-white rounded-2xl font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-2 focus:outline-none cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            {language === "hi" ? "पार्टनर सिंक लिंक जनरेट करें" :
             language === "gu" ? "ભાગીદાર સિંક લિંક બનાવો" :
             language === "fr" ? "Générer le Lien de Partenaire" :
             language === "de" ? "Partner-Sync-Link generieren" :
             language === "es" ? "Generar Enlace de Pareja" :
             "Generate Partner Sync Link"}
          </button>
        )}
      </div>

      {/* Collapsed Advanced settings block */}
      <div className="space-y-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full py-3.5 px-4 bg-white hover:bg-cream-100/50 border border-cream-200/60 rounded-2xl font-bold text-xs text-slate-800 transition-all flex items-center justify-between shadow-xs focus:outline-none cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Key className="w-4 h-4 text-rose-400" />
            {language === "hi" ? "उन्नत सुरक्षा और रिकवरी" :
             language === "gu" ? "અદ્યતન સુરક્ષા અને પુનઃપ્રાપ્તિ" :
             language === "fr" ? "Options de Sécurité Avancées" :
             language === "de" ? "Erweiterte Sicherheit & Wiederherstellung" :
             language === "es" ? "Seguridad Avanzada y Recuperación" :
             "Advanced Security & Key Recovery"}
          </span>
          <span className="text-[10px] text-rose-500 font-semibold">{showAdvanced ? "▲" : "▼"}</span>
        </button>

        {showAdvanced && (
          <div className="space-y-4 animate-scale-up text-left">
            {/* Master Key display */}
            <div className="bg-white p-5 rounded-3xl border border-cream-200/60 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-cream-100 pb-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-rose-400" />
                  {language === "hi" ? "मास्टर एन्क्रिप्शन कुंजी" :
                   language === "gu" ? "માસ્ટર એન્ક્રિપ્શન કી" :
                   language === "fr" ? "Clé de Chiffrement Maître" :
                   language === "de" ? "Master-Verschlüsselungsschlüssel" :
                   language === "es" ? "Clave de Cifrado Maestra" :
                   "Master Encryption Key"}
                </h3>
                <span className="text-[10px] px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-500 rounded-full font-bold">256-bit AES</span>
              </div>

              <p className="text-[10px] text-slate-700 leading-normal">
                {language === "hi" ? "यह आपकी निजी एन्क्रिप्शन कुंजी है। इसे सुरक्षित रखें। यदि आप दूसरे डिवाइस से लॉग इन करते हैं, तो आपको इस कुंजी की आवश्यकता होगी।" :
                 language === "gu" ? "આ તમારી ખાનગી એન્ક્રિપ્શન કી છે. તેને સુરક્ષિત રાખો. જો તમે અન્ય ઉપકરણથી લોગ ઇન કરશો, તો તમારે આ કીની જરૂર પડશે." :
                 language === "fr" ? "Ceci est votre clé de chiffrement privée. Gardez-en une copie dans un gestionnaire de mots de passe sûr." :
                 language === "de" ? "Dies ist Ihr privater Verschlüsselungsschlüssel. Bewahren Sie eine Kopie in einem sicheren Passwort-Manager auf." :
                 language === "es" ? "Esta es su clave de cifrado privada. Guarde una copia en un administrador de contraseñas seguro." :
                 "This is your private encryption key. Keep a copy in a safe password manager. If you log in from another device, you will need to import this key."}
              </p>

              <div className="flex items-center gap-2 bg-cream-100/50 border border-cream-200 p-3 rounded-2xl">
                <input
                  type={showKey ? "text" : "password"}
                  readOnly
                  value={keyHex}
                  className="flex-1 bg-transparent border-none text-xs font-mono focus:outline-none text-slate-800 select-all"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleCopyKey}
                  className="p-1.5 text-slate-600 hover:text-slate-800 transition-colors flex items-center justify-center cursor-pointer"
                  title="Copy Key"
                >
                  {copied ? <Check className="w-4 h-4 text-sage-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={handleRegenerateKey}
                  className="flex-1 py-2.5 bg-cream-200 hover:bg-cream-300 text-slate-800 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 border border-cream-300/40 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {language === "hi" ? "कुंजी पुनर्जीवित करें" :
                   language === "gu" ? "કી ફરીથી બનાવો" :
                   language === "fr" ? "Régénérer la Clé" :
                   language === "de" ? "Schlüssel regenerieren" :
                   language === "es" ? "Regenerar Clave" :
                   "Regenerate Key"}
                </button>
              </div>
            </div>

            {/* Key Management (Import / Derivation) */}
            <div className="bg-white p-5 rounded-3xl border border-cream-200/60 shadow-sm space-y-5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-cream-100 pb-2">
                {language === "hi" ? "तिजोरी पुनर्प्राप्ति और सेटअप" :
                 language === "gu" ? "તિજોરી પુનઃપ્રાપ્તિ અને સેટઅપ" :
                 language === "fr" ? "Récupération & Configuration" :
                 language === "de" ? "Wiederherstellung & Setup" :
                 language === "es" ? "Recuperación y Configuración" :
                 "Vault Recovery & Setup"}
              </h3>

              {/* 1. Import Key */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  {language === "hi" ? "हेक्स मास्टर कुंजी आयात करें" :
                   language === "gu" ? "હેક્સ માસ્ટર કી આયાત કરો" :
                   language === "fr" ? "Importer Clé Maître" :
                   language === "de" ? "Master-Schlüssel importieren" :
                   language === "es" ? "Importar Clave Maestra" :
                   "Import Hex Master Key"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value.trim())}
                    placeholder="Paste 64-char Hex Key"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-cream-100/50 border border-cream-200 focus:border-rose-300 focus:outline-none text-xs font-mono"
                  />
                  <button
                    onClick={handleImportKey}
                    className="px-4 py-2.5 bg-sage-500 hover:bg-sage-600 text-white rounded-xl font-semibold text-xs transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {language === "hi" ? "आयात" :
                     language === "gu" ? "આયાત" :
                     language === "fr" ? "Importer" :
                     language === "de" ? "Importieren" :
                     language === "es" ? "Importar" :
                     "Import"}
                  </button>
                </div>
              </div>

              {/* 2. Derive Key from Passphrase */}
              <div className="space-y-2 border-t border-cream-100 pt-4">
                <label className="block text-xs font-semibold text-slate-700">
                  {language === "hi" ? "यादगार पासफ़्रेज़ के साथ लॉक करें" :
                   language === "gu" ? "યાદગાર પાસફ્રેઝ સાથે લોક કરો" :
                   language === "fr" ? "Verrouiller avec une Phrase Secrète" :
                   language === "de" ? "Mit Passphrase sperren" :
                   language === "es" ? "Bloquear con Frase de Seguridad" :
                   "Lock with Memorable Passphrase"}
                </label>
                <p className="text-[10px] text-slate-700 leading-normal">
                  {language === "hi" ? "यदि आप एक कच्ची हेक्स कुंजी को स्टोर नहीं करना चाहते हैं, तो एक यादगार पासफ़्रेज़ दर्ज करें। हम PBKDF2 का उपयोग करके आपकी AES कुंजी प्राप्त करेंगे।" :
                   language === "gu" ? "જો તમે કાચી હેક્સ કી સ્ટોર કરવા માંગતા નથી, તો યાદગાર પાસફ્રેઝ દાખલ કરો. અમે PBKDF2 નો ઉપયોગ કરીને તમારી AES કી મેળવીશું." :
                   language === "fr" ? "Si vous ne voulez pas stocker une clé brute, entrez une phrase secrète mémorable. Nous dériverons votre clé via PBKDF2." :
                   language === "de" ? "Wenn Sie keinen rohen Hex-Schlüssel speichern möchten, geben Sie eine Passphrase ein. Wir leiten Ihren AES-Schlüssel mittels PBKDF2 ab." :
                   language === "es" ? "Si no desea almacenar una clave de cifrado directa, ingrese una frase memorable. Derivaremos su clave usando PBKDF2." :
                   "If you do not want to store a raw hex key, enter a memorable passphrase. We will derive your AES key using PBKDF2."}
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-cream-100/50 border border-cream-200 focus:border-rose-300 focus:outline-none text-xs"
                  />
                  <button
                    onClick={handleDerivePassphrase}
                    className="px-4 py-2.5 bg-rose-400 hover:bg-rose-500 text-white rounded-xl font-semibold text-xs transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5" />
                    {language === "hi" ? "लॉक करें" :
                     language === "gu" ? "લોક કરો" :
                     language === "fr" ? "Verrouiller" :
                     language === "de" ? "Sperren" :
                     language === "es" ? "Bloquear Clave" :
                     "Lock Key"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dangerous Operations Wiping */}
      {isAdmin && (
        <div className="bg-rose-50/50 p-5 rounded-3xl border border-rose-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 animate-bounce" />
            Danger Zone
          </div>
          
          <p className="text-[10px] text-rose-700 leading-normal">
            Wiping the cache will delete your master key and credentials from this browser. Verify you have written down or copied your Master Key before proceeding!
          </p>

          <button
            onClick={handleClearCache}
            className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-semibold text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            Wipe Local Vault & Log Out
          </button>
        </div>
      )}

    </div>
  );
}
