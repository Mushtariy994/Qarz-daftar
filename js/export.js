/**
 * Qarz Daftari & Onlayn Do'kon - Eksport va Chop Etish (Export & Print Utility)
 * Excel/CSV eksport, Qarz va Savdo Cheklari (Nasiya kvitansiyalari)
 */

const QarzExport = {
    formatMoney(amount, currency = "so'm") {
        const num = Number(amount) || 0;
        return num.toLocaleString('uz-UZ') + ' ' + currency;
    },

    formatDate(dateStr) {
        if (!dateStr) return "-";
        try {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                return `${parts[2]}.${parts[1]}.${parts[0]}`;
            }
            const d = new Date(dateStr);
            return d.toLocaleDateString('uz-UZ');
        } catch (e) {
            return dateStr;
        }
    },

    // 1. Mijozlar ro'yxatini Excel (CSV) fayliga yuklash
    exportCustomersToCSV() {
        const customers = window.qarzStorage.getCustomers();
        const settings = window.qarzStorage.getSettings();

        if (customers.length === 0) {
            alert("Eksport qilish uchun mijozlar mavjud emas!");
            return;
        }

        let csvContent = "\uFEFF";
        csvContent += "T/r;F.I.O;Telefon raqami;Face ID;Manzili;Jami Olingan Qarz;To'langan Qism;Asosiy Qoldiq;Kechikish Foizi;Jami To'lanishi Kerak;Oldindan To'lov Imtiyozi;Holati;Oxirgi Muddat\n";

        customers.forEach((c, index) => {
            const bal = window.qarzStorage.getCustomerBalance(c.id);
            let statusText = "Toza (Qarzi yo'q)";
            if (bal.status === 'overdue') statusText = "Muddati O'tgan (Foizli)";
            else if (bal.status === 'debtor') statusText = "Faol Qarzdor";

            const row = [
                index + 1,
                `"${(c.name || '').replace(/"/g, '""')}"`,
                `"${c.phone || ''}"`,
                c.hasFaceId ? "Ha (Tasdiqlangan)" : "Yo'q",
                `"${(c.address || '').replace(/"/g, '""')}"`,
                bal.totalDebt,
                bal.totalPaid,
                bal.remaining,
                bal.totalInterest,
                bal.totalPayable,
                bal.advanceBonusActive ? "Faol (0% foiz)" : "Yo'q",
                `"${statusText}"`,
                bal.earliestDueDate ? this.formatDate(bal.earliestDueDate) : "-"
            ];
            csvContent += row.join(";") + "\n";
        });

        this.downloadFile(csvContent, `Qarzdorlar_Royxati_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
    },

    // 2. Do'kon Buyurtmalari (Orders) Tarixini Excel fayliga yuklash
    exportOrdersToCSV() {
        const orders = window.qarzStorage.getOrders();
        if (orders.length === 0) {
            alert("Buyurtmalar mavjud emas!");
            return;
        }

        let csvContent = "\uFEFF";
        csvContent += "Buyurtma №;Sana;Xaridor;Telefon;To'lov Usuli;Jami Summa;Tarkibi;Holati\n";

        orders.forEach(o => {
            const itemsStr = (o.items || []).map(i => `${i.name} (${i.quantity} dona)`).join(', ');
            let payLabel = o.paymentType === 'debt' ? "QARZGA (NASIYA)" : (o.paymentType === 'card' ? "Karta (Onlayn)" : "Naqd pul");

            const row = [
                o.orderNumber,
                this.formatDate(o.date),
                `"${(o.customerName || '').replace(/"/g, '""')}"`,
                `"${o.customerPhone || ''}"`,
                `"${payLabel}"`,
                o.totalAmount,
                `"${itemsStr.replace(/"/g, '""')}"`,
                o.status
            ];
            csvContent += row.join(";") + "\n";
        });

        this.downloadFile(csvContent, `Dukon_Buyurtmalari_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
    },

    // 3. Barcha operatsiyalar tarixini Excel fayliga yuklash
    exportAllTransactionsToCSV() {
        const debts = window.qarzStorage.getDebts();
        const payments = window.qarzStorage.getPayments();
        const customers = window.qarzStorage.getCustomers();
        const custMap = {};
        customers.forEach(c => { custMap[c.id] = c; });

        let transactions = [];

        debts.forEach(d => {
            const c = custMap[d.customerId] || { name: 'Noma\'lum', phone: '' };
            transactions.push({
                date: d.date,
                customer: c.name,
                phone: c.phone,
                type: 'QARZ BERILDI (SAVDO)',
                amount: d.amount,
                info: d.description || '',
                dueDate: d.dueDate || '',
                rawDate: d.date
            });
        });

        payments.forEach(p => {
            const c = custMap[p.customerId] || { name: 'Noma\'lum', phone: '' };
            transactions.push({
                date: p.date,
                customer: c.name,
                phone: c.phone,
                type: `TO'LOV QABUL QILINDI (${p.paymentMethod.toUpperCase()})`,
                amount: p.amount,
                info: `Chek: ${p.receiptNumber || '-'} ${p.note ? ' | ' + p.note : ''}`,
                dueDate: '-',
                rawDate: p.date
            });
        });

        transactions.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));

        let csvContent = "\uFEFF";
        csvContent += "Sana;Mijoz;Telefon;Operatsiya turi;Summa;Tafsilot / Mahsulot;Muddat\n";

        transactions.forEach(t => {
            const row = [
                this.formatDate(t.date),
                `"${(t.customer || '').replace(/"/g, '""')}"`,
                `"${t.phone || ''}"`,
                `"${t.type}"`,
                t.amount,
                `"${(t.info || '').replace(/"/g, '""')}"`,
                t.dueDate ? this.formatDate(t.dueDate) : '-'
            ];
            csvContent += row.join(";") + "\n";
        });

        this.downloadFile(csvContent, `Qarz_Operatsiyalari_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
    },

    downloadFile(content, fileName, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    // 4. Do'kondan xarid cheki (Naqd yoki Qarzga)
    renderOrderReceiptHTML(order, debt = null, customer = null) {
        const settings = window.qarzStorage.getSettings();
        const dateStr = this.formatDate(order.date || new Date().toISOString().split('T')[0]);
        const timeStr = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });

        const isDebt = order.paymentType === 'debt';
        const docTitle = isDebt ? "QARZGA XARID CHEKI (NASIYA SAVDO)" : "SAVDO XARID CHEKI";

        const itemsRows = (order.items || []).map((i, idx) => `
            <div class="receipt-line" style="font-size: 0.8rem;">
                <span>${idx + 1}. ${i.name} x ${i.quantity}</span>
                <span>${this.formatMoney(i.price * i.quantity, settings.currency)}</span>
            </div>
        `).join('');

        return `
            <div class="receipt-box" id="printable-receipt">
                <div class="receipt-header">
                    <h2 class="receipt-store-title">${settings.storeName}</h2>
                    <p class="receipt-meta">${settings.storeAddress}</p>
                    <p class="receipt-meta">Tel: ${settings.storePhone}</p>
                    <div class="receipt-divider">================================</div>
                    <div class="receipt-doc-title" style="color: ${isDebt ? '#b91c1c' : '#059669'};">${docTitle}</div>
                    <div class="receipt-number">Buyurtma №: <strong>${order.orderNumber}</strong></div>
                    <div class="receipt-date">Sana: ${dateStr} ${timeStr}</div>
                </div>

                <div class="receipt-divider">--------------------------------</div>

                <div class="receipt-customer">
                    <p><strong>Xaridor:</strong> ${order.customerName}</p>
                    <p><strong>Telefon:</strong> ${order.customerPhone || '-'}</p>
                    ${customer && customer.hasFaceId ? `<p style="color: #10b981; font-size: 0.75rem;"><strong>[✓ Face ID bilan tasdiqlangan xaridor]</strong></p>` : ''}
                </div>

                <div class="receipt-divider">--------------------------------</div>

                <div class="receipt-body">
                    <div style="font-weight: 700; margin-bottom: 0.35rem; font-size: 0.85rem;">XARID QILINGAN MAXSULOTLAR:</div>
                    ${itemsRows}
                </div>

                <div class="receipt-divider">--------------------------------</div>

                <div class="receipt-totals">
                    <div class="receipt-line font-bold" style="font-size: 1rem;">
                        <span>JAMI SAVAT SUMMASI:</span>
                        <span>${this.formatMoney(order.totalAmount, settings.currency)}</span>
                    </div>

                    ${isDebt ? `
                        <div class="receipt-line text-danger font-bold" style="margin-top: 0.35rem;">
                            <span>TO'LOV HOLATI:</span>
                            <span>QARZ DAFTARIGA YOZILDI</span>
                        </div>
                        ${debt && debt.dueDate ? `
                            <div class="receipt-line" style="margin-top: 0.25rem;">
                                <span>Qaytarish muddati:</span>
                                <strong>${this.formatDate(debt.dueDate)}</strong>
                            </div>
                        ` : ''}
                        <div class="receipt-line text-success" style="font-size: 0.75rem; margin-top: 0.25rem;">
                            <span>Oldindan to'lov qilsangiz:</span>
                            <span>Keyingi oyga 0% FOIZ!</span>
                        </div>
                    ` : `
                        <div class="receipt-line text-success font-bold" style="margin-top: 0.35rem;">
                            <span>TO'LOV HOLATI:</span>
                            <span>TO'LIQ TO'LANDI (${order.paymentType.toUpperCase()})</span>
                        </div>
                    `}
                </div>

                <div class="receipt-divider">================================</div>

                <div class="receipt-footer">
                    <p class="receipt-thanks">Xaridingiz uchun rahmat!</p>
                    ${isDebt ? `<p class="receipt-reminder">* Kechiktirilgan qarzga oylik ${settings.overdueMonthlyRate}% foiz qo'shiladi.</p>` : ''}
                    <div class="receipt-signatures">
                        <div class="sign-col">
                            <span>Sotuvchi:</span>
                            <div class="sign-line">___________</div>
                        </div>
                        <div class="sign-col">
                            <span>Xaridor:</span>
                            <div class="sign-line">___________</div>
                        </div>
                    </div>
                    <div class="receipt-barcode">
                        ||| |||| | ||||| |||| |||||| | |||
                        <div class="barcode-text">DO'KON-SAVDO-${order.orderNumber}</div>
                    </div>
                </div>
            </div>
        `;
    },

    // 5. Umumiy Qarz / Hisobot Kvitansiyasi
    renderReceiptHTML(data) {
        const settings = window.qarzStorage.getSettings();
        const dateStr = this.formatDate(data.date || new Date().toISOString().split('T')[0]);
        const timeStr = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });

        return `
            <div class="receipt-box" id="printable-receipt">
                <div class="receipt-header">
                    <h2 class="receipt-store-title">${settings.storeName}</h2>
                    <p class="receipt-meta">${settings.storeAddress}</p>
                    <p class="receipt-meta">Tel: ${settings.storePhone}</p>
                    <div class="receipt-divider">================================</div>
                    <div class="receipt-doc-title">${data.title || "QARZ KVITANSIYASI"}</div>
                    <div class="receipt-number">Chek №: <strong>${data.receiptNumber || 'QD-' + Date.now().toString().slice(-4)}</strong></div>
                    <div class="receipt-date">Sana: ${dateStr} ${timeStr}</div>
                </div>

                <div class="receipt-divider">--------------------------------</div>

                <div class="receipt-customer">
                    <p><strong>Mijoz:</strong> ${data.customerName}</p>
                    <p><strong>Telefon:</strong> ${data.customerPhone}</p>
                    ${data.customerFaceVerified ? `<p style="color: #10b981; font-size: 0.75rem;"><strong>[✓ Face ID bilan tasdiqlangan]</strong></p>` : ''}
                    ${data.customerAddress ? `<p><strong>Manzil:</strong> ${data.customerAddress}</p>` : ''}
                </div>

                <div class="receipt-divider">--------------------------------</div>

                <div class="receipt-body">
                    ${data.itemsHtml || `
                        <div class="receipt-line">
                            <span>${data.itemTitle || "Amal / Mahsulot"}:</span>
                            <span class="font-bold">${this.formatMoney(data.amount, settings.currency)}</span>
                        </div>
                    `}
                    ${data.note ? `<div class="receipt-note"><em>Izoh: ${data.note}</em></div>` : ''}
                </div>

                <div class="receipt-divider">--------------------------------</div>

                <div class="receipt-totals">
                    ${data.totalDebt !== undefined ? `
                        <div class="receipt-line">
                            <span>Jami olingan qarz:</span>
                            <span>${this.formatMoney(data.totalDebt, settings.currency)}</span>
                        </div>
                    ` : ''}
                    ${data.paidNow !== undefined ? `
                        <div class="receipt-line font-bold text-success">
                            <span>To'landi (${data.paymentMethod || 'Naqd'}):</span>
                            <span>${this.formatMoney(data.paidNow, settings.currency)}</span>
                        </div>
                    ` : ''}
                    ${data.remaining !== undefined ? `
                        <div class="receipt-line">
                            <span>Asosiy qarz qoldig'i:</span>
                            <span class="font-bold">${this.formatMoney(data.remaining, settings.currency)}</span>
                        </div>
                    ` : ''}
                    ${data.interest !== undefined && data.interest > 0 ? `
                        <div class="receipt-line text-danger font-bold">
                            <span>Kechikish foizi (${settings.overdueMonthlyRate}% oylik):</span>
                            <span>+${this.formatMoney(data.interest, settings.currency)}</span>
                        </div>
                    ` : ''}
                    ${data.advanceBonusActive ? `
                        <div class="receipt-line text-success" style="font-size: 0.8rem;">
                            <span>Oldindan to'lov imtiyozi:</span>
                            <span><strong>0% FOIZ (Bonus)</strong></span>
                        </div>
                    ` : ''}
                    ${data.totalPayable !== undefined ? `
                        <div class="receipt-line font-bold text-danger text-lg" style="margin-top: 0.35rem; border-top: 1px dashed #6b7280; padding-top: 0.35rem;">
                            <span>JAMI TO'LANISHI KERAK:</span>
                            <span>${this.formatMoney(data.totalPayable, settings.currency)}</span>
                        </div>
                    ` : ''}
                    ${data.dueDate ? `
                        <div class="receipt-line receipt-due">
                            <span>Qaytarish muddati:</span>
                            <strong>${this.formatDate(data.dueDate)}</strong>
                        </div>
                    ` : ''}
                </div>

                <div class="receipt-divider">================================</div>

                <div class="receipt-footer">
                    <p class="receipt-thanks">Xaridingiz uchun rahmat!</p>
                    <p class="receipt-reminder">
                        * Qoidalar: Kechiktirilgan qarzga oylik ${settings.overdueMonthlyRate}% foiz hisoblanadi.<br>
                        * Agar qarzni oldindan to'lasangiz, keyingi oy uchun foiz qo'shilmaydi (0%)!
                    </p>
                    <div class="receipt-signatures">
                        <div class="sign-col">
                            <span>Kassir / Do'kon:</span>
                            <div class="sign-line">___________</div>
                        </div>
                        <div class="sign-col">
                            <span>Mijoz imzosi:</span>
                            <div class="sign-line">___________</div>
                        </div>
                    </div>
                    <div class="receipt-barcode">
                        ||| | ||||| |||| | ||||||| ||| ||||
                        <div class="barcode-text">QARZ-DAFTARI-SYSTEM</div>
                    </div>
                </div>
            </div>
        `;
    },

    // 6. Telegram xabari
    prepareTelegramShare(customer, balance) {
        const settings = window.qarzStorage.getSettings();
        const dueDate = balance.earliestDueDate ? this.formatDate(balance.earliestDueDate) : "Kelishilgan muddatda";
        
        let text = settings.smsTemplate || "Hurmatli {name}! {storeName} dan {balance} {currency} qarzingiz mavjud. Muddat: {dueDate}. Tel: {storePhone}";
        
        let extraNote = "";
        if (balance.totalInterest > 0) {
            extraNote = ` (Kechikish foizi: +${this.formatMoney(balance.totalInterest, settings.currency)})`;
        } else if (balance.advanceBonusActive) {
            extraNote = " (Sizda oldindan to'lov qilganingiz uchun keyingi oyga 0% foiz imtiyozi bor!)";
        }

        text = text.replace('{name}', customer.name)
                   .replace('{storeName}', settings.storeName)
                   .replace('{balance}', Number(balance.totalPayable || balance.remaining).toLocaleString('uz-UZ') + extraNote)
                   .replace('{currency}', settings.currency)
                   .replace('{dueDate}', dueDate)
                   .replace('{rate}', settings.overdueMonthlyRate)
                   .replace('{storePhone}', settings.storePhone);

        let directUrl = "";
        if (customer.telegram) {
            const cleanTg = customer.telegram.replace('@', '');
            directUrl = `https://t.me/${cleanTg}`;
        }
        
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(text)}`;

        return {
            text,
            directUrl,
            shareUrl
        };
    },

    prepareSmsLink(phone, message) {
        const cleanPhone = (phone || '').replace(/[^0-9+]/g, '');
        return `sms:${cleanPhone}?body=${encodeURIComponent(message)}`;
    }
};

window.QarzExport = QarzExport;
