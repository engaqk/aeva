import { auth, db, isFirebaseConfigured } from "./firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs,
  query,
  orderBy,
  limit,
  Timestamp,
  addDoc,
  where
} from "firebase/firestore";

// Helper to wrap promises with a timeout to prevent hanging on misconfigured Firestore databases
function withTimeout<T>(promise: Promise<T>, ms = 10000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Firestore database connection timed out"));
    }, ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}


export interface UserProfile {
  mode: 'cycle_sync' | 'menopause' | 'hormonal_screening';
  cycleLength?: number;
  periodLength?: number;
  lastPeriodStart?: string; // YYYY-MM-DD
  encryptedMedicalMetadata?: string;
  photoHex?: string;
  photoType?: string;
  demographics?: {
    name: string;
    city: string;
    country: string;
    mobile: string;
    gender: string;
    dob: string;
    photoHex?: string;
    photoType?: string;
  };
  demographicsFilled?: boolean;
}

export interface DailyLogData {
  encryptedPayload: string;
  metadata: {
    phaseContext: string;
    updatedTimestamp: string | number | Date | any;
    iv?: string;
  };
}

export interface AssessmentData {
  encryptedAssessmentData: string;
  screeningStatus: 'pending_analysis' | 'reviewed';
  generatedAt: string | number | Date | any;
  iv?: string;
}

// Subscribes to Auth State Changes
export function subscribeAuth(callback: (user: { uid: string; email: string | null } | null) => void) {
  if (isFirebaseConfigured && auth) {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        callback({ uid: user.uid, email: user.email });
      } else {
        callback(null);
      }
    });
  } else {
    // Local Mode: check localStorage
    const checkLocalUser = () => {
      const localUser = localStorage.getItem("aeva_user");
      if (localUser) {
        try {
          callback(JSON.parse(localUser));
        } catch {
          callback(null);
        }
      } else {
        callback(null);
      }
    };
    
    checkLocalUser();
    // Simulate unsubscribe for Local Mode
    window.addEventListener("aeva_auth_change", checkLocalUser);
    return () => {
      window.removeEventListener("aeva_auth_change", checkLocalUser);
    };
  }
}

// Local mock sign-in / sign-up helpers
function triggerLocalAuthChange() {
  window.dispatchEvent(new Event("aeva_auth_change"));
}

export async function signUp(email: string, pass: string) {
  if (isFirebaseConfigured && auth) {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    return { uid: cred.user.uid, email: cred.user.email };
  } else {
    // Local Mode
    const uid = "local_user_" + Math.random().toString(36).substring(2, 9);
    const user = { uid, email };
    localStorage.setItem("aeva_user", JSON.stringify(user));
    // Create initial empty profile
    const initialProfile: UserProfile = { mode: "cycle_sync" };
    localStorage.setItem(`aeva_profile_${uid}`, JSON.stringify(initialProfile));
    triggerLocalAuthChange();
    return user;
  }
}

