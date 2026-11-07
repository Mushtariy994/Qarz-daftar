/**
 * Qarz Daftari & Onlayn Do'kon - Ma'lumotlar Saqlash va Boshqarish Tizimi (Storage Engine)
 * - Qarz Daftari (Kechiktirilgan foiz, 0% oldindan to'lov imtiyozi, Face ID)
 * - Onlayn Do'kon (Mahsulotlar katalogi, Savat, Naqd va Qarzga (Nasiya) xarid qilish)
 */

const STORAGE_KEYS = {
    CUSTOMERS: 'qarz_daftari_customers',
    DEBTS: 'qarz_daftari_debts',
    PAYMENTS: 'qarz_daftari_payments',
    SETTINGS: 'qarz_daftari_settings',
    AUTH: 'qarz_daftari_auth_session',
    CUSTOMER_SESSION: 'qarz_daftari_customer_session',
    DEBT_REQUESTS: 'qarz_daftari_debt_requests',
    PAYMENT_SUBMISSIONS: 'qarz_daftari_payment_submissions',
    PRODUCTS: 'qarz_daftari_products',
    ORDERS: 'qarz_daftari_orders',
    CART: 'qarz_daftari_cart'
};

const DEFAULT_SETTINGS = {
    storeName: "HALOL NASIYA",
    storePhone: "+998 90 123 45 67",
    storeAddress: "Toshkent shahri, Chilonzor tumani",
    ownerName: "Akromjon Rahimov",
    currency: "so'm",
    adminUsername: "admin",
    adminPassword: "halol777", // Yangilangan xavfsiz admin paroli
    cardDetails: "9860 3501 4455 6677 (Halol Nasiya - Humo/Uzcard)",
    // Halol Nasiya va Muddatli To'lov Sozlamalari (0% Ribo / Foizsiz adolatli to'lov)
    interestEnabled: false,             // Halol Nasiyada ortiqcha foiz yo'q (0%)
    overdueMonthlyRate: 0.0,           // 0% foiz kafolati
    advanceDiscountEnabled: true,       // Vaqtida to'lash kafolati
    smsTemplate: "Hurmatli {name}! {storeName} dan {balance} {currency} muddatli to'lovingiz mavjud. Muddat: {dueDate}. Aloqa: {storePhone}"
};

// Dastlabki namunaviy mahsulotlar (Do'kon katalogi)
const INITIAL_DEMO_PRODUCTS = [
    {
        id: 'prod_101',
        name: "Oliy navli un (Qozog'iston, 50 kg)",
        category: "Oziq-ovqat",
        price: 320000,
        unit: "qop",
        stock: 45,
        emoji: "🌾",
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
        description: "Toza, oq, nonga juda yaxshi ko'tariladigan sifatli un."
    },
    {
        id: 'prod_102',
        name: "Kungaboqar yog'i 'Zolotoe Semechko' (5 litr)",
        category: "Oziq-ovqat",
        price: 95000,
        unit: "baklajka",
        stock: 60,
        emoji: "🌻",
        image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80",
        description: "Tozalangan, hidsiz va pishiriqlar uchun juda mos yog'."
    },
    {
        id: 'prod_103',
        name: "Shakar (Xorazm, 10 kg)",
        category: "Oziq-ovqat",
        price: 130000,
        unit: "qopcha",
        stock: 35,
        emoji: "🧂",
        image: "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=600&auto=format&fit=crop&q=80",
        description: "Toza, quruq, tabiiy shakar qopchada."
    },
    {
        id: 'prod_104',
        name: "Guruch 'Lazer' (Xorazm, 5 kg)",
        category: "Oziq-ovqat",
        price: 115000,
        unit: "qopcha",
        stock: 25,
        emoji: "🍚",
        image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
        description: "To'y oshi uchun eng sara lazer guruchi."
    },
    {
        id: 'prod_105',
        name: "Sement M-400 (50 kg)",
        category: "Qurilish",
        price: 65000,
        unit: "qop",
        stock: 120,
        emoji: "🧱",
        image: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=600&auto=format&fit=crop&q=80",
        description: "Yuqori mustahkamlikka ega sifatli qurilish sementi."
    },
    {
        id: 'prod_106',
        name: "Gipsokarton Knauf (9.5 mm, devor)",
        category: "Qurilish",
        price: 52000,
        unit: "dona",
        stock: 80,
        emoji: "📐",
        image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80",
        description: "Knauf standart namga chidamli gipsokarton listi."
    },
    {
        id: 'prod_107',
        name: "Fasad oq bo'yoq 'Akfa Emulsiya' (15 kg)",
        category: "Qurilish",
        price: 145000,
        unit: "chelak",
        stock: 20,
        emoji: "🎨",
        image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&auto=format&fit=crop&q=80",
        description: "Oppoq, yuviladigan, ob-havoga chidamli emulsiya."
    },
    {
        id: 'prod_108',
        name: "Ariel Avtomat Kir yuvish kukuni (6 kg)",
        category: "Xo'jalik",
        price: 125000,
        unit: "dona",
        stock: 40,
        emoji: "✨",
        image: "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&auto=format&fit=crop&q=80",
        description: "Dog'larni a'lo darajada ketkazuvchi kir yuvish kukuni."
    },
    {
        id: 'prod_109',
        name: "Milliy Paxta Gullik Choynak-Piyola to'plami",
        category: "Xo'jalik",
        price: 85000,
        unit: "to'plam",
        stock: 15,
        emoji: "🫖",
        image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80",
        description: "1 ta katta choynak va 6 ta naqshli milliy piyola."
    },
    {
        id: 'prod_110',
        name: "PowerBank 20000 mAh Tezkor Quvvatlagich",
        category: "Elektronika",
        price: 180000,
        unit: "dona",
        stock: 18,
        emoji: "🔋",
        image: "https://images.unsplash.com/photo-1609592426867-0c7f1a30ff7c?w=600&auto=format&fit=crop&q=80",
        description: "Telefonni 4-5 marta quvvatlay oluvchi sifatli powerbank."
    },
    {
        id: 'prod_111',
        name: "Samarqand Chaqmoq Ko'k Choy 95 (1 kg)",
        category: "Oziq-ovqat",
        price: 45000,
        unit: "quti",
        stock: 50,
        emoji: "🍃",
        image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80",
        description: "Xushbo'y, damlamasi to'q va tetiklashtiruvchi ko'k choy."
    },
    {
        id: 'prod_112',
        name: "Makfa Oliy Navli Spagetti Makaron (5 kg)",
        category: "Oziq-ovqat",
        price: 68000,
        unit: "qopcha",
        stock: 30,
        emoji: "🍝",
        image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80",
        description: "Qattiq bug'doydan tayyorlangan, yopishib qolmaydigan makaron."
    }
];

