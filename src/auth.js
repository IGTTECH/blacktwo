// auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { 
  getAuth, createUserWithEmailAndPassword, sendEmailVerification, 
  signInWithEmailAndPassword, signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { 
  getFirestore, doc, setDoc, getDoc, updateDoc 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Runtime sanity check for firebaseConfig placeholders
function _checkFirebaseConfig(cfg){
  if(!cfg || cfg.apiKey===undefined) return false;
  const placeholders = ["REPLACE_WITH_", "your-project-id", "REPLACE"];
  const s = Object.values(cfg).join(" ");
  for(const ph of placeholders){ if(s.includes(ph)) return false; }
  return true;
}
if(!_checkFirebaseConfig(firebaseConfig)){
  console.warn("Firebase config appears to contain placeholders. Replace src/firebase-config.js with your project config to enable Firebase.");
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ---------------- REGISTER -----------------
export async function registerUser(email, password, extra={}) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(cred.user);
  return { message: "Verification email sent. Please verify before login.", uid: cred.user.uid };
}

// ---------------- CREATE DOC -----------------
export async function createUserDocIfMissing(user, extra={}) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email,
      firstName: extra.firstName || "",
      lastName: extra.lastName || "",
      whatsapp: extra.whatsapp || "",
      language: extra.language || "",
      course: extra.course || "",
      plan: extra.plan || null,
      paid: false,
      createdAt: new Date().toISOString()
    });
  }
}

// ---------------- LOGIN -----------------
export async function loginUser(email, password){
  try{
    if(!_checkFirebaseConfig(firebaseConfig)) throw new Error("Firebase config missing or placeholder");

    const cred = await signInWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    if(!user.emailVerified){
      await signOut(auth);
      return { success:false, message:"Email not verified. Please verify your email before logging in.", code:"EMAIL_NOT_VERIFIED" };
    }

    await createUserDocIfMissing(user);

    const udoc = await getDoc(doc(db,"users",user.uid));
    const data = udoc.exists()? udoc.data(): null;
    const adminDoc = await getDoc(doc(db,"admins",user.uid));
    const isAdmin = adminDoc.exists();

    return { success:true, user, isAdmin, paid: !!(data && data.paid), plan: data? data.plan:null };
  }catch(err){
    return { success:false, error: err.message || String(err) };
  }
}

// ---------------- LOGOUT -----------------
export async function logoutUser() {
  await signOut(auth);
  window.location.href = "/login.html";
}

// ---------------- GUARD PAGE -----------------
export async function guardPage(requiredPlan=null) {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "/login.html";
        return reject("Not signed in");
      }
      if (!user.emailVerified) {
        await signOut(auth);
        window.location.href = "/login.html";
        return reject("Email not verified");
      }
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        window.location.href = "/login.html";
        return reject("No user record");
      }
      const data = snap.data();
      const isAdmin = (await getDoc(doc(db, "admins", user.uid))).exists();
      if (isAdmin) return resolve(true);
      if (!data.paid) {
        window.location.href = "/payment.html";
        return reject("Payment required");
      }
      if (requiredPlan && data.plan !== requiredPlan) {
        window.location.href = "/login.html";
        return reject("Wrong plan");
      }
      return resolve(true);
    });
  });
}

// ---------------- ADMIN GRANT -----------------
export async function adminGrantPaidAccess(targetUid, plan=null) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Not signed in");
  const adminSnap = await getDoc(doc(db, "admins", currentUser.uid));
  if (!adminSnap.exists()) throw new Error("Not an admin");

  const ref = doc(db, "users", targetUid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    // keep existing fields, only update paid/plan
    await updateDoc(ref, { 
      paid: true, 
      plan: plan || snap.data().plan || null 
    });
  } else {
    // fallback: create minimal doc if admin adds manually
    await setDoc(ref, { 
      email: "", 
      firstName: "", 
      lastName: "", 
      whatsapp: "", 
      language: "", 
      course: "", 
      paid: true, 
      plan: plan || null, 
      addedByAdmin: true, 
      createdAt: new Date().toISOString() 
    });
  }
  return { success: true };
}
