const admin = require('firebase-admin');
const crypto = require('crypto');

// Firebase Admin ko secure tarike se start karna
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Private key ki lines ko sahi se format karne ke liye replace function
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    })
  });
}

module.exports = async (req, res) => {
  // Sirf POST requests allow hongi
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  // ==========================================
  // NAYA: AI PHOTO STYLING ROUTE (Secure Vercel API Call)
  // ==========================================
  if (req.headers['x-action-type'] === 'ai-style') {
    try {
      const { promptText, base64Image } = req.body;
      if (!base64Image || !promptText) return res.status(400).json({ error: 'Missing image or prompt' });

      // Base64 image ke aage ka text hatana jo API ko nahi chahiye
      const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

      // Vercel se Hugging Face API ko request bhejna (Token Vercel Variable se aayega)
      const hfResponse = await fetch("https://api-inference.huggingface.co/models/timbrooks/instruct-pix2pix", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: promptText, image: cleanBase64 })
      });

      if (!hfResponse.ok) {
        if (hfResponse.status === 503) return res.status(503).json({ error: 'AI is warming up (Takes ~10 sec)' });
        return res.status(500).json({ error: 'AI Processing Error' });
      }

      const arrayBuffer = await hfResponse.arrayBuffer();
      const outputBase64 = Buffer.from(arrayBuffer).toString('base64');
      
      return res.status(200).json({ resultImage: `data:image/jpeg;base64,${outputBase64}` });

    } catch (err) {
      console.error("AI Error:", err);
      return res.status(500).json({ error: 'Server Error' });
    }
  }

  // ==========================================
  // PURANA: RAZORPAY WEBHOOK ROUTE (Bilkul Untouched)
  // ==========================================
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];
  
  if (!signature) return res.status(400).send('Missing Razorpay Signature');

  // Razorpay ka signature verify karna (Security Check ki fake payment to nahi)
  const body = JSON.stringify(req.body);
  const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');

  // Agar payment asli hai toh yeh if block chalega
  if (expectedSignature === signature) {
    try {
      // Payment karne wale customer ka Email nikalna
      const userEmail = req.body.payload?.payment?.entity?.email;
      
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
      return res.status(200).send('Payment Verified & Pro Activated');
    } catch (error) {
      console.error("Webhook Error:", error);
      return res.status(500).send('Server Error');
    }
  } else {
    // Agar koi hacker try kare toh error dena
    return res.status(400).send('Invalid Signature');
  }
};
