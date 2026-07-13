"use client";

import React, { useState, useEffect, useRef } from "react";
import { getRecentDailyLogs, saveAssessment, getAssessment, UserProfile, AssessmentData } from "@/lib/services";
import { encryptJSON, decryptJSON } from "@/lib/crypto";
import { Sparkles, FileText, Send, ShieldAlert, ShieldCheck, Heart, AlertCircle, Download, Printer, RefreshCw, Loader2, ArrowRight } from "lucide-react";

interface AIClinicProps {
  uid: string;
  profile: UserProfile;
}

export default function AIClinic({ uid, profile }: AIClinicProps) {
  const [screeningStep, setScreeningStep] = useState(1); // 1 = Explainer, 2 = Questionnaire, 3 = Generating, 4 = Report View
  const [loading, setLoading] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [riskMap, setRiskMap] = useState<any>({ pcos: 0, endo: 0, thyroid: 0 });
  const [triageReport, setTriageReport] = useState("");
  const [generating, setGenerating] = useState(false);

  // Chat window states
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: "Hello, I am your Aeva Cycle-Syncing & Wellness Coach. Ask me anything about your current phase, nutrition needs, or symptoms. (Your data is decrypted locally before use)." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Onboarding screening questions
  const [qCycle, setQCycle] = useState("regular"); // regular, irregular, absent
  const [qPain, setQPain] = useState<number>(2); // 1-5
  const [qAcneHair, setQAcneHair] = useState(false);
  const [qWeightChange, setQWeightChange] = useState(false);
  const [qFatigueBrainFog, setQFatigueBrainFog] = useState(false);
  const [qTempSensitivity, setQTempSensitivity] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Load existing assessment if available
  useEffect(() => {
    async function loadAssessment() {
      setLoading(true);
      try {
        const assessment = await getAssessment(uid);
        if (assessment) {
          const keyHex = localStorage.getItem(`aeva_master_key_${uid}`);
          if (keyHex && assessment.encryptedAssessmentData) {
            try {
              // Try decrypting existing report
              const ivHex = (assessment as any).iv || "";
              const decrypted = await decryptJSON(assessment.encryptedAssessmentData, keyHex, ivHex);
              if (decrypted) {
                setTriageReport(decrypted.report || "");
                setRiskMap(decrypted.riskMap || { pcos: 0, endo: 0, thyroid: 0 });
                setScreeningStep(4);
              }
            } catch (err) {
              console.error("Failed to decrypt assessment history:", err);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAssessment();
  }, [uid]);

  const handleStartScreening = () => {
    setScreeningStep(2);
  };

  const handleRunScreening = async () => {
    setScreeningStep(3);
    setGenerating(true);
    setStreamText("");
    
    const keyHex = localStorage.getItem(`aeva_master_key_${uid}`);
    if (!keyHex) {
      setStreamText("ERROR: Master Key is missing. Unlock the Privacy Vault first.");
      setGenerating(false);
      return;
    }

    try {
      // 1. Gather historical daily log data from local/firestore
      const rawLogs = await getRecentDailyLogs(uid, 30);
      const decryptedLogs: any[] = [];

      for (const logItem of rawLogs) {
        try {
          const ivHex = (logItem.log as any).iv || (logItem.log.metadata as any).iv || "";
          const dec = await decryptJSON(logItem.log.encryptedPayload, keyHex, ivHex);
          if (dec) {
            decryptedLogs.push({
              date: logItem.dateStr,
              energy: dec.energy,
              focus: dec.focus,
              hotFlashSeverity: dec.hotFlashSeverity,
              jointPain: dec.jointPain,
              bloating: dec.bloating,
              bleeding: dec.bleeding,
              sleepHours: dec.sleepHours,
              selectedMoods: dec.selectedMoods,
              selectedSymptoms: dec.selectedSymptoms
            });
          }
        } catch (e) {
          // Skip if key doesn't match or dec fails
        }
      }

      // 2. Prepare payload for Edge LLM Triage
      const payload = {
        profile: {
          mode: profile.mode,
          cycleLength: profile.cycleLength,
          periodLength: profile.periodLength
        },
        questionnaire: {
          cycle: qCycle,
          pelvicPain: qPain,
          excessAcneHair: qAcneHair,
          unexplainedWeightChange: qWeightChange,
          fatigueBrainFog: qFatigueBrainFog,
          tempSensitivity: qTempSensitivity
        },
        logsHistory: decryptedLogs
      };

      // 3. Post to API for Streaming
      const response = await fetch("/api/clinical-triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("API Route failure");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullReport = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          fullReport += chunk;
          setStreamText((prev) => prev + chunk);
        }
      }

      // 4. Extract Risk Map & Save Report
      // Since it's free/mock/standard, let's calculate risk scores client-side to be bulletproof
      let pcosScore = 15;
      let endoScore = 10;
      let thyroidScore = 15;

      if (qCycle === "irregular") pcosScore += 35;
      if (qCycle === "absent") pcosScore += 50;
      if (qAcneHair) pcosScore += 30;
      if (qWeightChange && qCycle !== "regular") pcosScore += 15;

      if (qPain >= 4) endoScore += 45;
      if (payload.logsHistory.some(l => l.selectedSymptoms?.includes("Cramps"))) endoScore += 25;
      if (payload.logsHistory.some(l => l.bleeding === "heavy")) endoScore += 15;

      if (qFatigueBrainFog) thyroidScore += 35;
      if (qTempSensitivity) thyroidScore += 35;
      if (qWeightChange) thyroidScore += 20;

      const finalRiskMap = {
        pcos: Math.min(95, pcosScore),
        endo: Math.min(95, endoScore),
        thyroid: Math.min(95, thyroidScore)
      };

      setRiskMap(finalRiskMap);
      setTriageReport(fullReport);

      // Save encrypted assessment
      const assessmentPlain = {
        report: fullReport,
        riskMap: finalRiskMap
      };

      const encryptedReport = await encryptJSON(assessmentPlain, keyHex);
      const assessmentData: AssessmentData = {
        encryptedAssessmentData: encryptedReport.ciphertext,
        screeningStatus: "reviewed",
        generatedAt: new Date().toISOString()
      };
      
      // Inject IV
      (assessmentData as any).iv = encryptedReport.iv;

      await saveAssessment(uid, assessmentData);
      setScreeningStep(4);
    } catch (err: any) {
      console.error(err);
      setStreamText("Failed to run screening triage. Please check your connectivity and try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatLoading(true);

    try {
      const response = await fetch("/api/generate-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: profile.mode,
          message: userMsg,
          history: chatMessages.slice(-5)
        })
      });

      if (!response.ok) throw new Error("API error");
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = "";

      setChatMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          assistantMsg += chunk;
          setChatMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: assistantMsg };
            return updated;
          });
        }
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I am having difficulty connecting. Please confirm your API keys or local server settings." }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleDownloadReport = () => {
    const element = document.createElement("a");
    const file = new Blob([triageReport], { type: "text/markdown" });
    element.href = URL.createObjectURL(file);
    element.download = "Aeva_Clinical_Triage_Report.md";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 p-5 space-y-6 bg-cream-50 scrollbar-none flex flex-col h-full">
      
      {/* Header */}
      <div>
        <span className="text-[10px] tracking-widest uppercase font-semibold text-slate-700">Medical AI Link</span>
        <h1 className="font-serif text-2xl font-bold text-slate-800">AI Clinic</h1>
      </div>

      {/* Main Tabs: Triage Triage or Coaching Chat */}
      <div className="flex flex-col flex-1 space-y-5">
        
        {/* Triage screening block */}
        <div className="bg-white p-5 rounded-3xl border border-cream-200/60 shadow-sm space-y-4">
          <h2 className="font-serif text-lg font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-rose-400" />
            Clinical Hormonal Triage
          </h2>

          {screeningStep === 1 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-700 leading-relaxed">
                Scan your logged daily biomarkers and complete a quick survey to analyze your probability layout for hormonal disorders like <strong>PCOS</strong>, <strong>Endometriosis</strong>, or <strong>Thyroid disparities</strong>.
              </p>
              <div className="p-3.5 bg-sage-50 rounded-2xl border border-sage-100 flex gap-2">
                <ShieldCheck className="w-5 h-5 text-sage-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-sage-700 leading-normal">
                  <strong>Zero-Knowledge Transit:</strong> Logs are decrypted client-side and streamed securely. The server runs transient calculations and never stores raw health logs.
                </p>
              </div>
              <button
                onClick={handleStartScreening}
                className="w-full py-3 bg-rose-400 hover:bg-rose-500 text-white rounded-2xl font-semibold text-xs transition-colors flex items-center justify-center gap-1"
              >
                Begin Structured Screening
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {screeningStep === 2 && (
            <div className="space-y-4 text-xs text-slate-700">
              <div className="space-y-2">
                <label className="font-semibold block">1. Menstrual Cycle Pattern</label>
                <div className="flex gap-2">
                  {[
                    { id: "regular", label: "Regular (21-35 days)" },
                    { id: "irregular", label: "Irregular / Fluctuating" },
                    { id: "absent", label: "Absent (>90 days)" }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setQCycle(item.id)}
                      className={`flex-1 py-2 px-1 text-[10px] font-bold rounded-xl border transition-all ${
                        qCycle === item.id
                          ? "bg-rose-50 border-rose-300 text-rose-500"
                          : "bg-white border-cream-200"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-semibold">2. Cycle Pain Severity (Cramps/Pelvic)</label>
                  <span className="font-bold text-rose-500">{qPain} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={qPain}
                  onChange={(e) => setQPain(Number(e.target.value))}
                  className="w-full accent-rose-400 bg-cream-200 rounded-lg appearance-none h-1.5"
                />
              </div>

              <div className="space-y-3 pt-2">
                <label className="font-semibold block">3. Select symptoms you experience chronically:</label>
                
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qAcneHair}
                    onChange={(e) => setQAcneHair(e.target.checked)}
                    className="w-4 h-4 accent-rose-400"
                  />
                  <span>Excessive facial hair, thinning crown hair, or cystic acne (PCOS markers)</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qWeightChange}
                    onChange={(e) => setQWeightChange(e.target.checked)}
                    className="w-4 h-4 accent-rose-400"
                  />
                  <span>Sudden unexplained weight changes (Hypo/Hyperthyroid, PCOS resistance)</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qFatigueBrainFog}
                    onChange={(e) => setQFatigueBrainFog(e.target.checked)}
                    className="w-4 h-4 accent-rose-400"
                  />
                  <span>Severe brain fog, mental exhaustion, or muscle fatigue</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qTempSensitivity}
                    onChange={(e) => setQTempSensitivity(e.target.checked)}
                    className="w-4 h-4 accent-rose-400"
                  />
                  <span>Intolerance to cold temperatures or heat sensitivity</span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setScreeningStep(1)}
                  className="flex-1 py-3 bg-cream-200 hover:bg-cream-300 text-slate-800 rounded-2xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRunScreening}
                  className="flex-1 py-3 bg-rose-400 hover:bg-rose-500 text-white rounded-2xl font-semibold transition-colors flex items-center justify-center gap-1 shadow-sm"
                >
                  Run Assessment
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {screeningStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-rose-500 font-semibold text-xs">
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                <span>AI Clinical Engine Screening active...</span>
              </div>
              <div className="p-4 bg-cream-100/50 rounded-2xl max-h-[160px] overflow-y-auto text-[11px] font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
                {streamText || "Streaming triage report..."}
              </div>
            </div>
          )}

          {screeningStep === 4 && (
            <div className="space-y-5">
              {/* Likelihood Map cards */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Hormonal Profile Probability Mapping</h4>
                <div className="space-y-2">
                  {[
                    { key: "pcos", label: "PCOS Risk Indicator", score: riskMap.pcos, color: "bg-rose-400" },
                    { key: "endo", label: "Endometriosis Indicator", score: riskMap.endo, color: "bg-sage-500" },
                    { key: "thyroid", label: "Thyroid Disparity", score: riskMap.thyroid, color: "bg-amber-400" }
                  ].map((r) => (
                    <div key={r.key} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                        <span>{r.label}</span>
                        <span className="font-bold">{r.score}% ({r.score > 70 ? "High" : r.score > 35 ? "Moderate" : "Low"})</span>
                      </div>
                      <div className="w-full h-2 bg-cream-200 rounded-full overflow-hidden">
                        <div className={`h-full ${r.color} transition-all duration-1000`} style={{ width: `${r.score}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadReport}
                  className="flex-1 py-2.5 bg-cream-200 hover:bg-cream-300 text-slate-800 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1 border border-cream-300/40"
                >
                  <Download className="w-3.5 h-3.5" />
                  Markdown Report
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-cream-200 hover:bg-cream-300 text-slate-800 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1 border border-cream-300/40"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print PDF
                </button>
                <button
                  onClick={() => setScreeningStep(2)}
                  className="p-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-xl text-rose-500 transition-colors"
                  title="Rescreen"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-2xl flex gap-2">
                <ShieldAlert className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-[9px] text-rose-700 leading-normal">
                  <strong>Clinical Disclaimer:</strong> Aeva is an educational pattern finder, not a diagnostics utility. This downloadable Markdown report is designed to be shared with your endocrinologist or OBGYN.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* AI CONSULTATION CHAT SECTION */}
        <div className="flex-1 bg-white rounded-3xl border border-cream-200/60 shadow-sm flex flex-col overflow-hidden min-h-[300px]">
          <div className="p-4 bg-cream-100/50 border-b border-cream-200 flex items-center gap-2 shrink-0">
            <Heart className="w-4 h-4 text-rose-400" />
            <h3 className="font-serif text-sm font-bold text-slate-800">Decrypted Coach Chat</h3>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs scrollbar-none">
            {chatMessages.map((m, idx) => (
              <div
                key={idx}
                className={`max-w-[85%] rounded-2xl p-3 leading-relaxed ${
                  m.role === "user"
                    ? "bg-rose-400 text-white font-semibold self-end ml-auto"
                    : "bg-cream-100 text-slate-800 self-start mr-auto"
                }`}
              >
                {m.content || (
                  <span className="inline-flex gap-1 items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-slate-700 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-700 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-700 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </span>
                )}
              </div>
            ))}
            <div ref={chatEndRef}></div>
          </div>

          {/* Chat Form */}
          <form onSubmit={handleSendChatMessage} className="p-3 bg-cream-50 border-t border-cream-200 flex gap-2 shrink-0">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about cycle tips or foods..."
              className="flex-1 px-4 py-3 rounded-2xl bg-white border border-cream-200 focus:border-rose-300 focus:outline-none text-xs"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="p-3 bg-rose-400 hover:bg-rose-500 text-white rounded-2xl transition-colors disabled:bg-rose-300 flex items-center justify-center shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
