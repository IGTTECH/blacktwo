/**
 * seed-admin.js - add admin UIDs to Firestore
 * Usage:
 *   npm install firebase-admin
 *   place serviceAccountKey.json at project root
 *   node seed-admin.js <UID1> <UID2>
 */
const admin = require('firebase-admin');
const fs = require('fs');
const keyPath = './serviceAccountKey.json';
if(!fs.existsSync(keyPath)){ console.error('Place serviceAccountKey.json in project root'); process.exit(1); }
const serviceAccount = require(keyPath);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
async function addAdmins(uids){
  for(const uid of uids){ await db.collection('admins').doc(uid).set({ createdAt: admin.firestore.FieldValue.serverTimestamp(), seeded:true }); console.log('Added',uid); }
}
const uids = process.argv.slice(2);
if(uids.length===0){ console.error('Provide at least one UID'); process.exit(1); }
addAdmins(uids).then(()=>{console.log('Done');process.exit(0)}).catch(e=>{console.error(e);process.exit(1)});
