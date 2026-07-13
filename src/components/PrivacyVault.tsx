"use client";

import React, { useState, useEffect } from "react";
import { generateMasterKey, deriveKeyFromPassword, bufToHex } from "@/lib/crypto";
import { Shield, Key, Eye, EyeOff, Copy, Check, Download, Upload, AlertTriangle, RefreshCw, LogOut, Users, Sparkles } from "lucide-react";
import { signOut } from "@/lib/services";

interface PrivacyVaultProps {
  uid: string;
  userEmail: string;
  onLogout: () => void;
}

export default function PrivacyVault({ uid, userEmail, onLogout }: PrivacyVaultProps) {
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
    if (
      window.confirm(
        "WARNING: Regenerating your Master Key will create a new key. Your previous daily logs and medical assessments will become unreadable unless you have backed up your current key. Do you wish to continue?"
      )
    ) {
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
    if (window.confirm("Are you sure you want to lock the vault and sign out? Your encryption key will remain saved in this browser's secure cache.")) {
      await signOut();
      onLogout();
    }
  };

  const handleClearCache = () => {
    if (
      window.confirm(
        "DANGER: Wiping local cache will delete your master encryption key from this browser. You will lose access to all your clinical files forever unless you have backed up your key. Continue?"
      )
    ) {
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
          <span className="text-[10px] tracking-widest uppercase font-semibold text-slate-700">Security Core</span>
          <h1 className="font-serif text-2xl font-bold text-slate-800">Privacy Vault</h1>
        </div>
        <button
          onClick={handleSignOut}
          className="p-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-full text-rose-500 transition-colors"
          title="Lock & Log Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Active Privacy Status */}
      <div className="bg-white p-5 rounded-3xl border border-sage-100 shadow-sm flex items-start gap-4">
        <div className="p-3 bg-sage-50 rounded-2xl text-sage-600 shrink-0">
          <Shield className="w-6 h-6 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-sm text-slate-800">Zero-Knowledge Guard Active</h3>
          <p className="text-xs text-slate-700 leading-relaxed">
            Your reproductive logs, moods, symptoms, and attachment files are encrypted client-side using <strong>AES-GCM-256</strong>.
          </p>
          <div className="pt-1 flex items-center gap-1 text-[10px] font-bold text-sage-600">
            <span className="w-1.5 h-1.5 bg-sage-500 rounded-full"></span>
            <span>Firebase & Vercel see ciphertext only</span>
          </div>
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

      {/* Master Key display */}
      <div className="bg-white p-5 rounded-3xl border border-cream-200/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-cream-100 pb-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Key className="w-4 h-4 text-rose-400" />
            Master Encryption Key
          </h3>
          <span className="text-[10px] px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-500 rounded-full font-bold">256-bit AES</span>
        </div>

        <p className="text-[10px] text-slate-700 leading-normal">
          This is your private encryption key. Keep a copy in a safe password manager. If you log in from another device, you will need to import this key.
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
            className="p-1.5 text-slate-600 hover:text-slate-800 transition-colors flex items-center justify-center"
            title="Copy Key"
          >
            {copied ? <Check className="w-4 h-4 text-sage-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={handleRegenerateKey}
            className="flex-1 py-2.5 bg-cream-200 hover:bg-cream-300 text-slate-800 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 border border-cream-300/40"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Regenerate Key
          </button>
        </div>
      </div>

      {/* Key Management (Import / Derivation) */}
      <div className="bg-white p-5 rounded-3xl border border-cream-200/60 shadow-sm space-y-5">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-cream-100 pb-2">
          Vault Recovery & Setup
        </h3>

        {/* 1. Import Key */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">Import Hex Master Key</label>
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
              className="px-4 py-2.5 bg-sage-500 hover:bg-sage-600 text-white rounded-xl font-semibold text-xs transition-colors flex items-center gap-1 shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              Import
            </button>
          </div>
        </div>

        {/* 2. Derive Key from Passphrase */}
        <div className="space-y-2 border-t border-cream-100 pt-4">
          <label className="block text-xs font-semibold text-slate-700">Lock with Memorable Passphrase</label>
          <p className="text-[10px] text-slate-700 leading-normal">
            If you do not want to store a raw hex key, enter a memorable passphrase. We will derive your AES key using PBKDF2.
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
              className="px-4 py-2.5 bg-rose-400 hover:bg-rose-500 text-white rounded-xl font-semibold text-xs transition-colors flex items-center gap-1 shadow-sm"
            >
              <Key className="w-3.5 h-3.5" />
              Lock Key
            </button>
          </div>
        </div>
      </div>

      {/* Partner / BFF Sync Loop */}
      <div className="bg-white p-5 rounded-3xl border border-cream-200/60 shadow-sm space-y-4">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-cream-100 pb-2 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-rose-400" />
          Partner & BFF Biology Sync
        </h3>
        <p className="text-[10px] text-slate-700 leading-normal">
          Generate a secure, view-only, local-decrypted sync link for your partner or best friend. This sends automated, gentle biological insights so they can support you when your energy levels drop.
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
            className="w-full py-3 bg-rose-400 hover:bg-rose-500 text-white rounded-2xl font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-2 focus:outline-none"
          >
            <Sparkles className="w-4 h-4" />
            Generate Partner Sync Link
          </button>
        )}
      </div>

      {/* Dangerous Operations Wiping */}
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
          className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-semibold text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
        >
          <AlertTriangle className="w-4 h-4" />
          Wipe Local Vault & Log Out
        </button>
      </div>

    </div>
  );
}