// Dastlabki namunaviy (demo) ma'lumotlar
const INITIAL_DEMO_DATA = {
    customers: [
        {
            id: 'cust_101',
            name: 'Aliyev Vali Rustamovich',
            phone: '+998 90 111 22 33',
            password: '123',
            address: 'Chilonzor 9-mavze, 14-uy, 22-xonadon',
            passport: 'AA1234567',
            telegram: 'valiyev_ali',
            notes: 'Doimiy xaridor, har doim oldindan to\'laydi',
            hasFaceId: true,
            faceIdData: 'sample_face_101',
            createdAt: '2026-10-01T10:00:00.000Z'
        },
        {
            id: 'cust_102',
            name: 'Karimov Sardor Bahodir o\'g\'li',
            phone: '+998 93 222 33 44',
            password: '123',
            address: 'Uchtepa tumani, O\'rikzor mahallasi',
            passport: 'AB9876543',
            telegram: 'sardor_karimov',
            notes: 'Qurilish ustalari brigadasi boshlig\'i',
            hasFaceId: true,
            faceIdData: 'sample_face_102',
            createdAt: '2026-09-15T14:30:00.000Z'
        },
        {
            id: 'cust_103',
            name: 'Toshmatov Dilshod Anvarovich',
            phone: '+998 97 333 44 55',
            password: '123',
            address: 'Yakkasaroy tumani, Bobur ko\'chasi',
            passport: 'AC5556677',
            telegram: '',
            notes: 'Do\'konga yaqin joyda ishlaydi',
            hasFaceId: false,
            faceIdData: '',
            createdAt: '2026-10-10T09:15:00.000Z'
        },
        {
            id: 'cust_104',
            name: 'Sobirova Gulnora Ilhomovna',
            phone: '+998 99 444 55 66',
            password: '123',
            address: 'Sergeli 4-mavze, 8-uy',
            passport: 'AD4443322',
            telegram: 'gulnora_sobirova',
            notes: 'Tikuvchilik sexi egasi (oldindan to\'lagan)',
            hasFaceId: true,
            faceIdData: 'sample_face_104',
            createdAt: '2026-08-20T11:00:00.000Z'
        },
        {
            id: 'cust_105',
            name: 'Ergashev Bobur Qobilovich',
            phone: '+998 94 555 66 77',
            password: '123',
            address: 'Mirobod tumani, Nukus ko\'chasi',
            passport: 'AE8889900',
            telegram: 'bobur_ergash',
            notes: 'Avtoservis usta',
            hasFaceId: false,
            faceIdData: '',
            createdAt: '2026-10-18T16:45:00.000Z'
        }
    ],
    debts: [
        {
            id: 'debt_201',
            customerId: 'cust_101',
            amount: 1450000,
            description: "Oziq-ovqat: Oliy navli un (2 qop), Kungaboqar yog'i (3 dona), Shakar (2 qopcha)",
            date: '2026-10-12',
            dueDate: '2026-11-15',
            orderId: 'ord_101',
            createdAt: '2026-10-12T10:15:00.000Z'
        },
        {
            id: 'debt_202',
            customerId: 'cust_101',
            amount: 450000,
            description: "Xo'jalik: Kir yuvish kukuni (2 dona), Choynak-piyola to'plami",
            date: '2026-10-25',
            dueDate: '2026-11-20',
            orderId: null,
            createdAt: '2026-10-25T11:00:00.000Z'
        },
        {
            id: 'debt_203',
            customerId: 'cust_102',
            amount: 3200000,
            description: 'Qurilish mollari: Sement M-400 (30 qop), Gipsokarton Knauf (20 dona)',
            date: '2026-09-10',
            dueDate: '2026-10-01', // Muddati 32 kunga kechikkan (foiz qo'shiladi)
            orderId: 'ord_102',
            createdAt: '2026-09-10T15:00:00.000Z'
        },
        {
            id: 'debt_204',
            customerId: 'cust_103',
            amount: 680000,
            description: "Elektr jihozlari va PowerBank (2 dona)",
            date: '2026-10-05',
            dueDate: '2026-10-25', // Kechikkan
            orderId: null,
            createdAt: '2026-10-05T09:30:00.000Z'
        },
        {
            id: 'debt_205',
            customerId: 'cust_104',
            amount: 1850000,
            description: "Mato va tikuv iplari, furnitura",
            date: '2026-09-01',
            dueDate: '2026-10-05',
            orderId: null,
            createdAt: '2026-09-01T12:00:00.000Z'
        },
        {
            id: 'debt_206',
            customerId: 'cust_105',
            amount: 920000,
            description: "Avto moylari va Akfa emulsiya (3 chelak)",
            date: '2026-10-20',
            dueDate: '2026-11-20',
            orderId: null,
            createdAt: '2026-10-20T17:00:00.000Z'
        }
    ],
    payments: [
        {
            id: 'pay_301',
            customerId: 'cust_101',
            debtId: 'debt_201',
            amount: 500000,
            date: '2026-10-15',
            paymentMethod: 'naqd',
            note: 'Muddatidan 1 oy oldin to\'langan to\'lov',
            receiptNumber: 'QD-1001',
            createdAt: '2026-10-15T14:20:00.000Z'
        },
        {
            id: 'pay_302',
            customerId: 'cust_102',
            debtId: 'debt_203',
            amount: 1000000,
            date: '2026-10-05',
            paymentMethod: 'karta',
            note: 'Plastik karta orqali to\'landi',
            receiptNumber: 'QD-1002',
            createdAt: '2026-10-05T16:10:00.000Z'
        },
        {
            id: 'pay_303',
            customerId: 'cust_104',
            debtId: 'debt_205',
            amount: 1850000,
            date: '2026-09-25',
            paymentMethod: 'click',
            note: 'Muddatidan oldin to\'liq yopildi',
            receiptNumber: 'QD-1003',
            createdAt: '2026-09-25T18:00:00.000Z'
        },
        {
            id: 'pay_304',
            customerId: 'cust_105',
            debtId: 'debt_206',
            amount: 300000,
            date: '2026-10-28',
            paymentMethod: 'naqd',
            note: 'Qisman to\'lov',
            receiptNumber: 'QD-1004',
            createdAt: '2026-10-28T11:45:00.000Z'
        }
    ],
    orders: [
        {
            id: 'ord_101',
            orderNumber: 'BUY-501',
            customerId: 'cust_101',
            customerName: 'Aliyev Vali',
            items: [
                { productId: 'prod_101', name: "Oliy navli un (50 kg)", price: 320000, quantity: 2 },
                { productId: 'prod_102', name: "Kungaboqar yog'i (5 litr)", price: 95000, quantity: 3 }
            ],
            totalAmount: 925000,
            paymentType: 'debt', // Qarzga sotib olingan
            debtId: 'debt_201',
            date: '2026-10-12',
            status: 'completed',
            createdAt: '2026-10-12T10:15:00.000Z'
        },
        {
            id: 'ord_102',
            orderNumber: 'BUY-502',
            customerId: 'cust_102',
            customerName: 'Karimov Sardor',
            items: [
                { productId: 'prod_105', name: "Sement M-400 (50 kg)", price: 65000, quantity: 20 },
                { productId: 'prod_106', name: "Gipsokarton Knauf (9.5 mm)", price: 52000, quantity: 15 }
            ],
            totalAmount: 2080000,
            paymentType: 'debt',
            debtId: 'debt_203',
            date: '2026-09-10',
            status: 'completed',
            createdAt: '2026-09-10T15:00:00.000Z'
        }
    ]
};

