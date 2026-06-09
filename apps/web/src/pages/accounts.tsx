import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { useAuth } from "../hooks/useAuth";
import Layout from "../components/Layout";
import { BankConnectionModal } from "../components/BankConnectionModal";

interface Transaction {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  category: string;
}

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  institution: string;
  status: string;
  icon: string;
  lastUpdated: string;
  monthlySpend: number;
  transactions: Transaction[];
  balanceHistory: { date: string; balance: number }[];
  mealCardSpecific?: {
    provider?: string;
    expiryDate?: string;
    monthlyAllowance?: number;
  };
}

interface FormData {
  accountName: string;
  bank: string;
  accountType: string;
  balance: string;
  currency: string;
  monthlySpend?: string;
  mealCardProvider?: string;
  monthlyAllowance?: string;
}

const BANK_OPTIONS = [
  { value: 'revolut', label: '🟦 Revolut', emoji: '🟦', desc: 'Digital banking & wallet' },
  { value: 'cgd', label: '🏦 Caixa Geral de Depósitos', emoji: '🏦', desc: 'Portuguese bank' },
  { value: 'millennium', label: '🏦 Millennium BCP', emoji: '🏦', desc: 'Portuguese bank' },
  { value: 'meal-card', label: '🍽️ Meal Card', emoji: '🍽️', desc: 'Employee meal vouchers' },
  { value: 'other', label: '💳 Other Bank', emoji: '💳', desc: 'Any other bank' },
];

const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Checking Account', icon: '💼' },
  { value: 'savings', label: 'Savings Account', icon: '🏦' },
  { value: 'investment', label: 'Investment Account', icon: '📈' },
  { value: 'meal-card', label: 'Meal Card', icon: '🍽️' },
];

const MEAL_CARD_PROVIDERS = [
  { value: 'sodexo', label: '🎯 Sodexo', desc: 'Meal vouchers' },
  { value: 'ticket', label: '🎫 Ticket', desc: 'Restaurant vouchers' },
  { value: 'edenred', label: '🔴 Edenred', desc: 'Meal & transport solutions' },
  { value: 'multibanco', label: '🏧 Multibanco', desc: 'Direct card' },
];

const normalizeAccount = (account: any): Account => {
  return {
    ...account,
    monthlySpend: account.monthlySpend ?? 0,
    icon: account.icon ?? '💳',
    lastUpdated: account.lastUpdated ?? new Date().toLocaleDateString(),
    transactions: account.transactions ?? [],
    balanceHistory: account.balanceHistory ?? [{ date: new Date().toLocaleDateString(), balance: account.balance }],
  };
};