export async function signIn(email: string, pass: string) {
  const lowerEmail = email.toLowerCase();
  
  if (isFirebaseConfigured && auth) {
    const targetEmail = (lowerEmail === "admin") ? "admin@aeva.com" : lowerEmail;
    try {
      try {
        const cred = await signInWithEmailAndPassword(auth, targetEmail, pass);
        return { uid: cred.user.uid, email: cred.user.email };
      } catch (err: any) {
        // If administrator credentials, auto-create the user inside Firebase Auth if missing
        if (
          (targetEmail === "admin@aeva.com" && pass === "admin53") &&
          (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential" || err.code === "auth/cannot-find-user")
        ) {
          console.log("Admin account not found in Firebase. Auto-creating admin user...");
          const cred = await createUserWithEmailAndPassword(auth, targetEmail, pass);
          return { uid: cred.user.uid, email: cred.user.email };
        }
        throw err;
      }
    } catch (e: any) {
      // Local fallback in case Firebase is completely blocked
      if ((lowerEmail === "admin" || lowerEmail === "admin@aeva.com") && pass === "admin53") {
        console.warn("Firebase admin sign-in failed, falling back to local simulation:", e.message);
        const user = { uid: "evaluation_admin_uid", email: "admin@aeva.com" };
        localStorage.setItem("aeva_user", JSON.stringify(user));
        triggerLocalAuthChange();
        return user;
      }
      throw e;
    }
  } else {
    // Local Mode
    const user = { uid: "local_user_default", email: email.includes("@") ? email : `${email}@aeva.com` };
    localStorage.setItem("aeva_user", JSON.stringify(user));
    triggerLocalAuthChange();
    return user;
  }
}

export async function signInWithGoogle() {
  if (auth) {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const cred = await signInWithPopup(auth, provider);
    return { uid: cred.user.uid, email: cred.user.email };
  } else {
    throw new Error("Google Authentication is not initialized. Please configure your Firebase environment variables to verify your email through Google.");
  }
}

export async function signOut() {
  if (isFirebaseConfigured && auth) {
    await fbSignOut(auth);
  } else {
    localStorage.removeItem("aeva_user");
    triggerLocalAuthChange();
  }
}

// User Profile Operations
export async function saveProfile(uid: string, profile: UserProfile, email?: string) {
  const emailVal = email || `${uid.substring(0, 8)}@aeva.com`;
  
  // Sync to local admin users list
  try {
    const localUsersStr = localStorage.getItem("aeva_admin_users") || "[]";
    const localUsers = JSON.parse(localUsersStr);
    const existingIdx = localUsers.findIndex((u: any) => u.uid === uid);
    const newRec = {
      uid,
      email: emailVal,
      profile,
      logCount: localUsers[existingIdx]?.logCount || 0
    };
    if (existingIdx >= 0) {
      localUsers[existingIdx] = newRec;
    } else {
      localUsers.push(newRec);
    }
    localStorage.setItem("aeva_admin_users", JSON.stringify(localUsers));
  } catch (e) {
    console.warn("Failed to sync to local admin list:", e);
  }

  if (isFirebaseConfigured && db) {
    try {
      const userDocRef = doc(db, "users", uid);
      const data: any = { profile };
      if (email) {
        data.email = email;
      }
      await withTimeout(setDoc(userDocRef, data, { merge: true }), 2000);
    } catch (e) {
      console.warn("Firestore saveProfile failed, falling back to LocalStorage:", e);
      localStorage.setItem(`aeva_profile_${uid}`, JSON.stringify(profile));
    }
  } else {
    localStorage.setItem(`aeva_profile_${uid}`, JSON.stringify(profile));
  }
}

export async function getProfile(uid: string): Promise<UserProfile | null> {
  if (isFirebaseConfigured && db) {
    try {
      const userDocRef = doc(db, "users", uid);
      const docSnap = await withTimeout(getDoc(userDocRef), 2000);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.profile || null;
      }
      return null;
    } catch (e) {
      console.warn("Firestore getProfile failed, falling back to LocalStorage:", e);
      const local = localStorage.getItem(`aeva_profile_${uid}`);
      return local ? JSON.parse(local) : null;
    }
  } else {
    const local = localStorage.getItem(`aeva_profile_${uid}`);
    return local ? JSON.parse(local) : null;
  }
}

