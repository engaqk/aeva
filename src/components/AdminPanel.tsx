"use client";

import React, { useState, useEffect } from "react";
import { getAllUsers, AdminUserRecord, getRecentDailyLogs, saveProfile, saveDailyLog } from "@/lib/services";
import { Users, Clipboard, BarChart3, Search, UserCheck, Activity, Calendar, ShieldAlert, Sparkles, Check, Database, RefreshCw } from "lucide-react";

export default function AdminPanel() {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);
  const [selectedUserLogs, setSelectedUserLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

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
                <div className="space-y-0.5 truncate pr-2">
                  <span className="font-semibold text-slate-800 block truncate">{u.email}</span>
                  <span className="text-[9px] text-slate-700 block font-mono truncate">UID: {u.uid}</span>
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
        </div>
      )}

    </div>
  );
}
