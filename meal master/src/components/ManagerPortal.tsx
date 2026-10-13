import React, { useState } from 'react';
import {
  Member,
  DayMealEntry,
  BazarExpense,
  Deposit,
  FixedCost,
  MessNotice,
  MealSummaryData,
  Mess,
} from '../types';
import { DailyCookSheet } from './DailyCookSheet';
import { BazarExpenseManager } from './BazarExpenseManager';
import { DepositManager } from './DepositManager';
import { MonthlyCalculationSheet } from './MonthlyCalculationSheet';
import { NoticeBoard } from './NoticeBoard';
import { MembersManager } from './MembersManager';
import {
  ShieldCheck,
  Calendar,
  ShoppingCart,
  Wallet,
  Calculator,
  Bell,
  Users,
  Coins,
  TrendingUp,
  Sparkles,
  Plus,
  Utensils,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
} from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

interface ManagerPortalProps {
  currentUser: Member;
  currentMess: Mess;
  members: Member[];
  mealEntries: DayMealEntry[];
  bazars: BazarExpense[];
  deposits: Deposit[];
  fixedCosts: FixedCost[];
  notices: MessNotice[];
  memberSummaries: MealSummaryData[];
  totalMeals: number;
  totalBazarCost: number;
  totalFixedCost: number;
  mealRate: number;
  totalDeposited: number;
  totalCostOverall: number;
  selectedMonth: string;
  onUpdateMealEntry: (entry: DayMealEntry) => void;
  onAddBazar: (bazar: BazarExpense) => void;
  onDeleteBazar: (id: string) => void;
  onAddDeposit: (deposit: Deposit) => void;
  onDeleteDeposit: (id: string) => void;
  onAddNotice: (notice: MessNotice) => void;
  onDeleteNotice: (id: string) => void;
  onAddMember: (member: Member) => void;
  onUpdateMember: (member: Member) => void;
  onMonthEndCalculated?: (updates: { memberId: string; carryOverDue: number }[]) => void;
  onOpenStatementModal?: () => void;
  activeTab?: 'cook_sheet' | 'bazar' | 'deposits' | 'monthly_calc' | 'members' | 'notices';
  onSelectTab?: (tab: 'cook_sheet' | 'bazar' | 'deposits' | 'monthly_calc' | 'members' | 'notices') => void;
}

