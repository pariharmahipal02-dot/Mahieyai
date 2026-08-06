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
// 100% FREE AI STYLE FEATURE (HUGGING FACE)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // 👉 YAHAN APNA COPY KIYA HUA TOKEN PASTE KARO (hf_... wala)
    const HF_API_TOKEN = "YAHAN_APNA_TOKEN_PASTE_KAREIN"; 
    
    // Model: Instruct-Pix2Pix (Jo image aur text dono samajhta hai)
    const MODEL_URL = "https://api-inference.huggingface.co/models/timbrooks/instruct-pix2pix";

    const aiContainer = document.getElementById('control-ai-style');
    if (!aiContainer) return;

    const buttons = aiContainer.querySelectorAll('button');
    const outfitBtn = buttons[0];     // Outfit Button
    const sunglassesBtn = buttons[1]; // Sunglasses Button

    // Common Function: Free AI ko photo bhejne ke liye
    async function processImageWithFreeAI(promptText, loadingMessage) {
        const imageInput = document.getElementById('imageInput');
        const file = imageInput.files[0]; 

        if (!file) {
            alert("Please upload an image first!");
            return;
        }
        if (HF_API_TOKEN === "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") {
            alert("Bhai, pehle code me apna Hugging Face Token toh daal do!");
            return;
        }

        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingText = document.getElementById('loadingText');
        
        if (loadingText) loadingText.innerText = loadingMessage + " (Free AI takes ~10-15 sec)";
        if (loadingOverlay) loadingOverlay.classList.remove('hidden');

        try {
            // Photo ko binary (Buffer) me convert karna API ke liye
            const arrayBuffer = await file.arrayBuffer();
            
            // Hugging Face API Call
            const response = await fetch(MODEL_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${HF_API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    inputs: promptText, // Jaise: "Add sunglasses"
                    image: btoa(String.fromCharCode(...new Uint8Array(arrayBuffer))) // Image base64
                })
            });

            if (!response.ok) {
                // Free AI kabhi-kabhi starting me "Model Loading" ka time leta hai
                if (response.status === 503) {
                    throw new Error("Free AI Model is warming up! Please try again in 10-15 seconds.");
                }
                throw new Error("API Limit ya Network Error Aaya!");
            }

            // AI se aayi photo ko show karna
            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);

            const imagePreview = document.getElementById('imagePreview');
            imagePreview.src = imageUrl;
            
            const downloadBtn = document.getElementById('downloadBtn');
            const downloadSection = document.getElementById('downloadSection');
            if (downloadBtn && downloadSection) {
                downloadBtn.href = imageUrl;
                downloadBtn.download = "MahieyAI_Style_Edit.jpg";
                downloadSection.classList.remove('hidden');
            }

        } catch (error) {
            alert("Process Failed: " + error.message);
        } finally {
            if (loadingOverlay) loadingOverlay.classList.add('hidden');
        }
    }

    // 1. OUTFIT CHANGE BUTTON LOGIC
    if (outfitBtn) {
        outfitBtn.addEventListener('click', () => {
            processImageWithFreeAI("change clothes to a stylish red jacket", "AI is changing your outfit...");
        });
    }

    // 2. SUNGLASSES BUTTON LOGIC
    if (sunglassesBtn) {
        sunglassesBtn.addEventListener('click', () => {
            processImageWithFreeAI("add cool black sunglasses on face", "AI is adding sunglasses...");
        });
    }
});
