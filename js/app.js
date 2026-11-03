/**
 * Qarz Daftari & Onlayn Do'kon - Asosiy Dastur Logikasi (App Controller)
 * - Onlayn Do'kon (Market), Savat (Cart) va Qarzga xarid (Nasiya) integratsiyasi
 * - Qarz Daftari, Mijoz Kabineti, Face ID Biometrikasi va Foizlar tizimi
 */

class QarzApp {
    constructor() {
        this.currentView = 'store'; // 'store' | 'debt' | 'admin'
        this.currentTab = 'customers';
        this.customerFilter = 'all';
        this.selectedCategory = 'all';
        this.checkoutChoice = 'debt'; // 'debt' | 'cash'
        this.activeCameraStream = null;
        this.init();
    }

    init() {
        this.applyTheme();
        this.updateHeaderSettings();
        this.updateCartBadge();
        this.setupKeyboardShortcuts();

        // Mijoz sessiyasini tekshirish
        this.checkCustomerSession();

        // URL hash orqali to'g'ri ko'rinishga o'tish
        if (window.location.hash === '#admin') {
            this.showAdminPanel();
        } else if (window.location.hash === '#debt') {
            this.showDebtView();
        } else {
            this.showStoreView();
        }

        const todayStr = new Date().toLocaleDateString('uz-UZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const dateEl = document.getElementById('dashboard-date-str');
        if (dateEl) dateEl.innerText = `Bugun: ${todayStr}`;
    }

    // --- REJIM VA MAVZU (THEME) ---
    applyTheme() {
        const savedTheme = localStorage.getItem('qarz_theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcons(savedTheme);
    }

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('qarz_theme', next);
        this.updateThemeIcons(next);
        this.showToast(next === 'dark' ? "Tungi rejim yoqildi" : "Kunduzgi rejim yoqildi", "info");
    }

    updateThemeIcons(theme) {
        const moon = document.getElementById('theme-icon-moon');
        const sun = document.getElementById('theme-icon-sun');
        if (moon && sun) {
            if (theme === 'dark') {
                moon.classList.add('d-none');
                sun.classList.remove('d-none');
            } else {
                moon.classList.remove('d-none');
                sun.classList.add('d-none');
            }
        }
    }

    updateHeaderSettings() {
        const settings = window.qarzStorage.getSettings();
        const headerEl = document.getElementById('header-store-name');
        if (headerEl) headerEl.innerText = settings.storeName || "BARAKA SAVDO MARKAZI";
    }

    // --- ASOSIY BO'LIMLARNI ALMASHISH (VIEW SWITCHER) ---
    showStoreView() {
        this.currentView = 'store';
        window.location.hash = '#store';

        document.getElementById('store-view')?.classList.remove('d-none');
        document.getElementById('debt-portal-view')?.classList.add('d-none');
        document.getElementById('admin-panel-view')?.classList.add('d-none');

        document.getElementById('nav-btn-store')?.classList.add('btn-primary');
        document.getElementById('nav-btn-store')?.classList.remove('btn-outline');
        document.getElementById('nav-btn-debt')?.classList.remove('btn-primary');
        document.getElementById('nav-btn-debt')?.classList.add('btn-outline');

        document.getElementById('logout-btn')?.classList.add('d-none');

        this.renderStoreProducts();
        this.updateCartBadge();
    }

    showDebtView() {
        this.currentView = 'debt';
        window.location.hash = '#debt';

        document.getElementById('store-view')?.classList.add('d-none');
        document.getElementById('debt-portal-view')?.classList.remove('d-none');
        document.getElementById('admin-panel-view')?.classList.add('d-none');

        document.getElementById('nav-btn-debt')?.classList.add('btn-primary');
        document.getElementById('nav-btn-debt')?.classList.remove('btn-outline');
        document.getElementById('nav-btn-store')?.classList.remove('btn-primary');
        document.getElementById('nav-btn-store')?.classList.add('btn-outline');

        document.getElementById('logout-btn')?.classList.add('d-none');

        this.checkCustomerSession();
    }

    showAdminPanel() {
        this.currentView = 'admin';
        window.location.hash = '#admin';

        document.getElementById('store-view')?.classList.add('d-none');
        document.getElementById('debt-portal-view')?.classList.add('d-none');
        document.getElementById('admin-panel-view')?.classList.remove('d-none');

        document.getElementById('nav-btn-store')?.classList.remove('btn-primary');
        document.getElementById('nav-btn-store')?.classList.add('btn-outline');
        document.getElementById('nav-btn-debt')?.classList.remove('btn-primary');
        document.getElementById('nav-btn-debt')?.classList.add('btn-outline');

        const isAuth = window.qarzStorage.checkAuth();
        const loginSec = document.getElementById('admin-login-section');
        const dashSec = document.getElementById('admin-dashboard-section');
        const logoutBtn = document.getElementById('logout-btn');

        if (isAuth) {
            loginSec?.classList.add('d-none');
            dashSec?.classList.remove('d-none');
            logoutBtn?.classList.remove('d-none');
            this.renderAdminDashboard();
        } else {
            loginSec?.classList.remove('d-none');
            dashSec?.classList.add('d-none');
            logoutBtn?.classList.add('d-none');
        }
    }

    // ============================================================
    // 1. ONLAYN DO'KON (MARKET) LOGIKASI
    // ============================================================

    filterStoreCategory(category, el) {
        this.selectedCategory = category;
        document.querySelectorAll('.category-pill').forEach(btn => btn.classList.remove('active'));
        if (el) el.classList.add('active');
        this.renderStoreProducts();
    }

    renderStoreProducts() {
        const grid = document.getElementById('store-products-grid');
        if (!grid) return;

        let products = window.qarzStorage.getProducts();
        const searchQuery = (document.getElementById('store-search-input')?.value || '').toLowerCase().trim();
        const settings = window.qarzStorage.getSettings();

        // Kategoriya bo'yicha filter
        if (this.selectedCategory !== 'all') {
            products = products.filter(p => p.category === this.selectedCategory);
        }

        // Qidiruv bo'yicha filter
        if (searchQuery) {
            products = products.filter(p => 
                p.name.toLowerCase().includes(searchQuery) || 
                (p.description || '').toLowerCase().includes(searchQuery) ||
                p.category.toLowerCase().includes(searchQuery)
            );
        }

        if (products.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
                    <div style="font-size: 3rem; margin-bottom: 0.5rem;">📦</div>
                    <h3>Bunday mahsulot topilmadi</h3>
                    <p style="font-size: 0.85rem;">Boshqa nom yoki kategoriya bo'yicha qidirib ko'ring.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = products.map(p => `
            <div class="product-card">
                <div class="product-img-box">
                    <span>${p.emoji || '📦'}</span>
                    <span class="product-cat-badge">${p.category}</span>
                    <span class="product-stock-badge">Omborda: ${p.stock} ${p.unit}</span>
                </div>
                <div class="product-body">
                    <h4 class="product-title">${p.name}</h4>
                    <p class="product-desc">${p.description || 'Sifatli kafolatlangan mahsulot.'}</p>
                    <div class="product-price-row">
                        <span class="product-price">${QarzExport.formatMoney(p.price, settings.currency)}</span>
                        <span class="product-unit">/ 1 ${p.unit}</span>
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-primary btn-sm w-full" onclick="app.handleAddToCart('${p.id}')">
                            🛒 Savatga
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="app.quickBuyOnCredit('${p.id}')" title="Bir zumda qarz daftariga olish">
                            📝 Nasiya
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // ============================================================
    // 2. SAVAT (SHOPPING CART) VA CHECKOUT LOGIKASI
    // ============================================================

    handleAddToCart(productId) {
        window.qarzStorage.addToCart(productId, 1);
        this.updateCartBadge();
        this.showToast("Mahsulot savatga qo'shildi! 🛒", "success");
    }

    quickBuyOnCredit(productId) {
        window.qarzStorage.addToCart(productId, 1);
        this.updateCartBadge();
        this.selectCheckoutChoice('debt');
        this.openCheckoutModal();
    }

    updateCartBadge() {
        const cart = window.qarzStorage.getCart();
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);

        const navBadge = document.getElementById('nav-cart-count');
        if (navBadge) navBadge.innerText = count;

        const bannerBadge = document.getElementById('store-banner-cart-count');
        if (bannerBadge) bannerBadge.innerText = count;
    }

    openCartModal() {
        this.renderCartModal();
        this.openModal('modal-cart');
    }

    renderCartModal() {
        const container = document.getElementById('cart-items-container');
        const totalEl = document.getElementById('cart-total-amount');
        const cart = window.qarzStorage.getCart();
        const settings = window.qarzStorage.getSettings();

        if (cart.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
                    <div style="font-size: 3rem; margin-bottom: 0.5rem;">🛒</div>
                    <p style="font-weight: 600;">Savat hozircha bo'sh</p>
                    <button class="btn btn-outline btn-sm" style="margin-top: 0.75rem;" onclick="app.closeModal('modal-cart'); app.showStoreView();">
                        Do'konga o'tish
                    </button>
                </div>
            `;
            if (totalEl) totalEl.innerText = "0 " + settings.currency;
            return;
        }

        let total = 0;
        container.innerHTML = cart.map(item => {
            const itemSubtotal = item.price * item.quantity;
            total += itemSubtotal;

            return `
                <div class="cart-item-row">
                    <div style="font-size: 1.6rem;">${item.emoji || '📦'}</div>
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">${QarzExport.formatMoney(item.price, settings.currency)} / 1 ${item.unit || 'dona'}</div>
                    </div>
                    <div class="cart-qty-ctrl">
                        <button class="cart-qty-btn" onclick="app.changeCartQty('${item.productId}', -1)">-</button>
                        <span class="cart-qty-val">${item.quantity}</span>
                        <button class="cart-qty-btn" onclick="app.changeCartQty('${item.productId}', 1)">+</button>
                    </div>
                    <div class="cart-item-total">${QarzExport.formatMoney(itemSubtotal, settings.currency)}</div>
                    <button class="btn btn-ghost btn-sm text-danger" onclick="app.removeCartItem('${item.productId}')">✕</button>
                </div>
            `;
        }).join('');

        if (totalEl) totalEl.innerText = QarzExport.formatMoney(total, settings.currency);
    }

    changeCartQty(productId, delta) {
        const cart = window.qarzStorage.getCart();
        const item = cart.find(i => i.productId === productId);
        if (item) {
            const newQty = item.quantity + delta;
            window.qarzStorage.updateCartQuantity(productId, newQty);
            this.updateCartBadge();
            this.renderCartModal();
        }
    }

    removeCartItem(productId) {
        window.qarzStorage.removeFromCart(productId);
        this.updateCartBadge();
        this.renderCartModal();
    }

    clearUserCart() {
        if (confirm("Savatdagi barcha mahsulotlarni tozalaysizmi?")) {
            window.qarzStorage.clearCart();
            this.updateCartBadge();
            this.renderCartModal();
            this.showToast("Savat tozalandi", "info");
        }
    }

    selectCheckoutChoice(choice) {
        this.checkoutChoice = choice;
        const cashCard = document.getElementById('choice-pay-cash');
        const debtCard = document.getElementById('choice-pay-debt');
        const notice = document.getElementById('cart-debt-notice');

        if (choice === 'debt') {
            debtCard?.classList.add('selected');
            cashCard?.classList.remove('selected');
            if (notice) notice.style.display = 'block';
        } else {
            cashCard?.classList.add('selected');
            debtCard?.classList.remove('selected');
            if (notice) notice.style.display = 'none';
        }
    }

    // --- CHECKOUT (RASMIYLASHTIRISH) ---
    openCheckoutModal() {
        const cart = window.qarzStorage.getCart();
        if (cart.length === 0) {
            this.showToast("Avval savatga mahsulot qo'shing!", "warning");
            return;
        }

        this.closeModal('modal-cart');
        const customers = window.qarzStorage.getCustomers();
        const select = document.getElementById('checkout-customer-select');
        const currCust = window.qarzStorage.getCurrentCustomer();

        if (customers.length === 0) {
            this.showToast("Xarid uchun avval mijoz sifatida ro'yxatdan o'tishingiz kerak!", "warning");
            this.openCustomerAuthModal('register');
            return;
        }

        select.innerHTML = customers.map(c => `
            <option value="${c.id}" ${currCust && currCust.id === c.id ? 'selected' : ''}>
                ${c.name} (${c.phone}) ${c.hasFaceId ? '✓ Face ID' : ''}
            </option>
        `).join('');

        // Qarz muddati
        const dueGroup = document.getElementById('checkout-due-date-group');
        const submitBtn = document.getElementById('checkout-submit-btn');
        const payTypeSummary = document.getElementById('checkout-summary-paytype');
        const totalSummary = document.getElementById('checkout-summary-total');
        const settings = window.qarzStorage.getSettings();

        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        totalSummary.innerText = QarzExport.formatMoney(total, settings.currency);

        if (this.checkoutChoice === 'debt') {
            dueGroup.style.display = 'block';
            payTypeSummary.innerText = "Qarzga (Nasiya / Qarz Daftari)";
            payTypeSummary.className = "text-danger font-bold";
            submitBtn.innerText = "Qarzga Olish & Nasiya Cheki Chiqarish";

            const d = new Date();
            d.setDate(d.getDate() + 30);
            document.getElementById('checkout-due-date').value = d.toISOString().split('T')[0];
        } else {
            dueGroup.style.display = 'none';
            payTypeSummary.innerText = "Naqd pul / Karta bilan";
            payTypeSummary.className = "text-success font-bold";
            submitBtn.innerText = "Xaridni Tasdiqlash & Chek Chiqarish";
        }

        this.openModal('modal-checkout');
    }

    setCheckoutDueDays(days) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        document.getElementById('checkout-due-date').value = d.toISOString().split('T')[0];
    }

    handleProcessCheckout(e) {
        e.preventDefault();
        const cart = window.qarzStorage.getCart();
        const customerId = document.getElementById('checkout-customer-select').value;
        const customer = window.qarzStorage.getCustomerById(customerId);
        const dueDate = document.getElementById('checkout-due-date').value;
        const note = document.getElementById('checkout-note').value;

        const res = window.qarzStorage.checkoutOrder({
            customerId: customer.id,
            customerName: customer.name,
            customerPhone: customer.phone,
            items: cart,
            paymentType: this.checkoutChoice,
            dueDate: this.checkoutChoice === 'debt' ? dueDate : null,
            note: note
        });

        if (res.success) {
            this.closeModal('modal-checkout');
            this.updateCartBadge();
            this.showToast("Xarid muvaffaqiyatli rasmiylashtirildi!", "success");

            // Nasiya yoki Savdo Chekini chiqarish
            const receiptHtml = QarzExport.renderOrderReceiptHTML(res.order, res.debt, customer);
            this.showCustomReceipt(receiptHtml);

            // Agar qarzga olingan bo'lsa va mijoz o'z kabinetida bo'lsa yangilash
            if (this.currentView === 'debt') {
                this.checkCustomerSession();
            }
        } else {
            this.showToast(res.message, "danger");
        }
    }

    // ============================================================
    // 3. MIJOZLAR KABINETI & QARZLARNI O'ZIGA KO'RSATISH
    // ============================================================

    checkCustomerSession() {
        const cust = window.qarzStorage.getCurrentCustomer();
        const guestSec = document.getElementById('public-guest-section');
        const cabSec = document.getElementById('customer-cabinet-section');
        const authBtnText = document.getElementById('cust-auth-btn-text');

        if (cust) {
            guestSec?.classList.add('d-none');
            cabSec?.classList.remove('d-none');
            if (authBtnText) authBtnText.innerText = cust.name.split(' ')[0] + " (Kabinet)";
            this.renderCustomerCabinet(cust);
        } else {
            guestSec?.classList.remove('d-none');
            cabSec?.classList.add('d-none');
            if (authBtnText) authBtnText.innerText = "Mijoz Kabineti";
        }
    }

    renderCustomerCabinet(cust) {
        const container = document.getElementById('customer-cabinet-content');
        if (!container) return;

        const bal = window.qarzStorage.getCustomerBalance(cust.id);
        const settings = window.qarzStorage.getSettings();
        const debts = window.qarzStorage.getDebtsByCustomer(cust.id);
        const payments = window.qarzStorage.getPaymentsByCustomer(cust.id);

        const repaymentPercent = bal.totalDebt > 0 ? Math.min(100, Math.round((bal.totalPaid / bal.totalDebt) * 100)) : 100;

        let avatarHtml = `<div class="cust-avatar-large">${cust.name.charAt(0).toUpperCase()}</div>`;
        if (cust.faceIdData && cust.faceIdData.startsWith('data:image')) {
            avatarHtml = `<div class="cust-avatar-large"><img src="${cust.faceIdData}" alt="Face ID"></div>`;
        }

        let bonusBannerHtml = '';
        if (bal.advanceBonusActive) {
            bonusBannerHtml = `
                <div class="bonus-banner">
                    <div class="banner-icon">🌟</div>
                    <div class="banner-text">
                        <h4>OLDINDAN TO'LOV IMTIYOZI FAOL (0% FOIZ)!</h4>
                        <p>Siz o'z qarzingizni muddatidan oldin to'lagansiz. Shuning uchun keyingi oy qarzlariga <strong>0% foiz</strong> hisoblanadi!</p>
                    </div>
                </div>
            `;
        }

        let penaltyBannerHtml = '';
        if (bal.totalInterest > 0) {
            penaltyBannerHtml = `
                <div class="penalty-banner">
                    <div class="banner-icon">⚠️</div>
                    <div class="banner-text">
                        <h4>TO'LOV MUDDATI KECHIKKAN (FOIZ QO'SHILDI)!</h4>
                        <p>Qarz muddati kechikkanligi sababli oylik <strong>${settings.overdueMonthlyRate}%</strong> miqdorida 
                        <strong>+${QarzExport.formatMoney(bal.totalInterest, settings.currency)}</strong> foiz qo'shildi.</p>
                    </div>
                </div>
            `;
        }

        container.innerHTML = `
            <!-- Profil Hero -->
            <div class="cust-dashboard-hero">
                <div style="display: flex; align-items: center; gap: 1.25rem; flex-wrap: wrap;">
                    ${avatarHtml}
                    <div>
                        <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
                            <h2 style="font-size: 1.6rem; font-weight: 800;">${cust.name}</h2>
                            ${cust.hasFaceId ? '<span class="badge-faceid">✓ Face ID Tasdiqlangan</span>' : ''}
                        </div>
                        <p style="opacity: 0.85; font-size: 0.9rem; margin-top: 0.2rem;">
                            📞 ${cust.phone} | 📍 ${cust.address || 'Manzil ko\'rsatilmagan'}
                        </p>
                    </div>
                </div>
                <div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
                    <button class="btn btn-outline" style="border-color: rgba(255,255,255,0.4); color: #fff;" onclick="app.showStoreView()">
                        🛍️ Do'kondan xarid
                    </button>
                    <button class="btn btn-outline" style="border-color: rgba(255,255,255,0.4); color: #fff;" onclick="app.showCustomerReceipt('${cust.id}')">
                        🖨 Kvitansiya
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="app.handleCustomerLogout()">
                        Chiqish
                    </button>
                </div>
            </div>

            ${bonusBannerHtml}
            ${penaltyBannerHtml}

            <!-- 3 ta Asosiy Balans Ko'rsatkichi -->
            <div class="balance-summary-grid" style="background: var(--bg-card); border-radius: var(--radius-lg); margin-bottom: 2rem; border: 1px solid var(--border-color);">
                <div class="bal-box">
                    <div class="bal-label">Asosiy Qarz Qoldig'i</div>
                    <div class="bal-value">${QarzExport.formatMoney(bal.remaining, settings.currency)}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">Jami olingan qarz: ${QarzExport.formatMoney(bal.totalDebt, settings.currency)}</div>
                </div>
                <div class="bal-box ${bal.totalInterest > 0 ? 'danger' : 'success'}">
                    <div class="bal-label">Kechikish Foizi</div>
                    <div class="bal-value">${bal.totalInterest > 0 ? '+' + QarzExport.formatMoney(bal.totalInterest, settings.currency) : "0 so'm (0%)"}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">
                        ${bal.advanceBonusActive ? '✓ 0% imtiyoz egasisiz' : 'Oylik stavka: ' + settings.overdueMonthlyRate + '%'}
                    </div>
                </div>
                <div class="bal-box ${bal.totalPayable > 0 ? 'danger' : 'success'}">
                    <div class="bal-label">JAMI TO'LANISHI KERAK</div>
                    <div class="bal-value">${QarzExport.formatMoney(bal.totalPayable, settings.currency)}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">To'langan qism: ${QarzExport.formatMoney(bal.totalPaid, settings.currency)} (${repaymentPercent}%)</div>
                </div>
            </div>

            <!-- Tezkor Amallar -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                <button class="btn btn-success btn-lg" onclick="app.openOnlinePaymentModal()">
                    💳 Onlayn To'lov Qilish
                </button>
                <button class="btn btn-primary btn-lg" onclick="app.showStoreView()">
                    🛍️ Qarzga Mahsulot Olish
                </button>
                <button class="btn btn-outline btn-lg" onclick="app.openCustomerRequestModal()">
                    📝 Alohida Qarz So'rovi
                </button>
                <button class="btn btn-outline btn-lg" onclick="app.openFaceCaptureForRegister()">
                    📸 Face ID Yangilash
                </button>
            </div>

            <!-- Qarzlar va Olingan Maxsulotlar Jadvali -->
            <div class="content-box">
                <div class="box-header">
                    <div class="box-title">Mening Barcha Qarzlarim & Nasiya Xaridlarim Tarixi (${debts.length})</div>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Sana</th>
                                <th>Olingan Mahsulotlar / Xarid</th>
                                <th>Asosiy Summa</th>
                                <th>To'langan</th>
                                <th>Kechikish Foizi</th>
                                <th>Qaytarish Muddati</th>
                                <th>Holat</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${debts.length === 0 ? '<tr><td colspan="7" style="text-align:center; padding: 2rem; color: var(--text-muted);">Sizda hozircha qarzlar yo\'q</td></tr>' : ''}
                            ${bal.detailedDebts.map(d => `
                                <tr>
                                    <td>${QarzExport.formatDate(d.date)}</td>
                                    <td style="font-weight: 600;">${d.description}</td>
                                    <td>${QarzExport.formatMoney(d.amount, settings.currency)}</td>
                                    <td class="text-success font-bold">${QarzExport.formatMoney(d.paidAmount, settings.currency)}</td>
                                    <td class="${d.interest > 0 ? 'text-danger font-bold' : ''}">
                                        ${d.interest > 0 ? '+' + QarzExport.formatMoney(d.interest, settings.currency) + ` (${d.overdueDays} kun)` : (bal.advanceBonusActive ? '<span class="text-success font-bold">0% (Imtiyoz)</span>' : '0')}
                                    </td>
                                    <td>${d.dueDate ? QarzExport.formatDate(d.dueDate) : '-'}</td>
                                    <td>
                                        ${d.isPaid ? '<span class="badge badge-success">To\'langan</span>' : (d.isOverdue ? '<span class="badge badge-danger">Muddati o\'tgan</span>' : '<span class="badge badge-primary">Faol</span>')}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- To'lovlar tarixi -->
            <div class="content-box">
                <div class="box-header">
                    <div class="box-title">To'lovlar Tarixi (${payments.length})</div>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Chek №</th>
                                <th>Sana</th>
                                <th>To'lov Usuli</th>
                                <th>Summa</th>
                                <th>Izoh</th>
                                <th style="text-align: right;">Chek</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${payments.length === 0 ? '<tr><td colspan="6" style="text-align:center; padding: 2rem; color: var(--text-muted);">Hozircha to\'lovlar yo\'q</td></tr>' : ''}
                            ${payments.map(p => `
                                <tr>
                                    <td><strong style="color: var(--primary);">${p.receiptNumber}</strong></td>
                                    <td>${QarzExport.formatDate(p.date)}</td>
                                    <td><span class="badge badge-muted">${p.paymentMethod.toUpperCase()}</span></td>
                                    <td class="text-success font-bold">${QarzExport.formatMoney(p.amount, settings.currency)}</td>
                                    <td>${p.note || '-'}</td>
                                    <td style="text-align: right;">
                                        <button class="btn btn-outline btn-sm" onclick="app.showPaymentReceipt('${p.id}')">🖨 Chek</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // ============================================================
    // 4. MIJOZ AUTH & FACE ID LOGIKASI
    // ============================================================

    openCustomerAuthModal(tab = 'login') {
        this.openModal('modal-customer-auth');
        this.switchAuthTab(tab);
    }

    switchAuthTab(tab) {
        const loginForm = document.getElementById('cust-login-form');
        const faceBox = document.getElementById('cust-face-login-box');
        const regForm = document.getElementById('cust-register-form');

        ['login', 'face', 'register'].forEach(t => {
            document.getElementById(`auth-tab-btn-${t}`)?.classList.toggle('active', t === tab);
        });

        loginForm?.classList.add('d-none');
        faceBox?.classList.add('d-none');
        regForm?.classList.add('d-none');

        this.stopCamera();

        if (tab === 'login') loginForm?.classList.remove('d-none');
        else if (tab === 'face') {
            faceBox?.classList.remove('d-none');
            this.startCamera('face-login-video');
        } else if (tab === 'register') regForm?.classList.remove('d-none');
    }

    handleCustomerLogin(e) {
        e.preventDefault();
        const phone = document.getElementById('cust-login-phone').value;
        const pass = document.getElementById('cust-login-pass').value;

        const res = window.qarzStorage.loginCustomer(phone, pass);
        if (res.success) {
            this.closeModal('modal-customer-auth');
            this.showToast(`Xush kelibsiz, ${res.customer.name}!`, "success");
            this.showDebtView();
        } else {
            this.showToast(res.message, "danger");
        }
    }

    handleCustomerRegister(e) {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const phone = document.getElementById('reg-phone').value;
        const password = document.getElementById('reg-password').value;
        const address = document.getElementById('reg-address').value;
        const faceIdData = document.getElementById('reg-face-data').value;

        const res = window.qarzStorage.registerCustomer({
            name,
            phone,
            password,
            address,
            faceIdData
        });

        if (res.success) {
            this.closeModal('modal-customer-auth');
            this.showToast("Muvaffaqiyatli ro'yxatdan o'tdingiz!", "success");
            this.showDebtView();
        } else {
            this.showToast(res.message, "danger");
        }
    }

    openFaceLoginQuick() {
        this.openCustomerAuthModal('face');
    }

    captureFaceForLogin() {
        const video = document.getElementById('face-login-video');
        const canvas = document.createElement('canvas');

        if (!video || !video.videoWidth) {
            const res = window.qarzStorage.loginCustomerByFace('sample_face');
            if (res.success) {
                this.stopCamera();
                this.closeModal('modal-customer-auth');
                this.showToast(`✓ Face ID orqali tanildingiz! Xush kelibsiz, ${res.customer.name}!`, "success");
                this.showDebtView();
            } else {
                this.showToast(res.message, "danger");
            }
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

        const res = window.qarzStorage.loginCustomerByFace(dataUrl);
        if (res.success) {
            this.stopCamera();
            this.closeModal('modal-customer-auth');
            this.showToast(`✓ Face ID orqali tanildingiz! Xush kelibsiz, ${res.customer.name}!`, "success");
            this.showDebtView();
        } else {
            this.showToast(res.message, "danger");
        }
    }

    handleCustomerLogout() {
        window.qarzStorage.logoutCustomer();
        this.showToast("Kabinetingizdan chiqildi", "info");
        this.checkCustomerSession();
    }

    // --- KAMERA & WEBRTC ---
    async startCamera(videoId) {
        const video = document.getElementById(videoId);
        if (!video) return;

        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } }
                });
                this.activeCameraStream = stream;
                video.srcObject = stream;
                video.play();
            }
        } catch (err) {
            this.showToast("Kameraga ruxsat berilmadi. Fayl yuklashdan foydalaning.", "warning");
        }
    }

    stopCamera() {
        if (this.activeCameraStream) {
            this.activeCameraStream.getTracks().forEach(track => track.stop());
            this.activeCameraStream = null;
        }
    }

    openFaceCaptureForRegister() {
        this.openModal('modal-face-camera');
        this.startCamera('face-cam-video');
    }

    closeFaceCameraModal() {
        this.stopCamera();
        this.closeModal('modal-face-camera');
    }

    snapFacePhoto() {
        const video = document.getElementById('face-cam-video');
        const canvas = document.getElementById('face-cam-canvas');
        let dataUrl = "";

        if (video && video.videoWidth > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        } else {
            dataUrl = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="%232563eb"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>';
        }

        document.getElementById('reg-face-data').value = dataUrl;
        const previewWrap = document.getElementById('reg-face-preview-wrap');
        const previewImg = document.getElementById('reg-face-preview-img');
        if (previewWrap && previewImg) {
            previewWrap.style.display = 'block';
            previewImg.src = dataUrl;
        }

        const currentCust = window.qarzStorage.getCurrentCustomer();
        if (currentCust) {
            window.qarzStorage.saveCustomer({
                id: currentCust.id,
                faceIdData: dataUrl,
                hasFaceId: true
            });
            this.renderCustomerCabinet(window.qarzStorage.getCurrentCustomer());
        }

        this.closeFaceCameraModal();
        this.showToast("✓ Face ID saqlandi!", "success");
    }

    handleFaceFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            document.getElementById('reg-face-data').value = dataUrl;

            const previewWrap = document.getElementById('reg-face-preview-wrap');
            const previewImg = document.getElementById('reg-face-preview-img');
            if (previewWrap && previewImg) {
                previewWrap.style.display = 'block';
                previewImg.src = dataUrl;
            }

            const currentCust = window.qarzStorage.getCurrentCustomer();
            if (currentCust) {
                window.qarzStorage.saveCustomer({
                    id: currentCust.id,
                    faceIdData: dataUrl,
                    hasFaceId: true
                });
                this.renderCustomerCabinet(window.qarzStorage.getCurrentCustomer());
            }

            this.closeFaceCameraModal();
            this.showToast("✓ Yuz surati saqlandi!", "success");
        };
        reader.readAsDataURL(file);
    }

    // ============================================================
    // 5. OCHIQ QIDIRUV (PUBLIC SEARCH)
    // ============================================================

    handlePublicSearch() {
        const input = document.getElementById('public-search-input');
        const query = (input?.value || '').trim();
        const container = document.getElementById('public-result-container');

        if (!query) {
            this.showToast("Iltimos, telefon raqamingiz yoki ismingizni kiriting!", "warning");
            return;
        }

        let customer = window.qarzStorage.findCustomerByPhone(query);
        if (!customer) {
            const results = window.qarzStorage.searchCustomers(query);
            if (results.length > 0) customer = results[0];
        }

        container.classList.remove('d-none');

        if (!customer) {
            container.innerHTML = `
                <div class="search-box-card" style="text-align: center; padding: 2.5rem 1.5rem;">
                    <div style="font-size: 3rem; margin-bottom: 0.5rem;">🔍</div>
                    <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">Mijoz topilmadi</h3>
                    <p style="color: var(--text-muted); font-size: 0.9rem; max-width: 480px; margin: 0 auto 1.5rem;">
                        "${query}" bo'yicha hech qanday ma'lumot topilmadi.
                    </p>
                    <button class="btn btn-outline" onclick="app.fillPublicSearch('')">Qaytadan qidirish</button>
                    <button class="btn btn-primary" onclick="app.openCustomerAuthModal('register')">Ro'yxatdan O'tish</button>
                </div>
            `;
            return;
        }

        const bal = window.qarzStorage.getCustomerBalance(customer.id);
        const settings = window.qarzStorage.getSettings();

        let statusBadge = `<span class="badge badge-success">Toza (Qarz yo'q)</span>`;
        if (bal.status === 'overdue') statusBadge = `<span class="badge badge-danger">⚠️ Muddati kechikkan!</span>`;
        else if (bal.status === 'debtor') statusBadge = `<span class="badge badge-warning">Faol Qarz</span>`;

        container.innerHTML = `
            <div class="debtor-profile-card">
                <div class="profile-card-header">
                    <div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span class="profile-name">${customer.name}</span>
                            ${customer.hasFaceId ? '<span class="badge-faceid">✓ Face ID</span>' : ''}
                        </div>
                        <div class="profile-meta">
                            <span>📞 ${customer.phone}</span>
                            ${customer.address ? `<span>📍 ${customer.address}</span>` : ''}
                        </div>
                    </div>
                    <div>${statusBadge}</div>
                </div>

                ${bal.advanceBonusActive ? `
                    <div style="background-color: var(--success-light); color: var(--success-text); padding: 0.75rem 1.5rem; font-size: 0.85rem; font-weight: 700; border-bottom: 1px solid var(--border-color);">
                        🌟 OLDINDAN TO'LOV IMTIYOZI FAOL: Keyingi oy qarziga 0% foiz beriladi!
                    </div>
                ` : ''}

                ${bal.totalInterest > 0 ? `
                    <div style="background-color: var(--danger-light); color: var(--danger-text); padding: 0.75rem 1.5rem; font-size: 0.85rem; font-weight: 700; border-bottom: 1px solid var(--border-color);">
                        ⚠️ To'lov kechikkanligi sababli +${QarzExport.formatMoney(bal.totalInterest, settings.currency)} foiz qo'shildi!
                    </div>
                ` : ''}

                <div class="balance-summary-grid">
                    <div class="bal-box">
                        <div class="bal-label">Asosiy Qarz Qoldig'i</div>
                        <div class="bal-value">${QarzExport.formatMoney(bal.remaining, settings.currency)}</div>
                    </div>
                    <div class="bal-box ${bal.totalInterest > 0 ? 'danger' : 'success'}">
                        <div class="bal-label">Hisoblangan Foiz</div>
                        <div class="bal-value">${bal.totalInterest > 0 ? '+' + QarzExport.formatMoney(bal.totalInterest, settings.currency) : "0 so'm"}</div>
                    </div>
                    <div class="bal-box ${bal.totalPayable > 0 ? 'danger' : 'success'}">
                        <div class="bal-label">JAMI TO'LANISHI KERAK</div>
                        <div class="bal-value">${QarzExport.formatMoney(bal.totalPayable, settings.currency)}</div>
                    </div>
                </div>

                <div style="padding: 1.25rem 1.5rem; background-color: var(--bg-main); border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">
                        Do'kon bilan aloqa: <strong>${settings.storePhone}</strong>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-outline btn-sm" onclick="app.showCustomerReceipt('${customer.id}')">
                            🖨 Kvitansiya
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="app.openCustomerAuthModal('login')">
                            Kabinetga Kirish
                        </button>
                    </div>
                </div>
            </div>
        `;

        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    fillPublicSearch(val) {
        const input = document.getElementById('public-search-input');
        if (input) {
            input.value = val;
            if (val) this.handlePublicSearch();
            else {
                document.getElementById('public-result-container')?.classList.add('d-none');
                input.focus();
            }
        }
    }

    // ============================================================
    // 6. ADMIN BOSHQARUV PANELI
    // ============================================================

    handleAdminLogin(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const pass = document.getElementById('login-password').value;

        const res = window.qarzStorage.login(username, pass);
        if (res.success) {
            this.showToast("Muvaffaqiyatli kirildi!", "success");
            this.showAdminPanel();
        } else {
            this.showToast(res.message, "danger");
        }
    }

    handleLogout() {
        window.qarzStorage.logout();
        this.showToast("Admin tizimidan chiqildi", "info");
        this.showStoreView();
    }

    renderAdminDashboard() {
        this.updateHeaderSettings();
        this.renderStatsCards();
        this.renderCustomersTable();
        this.renderProductsTable();
        this.renderOrdersTable();
        this.renderDebtsTable();
        this.renderPaymentsTable();
        this.renderRequestsTable();
        this.populateSettingsForm();
    }

    renderStatsCards() {
        const stats = window.qarzStorage.getOverallStats();
        const settings = window.qarzStorage.getSettings();

        document.getElementById('stat-total-remaining').innerText = QarzExport.formatMoney(stats.totalRemaining, settings.currency);
        document.getElementById('stat-debtors-count').innerText = `${stats.activeDebtorsCount} nafar faol qarzdor`;

        document.getElementById('stat-total-interest').innerText = `+${QarzExport.formatMoney(stats.totalInterestAccrued, settings.currency)}`;
        document.getElementById('stat-overdue-count').innerText = `${stats.overdueCount} ta mijoz kechikkan`;

        document.getElementById('stat-total-paid').innerText = QarzExport.formatMoney(stats.totalPaid, settings.currency);
        document.getElementById('stat-recovery-rate').innerText = `Qaytarilish: ${stats.recoveryRate}%`;

        document.getElementById('stat-today-payments').innerText = QarzExport.formatMoney(stats.todayPayments, settings.currency);
        document.getElementById('stat-month-payments').innerText = `Shu oyda: ${QarzExport.formatMoney(stats.thisMonthPayments, settings.currency)}`;

        document.getElementById('tab-badge-customers').innerText = stats.totalCustomers;
        document.getElementById('tab-badge-products').innerText = window.qarzStorage.getProducts().length;
        document.getElementById('tab-badge-orders').innerText = stats.ordersCount;
        document.getElementById('tab-badge-debts').innerText = window.qarzStorage.getDebts().length;
        document.getElementById('tab-badge-payments').innerText = window.qarzStorage.getPayments().length;
        document.getElementById('tab-badge-requests').innerText = window.qarzStorage.getDebtRequests().filter(r => r.status === 'pending').length;
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        const tabs = ['customers', 'products', 'orders', 'debts', 'payments', 'requests', 'settings'];

        tabs.forEach(t => {
            const btn = document.getElementById(`tab-btn-${t}`);
            const content = document.getElementById(`tab-content-${t}`);
            if (t === tabName) {
                btn?.classList.add('active');
                content?.classList.remove('d-none');
            } else {
                btn?.classList.remove('active');
                content?.classList.add('d-none');
            }
        });

        if (tabName === 'customers') this.renderCustomersTable();
        if (tabName === 'products') this.renderProductsTable();
        if (tabName === 'orders') this.renderOrdersTable();
        if (tabName === 'debts') this.renderDebtsTable();
        if (tabName === 'payments') this.renderPaymentsTable();
        if (tabName === 'requests') this.renderRequestsTable();
    }

    // --- TAB: MAHSULOTLAR VA OMBOR (ADMIN) ---
    renderProductsTable() {
        const tbody = document.getElementById('products-table-body');
        if (!tbody) return;

        const products = window.qarzStorage.getProducts();
        const settings = window.qarzStorage.getSettings();

        if (products.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 3rem;">Mahsulotlar yo'q</td></tr>`;
            return;
        }

        tbody.innerHTML = products.map(p => `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.6rem;">
                        <span style="font-size: 1.5rem;">${p.emoji || '📦'}</span>
                        <div>
                            <div style="font-weight: 700;">${p.name}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">${p.description || '-'}</div>
                        </div>
                    </div>
                </td>
                <td><span class="badge badge-muted">${p.category}</span></td>
                <td style="font-weight: 700; color: var(--primary);">${QarzExport.formatMoney(p.price, settings.currency)}</td>
                <td>1 ${p.unit}</td>
                <td>
                    <span class="badge ${p.stock > 10 ? 'badge-success' : 'badge-danger'}">${p.stock} ${p.unit}</span>
                </td>
                <td>
                    ${p.stock > 0 ? '<span class="badge badge-success">Sotuvda</span>' : '<span class="badge badge-danger">Tugagan</span>'}
                </td>
                <td style="text-align: right;">
                    <button class="btn btn-ghost btn-sm" onclick="app.openEditProductModal('${p.id}')">✏️</button>
                    <button class="btn btn-ghost btn-sm text-danger" onclick="app.confirmDeleteProduct('${p.id}', '${p.name}')">🗑</button>
                </td>
            </tr>
        `).join('');
    }

    openAddProductModal() {
        document.getElementById('product-modal-title').innerText = "Yangi Mahsulot Qo'shish";
        document.getElementById('prod-id').value = '';
        document.getElementById('prod-name').value = '';
        document.getElementById('prod-category').value = 'Oziq-ovqat';
        document.getElementById('prod-emoji').value = '📦';
        document.getElementById('prod-price').value = '';
        document.getElementById('prod-unit').value = 'dona';
        document.getElementById('prod-stock').value = '20';
        document.getElementById('prod-desc').value = '';

        this.openModal('modal-product');
    }

    openEditProductModal(id) {
        const p = window.qarzStorage.getProductById(id);
        if (!p) return;

        document.getElementById('product-modal-title').innerText = "Mahsulotni Tahrirlash";
        document.getElementById('prod-id').value = p.id;
        document.getElementById('prod-name').value = p.name;
        document.getElementById('prod-category').value = p.category;
        document.getElementById('prod-emoji').value = p.emoji || '📦';
        document.getElementById('prod-price').value = p.price;
        document.getElementById('prod-unit').value = p.unit;
        document.getElementById('prod-stock').value = p.stock;
        document.getElementById('prod-desc').value = p.description || '';

        this.openModal('modal-product');
    }

    handleSaveProduct(e) {
        e.preventDefault();
        const data = {
            id: document.getElementById('prod-id').value || null,
            name: document.getElementById('prod-name').value,
            category: document.getElementById('prod-category').value,
            emoji: document.getElementById('prod-emoji').value,
            price: document.getElementById('prod-price').value,
            unit: document.getElementById('prod-unit').value,
            stock: document.getElementById('prod-stock').value,
            description: document.getElementById('prod-desc').value
        };

        window.qarzStorage.saveProduct(data);
        this.closeModal('modal-product');
        this.showToast("Mahsulot saqlandi!", "success");
        this.renderProductsTable();
        this.renderStoreProducts();
    }

    confirmDeleteProduct(id, name) {
        if (confirm(`Rostdan ham "${name}" mahsulotini o'chirmoqchimisiz?`)) {
            window.qarzStorage.deleteProduct(id);
            this.showToast("Mahsulot o'chirildi", "info");
            this.renderProductsTable();
            this.renderStoreProducts();
        }
    }

    // --- TAB: BUYURTMALAR (ORDERS) JADVALI ---
    renderOrdersTable() {
        const tbody = document.getElementById('orders-table-body');
        if (!tbody) return;

        const orders = window.qarzStorage.getOrders();
        const settings = window.qarzStorage.getSettings();

        if (orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 3rem;">Buyurtmalar yo'q</td></tr>`;
            return;
        }

        tbody.innerHTML = orders.map(o => {
            const isDebt = o.paymentType === 'debt';
            const itemsStr = (o.items || []).map(i => `${i.name} x${i.quantity}`).join(', ');

            return `
                <tr>
                    <td><strong>${o.orderNumber}</strong></td>
                    <td>${QarzExport.formatDate(o.date)}</td>
                    <td style="font-weight: 700;">${o.customerName}</td>
                    <td>
                        ${isDebt ? '<span class="badge badge-danger">QARZGA (NASIYA)</span>' : '<span class="badge badge-success">TO\'LANGAN</span>'}
                    </td>
                    <td class="font-bold text-primary">${QarzExport.formatMoney(o.totalAmount, settings.currency)}</td>
                    <td style="font-size: 0.8rem; color: var(--text-secondary); max-width: 250px;">${itemsStr}</td>
                    <td style="text-align: right;">
                        <button class="btn btn-outline btn-sm" onclick="app.showOrderReceipt('${o.id}')">🖨 Chek</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    showOrderReceipt(orderId) {
        const order = window.qarzStorage.getOrderById(orderId);
        if (!order) return;
        const customer = order.customerId ? window.qarzStorage.getCustomerById(order.customerId) : null;
        const debt = order.debtId ? window.qarzStorage.getDebtById(order.debtId) : null;

        const html = QarzExport.renderOrderReceiptHTML(order, debt, customer);
        this.showCustomReceipt(html);
    }

    // --- MIJOZLAR JADVALI ---
    setCustomerFilter(filter, el) {
        this.customerFilter = filter;
        document.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
        if (el) el.classList.add('active');
        this.renderCustomersTable();
    }

    renderCustomersTable() {
        const tbody = document.getElementById('customers-table-body');
        if (!tbody) return;

        const searchQuery = (document.getElementById('admin-customer-search')?.value || '').trim();
        let list = window.qarzStorage.searchCustomers(searchQuery);
        const settings = window.qarzStorage.getSettings();

        if (this.customerFilter !== 'all') {
            list = list.filter(c => {
                const bal = window.qarzStorage.getCustomerBalance(c.id);
                return bal.status === this.customerFilter;
            });
        }

        if (list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 3rem;">Hech qanday mijoz topilmadi.</td></tr>`;
            return;
        }

        tbody.innerHTML = list.map(c => {
            const bal = window.qarzStorage.getCustomerBalance(c.id);
            let badge = `<span class="badge badge-success">Toza</span>`;
            if (bal.status === 'overdue') badge = `<span class="badge badge-danger">Muddati O'tgan</span>`;
            else if (bal.status === 'debtor') badge = `<span class="badge badge-warning">Qarzdor</span>`;

            const initial = c.name.charAt(0).toUpperCase();

            return `
                <tr>
                    <td>
                        <div class="customer-cell">
                            <div class="customer-avatar">${initial}</div>
                            <div>
                                <div style="font-weight: 700; cursor: pointer;" onclick="app.openCustomerDetail('${c.id}')">
                                    ${c.name}
                                </div>
                                <div style="font-size: 0.75rem; color: var(--text-muted);">${c.address || 'Manzil yo\'q'}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        ${c.hasFaceId ? '<span class="badge-faceid">✓ Face ID</span>' : '<span style="color: var(--text-muted); font-size: 0.75rem;">Yo\'q</span>'}
                    </td>
                    <td>
                        <a href="tel:${c.phone.replace(/[^0-9+]/g, '')}" style="color: var(--text-primary); text-decoration: none; font-weight: 600;">
                            ${c.phone}
                        </a>
                    </td>
                    <td style="font-weight: 600;">${QarzExport.formatMoney(bal.totalDebt, settings.currency)}</td>
                    <td class="text-success font-bold">${QarzExport.formatMoney(bal.totalPaid, settings.currency)}</td>
                    <td class="${bal.remaining > 0 ? 'text-danger' : 'text-success'} font-bold">
                        ${QarzExport.formatMoney(bal.remaining, settings.currency)}
                    </td>
                    <td class="${bal.totalInterest > 0 ? 'text-danger font-bold' : ''}">
                        ${bal.totalInterest > 0 ? '+' + QarzExport.formatMoney(bal.totalInterest, settings.currency) : '-'}
                    </td>
                    <td>
                        ${bal.advanceBonusActive ? '<span class="badge badge-success">0% (Faol)</span>' : '<span style="color: var(--text-muted);">-</span>'}
                    </td>
                    <td>${badge}</td>
                    <td style="text-align: right;">
                        <div class="table-action-btns" style="justify-content: flex-end;">
                            <button class="btn btn-outline btn-sm" onclick="app.openCustomerDetail('${c.id}')">👁</button>
                            <button class="btn btn-primary btn-sm" onclick="app.openAddDebtModal('${c.id}')">+ Qarz</button>
                            <button class="btn btn-success btn-sm" onclick="app.openPaymentModal('${c.id}')">💰 To'lov</button>
                            ${bal.remaining > 0 ? `<button class="btn btn-outline btn-sm" onclick="app.openShareModal('${c.id}')">💬</button>` : ''}
                            <button class="btn btn-ghost btn-sm" onclick="app.openEditCustomerModal('${c.id}')">✏️</button>
                            <button class="btn btn-ghost btn-sm text-danger" onclick="app.confirmDeleteCustomer('${c.id}', '${c.name}')">🗑</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderDebtsTable() {
        const tbody = document.getElementById('debts-table-body');
        if (!tbody) return;

        const debts = window.qarzStorage.getDebts();
        const settings = window.qarzStorage.getSettings();
        const today = new Date().toISOString().split('T')[0];

        if (debts.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 3rem;">Qarzlar yo'q</td></tr>`;
            return;
        }

        tbody.innerHTML = debts.map(d => {
            const cust = window.qarzStorage.getCustomerById(d.customerId) || { name: 'O\'chirilgan mijoz' };
            const isOverdue = d.dueDate && d.dueDate < today;

            return `
                <tr>
                    <td>${QarzExport.formatDate(d.date)}</td>
                    <td style="font-weight: 700; cursor: pointer;" onclick="app.openCustomerDetail('${d.customerId}')">${cust.name}</td>
                    <td>${d.description}</td>
                    <td class="text-danger font-bold">+${QarzExport.formatMoney(d.amount, settings.currency)}</td>
                    <td>${d.dueDate ? QarzExport.formatDate(d.dueDate) : '-'}</td>
                    <td>${isOverdue ? '<span class="badge badge-danger">Muddati o\'tgan</span>' : '<span class="badge badge-primary">Faol</span>'}</td>
                    <td style="text-align: right;">
                        <button class="btn btn-ghost btn-sm text-danger" onclick="app.confirmDeleteDebt('${d.id}')">🗑</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderPaymentsTable() {
        const tbody = document.getElementById('payments-table-body');
        if (!tbody) return;

        const payments = window.qarzStorage.getPayments();
        const settings = window.qarzStorage.getSettings();

        if (payments.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 3rem;">To'lovlar jurnali bo'sh</td></tr>`;
            return;
        }

        tbody.innerHTML = payments.map(p => {
            const cust = window.qarzStorage.getCustomerById(p.customerId) || { name: 'O\'chirilgan mijoz' };

            return `
                <tr>
                    <td><strong style="color: var(--primary);">${p.receiptNumber}</strong></td>
                    <td>${QarzExport.formatDate(p.date)}</td>
                    <td style="font-weight: 700; cursor: pointer;" onclick="app.openCustomerDetail('${p.customerId}')">${cust.name}</td>
                    <td><span class="badge badge-muted">${p.paymentMethod.toUpperCase()}</span></td>
                    <td class="text-success font-bold">${QarzExport.formatMoney(p.amount, settings.currency)}</td>
                    <td>${p.note || '-'}</td>
                    <td style="text-align: right;">
                        <button class="btn btn-outline btn-sm" onclick="app.showPaymentReceipt('${p.id}')">🖨 Chek</button>
                        <button class="btn btn-ghost btn-sm text-danger" onclick="app.confirmDeletePayment('${p.id}')">🗑</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderRequestsTable() {
        const tbody = document.getElementById('requests-table-body');
        if (!tbody) return;

        const requests = window.qarzStorage.getDebtRequests();
        const settings = window.qarzStorage.getSettings();

        if (requests.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 3rem;">So'rovlar yo'q</td></tr>`;
            return;
        }

        tbody.innerHTML = requests.map(r => {
            const cust = window.qarzStorage.getCustomerById(r.customerId) || { name: 'Noma\'lum', phone: '' };

            let statusBadge = '<span class="badge badge-warning">Kutilmoqda</span>';
            if (r.status === 'approved') statusBadge = '<span class="badge badge-success">Tasdiqlangan</span>';
            else if (r.status === 'rejected') statusBadge = '<span class="badge badge-danger">Rad etilgan</span>';

            return `
                <tr>
                    <td>${QarzExport.formatDate(r.date)}</td>
                    <td style="font-weight: 700;">${cust.name}</td>
                    <td>${cust.phone}</td>
                    <td>${r.description}</td>
                    <td class="font-bold text-primary">${QarzExport.formatMoney(r.amount, settings.currency)}</td>
                    <td>${statusBadge}</td>
                    <td style="text-align: right;">
                        ${r.status === 'pending' ? `
                            <button class="btn btn-success btn-sm" onclick="app.approveRequest('${r.id}')">✓ Tasdiqlash</button>
                            <button class="btn btn-danger btn-sm" onclick="app.rejectRequest('${r.id}')">✕ Rad etish</button>
                        ` : `<span style="color: var(--text-muted); font-size: 0.8rem;">Ko'rib chiqilgan</span>`}
                    </td>
                </tr>
            `;
        }).join('');
    }

    approveRequest(reqId) {
        if (confirm("Ushbu qarz so'rovini tasdiqlab, mijozga qarz yozmoqchimisiz?")) {
            window.qarzStorage.approveDebtRequest(reqId);
            this.showToast("So'rov tasdiqlandi va qarz yozildi!", "success");
            this.renderAdminDashboard();
        }
    }

    rejectRequest(reqId) {
        if (confirm("Ushbu so'rovni rad etmoqchimisiz?")) {
            window.qarzStorage.rejectDebtRequest(reqId);
            this.showToast("So'rov rad etildi", "info");
            this.renderAdminDashboard();
        }
    }

    populateSettingsForm() {
        const s = window.qarzStorage.getSettings();
        document.getElementById('setting-store-name').value = s.storeName || '';
        document.getElementById('setting-store-phone').value = s.storePhone || '';
        document.getElementById('setting-store-address').value = s.storeAddress || '';
        document.getElementById('setting-card-details').value = s.cardDetails || '';
        document.getElementById('setting-currency').value = s.currency || 'so\'m';
        document.getElementById('setting-interest-rate').value = s.overdueMonthlyRate || 3.0;
        document.getElementById('setting-advance-discount').checked = !!s.advanceDiscountEnabled;

        document.getElementById('setting-admin-user').value = s.adminUsername || 'admin';
        document.getElementById('setting-admin-pass').value = '';
    }

    handleSaveStoreSettings(e) {
        e.preventDefault();
        const s = {
            storeName: document.getElementById('setting-store-name').value.trim(),
            storePhone: document.getElementById('setting-store-phone').value.trim(),
            storeAddress: document.getElementById('setting-store-address').value.trim(),
            cardDetails: document.getElementById('setting-card-details').value.trim(),
            currency: document.getElementById('setting-currency').value.trim() || 'so\'m',
            overdueMonthlyRate: Number(document.getElementById('setting-interest-rate').value) || 3.0,
            advanceDiscountEnabled: document.getElementById('setting-advance-discount').checked
        };
        window.qarzStorage.saveSettings(s);
        this.updateHeaderSettings();
        this.renderAdminDashboard();
        this.showToast("Do'kon sozlamalari saqlandi!", "success");
    }

    handleSavePassword(e) {
        e.preventDefault();
        const user = document.getElementById('setting-admin-user').value.trim();
        const pass = document.getElementById('setting-admin-pass').value.trim();

        if (!pass) {
            this.showToast("Parolni kiriting!", "warning");
            return;
        }

        window.qarzStorage.saveSettings({ adminUsername: user, adminPassword: pass });
        document.getElementById('setting-admin-pass').value = '';
        this.showToast("Admin paroli yangilandi!", "success");
    }

    downloadBackup() {
        const json = window.qarzStorage.exportBackupJSON();
        const date = new Date().toISOString().split('T')[0];
        QarzExport.downloadFile(json, `Qarz_Daftari_Zaxira_${date}.json`, 'application/json');
        this.showToast("Zaxira yuklab olindi!", "success");
    }

    handleRestoreBackup(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const res = window.qarzStorage.importBackupJSON(event.target.result);
            if (res.success) {
                this.showToast(res.message, "success");
                this.renderAdminDashboard();
                this.renderStoreProducts();
            } else {
                this.showToast(res.message, "danger");
            }
        };
        reader.readAsText(file);
    }

    // ============================================================
    // MODALLAR VA CHEKLAR
    // ============================================================

    openModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
        if (id === 'modal-face-camera' || id === 'modal-customer-auth') {
            this.stopCamera();
        }
    }

    openAddCustomerModal() {
        document.getElementById('customer-modal-title').innerText = "Yangi Mijoz Qo'shish";
        document.getElementById('cust-id').value = '';
        document.getElementById('cust-name').value = '';
        document.getElementById('cust-phone').value = '+998 ';
        document.getElementById('cust-telegram').value = '';
        document.getElementById('cust-address').value = '';
        document.getElementById('cust-passport').value = '';
        document.getElementById('cust-password-field').value = '123';
        this.openModal('modal-customer');
    }

    openEditCustomerModal(id) {
        const c = window.qarzStorage.getCustomerById(id);
        if (!c) return;

        document.getElementById('customer-modal-title').innerText = "Mijozni Tahrirlash";
        document.getElementById('cust-id').value = c.id;
        document.getElementById('cust-name').value = c.name;
        document.getElementById('cust-phone').value = c.phone;
        document.getElementById('cust-telegram').value = c.telegram || '';
        document.getElementById('cust-address').value = c.address || '';
        document.getElementById('cust-passport').value = c.passport || '';
        document.getElementById('cust-password-field').value = c.password || '123';
        this.openModal('modal-customer');
    }

    handleSaveCustomer(e) {
        e.preventDefault();
        const data = {
            id: document.getElementById('cust-id').value || null,
            name: document.getElementById('cust-name').value,
            phone: document.getElementById('cust-phone').value,
            telegram: document.getElementById('cust-telegram').value,
            address: document.getElementById('cust-address').value,
            passport: document.getElementById('cust-passport').value,
            password: document.getElementById('cust-password-field').value || '123'
        };

        window.qarzStorage.saveCustomer(data);
        this.closeModal('modal-customer');
        this.showToast("Mijoz ma'lumotlari saqlandi!", "success");
        this.renderAdminDashboard();
    }

    confirmDeleteCustomer(id, name) {
        if (confirm(`"${name}" va unga tegishli barcha qarz/to'lovlarni o'chirmoqchimisiz?`)) {
            window.qarzStorage.deleteCustomer(id);
            this.showToast("Mijoz o'chirildi", "info");
            this.renderAdminDashboard();
        }
    }

    openAddDebtModal(selectedCustomerId = null) {
        const customers = window.qarzStorage.getCustomers();
        const select = document.getElementById('debt-customer-select');

        if (customers.length === 0) {
            this.showToast("Avval kamida bitta mijoz qo'shishingiz kerak!", "warning");
            this.openAddCustomerModal();
            return;
        }

        select.innerHTML = customers.map(c => `
            <option value="${c.id}" ${c.id === selectedCustomerId ? 'selected' : ''}>
                ${c.name} (${c.phone})
            </option>
        `).join('');

        document.getElementById('debt-id').value = '';
        document.getElementById('debt-amount').value = '';
        document.getElementById('debt-desc').value = '';
        document.getElementById('debt-date').value = new Date().toISOString().split('T')[0];

        const due = new Date();
        due.setDate(due.getDate() + 30);
        document.getElementById('debt-due-date').value = due.toISOString().split('T')[0];

        this.openModal('modal-debt');
    }

    setDueDays(days) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        document.getElementById('debt-due-date').value = d.toISOString().split('T')[0];
    }

    handleSaveDebt(e) {
        e.preventDefault();
        const customerId = document.getElementById('debt-customer-select').value;
        const amount = Number(document.getElementById('debt-amount').value);
        const date = document.getElementById('debt-date').value;
        const dueDate = document.getElementById('debt-due-date').value;
        const description = document.getElementById('debt-desc').value;

        window.qarzStorage.saveDebt({
            customerId,
            amount,
            date,
            dueDate,
            description
        });

        this.closeModal('modal-debt');
        this.showToast("Qarz muvaffaqiyatli yozildi!", "success");
        this.renderAdminDashboard();

        const cust = window.qarzStorage.getCustomerById(customerId);
        const bal = window.qarzStorage.getCustomerBalance(customerId);
        const receiptHtml = QarzExport.renderReceiptHTML({
            title: "QARZ RASMIYLASHTIRISH CHEKI",
            customerName: cust.name,
            customerPhone: cust.phone,
            customerFaceVerified: cust.hasFaceId,
            customerAddress: cust.address,
            itemTitle: description,
            amount: amount,
            date: date,
            dueDate: dueDate,
            remaining: bal.remaining,
            totalDebt: bal.totalDebt,
            totalPayable: bal.totalPayable,
            advanceBonusActive: bal.advanceBonusActive
        });

        this.showCustomReceipt(receiptHtml);
    }

    confirmDeleteDebt(id) {
        if (confirm("Ushbu qarz yozuvini o'chirmoqchimisiz?")) {
            window.qarzStorage.deleteDebt(id);
            this.showToast("Qarz yozuvi o'chirildi", "info");
            this.renderAdminDashboard();
        }
    }

    openPaymentModal(selectedCustomerId = null) {
        const customers = window.qarzStorage.getCustomers();
        const select = document.getElementById('payment-customer-select');

        if (customers.length === 0) {
            this.showToast("To'lov qilish uchun mijozlar yo'q!", "warning");
            return;
        }

        select.innerHTML = customers.map(c => `
            <option value="${c.id}" ${c.id === selectedCustomerId ? 'selected' : ''}>
                ${c.name} (${c.phone})
            </option>
        `).join('');

        document.getElementById('payment-amount').value = '';
        document.getElementById('payment-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('payment-note').value = '';

        this.updatePaymentHelperInfo();
        this.openModal('modal-payment');
    }

    updatePaymentHelperInfo() {
        const custId = document.getElementById('payment-customer-select').value;
        const infoBox = document.getElementById('payment-cust-info');
        const disp = document.getElementById('payment-remaining-display');
        const intInfo = document.getElementById('payment-interest-info');
        const settings = window.qarzStorage.getSettings();

        if (custId) {
            const bal = window.qarzStorage.getCustomerBalance(custId);
            infoBox.style.display = 'block';
            disp.innerText = QarzExport.formatMoney(bal.remaining, settings.currency);

            if (bal.totalInterest > 0) {
                intInfo.innerText = `+ Kechikish foizi: ${QarzExport.formatMoney(bal.totalInterest, settings.currency)} | Jami: ${QarzExport.formatMoney(bal.totalPayable, settings.currency)}`;
            } else if (bal.advanceBonusActive) {
                intInfo.innerText = "✓ Oldindan to'lov imtiyozi (0% foiz)";
            } else {
                intInfo.innerText = "";
            }

            this.currentCustTotalPayable = bal.totalPayable;
        } else {
            infoBox.style.display = 'none';
            this.currentCustTotalPayable = 0;
        }
    }

    fillFullPayment() {
        if (this.currentCustTotalPayable > 0) {
            document.getElementById('payment-amount').value = this.currentCustTotalPayable;
        }
    }

    handleSavePayment(e) {
        e.preventDefault();
        const customerId = document.getElementById('payment-customer-select').value;
        const amount = Number(document.getElementById('payment-amount').value);
        const date = document.getElementById('payment-date').value;
        const paymentMethod = document.getElementById('payment-method').value;
        const note = document.getElementById('payment-note').value;

        const payment = window.qarzStorage.savePayment({
            customerId,
            amount,
            date,
            paymentMethod,
            note
        });

        this.closeModal('modal-payment');
        this.showToast("To'lov qabul qilindi!", "success");
        this.renderAdminDashboard();

        this.showPaymentReceipt(payment.id);
    }

    confirmDeletePayment(id) {
        if (confirm("Ushbu to'lov yozuvini o'chirmoqchimisiz?")) {
            window.qarzStorage.deletePayment(id);
            this.showToast("To'lov o'chirildi", "info");
            this.renderAdminDashboard();
        }
    }

    openCustomerDetail(id) {
        const c = window.qarzStorage.getCustomerById(id);
        if (!c) return;

        const bal = window.qarzStorage.getCustomerBalance(id);
        const settings = window.qarzStorage.getSettings();
        const debts = window.qarzStorage.getDebtsByCustomer(id);
        const payments = window.qarzStorage.getPaymentsByCustomer(id);

        document.getElementById('detail-customer-name').innerText = c.name;
        const body = document.getElementById('customer-detail-body');

        body.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
                <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 1.15rem; font-weight: 700;">${c.name}</span>
                        ${c.hasFaceId ? '<span class="badge-faceid">✓ Face ID</span>' : ''}
                    </div>
                    <div style="color: var(--text-muted); font-size: 0.85rem;">
                        📞 ${c.phone} | 📍 ${c.address || 'Manzil yo\'q'} ${c.passport ? '| 🪪 ' + c.passport : ''}
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button class="btn btn-primary btn-sm" onclick="app.closeModal('modal-customer-detail'); app.openAddDebtModal('${c.id}')">+ Qarz</button>
                    <button class="btn btn-success btn-sm" onclick="app.closeModal('modal-customer-detail'); app.openPaymentModal('${c.id}')">💰 To'lov</button>
                    <button class="btn btn-outline btn-sm" onclick="app.showCustomerReceipt('${c.id}')">🖨 Chek</button>
                </div>
            </div>

            <div class="balance-summary-grid" style="padding: 0 0 1.5rem; margin-bottom: 1.5rem;">
                <div class="bal-box">
                    <div class="bal-label">Asosiy Qarz</div>
                    <div class="bal-value">${QarzExport.formatMoney(bal.remaining, settings.currency)}</div>
                </div>
                <div class="bal-box ${bal.totalInterest > 0 ? 'danger' : 'success'}">
                    <div class="bal-label">Kechikish Foizi</div>
                    <div class="bal-value">${bal.totalInterest > 0 ? '+' + QarzExport.formatMoney(bal.totalInterest, settings.currency) : "0 so'm"}</div>
                </div>
                <div class="bal-box ${bal.totalPayable > 0 ? 'danger' : 'success'}">
                    <div class="bal-label">JAMI TO'LOV</div>
                    <div class="bal-value">${QarzExport.formatMoney(bal.totalPayable, settings.currency)}</div>
                </div>
            </div>

            <h4 style="margin-bottom: 0.5rem; font-size: 0.95rem; font-weight: 700;">Qarzlar Tarixi (${debts.length})</h4>
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Sana</th>
                            <th>Mahsulot</th>
                            <th>Summa</th>
                            <th>Muddat</th>
                            <th>Holat</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bal.detailedDebts.map(d => `
                            <tr>
                                <td>${QarzExport.formatDate(d.date)}</td>
                                <td>${d.description}</td>
                                <td class="text-danger font-bold">+${QarzExport.formatMoney(d.amount, settings.currency)}</td>
                                <td>${d.dueDate ? QarzExport.formatDate(d.dueDate) : '-'}</td>
                                <td>${d.isPaid ? '<span class="badge badge-success">To\'langan</span>' : (d.isOverdue ? '<span class="badge badge-danger">Kechikkan</span>' : '<span class="badge badge-primary">Faol</span>')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        this.openModal('modal-customer-detail');
    }

    showCustomerReceipt(customerId) {
        const c = window.qarzStorage.getCustomerById(customerId);
        if (!c) return;
        const bal = window.qarzStorage.getCustomerBalance(customerId);
        const debts = window.qarzStorage.getDebtsByCustomer(customerId);
        const settings = window.qarzStorage.getSettings();

        const itemsHtml = debts.map(d => `
            <div class="receipt-line">
                <span>${d.description}</span>
                <span>${QarzExport.formatMoney(d.amount, settings.currency)}</span>
            </div>
        `).join('');

        const receiptHtml = QarzExport.renderReceiptHTML({
            title: "QARZ HISOBOT KVITANSIYASI",
            receiptNumber: 'QD-HISOB-' + c.id.slice(-4),
            customerName: c.name,
            customerPhone: c.phone,
            customerFaceVerified: c.hasFaceId,
            customerAddress: c.address,
            itemsHtml: itemsHtml,
            totalDebt: bal.totalDebt,
            paidNow: bal.totalPaid,
            remaining: bal.remaining,
            interest: bal.totalInterest,
            totalPayable: bal.totalPayable,
            advanceBonusActive: bal.advanceBonusActive,
            dueDate: bal.earliestDueDate
        });

        this.showCustomReceipt(receiptHtml);
    }

    showPaymentReceipt(paymentId) {
        const p = window.qarzStorage.getPayments().find(x => x.id === paymentId);
        if (!p) return;
        const c = window.qarzStorage.getCustomerById(p.customerId) || { name: 'Mijoz', phone: '' };
        const bal = window.qarzStorage.getCustomerBalance(p.customerId);

        const receiptHtml = QarzExport.renderReceiptHTML({
            title: "TO'LOV QABUL KVITANSIYASI",
            receiptNumber: p.receiptNumber,
            date: p.date,
            customerName: c.name,
            customerPhone: c.phone,
            customerFaceVerified: c.hasFaceId,
            customerAddress: c.address,
            itemTitle: "Qarz to'lovi",
            paymentMethod: p.paymentMethod.toUpperCase(),
            amount: p.amount,
            paidNow: p.amount,
            remaining: bal.remaining,
            interest: bal.totalInterest,
            totalPayable: bal.totalPayable,
            advanceBonusActive: bal.advanceBonusActive,
            note: p.note
        });

        this.showCustomReceipt(receiptHtml);
    }

    showCustomReceipt(html) {
        const target = document.getElementById('receipt-render-target');
        if (target) {
            target.innerHTML = html;
            this.openModal('modal-receipt');
        }
    }

    openShareModal(customerId) {
        const c = window.qarzStorage.getCustomerById(customerId);
        if (!c) return;
        const bal = window.qarzStorage.getCustomerBalance(customerId);
        const share = QarzExport.prepareTelegramShare(c, bal);

        document.getElementById('share-message-text').value = share.text;

        const tgBtn = document.getElementById('share-telegram-btn');
        if (share.directUrl) {
            tgBtn.href = share.directUrl;
            tgBtn.innerText = `✈️ Telegram (@${c.telegram}) da ochish`;
        } else {
            tgBtn.href = share.shareUrl;
            tgBtn.innerText = "✈️ Telegram orqali yuborish";
        }

        const smsBtn = document.getElementById('share-sms-btn');
        smsBtn.href = QarzExport.prepareSmsLink(c.phone, share.text);

        this.openModal('modal-share');
    }

    copyShareText() {
        const txt = document.getElementById('share-message-text').value;
        navigator.clipboard.writeText(txt).then(() => {
            this.showToast("Xabar matni nusxalandi!", "success");
        });
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        else if (type === 'danger') icon = '⚠️';
        else if (type === 'warning') icon = '🔔';

        toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    }

    setupKeyboardShortcuts() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModals = document.querySelectorAll('.modal-backdrop.show');
                openModals.forEach(m => m.classList.remove('show'));
                document.body.style.overflow = '';
                this.stopCamera();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new QarzApp();
});