export const ManagerPortal: React.FC<ManagerPortalProps> = ({
  currentUser,
  currentMess,
  members,
  mealEntries,
  bazars,
  deposits,
  fixedCosts,
  notices,
  memberSummaries,
  totalMeals,
  totalBazarCost,
  totalFixedCost,
  mealRate,
  totalDeposited,
  totalCostOverall,
  selectedMonth,
  onUpdateMealEntry,
  onAddBazar,
  onDeleteBazar,
  onAddDeposit,
  onDeleteDeposit,
  onAddNotice,
  onDeleteNotice,
  onAddMember,
  onUpdateMember,
  onMonthEndCalculated,
  onOpenStatementModal,
  activeTab: controlledTab,
  onSelectTab: controlledOnSelectTab,
}) => {
  const [internalTab, setInternalTab] = useState<
    'cook_sheet' | 'bazar' | 'deposits' | 'monthly_calc' | 'members' | 'notices'
  >('cook_sheet');

  const managerTab = controlledTab ?? internalTab;
  const setManagerTab = controlledOnSelectTab ?? setInternalTab;

  const cashInHand = totalDeposited - (totalBazarCost + totalFixedCost);
  const pendingCount = members.filter((m) => !m.approved || m.status === 'pending').length;

  const tabs = [
    {
      id: 'cook_sheet',
      label: 'রান্নার শিট (Cook Sheet)',
      icon: Calendar,
      badge: 'বাবুর্চি শিট',
    },
    {
      id: 'bazar',
      label: 'বাজার ও খরচ খাতা',
      icon: ShoppingCart,
      badge: `${formatCurrency(totalBazarCost)}`,
    },
    {
      id: 'deposits',
      label: 'টাকা জমা (ডিপোজিট)',
      icon: Wallet,
      badge: `${formatCurrency(totalDeposited)}`,
    },
    {
      id: 'monthly_calc',
      label: 'মাসিক পূর্ণাঙ্গ হিসাব ও মিল রেট',
      icon: Calculator,
      badge: `${formatCurrency(mealRate)}/মিল`,
      badgeColor: 'bg-amber-500/20 text-amber-300',
    },
    {
      id: 'members',
      label: 'সদস্য ও অনুমোদন',
      icon: Users,
      badge: pendingCount > 0 ? `${pendingCount} অপেক্ষমাণ` : `${members.length} জন`,
      badgeColor: pendingCount > 0 ? 'bg-rose-500 text-white' : undefined,
    },
    {
      id: 'notices',
      label: 'নোটিশ ও সময়সূচি',
      icon: Bell,
      badge: `${notices.length} টি`,
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Manager Summary Top Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold uppercase tracking-wider">
                {currentUser.role === 'it_admin' ? '👑 IT Admin Panel' : '💼 Manager Dashboard'}
              </span>
              <span className="text-xs text-slate-400">
                মাস: <strong>{selectedMonth}</strong>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              {currentUser.role === 'it_admin' ? 'আইটি এডমিন ও ডাইনিং ম্যানেজমেন্ট' : 'মেস ম্যানেজার কন্ট্রোল প্যানেল'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentMess.name} · বাজার, বোর্ডার ডিপোজিট ও মাসিক মিল হিসাব
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onOpenStatementModal && (
              <button
                onClick={onOpenStatementModal}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>হিসাব বিবরণী (PDF / Excel)</span>
              </button>
            )}

            <div className="bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-2xl">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                হাতে জমা ক্যাশ (Cash in Hand)
              </span>
              <span
                className={`text-base sm:text-lg font-black ${
                  cashInHand >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatCurrency(cashInHand)}
              </span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-2xl">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                বর্তমান মিল রেট
              </span>
              <span className="text-base sm:text-lg font-black text-amber-300">
                {formatCurrency(mealRate)}
                <span className="text-xs text-slate-400 font-normal">/মিল</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1.5 shadow-sm">
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = managerTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setManagerTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-700/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      isActive ? 'bg-indigo-800 text-white' : tab.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* TAB CONTENTS */}

      {/* Tab 1: Daily Cook Sheet */}
      {managerTab === 'cook_sheet' && (
        <DailyCookSheet
          members={members}
          mealEntries={mealEntries}
          onUpdateMealEntry={onUpdateMealEntry}
          currentUser={currentUser}
        />
      )}

      {/* Tab 2: Bazar Expense Manager */}
      {managerTab === 'bazar' && (
        <BazarExpenseManager
          bazars={bazars}
          members={members}
          onAddBazar={onAddBazar}
          onDeleteBazar={onDeleteBazar}
          currentUser={currentUser}
          selectedMonth={selectedMonth}
        />
      )}

      {/* Tab 3: Deposit Manager */}
      {managerTab === 'deposits' && (
        <DepositManager
          deposits={deposits}
          members={members}
          onAddDeposit={onAddDeposit}
          onDeleteDeposit={onDeleteDeposit}
          currentUser={currentUser}
          selectedMonth={selectedMonth}
          messName={currentMess.name}
        />
      )}

      {/* Tab 4: Monthly Calculation Sheet */}
      {managerTab === 'monthly_calc' && (
        <MonthlyCalculationSheet
          memberSummaries={memberSummaries}
          totalMeals={totalMeals}
          totalBazarCost={totalBazarCost}
          totalFixedCost={totalFixedCost}
          mealRate={mealRate}
          totalDeposited={totalDeposited}
          totalCostOverall={totalCostOverall}
          fixedCosts={fixedCosts}
          selectedMonth={selectedMonth}
          members={members}
          onMonthEndCalculated={onMonthEndCalculated}
          currentUser={currentUser}
          currentMess={currentMess}
        />
      )}

      {/* Tab 5: Members & Role Management */}
      {managerTab === 'members' && (
        <MembersManager
          members={members}
          onAddMember={onAddMember}
          onUpdateMember={onUpdateMember}
          currentUser={currentUser}
        />
      )}

      {/* Tab 6: Notice Board */}
      {managerTab === 'notices' && (
        <NoticeBoard
          notices={notices}
          onAddNotice={onAddNotice}
          onDeleteNotice={onDeleteNotice}
          currentUser={currentUser}
        />
      )}

    </div>
  );
};
