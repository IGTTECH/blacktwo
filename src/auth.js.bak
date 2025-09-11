// src/auth.js - exported functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, signOut, onAuthStateChanged, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const PLANS = {
  "website-development": {price:20, redirect:"website-dev-dashboard.html"},
  "mobile-repairing": {price:10, redirect:"mobile-rep-dashoard.html"},
  "kujenga-tovuti": {price:22, redirect:"kujenga-tovuti-dashboard.html"},
  "ufundi-simu": {price:11, redirect:"ufundi-simu-dashboard.html"},
  "kubaka-imbuga": {price:25, redirect:"kubaka-imbuga-dashboard.html"},
  "gukora-phone": {price:12, redirect:"gukora-phone-dashboard.html"}
};

async function registerUser(formId, messageElId, paypalContainerId){
  const form = document.getElementById(formId);
  const msg = document.getElementById(messageElId);
  const data = Object.fromEntries(new FormData(form));
  if(!data.password || data.password.length < 6){ msg.innerText = "Password must be at least 6 characters."; return; }
  try{
    const userCred = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const uid = userCred.user.uid;
    await setDoc(doc(db,"users",uid),{
      firstName: data.firstName||"",
      lastName: data.lastName||"",
      whatsapp: data.whatsapp||"",
      email: data.email,
      language: data.language||"",
      course: data.course||"",
      paid: false,
      createdAt: new Date().toISOString()
    });
    await sendEmailVerification(userCred.user);
    msg.innerText = "Account created. Verification email sent. Verify then complete payment below.";
    showPaypalButton(data.course, uid, paypalContainerId);
  }catch(e){ console.error(e); msg.innerText = "Registration error: "+(e.message||e); }
}

function showPaypalButton(courseKey, uid, containerId){
  const plan = PLANS[courseKey];
  if(!plan) return;
  const container = document.getElementById(containerId);
  if(!container) return;
  container.innerHTML = "";
  if(typeof paypal === "undefined"){ container.innerText = "PayPal SDK not loaded. Set your client id in the script tag."; return; }
  paypal.Buttons({
    createOrder: (data, actions)=> actions.order.create({ purchase_units:[{ amount:{ value: plan.price.toString() } }] }),
    onApprove: async (data, actions)=>{
      const details = await actions.order.capture();
      await updateDoc(doc(db,"users",uid),{
        paid:true, plan:courseKey, planPrice:plan.price, paymentDetails:details, paidAt:new Date().toISOString()
      });
      window.location.href = plan.redirect;
    },
    onError: (err)=>{ console.error(err); alert("Payment error: "+err); }
  }).render("#"+containerId);
}

async function loginUser(email, password, messageElId){
  const msg = document.getElementById(messageElId);
  try{ await signInWithEmailAndPassword(auth, email, password); msg.innerText = "Login successful."; }
  catch(e){ msg.innerText = "Login error: "+(e.message||e); }
}

async function resetPassword(email, messageElId){
  const msg = document.getElementById(messageElId);
  try{ await sendPasswordResetEmail(auth, email); msg.innerText = "Password reset email sent."; }
  catch(e){ msg.innerText = "Error: "+(e.message||e); }
}

async function logoutUser(){ await signOut(auth); window.location.href = "login.html"; }

function guardPage(redirectToLogin=true){
  return new Promise((resolve)=>{
    onAuthStateChanged(auth, async (user)=>{
      if(!user){ if(redirectToLogin) window.location.href = "login.html"; return resolve(false); }
      await user.reload();
      if(!user.emailVerified){ alert("Please verify your email."); window.location.href="login.html"; return resolve(false); }
      const udoc = await getDoc(doc(db,"users",user.uid));
      const data = udoc.exists()? udoc.data(): null;
      const adminDoc = await getDoc(doc(db,"admins",user.uid));
      const isAdmin = adminDoc.exists();
      if((data && data.paid) || isAdmin) return resolve(true);
      alert("This page requires a paid plan. Please pay to access."); window.location.href="login.html"; return resolve(false);
    });
  });
}

function onAuthChange(cb){ onAuthStateChanged(auth, cb); }

export { registerUser, loginUser, resetPassword, logoutUser, guardPage, onAuthChange };
