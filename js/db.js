/**
 * LAMMA Database Service Layer - Firebase Compat Implementation
 * Depends on: firebase-app-compat, firebase-firestore-compat, firebase-storage-compat
 */

// Database COLLECTIONS Names

const DB_COLLECTIONS = {
    PACKAGES: 'packages',
    ORDERS: 'orders',
    SETTINGS: 'settings',
    ANALYTICS: 'analytics'
};

const lammaDb = {
    // --- Packages (Products) ---
    async getPackages() {
        try {
            const snapshot = await firebase.firestore().collection(DB_COLLECTIONS.PACKAGES).get();
            const packages = [];
            snapshot.forEach((doc) => {
                packages.push({ id: doc.id, ...doc.data() });
            });
            return packages.length > 0 ? packages : this.getDefaultPackages();
        } catch (error) {
            console.error("Error fetching packages:", error);
            return this.getDefaultPackages();
        }
    },

    async savePackages(packages) {
        const firestore = firebase.firestore();
        const batch = firestore.batch();

        // 1. Get all current document IDs in Firestore
        const snapshot = await firestore.collection(DB_COLLECTIONS.PACKAGES).get();
        const existingIds = snapshot.docs.map(doc => doc.id);
        const newIds = packages.map(p => p.id.toString());

        // 2. Delete documents that are no longer in the new packages list
        existingIds.forEach(id => {
            if (!newIds.includes(id)) {
                batch.delete(firestore.collection(DB_COLLECTIONS.PACKAGES).doc(id));
            }
        });

        // 3. Set/Update current packages
        for (const pkg of packages) {
            const pkgRef = firestore.collection(DB_COLLECTIONS.PACKAGES).doc(pkg.id.toString());
            // Sanitize data (Remove undefined/null, ensure plain object)
            const cleanPkg = {};
            Object.keys(pkg).forEach(key => {
                if (pkg[key] !== undefined && pkg[key] !== null) {
                    cleanPkg[key] = pkg[key];
                }
            });
            batch.set(pkgRef, cleanPkg);
        }
        await batch.commit();
    },

    // --- Settings ---
    async getSettings() {
        try {
            const docRef = firebase.firestore().collection(DB_COLLECTIONS.SETTINGS).doc('site_config');
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                return docSnap.data();
            } else {
                return this.getDefaultSettings();
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
            return this.getDefaultSettings();
        }
    },

    async saveSettings(settings) {
        await firebase.firestore().collection(DB_COLLECTIONS.SETTINGS).doc('site_config').set(settings);
    },

    // --- Orders ---
    async createOrder(orderData, proofFile) {
        try {
            let proofUrl = '';

            // 1. Upload Proof Image if exists (Legacy support)
            if (proofFile) {
                const storageRef = firebase.storage().ref(`payment_proofs/${Date.now()}_${proofFile.name}`);
                await storageRef.put(proofFile);
                proofUrl = await storageRef.getDownloadURL();
            }

            // 2. Save Order to Firestore
            const orderWithMeta = {
                ...orderData,
                payment_proof_url: proofUrl,
                status: 'pending',
                created_at: firebase.firestore.FieldValue.serverTimestamp(),
            };

            const docRef = await firebase.firestore().collection(DB_COLLECTIONS.ORDERS).add(orderWithMeta);
            return { data: { id: docRef.id }, error: null };
        } catch (error) {
            console.error("Error creating order:", error);
            return { data: null, error };
        }
    },

    async getOrders() {
        try {
            const q = firebase.firestore().collection(DB_COLLECTIONS.ORDERS)
                .orderBy("created_at", "desc");
            const querySnapshot = await q.get();
            const orders = [];
            querySnapshot.forEach((doc) => {
                orders.push({ id: doc.id, ...doc.data() });
            });
            return orders;
        } catch (error) {
            console.error("Error fetching orders:", error);
            throw error;
        }
    },

    async updateOrderStatus(orderId, status) {
        await firebase.firestore().collection(DB_COLLECTIONS.ORDERS).doc(orderId).update({ status });
    },

    // --- Fallbacks / Defaults ---
    getDefaultPackages() {
        return [
            { id: 1, title: "لَمّة طمأنينة", category: "food", price: 25, description: "سلة غذائية أساسية تحتوي على الاحتياجات الضرورية (أرز، عدس، زيت، سكر) بالإضافة إلى رسالة حب مخصصة لأهلك.", image: "assets/img/basket_safe.webp" },
            { id: 2, title: "لَمّة إفطار صائم", category: "food", price: 35, description: "وجبة إفطار حلبية جاهزة للعائلة + تمر + خبز طازج. تصل ساخنة في موعد الإفطار.", image: "assets/img/meal_ramadan.webp" },
            { id: 6, title: "لَمّة حسب الطلب", category: "custom", price: "حسب الطلب", description: "أنت تحدد المحتوى (أدوية، هدايا خاصة، طلبات معينة) ونحن نقوم بالتنفيذ وتحديد السعر بعد المراجعة.", image: "assets/img/custom_gift.webp" }
        ];
    },

    getDefaultSettings() {
        return {
            heroTitle: "بعيد عنهم؟<br><span>خلّي هديتك توصلهم</span>",
            heroDesc: "نوصّل محبتك لأهلك في حلب بسلال غذائية، وجبات، وهدايا مميزة.<br>مع توثيق لحظة الاستلام ودعم مباشر.",
            whatsapp: "963953644710",
            primaryColor: "#f97316",
            paymentMethods: {
                mtn: { name: "MTN Cash", account: "963944751485", icon: "M", color: "#eab308" },
                syriatel: { name: "Syriatel Cash", account: "093XXXXXXX", icon: "S", color: "#ef4444" },
                usdt: { name: "USDT (TRC20)", account: "TXXXXXXXXXXXXX", icon: "U", color: "#10b981" }
            }
        };
    },

    // --- Analytics & Stats ---
    async trackVisit() {
        const firestore = firebase.firestore();
        const today = new Date().toISOString().split('T')[0];
        const visitRef = firestore.collection(DB_COLLECTIONS.ANALYTICS).doc(today);

        try {
            await firestore.runTransaction(async (transaction) => {
                const doc = await transaction.get(visitRef);
                if (!doc.exists) {
                    transaction.set(visitRef, { count: 1 });
                } else {
                    transaction.update(visitRef, { count: (doc.data().count || 0) + 1 });
                }
            });
        } catch (e) {
            console.warn("Visit tracking failed:", e);
        }
    },

    async getStats() {
        const firestore = firebase.firestore();
        const today = new Date().toISOString().split('T')[0];

        let visitors = 0;
        try {
            const vDoc = await firestore.collection(DB_COLLECTIONS.ANALYTICS).doc(today).get();
            visitors = vDoc.exists ? vDoc.data().count : 0;
        } catch (e) { }

        const snapshot = await firestore.collection(DB_COLLECTIONS.ORDERS).get();
        const orders = snapshot.docs.map(doc => doc.data());

        const totalOrders = orders.length;
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const revenue = orders.reduce((sum, order) => {
            const date = order.created_at?.toDate();
            if (date && date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                return sum + (parseFloat(order.total) || 0);
            }
            return sum;
        }, 0);

        return { visitors, totalOrders, revenue };
    }
};

window.db = lammaDb;