// Daily Logs Operations
export async function saveDailyLog(uid: string, dateStr: string, log: DailyLogData) {
  if (isFirebaseConfigured && db) {
    try {
      const logDocRef = doc(db, "users", uid, "daily_logs", dateStr);
      const logData = {
        encryptedPayload: log.encryptedPayload,
        metadata: {
          phaseContext: log.metadata.phaseContext,
          updatedTimestamp: Timestamp.now(),
          iv: (log as any).iv || ""
        }
      };
      await withTimeout(setDoc(logDocRef, logData, { merge: true }), 2000);
    } catch (e) {
      console.warn("Firestore saveDailyLog failed, falling back to LocalStorage:", e);
      const allLogs = JSON.parse(localStorage.getItem(`aeva_logs_${uid}`) || "{}");
      allLogs[dateStr] = {
        encryptedPayload: log.encryptedPayload,
        metadata: {
          phaseContext: log.metadata.phaseContext,
          updatedTimestamp: new Date().toISOString(),
          iv: (log as any).iv || ""
        }
      };
      localStorage.setItem(`aeva_logs_${uid}`, JSON.stringify(allLogs));
    }
  } else {
    const allLogs = JSON.parse(localStorage.getItem(`aeva_logs_${uid}`) || "{}");
    allLogs[dateStr] = {
      encryptedPayload: log.encryptedPayload,
      metadata: {
        phaseContext: log.metadata.phaseContext,
        updatedTimestamp: new Date().toISOString(),
        iv: (log as any).iv || ""
      }
    };
    localStorage.setItem(`aeva_logs_${uid}`, JSON.stringify(allLogs));
  }
}

export async function getDailyLog(uid: string, dateStr: string): Promise<DailyLogData | null> {
  if (isFirebaseConfigured && db) {
    try {
      const logDocRef = doc(db, "users", uid, "daily_logs", dateStr);
      const docSnap = await withTimeout(getDoc(logDocRef), 2000);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          encryptedPayload: data.encryptedPayload,
          metadata: {
            phaseContext: data.metadata?.phaseContext || "",
            updatedTimestamp: data.metadata?.updatedTimestamp?.toDate?.() || data.metadata?.updatedTimestamp,
            iv: data.metadata?.iv || data.iv || ""
          }
        } as any;
      }
      return null;
    } catch (e) {
      console.warn("Firestore getDailyLog failed, falling back to LocalStorage:", e);
      const allLogs = JSON.parse(localStorage.getItem(`aeva_logs_${uid}`) || "{}");
      return allLogs[dateStr] || null;
    }
  } else {
    const allLogs = JSON.parse(localStorage.getItem(`aeva_logs_${uid}`) || "{}");
    return allLogs[dateStr] || null;
  }
}

// Fetch all logs to decrypt on client
export async function getRecentDailyLogs(uid: string, daysLimit = 90): Promise<{ dateStr: string; log: DailyLogData }[]> {
  if (isFirebaseConfigured && db) {
    try {
      const logsColRef = collection(db, "users", uid, "daily_logs");
      const q = query(logsColRef, orderBy("metadata.updatedTimestamp", "desc"), limit(daysLimit));
      const querySnapshot = await withTimeout(getDocs(q), 2000);
      const logs: { dateStr: string; log: DailyLogData }[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        logs.push({
          dateStr: docSnap.id,
          log: {
            encryptedPayload: data.encryptedPayload,
            metadata: {
              phaseContext: data.metadata?.phaseContext || "",
              updatedTimestamp: data.metadata?.updatedTimestamp?.toDate?.() || data.metadata?.updatedTimestamp,
              iv: data.metadata?.iv || data.iv || ""
            }
          }
        });
      });
      return logs;
    } catch (e) {
      console.warn("Firestore getRecentDailyLogs failed, falling back to LocalStorage:", e);
      const allLogs = JSON.parse(localStorage.getItem(`aeva_logs_${uid}`) || "{}");
      const sortedLogs = Object.keys(allLogs)
        .map(dateStr => ({
          dateStr,
          log: allLogs[dateStr] as DailyLogData
        }))
        .sort((a, b) => {
          const timeA = new Date(a.log.metadata.updatedTimestamp).getTime();
          const timeB = new Date(b.log.metadata.updatedTimestamp).getTime();
          return timeB - timeA;
        })
        .slice(0, daysLimit);
      return sortedLogs;
    }
  } else {
    const allLogs = JSON.parse(localStorage.getItem(`aeva_logs_${uid}`) || "{}");
    const sortedLogs = Object.keys(allLogs)
      .map(dateStr => ({
        dateStr,
        log: allLogs[dateStr] as DailyLogData
      }))
      .sort((a, b) => {
        const timeA = new Date(a.log.metadata.updatedTimestamp).getTime();
        const timeB = new Date(b.log.metadata.updatedTimestamp).getTime();
        return timeB - timeA;
      })
      .slice(0, daysLimit);
    return sortedLogs;
  }
}

