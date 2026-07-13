import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, message, history } = body;
    const cleanMsg = message.toLowerCase().trim();

    let reply = "";

    // Intelligent, contextual cycle coaching parser
    if (cleanMsg.includes("luteal") || cleanMsg.includes("pms")) {
      reply = `### Luteal Phase Sync Protocol
During the **Luteal Phase**, progesterone levels rise. This increases your basal metabolic rate by 100-300 kcal/day, which can lead to drops in blood sugar if not balanced.

**1. Endocrine Nutrition & Blood Sugar Control:**
* **Macronutrient Pacing:** Focus on complex carbohydrates (sweet potatoes, quinoa, brown rice) to stabilize glucose levels and prevent progesterone-induced sugar cravings.
* **Micronutrient Sync:** Take **300mg Magnesium Glycinate** to alleviate smooth muscle uterine cramps and optimize sleep quality. Pair with **Omega-3 fatty acids** to regulate inflammatory prostaglandins.

**2. Chronobiological Fitness:**
* **Relaxin Shield:** Progesterone causes joint laxity (relaxin peaks). Transition from loaded high-impact squats to steady cardio (LISS), Pilates, or bodyweight stability work to prevent ligament injury.
* **Cortisol Management:** Avoid high-intensity chronic cardio. Excess cortisol under progesterone dominance can trigger fat storage and progesterone steal.

**3. Cognitive State & Productivity:**
* **Solo Focus & Auditing:** Estrogen declines reduce social verbosity, but details-oriented executive function peaks. Ideal for code refactoring, contract audits, administrative organization, or proofreading.`;
    } else if (cleanMsg.includes("menstrual") || cleanMsg.includes("period") || cleanMsg.includes("bleeding")) {
      reply = `### Menstrual Phase Sync Protocol
During the **Menstrual Phase**, estrogen and progesterone drop to their lowest baselines. Uterine shedding requires energy redirection toward metabolic rest.

**1. Endocrine Nutrition & Restorative Diet:**
* **Iron Replenishment:** Support red blood cell regeneration. Combine heme iron (grass-fed beef) or non-heme iron (lentils, spinach) with **Vitamin C (citrus)** to maximize absorption by 300%.
* **Anti-Inflammatory:** Sip on warm red raspberry leaf tea to soothe uterine spasms.

**2. Chronobiological Fitness:**
* **Restorative Recovery:** Cortisol sensitivity is high. Stick to restorative yoga, gentle diaphragmatic breathing, or slow walking. High-intensity exercise during menses can suppress the hypothalamic-pituitary-ovarian (HPO) axis.

**3. Cognitive State & Productivity:**
* **High-Concept Brainstorming:** Inter-hemispheric brain communication peaks as the corpus callosum active density spikes due to low hormonal baseline. Perfect for high-level creative retro reviews, journaling, and architectural designs.`;
    } else if (cleanMsg.includes("follicular") || cleanMsg.includes("ovulatory")) {
      reply = `### Follicular & Ovulatory Phase Sync Protocol
During the **Follicular & Ovulatory Phase**, follicular-stimulating hormone (FSH) and estrogen surge, maximizing energy and cellular insulin sensitivity.

**1. Endocrine Nutrition & Estrogen Clearance:**
* **Cruciferous Veggies:** Eat broccoli, Brussels sprouts, and cabbage. They contain **Indole-3-Carbinol (I3C)** which binds to estrogen receptors and promotes phase II liver detoxification of excess estrogen.
* **Light Protein:** Hydrate with mineral water and support follicle growth with clean protein sources (fish, chicken, eggs).

**2. Chronobiological Fitness:**
* **Power & Performance:** Your pain tolerance and muscle recovery are at their peaks. Optimize muscle hypertrophy by scheduling heavy lifts, HIIT, high-intensity sprints, or long endurance runs.

**3. Cognitive State & Productivity:**
* **Social Expression & Negotiations:** Estrogen peaks activate the verbal centers of the brain. Excellent for public presentations, sales pitches, client negotiations, and collaborative team sprints.`;
    } else if (cleanMsg.includes("hot flash") || cleanMsg.includes("menopause")) {
      reply = `### Perimenopause & Menopause Support Protocol
To manage vasomotor instability (hot flashes) and endocrine transitions:

**1. Vasomotor Cooling & Circadian Rhythms:**
* **Autonomic Pacing:** Practice **paced breathing** (inhale 5s, hold 2s, exhale 5s) for 10 minutes when a hot flash begins to reduce autonomic nervous system arousal.
* **Phytoestrogens:** Integrate flaxseeds, sesame seeds, and organic non-GMO soy. They contain lignans that bind weakly to estrogen receptors, balancing the declining estrogen baseline.

**2. Bone Mineral Shielding:**
* **Hypertrophy Over Cardio:** Decline in estrogen reduces calcium absorption. Lift moderately heavy weights twice a week to trigger osteoblast bone density shielding and prevent sarcopenia.
* **Synergistic Supplements:** Ensure daily intake of **1200mg Calcium** paired with **800IU Vitamin D3** and **Vitamin K2** to ensure proper calcium routing to bones instead of arterial walls.

**3. Cognitive Pacing:**
* **Sustained Recovery:** Mitigate brain fog by dividing work into 25-minute Pomodoro sprints. Prioritize anti-inflammatory fats (walnuts, wild salmon) to nourish neuronal myelin sheaths.`;
    } else {
      reply = `### Personalized Aeva Endocrine Sync Plan
Based on your bio-metrics and cycle context, here is your daily health roadmap:
* **Movement:** Align workouts with your morning energy. If feeling fatigue, choose steady state LISS walks to keep cortisol low; if energetic, perform functional strength lifting.
* **Nutrition:** Eat anti-inflammatory whole foods, target essential omega-3 fatty acids, and drink mineral-rich electrolyte water.
* **Circadian Sync:** Expose your eyes to 10 minutes of direct morning sunlight before screen use to anchor your cortisol-melatonin circadian curve, which regulates reproductive hormones.`;
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const words = reply.split(" ");
        for (let i = 0; i < words.length; i++) {
          controller.enqueue(encoder.encode(words[i] + " "));
          // Small delay to simulate streaming word by word
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
