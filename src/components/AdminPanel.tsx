"use client";

import React, { useState, useEffect } from "react";
import { getAllUsers, AdminUserRecord, getRecentDailyLogs, saveProfile, saveDailyLog } from "@/lib/services";
import { 
  Users, Clipboard, BarChart3, Search, UserCheck, Activity, Calendar, 
  ShieldAlert, Sparkles, Check, Database, RefreshCw, Mail, Send, Eye, BookOpen, AlertTriangle, X, Flower 
} from "lucide-react";

const NOTIFICATION_TEMPLATES = [
  {
    id: "luteal",
    name: "Luteal Phase Alert 🍂",
    subject: "Aeva Bio-Sync Alert: Entering Luteal Phase (Magnesium & Focus Adjustments)",
    energy: "Moderate",
    left: "9 Days",
    index: "Day 19",
    activity: "Progesterone rises, increasing joint laxity. Swap high-impact cardiac jumps or heavy compound squats for steady-state pilates or yoga stability exercises.",
    nutrition: "Sugar sensitivity drops as basal metabolism rises. Consume magnesium-rich pumpkin seeds, almonds, and leafy greens to stabilize blood glucose.",
    focus: "Your brain hemisphere communication enters a highly structured editing state. Great time to focus on code debugging, document indexing, and admin tasks."
  },
  {
    id: "follicular",
    name: "Follicular Phase Alert 🌸",
    subject: "Aeva Bio-Sync Alert: Entering Follicular Phase (Peak Training & High-Carb Sync)",
    energy: "Very High",
    left: "11 Days",
    index: "Day 6",
    activity: "Estrogen is peaking, boosting muscle glycogen capture. Excellent phase for heavy strength training, high-intensity intervals (HIIT), and max attempts.",
    nutrition: "Insulin sensitivity is high. Fuel your workouts with clean complex carbohydrates (oatmeal, sweet potatoes) and lean proteins.",
    focus: "High dopamine and serotonin favor creativity, networking, pitching ideas, and brainstorming sessions. Schedule your public speaking or team syncs now."
  },
  {
    id: "menopause",
    name: "Menopause Hot Flash Support 🌬️",
    subject: "Aeva Support: Vasomotor Warning & Deep Breathing Guidelines",
    energy: "Fluctuating",
    left: "Daily Check",
    index: "Menopause",
    activity: "Estrogen withdrawal causes sudden vasomotor spikes. Practice low-intensity cooling movements like yin yoga, swimming, or slow walking.",
    nutrition: "Avoid alcohol, caffeine, and spicy foods which trigger vascular dilation. Sip iced peppermint tea to activate cold receptors.",
    focus: "Autonomic system fatigue can cause brain fog. Break tasks into tiny 20-minute chunks and use the 4-7-8 Cortisol Regulator breathing sync widget."
  },
  {
    id: "security",
    name: "Security Key Backup Reminder 🔒",
    subject: "Aeva Security: Backup Your Private Encryption Key Now",
    energy: "N/A",
    left: "Action Needed",
    index: "Critical",
    activity: "Zero-Knowledge Encryption is active. If you wipe your browser cache or change devices, your logs will be permanently unrecoverable without a backup.",
    nutrition: "This is a security check. Ensure you have copied your client-side master key and written it down in a safe offline location.",
    focus: "Go to the Privacy Vault tab, click 'Show Key', and copy the 64-character hexadecimal master key string immediately."
  }
];

