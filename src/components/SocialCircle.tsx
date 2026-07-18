"use client";

import React, { useState, useEffect } from "react";
import { getSocialPosts, saveSocialPost, reactToPost, SocialPost, UserProfile } from "@/lib/services";
import { Users, Send, Heart, Flame, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { TRANSLATIONS, LanguageCode } from "@/lib/translations";

interface SocialCircleProps {
  uid: string;
  userEmail: string;
  profile: UserProfile;
  language?: any;
}

export default function SocialCircle({ uid, userEmail, profile, language = "en" }: SocialCircleProps) {
  const t = (key: string) => {
    return TRANSLATIONS[language as LanguageCode]?.[key] || TRANSLATIONS["en"]?.[key] || key;
  };

  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [streakCount, setStreakCount] = useState(5); // Gamified default
  const [syncMembers, setSyncMembers] = useState(12);

  const userMode = profile.mode || "cycle_sync";

  const getModeFriendlyName = () => {
    if (language === "hi") {
      switch (userMode) {
        case "cycle_sync": return "चक्र सिंकिंग सर्कल";
        case "menopause": return "रजोनिवृत्ति सहायता सर्कल";
        case "hormonal_screening": return "हार्मोनल कल्याण सर्कल";
        default: return "ऐवा सर्कल";
      }
    }
    if (language === "gu") {
      switch (userMode) {
        case "cycle_sync": return "ચક્ર સિંકિંગ સર્કલ";
        case "menopause": return "મેનોપોઝ સપોર્ટ સર્કલ";
        case "hormonal_screening": return "હોર્મોનલ વેલનેસ સર્કલ";
        default: return "એવા સર્કલ";
      }
    }
    switch (userMode) {
      case "cycle_sync":
        return "Cycle Syncing Circle";
      case "menopause":
        return "Menopause Support Circle";
      case "hormonal_screening":
        return "Hormonal Wellness Circle";
      default:
        return "Aeva Circle";
    }
  };

  const getModeFriendlyDescription = () => {
    if (language === "hi") {
      switch (userMode) {
        case "cycle_sync": return "आप उन महिलाओं से जुड़े हैं जो अपने सक्रिय चरणों के लिए फिटनेस, पोषण और मनोदशा को सिंक कर रही हैं।";
        case "menopause": return "आप उन महिलाओं से जुड़े हैं जो रजोनिवृत्ति स्थिरता, नींद और हॉट फ़्लैशेस का प्रबंधन कर रही हैं।";
        case "hormonal_screening": return "आप उन महिलाओं से जुड़े हैं जो पीसीओएस, थायराइड और एंडो असमानताओं का मूल्यांकन कर रही हैं।";
        default: return "गुमनाम रूप से सलाह साझा करें और एक दूसरे का समर्थन करें।";
      }
    }
    if (language === "gu") {
      switch (userMode) {
        case "cycle_sync": return "તમે એવી મહિલાઓ સાથે જોડાયેલા છો જેઓ તેમના સક્રિય તબક્કા માટે ફિટનેસ, પોષણ અને મૂડને સિંક કરી રહી છે.";
        case "menopause": return "તમે એવી મહિલાઓ સાથે જોડાયેલા છો જેઓ મેનોપોઝ સ્થિરતા, ઊંઘ અને હોટ ફ્લેશનું સંચાલન કરી રહી છે.";
        case "hormonal_screening": return "તમે પીસીઓએસ, થાઇરોઇડ અને એન્ડોની અસમાનતાઓ માટે હોર્મોનલ બાયોમાર્કર્સનું મૂલ્યાંકન કરતી મહિલાઓ સાથે જોડાયેલા છો.";
        default: return "અનામી રીતે સલાહ શેર કરો અને એકબીજાને ટેકો આપો.";
      }
    }
    switch (userMode) {
      case "cycle_sync":
        return "You are connected with women synchronizing fitness, nutrition, and mood to their active cycle phases.";
      case "menopause":
        return "You are connected with women managing menopause stability, sleep optimization, and hot flashes.";
      case "hormonal_screening":
        return "You are connected with women evaluating hormonal biomarkers for PCOS, thyroid, and endo disparities.";
      default:
        return "Share advice and support each other anonymously.";
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const fetched = await getSocialPosts(userMode);
      setPosts(fetched);
      setSyncMembers(10 + Math.floor(Math.random() * 8));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [userMode]);

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || submitting) return;

    setSubmitting(true);
    try {
      await saveSocialPost(
        uid, 
        userEmail, 
        userMode, 
        newPostContent.trim(), 
        profile.photoHex, 
        profile.photoType
      );
      setNewPostContent("");
      await loadPosts();
      setStreakCount(prev => prev + 1);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReaction = async (postId: string, reactionType: "likes" | "hugs") => {
    setPosts(prevPosts => 
      prevPosts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            [reactionType]: p[reactionType] + 1
          };
        }
        return p;
      })
    );

    try {
      await reactToPost(postId, reactionType);
    } catch (e) {
      console.error(e);
    }
  };

  const renderAvatar = (post: SocialPost) => {
    if (post.photoHex && post.photoType) {
      try {
        const matches = post.photoHex.match(/.{1,2}/g);
        if (matches) {
          const bytes = new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
          const blob = new Blob([bytes], { type: post.photoType });
          const url = URL.createObjectURL(blob);
          
          return (
            <img 
              src={url} 
              alt={post.username} 
              className="w-10 h-10 rounded-full object-cover border border-rose-100"
              onLoad={() => URL.revokeObjectURL(url)}
            />
          );
        }
      } catch (e) {
        // Fallback
      }
    }
    
    return (
      <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center font-bold text-sm border border-rose-200">
        {post.username.substring(0, 2).toUpperCase()}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 p-5 space-y-6 bg-cream-50 scrollbar-none flex flex-col h-full text-left">
      
      {/* Header */}
      <div>
        <span className="text-[10px] tracking-widest uppercase font-semibold text-slate-700">
          {language === "hi" ? "सामुदायिक बैठक" :
           language === "gu" ? "સામુદાયિક બેઠક" :
           language === "fr" ? "Rassemblement Communautaire" :
           language === "de" ? "Gemeinschaftstreffen" :
           language === "es" ? "Reunión de la Comunidad" :
           "Community Gathering"}
        </span>
        <h1 className="font-serif text-2xl font-bold text-slate-800">{t("circle")}</h1>
      </div>

      {/* Gamified Social Streaks Panel */}
      <div className="bg-white p-5 rounded-[28px] border border-rose-100 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl animate-pulse">
            <Flame className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-sm text-slate-805">
              {language === "hi" ? `लगातार सिंक: ${streakCount} दिन!` :
               language === "gu" ? `સિંક સ્ટ્રીક: ${streakCount} દિવસ!` :
               language === "fr" ? `Série de Sincro : ${streakCount} Jours !` :
               language === "de" ? `Sync-Streak: ${streakCount} Tage!` :
               language === "es" ? `Racha de Sincro: ¡${streakCount} Días!` :
               `Sync Streak: ${streakCount} Days!`}
            </h3>
            <p className="text-[10px] text-slate-700">{getModeFriendlyName()}</p>
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="text-lg font-bold text-rose-500">{syncMembers}</span>
          <span className="text-[9px] text-slate-700 font-semibold uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-sage-500 rounded-full animate-ping"></span>
            Online
          </span>
        </div>
      </div>

      {/* Circle Description Info Card */}
      <div className="p-4 bg-cream-200/50 rounded-2xl border border-cream-300/30 flex gap-2.5">
        <Sparkles className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-800">{getModeFriendlyName()}</h4>
          <p className="text-[10px] text-slate-700 leading-normal">
            {getModeFriendlyDescription()}
          </p>
        </div>
      </div>

      {/* Inner Circle Aggregated Validation Header */}
      <div className="bg-rose-50/40 p-4 rounded-[28px] border border-rose-100/50 text-xs text-rose-700 leading-normal flex gap-3 items-center">
        <Users className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
        <p className="font-medium text-slate-700 text-[11px]">
          {language === "hi" ? "आप अकेले नहीं हैं। आपके सक्रिय चरण प्रोफ़ाइल से मेल खाने वाली 4,218 अन्य महिलाएं भी इस समय थकान महसूस कर रही हैं।" :
           language === "gu" ? "તમે એકલા નથી. તમારી પ્રોફાઇલ સાથે મેળ ખાતી અન્ય 4,218 મહિલાઓ પણ આ સમયે થાક અનુભવી રહી છે." :
           language === "fr" ? "Vous n'êtes pas seule. 4 218 autres femmes correspondant à votre profil connaissent la même fatigue aujourd'hui." :
           language === "de" ? "Sie sind nicht allein. 4.218 andere Frauen mit Ihrem Zyklusprofil fühlen sich heute ebenfalls müde." :
           language === "es" ? "No estás sola. Otras 4,218 mujeres que coinciden con su perfil también experimentan fatiga hoy." :
           "You are not alone. 4,218 other women matching your active phase profile are experiencing high fatigue and sugar cravings right now."}
        </p>
      </div>

      {/* Post Composer Form */}
      <form onSubmit={handlePostSubmit} className="bg-white p-4.5 rounded-[28px] border border-cream-200 shadow-sm space-y-3">
        <textarea
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          placeholder={
            language === "hi" ? "गुमनाम रूप से अपने सर्कल में साझा करें..." :
            language === "gu" ? "અનામી રીતે તમારા સર્કલમાં શેર કરો..." :
            language === "fr" ? "Partagez anonymement avec votre Cercle..." :
            language === "de" ? "Teilen Sie anonym mit Ihrem Kreis..." :
            language === "es" ? "Comparta de forma anónima con su Círculo..." :
            "Share anonymously with your Circle..."
          }
          rows={3}
          maxLength={300}
          className="w-full p-3.5 bg-cream-100/50 rounded-2xl border border-cream-200/50 focus:border-rose-300 focus:outline-none text-xs resize-none transition-all placeholder:text-slate-700/60 text-slate-800"
        />
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-slate-700 font-semibold">{300 - newPostContent.length} characters left</span>
          <button
            type="submit"
            disabled={submitting || !newPostContent.trim()}
            className="px-4 py-2.5 bg-rose-400 hover:bg-rose-500 text-white rounded-xl font-semibold text-xs transition-all shadow-sm flex items-center gap-1.5 disabled:bg-rose-300 active:scale-95 cursor-pointer focus:outline-none"
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>
              {language === "hi" ? "गुमनाम साझा करें" :
               language === "gu" ? "અનામી શેર કરો" :
               language === "fr" ? "Partager Anonymement" :
               language === "de" ? "Anonym teilen" :
               language === "es" ? "Compartir Anónimamente" :
               "Share Anonymously"}
            </span>
          </button>
        </div>
      </form>

      {/* Feed list */}
      <div className="flex-1 space-y-4">
        <h2 className="font-serif text-lg font-bold text-slate-850">
          {language === "hi" ? "सर्कल बातचीत" :
           language === "gu" ? "સર્કલ વાર્તાલાપ" :
           language === "fr" ? "Conversations du Cercle" :
           language === "de" ? "Kreis-Gespräche" :
           language === "es" ? "Conversaciones del Círculo" :
           "Circle Conversations"}
        </h2>
        
        {loading && posts.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-7 h-7 text-rose-400 animate-spin" />
            <p className="text-xs text-slate-700">Loading your Circle Feed...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-cream-200 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-semibold text-xs text-slate-800">Your Circle is Quiet</h3>
              <p className="text-[10px] text-slate-700">Be the first to share an anonymous health post or question!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            {posts.map((post) => (
              <div 
                key={post.id} 
                className="bg-white p-4.5 rounded-[28px] border border-cream-200/60 shadow-sm space-y-3.5 transform transition-all duration-300 hover:scale-[1.01]"
              >
                {/* Header author info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {renderAvatar(post)}
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">@{post.username}</h4>
                      <span className="text-[8px] bg-rose-50 text-rose-500 font-semibold px-2 py-0.5 rounded-full border border-rose-100/50 uppercase tracking-wider">
                        {post.userMode === "cycle_sync" ? "Cycle Sync" : post.userMode === "menopause" ? "Menopause" : "Screening"}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-700">
                    {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Content */}
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {post.content}
                </p>

                {/* Footer Reactions */}
                <div className="flex items-center gap-4 pt-1 border-t border-cream-100/50">
                  <button 
                    onClick={() => handleReaction(post.id, "likes")}
                    className="flex items-center gap-1 text-[10px] font-bold text-slate-700 hover:text-amber-500 transition-colors focus:outline-none cursor-pointer"
                  >
                    <Flame className="w-4 h-4 text-amber-500 fill-current hover:scale-110 transition-transform" />
                    <span>Energy Boost ({post.likes})</span>
                  </button>

                  <button 
                    onClick={() => handleReaction(post.id, "hugs")}
                    className="flex items-center gap-1 text-[10px] font-bold text-slate-700 hover:text-rose-500 transition-colors focus:outline-none cursor-pointer"
                  >
                    <Heart className="w-4 h-4 text-rose-400 fill-rose-100 hover:fill-rose-400 hover:scale-110 transition-transform" />
                    <span>Virtual Heat Pack ({post.hugs})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