export default function AccountsPage() {
  const { loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user_accounts');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return Array.isArray(parsed) ? parsed.map(normalizeAccount) : [];
        } catch {
          return [];
        }
      }
    }
    return [];
  });
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<FormData>({
    accountName: '',
    bank: 'revolut',
    accountType: 'checking',
    balance: '',
    currency: 'EUR',
    monthlySpend: '0',
    mealCardProvider: 'sodexo',
    monthlyAllowance: '',
  });
  const [formData, setFormData] = useState<FormData>({
    accountName: '',
    bank: 'revolut',
    accountType: 'checking',
    balance: '',
    currency: 'EUR',
    monthlySpend: '0',
    mealCardProvider: 'sodexo',
    monthlyAllowance: '',
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    localStorage.setItem('user_accounts', JSON.stringify(accounts));
  }, [accounts]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.accountName || !formData.balance) {
      setError("Please fill in all required fields");
      return;
    }

    const bankOption = BANK_OPTIONS.find(b => b.value === formData.bank);
    const accountTypeOption = ACCOUNT_TYPES.find(t => t.value === formData.accountType);

    const newAccount: Account = {
      id: Date.now().toString(),
      name: formData.accountName,
      type: formData.accountType,
      balance: parseFloat(formData.balance),
      currency: formData.currency,
      institution: formData.bank,
      status: "connected",
      icon: bankOption?.emoji || '💳',
      lastUpdated: new Date().toLocaleDateString(),
      monthlySpend: parseFloat(formData.monthlySpend || '0'),
      transactions: [],
      balanceHistory: [{ date: new Date().toLocaleDateString(), balance: parseFloat(formData.balance) }],
      ...(formData.bank === 'meal-card' && {
        mealCardSpecific: {
          provider: formData.mealCardProvider,
          expiryDate: '2025-12-31',
          monthlyAllowance: parseFloat(formData.monthlyAllowance || '0'),
        },
      }),
    };

    setAccounts([...accounts, newAccount]);
    setFormData({
      accountName: '',
      bank: 'revolut',
      accountType: 'checking',
      balance: '',
      currency: 'EUR',
      monthlySpend: '0',
      mealCardProvider: 'sodexo',
      monthlyAllowance: '',
    });
    setShowForm(false);
    setError("");
  };

  const handleDeleteAccount = (id: string) => {
    setAccounts(accounts.filter(acc => acc.id !== id));
    setSelectedAccount(null);
    setIsEditing(false);
  };

  const openAccountDetails = (account: Account) => {
    setSelectedAccount(account);
    setIsEditing(false);
    setEditFormData({
      accountName: account.name,
      bank: account.institution,
      accountType: account.type,
      balance: String(account.balance),
      currency: account.currency,
      monthlySpend: String(account.monthlySpend ?? 0),
      mealCardProvider: account.mealCardSpecific?.provider || 'sodexo',
      monthlyAllowance: String(account.mealCardSpecific?.monthlyAllowance ?? ''),
    });
  };

  const handleEditAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount || !editFormData.accountName || !editFormData.balance) {
      setError('Please fill in all required fields');
      return;
    }
    const bankOption = BANK_OPTIONS.find(b => b.value === editFormData.bank);
    const isMealCard = editFormData.accountType === 'meal-card' || editFormData.bank === 'meal-card';
    setAccounts(accounts.map(acc => {
      if (acc.id !== selectedAccount.id) return acc;
      return {
        ...acc,
        name: editFormData.accountName,
        type: editFormData.accountType,
        balance: parseFloat(editFormData.balance),
        currency: editFormData.currency,
        institution: editFormData.bank,
        icon: bankOption?.emoji || acc.icon,
        monthlySpend: parseFloat(editFormData.monthlySpend || '0'),
        lastUpdated: new Date().toLocaleDateString(),
        ...(isMealCard ? {
          mealCardSpecific: {
            provider: editFormData.mealCardProvider || 'sodexo',
            expiryDate: acc.mealCardSpecific?.expiryDate || '2026-12-31',
            monthlyAllowance: parseFloat(editFormData.monthlyAllowance || '0'),
          },
        } : { mealCardSpecific: undefined }),
      };
    }));
    setSelectedAccount(null);
    setIsEditing(false);
  };

  const handleUpdateBalance = (id: string, newBalance: number) => {
    setAccounts(accounts.map(acc => {
      if (acc.id === id) {
        return {
          ...acc,
          balance: newBalance,
          lastUpdated: new Date().toLocaleDateString(),
          balanceHistory: [...acc.balanceHistory, { date: new Date().toLocaleDateString(), balance: newBalance }],
        };
      }
      return acc;
    }));
    if (selectedAccount?.id === id) {
      setSelectedAccount({ ...selectedAccount, balance: newBalance });
    }
  };

  const filteredAccounts = filterType === 'all'
    ? accounts
    : accounts.filter(acc => acc.institution === filterType);

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalMonthlySpend = accounts.reduce((sum, acc) => sum + acc.monthlySpend, 0);
  const mealCardAccounts = accounts.filter(acc => acc.institution === 'meal-card');

  return (
    <>
      <Head>
        <title>Accounts - Financial Hub</title>
      </Head>

      <Layout title="Connected Accounts">
        {/* Error State */}
        {error && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-xl shadow-lg">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-semibold text-red-800 text-lg">Error</h3>
                  <p className="text-red-700 mt-1">{error}</p>
                  <button
                    onClick={() => setError("")}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all active:scale-95"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="mb-8 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <p className="text-gray-600 text-lg">
                Manage all your financial accounts and payment methods
              </p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button
                onClick={() => setShowBankModal(true)}
                className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
              >
                🔗 Connect Real Bank
              </button>
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
              >
                + Add Manual Account
              </button>
            </div>
          </div>
        </div>

        {/* Add Account Form */}
        {showForm && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-white/20 hover:shadow-xl transition-all">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Add New Account</h3>
              <p className="text-gray-600 mb-6">Connect your bank accounts, cards, and meal vouchers</p>

              <form onSubmit={handleAddAccount} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Account Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">📝 Account Name</label>
                    <input
                      type="text"
                      value={formData.accountName}
                      onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                      placeholder="e.g., My Revolut, Work Meals"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  {/* Bank Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">🏦 Bank / Provider</label>
                    <select
                      value={formData.bank}
                      onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    >
                      {BANK_OPTIONS.map((bank) => (
                        <option key={bank.value} value={bank.value}>{bank.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Account Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">💼 Account Type</label>
                    <select
                      value={formData.accountType}
                      onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    >
                      {ACCOUNT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Currency */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">💱 Currency</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    >
                      <option value="EUR">EUR (€) - Euro</option>
                      <option value="USD">USD ($) - US Dollar</option>
                      <option value="GBP">GBP (£) - British Pound</option>
                    </select>
                  </div>

                  {/* Balance */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">💰 Current Balance</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.balance}
                      onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  {/* Monthly Spend */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">📊 Monthly Spend (est.)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.monthlySpend || '0'}
                      onChange={(e) => setFormData({ ...formData, monthlySpend: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Meal Card Specific Fields */}
                {formData.bank === 'meal-card' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">🍽️ Meal Card Provider</label>
                      <select
                        value={formData.mealCardProvider}
                        onChange={(e) => setFormData({ ...formData, mealCardProvider: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
                      >
                        {MEAL_CARD_PROVIDERS.map((provider) => (
                          <option key={provider.value} value={provider.value}>{provider.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">📅 Monthly Allowance</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.monthlyAllowance || ''}
                        onChange={(e) => setFormData({ ...formData, monthlyAllowance: e.target.value })}
                        placeholder="e.g., 150.00"
                        className="w-full px-4 py-3 bg-white border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all active:scale-95"
                  >
                    ✅ Save Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {accounts.length > 0 && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {/* Total Balance */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all">
              <p className="text-white/80 text-sm font-semibold mb-2">💼 Total Balance</p>
              <h2 className="text-3xl font-bold mb-2">
                {totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </h2>
              <p className="text-white/70 text-sm">Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
            </div>

            {/* Monthly Spend */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all">
              <p className="text-white/80 text-sm font-semibold mb-2">📊 Monthly Spend</p>
              <h2 className="text-3xl font-bold mb-2">
                {totalMonthlySpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </h2>
              <p className="text-white/70 text-sm">Average monthly spending</p>
            </div>

            {/* Meal Cards */}
            {mealCardAccounts.length > 0 && (
              <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all">
                <p className="text-white/80 text-sm font-semibold mb-2">🍽️ Meal Cards</p>
                <h2 className="text-3xl font-bold mb-2">{mealCardAccounts.length}</h2>
                <p className="text-white/70 text-sm">Active meal card account{mealCardAccounts.length !== 1 ? 's' : ''}</p>
              </div>
            )}
          </div>
        )}

        {/* Filter Buttons */}
        {accounts.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2 animate-in fade-in duration-500">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Accounts
            </button>
            <button
              onClick={() => setFilterType('meal-card')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filterType === 'meal-card'
                  ? 'bg-yellow-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🍽️ Meal Cards ({mealCardAccounts.length})
            </button>
          </div>
        )}

        {/* Accounts List or Empty State */}
        {accounts.length === 0 ? (
          <div className="animate-in fade-in duration-500">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center hover:border-blue-400 hover:shadow-lg transition-all">
              <div className="text-6xl mb-4">🏦</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Accounts Yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Add your Revolut, Caixa Geral de Depósitos, meal cards, or any other accounts to get started
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
              >
                Add Your First Account
              </button>

              {/* Quick Start Grid */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: "🟦", name: "Revolut", desc: "Digital banking" },
                  { icon: "🏦", name: "Portuguese Banks", desc: "CGD, Millennium BCP" },
                  { icon: "🍽️", name: "Meal Cards", desc: "Sodexo, Ticket, Edenred" },
                ].map((bank, idx) => (
                  <div key={idx} className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-100 hover:shadow-md transition-all">
                    <div className="text-3xl mb-2">{bank.icon}</div>
                    <h4 className="font-semibold text-gray-900">{bank.name}</h4>
                    <p className="text-sm text-gray-600">{bank.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredAccounts.map((account, idx) => (
              <div
                key={account.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div
                  onClick={() => openAccountDetails(account)}
                  className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-blue-400 hover:shadow-xl transition-all cursor-pointer group h-full"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {account.name}
                      </h3>
                      <p className="text-sm text-gray-600 capitalize">{account.institution}</p>
                    </div>
                    <span className="text-3xl">{account.icon}</span>
                  </div>

                  {/* Balance Section */}
                  <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <p className="text-gray-600 text-xs uppercase font-semibold mb-1">Balance</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {account.currency}
                    </p>
                  </div>

                  {/* Meal Card Info */}
                  {account.mealCardSpecific && (
                    <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-semibold text-yellow-900">Monthly Allowance</p>
                        <p className="font-bold text-yellow-700">{account.mealCardSpecific.monthlyAllowance} €</p>
                      </div>
                      <p className="text-xs text-yellow-700">Provider: {account.mealCardSpecific.provider}</p>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Monthly</p>
                      <p className="font-semibold text-gray-900">{account.monthlySpend.toFixed(0)} €</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Last Updated</p>
                      <p className="font-semibold text-gray-900 text-sm">{account.lastUpdated}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openAccountDetails(account);
                      }}
                      className="w-full px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold rounded-lg transition-all active:scale-95"
                    >
                      View Details & Manage
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Details Panel */}
        {selectedAccount && (
          <div className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-300" onClick={() => setSelectedAccount(null)}>
            <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedAccount.icon}</span>
                  <h3 className="text-xl font-bold text-gray-900">{selectedAccount.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing && (
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Editing</span>
                  )}
                  <button
                    onClick={() => { setSelectedAccount(null); setIsEditing(false); }}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {isEditing ? (
                  /* ── EDIT FORM ── */
                  <form onSubmit={handleEditAccount} className="space-y-4">
                    <p className="text-sm text-gray-500 mb-1">Edit all account details below.</p>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Account Name</label>
                      <input
                        type="text"
                        value={editFormData.accountName}
                        onChange={(e) => setEditFormData({ ...editFormData, accountName: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Bank / Provider</label>
                      <select
                        value={editFormData.bank}
                        onChange={(e) => setEditFormData({ ...editFormData, bank: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      >
                        {BANK_OPTIONS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Account Type</label>
                      <select
                        value={editFormData.accountType}
                        onChange={(e) => setEditFormData({ ...editFormData, accountType: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      >
                        {ACCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Balance</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editFormData.balance}
                          onChange={(e) => setEditFormData({ ...editFormData, balance: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Currency</label>
                        <select
                          value={editFormData.currency}
                          onChange={(e) => setEditFormData({ ...editFormData, currency: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        >
                          <option value="EUR">EUR (€)</option>
                          <option value="USD">USD ($)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Monthly Spend (est.)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.monthlySpend}
                        onChange={(e) => setEditFormData({ ...editFormData, monthlySpend: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                    </div>

                    {(editFormData.bank === 'meal-card' || editFormData.accountType === 'meal-card') && (
                      <div className="space-y-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs font-semibold text-yellow-900">🍽️ Meal Card Details</p>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Provider</label>
                          <select
                            value={editFormData.mealCardProvider}
                            onChange={(e) => setEditFormData({ ...editFormData, mealCardProvider: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-yellow-300 rounded-lg outline-none text-sm"
                          >
                            {MEAL_CARD_PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Monthly Allowance</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editFormData.monthlyAllowance}
                            onChange={(e) => setEditFormData({ ...editFormData, monthlyAllowance: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-yellow-300 rounded-lg outline-none text-sm"
                            placeholder="e.g., 150.00"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all active:scale-95"
                      >
                        ✅ Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  /* ── READ-ONLY VIEW ── */
                  <>
                    {/* Balance Display */}
                    <div className="p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
                      <p className="text-gray-600 text-sm mb-1">Current Balance</p>
                      <p className="text-4xl font-bold text-gray-900">
                        {selectedAccount.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} {selectedAccount.currency}
                      </p>
                    </div>

                    {/* Meal Card Specific Details */}
                    {selectedAccount.mealCardSpecific && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-2">
                        <h4 className="font-semibold text-yellow-900">🍽️ Meal Card Details</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-yellow-700">Provider</p>
                            <p className="font-semibold text-yellow-900 capitalize">{selectedAccount.mealCardSpecific.provider}</p>
                          </div>
                          <div>
                            <p className="text-yellow-700">Monthly Allowance</p>
                            <p className="font-semibold text-yellow-900">{selectedAccount.mealCardSpecific.monthlyAllowance} €</p>
                          </div>
                          <div>
                            <p className="text-yellow-700">Expiry</p>
                            <p className="font-semibold text-yellow-900">{selectedAccount.mealCardSpecific.expiryDate}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Account Info */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {[
                        { label: 'Institution', value: selectedAccount.institution },
                        { label: 'Type', value: selectedAccount.type },
                        { label: 'Currency', value: selectedAccount.currency },
                        { label: 'Monthly Spend', value: `${selectedAccount.monthlySpend.toFixed(2)} €` },
                        { label: 'Last Updated', value: selectedAccount.lastUpdated },
                        { label: 'Status', value: selectedAccount.status },
                      ].map(({ label, value }) => (
                        <div key={label} className="p-2 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500">{label}</p>
                          <p className="font-semibold text-gray-900 capitalize truncate">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all active:scale-95"
                      >
                        ✏️ Edit Account
                      </button>
                      <button
                        onClick={() => { setSelectedAccount(null); setIsEditing(false); }}
                        className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg transition-all"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(selectedAccount.id)}
                        className="w-full px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg transition-all active:scale-95"
                      >
                        🗑️ Remove Account
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Bank Connection Modal */}
        <BankConnectionModal
          isOpen={showBankModal}
          onClose={() => setShowBankModal(false)}
          onSuccess={() => {
            setShowBankModal(false);
            // Trigger a refresh of accounts
            setTimeout(() => window.location.reload(), 1500);
          }}
        />
      </Layout>

      <style>{`
        @keyframes slideInFromTop {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInFromRight {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInFromBottom {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in {
          animation: slideInFromTop 0.3s ease-out;
        }
        .slide-in-from-top-2 {
          animation: slideInFromTop 0.3s ease-out !important;
        }
        .slide-in-from-top-4 {
          animation: slideInFromTop 0.4s ease-out !important;
        }
        .slide-in-from-right {
          animation: slideInFromRight 0.3s ease-out !important;
        }
        .slide-in-from-bottom-4 {
          animation: slideInFromBottom 0.4s ease-out !important;
        }
        .fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}