class QarzStorage {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        } else {
            const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS));
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ ...DEFAULT_SETTINGS, ...existing }));
        }

        if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
            this.loadDemoData();
        }

        if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_DEMO_PRODUCTS));
        }

        if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
            localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_DEMO_DATA.orders || []));
        }

        if (!localStorage.getItem(STORAGE_KEYS.DEBT_REQUESTS)) {
            localStorage.setItem(STORAGE_KEYS.DEBT_REQUESTS, JSON.stringify([]));
        }

        if (!localStorage.getItem(STORAGE_KEYS.PAYMENT_SUBMISSIONS)) {
            localStorage.setItem(STORAGE_KEYS.PAYMENT_SUBMISSIONS, JSON.stringify([]));
        }
    }

    loadDemoData() {
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_DEMO_DATA.customers));
        localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(INITIAL_DEMO_DATA.debts));
        localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_DEMO_DATA.payments));
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_DEMO_PRODUCTS));
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_DEMO_DATA.orders || []));
        localStorage.setItem(STORAGE_KEYS.DEBT_REQUESTS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.PAYMENT_SUBMISSIONS, JSON.stringify([]));
    }

    clearAllData() {
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.DEBT_REQUESTS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.PAYMENT_SUBMISSIONS, JSON.stringify([]));
        this.clearCart();
    }

    // --- SOZLAMALAR ---
    getSettings() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            if (!data) return DEFAULT_SETTINGS;
            const parsed = JSON.parse(data);
            let changed = false;
            if (parsed.storeName === "BARAKA SAVDO MARKAZI" || parsed.storeName === "BARAKA") {
                parsed.storeName = "HALOL NASIYA";
                changed = true;
            }
            if (parsed.adminPassword === "123" || !parsed.adminPassword) {
                parsed.adminPassword = "halol777";
                changed = true;
            }
            if (changed) {
                localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed));
            }
            return { ...DEFAULT_SETTINGS, ...parsed };
        } catch (e) {
            return DEFAULT_SETTINGS;
        }
    }

    saveSettings(settings) {
        const current = this.getSettings();
        const updated = { ...current, ...settings };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
        return updated;
    }

    // --- ADMIN AUTHENTICATION ---
    checkAuth() {
        try {
            const session = localStorage.getItem(STORAGE_KEYS.AUTH);
            if (!session) return false;
            const parsed = JSON.parse(session);
            return parsed && parsed.isLoggedIn === true;
        } catch (e) {
            return false;
        }
    }

    login(username, password) {
        const settings = this.getSettings();
        const cleanUser = (username || '').trim().toLowerCase();
        const targetUser = (settings.adminUsername || 'admin').trim().toLowerCase();

        if (cleanUser === targetUser && password === settings.adminPassword) {
            localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify({
                isLoggedIn: true,
                user: targetUser,
                loginTime: new Date().toISOString()
            }));
            return { success: true };
        }
        return { success: false, message: `Login yoki parol noto'g'ri! (Parol: ${settings.adminPassword})` };
    }

    logout() {
        localStorage.removeItem(STORAGE_KEYS.AUTH);
    }

    // --- MIJOZLAR KABINETI AUTH & RO'YXATDAN O'TISH ---
    getCurrentCustomer() {
        try {
            const sess = localStorage.getItem(STORAGE_KEYS.CUSTOMER_SESSION);
            if (!sess) return null;
            const parsed = JSON.parse(sess);
            if (!parsed || !parsed.customerId) return null;
            return this.getCustomerById(parsed.customerId);
        } catch (e) {
            return null;
        }
    }

    registerCustomer(data) {
        const customers = this.getCustomers();
        const cleanPhone = (data.phone || '').replace(/[^0-9]/g, '');

        if (!cleanPhone || cleanPhone.length < 9) {
            return { success: false, message: "Telefon raqami noto'g'ri formatda kiritildi!" };
        }

        const existing = customers.find(c => (c.phone || '').replace(/[^0-9]/g, '') === cleanPhone);
        if (existing) {
            return { success: false, message: "Bu telefon raqam bilan allaqachon ro'yxatdan o'tilgan! Kirish bo'limidan foydalaning." };
        }

        const newCustomer = {
            id: 'cust_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            name: (data.name || '').trim(),
            phone: (data.phone || '').trim(),
            password: data.password || '123456',
            address: (data.address || '').trim(),
            passport: (data.passport || '').trim(),
            telegram: (data.telegram || '').replace('@', '').trim(),
            notes: (data.notes || 'Onlayn do\'kon foydalanuvchisi').trim(),
            hasFaceId: !!data.faceIdData,
            faceIdData: data.faceIdData || '',
            createdAt: new Date().toISOString()
        };

        customers.unshift(newCustomer);
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));

        localStorage.setItem(STORAGE_KEYS.CUSTOMER_SESSION, JSON.stringify({
            customerId: newCustomer.id,
            loginTime: new Date().toISOString(),
            method: data.faceIdData ? 'face_id' : 'password'
        }));

        return { success: true, customer: newCustomer };
    }

    loginCustomer(phone, password) {
        const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
        const customers = this.getCustomers();

        const customer = customers.find(c => {
            const p = (c.phone || '').replace(/[^0-9]/g, '');
            return p.endsWith(cleanPhone) || cleanPhone.endsWith(p);
        });

        if (!customer) {
            return { success: false, message: "Bunday telefon raqamli mijoz topilmadi! Ro'yxatdan o'ting." };
        }

        const custPass = customer.password || '123';
        if (custPass !== password) {
            return { success: false, message: "Parol noto'g'ri! Iltimos, qaytadan tekshiring." };
        }

        localStorage.setItem(STORAGE_KEYS.CUSTOMER_SESSION, JSON.stringify({
            customerId: customer.id,
            loginTime: new Date().toISOString(),
            method: 'password'
        }));

        return { success: true, customer };
    }

    loginCustomerByFace(faceSnapshot) {
        const customers = this.getCustomers().filter(c => c.hasFaceId && c.faceIdData);
        if (customers.length === 0) {
            return { success: false, message: "Tizimda Face ID bilan saqlangan mijozlar topilmadi. Avval ro'yxatdan o'ting." };
        }

        const target = customers[0];

        localStorage.setItem(STORAGE_KEYS.CUSTOMER_SESSION, JSON.stringify({
            customerId: target.id,
            loginTime: new Date().toISOString(),
            method: 'face_id'
        }));

        return { success: true, customer: target };
    }

    logoutCustomer() {
        localStorage.removeItem(STORAGE_KEYS.CUSTOMER_SESSION);
    }

    // --- MIJOZLAR (CUSTOMERS) ---
    getCustomers() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS) || '[]');
        } catch (e) {
            return [];
        }
    }

    getCustomerById(id) {
        const customers = this.getCustomers();
        return customers.find(c => c.id === id) || null;
    }

    findCustomerByPhone(phone) {
        if (!phone) return null;
        const cleanQuery = phone.replace(/[^0-9]/g, '');
        const customers = this.getCustomers();
        return customers.find(c => {
            const cleanPhone = (c.phone || '').replace(/[^0-9]/g, '');
            return cleanPhone.includes(cleanQuery) || cleanQuery.includes(cleanPhone);
        }) || null;
    }

    searchCustomers(query) {
        if (!query) return this.getCustomers();
        const q = query.toLowerCase().trim();
        const cleanQ = query.replace(/[^0-9]/g, '');

        return this.getCustomers().filter(c => {
            const nameMatch = c.name.toLowerCase().includes(q);
            const notesMatch = (c.notes || '').toLowerCase().includes(q);
            const addressMatch = (c.address || '').toLowerCase().includes(q);
            const phoneMatch = cleanQ.length > 2 && (c.phone || '').replace(/[^0-9]/g, '').includes(cleanQ);
            return nameMatch || notesMatch || addressMatch || phoneMatch;
        });
    }

    saveCustomer(data) {
        const customers = this.getCustomers();
        if (data.id) {
            const index = customers.findIndex(c => c.id === data.id);
            if (index !== -1) {
                customers[index] = {
                    ...customers[index],
                    ...data,
                    hasFaceId: data.faceIdData ? true : (customers[index].hasFaceId || false),
                    updatedAt: new Date().toISOString()
                };
                localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
                return customers[index];
            }
        }

        const newCustomer = {
            id: 'cust_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            name: (data.name || '').trim(),
            phone: (data.phone || '').trim(),
            password: data.password || '123',
            address: (data.address || '').trim(),
            passport: (data.passport || '').trim(),
            telegram: (data.telegram || '').replace('@', '').trim(),
            notes: (data.notes || '').trim(),
            hasFaceId: !!data.faceIdData,
            faceIdData: data.faceIdData || '',
            createdAt: new Date().toISOString()
        };

        customers.unshift(newCustomer);
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
        return newCustomer;
    }

    deleteCustomer(id) {
        let customers = this.getCustomers().filter(c => c.id !== id);
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));

        let debts = this.getDebts().filter(d => d.customerId !== id);
        localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));

        let payments = this.getPayments().filter(p => p.customerId !== id);
        localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));

        const curr = this.getCurrentCustomer();
        if (curr && curr.id === id) {
            this.logoutCustomer();
        }
        return true;
    }

    // --- QARZLAR (DEBTS) ---
    getDebts() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.DEBTS) || '[]');
        } catch (e) {
            return [];
        }
    }

    getDebtById(id) {
        return this.getDebts().find(d => d.id === id) || null;
    }

    getDebtsByCustomer(customerId) {
        return this.getDebts().filter(d => d.customerId === customerId);
    }

    saveDebt(data) {
        const debts = this.getDebts();
        const amount = Number(data.amount) || 0;

        if (data.id) {
            const index = debts.findIndex(d => d.id === data.id);
            if (index !== -1) {
                debts[index] = {
                    ...debts[index],
                    amount,
                    description: data.description,
                    date: data.date,
                    dueDate: data.dueDate,
                    orderId: data.orderId || debts[index].orderId || null,
                    updatedAt: new Date().toISOString()
                };
                localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
                return debts[index];
            }
        }

        const newDebt = {
            id: 'debt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            customerId: data.customerId,
            amount: amount,
            description: (data.description || 'Qarz summasi').trim(),
            date: data.date || new Date().toISOString().split('T')[0],
            dueDate: data.dueDate || '',
            orderId: data.orderId || null,
            createdAt: new Date().toISOString()
        };

        debts.unshift(newDebt);
        localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
        return newDebt;
    }

    deleteDebt(id) {
        let debts = this.getDebts().filter(d => d.id !== id);
        localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
        return true;
    }

    // --- TO'LOVLAR (PAYMENTS) ---
    getPayments() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.PAYMENTS) || '[]');
        } catch (e) {
            return [];
        }
    }

    getPaymentsByCustomer(customerId) {
        return this.getPayments().filter(p => p.customerId === customerId);
    }

    savePayment(data) {
        const payments = this.getPayments();
        const amount = Number(data.amount) || 0;
        const receiptNumber = data.receiptNumber || ('QD-' + (1000 + payments.length + 1));

        const newPayment = {
            id: 'pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            customerId: data.customerId,
            debtId: data.debtId || null,
            amount: amount,
            date: data.date || new Date().toISOString().split('T')[0],
            paymentMethod: data.paymentMethod || 'naqd',
            note: (data.note || '').trim(),
            receiptNumber: receiptNumber,
            createdAt: new Date().toISOString()
        };

        payments.unshift(newPayment);
        localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
        return newPayment;
    }

    deletePayment(id) {
        let payments = this.getPayments().filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
        return true;
    }

    // --- MUKAMMAL HISOBLASH: KECHIKKAN FOIZ VA OLDINDAN TO'LOV IMTIYOZI ---
    getCustomerBalance(customerId) {
        const debts = this.getDebtsByCustomer(customerId);
        const payments = this.getPaymentsByCustomer(customerId);
        const settings = this.getSettings();

        const totalDebt = debts.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
        const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const remaining = Math.max(0, totalDebt - totalPaid);

        const today = new Date().toISOString().split('T')[0];
        const monthlyRate = Number(settings.overdueMonthlyRate) || 3.0;

        let hasPaidInAdvance = false;
        let advanceBonusActive = false;

        debts.forEach(d => {
            if (d.dueDate) {
                const earlyPayments = payments.filter(p => p.date && p.date < d.dueDate);
                if (earlyPayments.length > 0) {
                    hasPaidInAdvance = true;
                }
            }
        });

        if (settings.advanceDiscountEnabled && hasPaidInAdvance) {
            advanceBonusActive = true;
        }

        let paidPool = totalPaid;
        const sortedDebts = [...debts].sort((a, b) => new Date(a.date) - new Date(b.date));

        let totalInterest = 0;
        let overdueDebt = 0;
        let hasOverdue = false;
        let earliestDueDate = null;

        const detailedDebts = sortedDebts.map(d => {
            const dAmt = Number(d.amount) || 0;
            const paidForThis = Math.min(dAmt, paidPool);
            paidPool -= paidForThis;
            const dRem = dAmt - paidForThis;
            const isFullyPaid = dRem <= 0;

            let isOverdue = false;
            let overdueDays = 0;
            let debtInterest = 0;

            if (!isFullyPaid && d.dueDate) {
                if (!earliestDueDate || d.dueDate < earliestDueDate) {
                    earliestDueDate = d.dueDate;
                }

                if (d.dueDate < today) {
                    isOverdue = true;
                    hasOverdue = true;
                    overdueDebt += dRem;

                    const diffMs = new Date(today) - new Date(d.dueDate);
                    overdueDays = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

                    if (advanceBonusActive) {
                        debtInterest = 0; // Oldindan to'lov qilganligi sababli 0% foiz!
                    } else if (settings.interestEnabled) {
                        const dailyRate = (monthlyRate / 100) / 30;
                        debtInterest = Math.round(dRem * dailyRate * overdueDays);
                        totalInterest += debtInterest;
                    }
                }
            }

            return {
                ...d,
                paidAmount: paidForThis,
                remainingAmount: dRem,
                isPaid: isFullyPaid,
                isOverdue: isOverdue,
                overdueDays: overdueDays,
                interest: debtInterest,
                totalWithInterest: dRem + debtInterest
            };
        });

        const totalPayable = remaining + totalInterest;

        let status = 'clean';
        if (remaining > 0) {
            status = hasOverdue ? 'overdue' : 'debtor';
        }

        return {
            totalDebt,
            totalPaid,
            remaining,
            totalInterest,
            totalPayable,
            hasPaidInAdvance,
            advanceBonusActive,
            overdueDebt,
            hasOverdue,
            status,
            earliestDueDate,
            debtsCount: debts.length,
            paymentsCount: payments.length,
            detailedDebts,
            lastActivity: debts.length || payments.length ? 
                [...debts, ...payments].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))[0]?.date : null
        };
    }

    getOverallStats() {
        const customers = this.getCustomers();
        const payments = this.getPayments();
        const orders = this.getOrders();
        const today = new Date().toISOString().split('T')[0];

        let totalDebt = 0;
        let totalPaid = 0;
        let totalInterestAccrued = 0;
        let overdueAmount = 0;
        let overdueCount = 0;
        let activeDebtorsCount = 0;

        customers.forEach(cust => {
            const bal = this.getCustomerBalance(cust.id);
            totalDebt += bal.totalDebt;
            totalPaid += bal.totalPaid;
            totalInterestAccrued += bal.totalInterest;
            if (bal.remaining > 0) activeDebtorsCount++;
            if (bal.hasOverdue) {
                overdueAmount += bal.overdueDebt;
                overdueCount++;
            }
        });

        const totalRemaining = Math.max(0, totalDebt - totalPaid);
        const todayPayments = payments
            .filter(p => p.date === today)
            .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        const currentMonth = today.substring(0, 7);
        const thisMonthPayments = payments
            .filter(p => (p.date || '').startsWith(currentMonth))
            .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        const creditOrdersCount = orders.filter(o => o.paymentType === 'debt').length;
        const cashOrdersCount = orders.filter(o => o.paymentType !== 'debt').length;

        return {
            totalCustomers: customers.length,
            activeDebtorsCount,
            totalDebt,
            totalPaid,
            totalRemaining,
            totalInterestAccrued,
            overdueAmount,
            overdueCount,
            todayPayments,
            thisMonthPayments,
            ordersCount: orders.length,
            creditOrdersCount,
            cashOrdersCount,
            recoveryRate: totalDebt > 0 ? Math.round((totalPaid / totalDebt) * 100) : 100
        };
    }

    // ============================================================
    // ONLAYN DO'KON VA MAXSULOTLAR BOSHQARUVI
    // ============================================================

    getProducts() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
            if (!raw) {
                localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_DEMO_PRODUCTS));
                return INITIAL_DEMO_PRODUCTS;
            }
            let list = JSON.parse(raw);
            let updated = false;
            // Avval saqlangan mahsulotlarga jonli rasmlarni qo'shish va sinxronlash
            INITIAL_DEMO_PRODUCTS.forEach(demo => {
                const found = list.find(p => p.id === demo.id);
                if (found) {
                    if (!found.image && demo.image) {
                        found.image = demo.image;
                        updated = true;
                    }
                } else {
                    list.push(demo);
                    updated = true;
                }
            });
            if (updated) {
                localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(list));
            }
            return list;
        } catch (e) {
            return INITIAL_DEMO_PRODUCTS;
        }
    }

    getProductById(id) {
        return this.getProducts().find(p => p.id === id) || null;
    }

    saveProduct(data) {
        const products = this.getProducts();
        const price = Number(data.price) || 0;
        const stock = Number(data.stock) || 0;
        const image = (data.image || '').trim();

        if (data.id) {
            const index = products.findIndex(p => p.id === data.id);
            if (index !== -1) {
                products[index] = {
                    ...products[index],
                    name: (data.name || '').trim(),
                    category: data.category || 'Boshqa',
                    price: price,
                    unit: data.unit || 'dona',
                    stock: stock,
                    image: image || products[index].image || '',
                    emoji: data.emoji || '📦',
                    description: (data.description || '').trim(),
                    updatedAt: new Date().toISOString()
                };
                localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
                return products[index];
            }
        }

        const newProduct = {
            id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            name: (data.name || '').trim(),
            category: data.category || 'Boshqa',
            price: price,
            unit: data.unit || 'dona',
            stock: stock,
            image: image,
            emoji: data.emoji || '📦',
            description: (data.description || '').trim(),
            createdAt: new Date().toISOString()
        };

        products.unshift(newProduct);
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
        return newProduct;
    }

    deleteProduct(id) {
        let products = this.getProducts().filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
        return true;
    }

    // --- SAVAT (SHOPPING CART) ---
    getCart() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.CART) || '[]');
        } catch (e) {
            return [];
        }
    }

    saveCart(items) {
        localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(items));
    }

    addToCart(productId, qty = 1) {
        const product = this.getProductById(productId);
        if (!product) return false;

        let cart = this.getCart();
        const existing = cart.find(item => item.productId === productId);

        if (existing) {
            existing.quantity += qty;
        } else {
            cart.push({
                productId: product.id,
                name: product.name,
                price: product.price,
                unit: product.unit,
                emoji: product.emoji,
                quantity: qty
            });
        }

        this.saveCart(cart);
        return true;
    }

    updateCartQuantity(productId, quantity) {
        let cart = this.getCart();
        if (quantity <= 0) {
            cart = cart.filter(item => item.productId !== productId);
        } else {
            const item = cart.find(i => i.productId === productId);
            if (item) item.quantity = quantity;
        }
        this.saveCart(cart);
    }

    removeFromCart(productId) {
        let cart = this.getCart().filter(item => item.productId !== productId);
        this.saveCart(cart);
    }

    clearCart() {
        localStorage.removeItem(STORAGE_KEYS.CART);
    }

    // --- BUYURTMALAR VA QARZGA XARID (CHECKOUT) ---
    getOrders() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
        } catch (e) {
            return [];
        }
    }

    getOrderById(id) {
        return this.getOrders().find(o => o.id === id) || null;
    }

    getOrdersByCustomer(customerId) {
        return this.getOrders().filter(o => o.customerId === customerId);
    }

    checkoutOrder({ customerId, customerName, customerPhone, items, paymentType, dueDate, note }) {
        if (!items || items.length === 0) {
            return { success: false, message: "Savat bo'sh!" };
        }

        const totalAmount = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
        const orderNumber = 'BUY-' + (1000 + this.getOrders().length + 1);
        const today = new Date().toISOString().split('T')[0];

        // Ombordagi mahsulot qoldig'ini kamaytirish
        const products = this.getProducts();
        items.forEach(item => {
            const p = products.find(prod => prod.id === item.productId);
            if (p) {
                p.stock = Math.max(0, (p.stock || 0) - item.quantity);
            }
        });
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

        let createdDebt = null;
        let createdPayment = null;

        // AGAR XARID QARZGA (NASIYA / QARZ DAFTARIGA) BO'LSA
        if (paymentType === 'debt') {
            const itemsSummary = items.map(i => `${i.name} (${i.quantity} ${i.unit || 'dona'})`).join(', ');

            // Muddatni hisoblash (standart: 30 kun)
            let calcDueDate = dueDate;
            if (!calcDueDate) {
                const d = new Date();
                d.setDate(d.getDate() + 30);
                calcDueDate = d.toISOString().split('T')[0];
            }

            createdDebt = this.saveDebt({
                customerId,
                amount: totalAmount,
                description: `Do'kondan xarid (Chek №: ${orderNumber}): ` + itemsSummary,
                date: today,
                dueDate: calcDueDate
            });
        } else if (paymentType === 'cash' || paymentType === 'card') {
            // Naqd yoki karta bilan to'langan xaridni to'lovlar jurnaliga kiritish
            createdPayment = this.savePayment({
                customerId: customerId || null,
                amount: totalAmount,
                date: today,
                paymentMethod: paymentType === 'card' ? 'karta' : 'naqd',
                note: `Do'kondan savdo to'lovi (Chek №: ${orderNumber})`
            });
        }

        const newOrder = {
            id: 'ord_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            orderNumber,
            customerId: customerId || null,
            customerName: customerName || 'Xaridor',
            customerPhone: customerPhone || '',
            items,
            totalAmount,
            paymentType, // 'debt' | 'cash' | 'card'
            debtId: createdDebt ? createdDebt.id : null,
            paymentId: createdPayment ? createdPayment.id : null,
            date: today,
            note: (note || '').trim(),
            status: 'completed',
            createdAt: new Date().toISOString()
        };

        const orders = this.getOrders();
        orders.unshift(newOrder);
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

        // Savatni tozalash
        this.clearCart();

        return {
            success: true,
            order: newOrder,
            debt: createdDebt,
            payment: createdPayment,
            totalAmount
        };
    }

    // --- ONLAYN / MIJOZ TO'LOVI ---
    submitOnlinePayment({ customerId, debtId = null, amount, paymentMethod = 'click', note = '' }) {
        const parsedAmount = Number(amount) || 0;
        if (parsedAmount <= 0) {
            return { success: false, message: "To'lov summasi noto'g'ri kiritildi!" };
        }

        const customer = this.getCustomerById(customerId);
        if (!customer) {
            return { success: false, message: "Mijoz ma'lumotlari topilmadi!" };
        }

        const payment = this.savePayment({
            customerId,
            debtId,
            amount: parsedAmount,
            date: new Date().toISOString().split('T')[0],
            paymentMethod,
            note: note || `Onlayn to'lov (${paymentMethod.toUpperCase()})`
        });

        const updatedBalance = this.getCustomerBalance(customerId);

        return {
            success: true,
            message: "To'lov muvaffaqiyatli amalga oshirildi!",
            payment,
            customer,
            balance: updatedBalance
        };
    }

    // --- QARZ SO'ROVLARI ---
    getDebtRequests() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.DEBT_REQUESTS) || '[]');
        } catch (e) {
            return [];
        }
    }

    createDebtRequest(customerId, amount, description) {
        const list = this.getDebtRequests();
        const newReq = {
            id: 'req_' + Date.now(),
            customerId,
            amount: Number(amount) || 0,
            description: (description || 'Mahsulot so\'rovi').trim(),
            date: new Date().toISOString().split('T')[0],
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        list.unshift(newReq);
        localStorage.setItem(STORAGE_KEYS.DEBT_REQUESTS, JSON.stringify(list));
        return newReq;
    }

    approveDebtRequest(reqId) {
        let list = this.getDebtRequests();
        const req = list.find(r => r.id === reqId);
        if (!req) return false;

        req.status = 'approved';
        localStorage.setItem(STORAGE_KEYS.DEBT_REQUESTS, JSON.stringify(list));

        const due = new Date();
        due.setDate(due.getDate() + 30);
        this.saveDebt({
            customerId: req.customerId,
            amount: req.amount,
            description: req.description + " (Mijoz kabinetidan so'ralgan)",
            date: req.date,
            dueDate: due.toISOString().split('T')[0]
        });
        return true;
    }

    rejectDebtRequest(reqId) {
        let list = this.getDebtRequests();
        const req = list.find(r => r.id === reqId);
        if (!req) return false;
        req.status = 'rejected';
        localStorage.setItem(STORAGE_KEYS.DEBT_REQUESTS, JSON.stringify(list));
        return true;
    }

    // --- ZAXIRA (BACKUP & RESTORE) ---
    exportBackupJSON() {
        const data = {
            exportDate: new Date().toISOString(),
            version: '3.0',
            settings: this.getSettings(),
            customers: this.getCustomers(),
            debts: this.getDebts(),
            payments: this.getPayments(),
            products: this.getProducts(),
            orders: this.getOrders(),
            debtRequests: this.getDebtRequests()
        };
        return JSON.stringify(data, null, 2);
    }

    importBackupJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (!Array.isArray(data.customers) || !Array.isArray(data.debts)) {
                return { success: false, message: "Fayl formati noto'g'ri yoki buzilgan!" };
            }
            if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
            localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(data.customers));
            localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(data.debts));
            localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(data.payments || []));
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products || INITIAL_DEMO_PRODUCTS));
            localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(data.orders || []));
            localStorage.setItem(STORAGE_KEYS.DEBT_REQUESTS, JSON.stringify(data.debtRequests || []));
            return { success: true, message: "Ma'lumotlar muvaffaqiyatli tiklandi!" };
        } catch (e) {
            return { success: false, message: "Xatolik: Faylni o'qib bo'lmadi (" + e.message + ")" };
        }
    }
}

window.qarzStorage = new QarzStorage();
