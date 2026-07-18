"use client";

import React, { useState, useEffect } from "react";
import { subscribeAuth, signOut, signIn } from "@/lib/services";
import { deriveKeyFromPassword, bufToHex } from "@/lib/crypto";
import AdminPanel from "@/components/AdminPanel";
import { Loader2, ArrowLeft, ShieldAlert, LogOut, Lock, Check, Globe } from "lucide-react";
import Link from "next/link";

const ADMIN_TRANSLATIONS = {
  en: {
    secureLogin: "Secure Admin Login",
    enterCreds: "Enter your credentials to manage Aeva's directory.",
    username: "Username / Email",
    password: "Password",
    cancel: "Cancel",
    verify: "Verify & Enter",
    accessDenied: "Access Denied",
    noPrivs: "Your current account does not have administrator privileges.",
    logoutSwitch: "Log Out & Switch Account",
    backDashboard: "Back to Main Dashboard",
    appDashboard: "App Dashboard",
    unlocking: "Unlocking Admin Core...",
    verifying: "Verifying...",
    invalidCreds: "Invalid administrator credentials.",
    accessDeniedErr: "Access Denied: The account is not registered as an administrator."
  },
  hi: {
    secureLogin: "सुरक्षित व्यवस्थापक लॉगिन",
    enterCreds: "एवा की निर्देशिका को प्रबंधित करने के लिए अपने क्रेडेंशियल दर्ज करें।",
    username: "उपयोगकर्ता नाम / ईमेल",
    password: "पासवर्ड",
    cancel: "रद्द करें",
    verify: "सत्यापित करें और प्रवेश करें",
    accessDenied: "पहुंच अस्वीकृत",
    noPrivs: "आपके वर्तमान खाते में व्यवस्थापक विशेषाधिकार नहीं हैं।",
    logoutSwitch: "लॉग आउट करें और खाता बदलें",
    backDashboard: "मुख्य डैशबोर्ड पर वापस जाएं",
    appDashboard: "ऐप डैशबोर्ड",
    unlocking: "व्यवस्थापक कोर को अनलॉक किया जा रहा है...",
    verifying: "सत्यापित किया जा रहा है...",
    invalidCreds: "अमान्य व्यवस्थापक क्रेडेंशियल।",
    accessDeniedErr: "पहुंच अस्वीकृत: खाता व्यवस्थापक के रूप में पंजीकृत नहीं है।"
  },
  gu: {
    secureLogin: "સુરક્ષિત એડમિન લોગિન",
    enterCreds: "એવા ની ડિરેક્ટરી મેનેજ કરવા માટે તમારી ઓળખપત્રો દાખલ કરો.",
    username: "વપરાશકર્તા નામ / ઇમેઇલ",
    password: "પાસવર્ડ",
    cancel: "કેન્સલ કરો",
    verify: "ચકાસો અને પ્રવેશો",
    accessDenied: "પ્રવેશ નકારાયો",
    noPrivs: "તમારા વર્તમાન ખાતા પાસે એડમિનિસ્ટ્રેટર વિશેષાધિકારો નથી.",
    logoutSwitch: "લોગ આઉટ કરો અને ખાતું બદલો",
    backDashboard: "મુખ્ય ડેશબોર્ડ પર પાછા જાઓ",
    appDashboard: "એપ્લિકેશન ડેશબોર્ડ",
    unlocking: "એડમિન કોર અનલોક થઈ રહ્યું છે...",
    verifying: "ચકાસણી ચાલુ છે...",
    invalidCreds: "અમાન્ય એડમિનિસ્ટ્રેટર ઓળખપત્રો.",
    accessDeniedErr: "પ્રવેશ નકારાયો: આ ખાતું એડમિનિસ્ટ્રેટર તરીકે નોંધાયેલ નથી."
  },
  fr: {
    secureLogin: "Connexion Admin Sécurisée",
    enterCreds: "Entrez vos identifiants pour gérer l'annuaire d'Aeva.",
    username: "Identifiant / E-mail",
    password: "Mot de passe",
    cancel: "Annuler",
    verify: "Vérifier & Entrer",
    accessDenied: "Accès Refusé",
    noPrivs: "Votre compte actuel ne dispose pas de privilèges d'administrateur.",
    logoutSwitch: "Se déconnecter & Changer de compte",
    backDashboard: "Retour au Tableau de Bord Principal",
    appDashboard: "Tableau de Bord",
    unlocking: "Déverrouillage du Noyau Admin...",
    verifying: "Vérification...",
    invalidCreds: "Identifiants d'administrateur invalides.",
    accessDeniedErr: "Accès Refusé: Le compte n'est pas enregistré comme administrateur."
  },
  de: {
    secureLogin: "Sicherer Admin-Login",
    enterCreds: "Geben Sie Ihre Zugangsdaten ein, um Aevas Verzeichnis zu verwalten.",
    username: "Benutzername / E-Mail",
    password: "Kennwort",
    cancel: "Abbrechen",
    verify: "Bestätigen & Beitreten",
    accessDenied: "Zugriff verweigert",
    noPrivs: "Ihr aktuelles Konto verfügt nicht über Administratorrechte.",
    logoutSwitch: "Abmelden & Konto wechseln",
    backDashboard: "Zurück zum Haupt-Dashboard",
    appDashboard: "App-Dashboard",
    unlocking: "Admin-Kern wird freigeschaltet...",
    verifying: "Überprüfung...",
    invalidCreds: "Ungültige Administrator-Anmeldedaten.",
    accessDeniedErr: "Zugriff verweigert: Das Konto ist nicht als Administrator registriert."
  },
  es: {
    secureLogin: "Inicio de Sesión de Admin Seguro",
    enterCreds: "Ingrese sus credenciales para administrar el directorio de Aeva.",
    username: "Usuario / Correo Electrónico",
    password: "Contraseña",
    cancel: "Cancelar",
    verify: "Verificar e Ingresar",
    accessDenied: "Acceso Denegado",
    noPrivs: "Su cuenta actual no tiene privilegios de administrador.",
    logoutSwitch: "Cerrar Sesión y Cambiar Cuenta",
    backDashboard: "Volver al Panel Principal",
    appDashboard: "Panel de la Aplicación",
    unlocking: "Desbloqueando Núcleo de Admin...",
    verifying: "Verificando...",
    invalidCreds: "Credenciales de administrador no válidas.",
    accessDeniedErr: "Acceso Denegado: La cuenta no está registrada como administrador."
  }
};