// Clinical Screening Assessments
export async function saveAssessment(uid: string, assessment: AssessmentData) {
  if (isFirebaseConfigured && db) {
    try {
      const screeningRef = doc(db, "users", uid, "clinical_screening", "pcos_assessment");
      await withTimeout(setDoc(screeningRef, {
        encryptedAssessmentData: assessment.encryptedAssessmentData,
        screeningStatus: assessment.screeningStatus,
        generatedAt: Timestamp.now(),
        iv: (assessment as any).iv || ""
      }), 2000);
    } catch (e) {
      console.warn("Firestore saveAssessment failed, falling back to LocalStorage:", e);
      localStorage.setItem(`aeva_assessment_${uid}`, JSON.stringify({
        encryptedAssessmentData: assessment.encryptedAssessmentData,
        screeningStatus: assessment.screeningStatus,
        generatedAt: new Date().toISOString(),
        iv: (assessment as any).iv || ""
      }));
    }
  } else {
    localStorage.setItem(`aeva_assessment_${uid}`, JSON.stringify({
      encryptedAssessmentData: assessment.encryptedAssessmentData,
      screeningStatus: assessment.screeningStatus,
      generatedAt: new Date().toISOString(),
      iv: (assessment as any).iv || ""
    }));
  }
}

export async function getAssessment(uid: string): Promise<AssessmentData | null> {
  if (isFirebaseConfigured && db) {
    try {
      const screeningRef = doc(db, "users", uid, "clinical_screening", "pcos_assessment");
      const docSnap = await withTimeout(getDoc(screeningRef), 2000);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          encryptedAssessmentData: data.encryptedAssessmentData,
          screeningStatus: data.screeningStatus,
          generatedAt: data.generatedAt?.toDate?.() || data.generatedAt,
          iv: data.iv || ""
        } as any;
      }
      return null;
    } catch (e) {
      console.warn("Firestore getAssessment failed, falling back to LocalStorage:", e);
      const local = localStorage.getItem(`aeva_assessment_${uid}`);
      return local ? JSON.parse(local) : null;
    }
  } else {
    const local = localStorage.getItem(`aeva_assessment_${uid}`);
    return local ? JSON.parse(local) : null;
  }
}

export interface AdminUserRecord {
  uid: string;
  email: string;
  profile: UserProfile;
  logCount: number;
}

// Fetch all registered users for Admin Dashboard
export async function getAllUsers(): Promise<AdminUserRecord[]> {
  if (isFirebaseConfigured && db) {
    try {
      const usersColRef = collection(db, "users");
      const querySnapshot = await withTimeout(getDocs(usersColRef), 2000);
      const users: AdminUserRecord[] = [];
      
      for (const userDoc of querySnapshot.docs) {
        const data = userDoc.data();
        const uid = userDoc.id;
        const profile = data.profile || { mode: "cycle_sync" };
        
        // Get log count
        const logsColRef = collection(db, "users", uid, "daily_logs");
        const logsSnap = await withTimeout(getDocs(logsColRef), 1000).catch(() => ({ size: 0 }));
        
        users.push({
          uid,
          email: data.email || `${uid.substring(0, 8)}@aeva.com`,
          profile,
          logCount: (logsSnap as any).size || 0
        });
      }
      return users;
    } catch (e) {
      console.warn("Error fetching all users in Admin Mode, falling back to LocalStorage:", e);
      return [];
    }
  } else {
    // Local Mode: Retrieve users from LocalStorage
    let localUsers = localStorage.getItem("aeva_admin_users");
    if (!localUsers) {
      localUsers = "[]";
      localStorage.setItem("aeva_admin_users", localUsers);
    }
    return JSON.parse(localUsers);
  }
}

export interface SocialPost {
  id: string;
  uid: string;
  username: string;
  userMode: string;
  content: string;
  photoHex?: string;
  photoType?: string;
  likes: number;
  hugs: number;
  timestamp: any;
}

