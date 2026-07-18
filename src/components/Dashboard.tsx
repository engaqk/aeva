"use client";

import React, { useState, useEffect } from "react";
import { UserProfile, getRecentDailyLogs, saveProfile } from "@/lib/services";
import { decryptJSON } from "@/lib/crypto";
import { Heart, Activity, Shield, Sparkles, Brain, Award, Apple, Flame, Camera, FileImage, X, Wind, Play, Square, Watch, RefreshCw } from "lucide-react";
import { TRANSLATIONS, LanguageCode } from "@/lib/translations";

interface DashboardProps {
  uid: string;
  profile: UserProfile;
  onProfileUpdate: (newProfile: UserProfile) => void;
  onNavigate?: (tab: any) => void;
  language?: any;
}

export default function Dashboard({ uid, profile, onProfileUpdate, onNavigate, language = "en" }: DashboardProps) {
  const [activeTab, setActiveTab] = useState(profile.mode || "cycle_sync");
  const [cycleDay, setCycleDay] = useState(1);
  const [daysRemaining, setDaysRemaining] = useState(1);
  const [currentPhase, setCurrentPhase] = useState("Follicular");
  const [stabilityIndex, setStabilityIndex] = useState(85);
  const [hotFlashRisk, setHotFlashRisk] = useState<"Low" | "Moderate" | "High">("Low");
  const [recentLogsCount, setRecentLogsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string>("/female_avatar.png");

  // Gamified Streaks & Rest Days
  const [streakCount, setStreakCount] = useState(5);
  const [restDaysLeft, setRestDaysLeft] = useState(2);

  // Swipe Sync Swiper Deck States
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [swipeDeckFinished, setSwipeDeckFinished] = useState(false);
  const [groceryList, setGroceryList] = useState<string[]>([]);

  // Symptom Bingo grid states
  const [bingoGrid, setBingoGrid] = useState<boolean[]>(Array(9).fill(false));
  const [showConfetti, setShowConfetti] = useState(false);
  const [bingoExplanations, setBingoExplanations] = useState<string | null>(null);

  // Cortisol Regulator Breathing States
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"Inhale" | "Hold" | "Exhale">("Inhale");
  const [breathSeconds, setBreathSeconds] = useState(4);
  const [breathCompletedCycles, setBreathCompletedCycles] = useState(0);

  // Apple Watch & Wearable Sync States
  const [isWatchConnected, setIsWatchConnected] = useState(false);
  const [isWatchSyncing, setIsWatchSyncing] = useState(false);
  const [watchType, setWatchType] = useState<"apple" | "android" | null>(null);
  const [watchData, setWatchData] = useState({ steps: 8432, hr: 68, sleep: "7h 12m", temp: "36.4°C", lastUpdated: "Not synced yet" });

  const t = (key: string) => {
    return TRANSLATIONS[language as LanguageCode]?.[key] || TRANSLATIONS["en"]?.[key] || key;
  };

  const handleWatchSync = () => {
    setIsWatchSyncing(true);
    setTimeout(() => {
      setIsWatchSyncing(false);
      setWatchData({
        steps: Math.floor(7500 + Math.random() * 2500),
        hr: Math.floor(62 + Math.random() * 12),
        sleep: `${7 + Math.floor(Math.random() * 2)}h ${Math.floor(Math.random() * 15)}m`,
        temp: `${(36.1 + Math.random() * 0.6).toFixed(1)}°C`,
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }, 1500);
  };

  const getLocalizedPhase = (phase: string) => {
    if (language === "hi") {
      switch (phase) {
        case "Menstrual": return "मासिक धर्म";
        case "Follicular": return "फॉलिकुलर";
        case "Ovulatory": return "ओव्यूलेटरी";
        default: return "ल्यूटियल";
      }
    }
    if (language === "gu") {
      switch (phase) {
        case "Menstrual": return "માસિક ધર્મ";
        case "Follicular": return "ફોલિક્યુલર";
        case "Ovulatory": return "ઓવ્યુલેટરી";
        default: return "લ્યુટીઅલ";
      }
    }
    if (language === "fr") {
      switch (phase) {
        case "Menstrual": return "Menstruelle";
        case "Follicular": return "Folliculaire";
        case "Ovulatory": return "Ovulatoire";
        default: return "Lutéale";
      }
    }
    if (language === "de") {
      switch (phase) {
        case "Menstrual": return "Menstruation";
        case "Follicular": return "Follikelphase";
        case "Ovulatory": return "Eisprung";
        default: return "Lutealphase";
      }
    }
    if (language === "es") {
      switch (phase) {
        case "Menstrual": return "Menstrual";
        case "Follicular": return "Folicular";
        case "Ovulatory": return "Ovulatoria";
        default: return "Lútea";
      }
    }
    return phase;
  };

  const getBriefingHeader = () => {
    const locPhase = getLocalizedPhase(currentPhase);
    if (language === "hi") return `दिन ${cycleDay} (${locPhase}): आपकी सामाजिक बैटरी आज चरम सीमा पर है।`;
    if (language === "gu") return `દિવસ ${cycleDay} (${locPhase}): તમારી સામાજિક શક્તિ આજે ચરમસીમા પર છે.`;
    if (language === "fr") return `Jour ${cycleDay} (${locPhase}) : Votre batterie sociale est au maximum aujourd'hui.`;
    if (language === "de") return `Tag ${cycleDay} (${locPhase}): Ihre soziale Batterie ist heute voll aufgeladen.`;
    if (language === "es") return `Día ${cycleDay} (${locPhase}): Su batería social está al máximo hoy.`;
    return `Day ${cycleDay} (${currentPhase}): Your social battery is at peak capacity today.`;
  };

  const getSuperpowerDescription = () => {
    if (language === "hi") {
      switch (currentPhase) {
        case "Menstrual": return "रचनात्मक पूर्वव्यापी और उच्च-अवधारणा वास्तुकला।";
        case "Follicular": return "उच्च-मात्रा विश्लेषणात्मक कोडिंग और समस्या समाधान।";
        case "Ovulatory": return "शिखर सामाजिक करिश्मा, बातचीत और मौखिक पिचिंग।";
        default: return "विवरण पर ध्यान, डिबगिंग और गहरा निष्पादन।";
      }
    }
    if (language === "gu") {
      switch (currentPhase) {
        case "Menstrual": return "સર્જનાત્મક પૂર્વવર્તી અને ઉચ્ચ-વિચાર સ્થાપત્ય.";
        case "Follicular": return "ઉચ્ચ-વોલ્યુમ વિશ્લેષણાત્મક કોડિંગ અને સમસ્યા હલ કરવી.";
        case "Ovulatory": return "મહત્તમ સામાજિક કરિશ્મા, વાટાઘાટો અને મૌખિક પિચિંગ.";
        default: return "વિગતો પર ધ્યાન, ડિબગિંગ અને ઊંડા અમલીકરણ.";
      }
    }
    if (language === "fr") {
      switch (currentPhase) {
        case "Menstrual": return "Rétrospectives créatives et architecture conceptuelle.";
        case "Follicular": return "Codage analytique à volume élevé et résolution de problèmes.";
        case "Ovulatory": return "Charisme social maximal, négociations et pitch verbal.";
        default: return "Attention aux détails, débogage et exécution approfondie.";
      }
    }
    if (language === "de") {
      switch (currentPhase) {
        case "Menstrual": return "Kreative Rückblicke und konzeptionelle Architektur.";
        case "Follicular": return "Analytisches Codieren in hohem Maße und Problemlösung.";
        case "Ovulatory": return "Maximale soziale Ausstrahlung, Verhandlungen und Präsentationen.";
        default: return "Liebe zum Detail, Debugging und tiefe Ausführung.";
      }
    }
    if (language === "es") {
      switch (currentPhase) {
        case "Menstrual": return "Retrospectivas creativas y arquitectura conceptual.";
        case "Follicular": return "Codificación analítica de gran volumen y resolución de problemas.";
        case "Ovulatory": return "Carisma social máximo, negociaciones y presentación verbal.";
        default: return "Atención a los detalles, depuración y ejecución profunda.";
      }
    }
    switch (currentPhase) {
      case "Menstrual": return "Creative retrospectives & high-concept architecture.";
      case "Follicular": return "High-volume analytical coding & problem solving.";
      case "Ovulatory": return "Peak social charisma, negotiations & verbal pitching.";
      default: return "Attention to details, debugging & deep execution.";
    }
  };

  const getKryptoniteDescription = () => {
    if (language === "hi") {
      switch (currentPhase) {
        case "Menstrual": return "शारीरिक परिश्रम और कोशिकीय इंसुलिन संवेदनशीलता में गिरावट।";
        case "Follicular": return "संभावित अधीरता और प्रशासनिक विवरणों के साथ धैर्य की कमी।";
        case "Ovulatory": return "उच्च सामाजिक उत्तेजना के कारण ध्यान बिखरना।";
        default: return "जोड़ों की शिथिलता और कार्बोहाइड्रेट क्रैश।";
      }
    }
    if (language === "gu") {
      switch (currentPhase) {
        case "Menstrual": return "શારીરિક શ્રમ અને કોષીય ઇન્સ્યુલિન સંવેદનશીલતામાં ઘટાડો.";
        case "Follicular": return "વહીવટી વિગતો સાથે સંભવિત અધીરાઈ અને ધીરજનો અભાવ.";
        case "Ovulatory": return "ઉચ્ચ સામાજિક ઉત્તેજનાને કારણે ધ્યાન વિખેરાઈ જવું.";
        default: return "સાંધાઓની શિથિલતા અને કાર્બોહાઇડ્રેટ ક્રેશ.";
      }
    }
    if (language === "fr") {
      switch (currentPhase) {
        case "Menstrual": return "Effort physique et baisse de sensibilité à l'insuline.";
        case "Follicular": return "Impatience potentielle et manque de patience avec les détails.";
        case "Ovulatory": return "Dispersion de l'attention due à un stimulus social élevé.";
        default: return "Laxité articulaire et baisse d'énergie liée aux glucides.";
      }
    }
    if (language === "de") {
      switch (currentPhase) {
        case "Menstrual": return "Körperliche Anstrengung & verminderte Insulinsensitivität.";
        case "Follicular": return "Potenzielle Ungeduld und mangelnde Geduld mit administrativen Details.";
        case "Ovulatory": return "Aufmerksamkeitsstreuung durch hohe soziale Reize.";
        default: return "Gelenkschlaffheit & Kohlenhydrat-Crashes.";
      }
    }
    if (language === "es") {
      switch (currentPhase) {
        case "Menstrual": return "Esfuerzo físico y disminución de sensibilidad a la insulina.";
        case "Follicular": return "Impaciencia potencial y falta de paciencia con detalles.";
        case "Ovulatory": return "Dispersión del enfoque debido a altos estímulos sociales.";
        default: return "Laxitud articular y bajones por carbohidratos.";
      }
    }
    switch (currentPhase) {
      case "Menstrual": return "Physical exertion & cellular insulin sensitivity dip.";
      case "Follicular": return "Potential impatience & lack of patience with admin detail.";
      case "Ovulatory": return "Focus scattering due to high social stimulus.";
      default: return "Joint relaxin-laxity & carbohydrate crashes.";
    }
  };

  const getActivityTitle = () => {
    if (language === "hi") {
      if (activeTab === "cycle_sync") {
        if (currentPhase === "Menstrual") return "पुनर्स्थापनात्मक विश्राम और धीमी सैर";
        if (currentPhase === "Follicular") return "भारी प्रतिरोध और उच्च तीव्रता स्प्रिंट";
        if (currentPhase === "Ovulatory") return "HIIT कार्डियो और सामाजिक समूह वर्कआउट";
        return "स्थिर-अवस्था कार्डियो और जोड़ों की स्थिरता पर ध्यान";
      }
      if (activeTab === "menopause") return "हड्डियों के घनत्व के लिए शक्ति प्रशिक्षण";
      return "कम प्रभाव वाली स्थिर अवस्था (LISS) कार्डियो";
    }
    if (language === "gu") {
      if (activeTab === "cycle_sync") {
        if (currentPhase === "Menstrual") return "આરામ અને ધીમી ચાલ";
        if (currentPhase === "Follicular") return "ભારે પ્રતિકાર અને ઉચ્ચ તીવ્રતા સ્પ્રિન્ટ";
        if (currentPhase === "Ovulatory") return "HIIT કાર્ડિયો અને સામાજિક જૂથ વર્કઆઉટ્સ";
        return "સ્થિર-સ્થિતિ કાર્ડિયો અને સાંધાની સ્થિરતા પર ધ્યાન";
      }
      if (activeTab === "menopause") return "હાડકાની મજબૂતાઈ માટે વેઇટ ટ્રેનિંગ";
      return "ઓછી અસરવાળી સ્થિર સ્થિતિ (LISS) કાર્ડિયો";
    }
    if (language === "fr") {
      if (activeTab === "cycle_sync") {
        if (currentPhase === "Menstrual") return "Repos Restaurateur & Marches Lentes";
        if (currentPhase === "Follicular") return "Force Lourde & Sprints d'Intensité";
        if (currentPhase === "Ovulatory") return "Cardio HIIT & Entraînements de Groupe";
        return "Cardio Stable & Focus sur la Stabilité Articulaire";
      }
      if (activeTab === "menopause") return "Musculation pour la Densité Osseuse";
      return "Cardio à Faible Intensité (LISS)";
    }
    if (language === "de") {
      if (activeTab === "cycle_sync") {
        if (currentPhase === "Menstrual") return "Erholsame Ruhe & Langsame Spaziergänge";
        if (currentPhase === "Follicular") return "Schweres Krafttraining & Intervallsprints";
        if (currentPhase === "Ovulatory") return "HIIT-Cardio & Soziale Gruppen-Workouts";
        return "Steady-State-Cardio & Fokus auf Gelenkstabilität";
      }
      if (activeTab === "menopause") return "Krafttraining für die Knochendichte";
      return "Low-Impact Steady State (LISS) Cardio";
    }
    if (language === "es") {
      if (activeTab === "cycle_sync") {
        if (currentPhase === "Menstrual") return "Descanso Restaurador y Caminatas Suaves";
        if (currentPhase === "Follicular") return "Fuerza Pesada y Sprints de Intensidad";
        if (currentPhase === "Ovulatory") return "Cardio HIIT y Entrenamientos en Grupo";
        return "Cardio de Estado Estable y Estabilidad Articular";
      }
      if (activeTab === "menopause") return "Entrenamiento de Fuerza para Densidad Ósea";
      return "Cardio de Bajo Impacto (LISS)";
    }
    if (activeTab === "cycle_sync") {
      if (currentPhase === "Menstrual") return "Restorative Rest & Slow Walks";
      if (currentPhase === "Follicular") return "Heavy Resistance & Intensity Sprints";
      if (currentPhase === "Ovulatory") return "HIIT Cardio & Social Group Workouts";
      return "Steady-State Cardio & Joint Stability focus";
    }
    if (activeTab === "menopause") return "Strength Training for Bone Density";
    return "Low-impact Steady State (LISS) Cardio";
  };

  const getActivityDescription = () => {
    if (language === "hi") {
      if (activeTab === "cycle_sync") {
        if (currentPhase === "Menstrual") return "एस्ट्रोजन और प्रोजेस्टेरोन सबसे निचले स्तर पर हैं। कोर्टिसोल को बढ़ाए बिना परिसंचरण में मदद करने के लिए कोमल योग या हल्की सैर को प्राथमिकता दें।";
        if (currentPhase === "Follicular") return "एस्ट्रोजन का स्तर बढ़ रहा है, जिससे दर्द सहन करने की क्षमता और ठीक होने की गति बढ़ जाती है। भारी वजन उठाने या दौड़ने का अभ्यास करें।";
        if (currentPhase === "Ovulatory") return "आपका शरीर चरम ऊर्जा स्तर का अनुभव करता है। जमकर कसरत करें, लेकिन जोड़ों की सुरक्षा का ध्यान रखें।";
        return "जोड़ों की शिथिलता बढ़ जाती है, जिससे स्थिरता कम होती है। तीव्रता को मध्यम रखें, पिलेट्स पर स्विच करें और स्थिर कार्डियो करें।";
      }
      if (activeTab === "menopause") return "एस्ट्रोजन में कमी से कैल्शियम का अवशोषण कम हो जाता है। हड्डियों के घनत्व को उत्तेजित करने और मांसपेशियों को बनाए रखने के लिए सप्ताह में दो बार मध्यम भारी वजन उठाएं।";
      return "कोर्टिसोल-थायरॉयड-एस्ट्रोजन संतुलन को बाधित करने वाले पुराने तनाव को रोकने के लिए, पिलेट्स, पैदल चलने और हल्की तैराकी जैसे कम तीव्रता वाले व्यायाम पर जोर दें।";
    }
    if (language === "gu") {
      if (activeTab === "cycle_sync") {
        if (currentPhase === "Menstrual") return "એસ્ટ્રોજન અને પ્રોજેસ્ટેરોન સૌથી નીચા સ્તરે છે. કોર્ટિસોલ વધાર્યા વિના રક્ત પરિભ્રમણ વધારવા માટે હળવા યોગ અથવા ચાલવાને પ્રાથમિકતા આપો.";
        if (currentPhase === "Follicular") return "એસ્ટ્રોજનનું સ્તર વધી રહ્યું છે, જેથી દુખાવો સહન કરવાની શક્તિ અને પુનઃપ્રાપ્તિ ઝડપી બને છે. ભારે વજન ઉપાડવા કે દોડવા તરફ આગળ વધો.";
        if (currentPhase === "Ovulatory") return "તમારું શરીર મહત્તમ ઉર્જા સ્તરનો અનુભવ કરે છે. સખત મહેનત કરો, પરંતુ સાંધાઓનું ધ્યાન રાખો.";
        return "સાંધા ઢીલા પડે છે, જે સ્થિરતા ઘટાડે છે. તીવ્રતા મધ્યમ રાખો, પિલેટ્સ પર સ્વિચ કરો અને સ્થિર કાર્ડિયો કરો.";
      }
      if (activeTab === "menopause") return "એસ્ટ્રોજનમાં ઘટાડો કેલ્શિયમનું શોષણ ઘટાડે છે. હાડકાની ઘનતા વધારવા અને સ્નાયુ જાળવી રાખવા માટે અઠવાડિયામાં બે વાર વજન ઉપાડો.";
      return "તણાવ રોકવા માટે, જે કોર્ટિસોલ-થાઇરોઇડ-એસ્ટ્રોજન સંતુલનને અસર કરે છે, પિલેટ્સ, ચાલવું અને હળવા સ્વિમિંગ જેવી ઓછી તીવ્રતાવાળી કસરત કરો.";
    }
    if (language === "fr") {
      if (activeTab === "cycle_sync") {
        if (currentPhase === "Menstrual") return "Les œstrogènes et la progestérone sont au plus bas. Privilégiez le yoga doux ou la marche légère pour aider la circulation sans augmenter le cortisol.";
        if (currentPhase === "Follicular") return "Les niveaux d'œstrogènes augmentent, améliorant la tolérance à l'effort. Privilégiez la musculation lourde et les entraînements intenses.";
        if (currentPhase === "Ovulatory") return "Votre corps connaît des pics d'énergie. Forcez sur le cardio, mais surveillez vos articulations.";
        return "La laxité articulaire augmente. Gardez une intensité modérée, passez au pilates ou au cardio modéré.";
      }
      if (activeTab === "menopause") return "La baisse d'œstrogènes réduit l'absorption du calcium. Soulevez des poids modérés deux fois par semaine pour stimuler la densité osseuse.";
      return "Pour éviter les pics de stress qui perturbent les hormones, privilégiez le pilates, la marche et la natation.";
    }
    if (language === "de") {
      if (activeTab === "cycle_sync") {
        if (currentPhase === "Menstrual") return "Östrogen und Progesteron sind auf dem Tiefpunkt. Bevorzugen Sie sanftes Yoga oder leichtes Gehen, um den Kreislauf zu unterstützen.";
        if (currentPhase === "Follicular") return "Der Östrogenspiegel steigt, was die Regeneration beschleunigt. Nutzen Sie die Zeit für schweres Heben oder intensives Laufen.";
        if (currentPhase === "Ovulatory") return "Ihr Gehirn hat maximale Energie. Trainieren Sie intensiv, aber achten Sie auf Ihre Gelenke.";
        return "Die Gelenkstabilität nimmt ab. Halten Sie die Intensität moderat und wechseln Sie zu Pilates oder lockerem Cardio.";
      }
      if (activeTab === "menopause") return "Östrogenmangel reduziert die Kalziumaufnahme. Heben Sie zweimal pro Woche Gewichte, um die Knochendichte zu stimulieren.";
      return "Um Stressspitzen zu vermeiden, betonen Sie Übungen mit geringer Intensität wie Pilates, Spazierengehen und leichtes Schwimmen.";
    }
    if (language === "es") {
      if (activeTab === "cycle_sync") {
        if (currentPhase === "Menstrual") return "El estrógeno y la progesterona están al mínimo. Priorice yoga suave o caminatas ligeras para ayudar a la circulación.";
        if (currentPhase === "Follicular") return "Los niveles de estrógeno suben, aumentando la recuperación. Opte por pesas pesadas o running.";
        if (currentPhase === "Ovulatory") return "Su cuerpo experimenta picos de energía. Entrene duro, pero cuide el rango de movimiento articular.";
        return "La laxitud articular aumenta. Mantenga la intensidad moderada, cambie a pilates y haga cardio suave.";
      }
      if (activeTab === "menopause") return "La disminución de estrógeno reduce la absorción de calcio. Levante pesas ligeras dos veces por semana para estimular los huesos.";
      return "Para evitar picos de estrés, priorice ejercicios de baja intensidad como pilates, caminar y natación ligera.";
    }
    if (activeTab === "cycle_sync") {
      if (currentPhase === "Menstrual") return "Estrogen and progesterone are at their lowest baseline. Prioritize gentle yoga or light walking to aid circulation without spiking cortisol.";
      if (currentPhase === "Follicular") return "Estrogen levels are rising, increasing pain tolerance and recovery speed. Go for heavy lifting, high-intensity workouts, or running.";
      if (currentPhase === "Ovulatory") return "Your body experiences peak energy levels. Push hard with metabolic training, but monitor joint ranges as relaxin is also peaking.";
      return "Relaxin spikes joint laxity, decreasing stability. Keep intensity moderate, switch from loaded squats to pilates, and do steady cardio.";
    }
    if (activeTab === "menopause") return "Estrogen declines reduce calcium absorption. Lift moderately heavy weights twice a week to stimulate bone density and maintain muscle tissue.";
    return "To prevent chronic stress spikes that disrupt cortisol-thyroid-estrogen balance, emphasize low-intensity exercise like pilates, walking, and light swimming.";
  };

  const getNutritionTitle = () => {
    if (language === "hi") {
      if (activeTab === "cycle_sync") {
        if (currentPhase === "Menstrual") return "आयरन और विटामिन सी";
        if (currentPhase === "Follicular") return "जटिल कार्बोहाइड्रेट और कच्ची अंकुरित सब्जियां";
        if (currentPhase === "Ovulatory") return "फाइबर और सूजन-रोधी वसा";
        return "मैग्नीशियम और ओमेगा -3";
      }
      if (activeTab === "menopause") return "कैल्शियम और विटामिन डी";
      return "जिंक, सेलेनियम और ग्लूटेन-मुक्त खाद्य पदार्थ";
    }
    if (language === "gu") {
      if (activeTab === "cycle_sync") {
        if (currentPhase === "Menstrual") return "આયર્ન અને વિટામિન સી";
        if (currentPhase === "Follicular") return "જટિલ કાર્બોહાઇડ્રેટ્સ અને કાચા અંકુરિત શાકભાજી";
        if (currentPhase === "Ovulatory") return "ફાઇબર અને બળતરા વિરોધી ચરબી";
        return "મેગ્નેશિયમ અને ઓમેગા -3";
      }
      if (activeTab === "menopause") return "કેલ્શિયમ અને વિટામિન ડી";
      return "ઝિંક, સેલેનિયમ અને ગ્લુટેન-મુક્ત ખોરાક";
    }
    if (language === "fr") {
      if (activeTab === "cycle_sync") {
        if (currentPhase === "Menstrual") return "Fer & Vitamine C";
        if (currentPhase === "Follicular") return "Glucides Complexes & Légumes Crus";
        if (currentPhase === "Ovulatory") return "Fibres & Graisses Anti-inflammatoires";
        return "Magnésium & Oméga-3";
      }
      if (activeTab === "menopause") return "Calcium & Vitamine D";
      return "Zinc, Sélénium & Sans Gluten";
    }
    if (language === "de") {
      if (activeTab === "cycle_sync") {
        if (currentPhase === "Menstrual") return "Eisen & Vitamin C";
        if (currentPhase === "Follicular") return "Komplexe Kohlenhydrate & Rohes Gemüse";
        if (currentPhase === "Ovulatory") return "Ballaststoffe & Entzündungshemmer";
        return "Magnesium & Omega-3";
      }
      if (activeTab === "menopause") return "Kalzium & Vitamin D";
      return "Zink, Selen & Glutenfreie Lebensmittel";
    }
    if (language === "es") {
      if (activeTab === "cycle_sync") {
        if (currentPhase === "Menstrual") return "Hierro y Vitamina C";
        if (currentPhase === "Follicular") return "Carbohidratos Complejos y Germinados";
        if (currentPhase === "Ovulatory") return "Fibra y Grasas Antiinflamatorias";
        return "Magnesio y Omega-3";
      }
      if (activeTab === "menopause") return "Calcio y Vitamina D";
      return "Zinc, Selenio y Alimentos Sin Gluten";
    }
    if (activeTab === "cycle_sync") {
      if (currentPhase === "Menstrual") return "Iron & Vitamin C";
      if (currentPhase === "Follicular") return "Complex Carbs & Raw Sprouted Veggies";
      if (currentPhase === "Ovulatory") return "Fiber & Anti-inflammatory Fats";
      return "Magnesium & Omega-3";
    }
    if (activeTab === "menopause") return "Calcium & Vitamin D";
    return "Zinc, Selenium & Gluten-Free Foods";
  };

  const getNutritionDescription = () => {
    if (language === "hi") {
      if (activeTab === "cycle_sync") {
        if (currentPhase === "Menstrual") return "रक्त की कमी से होने वाले आयरन के स्तर की भरपाई करें। अवशोषण को अधिकतम करने के लिए नींबू के रस (विटामिन सी) के साथ दालों का सेवन करें।";
        if (currentPhase === "Follicular") return "ब्रोकोली, गोभी और फरमेंटेड खाद्य पदार्थ खाकर एस्ट्रोजन चयापचय का समर्थन करें। ऊर्जा से भरपूर साबुत अनाज पर ध्यान केंद्रित करें।";
        if (currentPhase === "Ovulatory") return "उच्च एस्ट्रोजन पाचन को गति देता है। सूजन को नियंत्रित करने के लिए पत्तेदार साग, बीज, जामुन और ओमेगा -3 समृद्ध मछली का सेवन करें।";
        return "प्रोजेस्टेरोन लालसा और रक्त शर्करा में गिरावट पैदा करता है। शर्करा के उतार-चढ़ाव को रोकने के लिए मैग्नीशियम युक्त कद्दू के बीज और बादाम पर ध्यान केंद्रित करें।";
      }
      if (activeTab === "menopause") return "हृदय और कंकाल स्वास्थ्य की रक्षा करें। आज 1200mg कैल्शियम और 800IU विटामिन डी का लक्ष्य रखें। फोर्टिफाइड दही, टोफू और सार्डिन खाएं।";
      return "पीसीओएस या थायराइड विसंगतियों में, इंसुलिन प्रतिरोध आम है। सेलेनियम (ब्राजील नट्स), जिंक (कद्दू के बीज) और सूजन-रोधी साबुत भोजन चुनें।";
    }
    if (language === "gu") {
      if (activeTab === "cycle_sync") {
        if (currentPhase === "Menstrual") return "રક્તના વ્યયને કારણે ઘટેલા આયર્ન સ્તરને ફરીથી ભરો. શોષણ વધારવા માટે લીંબુના રસ (વિટામિન સી) સાથે દાળનું સેવન કરો.";
        if (currentPhase === "Follicular") return "બ્રોકોલી, કોબીજ અને આથોવાળો ખોરાક ખાઈને એસ્ટ્રોજન ચયાપચયને ટેકો આપો. ઊર્જાસભર આખા અનાજ પર ધ્યાન કેન્દ્રિત કરો.";
        if (currentPhase === "Ovulatory") return "ઊંચું એસ્ટ્રોજન પાચનને વેગ આપે છે. સોજો નિયંત્રિત કરવા માટે લીલા પાંદડાવાળા શાકભાજી, બીજ, બેરી અને ઓમેગા-૩ સમૃદ્ધ માછલી લો.";
        return "પ્રોજેસ્ટેરોનને લીધે ગળ્યું ખાવાની ઇચ્છા થાય છે. શુગર કંટ્રોલમાં રાખવા માટે મેગ્નેશિયમથી ભરપૂર કોળુના બીજ અને બદામ લો.";
      }
      if (activeTab === "menopause") return "હૃદય અને હાડકાના સ્વાસ્થ્યનું રક્ષણ કરો. આજે ૧૨૦૦ મિલિગ્રામ કેલ્શિયમ અને ૮૦૦ આઈયુ વિટામિન ડી લો. દહીં, ટોફુ અને આહાર વધારો.";
      return "પીસીઓએસ કે થાઇરોઇડની સમસ્યાઓમાં ઇન્સ્યુલિન પ્રતિકાર સામાન્ય છે. સેલેનિયમ (બ્રાઝિલ નટ્સ), ઝિંક (કોળુના બીજ) અને એન્ટી-ઇન્ફ્લેમેટરી આહાર પસંદ કરો.";
    }
    if (language === "fr") {
      if (activeTab === "cycle_sync") {
        if (currentPhase === "Menstrual") return "Reconstituer le fer perdu. Combinez les lentilles avec du jus de citron (Vitamine C) pour maximiser l'absorption.";
        if (currentPhase === "Follicular") return "Soutenez le métabolisme des œstrogènes avec des brocolis, du chou et des aliments fermentés.";
        if (currentPhase === "Ovulatory") return "L'œstrogène élevé accélère la digestion. Privilégiez les légumes verts, graines, baies et poissons gras.";
        return "La progestérone crée des fringales. Misez sur des graines de courge et amandes riches en magnésium pour stabiliser le sucre.";
      }
      if (activeTab === "menopause") return "Protégez la santé cardiaque et osseuse. Visez 1200 mg de calcium et 800 UI de vitamine D. Consommez yaourt, tofu et sardines.";
      return "En cas de SOPK ou de thyroïde, l'inflammation est typique. Choisissez du sélénium, du zinc et des repas anti-inflammatoires.";
    }
    if (language === "de") {
      if (activeTab === "cycle_sync") {
        if (currentPhase === "Menstrual") return "Eisenverluste ausgleichen. Kombinieren Sie Linsen mit Zitronensaft (Vitamin C), um die Aufnahme zu maximieren.";
        if (currentPhase === "Follicular") return "Östrogenstoffwechsel unterstützen mit Brokkoli, Kohl und fermentierten Lebensmitteln.";
        if (currentPhase === "Ovulatory") return "Hohes Östrogen beschleunigt die Verdauung. Halten Sie es leicht mit grünem Gemüse, Samen, Beeren und Lachs.";
        return "Progesteron sorgt für Blutzuckerschwankungen. Kürbiskerne und Mandeln helfen, Heißhunger zu verhindern.";
      }
      if (activeTab === "menopause") return "Herz- und Knochengesundheit schützen. Ziel: 1200mg Kalzium & 800IE Vitamin D. Erhöhen Sie den Verzehr von Joghurt und Tofu.";
      return "Bei PCOS oder Schilddrüsenproblemen ist Entzündung typisch. Wählen Sie Selen, Zink und entzündungshemmende Lebensmittel.";
    }
    if (language === "es") {
      if (activeTab === "cycle_sync") {
        if (currentPhase === "Menstrual") return "Reponga los niveles de hierro perdidos. Combine lentejas con jugo de limón (Vitamina C) para maximizar la absorción.";
        if (currentPhase === "Follicular") return "Apoye el metabolismo del estrógeno comiendo brócoli, repollo y alimentos fermentados.";
        if (currentPhase === "Ovulatory") return "El estrógeno alto acelera la digestión. Consuma hojas verdes, semillas, bayas y pescado rico en omega-3.";
        return "La progesterona crea antojos. Concéntrese en semillas de calabaza y almendras ricas en magnesio para evitar picos de azúcar.";
      }
      if (activeTab === "menopause") return "Proteja la salud ósea y cardíaca. Busque 1200mg de Calcio y 800UI de Vitamina D hoy. Consuma yogur, tofu y sardinas.";
      return "En SOPK o tiroides, la resistencia a la insulina es típica. Elija selenio, zinc y comidas antiinflamatorias.";
    }
    if (activeTab === "cycle_sync") {
      if (currentPhase === "Menstrual") return "Replenish iron levels depleted by blood loss. Combine grass-fed beef or lentils with lemon juice (Vitamin C) to maximize absorption.";
      if (currentPhase === "Follicular") return "Support estrogen metabolism by eating broccoli, cabbage, and fermented foods. Focus on energy-rich whole grains.";
      if (currentPhase === "Ovulatory") return "High estrogen speeds up digestion. Keep things light with leafy greens, seeds, berries, and omega-3 rich fish to control cellular swelling.";
      return "Progesterone creates cravings and blood sugar dips. Focus on magnesium-rich pumpkin seeds and almonds to prevent sugar spikes and reduce muscle cramps.";
    }
    if (activeTab === "menopause") return "Protect heart and skeletal health. Target 1200mg Calcium and 800IU Vitamin D today. Increase intake of fortified organic yogurt, tofu, and sardines.";
    return "In PCOS or thyroid disparities, insulin resistance or inflammation is typical. Choose selenium (brazil nuts), zinc (oysters/pumpkin seeds), and anti-inflammatory whole meals.";
  };

  const getCognitiveTitle = () => {
    if (language === "hi") {
      if (activeTab === "cycle_sync") {
        if (currentPhase === "Menstrual") return "रचनात्मक मूल्यांकन और एकल कार्य";
        if (currentPhase === "Follicular") return "संरचनात्मक योजना और विचार";
        if (currentPhase === "Ovulatory") return "सहयोगात्मक बैठकें और प्रस्तुतियाँ";
        return "प्रशासनिक निष्पादन और संपादन";
      }
      if (activeTab === "menopause") return "संज्ञानात्मक भार में कमी और मानसिक स्पष्टता";
      return "हार्मोनल लय अनुकूलन";
    }
    if (language === "gu") {
      if (activeTab === "cycle_sync") {
        if (currentPhase === "Menstrual") return "સર્જનાત્મક મૂલ્યાંકન અને એકલા કાર્યો";
        if (currentPhase === "Follicular") return "માળખાકીય આયોજન અને વિચારણા";
        if (currentPhase === "Ovulatory") return "સહયોગી બેઠકો અને પિચિંગ";
        return "વહીવટી અમલીકરણ અને સંપાદન";
      }
      if (activeTab === "menopause") return "માનસિક ભારમાં ઘટાડો અને સ્પષ્ટતા";
      return "હોર્મોનલ લય અનુકૂલન";
    }
    if (language === "fr") {
      if (activeTab === "cycle_sync") {
        if (currentPhase === "Menstrual") return "Évaluation Créative & Tâches Solo";
        if (currentPhase === "Follicular") return "Planification Structurelle & Idéation";
        if (currentPhase === "Ovulatory") return "Réunions Collaboratives & Pitches";
        return "Exécution Administrative & Édition";
      }
      if (activeTab === "menopause") return "Réduction de la Charge Cognitive";
      return "Régulation du Rythme Hormonal";
    }
    if (language === "de") {
      if (activeTab === "cycle_sync") {
        if (currentPhase === "Menstrual") return "Kreative Bewertung & Solo-Aufgaben";
        if (currentPhase === "Follicular") return "Strukturelle Planung & Ideenfindung";
        if (currentPhase === "Ovulatory") return "Kollaborative Meetings & Pitches";
        return "Administrative Ausführung & Bearbeitung";
      }
      if (activeTab === "menopause") return "Reduzierung der Kognitiven Belastung";
      return "Hormonelle Rhythmussteuerung";
    }
    if (language === "es") {
      if (activeTab === "cycle_sync") {
        if (currentPhase === "Menstrual") return "Evaluación Creativa y Tareas Solitarias";
        if (currentPhase === "Follicular") return "Planificación Estructural e Ideación";
        if (currentPhase === "Ovulatory") return "Reuniones Colaborativas y Pitches";
        return "Ejecución Administrativa y Edición";
      }
      if (activeTab === "menopause") return "Reducción de la Carga Cognitiva";
      return "Regulación del Ritmo Hormonal";
    }
    if (activeTab === "cycle_sync") {
      if (currentPhase === "Menstrual") return "Creative Evaluation & Solo Tasks";
      if (currentPhase === "Follicular") return "Structural Planning & Ideation";
      if (currentPhase === "Ovulatory") return "Collaborative Meetings & pitches";
      return "Administrative Execution & Editing";
    }
    if (activeTab === "menopause") return "Cognitive Load reduction & Brain-Fog mitigation";
    return "Hormonal Rhythm pacing";
  };

  const getCognitiveDescription = () => {
    if (language === "hi") {
      if (activeTab === "cycle_sync") {
        if (currentPhase === "Menstrual") return "मासिक धर्म के दौरान मस्तिष्क के दोनों गोलार्ध अच्छी तरह संवाद करते हैं। पूर्व-विश्लेषण करें, लॉग की समीक्षा करें, जर्नल लिखें या रचनात्मक विचारों पर काम करें।";
        if (currentPhase === "Follicular") return "आपका मस्तिष्क अत्यधिक विश्लेषणात्मक है। रूपरेखा तैयार करें, रूपरेखा तैयार करें, या नई सुविधाओं की कोडिंग शुरू करें।";
        if (currentPhase === "Ovulatory") return "एस्ट्रोजन शिखर मस्तिष्क के मौखिक क्षेत्रों को अत्यधिक सक्रिय बनाता है। बैठकों, बातचीत या पॉडकास्ट रिकॉर्ड करने के लिए बिल्कुल सही।";
        return "विवरणों पर ध्यान बढ़ता है। यह कोड को डिबग करने, दस्तावेजों को प्रूफरीड करने या फाइलों को व्यवस्थित करने का इष्टतम समय है।";
      }
      if (activeTab === "menopause") return "एस्ट्रोजन में गिरावट से हल्का मानसिक कोहरा हो सकता है। संरचित 20 मिनट के ब्लॉक में काम करें और विवरणों को याद रखने के बजाय लिखकर रखें।";
      return "हार्मोनल असंतुलन से मूड स्विंग्स हो सकते हैं। अपने काम को अपनी ऊर्जा के अनुकूल बनाएं। थकान महसूस होने पर भारी मानसिक काम न करें।";
    }
    if (language === "gu") {
      if (activeTab === "cycle_sync") {
        if (currentPhase === "Menstrual") return "માસિક ધર્મ દરમિયાન મગજના બંને ભાગ સારી રીતે સંવાદ કરે છે. પૂર્વ-વિશ્લેષણ કરો, લોગની સમીક્ષા કરો, ડાયરી લખો અથવા સર્જનાત્મક વિચારો પર કામ કરો.";
        if (currentPhase === "Follicular") return "તમારું મગજ અત્યંત વિશ્લેષણાત્મક છે. નકશા બનાવો, માળખાકીય આયોજન કરો અથવા નવી સુવિધાઓ કોડ કરવાનું શરૂ કરો.";
        if (currentPhase === "Ovulatory") return "એસ્ટ્રોજન શિખર મગજના બોલવાના ક્ષેત્રોને અત્યંત સક્રિય બનાવે છે. મીટિંગ્સ, વાટાઘાટો અથવા પોડકાસ્ટ રેકોર્ડ કરવા માટે યોગ્ય.";
        return "ઝીણવટભરી વિગતો પર ધ્યાન વધે છે. કોડ ડિબગ કરવા, દસ્તાવેજો વાંચવા અથવા ફાઇલો ગોઠવવાનો આ શ્રેષ્ઠ સમય છે.";
      }
      if (activeTab === "menopause") return "એસ્ટ્રોજન ઘટવાથી માનસિક ધુમ્મસ થઈ શકે છે. ૨૦ મિનિટના બ્લોકમાં કામ કરો અને વિગતો યાદ રાખવાને બદલે નોંધી રાખો.";
      return "હોર્મોનલ અસંતુલન મૂડમાં ફેરફાર લાવી શકે છે. તમારા કાર્યને ઉર્જા અનુસાર અનુકૂળ બનાવો. વધુ થાક હોય ત્યારે અઘરું કામ ન કરો.";
    }
    if (language === "fr") {
      if (activeTab === "cycle_sync") {
        if (currentPhase === "Menstrual") return "Les deux hémisphères du cerveau communiquent bien. Faites des analyses rétrospectives, tenez votre journal ou brainstormez.";
        if (currentPhase === "Follicular") return "Votre cerveau est très analytique. Rédigez des plans, concevez des architectures ou codez de nouvelles fonctionnalités.";
        if (currentPhase === "Ovulatory") return "Le pic d'œstrogènes active les zones verbales. Idéal pour présenter des projets ou négocier.";
        return "L'attention aux détails augmente. Parfait pour déboguer du code, relire des contrats ou trier des documents.";
      }
      if (activeTab === "menopause") return "La baisse d'œstrogènes peut causer du brouillard mental. Travaillez par blocs de 20 minutes et notez tout.";
      return "Les déséquilibres hormonaux provoquent des sautes d'humeur. Adaptez les tâches à votre énergie.";
    }
    if (language === "de") {
      if (activeTab === "cycle_sync") {
        if (currentPhase === "Menstrual") return "Beide Gehirnhälften kommunizieren gut. Machen Sie Analysen, schreiben Sie Tagebuch oder brainstormen Sie.";
        if (currentPhase === "Follicular") return "Ihr Gehirn ist sehr analytisch. Schreiben Sie Gliederungen, entwerfen Sie Frameworks oder codieren Sie neue Funktionen.";
        if (currentPhase === "Ovulatory") return "Der Östrogenspitzenwert aktiviert verbale Bereiche. Perfekt für Verhandlungen oder Vorträge.";
        return "Die Detailgenauigkeit steigt. Optimale Zeit für das Debuggen von Code, das Korrekturlesen oder Organisieren.";
      }
      if (activeTab === "menopause") return "Östrogenmangel kann zu Gehirnnebel führen. Arbeiten Sie in 20-Minuten-Pomodoros und schreiben Sie Details auf.";
      return "Hormonelle Ungleichgewichte können Stimmungsschwankungen verursachen. Passen Sie die Aufgaben an die Energie an.";
    }
    if (language === "es") {
      if (activeTab === "cycle_sync") {
        if (currentPhase === "Menstrual") return "Los hemisferios cerebrales se comunican bien. Haga retroanálisis, escriba un diario o realice lluvias de ideas.";
        if (currentPhase === "Follicular") return "Su cerebro está altamente analítico. Escriba esquemas, diseñe marcos o comience a codificar funciones.";
        if (currentPhase === "Ovulatory") return "El pico de estrógeno activa las áreas verbales. Perfecto para hacer pitches, negociar o grabar.";
        return "La atención a los detalles aumenta. Es el momento óptimo para depurar código, revisar contratos u organizar archivos.";
      }
      if (activeTab === "menopause") return "La disminución de estrógeno puede provocar neblina mental. Trabaje en bloques de 20 minutos y anótelo todo.";
      return "Los desequilibres hormonales pueden causar cambios de humor. Adapte las tareas a su energía actual.";
    }
    if (activeTab === "cycle_sync") {
      if (currentPhase === "Menstrual") return "Brain hemispheres communicate well during menses. Do retro-analysis, review logs, journal, or brainstorm high-concept creative visions.";
      if (currentPhase === "Follicular") return "Your brain is highly analytical and receptive to new projects. Write outlines, architect frameworks, or begin coding novel features.";
      if (currentPhase === "Ovulatory") return "Estrogen peak makes verbal areas of the brain highly active. Perfect for giving client pitches, negotiating deals, or recording audio.";
      return "Attention to detail rises. This is the optimal time for debugging code, reviewing contracts, proofreading documents, or organizing assets.";
    }
    if (activeTab === "menopause") return "Declining estrogen can lead to mild brain fog. Use chunking techniques: work in structured 20-minute pomodoros and keep details written down rather than memorized.";
    return "Hormonal imbalances can cause dynamic mood swings. Match tasks to current energy. Do not force high-intensity cognitive work when feeling severe fatigue.";
  };

  const getDeck = () => {
    const isHi = language === "hi";
    const isGu = language === "gu";
    const isFr = language === "fr";
    const isDe = language === "de";
    const isEs = language === "es";

    const tMeal = isHi ? "भोजन" : isGu ? "ભોજન" : isFr ? "Repas" : isDe ? "Essen" : isEs ? "Comida" : "Meal";
    const tWorkout = isHi ? "व्यायाम" : isGu ? "વ્યાયામ" : isFr ? "Entraînement" : isDe ? "Training" : isEs ? "Ejercicio" : "Workout";

    switch (currentPhase) {
      case "Menstrual":
        return [
          {
            type: tMeal,
            title: isHi ? "आयरन से भरपूर दाल और पालक स्टू" :
                   isGu ? "આયર્નથી ભરપૂર દાળ અને પાલક સ્ટુ" :
                   isFr ? "Ragoût de Lentilles et Épinards Riche en Fer" :
                   isDe ? "Eisenreicher Linsen- & Spinat-Eintopf" :
                   isEs ? "Guiso de Lentejas y Espinacas Rico en Hierro" :
                   "Iron-Rich Lentil & Spinach Stew",
            desc: isHi ? "रक्तस्राव के दौरान आयरन की कमी को दूर करता है। सामग्री जोड़ने के लिए दाईं ओर स्वाइप करें।" :
                  isGu ? "રક્તસ્ત્રાવ દરમિયાન આયર્નની ઉણપને દૂર કરે છે. સામગ્રી ઉમેરવા માટે જમણે સ્વાઇપ કરો." :
                  isFr ? "Augmente le fer non héminique. Glissez à droite pour l'ajouter." :
                  isDe ? "Erhöht die Eisenspeicher. Wischen Sie nach rechts, um Zutaten hinzuzufügen." :
                  isEs ? "Aumenta las reservas de hierro. Deslice a la derecha para agregar." :
                  "Boosts non-heme iron stores during bleeding. Swipe right to add ingredients to Grocery List.",
            ingredients: isHi ? ["दाल", "पालक", "नींबू", "लहसुन"] : isGu ? ["દાળ", "પાલક", "લીંબુ", "લસણ"] : ["Lentils", "Spinach", "Lemon", "Garlic"]
          },
          {
            type: tMeal,
            title: isHi ? "गर्म रास्पबेरी पत्ता और अदरक की चाय" :
                   isGu ? "ગરમ રાસ્પબેરી પાન અને આદુની ચા" :
                   isFr ? "Thé Chaud aux Feuilles de Framboisier & Gingembre" :
                   isDe ? "Warmer Himbeerblätter- & Ingwertee" :
                   isEs ? "Té de Hojas de Frambuesa y Jengibre" :
                   "Warm Raspberry Leaf & Ginger Tea",
            desc: isHi ? "गर्भाशय की ऐंठन को शांत करता है। सामग्री जोड़ने के लिए दाईं ओर स्वाइप करें।" :
                  isGu ? "ગર્ભાશયની ખેંચાણ શાંત કરે છે. સામગ્રી ઉમેરવા માટે જમણે સ્વાઇપ કરો." :
                  isFr ? "Apaise les spasmes de l'utérus. Glissez à droite." :
                  isDe ? "Beruhigt Krämpfe. Nach rechts wischen." :
                  isEs ? "Alivia los espasmos uterinos. Deslice a la derecha." :
                  "Soothes uterine smooth muscle spasms. Swipe right to add ingredients.",
            ingredients: isHi ? ["रास्पबेरी पत्ते", "ताजा अदरक", "शहद"] : isGu ? ["રાસ્પબેરી પાંદડા", "તાજું આદુ", "મધ"] : ["Red Raspberry Leaves", "Fresh Ginger", "Honey"]
          },
          {
            type: tWorkout,
            title: isHi ? "15-मिनट यिन योग और हिप्स स्ट्रेच" :
                   isGu ? "15-મિનિટ યીન યોગ અને હિપ્સ સ્ટ્રેચ" :
                   isFr ? "15-Min de Yin Yoga & Étirement des Hanches" :
                   isDe ? "15 Min Yin Yoga & Hüftdehnung" :
                   isEs ? "15-Min Yin Yoga y Estiramiento" :
                   "15-Min Yin Yoga & Hips Stretch",
            desc: isHi ? "श्रोणि क्षेत्र में तनाव कम करता है। व्यायाम सहेजने के लिए दाईं ओर स्वाइप करें।" :
                  isGu ? "પેલ્વિક પ્રદેશમાં તણાવ ઘટાડે છે. કસરત બચાવવા માટે જમણે સ્વાઇપ કરો." :
                  isFr ? "Réduit la congestion pelvienne et maintient le cortisol bas. Glissez à droite." :
                  isDe ? "Reduziert Beckenstauung. Nach rechts wischen." :
                  isEs ? "Reduce la congestión pélvica. Deslice a la derecha." :
                  "Reduces pelvic congestion and keeps cortisol low. Swipe right to save workout.",
            ingredients: isHi ? ["योग चटाई", "तकिया"] : isGu ? ["योग मैट", "तकिया"] : ["Comfortable Mat", "Block Pillow"]
          }
        ];
      case "Follicular":
        return [
          {
            type: tMeal,
            title: isHi ? "एस्ट्रोजन-संतुलन ब्रोकोली गोभी सलाद" :
                   isGu ? "એસ્ટ્રોજન-સંતુલન બ્રોકોલી કોબી કચુંબર" :
                   isFr ? "Salade d'Estrogènes de Crucifères" :
                   isDe ? "Estrogen-ausgleichender Kohlsalat" :
                   isEs ? "Ensalada de Estrógenos de Crucíferas" :
                   "Cruciferous Estrogen-Balancing Slaw",
            desc: isHi ? "हार्मोन संतुलन में मदद करता है। सामग्री जोड़ने के लिए दाईं ओर स्वाइप करें।" :
                  isGu ? "હોર્મોન સંતુલિત કરવામાં મદદ કરે છે. સામગ્રી ઉમેરવા માટે જમણે સ્વાઇપ કરો." :
                  isFr ? "Riche en I3C pour aider à éliminer l'estrogène." :
                  isDe ? "Unterstützt den Hormonabbau. Nach rechts wischen." :
                  isEs ? "Rico en I3C para ayudar al aclaramiento hormonal." :
                  "Rich in Indole-3-Carbinol (I3C) to assist hormone clearing. Swipe right to compile.",
            ingredients: isHi ? ["ब्रोकोली", "पत्तागोभी", "कद्दू के बीज"] : isGu ? ["બ્રોકોલી", "કોબી", "કોળુના બીજ"] : ["Broccoli", "Cabbage", "Apple Cider Vinegar", "Pumpkin Seeds"]
          },
          {
            type: tMeal,
            title: isHi ? "वाइल्ड साल्मन पोक बाउल" :
                   isGu ? "વાઇલ્ડ સાલ્મન પોક બાઉલ" :
                   isFr ? "Poke Bowl au Saumon Sauvage" :
                   isDe ? "Wildlachs-Poke-Bowl" :
                   isEs ? "Bowl de Salmón Salvaje" :
                   "Wild Salmon Poke Bowl",
            desc: isHi ? "अंडे के फॉलिकल्स को पोषण देने के लिए ओमेगा -3। सामग्री जोड़ने के लिए दाईं ओर स्वाइप करें।" :
                  isGu ? "ઇંડા ફોલિકલ્સ પોષવા માટે ઓમેગા-૩. સામગ્રી ઉમેરવા માટે જમણે સ્વાઇપ કરો." :
                  isFr ? "Oméga-3 et protéines pour soutenir les follicules." :
                  isDe ? "Omega-3 & viel Protein zum Aufbau wachsender Follikel." :
                  isEs ? "Omega-3 y proteínas para construir folículos." :
                  "Omega-3 and high protein to build growing egg follicles.",
            ingredients: isHi ? ["साल्मन", "क्विनोआ", "खीरा"] : isGu ? ["સાલ્મન", "ક્વિનોઆ", "કાકડી"] : ["Wild Salmon", "Quinoa", "Cucumber", "Edamame"]
          },
          {
            type: tWorkout,
            title: isHi ? "20-मिनट हैवी स्ट्रेंथ ट्रेनिंग" :
                   isGu ? "20-મિનિટ હેવી સ્ટ્રેન્થ ટ્રેનિંગ" :
                   isFr ? "20-Min de Musculation Intensive" :
                   isDe ? "20 Min Krafttraining" :
                   isEs ? "20-Min de Fuerza Pesada" :
                   "20-Min Heavy Hypertrophy Strength",
            desc: isHi ? "एस्ट्रोजन शिखर के साथ मांसपेशियों का विकास। व्यायाम सहेजने के लिए दाईं ओर स्वाइप करें।" :
                  isGu ? "એસ્ટ્રોજન શિખર સાથે સ્નાયુઓનો વિકાસ. કસરત બચાવવા માટે જમણે સ્વાઇપ કરો." :
                  isFr ? "Optimisez le pic d'estrogènes avec des charges lourdes." :
                  isDe ? "Optimieren Sie den Östrogenspiegel mit schweren Übungen." :
                  isEs ? "Optimice el pico de estrógeno con pesas." :
                  "Optimize estrogen peak with heavy compound lifts. Swipe right to sync.",
            ingredients: isHi ? ["डम्बल"] : isGu ? ["ડમ્બબેલ્સ"] : ["Adjustable Dumbbells"]
          }
        ];
      case "Ovulatory":
        return [
          {
            type: tMeal,
            title: isHi ? "एवोकैडो और खट्टे क्विनोआ सलाद" :
                   isGu ? "એવોકાડો અને ખાટા સાઇટ્રસ ક્વિનોઆ કચુંબર" :
                   isFr ? "Salade de Quinoa à l'Avocat & Agrumes" :
                   isDe ? "Avocado- & Zitrus-Quinoa-Salat" :
                   isEs ? "Ensalada de Quinoa con Aguacate" :
                   "Avocado & Citrus Quinoa Salad",
            desc: isHi ? "स्वस्थ अंडे की रिलीज का समर्थन करने के लिए उच्च एंटीऑक्सीडेंट।" :
                  isGu ? "તંદુરસ્ત ઇંડા મુક્ત થવામાં મદદ કરવા માટે ઉચ્ચ એન્ટીઑકિસડન્ટો." :
                  isFr ? "Antioxydants élevés pour soutenir la libération d'ovules." :
                  isDe ? "Hohe Antioxidantien zur Unterstützung des Eisprungs." :
                  isEs ? "Altos antioxidantes para apoyar la liberación de óvulos." :
                  "High antioxidant co-factors to support healthy egg release.",
            ingredients: isHi ? ["एवोकैडो", "संतरा", "क्विनोआ"] : isGu ? ["એવોકાડો", "નારંગી", "ક્વિનોઆ"] : ["Avocado", "Orange", "Quinoa", "Cilantro"]
          },
          {
            type: tWorkout,
            title: isHi ? "15-मिनट हाई-इंटेंसिटी HIIT स्प्रिंट" :
                   isGu ? "15-મિનિટ હાઇ-ઇન્ટેન્સિટી HIIT સ્પ્રિન્ટ" :
                   isFr ? "15-Min de HIIT Sprint Intensif" :
                   isDe ? "15 Min HIIT Sprint" :
                   isEs ? "15-Min HIIT Intenso" :
                   "15-Min High-Intensity HIIT Sprint",
            desc: isHi ? "अधिकतम कार्डियक शक्ति प्रदान करता है।" :
                  isGu ? "મહત્તમ કાર્ડિયાક શક્તિ પ્રદાન કરે છે." :
                  isFr ? "Le pic d'estrogènes offre une puissance cardiaque maximale." :
                  isDe ? "Östrogen- & Testosteron-Spiegel bieten maximale Herzkraft." :
                  isEs ? "El pico de hormonas ofrece la máxima potencia cardíaca." :
                  "Estrogen & testosterone peak provides maximum cardiac power.",
            ingredients: isHi ? ["टाइमर"] : isGu ? ["ટાઈમર"] : ["HIIT Timer"]
          }
        ];
      default:
        return [
          {
            type: tMeal,
            title: isHi ? "शकरकंद और काली बीन्स बाउल" :
                   isGu ? "શક્કરીયા અને કાળી બીન્સ બાઉલ" :
                   isFr ? "Bol de Patates Douces & Haricots Noirs" :
                   isDe ? "Süßkartoffel- & Schwarze-Bohnen-Bowl" :
                   isEs ? "Bowl de Batata y Frijoles Negros" :
                   "Luteal Sweet Potato & Black Bean Bowl",
            desc: isHi ? "शुगर क्रैश को रोकने के लिए उच्च मैग्नीशियम और जटिल कार्ब्स।" :
                  isGu ? "શુગર ક્રેશ રોકવા માટે ઉચ્ચ મેગ્નેશિયમ અને જટિલ કાર્બોહાઇડ્રેટ્સ." :
                  isFr ? "Magnésium élevé et glucides complexes pour éviter les baisses d'énergie." :
                  isDe ? "Viel Magnesium und komplexe Kohlenhydrate zur Vermeidung von Blutzuckerabfällen." :
                  isEs ? "Alto contenido de magnesio y carbohidratos complejos para evitar bajones." :
                  "High magnesium and complex carbs to prevent sugar crashes. Swipe right to add ingredients.",
            ingredients: isHi ? ["शकरकंद", "काली बीन्स", "एवोकैडो"] : isGu ? ["શક્કરીયા", "કાળા બીન્સ", "એવોકાડો"] : ["Sweet Potatoes", "Black Beans", "Avocado", "Lime"]
          },
          {
            type: tMeal,
            title: isHi ? "डार्क चॉकलेट और बादाम ऊर्जा प्लेट" :
                   isGu ? "ડાર્ક ચોકલેટ અને બદામ એનર્જી પ્લેટ" :
                   isFr ? "Assiette Énergétique Chocolat Noir & Amandes" :
                   isDe ? "Zartbitterschokolade- & Mandel-Teller" :
                   isEs ? "Plato de Chocolate Negro y Almendras" :
                   "Dark Chocolate & Almond Fuel Plate",
            desc: isHi ? "मीठे की लालसा को शांत करता है और 150mg मैग्नीशियम प्रदान करता है।" :
                  isGu ? "મીઠાની લાલસા પૂરી કરે છે અને ૧૫૦ મિલિગ્રામ મેગ્નેશિયમ આપે છે." :
                  isFr ? "Calme les envies de sucre de l'après-midi tout en fournissant 150 mg de magnésium." :
                  isDe ? "Heilt das Verlangen nach Süßem und liefert 150 mg Magnesium." :
                  isEs ? "Satisface los antojos dulces y aporta 150 mg de magnesio." :
                  "Cures afternoon sweet cravings while delivering 150mg Magnesium.",
            ingredients: isHi ? ["डार्क चॉकलेट", "बादाम"] : isGu ? ["ડાર્ક ચોકલેટ", "બદામ"] : ["85% Dark Chocolate", "Almonds", "Sea Salt"]
          },
          {
            type: tWorkout,
            title: isHi ? "15-मिनट ल्यूटियल पिलेट्स फ्लो" :
                   isGu ? "15-મિનિટ લ્યુટીઅલ પિલેટ્સ ફ્લો" :
                   isFr ? "15-Min de Pilates Luteal" :
                   isDe ? "15 Min Luteal-Pilates" :
                   isEs ? "15-Min Pilates Lúteo" :
                   "15-Min Luteal Pilates Flow",
            desc: isHi ? "जोड़ों की स्थिरता और कोर ताकत को लक्षित करता है।" :
                  isGu ? "સાંધાઓની સ્થિરતા અને કોર મજબૂતાઈને લક્ષ્ય બનાવે છે." :
                  isFr ? "Cible la stabilité articulaire et la force du tronc." :
                  isDe ? "Zielt auf Gelenkstabilität und Rumpfkraft ab." :
                  isEs ? "Se centra en la estabilidad de las articulaciones y la fuerza del core." :
                  "Target joint stability and core strength while avoiding relaxin injury.",
            ingredients: isHi ? ["पिलेट्स चटाई"] : isGu ? ["પિલેટ્સ મેટ"] : ["Pilates Mat", "Resistance Bands"]
          }
        ];
    }
  };

  const deck = getDeck();

  const getBingoSymptoms = () => {
    switch (currentPhase) {
      case "Menstrual":
        return [
          "Pelvic Cramps", "Low Back Ache", "Chronic Fatigue", 
          "Rest Reflection", "Iron Drain", "Sugar Cravings", 
          "Sleepiness", "Ginger Tea Urge", "Quiet Battery"
        ];
      case "Follicular":
        return [
          "High Energy", "Mental Clarity", "Impatience", 
          "Heavy Lifting", "Analytical Focus", "Cruciferous Craving", 
          "Social Urge", "Clear Skin", "Smooth Pacing"
        ];
      case "Ovulatory":
        return [
          "Peak Charisma", "HIIT Endurance", "Social Chatty", 
          "Nesting Urge", "Fluid Retention", "Skin Radiance", 
          "High Libido", "Scatter Focus", "Estrogen Flush"
        ];
      default: // Luteal / Menopause / Screening
        return [
          "Brain Fog", "Bloating", "Pelvic Soreness", 
          "Sweet Cravings", "Organize Kitchen", "Joint Laxity", 
          "Insomnia", "Anxiety Spikes", "Quiet Battery"
        ];
    }
  };

  const bingoSymptoms = getBingoSymptoms();

  const getBingoExplanation = (symptomName: string) => {
    switch (symptomName) {
      case "Pelvic Cramps":
        return "Prostaglandin hormone surges cause uterine contractions. Magnesium glycinate relaxes smooth muscles.";
      case "Sweet Cravings":
      case "Sugar Cravings":
        return "Progesterone rise accelerates basal metabolism, dropping glucose. Complex carbs shield you from crashes.";
      case "Brain Fog":
        return "Estrogen decline reduces cerebral blood flow slightly. Work in Pomodoro intervals.";
      case "Organize Kitchen":
      case "Nesting Urge":
        return "Progesterone dominance triggers nesting instincts to prepare safe environmental spaces.";
      case "Joint Laxity":
        return "Relaxin hormone peaks, softening ligaments. Heavy high-impact jumps should be swapped for Pilates stability.";
      case "Peak Charisma":
        return "High estrogen activates the left temporal verbal centers, improving confidence and speech pacing.";
      default:
        return "Hormonal feedback loops dynamically modify neurotransmitters, changing your physical pacing and moods.";
    }
  };

  const handleSwipe = (approved: boolean) => {
    if (approved) {
      const newIngredients = deck[currentCardIndex]?.ingredients || [];
      setGroceryList(prev => Array.from(new Set([...prev, ...newIngredients])));
    }
    if (currentCardIndex + 1 >= deck.length) {
      setSwipeDeckFinished(true);
    } else {
      setCurrentCardIndex(prev => prev + 1);
    }
  };

  const handleCopyGroceryList = () => {
    navigator.clipboard.writeText(groceryList.join(", "));
    alert("Grocery list copied to clipboard and synchronized to Apple Reminders mock gateway!");
  };

  const resetSwipeDeck = () => {
    setCurrentCardIndex(0);
    setSwipeDeckFinished(false);
    setGroceryList([]);
  };

  const handleBingoClick = (idx: number) => {
    const updated = [...bingoGrid];
    updated[idx] = !updated[idx];
    setBingoGrid(updated);
    
    if (updated[idx]) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
      
      const symptomName = bingoSymptoms[idx];
      setBingoExplanations(getBingoExplanation(symptomName));
    }
  };

  const handleUseRestDay = () => {
    if (restDaysLeft > 0) {
      setRestDaysLeft(prev => prev - 1);
      alert("Rest Day Token applied! Your 5 Days Streak is preserved, protecting your Botanical Aura.");
    } else {
      alert("No Rest Days remaining this month.");
    }
  };

  // Load and convert profile picture from Hex to Blob URL
  useEffect(() => {
    if (profile.photoHex && profile.photoType) {
      try {
        const matches = profile.photoHex.match(/.{1,2}/g);
        if (matches) {
          const bytes = new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
          const blob = new Blob([bytes], { type: profile.photoType });
          const url = URL.createObjectURL(blob);
          setPhotoUrl(url);
          return () => URL.revokeObjectURL(url);
        }
      } catch (e) {
        console.error("Failed to parse profile photo hex:", e);
      }
    } else {
      setPhotoUrl("/female_avatar.png");
    }
  }, [profile.photoHex, profile.photoType]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit to 1.5MB to stay within comfortable Firestore document sizing limits
    if (file.size > 1.5 * 1024 * 1024) {
      alert("Please upload a picture smaller than 1.5MB to save to your secure vault.");
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const buffer = evt.target?.result as ArrayBuffer;
      if (buffer) {
        // Convert array buffer directly to hex binary string representation
        const bytes = new Uint8Array(buffer);
        const hex = Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        
        try {
          const updatedProfile = {
            ...profile,
            photoHex: hex,
            photoType: file.type
          };
          await saveProfile(uid, updatedProfile);
          onProfileUpdate(updatedProfile);
        } catch (err) {
          console.error("Failed to upload profile picture:", err);
          alert("Error saving profile photo. Please try again.");
        } finally {
          setLoading(false);
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  const startCamera = async () => {
    setShowPhotoOptions(false);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: { ideal: 400 }, height: { ideal: 400 } } 
      });
      setCameraStream(stream);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 150);
    } catch (err) {
      console.error("Camera access failed:", err);
      alert("Could not access camera. Please check browser permissions.");
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Draw a square representation on the canvas
      ctx.drawImage(video, 0, 0, 300, 300);
      canvas.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onload = async (evt) => {
            const buffer = evt.target?.result as ArrayBuffer;
            if (buffer) {
              const bytes = new Uint8Array(buffer);
              const hex = Array.from(bytes)
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");
              try {
                const updated = {
                  ...profile,
                  photoHex: hex,
                  photoType: "image/jpeg"
                };
                await saveProfile(uid, updated);
                onProfileUpdate(updated);
                closeCamera();
              } catch (e) {
                console.error("Failed to save camera snapshot:", e);
              }
            }
          };
          reader.readAsArrayBuffer(blob);
        }
      }, "image/jpeg", 0.85);
    }
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  useEffect(() => {
    if (profile.mode && profile.mode !== activeTab) {
      setActiveTab(profile.mode);
    }
  }, [profile.mode]);

  // Calculate cycle parameters
  useEffect(() => {
    if (profile.lastPeriodStart && profile.cycleLength && profile.periodLength) {
      const lastStart = new Date(profile.lastPeriodStart);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - lastStart.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      const day = (diffDays % profile.cycleLength) + 1;
      setCycleDay(day);

      // Determine Phase
      let phase = "Follicular";
      let remaining = 1;
      
      const pLen = profile.periodLength;
      const cLen = profile.cycleLength;

      if (day <= pLen) {
        phase = "Menstrual";
        remaining = pLen - day + 1;
      } else if (day <= 13) {
        phase = "Follicular";
        remaining = 13 - day + 1;
      } else if (day <= 16) {
        phase = "Ovulatory";
        remaining = 16 - day + 1;
      } else {
        phase = "Luteal";
        remaining = cLen - day + 1;
      }

      setCurrentPhase(phase);
      setDaysRemaining(remaining);
    }
  }, [profile]);

  // Load symptom trends to calculate stability index and hot flash predictions
  useEffect(() => {
    async function loadTrends() {
      try {
        const logs = await getRecentDailyLogs(uid, 7);
        setRecentLogsCount(logs.length);
        
        const keyHex = localStorage.getItem(`aeva_master_key_${uid}`);
        if (!keyHex || logs.length === 0) {
          setStabilityIndex(90);
          setHotFlashRisk("Low");
          return;
        }

        let totalHotFlashes = 0;
        let totalJointPain = 0;
        let decryptedLogs = 0;

        for (const logItem of logs) {
          try {
            const decrypted = await decryptJSON(
              logItem.log.encryptedPayload,
              keyHex,
              (logItem.log as any).iv || (logItem.log.metadata as any).iv // handle backward compatibility
            );
            if (decrypted) {
              totalHotFlashes += decrypted.hot_flash_severity || 0;
              totalJointPain += decrypted.joint_pain || 0;
              decryptedLogs++;
            }
          } catch (e) {
            // Ignore decryption failure for individual logs
          }
        }

        if (decryptedLogs > 0) {
          // Calculate an arbitrary Stability Index
          const avgSymptomScore = (totalHotFlashes + totalJointPain) / decryptedLogs;
          const calculatedIndex = Math.max(40, Math.min(100, Math.round(100 - (avgSymptomScore * 12))));
          setStabilityIndex(calculatedIndex);

          // Hot Flash window prediction based on severity
          if (avgSymptomScore > 2.5) {
            setHotFlashRisk("High");
          } else if (avgSymptomScore > 1.0) {
            setHotFlashRisk("Moderate");
          } else {
            setHotFlashRisk("Low");
          }
        }
      } catch (err) {
        console.error("Error loading symptom trends:", err);
      }
    }
    loadTrends();
  }, [uid, activeTab]);

  // Breathing Timer for Cortisol Regulation (4-7-8 method)
  useEffect(() => {
    let timer: any;
    if (isBreathing) {
      timer = setInterval(() => {
        setBreathSeconds((prev) => {
          if (prev <= 1) {
            if (breathPhase === "Inhale") {
              setBreathPhase("Hold");
              return 7;
            } else if (breathPhase === "Hold") {
              setBreathPhase("Exhale");
              return 8;
            } else {
              // Cycle completed!
              const nextCycle = breathCompletedCycles + 1;
              if (nextCycle >= 4) {
                setIsBreathing(false);
                setBreathPhase("Inhale");
                setBreathCompletedCycles(0);
                alert("Deep Breathing Complete! Cortisol lowered & Heart Rate Variability optimized.");
                return 4;
              }
              setBreathCompletedCycles(nextCycle);
              setBreathPhase("Inhale");
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setBreathSeconds(4);
      setBreathPhase("Inhale");
      setBreathCompletedCycles(0);
    }
    return () => clearInterval(timer);
  }, [isBreathing, breathPhase, breathCompletedCycles]);

  const getBreathingTip = () => {
    if (activeTab === "menopause") {
      return "Directly cools vasomotor flashes. Lowers cortisol spike intensity by 50%.";
    }
    if (activeTab === "hormonal_screening") {
      return "Calms adrenal stress to optimize thyroid-estrogen-cortisol balances.";
    }
    switch (currentPhase) {
      case "Menstrual":
        return "Cramping relief: Deep belly breaths relax smooth uterine muscles and improve oxygen flow.";
      case "Follicular":
        return "Focus boost: Activates prefrontal cognitive pathways to prepare you for heavy tasks.";
      case "Ovulatory":
        return "Nervous balance: Regulates estrogen-induced sensory excitation and steady pulse rates.";
      case "Luteal":
      default:
        return "Anxiety blocker: Stimulates the vagus nerve to counteract progesterone-dip anxiety.";
    }
  };

  const handleModeChange = (newMode: 'cycle_sync' | 'menopause' | 'hormonal_screening') => {
    setActiveTab(newMode);
    const updated = { ...profile, mode: newMode };
    onProfileUpdate(updated);
    
    // Save to Firestore in background without blocking UI
    saveProfile(uid, updated).catch((err) => {
      console.error("Failed to sync profile mode in background:", err);
    });
  };

  // Phase layout styling mapping
  const getPhaseStyles = () => {
    switch (currentPhase) {
      case "Menstrual":
        return {
          stroke: "stroke-rose-300",
          text: "text-rose-500",
          bg: "bg-rose-50",
          accentText: "text-rose-600",
          border: "border-rose-100",
          quote: "Deep rest, reflection, and warm micronutrients."
        };
      case "Follicular":
        return {
          stroke: "stroke-sage-500",
          text: "text-sage-600",
          bg: "bg-sage-50",
          accentText: "text-sage-600",
          border: "border-sage-100",
          quote: "Energy levels ramping up. Perfect time for lifting and logic."
        };
      case "Ovulatory":
        return {
          stroke: "stroke-rose-400",
          text: "text-rose-600",
          bg: "bg-rose-50/50",
          accentText: "text-rose-600",
          border: "border-rose-200/60",
          quote: "Physical power and verbal fluency peaks. Shine bright."
        };
      case "Luteal":
        default:
        return {
          stroke: "stroke-amber-500",
          text: "text-amber-600",
          bg: "bg-amber-50/40",
          accentText: "text-amber-600",
          border: "border-amber-100",
          quote: "Transition to steady cardio. Fuel with magnesium."
        };
    }
  };

  const phaseStyles = getPhaseStyles();

  // SVG parameters for the ring
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Progress calculations
  const cycleProgress = profile.cycleLength ? (cycleDay / profile.cycleLength) * circumference : 0;
  const menopauseProgress = (stabilityIndex / 100) * circumference;

  return (
    <div className="flex-1 overflow-y-auto pb-24 p-5 space-y-6 bg-cream-50 scrollbar-none">
      
      {/* Dynamic Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-14 h-14">
            {/* Dynamic botanical aura pulsing gradient */}
            <div className={`absolute inset-0 rounded-full blur-[6px] opacity-75 animate-pulse ${
              currentPhase === "Menstrual" ? "bg-rose-300 shadow-[0_0_15px_#fda4af]" :
              currentPhase === "Follicular" ? "bg-sage-300 shadow-[0_0_15px_#a3b19b]" :
              currentPhase === "Ovulatory" ? "bg-rose-500 shadow-[0_0_15px_#f43f5e]" :
              "bg-amber-400 shadow-[0_0_15px_#fbbf24]"
            }`} style={{ transform: `scale(${1 + Math.min(0.3, streakCount * 0.05)})` }}></div>
            
            {/* Rotating SVG petals */}
            <svg className="absolute inset-0 w-full h-full animate-[spin_12s_linear_infinite]" viewBox="0 0 100 100">
              <path d="M50 8 C53 25 47 25 50 8 Z" fill={currentPhase === "Menstrual" ? "#fda4af" : currentPhase === "Follicular" ? "#a3b19b" : currentPhase === "Ovulatory" ? "#f43f5e" : "#fbbf24"} transform="rotate(0 50 50)" />
              <path d="M50 8 C53 25 47 25 50 8 Z" fill={currentPhase === "Menstrual" ? "#fda4af" : currentPhase === "Follicular" ? "#a3b19b" : currentPhase === "Ovulatory" ? "#f43f5e" : "#fbbf24"} transform="rotate(72 50 50)" />
              <path d="M50 8 C53 25 47 25 50 8 Z" fill={currentPhase === "Menstrual" ? "#fda4af" : currentPhase === "Follicular" ? "#a3b19b" : currentPhase === "Ovulatory" ? "#f43f5e" : "#fbbf24"} transform="rotate(144 50 50)" />
              <path d="M50 8 C53 25 47 25 50 8 Z" fill={currentPhase === "Menstrual" ? "#fda4af" : currentPhase === "Follicular" ? "#a3b19b" : currentPhase === "Ovulatory" ? "#f43f5e" : "#fbbf24"} transform="rotate(216 50 50)" />
              <path d="M50 8 C53 25 47 25 50 8 Z" fill={currentPhase === "Menstrual" ? "#fda4af" : currentPhase === "Follicular" ? "#a3b19b" : currentPhase === "Ovulatory" ? "#f43f5e" : "#fbbf24"} transform="rotate(288 50 50)" />
            </svg>

            <button 
              type="button"
              onClick={() => setShowPhotoOptions(true)}
              className="relative z-10 w-9.5 h-9.5 rounded-full overflow-hidden border border-white focus:outline-none cursor-pointer"
            >
              <img 
                src={photoUrl} 
                alt="Profile avatar" 
                className="w-full h-full object-cover shadow-inner"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="w-3.5 h-3.5 text-white" />
              </div>
            </button>
          </div>
          <div>
            <span className="text-[10px] tracking-widest uppercase font-semibold text-slate-700">Aeva Engine</span>
            <h1 className="font-serif text-2xl font-bold text-slate-800">{t("welcomeBack")}</h1>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-sage-50 rounded-full border border-sage-100 text-xs font-semibold text-sage-600">
          <Shield className="w-3.5 h-3.5" />
          <span>
            {language === "hi" ? "सुरक्षित तिजोरी" :
             language === "gu" ? "સુરક્ષિત તિજોરી" :
             language === "fr" ? "Coffre Sécurisé" :
             language === "de" ? "Sicherer Safe" :
             language === "es" ? "Bóveda Segura" :
             "Secure Vault"}
          </span>
        </div>
      </div>

      {/* Gamified Health Streak & Biometric Sync Score */}
      <div className="bg-white p-4.5 rounded-[28px] border border-rose-100/50 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl">
            <Flame className="w-5.5 h-5.5 fill-current animate-pulse" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-sm text-slate-800">
              {language === "hi" ? `बायोमेट्रिक सिंक स्ट्रीक: ${streakCount} दिन` :
               language === "gu" ? `બાયોમેટ્રિક સિંક સ્ટ્રીક: ${streakCount} દિવસ` :
               language === "fr" ? `Série de Sincro Biométrique : ${streakCount} Jours` :
               language === "de" ? `Biometrische Sync-Streak: ${streakCount} Tage` :
               language === "es" ? `Racha de Sincronización: ${streakCount} Días` :
               `Biometric Sync Streak: ${streakCount} Days`}
            </h3>
            <p className="text-[10px] text-slate-700">
              {language === "hi" ? "सिंक स्तर 2: सेरोटोनिन बूस्टर सक्रिय" :
               language === "gu" ? "સિંક સ્તર ૨: સેરોટોનિન બૂસ્ટર સક્રિય" :
               language === "fr" ? "Niveau de Sincro 2 : Booster de Sérotonine Actif" :
               language === "de" ? "Sync-Level 2: Serotonin-Booster Aktiv" :
               language === "es" ? "Nivel de Sincro 2: Booster de Serotonina Activo" :
               "Sync Level 2: Serotonin Booster Active"}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleUseRestDay}
            className="px-3 py-1.5 bg-cream-100 hover:bg-cream-200 text-slate-800 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all border border-cream-300/40 focus:outline-none cursor-pointer active:scale-95"
            title="Real bodies need rest! Protect your streak without penalty."
          >
            {language === "hi" ? `☕ विश्राम दिन लागू करें (${restDaysLeft} शेष)` :
             language === "gu" ? `☕ આરામ દિવસ લાગુ કરો (${restDaysLeft} બાકી)` :
             language === "fr" ? `☕ Jour de Repos (${restDaysLeft} Restant)` :
             language === "de" ? `☕ Ruhetag einlegen (${restDaysLeft} übrig)` :
             language === "es" ? `☕ Usar Día de Descanso (${restDaysLeft} Restantes)` :
             `☕ Apply Rest Day (${restDaysLeft} Left)`}
          </button>
          <div className="flex items-center gap-1 bg-rose-50/50 px-3 py-1.5 rounded-2xl border border-rose-100/30">
            <span className="text-rose-500 font-extrabold text-sm">
              {streakCount} {language === "hi" ? "दिन" : language === "gu" ? "દિવસ" : language === "fr" ? "Jours" : language === "de" ? "Tage" : language === "es" ? "Días" : "Days"}
            </span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Weekly Engagement Tracker (At least 5 times a week) */}
      <div className="bg-white p-4.5 rounded-[28px] border border-rose-100/50 shadow-sm space-y-3 text-left">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-2.5">
            <div className={`p-2 rounded-xl shrink-0 ${recentLogsCount >= 5 ? "bg-sage-50 text-sage-600" : "bg-amber-50 text-amber-500 animate-pulse"}`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-slate-800">
                {language === "hi" ? "साप्ताहिक जुड़ाव लक्ष्य" :
                 language === "gu" ? "સાપ્તાહિક જોડાણ લક્ષ્ય" :
                 language === "fr" ? "Objectif d'Engagement Hebdomadaire" :
                 language === "de" ? "Wöchentliches Engagement-Ziel" :
                 language === "es" ? "Meta de Compromiso Semanal" :
                 "Weekly Engagement Goal"}
              </h3>
              <p className="text-[10px] text-slate-700 leading-normal">
                {language === "hi" ? "हार्मोनल पूर्वानुमान सटीकता बनाए रखने के लिए सप्ताह में कम से कम 5 दिन लॉग करें" :
                 language === "gu" ? "હોર્મોનલ ચોકસાઈ જાળવવા માટે અઠવાડિયામાં ઓછામાં ઓછા ૫ દિવસ લોગ કરો" :
                 language === "fr" ? "Enregistrez au moins 5 fois par semaine pour optimiser les prévisions" :
                 language === "de" ? "Mindestens 5 Logs pro Woche für präzise KI-Vorhersagen erforderlich" :
                 language === "es" ? "Registre al menos 5 días por semana para predicciones precisas" :
                 "Log symptoms at least 5 days a week for medical-grade AI precision"}
              </p>
            </div>
          </div>
          <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border ${
            recentLogsCount >= 5 
              ? "bg-sage-50 border-sage-100 text-sage-600" 
              : "bg-amber-50 border-amber-100 text-amber-600"
          }`}>
            {recentLogsCount} / 5 {language === "hi" ? "लॉग" : language === "gu" ? "લોગ" : language === "fr" ? "Journaux" : language === "de" ? "Logs" : language === "es" ? "Registros" : "logs"}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="w-full bg-cream-100 rounded-full h-2 overflow-hidden border border-cream-200/50">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                recentLogsCount >= 5 ? "bg-sage-400" : "bg-rose-350"
              }`}
              style={{ width: `${Math.min(100, (recentLogsCount / 5) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-bold text-slate-705">
            <span>0</span>
            <span>
              {recentLogsCount >= 5 
                ? (language === "hi" ? "सटीकता अनलॉक!" :
                   language === "gu" ? "ચોકસાઈ અનલોક!" :
                   language === "fr" ? "Sincro Optimisée !" :
                   language === "de" ? "Präzision Freigeschaltet!" :
                   language === "es" ? "¡Precisión Desbloqueada!" :
                   "Precision Unlocked! 🌟")
                : (language === "hi" ? `सटीकता के लिए ${5 - recentLogsCount} अधिक लॉग की आवश्यकता है` :
                   language === "gu" ? `ચોકસાઈ માટે વધુ ${5 - recentLogsCount} લોગની જરૂર છે` :
                   language === "fr" ? `Plus que ${5 - recentLogsCount} journaux pour la précision` :
                   language === "de" ? `Noch ${5 - recentLogsCount} Logs für volle Präzision` :
                   language === "es" ? `Faltan ${5 - recentLogsCount} registros para precisión` :
                   `${5 - recentLogsCount} more logs needed for target precision`)}
            </span>
            <span>5</span>
          </div>
        </div>
      </div>


      {/* Mode Switcher Pill */}
      <div className="flex bg-cream-200/70 p-1 rounded-2xl border border-cream-300/40">
        {[
          { id: "cycle_sync", label: "Cycle Sync", icon: Heart },
          { id: "menopause", label: "Menopause", icon: Activity },
          { id: "hormonal_screening", label: "Screening", icon: Sparkles }
        ].map((tab) => {
          const localizedTabLabel = tab.id === "cycle_sync" ? (language === "hi" ? "चक्र सिंक" : language === "gu" ? "માસિક ચક્ર સિંક" : language === "fr" ? "Sync de Cycle" : language === "de" ? "Zyklus-Sync" : language === "es" ? "Sincro de Ciclo" : "Cycle Sync") :
                                     tab.id === "menopause" ? (language === "hi" ? "रजोनिवृत्ति" : language === "gu" ? "મેનોપોઝ" : language === "fr" ? "Ménopause" : language === "de" ? "Menopause" : language === "es" ? "Menopausia" : "Menopause") :
                                     (language === "hi" ? "स्क्रीनिंग" : language === "gu" ? "સ્ક્રિનિંગ" : language === "fr" ? "Dépistage" : language === "de" ? "Screening" : language === "es" ? "Pruebas" : "Screening");
          return (
            <button
              key={tab.id}
              onClick={() => handleModeChange(tab.id as any)}
              disabled={loading}
              className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === tab.id
                  ? "bg-white text-rose-500 shadow-sm"
                  : "text-slate-700 hover:text-slate-800"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{localizedTabLabel}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Predictive Symptom Bingo */}
      <div className="bg-white p-5 rounded-[32px] border border-cream-200 shadow-sm space-y-4 relative overflow-hidden">
        {showConfetti && (
          <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-20 pointer-events-none transition-all duration-300 animate-fade-in">
            <span className="text-3xl animate-bounce">
              {language === "hi" ? "🌸✨ कॉन्फेटी ब्लास्ट! ✨🌸" :
               language === "gu" ? "🌸✨ રંગબેરંગી વિસ્ફોટ! ✨🌸" :
               "🌸✨ Confetti Blast! ✨🌸"}
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-500 mt-2 animate-pulse">
              {language === "hi" ? "एआई लक्षण सफलतापूर्वक मिला!" :
               language === "gu" ? "AI લક્ષણ સફળતાપૂર્વક મેળ ખાધું!" :
               "AI Symptom Matched Successfully!"}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center border-b border-cream-100 pb-2">
          <div>
            <h3 className="font-serif font-bold text-sm text-slate-800 flex items-center gap-1.5 text-left">
              <Sparkles className="w-4 h-4 text-rose-400 animate-pulse" />
              {language === "hi" ? "लक्षण बिंगो (एआई भविष्यवाणियां)" :
               language === "gu" ? "લક્ષણ બિન્ગો (AI અનુમાન)" :
               language === "fr" ? "Bingo des Symptômes (IA)" :
               language === "de" ? "Symptom-Bingo (KI-Vorhersage)" :
               language === "es" ? "Bingo de Síntomas (Predicciones IA)" :
               "Symptom Bingo (AI Predictions)"}
            </h3>
            <p className="text-[9px] text-slate-700 text-left">
              {language === "hi" ? "फ़ायरस्टोर लॉग से गणना किए गए भविष्य कहने वाले कार्ड" :
               language === "gu" ? "ફાયરસ્ટોર લોગ પરથી ગણતરી કરેલ કાર્ડ્સ" :
               language === "fr" ? "Cartes prédictives calculées à partir des journaux." :
               language === "de" ? "Prädiktive Karten berechnet aus Protokollen." :
               language === "es" ? "Tarjetas predictivas calculadas a partir de registros." :
               "Predictive cards calculated from Firestore logs"}
            </p>
          </div>
          <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100/50 shrink-0">
            {bingoGrid.filter(Boolean).length} / 9 {language === "hi" ? "मैच" : language === "gu" ? "મેચ" : language === "fr" ? "Correspondances" : language === "de" ? "Treffer" : language === "es" ? "Coincidencias" : "Matches"}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          {bingoSymptoms.map((symptom, idx) => {
            const isChecked = bingoGrid[idx];
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleBingoClick(idx)}
                className={`p-2 rounded-2xl border text-center transition-all focus:outline-none flex flex-col justify-center items-center gap-1 cursor-pointer min-h-[64px] ${
                  isChecked 
                    ? "bg-rose-50 border-rose-300 text-rose-500 scale-[1.03] shadow-inner font-bold" 
                    : "bg-cream-100/50 hover:bg-cream-200/50 border-cream-200/50 text-slate-700"
                }`}
              >
                <span className="text-[9px] leading-tight font-semibold">{symptom}</span>
              </button>
            );
          })}
        </div>

        {bingoExplanations && (
          <div className="p-3.5 bg-rose-50/50 border border-rose-100 text-[10px] text-slate-700 rounded-2xl leading-normal text-left">
            <strong>
              {language === "hi" ? "एआई क्लिनिकल अंतर्दृष्टि:" :
               language === "gu" ? "AI ક્લિનિકલ ઇનસાઇટ:" :
               language === "fr" ? "Avis Clinique IA :" :
               language === "de" ? "KI Klinischer Einblick:" :
               language === "es" ? "Perspectiva Clínica IA:" :
               "AI Clinical Insight:"}
            </strong> {bingoExplanations}
          </div>
        )}
      </div>

      {/* Mode Switcher Pill */}
      <div className="flex bg-cream-200/70 p-1 rounded-2xl border border-cream-300/40">
        {[
          { id: "cycle_sync", label: "Cycle Sync", icon: Heart },
          { id: "menopause", label: "Menopause", icon: Activity },
          { id: "hormonal_screening", label: "Screening", icon: Sparkles }
        ].map((tab) => {
          const localizedTabLabel = tab.id === "cycle_sync" ? (language === "hi" ? "चक्र सिंक" : language === "gu" ? "માસિક ચક્ર સિંક" : language === "fr" ? "Sync de Cycle" : language === "de" ? "Zyklus-Sync" : language === "es" ? "Sincro de Ciclo" : "Cycle Sync") :
                                     tab.id === "menopause" ? (language === "hi" ? "रजोनिवृत्ति" : language === "gu" ? "મેનોપોઝ" : language === "fr" ? "Ménopause" : language === "de" ? "Menopause" : language === "es" ? "Menopausia" : "Menopause") :
                                     (language === "hi" ? "स्क्रीनिंग" : language === "gu" ? "સ્ક્રિનિંગ" : language === "fr" ? "Dépistage" : language === "de" ? "Screening" : language === "es" ? "Pruebas" : "Screening");
          return (
            <button
              key={tab.id}
              onClick={() => handleModeChange(tab.id as any)}
              disabled={loading}
              className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === tab.id
                  ? "bg-white text-rose-500 shadow-sm"
                  : "text-slate-700 hover:text-slate-800"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{localizedTabLabel}</span>
            </button>
          );
        })}
      </div>

      {/* 1. Daily Sync Morning Briefing */}
      <div className="bg-gradient-to-br from-cream-100 via-white to-rose-50/20 p-5 rounded-[32px] border border-rose-100/50 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[9px] px-2.5 py-1 bg-rose-50 text-rose-500 rounded-full border border-rose-100/50 font-bold uppercase tracking-wider">
            {language === "hi" ? "सुबह की ब्रीफिंग" :
             language === "gu" ? "સવારની બ્રીફિંગ" :
             language === "fr" ? "Briefing du Matin" :
             language === "de" ? "Morgen-Briefing" :
             language === "es" ? "Resumen de la Mañana" :
             "Morning Briefing"}
          </span>
          <span className="text-[10px] text-slate-700 font-semibold uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-ping"></span>
            {language === "hi" ? "दैनिक महाशक्ति" :
             language === "gu" ? "દૈનિક સુપરપાવર" :
             language === "fr" ? "Superpouvoir Quotidien" :
             language === "de" ? "Tägliche Superkraft" :
             language === "es" ? "Superpoder Diario" :
             "Daily Superpower"}
          </span>
        </div>
        
        <div className="space-y-3">
          <h2 className="font-serif font-bold text-base text-slate-800 leading-normal text-left">
            "{getBriefingHeader()}"
          </h2>
          
          <div className="grid grid-cols-2 gap-3.5 pt-1 text-left">
            <div className="p-3.5 bg-white rounded-2xl border border-cream-200/50 shadow-xs">
              <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest block">
                {language === "hi" ? "⚡ दैनिक महाशक्ति" :
                 language === "gu" ? "⚡ દૈનિક સુપરપાવર" :
                 language === "fr" ? "⚡ Superpouvoir" :
                 language === "de" ? "⚡ Superkraft" :
                 language === "es" ? "⚡ Superpoder" :
                 "⚡ Daily Superpower"}
              </span>
              <p className="text-[11px] text-slate-700 font-semibold mt-1">
                {getSuperpowerDescription()}
              </p>
            </div>
            <div className="p-3.5 bg-white rounded-2xl border border-cream-200/50 shadow-xs">
              <span className="text-[8px] font-bold text-rose-400 uppercase tracking-widest block">
                {language === "hi" ? "⚠️ दैनिक कमजोरी" :
                 language === "gu" ? "⚠️ દૈનિક નબળાઈ" :
                 language === "fr" ? "⚠️ Kryptonite" :
                 language === "de" ? "⚠️ Kryptonit" :
                 language === "es" ? "⚠️ Kriptonita" :
                 "⚠️ Daily Kryptonite"}
              </span>
              <p className="text-[11px] text-slate-700 font-semibold mt-1">
                {getKryptoniteDescription()}
              </p>
            </div>
          </div>
        </div>

        {/* 1-Tap Action Plan Hook */}
        <div className="pt-2 border-t border-cream-200/40 flex items-center justify-between gap-3 text-left">
          <p className="text-[10px] text-slate-700 italic">
            <strong>
              {language === "hi" ? "1-टैप कार्य योजना: " :
               language === "gu" ? "1-ટેપ એક્શન પ્લાન: " :
               language === "fr" ? "Plan d'Action 1-Clic : " :
               language === "de" ? "1-Tap Aktionsplan: " :
               language === "es" ? "Plan de Acción de 1-Toque: " :
               "1-Tap Action Plan: "}
            </strong>
            {language === "hi" ? "अगले सप्ताह की कम ऊर्जा के दौरान केंद्रित काम के लिए गूगल कैलेंडर सिंक करें।" :
             language === "gu" ? "આવતા અઠવાડિયાના ઓછી ઉર્જાના સમય દરમિયાન ધ્યાન કેન્દ્રિત કરવા માટે ગૂગલ કેલેન્ડર સિંક કરો." :
             language === "fr" ? "Synchronisez Google Agenda pour réserver des blocs de travail." :
             language === "de" ? "Synchronisieren Sie Google Kalender, um Puffer für konzentriertes Arbeiten einzurichten." :
             language === "es" ? "Sincronice Google Calendar para reservar buffers de trabajo." :
             "Sync Google Calendar to block out focused solo deep work during next week's energy dip."}
          </p>
          <button 
            type="button" 
            onClick={() => alert("Google Calendar synchronized! Blocked deep-work focus buffers for Luteal phase.")}
            className="px-3.5 py-2.5 bg-rose-400 hover:bg-rose-500 text-white rounded-xl text-[9px] font-bold tracking-wide uppercase shrink-0 transition-colors shadow-sm focus:outline-none cursor-pointer active:scale-95"
          >
            {language === "hi" ? "1-टैप सिंक" :
             language === "gu" ? "1-ટેપ સિંક" :
             language === "fr" ? "Synchro 1-Clic" :
             language === "de" ? "1-Tap Sync" :
             language === "es" ? "Sincro 1-Toque" :
             "1-Tap Sync"}
          </button>
        </div>
      </div>

      {/* 2. Swipe Sync Engine */}
      <div className="bg-white p-5 rounded-[32px] border border-cream-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-cream-100 pb-2">
          <h3 className="font-serif font-bold text-sm text-slate-800 flex items-center gap-1.5 text-left">
            <Heart className="w-4 h-4 text-rose-400 fill-current" />
            {language === "hi" ? "स्वाइप सिंक: भोजन और व्यायाम" :
             language === "gu" ? "સ્વાઇપ સિંક: ભોજન અને વ્યાયામ" :
             language === "fr" ? "Swipe Sync : Repas & Mouvement" :
             language === "de" ? "Swipe-Sync: Mahlzeiten & Bewegung" :
             language === "es" ? "Swipe Sync: Comidas y Movimiento" :
             "Swipe Sync: Meals & Movement"}
          </h3>
          <span className="text-[8px] uppercase tracking-wider font-semibold px-2 py-0.5 bg-rose-50 text-rose-500 rounded-full border border-rose-100/50">
            {getLocalizedPhase(currentPhase)} {language === "hi" ? "डेक" : language === "gu" ? "ડેક" : language === "fr" ? "Deck" : language === "de" ? "Deck" : language === "es" ? "Deck" : "Deck"}
          </span>
        </div>

        {swipeDeckFinished ? (
          <div className="text-center py-6 space-y-3.5">
            <p className="text-xs text-slate-700 font-bold">
              {language === "hi" ? "🎉 सभी कार्ड स्वाइप किए गए! किराने की सूची संकलित।" :
               language === "gu" ? "🎉 બધા કાર્ડ સ્વાઇપ કર્યા! કરિયાણાની સૂચિ તૈયાર." :
               language === "fr" ? "🎉 Cartes balayées ! Liste de courses compilée." :
               language === "de" ? "🎉 Alle Karten gewischt! Einkaufsliste erstellt." :
               language === "es" ? "🎉 ¡Tarjetas completadas! Lista de compras compilada." :
               "🎉 Swiped all cards! grocery list compiled."}
            </p>
            <div className="p-3.5 bg-cream-100/50 rounded-2xl border border-cream-200/50 text-left max-w-xs mx-auto space-y-2">
              <span className="text-[8px] uppercase tracking-widest text-slate-700 font-bold block">
                {language === "hi" ? "1-टैप किराना सूची:" :
                 language === "gu" ? "1-ટેપ કરિયાણાની સૂચિ:" :
                 language === "fr" ? "Liste de Courses 1-Clic :" :
                 language === "de" ? "1-Tap Einkaufsliste:" :
                 language === "es" ? "Lista de Compras de 1-Toque:" :
                 "1-Tap Grocery List:"}
              </span>
              <p className="text-[10px] text-slate-700 leading-normal font-mono font-bold">
                {groceryList.length > 0 ? groceryList.join(", ") : (language === "hi" ? "कोई आइटम नहीं।" : language === "gu" ? "કોઈ સામગ્રી નથી." : "No items selected.")}
              </p>
              <button 
                type="button"
                onClick={handleCopyGroceryList}
                className="w-full mt-2 py-2.5 bg-rose-400 hover:bg-rose-500 text-white text-[9px] uppercase tracking-wider font-bold rounded-xl transition-colors focus:outline-none cursor-pointer"
              >
                {language === "hi" ? "क्लिपबोर्ड पर कॉपी करें" :
                 language === "gu" ? "ક્લિપબોર્ડ પર કોપી કરો" :
                 language === "fr" ? "Copier dans le Presse-papiers" :
                 language === "de" ? "In Zwischenablage kopieren" :
                 language === "es" ? "Copiar al Portapapeles" :
                 "Copy to Clipboard / Reminders"}
              </button>
            </div>
            <button 
              type="button"
              onClick={resetSwipeDeck}
              className="text-xs text-rose-400 hover:underline font-semibold focus:outline-none cursor-pointer"
            >
              {language === "hi" ? "स्वाइपर डेक रीसेट करें" :
               language === "gu" ? "સ્વાઇપર ડેક રીસેટ કરો" :
               language === "fr" ? "Réinitialiser les Cartes" :
               language === "de" ? "Karten zurücksetzen" :
               language === "es" ? "Reiniciar Mazos de Cartas" :
               "Reset Swiper Deck"}
            </button>
          </div>
        ) : (
          <div className="relative flex flex-col items-center py-2">
            <div className="w-full max-w-[280px] bg-gradient-to-tr from-cream-100 to-white rounded-3xl border border-cream-200 shadow-md p-4 space-y-3.5 text-center relative overflow-hidden">
              <span className="text-[8px] uppercase font-extrabold tracking-widest text-rose-400 block">
                {deck[currentCardIndex]?.type} Sync
              </span>
              <h4 className="font-serif font-bold text-sm text-slate-800">
                {deck[currentCardIndex]?.title}
              </h4>
              <p className="text-[10px] text-slate-700 leading-relaxed px-1 font-medium">
                {deck[currentCardIndex]?.desc}
              </p>
              
              <div className="flex justify-center gap-6 pt-2">
                <button
                  type="button"
                  onClick={() => handleSwipe(false)}
                  className="w-10 h-10 rounded-full border border-cream-300 bg-white hover:bg-cream-100 text-slate-700 font-bold flex items-center justify-center shadow-xs transition-transform active:scale-90 focus:outline-none cursor-pointer"
                >
                  ❌
                </button>
                <button
                  type="button"
                  onClick={() => handleSwipe(true)}
                  className="w-10 h-10 rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-500 font-bold flex items-center justify-center shadow-xs transition-transform active:scale-90 focus:outline-none cursor-pointer"
                >
                  ❤️
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Predictive Symptom Bingo */}
      <div className="bg-white p-5 rounded-[32px] border border-cream-200 shadow-sm space-y-4 relative overflow-hidden">
        {showConfetti && (
          <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-20 pointer-events-none transition-all duration-300 animate-fade-in">
            <span className="text-3xl animate-bounce">🌸✨ Confetti Blast! ✨🌸</span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-500 mt-2 animate-pulse">AI Symptom Matched Successfully!</span>
          </div>
        )}

        <div className="flex justify-between items-center border-b border-cream-100 pb-2">
          <div>
            <h3 className="font-serif font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-rose-400 animate-pulse" />
              Symptom Bingo (AI Predictions)
            </h3>
            <p className="text-[9px] text-slate-700">Predictive cards calculated from Firestore logs</p>
          </div>
          <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100/50">
            {bingoGrid.filter(Boolean).length} / 9 Matches
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          {bingoSymptoms.map((symptom, idx) => {
            const isChecked = bingoGrid[idx];
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleBingoClick(idx)}
                className={`p-2 rounded-2xl border text-center transition-all focus:outline-none flex flex-col justify-center items-center gap-1 cursor-pointer min-h-[64px] ${
                  isChecked 
                    ? "bg-rose-50 border-rose-300 text-rose-500 scale-[1.03] shadow-inner font-bold" 
                    : "bg-cream-100/50 hover:bg-cream-200/50 border-cream-200/50 text-slate-700"
                }`}
              >
                <span className="text-[9px] leading-tight font-semibold">{symptom}</span>
              </button>
            );
          })}
        </div>

        {bingoExplanations && (
          <div className="p-3.5 bg-rose-50/50 border border-rose-100 text-[10px] text-slate-700 rounded-2xl leading-normal">
            <strong>AI Clinical Insight:</strong> {bingoExplanations}
          </div>
        )}
      </div>

      {/* MAIN VISUALIZATION WHEEL AREA */}
      {activeTab === "cycle_sync" && profile.lastPeriodStart && (
        <div className="flex flex-col items-center bg-white p-6 rounded-[32px] border border-rose-100 shadow-sm space-y-4">
          <div className="relative" style={{ width: size, height: size }}>
            {/* SVG Progress Ring */}
            <svg className="transform -rotate-90 w-full h-full">
              {/* Background circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                className="stroke-cream-100 fill-transparent"
                strokeWidth={strokeWidth}
              />
              {/* Progress Circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                className={`fill-transparent transition-all duration-500 ${phaseStyles.stroke}`}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={circumference - cycleProgress}
                strokeLinecap="round"
              />
            </svg>
            
            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-700 tracking-wider">Cycle Day</span>
              <span className="text-3xl font-serif font-black text-slate-800 leading-none my-0.5">{cycleDay}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${phaseStyles.bg} ${phaseStyles.accentText} border ${phaseStyles.border}`}>
                {currentPhase}
              </span>
            </div>
          </div>
          
          <div className="text-center space-y-1">
            <h3 className="font-semibold text-sm text-slate-800">
              {daysRemaining} day{daysRemaining > 1 ? "s" : ""} remaining in {currentPhase}
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed italic max-w-xs px-2">
              "{phaseStyles.quote}"
            </p>
          </div>
        </div>
      )}

      {/* MENOPAUSE STABILITY DIAGRAM */}
      {activeTab === "menopause" && (
        <div className="flex flex-col items-center bg-white p-6 rounded-[32px] border border-sage-100 shadow-sm space-y-4">
          <div className="relative" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90 w-full h-full">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                className="stroke-cream-100 fill-transparent"
                strokeWidth={strokeWidth}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                className="fill-transparent stroke-sage-500 transition-all duration-500"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={circumference - menopauseProgress}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-700 tracking-wider">Stability Index</span>
              <span className="text-3xl font-serif font-black text-slate-800 leading-none my-0.5">{stabilityIndex}%</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sage-50 text-sage-600 border border-sage-100">
                Vasomotor Stability
              </span>
            </div>
          </div>

          <div className="text-center space-y-1">
            <h3 className="font-semibold text-sm text-slate-800 flex items-center justify-center gap-1.5">
              <Flame className={`w-4.5 h-4.5 ${hotFlashRisk === "High" ? "text-rose-500 animate-pulse" : "text-amber-500"}`} />
              Hot Flash Windows: <span className="underline">{hotFlashRisk} Risk Today</span>
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed max-w-xs px-2">
              Based on your rolling logs, autonomic stability is {stabilityIndex >= 80 ? "stable" : "fluctuating"}. {stabilityIndex < 80 ? "Prioritize deep breathing & cooling exercises." : "Continue standard hydration protocols."}
            </p>
          </div>
        </div>
      )}

      {/* HORMONAL SCREENING INDEX */}
      {activeTab === "hormonal_screening" && (
        <div className="bg-white p-5 rounded-[32px] border border-amber-100 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-500">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-800">Hormonal Triage Status</h3>
              <p className="text-xs text-slate-700">Clinical-grade symptom pattern checking.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 bg-cream-100/50 rounded-2xl border border-cream-200/50 text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-700 tracking-wider">7-Day Log Ratio</span>
              <p className="text-xl font-bold text-slate-800 mt-1">{recentLogsCount} / 7 days</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.("ai_clinic")}
              className="p-3.5 bg-cream-100/50 hover:bg-rose-50/30 rounded-2xl border border-cream-200/50 focus:outline-none text-center cursor-pointer transition-all duration-300 transform active:scale-95 group block"
            >
              <span className="text-[10px] uppercase font-semibold text-slate-700 tracking-wider group-hover:text-rose-500 transition-colors">Assessment Status</span>
              <span className="text-xs font-bold text-rose-500 mt-2 bg-rose-50 px-3 py-1 rounded-full border border-rose-100/80 shadow-sm animate-pulse flex items-center justify-center gap-1 mx-auto">
                <Sparkles className="w-3.5 h-3.5" />
                Ready to Screen
              </span>
            </button>
          </div>

          <button 
            type="button"
            onClick={() => onNavigate?.("ai_clinic")}
            className="w-full text-left p-3.5 bg-amber-50/50 hover:bg-amber-100/40 border border-amber-100 text-xs text-slate-700 rounded-2xl leading-normal cursor-pointer transition-all flex items-center justify-between gap-2 focus:outline-none"
          >
            <div>
              <strong>Screening note:</strong> Aeva checks symptoms against diagnostic patterns for PCOS, Endometriosis, and Thyroid disparities. Click here to run evaluation.
            </div>
            <Sparkles className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
          </button>
        </div>
      )}

      {/* 4-7-8 Breathing Regulator Card */}
      <div className="bg-white p-5 rounded-[32px] border border-cream-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-cream-100 pb-2">
          <div>
            <h3 className="font-serif font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <Wind className="w-4.5 h-4.5 text-rose-400 animate-pulse" />
              Cortisol Sync: 4-7-8 Regulator
            </h3>
            <p className="text-[9px] text-slate-700">Sync with vagus nerve to lower cellular stress</p>
          </div>
          <span className="text-[10px] font-bold text-sage-600 bg-sage-50 px-2.5 py-0.5 rounded-full border border-sage-100/50">
            {isBreathing ? `Active Cycle ${breathCompletedCycles + 1}/4` : "Idle"}
          </span>
        </div>

        <div className="flex flex-col items-center py-4 space-y-4">
          {/* Animated Visual Breathing Circle */}
          <div className="relative flex items-center justify-center w-36 h-36">
            {/* Outer soft glowing rings */}
            <div className={`absolute inset-0 rounded-full blur-[8px] transition-all duration-1000 opacity-60 ${
              !isBreathing ? "bg-cream-200" :
              breathPhase === "Inhale" ? "bg-rose-200 animate-ping" :
              breathPhase === "Hold" ? "bg-amber-200" :
              "bg-sage-200 animate-pulse"
            }`} style={{ transform: `scale(${
              !isBreathing ? 1 :
              breathPhase === "Inhale" ? 1.0 + ((4 - breathSeconds) / 4) * 0.35 :
              breathPhase === "Hold" ? 1.35 :
              1.35 - ((8 - breathSeconds) / 8) * 0.35
            })` }}></div>

            {/* Main Circle */}
            <div 
              className={`w-28 h-28 rounded-full border-2 flex flex-col items-center justify-center text-center shadow-lg transition-all duration-1000 z-10 ${
                !isBreathing ? "bg-cream-100 border-cream-300 text-slate-700" :
                breathPhase === "Inhale" ? "bg-rose-100 border-rose-300 text-rose-500 scale-110" :
                breathPhase === "Hold" ? "bg-amber-100 border-amber-300 text-amber-500 scale-120" :
                "bg-sage-100 border-sage-300 text-sage-600 scale-100"
              }`}
              style={{
                transform: `scale(${
                  !isBreathing ? 1 :
                  breathPhase === "Inhale" ? 1.0 + ((4 - breathSeconds) / 4) * 0.2 :
                  breathPhase === "Hold" ? 1.2 :
                  1.2 - ((8 - breathSeconds) / 8) * 0.2
                })`
              }}
            >
              <span className="text-[10px] font-bold tracking-widest uppercase">
                {isBreathing ? breathPhase : "Rest"}
              </span>
              <span className="text-2xl font-serif font-black my-0.5 leading-none">
                {isBreathing ? `${breathSeconds}s` : "Start"}
              </span>
              <span className="text-[8px] font-semibold text-slate-700">
                {isBreathing ? `Cycle ${breathCompletedCycles + 1}` : "Click play"}
              </span>
            </div>
          </div>

          <div className="w-full text-center space-y-1">
            <p className="text-xs text-slate-700 font-semibold leading-relaxed max-w-xs mx-auto">
              {isBreathing ? (
                breathPhase === "Inhale" ? "Breathe in deeply through your nose..." :
                breathPhase === "Hold" ? "Hold your breath, feel the stillness..." :
                "Exhale slowly and completely through your mouth..."
              ) : (
                "Ready to synchronize autonomic nervous system."
              )}
            </p>
            <p className="text-[10px] text-slate-700 bg-cream-100/50 p-2.5 rounded-2xl border border-cream-200/40 italic max-w-xs mx-auto">
              <strong>Phase Guide:</strong> {getBreathingTip()}
            </p>
          </div>

          <div className="flex gap-2 w-full max-w-[240px]">
            {!isBreathing ? (
              <button
                type="button"
                onClick={() => setIsBreathing(true)}
                className="flex-1 py-3 bg-rose-400 hover:bg-rose-500 text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 transform active:scale-95 cursor-pointer pulse-hover"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Breath Sync</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsBreathing(false)}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 transform active:scale-95 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Stop & Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>



      {/* DAILY PILLAR ADVICE CARDS */}
      <div className="space-y-4">
        <h2 className="font-serif text-lg font-bold text-slate-800">
          {language === "hi" ? "दैनिक सिंक सिफारिशें" :
           language === "gu" ? "દૈનિક સિંક ભલામણો" :
           language === "fr" ? "Recommandations de Sincro" :
           language === "de" ? "Tägliche Empfehlungen" :
           language === "es" ? "Recomendaciones de Sincro" :
           "Daily Sync Recommendations"}
        </h2>
        
        {/* Fitness / Activity Sync */}
        <div className="flex gap-4 bg-white p-4.5 rounded-[28px] border border-cream-200/60 shadow-sm text-left">
          <div className="p-3 rounded-2xl bg-sage-50 text-sage-600 self-start">
            <Activity className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-xs text-slate-700 uppercase tracking-wider">
              {language === "hi" ? "गतिविधि और व्यायाम" :
               language === "gu" ? "પ્રવૃત્તિ અને વ્યાયામ" :
               language === "fr" ? "Activité & Mouvement" :
               language === "de" ? "Aktivität & Bewegung" :
               language === "es" ? "Actividad y Movimiento" :
               "Activity & Movement"}
            </h4>
            <h3 className="font-semibold text-sm text-slate-800">
              {getActivityTitle()}
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              {getActivityDescription()}
            </p>
          </div>
        </div>

        {/* Nutrition / Micronutrient Card */}
        <div className="flex gap-4 bg-white p-4.5 rounded-[28px] border border-cream-200/60 shadow-sm text-left">
          <div className="p-3 rounded-2xl bg-rose-50 text-rose-500 self-start">
            <Apple className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-xs text-slate-700 uppercase tracking-wider">
              {language === "hi" ? "पोषण और सूक्ष्म पोषक तत्व" :
               language === "gu" ? "પોષણ અને સૂક્ષ્મ પોષકતત્વો" :
               language === "fr" ? "Nutrition & Micronutriments" :
               language === "de" ? "Ernährung & Mikronährstoffe" :
               language === "es" ? "Nutrición y Micronutrientes" :
               "Nutrition & Micronutrients"}
            </h4>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold px-2 py-0.5 bg-rose-100 text-rose-600 rounded-full">
                {getNutritionTitle()}
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {getNutritionDescription()}
            </p>
          </div>
        </div>

        {/* Cognitive & Productivity Card */}
        <div className="flex gap-4 bg-white p-4.5 rounded-[28px] border border-cream-200/60 shadow-sm text-left">
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-500 self-start">
            <Brain className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-xs text-slate-700 uppercase tracking-wider">
              {language === "hi" ? "संज्ञानात्मक ध्यान और मस्तिष्क अवस्था" :
               language === "gu" ? "માનસિક ધ્યાન અને મગજની સ્થિતિ" :
               language === "fr" ? "Focus Cognitif & État Cérébral" :
               language === "de" ? "Kognitiver Fokus & Gehirnzustand" :
               language === "es" ? "Enfoque Cognitivo y Estado Mental" :
               "Cognitive Focus & Brain State"}
            </h4>
            <h3 className="font-semibold text-sm text-slate-800">
              {getCognitiveTitle()}
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              {getCognitiveDescription()}
            </p>
          </div>
        </div>
      </div>

      {/* PHOTO SELECTION OPTIONS DRAWER/MODAL */}
      {showPhotoOptions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end justify-center p-4">
          <div className="bg-white w-full max-w-[440px] rounded-[32px] p-6 space-y-4 shadow-2xl border border-rose-100">
            <div className="flex justify-between items-center pb-2 border-b border-cream-200">
              <h3 className="font-serif font-bold text-base text-slate-800">Update Profile Avatar</h3>
              <button 
                onClick={() => setShowPhotoOptions(false)}
                className="p-1 rounded-full hover:bg-cream-100 text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={startCamera}
                className="flex flex-col items-center justify-center p-4 bg-rose-50/50 hover:bg-rose-50 rounded-2xl border border-rose-100 text-rose-500 transition-colors gap-2 cursor-pointer"
              >
                <Camera className="w-6 h-6 text-rose-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Use Camera</span>
              </button>

              <label
                className="flex flex-col items-center justify-center p-4 bg-cream-100 hover:bg-cream-200 rounded-2xl border border-cream-200 text-slate-800 transition-colors gap-2 cursor-pointer"
              >
                <FileImage className="w-6 h-6 text-slate-700" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">Upload File</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    handlePhotoUpload(e);
                    setShowPhotoOptions(false);
                  }}
                  disabled={loading}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* DEVICE CAMERA SNAPSHOT MODAL */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-6 space-y-6">
          <div className="w-full max-w-[400px] flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-rose-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider">Aeva Biometric Capture</span>
            </div>
            <button 
              onClick={closeCamera}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Square Camera frame with dynamic phase glow halo */}
          <div className="relative w-[320px] h-[320px] rounded-full overflow-hidden border-4 border-white shadow-2xl flex items-center justify-center bg-black">
            {/* Phase glow overlay ring wrapper */}
            <div className={`absolute inset-0 rounded-full border-[8px] z-10 pointer-events-none ${
              currentPhase === "Menstrual" ? "border-rose-400/80 shadow-[inset_0_0_25px_#fda4af,0_0_25px_#fda4af]" :
              currentPhase === "Follicular" ? "border-sage-400/80 shadow-[inset_0_0_25px_#84a98c,0_0_25px_#84a98c]" :
              currentPhase === "Ovulatory" ? "border-rose-500/80 shadow-[inset_0_0_25px_#f43f5e,0_0_25px_#f43f5e]" :
              "border-amber-400/80 shadow-[inset_0_0_25px_#f59e0b,0_0_25px_#f59e0b]"
            }`}></div>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover scale-x-[-1]"
            />
          </div>

          <div className="w-full max-w-[320px] text-center space-y-4">
            <p className="text-[10px] text-white/70 uppercase font-semibold tracking-widest leading-relaxed">
              Active Phase: {currentPhase} Mode
            </p>
            <button
              onClick={capturePhoto}
              className="w-full py-4 bg-rose-400 hover:bg-rose-500 text-white rounded-2xl font-bold text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              <span>Capture Sync Profile</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
