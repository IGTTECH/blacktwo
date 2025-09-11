// auth.js (updated with plan-aware guardPage)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { 
  getAuth, createUserWithEmailAndPassword, sendEmailVerification, 
  signInWithEmailAndPassword, signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { 
  getFirestore, doc, setDoc, getDoc, updateDoc 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Register user (only Auth, wait for verification before Firestore write)
export async function registerUser(email, password, plan) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(cred.user);
  // Firestore doc created later after verification
  return { message: "Verification email sent. Please verify before login.", uid: cred.user.uid };
}

// Create user doc after verification
export async function createUserDocIfMissing(user, extra={}) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email,
      paid: false,
      plan: extra.plan || null,
      createdAt: new Date().toISOString()
    });
  }
}

// Login with verification and plan-based redirect
export 
// Login - if user has not verified email, deny access to protected areas (but allow login to prompt verification)
async function loginUser(email, password){
  try{
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const user = cred.user;
    if(!user.emailVerified){
      // sign user out to prevent access until verified
      await signOut(auth);
      return { success:false, message:"Email not verified. Please verify your email before logging in.", code:"EMAIL_NOT_VERIFIED" };
    }
    // ensure user doc exists (without changing paid flag)
    await createUserDocIfMissing(user);
    // fetch user doc and admin status
    const udoc = await getDoc(doc(db,"users",user.uid));
    const data = udoc.exists()? udoc.data(): null;
    const adminDoc = await getDoc(doc(db,"admins",user.uid));
    const isAdmin = adminDoc.exists();
    return { success:true, user, isAdmin, paid: !!(data && data.paid), plan: data? data.plan:null };
  }catch(err){
    return { success:false, error: err.message || String(err) };
  }
}


// Logout
export async function logoutUser() {
  await signOut(auth);
  window.location.href = "/login.html";
}

// Guard page by plan or admin
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

// Admin grants paid access
export async function adminGrantPaidAccess(targetUid, plan=null) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Not signed in");
  const adminSnap = await getDoc(doc(db, "admins", currentUser.uid));
  if (!adminSnap.exists()) throw new Error("Not an admin");
  const ref = doc(db, "users", targetUid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, { paid: true, plan: plan || snap.data().plan || null });
  } else {
    await setDoc(ref, { paid: true, plan: plan || null, addedByAdmin: true, createdAt: new Date().toISOString() });
  }
  return { success: true };
}
