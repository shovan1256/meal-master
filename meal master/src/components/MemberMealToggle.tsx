import React, { useState } from 'react';
import {
  Member,
  DayMealEntry,
  LunchPreference,
  DinnerPreference,
  MealSummaryData,
} from '../types';
import {
  CheckCircle2,
  XCircle,
  Users,
  Power,
  Plane,
  Calendar,
  AlertCircle,
  Check,
  Clock,
  Sparkles,
  Lock,
  Utensils,
  ShieldAlert,
  Flame,
  AlertTriangle,
} from 'lucide-react';
import {
  calculateSingleDayMealCount,
  formatCurrency,
  getTodayDateString,
  getTomorrowDateString,
  isNextDayCutoffPassed,
} from '../utils/calculations';

interface MemberMealToggleProps {
  currentUser: Member;
  mealEntries: DayMealEntry[];
  currentUserSummary?: MealSummaryData;
  onToggleUserMealStatus: (memberId: string, setActive: boolean) => void;
  onUpdateMealEntry: (updatedEntry: DayMealEntry) => void;
  onBatchUpdateMeals: (entries: DayMealEntry[]) => void;
  currentMealRate: number;
}

export const MemberMealToggle: React.FC<MemberMealToggleProps> = ({
  currentUser,
  mealEntries,
  currentUserSummary,
  onToggleUserMealStatus,
  onUpdateMealEntry,
  onBatchUpdateMeals,
  currentMealRate,
}) => {
  const todayStr = getTodayDateString();
  const tomorrowStr = getTomorrowDateString();

  const [activeTab, setActiveTab] = useState<'main_toggle' | 'vacation'>('main_toggle');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Vacation states
  const [vacationStart, setVacationStart] = useState<string>(todayStr);
  const [vacationResume, setVacationResume] = useState<string>(
    new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Defaulter Lock Enforcement
  const isDefaulter = Boolean(currentUserSummary?.isDefaulter || (currentUserSummary?.balance && currentUserSummary.balance < -4000));

  // Next-day 10:00 PM cutoff status
  const isPast10PM = isNextDayCutoffPassed();
  const isManagerOrAdmin = currentUser.role === 'it_admin' || currentUser.role === 'manager';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getEntryForDate = (dateStr: string): DayMealEntry => {
    const existing = mealEntries.find(
      (e) => e.date === dateStr && e.memberId === currentUser.id
    );
    if (existing) return existing;

    let mealOn = currentUser.mealActive;
    if (currentUser.mealActive === false && currentUser.stoppedSinceDate && dateStr >= currentUser.stoppedSinceDate) {
      mealOn = false;
    }

    return {
      id: `meal-${dateStr}-${currentUser.id}`,
      date: dateStr,
      memberId: currentUser.id,
      mealOn,
      mealsCount: mealOn ? 2 : 0,
      guestMeals: 0,
      lunchPreference: 'beef',
      dinnerPreference: 'chicken',
      updatedAt: new Date().toISOString(),
    };
  };

  const todayEntry = getEntryForDate(todayStr);
  const tomorrowEntry = getEntryForDate(tomorrowStr);

  // Master Meal Toggle
  const handleMasterToggle = () => {
    if (isDefaulter) {
      showToast('⚠️ বকেয়া সীমা অতিক্রম করায় আপনার অ্যাকাউন্ট লক করা রয়েছে। মিল পরিবর্তন সম্ভব নয়।');
      return;
    }

    const newStatus = !currentUser.mealActive;
    onToggleUserMealStatus(currentUser.id, newStatus);

    const updatedToday: DayMealEntry = {
      ...todayEntry,
      mealOn: newStatus,
      mealsCount: newStatus ? 2 : 0,
      updatedAt: new Date().toISOString(),
    };
    onUpdateMealEntry(updatedToday);

    if (newStatus) {
      showToast('আপনার মিল সফলভাবে চালু (ON) করা হয়েছে!');
    } else {
      showToast('আপনার মিল বন্ধ (OFF) করা হয়েছে। আপনি আবার চালু না করা পর্যন্ত মিল বন্ধ থাকবে।');
    }
  };

  // Menu preference change for today or tomorrow
  const handleUpdatePreferences = (
    dateStr: string,
    lunchPref?: LunchPreference,
    dinnerPref?: DinnerPreference
  ) => {
    if (isDefaulter) {
      showToast('⚠️ বকেয়া ২ মাসের সীমা ছাড়িয়ে যাওয়ায় মেনু পরিবর্তন লক রয়েছে।');
      return;
    }

    const entry = getEntryForDate(dateStr);
    const updated: DayMealEntry = {
      ...entry,
      lunchPreference: lunchPref || entry.lunchPreference || 'beef',
      dinnerPreference: dinnerPref || entry.dinnerPreference || 'chicken',
      updatedAt: new Date().toISOString(),
    };
    onUpdateMealEntry(updated);
    showToast('মেনু পছন্দ সফলভাবে আপডেট হয়েছে!');
  };

  // Toggle tomorrow's meal with 10:00 PM cutoff check
  const handleToggleTomorrowMeal = () => {
    if (isDefaulter) {
      showToast('⚠️ বকেয়া সীমা অতিক্রম করায় অ্যাকাউন্ট লক করা রয়েছে।');
      return;
    }

    if (isPast10PM && !isManagerOrAdmin) {
      showToast('⚠️ রাত ১০:০০ টার পর আগামীকালের মিল পরিবর্তনের সময় শেষ হয়েছে (Cutoff Enforced)। ম্যানেজার ওভাররাইড প্রয়োজন।');
      return;
    }

    const newStatus = !tomorrowEntry.mealOn;
    const updated: DayMealEntry = {
      ...tomorrowEntry,
      mealOn: newStatus,
      mealsCount: newStatus ? 2 : 0,
      updatedAt: new Date().toISOString(),
    };
    onUpdateMealEntry(updated);
    showToast(`আগামীকালের মিল: ${newStatus ? 'চালু (ON)' : 'বন্ধ (OFF)'} করা হয়েছে!`);
  };

  // Guest meals change
  const handleGuestChange = (dateStr: string, delta: number) => {
    if (isDefaulter) {
      showToast('⚠️ বকেয়া সীমা অতিক্রম করায় গেস্ট মিল যোগ করা যাবে না।');
      return;
    }

    if (dateStr === tomorrowStr && isPast10PM && !isManagerOrAdmin) {
      showToast('⚠️ রাত ১০:০০ টার পর আগামীকালের গেস্ট মিল পরিবর্তন লক করা হয়েছে।');
      return;
    }

    const entry = getEntryForDate(dateStr);
    const currentCount = entry.guestMeals || 0;
    const newCount = Math.max(0, currentCount + delta);

    const updated: DayMealEntry = {
      ...entry,
      guestMeals: newCount,
      updatedAt: new Date().toISOString(),
    };
    onUpdateMealEntry(updated);
    showToast(`${dateStr === todayStr ? 'আজকের' : 'আগামীকালের'} গেস্ট মিল: ${newCount} টি`);
  };

  return (
    <div className="space-y-6">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 border border-emerald-500/60 text-emerald-300 px-4 py-3 rounded-2xl text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* DEFAULTER LOCK WARNING BANNER */}
      {isDefaulter && (
        <div className="bg-rose-950/70 border-2 border-rose-500 rounded-3xl p-5 shadow-2xl shadow-rose-950/50 text-rose-200">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <h3 className="font-black text-base text-white flex items-center gap-2">
                <span>⚠️ অ্যাকাউন্ট সাময়িক লক (Defaulter Lock Enforced)</span>
              </h3>
              <p className="text-xs text-rose-300 mt-1 leading-relaxed">
                আপনার বকেয়া <strong>২ মাসের নির্ধারিত সীমা (৳৪,০০০)</strong> অতিক্রম করেছে (বর্তমান ব্যালেন্স: {formatCurrency(currentUserSummary?.balance || 0)})। মেস নিয়মানুযায়ী আপনার মিল অন/অফ এবং গেস্ট মিল স্বয়ংক্রিয়ভাবে ফ্রিজ রাখা হয়েছে। অনুগ্রহ করে মেস ম্যানেজারের সাথে যোগাযোগ করে বকেয়া পরিশোধ করুন।
              </p>
            </div>
          </div>
        </div>
      )}


      {/* 2. MASTER MEAL ON/OFF TOGGLE CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              মাস্টার মিল কন্ট্রোল (Master Meal Status)
            </span>
            <h3 className="text-xl font-black text-white flex items-center gap-2.5">
              <span>আপনার মিল বর্তমানে:</span>
              <span
                className={`px-3 py-1 rounded-xl text-xs font-black inline-flex items-center gap-1.5 ${
                  currentUser.mealActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {currentUser.mealActive ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>সক্রিয় চালু (MEAL ON)</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>বন্ধ আছে (MEAL OFF)</span>
                  </>
                )}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-2 max-w-lg leading-relaxed">
              মিল চালু থাকলে প্রতিদিন দুপুর ও রাতের খাবার নিয়মিত হিসাব হবে। বাড়ি গেলে বা মিল বন্ধ রাখতে চাইলে সুইচ অফ করে রাখুন।
            </p>
          </div>

          <button
            onClick={handleMasterToggle}
            disabled={isDefaulter}
            className={`py-3.5 px-6 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              currentUser.mealActive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>
              {currentUser.mealActive ? 'মিল বন্ধ করুন (Turn OFF)' : 'মিল চালু করুন (Turn ON)'}
            </span>
          </button>
        </div>
      </div>

      {/* 3. MENU PREFERENCE SELECTION (Beef vs Mutton / Fish vs Egg) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Utensils className="w-4 h-4 text-amber-400" />
              <span>মেনু পছন্দ নির্ধারণ (Menu Preferences)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              মিল চালু থাকা অবস্থায় আপনার খাবারের পছন্দ বেছে নিন। বাবুর্চি ও চেকারের তালিকায় এটি দৃশ্যমান হবে।
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-slate-800 text-amber-300 border border-slate-700">
            আজকের দিন ({todayStr})
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Lunch Menu Options */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-850">
            <span className="text-xs font-bold text-slate-300 block mb-2">
              দুপুরের মেনু পছন্দ (Lunch Choice):
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['beef', 'mutton', 'fish', 'egg', 'vegetarian'] as LunchPreference[]).map((pref) => {
                const isSelected = (todayEntry.lunchPreference || 'beef') === pref;
                const labels: Record<string, string> = {
                  beef: '🥩 গরুর মাংস (Beef)',
                  mutton: '🍖 খাসি (Mutton)',
                  fish: '🐟 মাছ (Fish)',
                  egg: '🥚 ডিম ও ডাল',
                  vegetarian: '🥗 নিরামিষ / সবজি',
                };

                return (
                  <button
                    key={pref}
                    type="button"
                    disabled={isDefaulter}
                    onClick={() => handleUpdatePreferences(todayStr, pref, todayEntry.dinnerPreference)}
                    className={`p-2 rounded-xl text-[11px] font-bold border transition text-center cursor-pointer disabled:opacity-40 ${
                      isSelected
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {labels[pref] || pref}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dinner Menu Options */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-850">
            <span className="text-xs font-bold text-slate-300 block mb-2">
              রাতের মেনু পছন্দ (Dinner Choice):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['chicken', 'fish', 'egg', 'vegetarian'] as DinnerPreference[]).map((pref) => {
                const isSelected = (todayEntry.dinnerPreference || 'chicken') === pref;
                const labels: Record<string, string> = {
                  chicken: '🍗 মুরগি (Chicken)',
                  fish: '🐟 মাছ (Fish)',
                  egg: '🥚 ডিম',
                  vegetarian: '🥗 সবজি (Veg)',
                };

                return (
                  <button
                    key={pref}
                    type="button"
                    disabled={isDefaulter}
                    onClick={() => handleUpdatePreferences(todayStr, todayEntry.lunchPreference, pref)}
                    className={`p-2 rounded-xl text-[11px] font-bold border transition text-center cursor-pointer disabled:opacity-40 ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {labels[pref] || pref}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. NEXT-DAY DEADLINE & 10:00 PM CUTOFF CONTROLS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>পরবর্তী দিনের মিল সুইচ ও ১০:০০ PM কাট-অফ ডেডলাইন</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              পরবর্তী দিন: <strong>{tomorrowStr}</strong> • বাজার খরচের সঠিক হিসাবের জন্য রাত ১০:০০ টায় স্বয়ংক্রিয় লক হয়।
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isPast10PM ? (
              <span className="text-xs px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-rose-400" />
                <span>রাত ১০:০০ PM অতিক্রান্ত (LOCKED)</span>
              </span>
            ) : (
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>১০:০০ PM পর্যন্ত পরিবর্তনযোগ্য</span>
              </span>
            )}
          </div>
        </div>

        {/* Tomorrow Switch & Guest Meals */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/70 p-4.5 rounded-2xl border border-slate-850">
          <div>
            <span className="text-xs font-bold text-white block">
              আগামীকালের মিল স্ট্যাটাস:
            </span>
            <span
              className={`text-xs font-black mt-1 inline-block ${
                tomorrowEntry.mealOn ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {tomorrowEntry.mealOn ? '✅ চালু রয়েছে (চালু থাকবে)' : '❌ বন্ধ রয়েছে'}
            </span>
            {isPast10PM && !isManagerOrAdmin && (
              <p className="text-[11px] text-amber-400 mt-1">
                কাট-অফ সময় শেষ হওয়ায় আপনি নিজে পরিবর্তন করতে পারবেন না। ম্যানেজারের সাথে কথা বলুন।
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Guest meals counter for tomorrow */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl">
              <span className="text-xs text-slate-400 px-2">গেস্ট মিল:</span>
              <button
                type="button"
                onClick={() => handleGuestChange(tomorrowStr, -1)}
                disabled={isDefaulter || (isPast10PM && !isManagerOrAdmin)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 font-bold text-sm flex items-center justify-center hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
              >
                -
              </button>
              <span className="text-xs font-bold text-white w-5 text-center">
                {tomorrowEntry.guestMeals || 0}
              </span>
              <button
                type="button"
                onClick={() => handleGuestChange(tomorrowStr, 1)}
                disabled={isDefaulter || (isPast10PM && !isManagerOrAdmin)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 font-bold text-sm flex items-center justify-center hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
              >
                +
              </button>
            </div>

            {/* Tomorrow toggle button */}
            <button
              onClick={handleToggleTomorrowMeal}
              disabled={isDefaulter || (isPast10PM && !isManagerOrAdmin)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                tomorrowEntry.mealOn
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{tomorrowEntry.mealOn ? 'আগামীকাল বন্ধ রাখুন' : 'আগামীকাল চালু রাখুন'}</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
