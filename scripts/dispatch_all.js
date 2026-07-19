const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

// Load .env.local manually
let firebaseConfig = null;
try {
  const envPath = path.join(__dirname, "../.env.local");
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, "utf8");
    const envLines = envFile.split("\n");
    const config = {};
    envLines.forEach(line => {
      const parts = line.split("=");
      if (parts.length >= 2) {
        config[parts[0].trim()] = parts[1].trim();
      }
    });
    
    if (config.NEXT_PUBLIC_FIREBASE_API_KEY) {
      firebaseConfig = {
        apiKey: config.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: config.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: config.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: config.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: config.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: config.NEXT_PUBLIC_FIREBASE_APP_ID
      };
    }
  }
} catch (e) {
  console.warn("Could not parse .env.local:", e.message);
}

const gmailUser = "aeva.nine@gmail.com";
const gmailPassword = process.env.GMAIL_APP_PASSWORD || "!@#Aeva";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailUser,
    pass: gmailPassword,
  },
});

// Dynamic cycle calculations
function calculateCyclePhase(profile) {
  const mode = profile.mode || "cycle_sync";
  const cycleLength = Number(profile.cycleLength) || 28;
  const periodLength = Number(profile.periodLength) || 5;
  const lastPeriodStart = profile.lastPeriodStart;
  
  if (mode !== "cycle_sync") {
    if (mode === "menopause") {
      return {
        phaseName: "Menopause Transition 🍂",
        badge: "Estrogen Swings Alert",
        cycleIndexStr: "N/A",
        phaseLeftStr: "Ongoing",
        energyLevel: "Fluctuating",
        activityGuide: "Prioritize low-intensity steady-state cardio, strength training, and sleep alignment. Hot flash indicators suggest adding 15 mins cool-down.",
        nutritionGuide: "Load up on phytoestrogen-rich foods like organic soy, flaxseeds, and fiber to stabilize temperature regulations and bone mass index.",
        cognitiveGuide: "Progesterone drops can affect sleep hygiene. Schedule high-cognitive design sprints in the morning and review workflows later."
      };
    } else {
      return {
        phaseName: "Hormonal Screening Support 📋",
        badge: "Triage Evaluation",
        cycleIndexStr: "N/A",
        phaseLeftStr: "Monitoring",
        energyLevel: "Stable",
        activityGuide: "Focus on gentle mobility, dynamic stretching, and stress-reducing walks. Keep logs updated for PCOS/Thyroid checks.",
        nutritionGuide: "Emphasize anti-inflammatory whole foods, antioxidants, and adequate hydration to support hormone synthesis.",
        cognitiveGuide: "Use structured checklist summaries for clinical evaluations. Keep notes clean for sharing with medical providers."
      };
    }
  }

  // Calculate days since last period
  let daysSinceStart = 14; // Default fallback to mid-cycle
  if (lastPeriodStart) {
    const startDate = new Date(lastPeriodStart);
    const today = new Date();
    const diffTime = Math.abs(today - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    daysSinceStart = diffDays % cycleLength;
    if (daysSinceStart === 0) daysSinceStart = cycleLength;
  }

  let phaseName = "";
  let badge = "";
  let phaseLeftStr = "";
  let energyLevel = "";
  let activityGuide = "";
  let nutritionGuide = "";
  let cognitiveGuide = "";

  if (daysSinceStart <= periodLength) {
    // Menstrual Phase (Day 1 to periodLength)
    phaseName = "Menstrual Phase 🩸";
    badge = "Hormonal Reset";
    phaseLeftStr = `${periodLength - daysSinceStart + 1} Days`;
    energyLevel = "Low / Restive";
    activityGuide = "Hormones are at their lowest. Swap intense training for gentle restorative stretching, walking, or complete rest to allow endometrial shedding.";
    nutritionGuide = "Prioritize iron-rich foods, warm stews, dark chocolate, and ginger tea to replenish blood loss and ease cramping.";
    cognitiveGuide = "Ideal time for self-reflection, planning, and goal setting. Avoid hectic schedules; focus on internal reviews.";
  } else if (daysSinceStart <= 13) {
    // Follicular Phase (Day periodLength + 1 to 13)
    phaseName = "Follicular Phase 🌱";
    badge = "Estrogen Rising";
    phaseLeftStr = `${14 - daysSinceStart} Days`;
    energyLevel = "High / Energetic";
    activityGuide = "Estrogen is surging. This is the optimal time for high-intensity interval training (HIIT), heavy resistance training, and learning new motor skills.";
    nutritionGuide = "Support developing follicles with light, vibrant foods: raw vegetables, fermented kimchi, lean proteins, and complex carbohydrates.";
    cognitiveGuide = "Brain plasticity is at its peak. Dive into complex coding challenges, creative brainstorming, and collaborative team planning.";
  } else if (daysSinceStart <= 16) {
    // Ovulatory Phase (Day 14 to 16)
    phaseName = "Ovulatory Phase 🌸";
    badge = "Fertility Peak";
    phaseLeftStr = `${17 - daysSinceStart} Days`;
    energyLevel = "Max Peak";
    activityGuide = "Your testosterone and estrogen levels hit their monthly peaks. Great time for personal records (PRs), group classes, and aerobic endurance tests.";
    nutritionGuide = "Support estrogen clearance in the liver with fiber-rich cruciferous vegetables (broccoli, cabbage), and anti-inflammatory berries.";
    cognitiveGuide = "Social energy and verbal communication skills are at their maximum. Pitch designs, do live demonstrations, or lead team sprint discussions.";
  } else {
    // Luteal Phase (Day 17 to cycleLength)
    phaseName = "Luteal Phase 🍂";
    badge = "Progesterone Dominant";
    phaseLeftStr = `${cycleLength - daysSinceStart + 1} Days`;
    energyLevel = "Moderate / Waning";
    activityGuide = "Progesterone rises, increasing body temperature and joint laxity. Swap heavy compound squats for steady-state pilates or yoga stability exercises to prevent injury.";
    nutritionGuide = "Basal metabolism rises by 10%. Consume magnesium-rich foods (almonds, pumpkin seeds, spinach) and healthy fats to block luteal cravings.";
    cognitiveGuide = "Your brain is optimized for detailed, independent tasks. Ideal time to focus on code debugging, document indexing, and organizing.";
  }

  return {
    phaseName,
    badge,
    cycleIndexStr: `Day ${daysSinceStart}`,
    phaseLeftStr,
    energyLevel,
    activityGuide,
    nutritionGuide,
    cognitiveGuide
  };
}

// Custom HTML Template Builder
function buildEmailHtml(phaseData, profile, email) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Aeva Biology Sync</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #FAF6F0;
      color: #374151;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #FAF6F0;
      padding: 20px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FDFBF8;
      border: 1px solid #EFE4D2;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(239, 228, 210, 0.5);
    }
    .header {
      background-color: #F7EBEC;
      padding: 35px 30px;
      text-align: center;
      border-bottom: 1px solid #F1D7D9;
    }
    .logo {
      font-size: 32px;
      font-family: Georgia, serif;
      font-weight: 800;
      color: #CA7D84;
      margin: 0;
      letter-spacing: 2px;
    }
    .badge {
      display: inline-block;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      background-color: #CA7D84;
      color: #FFFFFF;
      padding: 5px 14px;
      border-radius: 12px;
      margin-top: 12px;
    }
    .content {
      padding: 30px;
    }
    .greeting {
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 15px;
      color: #4B5563;
    }
    .phase-title {
      font-family: Georgia, serif;
      font-size: 22px;
      font-weight: 700;
      color: #1F2937;
      margin: 0 0 10px 0;
    }
    .metric-grid {
      display: table;
      width: 100%;
      margin: 20px 0 25px 0;
      border-collapse: separate;
      border-spacing: 10px 0;
    }
    .metric-card {
      display: table-cell;
      background-color: #FFFFFF;
      border: 1px solid #F4EDE2;
      border-radius: 16px;
      padding: 15px;
      text-align: center;
      width: 33%;
      box-shadow: 0 2px 4px rgba(240, 230, 215, 0.2);
    }
    .metric-val {
      font-size: 20px;
      font-weight: 800;
      color: #CA7D84;
    }
    .metric-lbl {
      font-size: 9px;
      text-transform: uppercase;
      font-weight: 700;
      color: #8E8373;
      margin-top: 5px;
    }
    .pillar-section {
      background-color: #FFFFFF;
      border: 1px solid #F4EDE2;
      border-radius: 20px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(240, 230, 215, 0.2);
    }
    .pillar-title {
      font-weight: 800;
      font-size: 11px;
      text-transform: uppercase;
      color: #CA7D84;
      margin-bottom: 10px;
      letter-spacing: 0.5px;
    }
    .pillar-text {
      font-size: 13px;
      line-height: 1.6;
      margin: 0;
      color: #4B5563;
    }
    .footer {
      background-color: #FAF6F0;
      padding: 20px 30px;
      text-align: center;
      font-size: 11px;
      color: #718096;
      border-top: 1px solid #EFE4D2;
    }
    .privacy-notice {
      background-color: #F6F8F5;
      border: 1px solid #EBF0E9;
      border-radius: 12px;
      padding: 12px;
      font-size: 10px;
      color: #839D7F;
      text-align: left;
      line-height: 1.5;
      margin-top: 15px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      
      <div class="header">
        <h1 class="logo">Aeva</h1>
        <div class="badge">${phaseData.badge}</div>
      </div>
      
      <div class="content">
        <p class="greeting">Hello,</p>
        <h2 class="phase-title">Your Biology Sync: ${phaseData.phaseName}</h2>
        <p class="greeting" style="margin-top: 5px;">Here is how to adjust your weekly schedule to match your changing energy levels based on your cycle timing metrics:</p>
        
        <div class="metric-grid">
          <div class="metric-card">
            <div class="metric-val">${phaseData.cycleIndexStr}</div>
            <div class="metric-lbl">Cycle Index</div>
          </div>
          <div class="metric-card">
            <div class="metric-val">${phaseData.phaseLeftStr}</div>
            <div class="metric-lbl">Phase Left</div>
          </div>
          <div class="metric-card">
            <div class="metric-val">${phaseData.energyLevel}</div>
            <div class="metric-lbl">Energy Level</div>
          </div>
        </div>
        
        <div class="pillar-section">
          <div class="pillar-title" style="color: #839D7F;">🏃‍♀️ Activity & Movement</div>
          <p class="pillar-text">${phaseData.activityGuide}</p>
        </div>
        
        <div class="pillar-section">
          <div class="pillar-title" style="color: #CA7D84;">🥑 Nutrition & Cravings</div>
          <p class="pillar-text">${phaseData.nutritionGuide}</p>
        </div>
        
        <div class="pillar-section">
          <div class="pillar-title" style="color: #4B5563;">🧠 Cognitive Focus</div>
          <p class="pillar-text">${phaseData.cognitiveGuide}</p>
        </div>
        
        <div class="privacy-notice">
          <strong>🔒 Zero-Knowledge Security Notice:</strong>
          This sync alert is triggered dynamically using the cycle parameters configured in your profile (Typical Cycle: ${profile.cycleLength || 28} days). Due to Aeva's strict zero-knowledge architecture, your encrypted daily logs and symptoms remain 100% private and cannot be read by our servers.
        </div>
      </div>
      
      <div class="footer">
        <p>Aeva Inc. — Client-Side Encrypted FemTech Sync</p>
        <p style="font-size: 9px; margin-top: 5px;">You received this email because you enabled local syncing in Aeva Privacy Settings.</p>
      </div>
      
    </div>
  </div>
</body>
</html>
  `;
}

// Fallback lists if Firestore cannot query
const fallbackRecipients = [
  {
    email: "hasan.aeva@gmail.com",
    profile: {
      mode: "cycle_sync",
      cycleLength: 28,
      periodLength: 5,
      lastPeriodStart: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Day 19 (Luteal)
    }
  },
  {
    email: "guest.user@gmail.com",
    profile: {
      mode: "cycle_sync",
      cycleLength: 30,
      periodLength: 6,
      lastPeriodStart: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Day 4 (Menstrual)
    }
  },
  {
    email: "sarah@aeva.com",
    profile: {
      mode: "menopause"
    }
  }
];

async function dispatchAll() {
  let recipients = [];
  
  if (firebaseConfig) {
    try {
      const { initializeApp } = require("firebase/app");
      const { getFirestore, collection, getDocs } = require("firebase/firestore");
      
      console.log("Connecting to Firestore to fetch registered user profiles...");
      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      const querySnapshot = await getDocs(collection(db, "users"));
      
      querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.email) {
          recipients.push({
            email: data.email,
            profile: data.profile || { mode: "cycle_sync", cycleLength: 28, periodLength: 5 }
          });
        }
      });
      
      if (recipients.length === 0) {
        console.log("No registered users found in Firestore. Falling back to default recipient list.");
        recipients = [...fallbackRecipients];
      }
    } catch (e) {
      console.warn("Could not query Firestore, falling back to mock list:", e.message);
      recipients = [...fallbackRecipients];
    }
  } else {
    console.log("No Firebase config found. Using mock registries.");
    recipients = [...fallbackRecipients];
  }
  
  // Filter unique emails
  const seen = new Set();
  recipients = recipients.filter(item => {
    if (seen.has(item.email)) return false;
    seen.add(item.email);
    return true;
  });
  
  console.log(`Found ${recipients.length} registered recipient(s) to process.`);
  
  for (const user of recipients) {
    const phaseData = calculateCyclePhase(user.profile);
    const htmlContent = buildEmailHtml(phaseData, user.profile, user.email);
    
    console.log(`\nDispatching alert to: ${user.email}`);
    console.log(`Calculated Phase: ${phaseData.phaseName} (${phaseData.cycleIndexStr || "No cycle days"})`);
    
    try {
      const info = await transporter.sendMail({
        from: `Aeva Biology Sync <${gmailUser}>`,
        to: user.email,
        subject: `Aeva Bio-Sync Alert: ${phaseData.phaseName} (${phaseData.badge})`,
        html: htmlContent
      });
      console.log(`✓ Delivered to ${user.email}. ID: ${info.messageId}`);
    } catch (err) {
      console.error(`✗ Failed to deliver to ${user.email}:`, err.message);
    }
  }
}

dispatchAll().then(() => {
  console.log("\nFinished dispatching notifications.");
}).catch(err => {
  console.error("Fatal dispatch error:", err.message);
});
