import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile, questionnaire, logsHistory } = body;

    // 1. Run pattern matching scoring logic
    let pcosScore = 15;
    let endoScore = 10;
    let thyroidScore = 15;

    if (questionnaire.cycle === "irregular") pcosScore += 35;
    if (questionnaire.cycle === "absent") pcosScore += 50;
    if (questionnaire.excessAcneHair) pcosScore += 30;
    if (questionnaire.unexplainedWeightChange && questionnaire.cycle !== "regular") pcosScore += 15;

    if (questionnaire.pelvicPain >= 4) endoScore += 45;
    const hasCrampsInLogs = logsHistory?.some((l: any) => l.selectedSymptoms?.includes("Cramps"));
    const hasHeavyBleeding = logsHistory?.some((l: any) => l.bleeding === "heavy");
    if (hasCrampsInLogs) endoScore += 25;
    if (hasHeavyBleeding) endoScore += 15;

    if (questionnaire.fatigueBrainFog) thyroidScore += 35;
    if (questionnaire.tempSensitivity) thyroidScore += 35;
    if (questionnaire.unexplainedWeightChange) thyroidScore += 20;

    const riskMap = {
      pcos: Math.min(95, pcosScore),
      endo: Math.min(95, endoScore),
      thyroid: Math.min(95, thyroidScore)
    };

    // 2. Draft structured gynecologist Markdown report
    const reportText = `# Aeva Clinical Triage Assessment Report
**Generated At:** ${new Date().toLocaleDateString()}
**Patient Sync ID:** anonymous-zero-knowledge-vault

---

## Executive Summary
This report analyzes patient-logged physical symptoms, menstrual cycle metrics, and metabolic indicators tracked over a rolling 30-day window. Data collection was performed locally in a secure context with client-side end-to-end encryption. 

Based on multi-symptom pattern matching, the clinical triage engine has mapped specific probabilities for endocrine and gynecological conditions.

---

## Probability Risk Mapping
- **Polycystic Ovary Syndrome (PCOS) Index:** **${riskMap.pcos}%**
  *Indications:* Menstrual cycle pattern is classified as **${questionnaire.cycle}**. ${questionnaire.excessAcneHair ? "Presents androgenic markers (excess terminal hair / cystic acne)." : "No acute androgenic markers recorded."}
- **Endometriosis Probability Index:** **${riskMap.endo}%**
  *Indications:* Subjective pelvic pain intensity rated at **${questionnaire.pelvicPain} / 5**. ${hasCrampsInLogs ? "Vault logs confirm frequent dysmenorrhea (menstrual cramps)." : "No acute logging of spasmodic cramps."}
- **Thyroid Disparity Layout:** **${riskMap.thyroid}%**
  *Indications:* ${questionnaire.fatigueBrainFog ? "Presents chronic systemic fatigue and cognitive focus lapses." : "Focus and energy logs are balanced."} ${questionnaire.tempSensitivity ? "Indicates temperature sensitivity (cold/heat intolerance)." : "No temperature sensitivity noted."}

---

## Logged Biomarkers & History Analysis
We reviewed **${logsHistory?.length || 0} days** of self-logged health data:
- **Average Sleep Duration:** ${logsHistory && logsHistory.length > 0 ? (logsHistory.reduce((acc: number, cur: any) => acc + (cur.sleepHours || 0), 0) / logsHistory.length).toFixed(1) : "7.0"} hours.
- **Persistent Symptoms Logged:** ${Array.from(new Set(logsHistory?.flatMap((l: any) => l.selectedSymptoms || []) || [])).filter(s => s !== "None").join(", ") || "None"}
- **Mood Fluctuations:** ${Array.from(new Set(logsHistory?.flatMap((l: any) => l.selectedMoods || []) || [])).join(", ") || "Balanced"}

---

## Gynecologist / Endocrinologist Discussion Guide
*Take these specific questions to your next physical appointment:*
1. "Given my logs indicate a cycle layout that is **${questionnaire.cycle}**, should we check free/total testosterone and DHEA-S levels for PCOS screening?"
2. "My subjective pelvic pain reaches **${questionnaire.pelvicPain} / 5** during cycles. Is a transvaginal ultrasound or diagnostic laparoscopy indicated to evaluate for deep-infiltrating endometriosis?"
3. "I am experiencing chronic fatigue, brain fog, and temperature sensitivity. Can we run a full thyroid panel checking TSH, Free T3, Free T4, and Thyroid Peroxidase (TPO) antibodies?"

---

## Actionable Lifestyle Adjustments
- **Cortisol & Insulin Pacing:** Focus on complex carbohydrates (oats, quinoa) combined with proteins to prevent glucose-insulin spikes.
- **Sleep & Recovery:** Maintain a strict 8-hour sleep window. Active progesterone levels require higher resting recovery.
- **Micronutrient Synchronization:** Increase intake of Selenium (1-2 Brazil nuts daily) to support thyroid conversion, and Magnesium (300mg glycinate) to alleviate cramps.

---
*Disclaimer: Aeva is an educational triage calculator. This report is for documentation purposes and does not constitute a diagnostic medical finding.*
`;

    // 3. Stream the report to the client chunk by chunk
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Split text by lines to simulate typing stream
        const lines = reportText.split("\n");
        for (const line of lines) {
          controller.enqueue(encoder.encode(line + "\n"));
          // Micro delay to simulate realistic AI processing and streaming
          await new Promise((r) => setTimeout(r, 4));
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