export default function AdminPanel() {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);
  const [selectedUserLogs, setSelectedUserLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  // Dispatcher States
  const [activeTab, setActiveTab] = useState<"users" | "dispatcher">("users");
  const [selectedTemplateId, setSelectedTemplateId] = useState("luteal");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [dispatchStatus, setDispatchStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [dispatchError, setDispatchError] = useState("");
  const [dispatchLogs, setDispatchLogs] = useState<{ id: string; time: string; recipient: string; template: string; status: string }[]>([]);

  async function loadAdminData() {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      setRecipientEmail(selectedUser.email);
    }
  }, [selectedUser]);

  // Fetch unencrypted metadata logs for a specific selected user
  useEffect(() => {
    async function loadSelectedUserLogs() {
      if (!selectedUser) return;
      try {
        const logs = await getRecentDailyLogs(selectedUser.uid, 30);
        setSelectedUserLogs(logs);
      } catch (e) {
        console.error(e);
      }
    }
    loadSelectedUserLogs();
  }, [selectedUser]);

  const handleSeedDemoData = async () => {
    setSeeding(true);
    try {
      // In Local or Firebase mode, seed a test user "clara@aeva.com"
      const testUid = "demo_clara_99";
      const demoProfile = {
        mode: "cycle_sync" as const,
        cycleLength: 30,
        periodLength: 6,
        lastPeriodStart: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] // 10 days ago
      };

      await saveProfile(testUid, demoProfile, "clara@aeva.com");

      // Save 3 mock logs for Clara
      const mockLog1 = {
        encryptedPayload: "ciphertext_placeholder_demo_data",
        metadata: {
          phaseContext: "Ovulatory Phase",
          updatedTimestamp: new Date().toISOString()
        }
      };
      const mockLog2 = {
        encryptedPayload: "ciphertext_placeholder_demo_data",
        metadata: {
          phaseContext: "Follicular Phase",
          updatedTimestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      };

      await saveDailyLog(testUid, "2026-07-12", mockLog1);
      await saveDailyLog(testUid, "2026-07-10", mockLog2);

      // Reload
      await loadAdminData();
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
    } catch (e) {
      console.error("Failed to seed data:", e);
    } finally {
      setSeeding(false);
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.uid.toLowerCase().includes(search.toLowerCase())
  );

  // Compute aggregate statistics
  const totalUsers = users.length;
  const totalLogs = users.reduce((acc, u) => acc + u.logCount, 0);
  
  const cycleSyncCount = users.filter((u) => u.profile?.mode === "cycle_sync").length;
  const menopauseCount = users.filter((u) => u.profile?.mode === "menopause").length;
  const screeningCount = users.filter((u) => u.profile?.mode === "hormonal_screening").length;

  const activeTemplate = NOTIFICATION_TEMPLATES.find(t => t.id === selectedTemplateId) || NOTIFICATION_TEMPLATES[0];

  const handleSendEmail = async () => {
    setDispatchStatus("sending");
    setDispatchError("");
    try {
      const compiledHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f2e9e1; border-radius: 12px; background-color: #fcfbf7;">
          <h2 style="color: #db2777; font-family: Georgia, serif; text-align: center;">Aeva Bio-Sync Alert</h2>
          <p style="font-size: 14px; color: #334155; line-height: 1.6; text-align: center;">
            <strong>${activeTemplate.name}</strong> - <strong>${activeTemplate.index}</strong>
          </p>
          <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <p style="font-size: 13px; color: #475569; margin: 8px 0;"><strong>🏃 Energy Level:</strong> ${activeTemplate.energy}</p>
            <p style="font-size: 13px; color: #475569; margin: 8px 0;"><strong>⏳ Time Left:</strong> ${activeTemplate.left}</p>
            <p style="font-size: 13px; color: #475569; margin: 8px 0;"><strong>🏋️ Activity Sync:</strong> ${activeTemplate.activity}</p>
            <p style="font-size: 13px; color: #475569; margin: 8px 0;"><strong>🥑 Nutrition Sync:</strong> ${activeTemplate.nutrition}</p>
            <p style="font-size: 13px; color: #475569; margin: 8px 0;"><strong>🎯 Focus Sync:</strong> ${activeTemplate.focus}</p>
          </div>
          <p style="font-size: 11px; color: #64748b; text-align: center; margin-top: 30px;">
            This sync notification was dispatched from Aeva Admin Console. Client biometrics records are encrypted zero-knowledge.
          </p>
        </div>
      `;

      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipientEmail,
          subject: activeTemplate.subject,
          html: compiledHtml
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch email");
      }
      
      setDispatchStatus("success");
      setDispatchLogs((prev) => [
        {
          id: data.messageId || Math.random().toString(36).substring(2, 9),
          time: new Date().toLocaleTimeString(),
          recipient: recipientEmail,
          template: activeTemplate.name,
          status: "DELIVERED"
        },
        ...prev
      ]);
    } catch (err: any) {
      console.error(err);
      setDispatchError(err.message || "Failed to connect to SMTP server.");
      setDispatchStatus("error");
      setDispatchLogs((prev) => [
        {
          id: "ERROR",
          time: new Date().toLocaleTimeString(),
          recipient: recipientEmail,
          template: activeTemplate.name,
          status: `FAILED: ${err.message}`
        },
        ...prev
      ]);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 p-5 space-y-6 bg-cream-50 scrollbar-none">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] tracking-widest uppercase font-semibold text-slate-700">Analytics Console</span>
          <h1 className="font-serif text-2xl font-bold text-slate-800">Admin Panel</h1>
        </div>
        
        <button
          onClick={handleSeedDemoData}
          disabled={seeding}
          className="flex items-center gap-1 px-3 py-2 bg-sage-500 hover:bg-sage-600 disabled:bg-sage-300 text-white rounded-2xl text-xs font-bold transition-all shadow-sm"
        >
          {seeding ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : seedSuccess ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Database className="w-3.5 h-3.5" />
          )}
          <span>{seedSuccess ? "Demo Seeded!" : "Seed Demo User"}</span>
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-cream-100/60 p-1.5 rounded-2xl border border-cream-200/50">
        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "users"
              ? "bg-white text-rose-500 shadow-sm border border-rose-100"
              : "text-slate-700 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Directory</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("dispatcher")}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "dispatcher"
              ? "bg-white text-rose-500 shadow-sm border border-rose-100"
              : "text-slate-700 hover:text-slate-800"
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Notification Dispatcher</span>
        </button>
      </div>

      {activeTab === "users" && (
        <div className="space-y-6 animate-fade-in">
          {/* Aggregate Statistics Cards */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="bg-white p-4 rounded-3xl border border-cream-200/60 shadow-sm flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 text-rose-500 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-700 font-semibold uppercase tracking-wider block">Total Users</span>
                <span className="text-xl font-bold text-slate-800 leading-none">{totalUsers}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-cream-200/60 shadow-sm flex items-center gap-3">
              <div className="p-2.5 bg-sage-50 text-sage-600 rounded-xl">
                <Clipboard className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-700 font-semibold uppercase tracking-wider block">Total Day Logs</span>
                <span className="text-xl font-bold text-slate-800 leading-none">{totalLogs}</span>
              </div>
            </div>
          </div>

          {/* Pillar distributions graph */}
          <div className="bg-white p-5 rounded-3xl border border-cream-200/60 shadow-sm space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
              <BarChart3 className="w-4 h-4 text-rose-400" />
              Pillar Distributions
            </h3>
            
            <div className="space-y-2.5 text-xs">
              {[
                { label: "Cycle Syncing Mode", count: cycleSyncCount, color: "bg-rose-400" },
                { label: "Menopause Support", count: menopauseCount, color: "bg-sage-500" },
                { label: "Hormonal Screening Support", count: screeningCount, color: "bg-amber-400" }
              ].map((item, idx) => {
                const percentage = totalUsers > 0 ? Math.round((item.count / totalUsers) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-slate-700 font-semibold">
                      <span>{item.label}</span>
                      <span className="font-bold">{item.count} users ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-cream-200 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Search & User List */}
          <div className="bg-white p-5 rounded-3xl border border-cream-200/60 shadow-sm space-y-4">
            <div className="flex items-center gap-2 bg-cream-100/50 border border-cream-200 px-3.5 py-2.5 rounded-2xl">
              <Search className="w-4.5 h-4.5 text-slate-700" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by registered email or UID..."
                className="flex-1 bg-transparent text-xs focus:outline-none text-slate-800"
              />
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-6 text-xs text-slate-700">
                <RefreshCw className="w-4 h-4 animate-spin mr-1.5 text-rose-400" />
                Loading registered users...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-700">
                No registered users found.
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto scrollbar-none pr-1">
                {filteredUsers.map((u) => (
                  <button
                    key={u.uid}
                    onClick={() => setSelectedUser(selectedUser?.uid === u.uid ? null : u)}
                    className={`w-full text-left p-3 rounded-2xl border text-xs flex items-center justify-between transition-all ${
                      selectedUser?.uid === u.uid
                        ? "bg-rose-50/50 border-rose-300 shadow-sm"
                        : "bg-white border-cream-200 hover:bg-cream-100/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate pr-2 flex-1">
                      {u.profile?.demographics?.photoHex ? (
                        <img 
                          src={u.profile.demographics.photoHex} 
                          alt="" 
                          className="w-9 h-9 rounded-full object-cover border border-cream-200 shadow-xs shrink-0" 
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-400 border border-rose-100 flex items-center justify-center shrink-0">
                          <Flower className="w-5 h-5" />
                        </div>
                      )}
                      <div className="space-y-0.5 truncate">
                        <span className="font-bold text-slate-800 block truncate">
                          {u.profile?.demographics?.name || "Unregistered User"}
                        </span>
                        <span className="text-[10px] text-slate-700 block font-mono truncate">
                          {u.email}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 rounded-full font-bold text-[9px] bg-cream-200 text-slate-700 block mb-1">
                        {u.profile?.mode === "cycle_sync" && "Cycle Sync"}
                        {u.profile?.mode === "menopause" && "Menopause"}
                        {u.profile?.mode === "hormonal_screening" && "Screening"}
                      </span>
                      <span className="text-[9px] font-bold text-slate-700">{u.logCount} logs</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected User Inspector Panel */}
          {selectedUser && (
            <div className="bg-white p-5 rounded-3xl border border-rose-200 shadow-sm space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 border-b border-cream-200 pb-2">
                <UserCheck className="w-5 h-5 text-rose-400" />
                <h3 className="font-serif text-sm font-bold text-slate-800">User Details Inspector</h3>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[10px] text-slate-700 font-semibold">
                {selectedUser.profile?.demographics && (
                  <div className="bg-cream-50/50 p-3 rounded-2xl border border-cream-200/50 space-y-2.5 col-span-2 text-left">
                    <span className="text-[8px] uppercase font-bold text-slate-700 tracking-wider block border-b border-cream-100 pb-1">
                      Demographic Profile
                    </span>
                    <div className="flex items-center gap-3">
                      {selectedUser.profile.demographics.photoHex ? (
                        <img 
                          src={selectedUser.profile.demographics.photoHex} 
                          alt="User avatar" 
                          className="w-10 h-10 rounded-full object-cover border border-cream-200 shadow-xs shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-400 border border-rose-100 flex items-center justify-center shrink-0">
                          <Flower className="w-5 h-5" />
                        </div>
                      )}
                      <div className="space-y-0.5">
                        <span className="text-xs font-extrabold text-slate-800">{selectedUser.profile.demographics.name}</span>
                        <span className="text-[9px] text-slate-700 block">
                          {selectedUser.profile.demographics.gender} • DOB: {selectedUser.profile.demographics.dob}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-700 pt-1 border-t border-cream-100">
                      <div>
                        <span className="text-[8px] text-slate-700 uppercase block leading-none">Location</span>
                        <span className="font-bold text-slate-800 block truncate mt-0.5">{selectedUser.profile.demographics.city}, {selectedUser.profile.demographics.country}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-700 uppercase block leading-none">Mobile</span>
                        <span className="font-bold text-slate-800 block truncate mt-0.5">{selectedUser.profile.demographics.mobile}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-cream-100/50 p-2.5 rounded-xl border border-cream-200/50">
                  <span className="text-[8px] text-slate-700 block uppercase">Target Mode</span>
                  <span className="text-xs text-slate-800 block font-bold capitalize mt-0.5">{selectedUser.profile?.mode?.replace("_", " ")}</span>
                </div>
                
                {selectedUser.profile?.mode === "cycle_sync" && (
                  <div className="bg-cream-100/50 p-2.5 rounded-xl border border-cream-200/50">
                    <span className="text-[8px] text-slate-700 block uppercase">Cycle / Period length</span>
                    <span className="text-xs text-slate-800 block font-bold mt-0.5">{selectedUser.profile.cycleLength}d / {selectedUser.profile.periodLength}d</span>
                  </div>
                )}
                
                {selectedUser.profile?.mode === "menopause" && (
                  <div className="bg-cream-100/50 p-2.5 rounded-xl border border-cream-200/50 col-span-2">
                    <span className="text-[8px] text-slate-700 block uppercase">Vasomotor tracking status</span>
                    <span className="text-xs text-slate-800 block font-bold mt-0.5">Active Stability index prediction enabled</span>
                  </div>
                )}
              </div>

              {/* Logging History Metadata list */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-sage-500" />
                  Rolling Log Submissions (Last 30 Days)
                </h4>

                {selectedUserLogs.length === 0 ? (
                  <p className="text-[10px] text-slate-700 italic">No logs submitted in the past 30 days.</p>
                ) : (
                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto scrollbar-none pr-1">
                    {selectedUserLogs.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center bg-cream-100/30 p-2 rounded-xl border border-cream-200/30 text-[10px]"
                      >
                        <span className="font-semibold text-slate-800">{item.dateStr}</span>
                        <span className="px-2 py-0.5 rounded-full bg-sage-50 text-sage-600 font-bold border border-sage-100">
                          {item.log.metadata?.phaseContext || "General"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-2xl flex gap-2">
                <ShieldAlert className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-[9px] text-rose-700 leading-normal">
                  <strong>HIPAA Security Boundary:</strong> Aggregate metadata logs show only dates and cycle phases. The clinical symptoms, photo attachments, and comments are fully encrypted client-side and remain inaccessible to the administration console.
                </p>
              </div>

              <div className="pt-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem("aeva_impersonate_uid", selectedUser.uid);
                    localStorage.setItem("aeva_impersonate_email", selectedUser.email);
                    if (selectedUser.profile) {
                      localStorage.setItem(`aeva_profile_${selectedUser.uid}`, JSON.stringify(selectedUser.profile));
                    }
                    window.location.href = "/";
                  }}
                  className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-250 text-amber-600 rounded-2xl text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 transform"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Impersonate User</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRecipientEmail(selectedUser.email);
                    setActiveTab("dispatcher");
                  }}
                  className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-500 rounded-2xl text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send Notification Alert</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "dispatcher" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-5 rounded-3xl border border-cream-200/60 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-cream-100 pb-2">
              <Mail className="w-5 h-5 text-rose-400" />
              <h3 className="font-serif text-sm font-bold text-slate-800">Aeva SMTP Dispatch Console</h3>
            </div>
            
            <p className="text-[11px] text-slate-700 leading-relaxed">
              Dispatch cycle-specific bio-guidelines and security warnings to users directly from <code className="bg-cream-100 px-1 py-0.5 rounded font-mono font-bold text-[10px]">aqkai52@gmail.com</code> via secure Gmail SMTP.
            </p>

            <div className="space-y-3.5 text-xs">
              {/* Recipient Input */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-700 tracking-wider">Recipient Email</label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="e.g. guest.user@gmail.com"
                  className="w-full bg-cream-100/50 border border-cream-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-rose-300 text-slate-800"
                />
              </div>

              {/* Template Selector */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-700 tracking-wider">Reminder Template Type</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full bg-cream-100/50 border border-cream-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-rose-300 text-slate-800 font-medium"
                >
                  {NOTIFICATION_TEMPLATES.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Send Button */}
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={dispatchStatus === "sending" || !recipientEmail}
                className="w-full py-3.5 bg-rose-400 hover:bg-rose-500 text-white rounded-2xl font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:bg-rose-300 active:scale-95 transform cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{dispatchStatus === "sending" ? "Dispatching Alert..." : "Dispatch Sync Notification"}</span>
              </button>
            </div>

            {/* Simulated Log Output or Status Info */}
            {dispatchStatus !== "idle" && (
              <div className={`p-3.5 rounded-2xl border text-[11px] leading-relaxed space-y-1 ${
                dispatchStatus === "sending" ? "bg-cream-50 border-cream-200 text-slate-700" :
                dispatchStatus === "success" ? "bg-sage-50 border-sage-200 text-sage-700" :
                "bg-rose-50 border-rose-200 text-rose-700"
              }`}>
                {dispatchStatus === "sending" && (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
                    <span>Connecting to smtp.gmail.com:465... Authenticating aqkai52@gmail.com...</span>
                  </div>
                )}
                {dispatchStatus === "success" && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-sage-700">
                      <Check className="w-4 h-4" />
                      <span>SMTP Delivery Succeeded!</span>
                    </div>
                    <p className="text-[10px] text-sage-600 font-mono">
                      Message dispatched successfully via Gmail SMTP server to user mailbox.
                    </p>
                  </div>
                )}
                {dispatchStatus === "error" && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-rose-700">
                      <X className="w-4 h-4" />
                      <span>SMTP Transaction Failed!</span>
                    </div>
                    <p className="text-[10px] text-rose-600 font-mono leading-relaxed bg-white/70 p-2 rounded-lg border border-rose-100">
                      Error: {dispatchError}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-2xl flex gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[9px] text-amber-700 leading-normal">
                <strong>Local Script Integration:</strong> To execute real SMTP mailings to users from your terminal, set up the Google App Password and execute: <br />
                <code className="bg-amber-100/50 px-1 py-0.5 rounded font-mono font-bold block mt-1 text-[8.5px] select-all">$env:GMAIL_APP_PASSWORD="xxxx"; node scripts/send_notification.js {recipientEmail || "recipient@example.com"}</code>
              </p>
            </div>
          </div>

          {/* Live responsive template mockup */}
          <div className="bg-white p-5 rounded-3xl border border-cream-200/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-cream-100 pb-2">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-sage-500" />
                <h3 className="font-serif text-sm font-bold text-slate-800">Alert Template Live Preview</h3>
              </div>
              <span className="text-[9px] px-2 py-0.5 bg-cream-100 text-slate-700 rounded-full font-bold">Responsive Layout</span>
            </div>

            <div className="bg-cream-50/50 p-4 rounded-2xl border border-cream-200/40 text-[10px] space-y-1 text-slate-700">
              <div><strong className="text-slate-800">From:</strong> Aeva Biology Sync &lt;aqkai52@gmail.com&gt;</div>
              <div><strong className="text-slate-800">To:</strong> {recipientEmail || "recipient@example.com"}</div>
              <div><strong className="text-slate-800">Subject:</strong> {activeTemplate.subject}</div>
            </div>

            {/* Preview Frame Mockup */}
            <div className="border border-cream-200 rounded-2xl overflow-hidden bg-cream-50 p-3 flex justify-center">
              <div className="w-full max-w-[420px] bg-white border border-[#EFE4D2] rounded-2xl overflow-hidden shadow-inner text-left font-sans">
                <div className="bg-[#F7EBEC] p-4 text-center border-b border-[#F1D7D9]">
                  <h1 className="text-xl font-serif font-extrabold text-[#CA7D84] m-0">Aeva</h1>
                  <span className="inline-block text-[8px] font-extrabold bg-[#CA7D84] text-white px-2 py-0.5 rounded-full mt-1.5 tracking-wider uppercase">Weekly Sync Report</span>
                </div>
                
                <div className="p-4 space-y-4">
                  <p className="text-[10px] text-slate-700 m-0">Hello,</p>
                  <h2 className="text-sm font-serif font-bold text-slate-800 m-0">{activeTemplate.name}</h2>
                  <p className="text-[10px] text-slate-700 m-0 leading-relaxed">
                    Your body metrics have triggered a cycle adjust notification. Here is your biological report and focus recommendations:
                  </p>
                  
                  <div className="grid grid-cols-3 gap-2" style={{ display: "flex", width: "100%", boxSizing: "border-box" }}>
                    <div className="bg-white border border-[#F4EDE2] rounded-xl p-2 text-center" style={{ flex: 1 }}>
                      <div className="text-xs font-bold text-[#CA7D84]">{activeTemplate.index}</div>
                      <div className="text-[8px] text-[#718096] uppercase font-bold mt-0.5">Cycle Index</div>
                    </div>
                    <div className="bg-white border border-[#F4EDE2] rounded-xl p-2 text-center" style={{ flex: 1, marginLeft: "4px", marginRight: "4px" }}>
                      <div className="text-xs font-bold text-[#CA7D84]">{activeTemplate.left}</div>
                      <div className="text-[8px] text-[#718096] uppercase font-bold mt-0.5">Time Left</div>
                    </div>
                    <div className="bg-white border border-[#F4EDE2] rounded-xl p-2 text-center" style={{ flex: 1 }}>
                      <div className="text-xs font-bold text-[#CA7D84]">{activeTemplate.energy}</div>
                      <div className="text-[8px] text-[#718096] uppercase font-bold mt-0.5">Energy</div>
                    </div>
                  </div>

                  <div className="bg-[#FFFFFF] border border-[#F4EDE2] rounded-2xl p-3 space-y-1">
                    <div className="text-[9px] font-extrabold text-[#839D7F] uppercase tracking-wider">🏃‍♀️ Activity & Movement</div>
                    <p className="text-[10px] text-slate-700 m-0 leading-normal">{activeTemplate.activity}</p>
                  </div>

                  <div className="bg-[#FFFFFF] border border-[#F4EDE2] rounded-2xl p-3 space-y-1">
                    <div className="text-[9px] font-extrabold text-[#CA7D84] uppercase tracking-wider">🥑 Nutrition & Cravings</div>
                    <p className="text-[10px] text-slate-700 m-0 leading-normal">{activeTemplate.nutrition}</p>
                  </div>

                  <div className="bg-[#FFFFFF] border border-[#F4EDE2] rounded-2xl p-3 space-y-1">
                    <div className="text-[9px] font-extrabold text-[#D69E2E] uppercase tracking-wider">🧠 Cognitive Focus</div>
                    <p className="text-[10px] text-slate-700 m-0 leading-normal">{activeTemplate.focus}</p>
                  </div>

                  <div className="bg-[#F6F8F5] border border-[#EBF0E9] rounded-xl p-3 text-[8px] text-[#839D7F] leading-normal">
                    <strong>🔒 Zero-Knowledge Security Notice:</strong> This sync alert is triggered locally by your app client using client-side encryption metrics. Aeva never stores or transmits unencrypted health records to external servers.
                  </div>
                </div>

                <div className="bg-[#FAF6F0] p-3 text-center border-t border-[#EFE4D2] text-[8px] text-[#718096]">
                  Aeva Inc. — Client-Side Encrypted FemTech Sync
                </div>
              </div>
            </div>
          </div>

          {/* Dispatch history logs */}
          <div className="bg-white p-5 rounded-3xl border border-cream-200/60 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
              <BookOpen className="w-4 h-4 text-sage-500" />
              SMTP Dispatch History Logs
            </h3>
            
            {dispatchLogs.length === 0 ? (
              <p className="text-[10px] text-slate-700 italic">No dispatches triggered during this session.</p>
            ) : (
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                {dispatchLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex justify-between items-center bg-cream-100/30 p-2.5 rounded-xl border border-cream-200/30 text-[10px]"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-800">{log.recipient}</span>
                      <span className="text-[8px] text-slate-700 block">{log.template} • {log.time}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-sage-50 border border-sage-100 text-sage-600 font-bold font-mono text-[8px]">
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
