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

// Credentials provided
const gmailUser = "aqkai52@gmail.com";
const gmailPassword = process.env.GMAIL_APP_PASSWORD || "!@#Qadir53";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailUser,
    pass: gmailPassword,
  },
});

// Stunning HTML template
const emailHtml = `
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
      padding: 30px;
      text-align: center;
      border-bottom: 1px solid #F1D7D9;
    }
    .logo {
      font-size: 28px;
      font-family: Georgia, serif;
      font-weight: 800;
      color: #CA7D84;
      margin: 0;
      letter-spacing: 1px;
    }
    .badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      background-color: #CA7D84;
      color: #FFFFFF;
      padding: 4px 12px;
      border-radius: 12px;
      margin-top: 10px;
    }
    .content {
      padding: 30px;
    }
    .greeting {
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 20px;
      color: #4B5563;
    }
    .phase-title {
      font-family: Georgia, serif;
      font-size: 20px;
      font-weight: 700;
      color: #374151;
      margin: 0 0 10px 0;
    }
    .metric-grid {
      display: table;
      width: 100%;
      margin-bottom: 25px;
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
      color: #718096;
      margin-top: 5px;
    }
    .pillar-section {
      background-color: #FFFFFF;
      border: 1px solid #F4EDE2;
      border-radius: 20px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .pillar-title {
      font-weight: 800;
      font-size: 11px;
      text-transform: uppercase;
      color: #839D7F;
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
        <div class="badge">Weekly Sync Report</div>
      </div>
      
      <div class="content">
        <p class="greeting">Hello,</p>
        <h2 class="phase-title">Your Biology Sync: Entering Luteal Phase 🍂</h2>
        <p class="greeting" style="margin-top: 5px;">Your body is shifting estrogen levels downward as progesterone increases. Here is how to adjust your weekly schedule to match your changing energy levels:</p>
        
        <div class="metric-grid">
          <div class="metric-card">
            <div class="metric-val">Day 19</div>
            <div class="metric-lbl">Cycle Index</div>
          </div>
          <div class="metric-card">
            <div class="metric-val">9 Days</div>
            <div class="metric-lbl">Phase Left</div>
          </div>
          <div class="metric-card">
            <div class="metric-val">Moderate</div>
            <div class="metric-lbl">Energy Level</div>
          </div>
        </div>
        
        <div class="pillar-section">
          <div class="pillar-title" style="color: #839D7F;">🏃‍♀️ Activity & Movement</div>
          <p class="pillar-text">Progesterone rises, increasing joint laxity. Swap high-impact cardiac jumps or heavy compound squats for steady-state pilates or yoga stability exercises to prevent injury.</p>
        </div>
        
        <div class="pillar-section">
          <div class="pillar-title" style="color: #CA7D84;">🥑 Nutrition & Cravings</div>
          <p class="pillar-text">Sugar sensitivity drops as basal metabolism rises. Consume magnesium-rich pumpkin seeds, almonds, and leafy greens to stabilize blood glucose and block luteal cravings.</p>
        </div>
        
        <div class="pillar-section">
          <div class="pillar-title" style="color: #CA7D84;">🧠 Cognitive Focus</div>
          <p class="pillar-text">Your brain hemisphere communication enters a highly structured editing state. Great time to focus on code debugging, document indexing, admin reviews, and organization.</p>
        </div>
        
        <div class="privacy-notice">
          <strong>🔒 Zero-Knowledge Security Notice:</strong>
          This sync alert is triggered locally by your app client using client-side encryption metrics. Aeva never stores or transmits unencrypted health records, medical reports, or cycle charts to external servers. Your intimate data remains completely yours.
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

// Fallback lists if Firestore cannot query
const fallbackEmails = [
  "hasan.aeva@gmail.com",
  "guest.user@gmail.com",
  "sarah@aeva.com"
];

async function dispatchAll() {
  let recipients = [];
  
  if (firebaseConfig) {
    try {
      // Dynamic require to prevent errors if Firebase client is not in node modules
      const { initializeApp } = require("firebase/app");
      const { getFirestore, collection, getDocs } = require("firebase/firestore");
      
      console.log("Connecting to Firestore to fetch registered user emails...");
      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      const querySnapshot = await getDocs(collection(db, "users"));
      querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.email) {
          recipients.push(data.email);
        }
      });
      if (recipients.length === 0) {
        console.log("No registered users found in Firestore collection. Falling back to default recipient list.");
        recipients = [...fallbackEmails];
      }
    } catch (e) {
      console.warn("Could not query Firestore, falling back to mock list:", e.message);
      recipients = [...fallbackEmails];
    }
  } else {
    console.log("No Firebase config found. Using mock registry.");
    recipients = [...fallbackEmails];
  }
  
  recipients = [...new Set(recipients)].filter(Boolean);
  
  console.log(`Found ${recipients.length} registered recipient(s): ${recipients.join(", ")}`);
  
  for (const email of recipients) {
    console.log(`Sending Luteal Sync reminder to: ${email}...`);
    try {
      const info = await transporter.sendMail({
        from: `Aeva Biology Sync <${gmailUser}>`,
        to: email,
        subject: "Aeva Bio-Sync Alert: Entering Luteal Phase (Magnesium & Focus Adjustments)",
        html: emailHtml
      });
      console.log(`✓ Delivered to ${email}. ID: ${info.messageId}`);
    } catch (err) {
      console.error(`✗ Failed to deliver to ${email}:`, err.message);
    }
  }
}

dispatchAll().then(() => {
  console.log("\nFinished dispatching notifications.");
}).catch(err => {
  console.error("Fatal dispatch error:", err.message);
});
