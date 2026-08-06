const admin = require('firebase-admin');
const crypto = require('crypto');

// Firebase Admin ko secure tarike se start karna
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Private key ki lines ko sahi se format karne ke liye replace function
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    })
  });
}

module.exports = async (req, res) => {
  // Sirf POST requests allow hongi (Razorpay hamesha POST bhejta hai)
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];

  // Razorpay ka signature verify karna (Security Check ki fake payment to nahi)
  const body = JSON.stringify(req.body);
  const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');

  // Agar payment asli hai toh yeh if block chalega
  if (expectedSignature === signature) {
    try {
      // Payment karne wale customer ka Email nikalna
      const userEmail = req.body.payload.payment.entity.email;
      
      if (userEmail) {
        const db = admin.firestore();
        const usersRef = db.collection('users');
        // Firebase Database me us email ko dhoondhna
        const snapshot = await usersRef.where('email', '==', userEmail.toLowerCase()).get();

        if (!snapshot.empty) {
          const batch = db.batch();
          snapshot.forEach((doc) => {
            // User ka Pro account CHALU karna!
            batch.update(doc.ref, { isPro: true });
          });
          await batch.commit();
        }
      }
      // Razorpay ko OK report bhejna
      res.status(200).send('Payment Verified & Pro Activated');
    } catch (error) {
      console.error("Webhook Error:", error);
      res.status(500).send('Server Error');
    }
  } else {
    // Agar koi hacker try kare toh error dena
    res.status(400).send('Invalid Signature');
  }
};
// ==========================================
// AI STYLE FEATURE (ADDED TO WEBBOOK.JS)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // AI Style container ko detect karna
    const aiContainer = document.getElementById('control-ai-style');
    if (!aiContainer) return;

    const buttons = aiContainer.querySelectorAll('button');
    const outfitBtn = buttons[0];     // Outfit Button
    const sunglassesBtn = buttons[1]; // Sunglasses Button

    // 1. Change Outfit Logic
    if (outfitBtn) {
        outfitBtn.addEventListener('click', () => {
            const imagePreview = document.getElementById('imagePreview');
            if (!imagePreview || imagePreview.classList.contains('hidden')) {
                alert("Please upload an image first!");
                return;
            }

            const loadingOverlay = document.getElementById('loadingOverlay');
            const loadingText = document.getElementById('loadingText');
            
            if (loadingText) loadingText.innerText = "AI is changing outfit...";
            if (loadingOverlay) loadingOverlay.classList.remove('hidden');

            setTimeout(() => {
                if (loadingOverlay) loadingOverlay.classList.add('hidden');
                alert("Outfit Feature Triggered! Backend API Key connect karne ke baad ye live photo edit karega.");
            }, 1500);
        });
    }

    // 2. Add Sunglasses Logic
    if (sunglassesBtn) {
        sunglassesBtn.addEventListener('click', () => {
            const imagePreview = document.getElementById('imagePreview');
            if (!imagePreview || imagePreview.classList.contains('hidden')) {
                alert("Please upload an image first!");
                return;
            }

            const loadingOverlay = document.getElementById('loadingOverlay');
            const loadingText = document.getElementById('loadingText');

            if (loadingText) loadingText.innerText = "AI is adding sunglasses...";
            if (loadingOverlay) loadingOverlay.classList.remove('hidden');

            setTimeout(() => {
                if (loadingOverlay) loadingOverlay.classList.add('hidden');
                alert("Sunglasses Feature Triggered! Backend API Key connect karne ke baad ye live photo edit karega.");
            }, 1500);
        });
    }
});
