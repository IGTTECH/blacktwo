import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();

let userPlan = null;
let planPrice = null;

auth.onAuthStateChanged(async (user) => {
  if (user) {
    const docRef = doc(db, "users", user.uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      userPlan = data.plan;
      planPrice = data.plan === "Basic" ? "5.00" : data.plan === "Standard" ? "10.00" : data.plan === "Premium" ? "20.00" : "10.00";
      document.getElementById("planInfo").innerText = `Your selected plan: ${userPlan} ($${planPrice})`;
    } else {
      document.getElementById("planInfo").innerText = "No plan found for your account.";
    }
  }
});

document.getElementById("verifyBtn").addEventListener("click", async () => {
  await auth.currentUser.reload();
  const user = auth.currentUser;

  if (user && user.emailVerified) {
    if (!userPlan || !planPrice) {
      alert("Plan not found. Please contact support.");
      return;
    }

    alert(`Email verified! Proceed with ${userPlan} plan payment.`);
    document.getElementById("paypal-button-container").style.display = "block";
    document.getElementById("paypal-button-container").innerHTML = "";

    paypal.Buttons({
      createOrder: (data, actions) => {
        return actions.order.create({
          purchase_units: [{
            amount: { value: planPrice }
          }]
        });
      },
      onApprove: async (data, actions) => {
        const details = await actions.order.capture();
        alert("Payment completed by " + details.payer.name.given_name);

        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          paid: true,
          emailVerified: true,
          plan: userPlan
        }, { merge: true });

        window.location.href = "dashboard.html";
      },
      onError: (err) => {
        console.error(err);
        alert("Payment failed, try again.");
      }
    }).render("#paypal-button-container");

  } else {
    alert("Please verify your email before proceeding.");
  }
});