type LangCode = "en" | "fr" | "de" | "es" | "hi" | "gu";

export default function AdminRoute() {
  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<LangCode>("en");

  // Simple login form states
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("aeva_language");
      if (stored && (stored === "en" || stored === "fr" || stored === "de" || stored === "es" || stored === "hi" || stored === "gu")) {
        setLanguage(stored as LangCode);
      }
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setAuthChecking((checking) => {
        if (checking) {
          console.warn("Admin Route Auth check timed out.");
          return false;
        }
        return checking;
      });
    }, 2500);

    const unsubscribe = subscribeAuth((currUser) => {
      clearTimeout(timeoutId);
      setUser(currUser);
      setAuthChecking(false);
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const handleLanguageChange = (lang: LangCode) => {
    setLanguage(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("aeva_language", lang);
    }
  };

  const adT = (key: keyof typeof ADMIN_TRANSLATIONS["en"]) => {
    return ADMIN_TRANSLATIONS[language]?.[key] || ADMIN_TRANSLATIONS["en"][key];
  };

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoading(true);

    try {
      const result = await signIn(adminEmail, adminPassword);
      
      // Verify if the logged in user is admin
      const isUserAdmin = !!(result.email && (result.email.toLowerCase().includes("admin") || result.email.toLowerCase() === "admin@aeva.com"));
      if (!isUserAdmin) {
        throw new Error(adT("accessDeniedErr"));
      }
      
      // Derive master encryption key for the admin vault session
      const salt = bufToHex(new TextEncoder().encode(result.email + "_aevasalt"));
      const derived = await deriveKeyFromPassword(adminPassword, salt);
      localStorage.setItem(`aeva_master_key_${result.uid}`, derived);
      
      setUser(result);
    } catch (err: any) {
      setLoginError(err.message || adT("invalidCreds"));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut();
      setUser(null);
      setAdminEmail("");
      setAdminPassword("");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream-50 p-5">
        <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
        <p className="text-xs text-slate-700 font-semibold uppercase tracking-wider mt-3">{adT("unlocking")}</p>
      </div>
    );
  }

  // If not logged in, show the simple credentials login card.
  const hasMasterKey = user ? (typeof window !== "undefined" && !!localStorage.getItem(`aeva_master_key_${user.uid}`)) : false;
  if (!user || !hasMasterKey) {
    return (
      <div className="min-h-screen flex flex-col justify-center bg-cream-50 py-10 px-4 animate-fade-in relative">
        
        {/* Floating language selector top right */}
        <div className="absolute top-5 right-5 flex items-center gap-1.5 bg-white border border-cream-200/60 px-3 py-1.5 rounded-2xl shadow-xs">
          <Globe className="w-3.5 h-3.5 text-rose-400" />
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as LangCode)}
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

        <div className="max-w-[420px] w-full mx-auto bg-white p-8 rounded-[36px] border border-rose-100 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-rose-50 text-rose-500 rounded-full">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-slate-800">{adT("secureLogin")}</h2>
            <p className="text-xs text-slate-700">{adT("enterCreds")}</p>
          </div>

          <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-700 tracking-wider block text-left">{adT("username")}</label>
              <input
                type="text"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="e.g. admin"
                className="w-full px-4 py-3 bg-cream-100/50 border border-cream-200 focus:border-rose-300 focus:outline-none rounded-2xl text-xs text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-700 tracking-wider block text-left">{adT("password")}</label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-cream-100/50 border border-cream-200 focus:border-rose-300 focus:outline-none rounded-2xl text-xs text-slate-800"
              />
            </div>

            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-150 text-xs text-rose-600 rounded-2xl text-center font-semibold animate-shake">
                {loginError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Link
                href="/"
                className="flex-1 py-3 bg-cream-200 hover:bg-cream-300 text-slate-800 text-xs font-bold rounded-2xl text-center transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{adT("cancel")}</span>
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-rose-400 hover:bg-rose-500 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer disabled:bg-rose-300 shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transform"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{adT("verify")}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const isAdminUser = !!(user.email && (user.email.toLowerCase().includes("admin") || user.email.toLowerCase() === "admin@aeva.com"));

  // If logged in, but NOT admin, show Access Denied
  if (!isAdminUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream-50 p-6 text-center">
        <div className="max-w-[380px] bg-white p-8 rounded-[32px] border border-rose-200 shadow-xl space-y-5">
          <div className="inline-flex p-4 bg-rose-50 text-rose-500 rounded-full animate-bounce">
            <ShieldAlert className="w-8 h-8" />
          </div>
          
          <h2 className="font-serif text-xl font-bold text-slate-800">{adT("accessDenied")}</h2>
          <p className="text-xs text-slate-700 leading-relaxed">
            {adT("noPrivs")} (<span className="font-mono font-bold text-slate-800">{user.email}</span>)
          </p>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{adT("logoutSwitch")}</span>
            </button>
            <Link
              href="/"
              className="w-full py-3 bg-cream-200 hover:bg-cream-300 text-slate-850 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{adT("backDashboard")}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If logged in AND admin, show the Admin Panel!
  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      {/* Top Admin Header Navigation */}
      <div className="bg-white/80 backdrop-blur-md border-b border-cream-200/50 py-3 px-5 flex items-center justify-between shadow-xs sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link 
            href="/"
            className="flex items-center gap-1 text-xs text-slate-700 hover:text-slate-800 font-semibold bg-cream-100 hover:bg-cream-200 border border-cream-200 px-3 py-1.5 rounded-full transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{adT("appDashboard")}</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-700 font-mono hidden sm:inline">{user.email}</span>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-full text-rose-500 transition-all cursor-pointer"
            title="Log Out Admin"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Renders the Admin Panel Component */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminPanel />
      </div>
    </div>
  );
}
