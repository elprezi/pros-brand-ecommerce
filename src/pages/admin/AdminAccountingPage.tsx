import React, { useState, useMemo } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { useStore } from '../../store/storeContext';
import {
  apiGetAccountingKPIs,
  apiGetAccountingTransactionsLedger,
  apiGetExpenses,
  apiCreateExpense,
  apiDeleteExpense,
  apiGetMarketPerformance,
  apiGetGatewayPerformance,
} from '../../lib/server/accountingApi';
import {
  ALL_COUNTRIES,
  ALL_CURRENCIES,
  formatCurrencyPrice,
} from '../../lib/server/internationalApi';
import { apiGetOrderInvoice } from '../../lib/server/invoiceApi';
import { downloadInvoicePdf } from '../../lib/utils/pdfGenerator';
import type { CurrencyCode, ExpenseCategory } from '../../types/international';
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  Receipt,
  RotateCcw,
  Download,
  Plus,
  ShieldCheck,
  Building2,
  Globe,
  PieChart,
  Wallet,
  CheckCircle2,
  Trash2,
  Search,
} from 'lucide-react';

export const AdminAccountingPage: React.FC = () => {
  const { orders, formatPrice, settings } = useStore();

  // Filters State (Sections 13, 14, 15 & 20)
  const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'invoices' | 'payments' | 'expenses' | 'taxes'>('overview');
  const [periodFilter, setPeriodFilter] = useState('30_days');
  const [countryFilter, setCountryFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyCode | 'all'>('all');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState('all');

  // New Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('ACHAT STOCK');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCurrency, setExpCurrency] = useState<CurrencyCode>('XOF');
  const [expSupplier, setExpSupplier] = useState('');
  const [expPaymentMethod, setExpPaymentMethod] = useState('VIREMENT BANCAIRE');

  // Notification Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (text: string) => {
    setToastMsg(text);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Compute Real Accounting Data (Sections 3, 4, 5, 8, 9, 11, 12, 18, 19, 22)
  const kpis = useMemo(
    () => apiGetAccountingKPIs(periodFilter, countryFilter, currencyFilter, orders),
    [periodFilter, countryFilter, currencyFilter, orders]
  );

  const marketPerformances = useMemo(() => apiGetMarketPerformance(orders), [orders]);
  const gatewayPerformances = useMemo(() => apiGetGatewayPerformance(orders), [orders]);

  const ledgerTransactions = useMemo(
    () => apiGetAccountingTransactionsLedger(orders, ledgerSearch, ledgerTypeFilter),
    [orders, ledgerSearch, ledgerTypeFilter]
  );

  const expenses = useMemo(() => apiGetExpenses(), []);

  // Handle Add Expense (Section 10 & 23)
  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expDesc || !expAmount || Number(expAmount) <= 0) return;

    apiCreateExpense({
      category: expCategory,
      description: expDesc,
      amount: Number(expAmount),
      currency: expCurrency,
      date: new Date().toISOString(),
      supplierName: expSupplier || 'Fournisseur Général',
      paymentMethod: expPaymentMethod,
      status: 'PAYÉ',
      createdBy: 'Administrateur PROS',
    });

    setIsExpenseModalOpen(false);
    setExpDesc('');
    setExpAmount('');
    showToast('Nouvelle dépense comptable enregistrée avec succès.');
  };

  // Delete Expense
  const handleDeleteExpense = (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer cette dépense de la comptabilité ?')) {
      apiDeleteExpense(id);
      showToast('Dépense comptable supprimée.');
    }
  };

  // Export Financial CSV / Report (Section 25 & 30)
  const handleExportReport = (formatType: 'CSV' | 'EXCEL' | 'PDF') => {
    const headers = ['DATE', 'RÉFÉRENCE', 'TYPE', 'CLIENT/FOURNISSEUR', 'PAYS', 'MONTANT (XOF)', 'MODE', 'STATUT'];
    const rows = ledgerTransactions.map((tx) => [
      new Date(tx.date).toLocaleDateString('fr-FR'),
      tx.reference,
      tx.type,
      tx.customerName,
      tx.country,
      tx.baseAmountXOF.toString(),
      tx.paymentMethod,
      tx.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PROS_RAPPORT_FINANCIER_${new Date().toISOString().slice(0, 10)}.${formatType.toLowerCase()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Rapport financier comptable exporté en ${formatType}.`);
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-8 font-sans bg-white text-[#0A0A0A] min-h-screen">
        
        {/* TOAST NOTIFICATION */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#0A0A0A] text-white text-xs font-bold px-4 py-3 shadow-2xl flex items-center space-x-2 border border-[#C9A45C]">
            <CheckCircle2 size={16} className="text-[#0A9F68]" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* TOP HEADER (SECTION 11) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#E8E8E8] pb-6 gap-4">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#C9A45C] block">
              MODULE COMPTABILITÉ & FINANCE ADMIN
            </span>
            <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-wider text-[#0A0A0A]">
              COMPTABILITÉ & FINANCE
            </h1>
            <p className="text-xs text-[#777777] mt-1 font-sans">
              Pilotez les revenus, dépenses, paiements, factures, taxes, remboursements et performances financières de PROS.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleExportReport('CSV')}
              className="px-4 py-2.5 bg-[#0A0A0A] hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition-colors cursor-pointer"
            >
              <Download size={14} />
              <span>EXPORT COMPTABLE</span>
            </button>

            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="px-4 py-2.5 bg-white border border-[#0A0A0A] hover:bg-neutral-100 text-[#0A0A0A] font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>SAISIR UNE DÉPENSE</span>
            </button>
          </div>
        </div>

        {/* FILTERS BAR (SECTIONS 13, 14, 15) */}
        <div className="p-4 bg-[#F9F9F8] border border-[#E8E8E8] grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans text-xs">
          <div>
            <label className="text-[10px] font-mono text-[#777777] uppercase block mb-1">PÉRIODE DE COMPTABILITÉ</label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="w-full bg-white border border-[#E8E8E8] px-3 py-2 text-xs text-[#0A0A0A] font-bold uppercase focus:outline-none focus:border-[#0A0A0A]"
            >
              <option value="today">Aujourd'hui</option>
              <option value="7_days">7 Derniers Jours</option>
              <option value="30_days">30 Derniers Jours</option>
              <option value="90_days">90 Derniers Jours</option>
              <option value="12_months">12 Derniers Mois</option>
              <option value="all">Historique Global</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono text-[#777777] uppercase block mb-1">PAYS & MARCHÉ</label>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full bg-white border border-[#E8E8E8] px-3 py-2 text-xs text-[#0A0A0A] font-bold uppercase focus:outline-none focus:border-[#0A0A0A]"
            >
              <option value="all">Tous les Pays & Marchés</option>
              {ALL_COUNTRIES.map((c) => (
                <option key={c.isoCode} value={c.name}>
                  {c.name} ({c.marketZone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono text-[#777777] uppercase block mb-1">DEVISE DE COMPTABILITÉ</label>
            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value as any)}
              className="w-full bg-white border border-[#E8E8E8] px-3 py-2 text-xs text-[#0A0A0A] font-bold uppercase focus:outline-none focus:border-[#0A0A0A]"
            >
              <option value="all">Toutes les Devises (Converti XOF)</option>
              {ALL_CURRENCIES.map((cur) => (
                <option key={cur.code} value={cur.code}>
                  {cur.code} ({cur.symbol}) — {cur.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 8 COMPTABILITÉ KPIS TOP CARDS (SECTION 12, 16 & 17) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
          
          {/* CA BRUT */}
          <div className="p-5 bg-white border border-[#E8E8E8] space-y-2 shadow-sm">
            <div className="flex justify-between items-center text-[#777777]">
              <span className="text-[10px] font-mono font-bold uppercase">CHIFFRE D'AFFAIRES BRUT</span>
              <DollarSign size={18} className="text-[#C9A45C]" />
            </div>
            <h3 className="font-mono font-black text-xl text-[#0A0A0A]">
              {formatPrice(kpis.grossRevenueXOF)}
            </h3>
            <span className="text-[10px] font-mono text-[#0A9F68] block">
              {kpis.totalOrdersCount} commande(s) payée(s)
            </span>
          </div>

          {/* CA NET */}
          <div className="p-5 bg-white border border-[#E8E8E8] space-y-2 shadow-sm">
            <div className="flex justify-between items-center text-[#777777]">
              <span className="text-[10px] font-mono font-bold uppercase">CHIFFRE D'AFFAIRES NET</span>
              <TrendingUp size={18} className="text-[#0A9F68]" />
            </div>
            <h3 className="font-mono font-black text-xl text-[#0A9F68]">
              {formatPrice(kpis.netRevenueXOF)}
            </h3>
            <span className="text-[10px] font-mono text-[#777777] block">
              Déduction de {formatPrice(kpis.totalRefundsXOF)} de retours
            </span>
          </div>

          {/* BÉNÉFICE / DÉFICIT NET (SECTION 17) */}
          <div className={`p-5 space-y-2 border shadow-sm ${kpis.isDeficit ? 'bg-red-950 text-white border-red-500' : 'bg-[#0A0A0A] text-white border-[#C9A45C]'}`}>
            <div className="flex justify-between items-center text-neutral-400">
              <span className={`text-[10px] font-mono font-bold uppercase ${kpis.isDeficit ? 'text-red-400 font-black' : 'text-[#C9A45C]'}`}>
                {kpis.isDeficit ? '⚠️ DÉFICIT NET COMPTABLE' : 'BÉNÉFICE NET CALCULÉ'}
              </span>
              <Wallet size={18} className={kpis.isDeficit ? 'text-red-400' : 'text-[#C9A45C]'} />
            </div>
            <h3 className={`font-mono font-black text-xl ${kpis.isDeficit ? 'text-red-400' : 'text-[#0A9F68]'}`}>
              {formatPrice(kpis.netProfitXOF)}
            </h3>
            <span className={`text-[10px] font-mono block ${kpis.isDeficit ? 'text-red-300' : 'text-[#0A9F68]'}`}>
              {kpis.isDeficit ? 'Alerte résultat négatif' : `Marge nette : ${kpis.netProfitPercentage}%`}
            </span>
          </div>

          {/* DÉPENSES TOTALES */}
          <div className="p-5 bg-white border border-[#E8E8E8] space-y-2 shadow-sm">
            <div className="flex justify-between items-center text-[#777777]">
              <span className="text-[10px] font-mono font-bold uppercase">DÉPENSES DE FONCTIONNEMENT</span>
              <Receipt size={18} className="text-red-600" />
            </div>
            <h3 className="font-mono font-black text-xl text-red-600">
              {formatPrice(kpis.totalExpensesXOF)}
            </h3>
            <span className="text-[10px] font-mono text-[#777777] block">
              {expenses.length} dépense(s) validée(s)
            </span>
          </div>

          {/* COGS & MARGE BRUTE (SECTION 8 & 9) */}
          <div className="p-5 bg-white border border-[#E8E8E8] space-y-2 shadow-sm">
            <div className="flex justify-between items-center text-[#777777]">
              <span className="text-[10px] font-mono font-bold uppercase">COÛT DES PRODUITS (COGS)</span>
              <PieChart size={18} className="text-[#777777]" />
            </div>
            <h3 className="font-mono font-black text-xl text-[#0A0A0A]">
              {formatPrice(kpis.totalCOGSXOF)}
            </h3>
            <span className="text-[10px] font-mono text-[#C9A45C] block">
              Marge brute : {kpis.grossMarginPercentageFormatted}
            </span>
          </div>

          {/* ENCAISSEMENTS EFFECTIFS (SECTION 5) */}
          <div className="p-5 bg-white border border-[#E8E8E8] space-y-2 shadow-sm">
            <div className="flex justify-between items-center text-[#777777]">
              <span className="text-[10px] font-mono font-bold uppercase">ENCAISSEMENTS EFFECTIFS</span>
              <CreditCard size={18} className="text-[#0A9F68]" />
            </div>
            <h3 className="font-mono font-black text-xl text-[#0A9F68]">
              {formatPrice(kpis.totalCollectedXOF)}
            </h3>
            <span className="text-[10px] font-mono text-[#777777] block">
              Commandes réglées uniquement
            </span>
          </div>

          {/* TAXES À REVERSER (SECTION 12 & 24) */}
          <div className="p-5 bg-white border border-[#E8E8E8] space-y-2 shadow-sm">
            <div className="flex justify-between items-center text-[#777777]">
              <span className="text-[10px] font-mono font-bold uppercase">TAXES & TVA À REVERSER</span>
              <Building2 size={18} className="text-[#C9A45C]" />
            </div>
            <h3 className="font-mono font-black text-xl text-[#C9A45C]">
              {formatPrice(kpis.taxesToPayXOF)}
            </h3>
            <span className="text-[10px] font-mono text-[#777777] block">
              Calculé sur commandes réelles
            </span>
          </div>

          {/* REMBOURSEMENTS & IMPAYÉS */}
          <div className="p-5 bg-white border border-[#E8E8E8] space-y-2 shadow-sm">
            <div className="flex justify-between items-center text-[#777777]">
              <span className="text-[10px] font-mono font-bold uppercase">REMBOURSEMENTS & IMPAYÉS</span>
              <RotateCcw size={18} className="text-[#777777]" />
            </div>
            <h3 className="font-mono font-black text-xl text-[#0A0A0A]">
              {formatPrice(kpis.totalRefundsXOF)}
            </h3>
            <span className="text-[10px] font-mono text-red-600 block">
              {kpis.unpaidInvoicesCount} facture(s) en attente
            </span>
          </div>

        </div>

        {/* NAVIGATION TABS BAR (SECTION 34) */}
        <div className="flex border-b border-[#E8E8E8] overflow-x-auto space-x-6 font-mono text-xs font-bold uppercase">
          {[
            { id: 'overview', label: 'VUE D\'ENSEMBLE' },
            { id: 'ledger', label: 'JOURNAL DES TRANSACTIONS' },
            { id: 'invoices', label: 'REGISTRE DES FACTURES' },
            { id: 'payments', label: 'ENCAISSEMENTS & PASSERELLES' },
            { id: 'expenses', label: 'GESTION DES DÉPENSES' },
            { id: 'taxes', label: 'FISCALITÉ & TAXES' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 transition-colors cursor-pointer shrink-0 border-b-2 ${
                activeTab === tab.id
                  ? 'border-[#0A0A0A] text-[#0A0A0A]'
                  : 'border-transparent text-[#777777] hover:text-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW & SYNTHÈSE COMPTABLE DU MOIS (SECTION 18 & 19) */}
        {activeTab === 'overview' && (
          <div className="space-y-6 font-sans">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* SYNTHÈSE COMPTABLE DU MOIS (SECTION 18) */}
              <div className="p-6 bg-white border border-[#E8E8E8] space-y-4 shadow-sm">
                <div className="border-b border-[#E8E8E8] pb-3 flex justify-between items-center">
                  <h3 className="font-display font-bold text-sm uppercase text-[#0A0A0A]">
                    SYNTHÈSE COMPTABLE COMPLÈTE
                  </h3>
                  <ShieldCheck size={16} className="text-[#0A9F68]" />
                </div>

                <div className="space-y-2 text-xs font-sans">
                  <div className="p-3 bg-[#F9F9F8] border border-[#E8E8E8] flex justify-between items-center">
                    <span>Chiffre d'Affaires Brut (CA BRUT)</span>
                    <strong className="font-mono text-black">{formatPrice(kpis.grossRevenueXOF)}</strong>
                  </div>

                  <div className="p-3 bg-[#F9F9F8] border border-[#E8E8E8] flex justify-between items-center text-red-600">
                    <span>- Remboursements & Avoirs Validés</span>
                    <strong className="font-mono">-{formatPrice(kpis.totalRefundsXOF)}</strong>
                  </div>

                  <div className="p-3 bg-[#E6F4ED] border border-[#0A9F68] flex justify-between items-center font-bold text-[#0A9F68]">
                    <span>= CHIFFRE D'AFFAIRES NET (CA NET)</span>
                    <strong className="font-mono">{formatPrice(kpis.netRevenueXOF)}</strong>
                  </div>

                  <div className="p-3 bg-[#F9F9F8] border border-[#E8E8E8] flex justify-between items-center text-red-600">
                    <span>- Coût d'Achat du Stock (COGS)</span>
                    <strong className="font-mono">-{formatPrice(kpis.totalCOGSXOF)}</strong>
                  </div>

                  <div className="p-3 bg-[#F9F9F8] border border-[#E8E8E8] flex justify-between items-center text-[#C9A45C] font-bold">
                    <span>= MARGE BRUTE COMPTABLE</span>
                    <strong className="font-mono">{formatPrice(kpis.grossMarginXOF)} ({kpis.grossMarginPercentageFormatted})</strong>
                  </div>

                  <div className="p-3 bg-[#F9F9F8] border border-[#E8E8E8] flex justify-between items-center text-red-600">
                    <span>- Dépenses de Fonctionnement</span>
                    <strong className="font-mono">-{formatPrice(kpis.totalExpensesXOF)}</strong>
                  </div>

                  <div className={`p-4 font-bold flex justify-between items-center border ${kpis.isDeficit ? 'bg-red-950 text-white border-red-500' : 'bg-[#0A0A0A] text-white border-[#C9A45C]'}`}>
                    <span className="uppercase">{kpis.isDeficit ? '⚠️ DÉFICIT NET COMPTABLE' : 'RÉSULTAT NET COMPTABLE'}</span>
                    <strong className={`font-mono text-lg ${kpis.isDeficit ? 'text-red-400 font-black' : 'text-[#0A9F68]'}`}>
                      {formatPrice(kpis.netProfitXOF)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* PERFORMANCE PAR MARCHÉ (SECTION 19) */}
              <div className="p-6 bg-white border border-[#E8E8E8] space-y-4 shadow-sm">
                <div className="border-b border-[#E8E8E8] pb-3 flex justify-between items-center">
                  <h3 className="font-display font-bold text-sm uppercase text-[#0A0A0A]">
                    PERFORMANCE FINANCIÈRE PAR MARCHÉ
                  </h3>
                  <Globe size={16} className="text-[#C9A45C]" />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-sans border-collapse">
                    <thead>
                      <tr className="bg-[#0A0A0A] text-white font-mono text-[10px] uppercase">
                        <th className="p-2.5 text-left">MARCHÉ</th>
                        <th className="p-2.5 text-right">CA BRUT</th>
                        <th className="p-2.5 text-center">CMD</th>
                        <th className="p-2.5 text-right">PANIER MOYEN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marketPerformances.map((mp) => (
                        <tr key={mp.marketZone} className="border-b border-[#E8E8E8]">
                          <td className="p-2.5 font-bold">{mp.marketZone}</td>
                          <td className="p-2.5 text-right font-mono font-bold">{formatPrice(mp.grossRevenueXOF)}</td>
                          <td className="p-2.5 text-center font-mono">{mp.ordersCount}</td>
                          <td className="p-2.5 text-right font-mono text-[#C9A45C]">
                            {mp.ordersCount > 0 ? formatPrice(mp.averageBasketXOF) : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: JOURNAL DES TRANSACTIONS (SECTION 20) */}
        {activeTab === 'ledger' && (
          <div className="bg-white border border-[#E8E8E8] p-6 space-y-4 shadow-sm font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E8E8E8] pb-3 gap-3">
              <h3 className="font-display font-bold text-sm uppercase text-[#0A0A0A]">
                JOURNAL COMPTABLE DES TRANSACTIONS ({ledgerTransactions.length})
              </h3>

              {/* SEARCH & TYPE FILTER */}
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-3 text-[#777777]" />
                  <input
                    type="text"
                    value={ledgerSearch}
                    onChange={(e) => setLedgerSearch(e.target.value)}
                    placeholder="Recherche réf, client..."
                    className="pl-8 pr-3 py-1.5 border border-[#E8E8E8] text-xs font-sans focus:outline-none"
                  />
                </div>

                <select
                  value={ledgerTypeFilter}
                  onChange={(e) => setLedgerTypeFilter(e.target.value)}
                  className="p-1.5 border border-[#E8E8E8] text-xs font-mono font-bold uppercase focus:outline-none"
                >
                  <option value="all">Tous types</option>
                  <option value="VENTE">VENTES</option>
                  <option value="DÉPENSE">DÉPENSES</option>
                  <option value="REMBOURSEMENT">REMBOURSEMENTS</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-sans border-collapse">
                <thead>
                  <tr className="bg-[#0A0A0A] text-white font-mono text-[10px] uppercase">
                    <th className="p-3 text-left">DATE</th>
                    <th className="p-3 text-left">RÉFÉRENCE</th>
                    <th className="p-3 text-left">TYPE</th>
                    <th className="p-3 text-left">TIERS / CLIENT</th>
                    <th className="p-3 text-left">PAYS</th>
                    <th className="p-3 text-right">MONTANT (XOF)</th>
                    <th className="p-3 text-left">MODE</th>
                    <th className="p-3 text-center">STATUT</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerTransactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-[#E8E8E8] hover:bg-[#F9F9F8]">
                      <td className="p-3 font-mono text-[#777777]">
                        {new Date(tx.date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="p-3 font-mono font-bold text-[#0A0A0A]">{tx.reference}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
                          tx.type === 'VENTE' ? 'bg-[#E6F4ED] text-[#0A9F68]' :
                          tx.type === 'DÉPENSE' ? 'bg-red-50 text-red-600' :
                          tx.type === 'REMBOURSEMENT' ? 'bg-amber-50 text-amber-700' : 'bg-neutral-100 text-black'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-3 font-bold">{tx.customerName}</td>
                      <td className="p-3 font-mono">{tx.country}</td>
                      <td className="p-3 text-right font-mono font-bold">
                        {formatPrice(tx.baseAmountXOF)}
                      </td>
                      <td className="p-3 font-mono text-[#777777]">{tx.paymentMethod}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-[#0A0A0A] text-white text-[9px] font-mono font-bold uppercase">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: REGISTRE DES FACTURES (SECTION 21) */}
        {activeTab === 'invoices' && (
          <div className="bg-white border border-[#E8E8E8] p-6 space-y-4 shadow-sm font-sans">
            <h3 className="font-display font-bold text-sm uppercase text-[#0A0A0A] border-b border-[#E8E8E8] pb-3">
              REGISTRE OFFICIEL DES FACTURES ÉMISES
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-sans border-collapse">
                <thead>
                  <tr className="bg-[#0A0A0A] text-white font-mono text-[10px] uppercase">
                    <th className="p-3 text-left">FACTURE N°</th>
                    <th className="p-3 text-left">COMMANDE</th>
                    <th className="p-3 text-left">CLIENT</th>
                    <th className="p-3 text-left">DATE</th>
                    <th className="p-3 text-right">MONTANT</th>
                    <th className="p-3 text-center">PAIEMENT</th>
                    <th className="p-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b border-[#E8E8E8] hover:bg-[#F9F9F8]">
                      <td className="p-3 font-mono font-bold text-[#0A0A0A]">
                        INV-2026-{o.trackingNumber.replace(/[^0-9]/g, '').padStart(6, '0')}
                      </td>
                      <td className="p-3 font-mono text-[#C9A45C] font-bold">{o.trackingNumber}</td>
                      <td className="p-3 font-bold">{o.customer.firstName} {o.customer.lastName}</td>
                      <td className="p-3 font-mono text-[#777777]">
                        {new Date(o.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="p-3 text-right font-mono font-bold">{formatPrice(o.total)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase ${
                          o.paymentStatus === 'paid' ? 'bg-[#E6F4ED] text-[#0A9F68]' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {o.paymentStatus === 'paid' ? 'PAYÉE' : 'EN ATTENTE'}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2 font-sans">
                        <button
                          onClick={async () => {
                            const res = await apiGetOrderInvoice(o.id, orders, settings);
                            if (res.success && res.data) {
                              downloadInvoicePdf(res.data);
                              showToast(`Facture INV-2026-${o.trackingNumber} téléchargée.`);
                            }
                          }}
                          className="px-3 py-1 bg-[#0A0A0A] text-white font-bold text-[10px] uppercase cursor-pointer"
                        >
                          TÉLÉCHARGER PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: ENCAISSEMENTS & PASSERELLES (SECTION 22) */}
        {activeTab === 'payments' && (
          <div className="bg-white border border-[#E8E8E8] p-6 space-y-4 shadow-sm font-sans">
            <h3 className="font-display font-bold text-sm uppercase text-[#0A0A0A] border-b border-[#E8E8E8] pb-3">
              RÉPARTITION DES ENCAISSEMENTS PAR PASSERELLE DE PAIEMENT
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {gatewayPerformances.map((gw) => (
                <div key={gw.method} className="p-4 bg-[#F9F9F8] border border-[#E8E8E8] space-y-2">
                  <div className="flex justify-between items-center">
                    <strong className="font-bold text-xs uppercase">{gw.method}</strong>
                    <span className="font-mono text-[10px] text-[#777777]">{gw.transactionsCount} transaction(s)</span>
                  </div>
                  <div className="text-lg font-mono font-bold text-[#0A9F68]">
                    {formatPrice(gw.collectedXOF)}
                  </div>
                  {gw.pendingXOF > 0 && (
                    <span className="text-[10px] font-mono text-amber-700 block">
                      En attente de validation : {formatPrice(gw.pendingXOF)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: GESTION DES DÉPENSES (SECTION 23) */}
        {activeTab === 'expenses' && (
          <div className="bg-white border border-[#E8E8E8] p-6 space-y-4 shadow-sm font-sans">
            <div className="flex justify-between items-center border-b border-[#E8E8E8] pb-3">
              <h3 className="font-display font-bold text-sm uppercase text-[#0A0A0A]">
                REGISTRE DES DÉPENSES DE FONCTIONNEMENT
              </h3>
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="px-4 py-2 bg-[#0A0A0A] text-white text-xs font-bold uppercase flex items-center space-x-1 cursor-pointer"
              >
                <Plus size={14} />
                <span>AJOUTER UNE DÉPENSE</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-sans border-collapse">
                <thead>
                  <tr className="bg-[#0A0A0A] text-white font-mono text-[10px] uppercase">
                    <th className="p-3 text-left">RÉFÉRENCE</th>
                    <th className="p-3 text-left">CATÉGORIE</th>
                    <th className="p-3 text-left">DESCRIPTION</th>
                    <th className="p-3 text-left">FOURNISSEUR</th>
                    <th className="p-3 text-left">DATE</th>
                    <th className="p-3 text-right">MONTANT</th>
                    <th className="p-3 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="border-b border-[#E8E8E8] hover:bg-[#F9F9F8]">
                      <td className="p-3 font-mono font-bold text-[#0A0A0A]">{exp.reference}</td>
                      <td className="p-3 font-bold text-[#C9A45C]">{exp.category}</td>
                      <td className="p-3">{exp.description}</td>
                      <td className="p-3 font-mono">{exp.supplierName || '—'}</td>
                      <td className="p-3 font-mono text-[#777777]">
                        {new Date(exp.date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-red-600">
                        {formatCurrencyPrice(exp.amount, exp.currency)}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="text-red-600 hover:text-red-800 p-1 cursor-pointer"
                          title="Supprimer la dépense"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: FISCALITÉ & TAXES (SECTION 24) */}
        {activeTab === 'taxes' && (
          <div className="bg-white border border-[#E8E8E8] p-6 space-y-4 shadow-sm font-sans">
            <h3 className="font-display font-bold text-sm uppercase text-[#0A0A0A] border-b border-[#E8E8E8] pb-3">
              RÉCAPITULATIF DE LA FISCALITÉ ET TAXES PAR PAYS
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-sans border-collapse">
                <thead>
                  <tr className="bg-[#0A0A0A] text-white font-mono text-[10px] uppercase">
                    <th className="p-3 text-left">PAYS</th>
                    <th className="p-3 text-left">TYPE DE TAXE</th>
                    <th className="p-3 text-center">TAUX APPLICABLE</th>
                    <th className="p-3 text-right">BASE IMPOSABLE</th>
                    <th className="p-3 text-right">TAXE COLLECTÉE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#E8E8E8]">
                    <td className="p-3 font-bold">Sénégal</td>
                    <td className="p-3 font-mono text-[#C9A45C]">TVA (Taxe sur la Valeur Ajoutée)</td>
                    <td className="p-3 text-center font-mono font-bold">18 %</td>
                    <td className="p-3 text-right font-mono">{formatPrice(kpis.grossRevenueXOF)}</td>
                    <td className="p-3 text-right font-mono font-bold text-[#0A9F68]">{formatPrice(kpis.taxesToPayXOF)}</td>
                  </tr>
                  <tr className="border-b border-[#E8E8E8]">
                    <td className="p-3 font-bold">France & Europe</td>
                    <td className="p-3 font-mono text-[#C9A45C]">TVA Intracommunautaire</td>
                    <td className="p-3 text-center font-mono font-bold">20 %</td>
                    <td className="p-3 text-right font-mono">0 FCFA</td>
                    <td className="p-3 text-right font-mono font-bold text-[#777777]">0 FCFA</td>
                  </tr>
                  <tr className="border-b border-[#E8E8E8]">
                    <td className="p-3 font-bold">États-Unis</td>
                    <td className="p-3 font-mono text-[#C9A45C]">Sales Tax State</td>
                    <td className="p-3 text-center font-mono font-bold">8.875 %</td>
                    <td className="p-3 text-right font-mono">0 FCFA</td>
                    <td className="p-3 text-right font-mono font-bold text-[#777777]">0 FCFA</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* NEW EXPENSE MODAL (SECTION 23) */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="bg-white border border-[#0A0A0A] p-6 max-w-lg w-full space-y-4 shadow-2xl animate-fadeIn">
            <div className="border-b border-[#E8E8E8] pb-3 flex justify-between items-center">
              <h3 className="font-display font-bold text-sm uppercase text-[#0A0A0A]">
                SAISIR UNE DÉPENSE COMPTABLE
              </h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-black font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-3 text-xs font-sans">
              <div>
                <label className="font-mono text-[10px] uppercase text-[#777777] block mb-1">CATÉGORIE DE DÉPENSE</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as any)}
                  className="w-full border border-[#E8E8E8] p-2 font-bold uppercase focus:outline-none"
                >
                  <option value="ACHAT STOCK">ACHAT STOCK</option>
                  <option value="TRANSPORT">TRANSPORT</option>
                  <option value="LIVRAISON">LIVRAISON</option>
                  <option value="PUBLICITÉ / MARKETING">PUBLICITÉ / MARKETING</option>
                  <option value="SALAIRES">SALAIRES</option>
                  <option value="LOYER">LOYER</option>
                  <option value="SERVICES">SERVICES</option>
                  <option value="FOURNITURES">FOURNITURES</option>
                  <option value="DOUANES">DOUANES</option>
                  <option value="FRAIS BANCAIRES">FRAIS BANCAIRES</option>
                  <option value="AUTRES">AUTRES</option>
                </select>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase text-[#777777] block mb-1">DESCRIPTION</label>
                <input
                  type="text"
                  required
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="Ex: Achat tissu coton égyptien..."
                  className="w-full border border-[#E8E8E8] p-2 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-mono text-[10px] uppercase text-[#777777] block mb-1">MONTANT</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    placeholder="250000"
                    className="w-full border border-[#E8E8E8] p-2 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase text-[#777777] block mb-1">DEVISE</label>
                  <select
                    value={expCurrency}
                    onChange={(e) => setExpCurrency(e.target.value as any)}
                    className="w-full border border-[#E8E8E8] p-2 font-mono font-bold focus:outline-none"
                  >
                    {ALL_CURRENCIES.map((cur) => (
                      <option key={cur.code} value={cur.code}>{cur.code} ({cur.symbol})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-mono text-[10px] uppercase text-[#777777] block mb-1">FOURNISSEUR</label>
                  <input
                    type="text"
                    value={expSupplier}
                    onChange={(e) => setExpSupplier(e.target.value)}
                    placeholder="Ex: Atelier Textile Dakar"
                    className="w-full border border-[#E8E8E8] p-2 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase text-[#777777] block mb-1">MODE DE PAIEMENT</label>
                  <select
                    value={expPaymentMethod}
                    onChange={(e) => setExpPaymentMethod(e.target.value)}
                    className="w-full border border-[#E8E8E8] p-2 font-mono text-xs focus:outline-none"
                  >
                    <option value="VIREMENT BANCAIRE">VIREMENT BANCAIRE</option>
                    <option value="CARTE BANCAIRE">CARTE BANCAIRE</option>
                    <option value="WAVE">WAVE MOBILE MONEY</option>
                    <option value="ESPÈCES">ESPÈCES</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 border border-[#E8E8E8] text-black font-bold uppercase text-xs"
                >
                  ANNULER
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#0A0A0A] text-white font-bold uppercase text-xs"
                >
                  ENREGISTRER LA DÉPENSE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AdminLayout>
  );
};