export async function saveSocialPost(
  uid: string, 
  email: string, 
  userMode: string, 
  content: string, 
  photoHex?: string, 
  photoType?: string
) {
  const username = email.split("@")[0];
  if (isFirebaseConfigured && db) {
    try {
      const postsCol = collection(db, "social_posts");
      await withTimeout(addDoc(postsCol, {
        uid,
        username,
        userMode,
        content,
        photoHex: photoHex || "",
        photoType: photoType || "",
        likes: 0,
        hugs: 0,
        timestamp: Timestamp.now()
      }), 2000);
    } catch (e) {
      console.warn("Firestore saveSocialPost failed, falling back to LocalStorage:", e);
      fallbackLocalPost(uid, username, userMode, content, photoHex, photoType);
    }
  } else {
    fallbackLocalPost(uid, username, userMode, content, photoHex, photoType);
  }
}

function fallbackLocalPost(
  uid: string,
  username: string,
  userMode: string,
  content: string,
  photoHex?: string,
  photoType?: string
) {
  const localPosts = JSON.parse(localStorage.getItem("aeva_social_posts") || "[]");
  localPosts.push({
    id: "local_post_" + Math.random().toString(36).substring(2, 9),
    uid,
    username,
    userMode,
    content,
    photoHex: photoHex || "",
    photoType: photoType || "",
    likes: 0,
    hugs: 0,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem("aeva_social_posts", JSON.stringify(localPosts));
}

export async function getSocialPosts(userMode: string): Promise<SocialPost[]> {
  if (isFirebaseConfigured && db) {
    try {
      const postsCol = collection(db, "social_posts");
      const q = query(postsCol, where("userMode", "==", userMode), orderBy("timestamp", "desc"), limit(40));
      const querySnapshot = await withTimeout(getDocs(q), 2000);
      const posts: SocialPost[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        posts.push({
          id: docSnap.id,
          uid: data.uid,
          username: data.username,
          userMode: data.userMode,
          content: data.content,
          photoHex: data.photoHex,
          photoType: data.photoType,
          likes: data.likes || 0,
          hugs: data.hugs || 0,
          timestamp: data.timestamp?.toDate?.() || data.timestamp
        });
      });
      return posts;
    } catch (e) {
      console.warn("Firestore getSocialPosts failed, falling back to LocalStorage:", e);
      return getLocalPosts(userMode);
    }
  } else {
    return getLocalPosts(userMode);
  }
}

function getLocalPosts(userMode: string): SocialPost[] {
  const localPosts = JSON.parse(localStorage.getItem("aeva_social_posts") || "[]") as SocialPost[];
  // Seed initial posts if empty to make the feed addictive on first load
  if (localPosts.length === 0) {
    const seedPosts: SocialPost[] = [
      {
        id: "seed_post_1",
        uid: "mock_user_sarah",
        username: "sarah",
        userMode: "cycle_sync",
        content: "Feeling incredible energy today in my follicular phase! Just crushed a high-intensity strength workout. Anyone else peak-training today? 💪🌸",
        likes: 12,
        hugs: 4,
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: "seed_post_2",
        uid: "mock_user_chloe",
        username: "chloe",
        userMode: "cycle_sync",
        content: "Slow morning today in luteal phase, brewing some raspberry leaf tea. Remember to stretch and be kind to yourselves ladies! ☕️🧘‍♀️",
        likes: 8,
        hugs: 9,
        timestamp: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: "seed_post_3",
        uid: "mock_user_elena",
        username: "elena",
        userMode: "menopause",
        content: "Just tried deep diaphragmatic breathing for my afternoon hot flashes and it reduced the intensity by half! Highly recommend trying it. 🌬️💚",
        likes: 15,
        hugs: 11,
        timestamp: new Date(Date.now() - 1800000).toISOString()
      }
    ];
    localStorage.setItem("aeva_social_posts", JSON.stringify(seedPosts));
    return seedPosts.filter(p => p.userMode === userMode);
  }
  return localPosts
    .filter(p => p.userMode === userMode)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function reactToPost(postId: string, reactionType: "likes" | "hugs") {
  if (isFirebaseConfigured && db && !postId.startsWith("local_post_") && !postId.startsWith("seed_post_")) {
    try {
      const postRef = doc(db, "social_posts", postId);
      const postSnap = await withTimeout(getDoc(postRef), 2000);
      if (postSnap.exists()) {
        const data = postSnap.data();
        const currentCount = data[reactionType] || 0;
        await withTimeout(setDoc(postRef, { [reactionType]: currentCount + 1 }, { merge: true }), 2000);
      }
    } catch (e) {
      console.warn("Firestore reactToPost failed, updating local state instead:", e);
      updateLocalReaction(postId, reactionType);
    }
  } else {
    updateLocalReaction(postId, reactionType);
  }
}

function updateLocalReaction(postId: string, reactionType: "likes" | "hugs") {
  const localPosts = JSON.parse(localStorage.getItem("aeva_social_posts") || "[]") as SocialPost[];
  const post = localPosts.find(p => p.id === postId);
  if (post) {
    post[reactionType] = (post[reactionType] || 0) + 1;
    localStorage.setItem("aeva_social_posts", JSON.stringify(localPosts));
  }
}

export interface RegistrationRecord {
  uid: string;
  email: string;
  timestamp: string;
}

export interface LoginRecord {
  uid: string;
  email: string;
  timestamp: string;
}

export async function recordRegistration(uid: string, email: string) {
  const timestamp = new Date().toISOString();
  const rec: RegistrationRecord = { uid, email, timestamp };

  try {
    const logs = JSON.parse(localStorage.getItem("aeva_registrations") || "[]");
    logs.push(rec);
    localStorage.setItem("aeva_registrations", JSON.stringify(logs));
  } catch (e) {
    console.warn("Failed to save registration locally:", e);
  }

  if (isFirebaseConfigured && db) {
    try {
      const regDocRef = doc(db, "registrations", uid);
      await withTimeout(setDoc(regDocRef, rec), 2000);
    } catch (e) {
      console.warn("Firestore recordRegistration failed:", e);
    }
  }
}

export async function recordLogin(uid: string, email: string) {
  const timestamp = new Date().toISOString();
  const rec: LoginRecord = { uid, email, timestamp };

  try {
    const logs = JSON.parse(localStorage.getItem("aeva_logins") || "[]");
    logs.push(rec);
    localStorage.setItem("aeva_logins", JSON.stringify(logs));
  } catch (e) {
    console.warn("Failed to save login locally:", e);
  }

  if (isFirebaseConfigured && db) {
    try {
      const loginDocRef = doc(collection(db, "logins"));
      await withTimeout(setDoc(loginDocRef, rec), 2000);
    } catch (e) {
      console.warn("Firestore recordLogin failed:", e);
    }
  }
}

export async function getRegistrationLogs(): Promise<RegistrationRecord[]> {
  if (isFirebaseConfigured && db) {
    try {
      const qSnap = await withTimeout(getDocs(collection(db, "registrations")), 2000);
      const list: RegistrationRecord[] = [];
      qSnap.forEach(d => {
        list.push(d.data() as RegistrationRecord);
      });
      return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (e) {
      console.warn("Firestore getRegistrationLogs failed:", e);
    }
  }
  const list = JSON.parse(localStorage.getItem("aeva_registrations") || "[]") as RegistrationRecord[];
  return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function getLoginLogs(): Promise<LoginRecord[]> {
  if (isFirebaseConfigured && db) {
    try {
      const qSnap = await withTimeout(getDocs(collection(db, "logins")), 2000);
      const list: LoginRecord[] = [];
      qSnap.forEach(d => {
        list.push(d.data() as LoginRecord);
      });
      return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (e) {
      console.warn("Firestore getLoginLogs failed:", e);
    }
  }
  const list = JSON.parse(localStorage.getItem("aeva_logins") || "[]") as LoginRecord[];
  return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
