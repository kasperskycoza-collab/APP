import { useState, useMemo, useEffect } from 'react';
import { formatCurrency as formatMoney, getBoxValueClass, getMainValueClass } from '../utils';
import { useStore } from '../store';
import { useTranslation } from '../useTranslation';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Sector } from 'recharts';
import { Filter, Download, PieChart as PieChartIcon, Wallet, TrendingUp, FileText } from 'lucide-react';
import ExportPdfModal from './ExportPdfModal';

const PieAny = Pie as any;

export default function Analysis() {
  const { transactions, currency, accounts, themePalette, darkMode } = useStore();
  const { t, language, getCategoryName } = useTranslation();
  const isUbuntu = themePalette === 'ubuntu';
  const isDark = darkMode || (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));
  const isSwahili = language === 'sw';

  const incomeBarColor = isUbuntu ? '#E95420' : '#10b981';
  const expenseBarColor = isUbuntu ? '#77216F' : '#ef4444';
  const gridStroke = isDark ? (isUbuntu ? '#666666' : '#475569') : (isUbuntu ? '#D5D0C7' : '#e2e8f0');
  const axisTextColor = isDark ? '#EBEBEB' : (isUbuntu ? '#2D2D2D' : '#64748b');

  const [period, setPeriod] = useState('monthly');
  const [activeAccount, setActiveAccount] = useState<string>('all');
  const [activePieIndex, setActivePieIndex] = useState<number>(0);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [selectedBar, setSelectedBar] = useState<{ index: number; dataKey: 'income' | 'expense' } | null>(null);

  useEffect(() => {
    setSelectedBar(null);
  }, [period, activeAccount]);

  const renderZoomBarShape = (props: any, isSelected: boolean) => {
    const { fill, x, y, width, height, radius, value } = props;
    if (!width || width <= 0 || !value || value <= 0) return null;

    const rx = Array.isArray(radius) ? radius[0] : (radius || 6);
    const scaleX = isSelected ? 1.18 : 1;
    const scaleY = isSelected ? 1.12 : 1;
    
    const barHeight = Math.max(height || 0, 4);
    const scaledWidth = width * scaleX;
    const scaledHeight = barHeight * scaleY;
    const dx = (width - scaledWidth) / 2;
    const dy = barHeight - scaledHeight;
    const barY = y + (height - barHeight);

    const resolvedFill = fill || (props.dataKey === 'income' ? incomeBarColor : expenseBarColor);

    return (
      <rect
        x={x + dx}
        y={barY + dy}
        width={scaledWidth}
        height={scaledHeight}
        fill={resolvedFill}
        rx={rx}
        ry={rx}
        className={`transition-all duration-300 ease-out cursor-pointer ${
          isSelected ? 'filter drop-shadow-lg brightness-110' : 'hover:opacity-95'
        }`}
        style={{
          outline: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
      />
    );
  };

  const formatCurrency = (amount: number) => {
    return formatMoney(amount, currency, 0);
  };

  const handleExportCSV = () => {
    if (!filteredTransactions.length) {
      alert(isSwahili ? 'Hakuna miamala ya kuuza nje.' : 'No transactions to export.');
      return;
    }
    const headers = ['ID', 'Date', 'Type', 'Category', 'Description', 'Amount', 'Account'];
    const rows = filteredTransactions.map(t => [
      t.id,
      t.date,
      t.type,
      `"${t.category || ''}"`,
      `"${t.description || ''}"`,
      t.amount,
      `"${accounts?.find(a => a.id === t.account)?.name || 'Default'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `simzy-transactions-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + acc.balance, 0);
  }, [accounts]);

  const COLORS = isUbuntu 
    ? ['#E95420', '#77216F', '#EBEBEB', '#5E2750', '#FF8F6B', '#9D358D', '#D14818', '#383838']
    : ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#6b7280'];

  const parseTxDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    if (dateStr.includes('T')) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) return d;
    }
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month, day);
      }
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const refDate = useMemo(() => {
    if (!transactions.length) return new Date();
    const now = new Date();
    const hasTxInCurrentYear = transactions.some(t => parseTxDate(t.date).getFullYear() === now.getFullYear());
    if (hasTxInCurrentYear) return now;

    let maxTime = 0;
    transactions.forEach(t => {
      const time = parseTxDate(t.date).getTime();
      if (time > maxTime) maxTime = time;
    });
    return maxTime > 0 ? new Date(maxTime) : now;
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (activeAccount !== 'all' && (t.account || 'default') !== activeAccount) {
        return false;
      }

      const txDate = parseTxDate(t.date);

      if (period === 'daily') {
        return isSameDay(txDate, refDate);
      }

      if (period === 'weekly') {
        const startOfWeek = new Date(refDate);
        const day = startOfWeek.getDay();
        const diff = (day === 0 ? -6 : 1) - day;
        startOfWeek.setDate(startOfWeek.getDate() + diff);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return txDate >= startOfWeek && txDate <= endOfWeek;
      }

      if (period === 'monthly') {
        return (
          txDate.getMonth() === refDate.getMonth() &&
          txDate.getFullYear() === refDate.getFullYear()
        );
      }

      if (period === 'yearly') {
        return txDate.getFullYear() === refDate.getFullYear();
      }

      return true;
    });
  }, [transactions, activeAccount, period, refDate]);

  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    });
    return {
      income,
      expense,
      net: income - expense,
      count: filteredTransactions.length
    };
  }, [filteredTransactions]);

  const expenseBreakdown = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const categories: Record<string, number> = {};
    expenses.forEach(t => {
      const cat = t.category || 'Other';
      categories[cat] = (categories[cat] || 0) + t.amount;
    });

    return Object.entries(categories)
      .map(([name, value]) => ({ name: getCategoryName(name), value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, getCategoryName]);

  const accountBalances = useMemo(() => {
    const balances: Record<string, { income: number; expense: number; net: number }> = {};
    filteredTransactions.forEach(t => {
      const accId = t.account || 'default';
      if (!balances[accId]) {
        balances[accId] = { income: 0, expense: 0, net: 0 };
      }
      if (t.type === 'income') {
        balances[accId].income += t.amount;
        balances[accId].net += t.amount;
      } else {
        balances[accId].expense += t.amount;
        balances[accId].net -= t.amount;
      }
    });
    return balances;
  }, [filteredTransactions]);

  const barChartData = useMemo(() => {
    if (period === 'daily') {
      const hoursData: Record<number, { income: number; expense: number }> = {};
      for (let i = 6; i <= 22; i += 2) {
        hoursData[i] = { income: 0, expense: 0 };
      }
      filteredTransactions.forEach(t => {
        const txDate = parseTxDate(t.date);
        const hour = Math.floor(txDate.getHours() / 2) * 2;
        const targetHour = Math.min(22, Math.max(6, hour));
        if (!hoursData[targetHour]) hoursData[targetHour] = { income: 0, expense: 0 };
        if (t.type === 'income') hoursData[targetHour].income += t.amount;
        else hoursData[targetHour].expense += t.amount;
      });
      return Object.entries(hoursData).map(([hour, data]) => ({
        date: `${hour}:00`,
        income: data.income,
        expense: data.expense
      }));
    }

    if (period === 'weekly') {
      const days = isSwahili 
        ? ['Jmt', 'Jmn', 'Jtn', 'Alh', 'Iju', 'Jms', 'Jum']
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      const startOfWeek = new Date(refDate);
      const day = startOfWeek.getDay();
      const diff = (day === 0 ? -6 : 1) - day;
      startOfWeek.setDate(startOfWeek.getDate() + diff);
      startOfWeek.setHours(0, 0, 0, 0);

      const weekData = days.map((d, idx) => {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + idx);
        const dayNum = dayDate.getDate();
        return {
          date: `${d} ${dayNum}`,
          income: 0,
          expense: 0
        };
      });

      filteredTransactions.forEach(t => {
        const txDate = parseTxDate(t.date);
        let dayIdx = txDate.getDay();
        dayIdx = dayIdx === 0 ? 6 : dayIdx - 1;
        if (dayIdx >= 0 && dayIdx < weekData.length) {
          if (t.type === 'income') weekData[dayIdx].income += t.amount;
          else weekData[dayIdx].expense += t.amount;
        }
      });
      return weekData;
    }

    if (period === 'monthly') {
      const prefix = isSwahili ? 'Wk' : 'W';
      const weeksData = [
        { date: `${prefix}1 (1-7)`, weekStart: 1, weekEnd: 7, income: 0, expense: 0 },
        { date: `${prefix}2 (8-14)`, weekStart: 8, weekEnd: 14, income: 0, expense: 0 },
        { date: `${prefix}3 (15-21)`, weekStart: 15, weekEnd: 21, income: 0, expense: 0 },
        { date: `${prefix}4 (22-28)`, weekStart: 22, weekEnd: 28, income: 0, expense: 0 },
        { date: `${prefix}5 (29+)`, weekStart: 29, weekEnd: 31, income: 0, expense: 0 },
      ];
      filteredTransactions.forEach(t => {
        const txDate = parseTxDate(t.date);
        const day = txDate.getDate();
        const bucket = weeksData.find(w => day >= w.weekStart && day <= w.weekEnd);
        if (bucket) {
          if (t.type === 'income') bucket.income += t.amount;
          else bucket.expense += t.amount;
        }
      });
      return weeksData;
    }

    if (period === 'yearly') {
      const months = isSwahili 
        ? ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ago', 'Sep', 'Okt', 'Nov', 'Des']
        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthsData = months.map(m => ({ date: m, income: 0, expense: 0 }));
      filteredTransactions.forEach(t => {
        const txDate = parseTxDate(t.date);
        const mIdx = txDate.getMonth();
        if (t.type === 'income') monthsData[mIdx].income += t.amount;
        else monthsData[mIdx].expense += t.amount;
      });
      return monthsData;
    }

    return [];
  }, [filteredTransactions, period, isSwahili, refDate]);

  const maxYValue = useMemo(() => {
    return barChartData.reduce((max, d) => Math.max(max, d.income, d.expense), 0);
  }, [barChartData]);

  const yAxisWidth = useMemo(() => {
    const sampleFormatted = formatCurrency(maxYValue > 0 ? maxYValue : 100000);
    const len = sampleFormatted.length;
    return Math.max(78, Math.min(130, len * 7.5 + 20));
  }, [maxYValue, currency]);

  const CompactTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 dark:bg-slate-800/95 text-white border border-slate-700/80 rounded-xl p-2 px-2.5 shadow-xl text-[11px] backdrop-blur-md pointer-events-none select-none z-50 min-w-[125px]">
          {label && <p className="font-bold text-[10px] text-slate-400 mb-1 tracking-wide uppercase">{label}</p>}
          {payload.map((entry: any, index: number) => (
            <div key={`audit-item-${index}`} className="flex items-center justify-between gap-3 text-[11px] py-0.5">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color || entry.fill }} />
                <span>{entry.name === 'Income' ? t('income') : entry.name === 'Expense' ? t('expense') : entry.name}:</span>
              </span>
              <span className="font-extrabold text-white whitespace-nowrap">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const formattedVal = formatCurrency(value);
    const isLongVal = formattedVal.length > 12;

    return (
      <g style={{ outline: 'none' }}>
        <text 
          x={cx} 
          y={cy - 12} 
          textAnchor="middle" 
          fill={fill} 
          className="font-extrabold text-[11px] sm:text-xs capitalize select-none"
        >
          {payload.name}
        </text>
        <text 
          x={cx} 
          y={cy + 6} 
          textAnchor="middle" 
          className={`fill-slate-800 dark:fill-slate-100 font-black select-none ${isLongVal ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'}`}
        >
          {formattedVal}
        </text>
        <text 
          x={cx} 
          y={cy + 22} 
          textAnchor="middle" 
          className="fill-slate-500 dark:fill-slate-400 font-bold text-[10px] sm:text-[11px] select-none"
        >
          {(percent * 100).toFixed(0)}%
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 2}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke="none"
          strokeWidth={0}
          style={{ outline: 'none', border: 'none' }}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 11}
          outerRadius={outerRadius + 14}
          fill={fill}
          stroke="none"
          strokeWidth={0}
          style={{ outline: 'none', border: 'none' }}
        />
      </g>
    );
  };

  return (
    <div className="pb-24 md:pb-8 space-y-6 min-w-0 max-w-full overflow-x-hidden">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white p-5 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl shadow-xl relative z-10 overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
          <div className="min-w-0 max-w-full flex-1 shrink pr-0 lg:pr-2 overflow-hidden">
            <div className="text-xs md:text-sm uppercase tracking-wider font-bold opacity-80 mb-1 truncate">
              {t('totalSavingsBalance')}
            </div>
            <div className={getMainValueClass(formatCurrency(totalBalance))} title={formatCurrency(totalBalance)}>
              {formatCurrency(totalBalance)}
            </div>
            <div className="text-xs opacity-75 mt-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping flex-shrink-0"></span>
              <span className="truncate">
                {isSwahili ? 'Daftari la Ukaguzi na Takwimu' : 'Audit & Analytics Audit Register'}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2.5 sm:gap-4 overflow-hidden w-full lg:w-auto shrink-0">
            <div className="flex-1 lg:w-44 xl:w-48 bg-white/10 dark:bg-slate-800/20 backdrop-blur-md rounded-2xl p-3 md:p-4 border border-white/20 min-w-0 flex flex-col justify-center">
              <div className="text-xs opacity-80 mb-1 font-medium truncate">{t('totalInflow')}</div>
              <div className={`text-emerald-200 ${getBoxValueClass('+' + formatCurrency(stats.income))}`} title={'+' + formatCurrency(stats.income)}>
                +{formatCurrency(stats.income)}
              </div>
            </div>
            <div className="flex-1 lg:w-44 xl:w-48 bg-white/10 dark:bg-slate-800/20 backdrop-blur-md rounded-2xl p-3 md:p-4 border border-white/20 min-w-0 flex flex-col justify-center">
              <div className="text-xs opacity-80 mb-1 font-medium truncate">{t('totalOutflow')}</div>
              <div className={`text-red-200 ${getBoxValueClass('-' + formatCurrency(stats.expense))}`} title={'-' + formatCurrency(stats.expense)}>
                -{formatCurrency(stats.expense)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Structured Audit Controls & Adjustments Panel */}
      <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-2">
            <Filter className={isUbuntu ? "text-[#E95420]" : "text-emerald-600 dark:text-emerald-400"} size={20} />
            <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
              {isSwahili ? 'Marekebisho na Upeo wa Ukaguzi' : 'Audit Adjustments & Scope Controls'}
            </h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <button 
              onClick={() => setIsPdfModalOpen(true)} 
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-white font-black text-xs md:text-sm shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer ${
                isUbuntu ? 'bg-[#E95420] hover:bg-[#D14818]' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <FileText size={16} /> {isSwahili ? 'Pakua PDF ya Ukaguzi' : 'Export Audit PDF'}
            </button>
            <button 
              onClick={handleExportCSV} 
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs md:text-sm border border-slate-200 dark:border-slate-600 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
            >
              <Download size={16} /> {isSwahili ? 'Pakua CSV' : 'Export CSV'}
            </button>
          </div>
        </div>

        {/* Adjustments Form Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 items-end">
          {/* Account Filter */}
          <div className="min-w-0">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              {isSwahili ? 'Upeo wa Akaunti' : 'Account Scope'}
            </label>
            <select
              value={activeAccount}
              onChange={(e) => setActiveAccount(e.target.value)}
              className="w-full h-[42px] text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 cursor-pointer focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="all">{isSwahili ? `Akaunti Zote (${accounts.length})` : `All Accounts (${accounts.length})`}</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>
              ))}
            </select>
          </div>

          {/* Timeframe Interval - Analysis Period */}
          <div className="min-w-0">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              {isSwahili ? 'Kipindi cha Ukaguzi' : 'Analysis Period'}
            </label>
            <div className="grid grid-cols-4 gap-0.5 sm:gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 h-[42px] items-center w-full min-w-0">
              {[
                { id: 'daily', labelEn: 'Daily', labelSw: 'Siku' },
                { id: 'weekly', labelEn: 'Weekly', labelSw: 'Wiki' },
                { id: 'monthly', labelEn: 'Monthly', labelSw: 'Mwezi' },
                { id: 'yearly', labelEn: 'Yearly', labelSw: 'Mwaka' }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`w-full h-full min-w-0 px-0.5 sm:px-1 text-[9.5px] min-[400px]:text-[10px] sm:text-[10.5px] md:text-[11px] lg:text-xs font-extrabold tracking-tighter sm:tracking-tight capitalize transition-all text-center flex items-center justify-center rounded-lg cursor-pointer ${
                    period === p.id 
                      ? (isUbuntu ? 'bg-white dark:bg-slate-800 text-[#E95420] shadow-sm border border-slate-200/50 dark:border-slate-700' : 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/50 dark:border-slate-700')
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title={`${isSwahili ? p.labelSw : p.labelEn}`}
                >
                  <span className="w-full min-w-0 block text-center truncate">
                    {isSwahili ? p.labelSw : p.labelEn}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Audited Entries Indicator */}
          <div className="min-w-0">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              {isSwahili ? 'Kumbukumbu Zilizokaguliwa' : 'Audited Records'}
            </label>
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold text-slate-700 dark:text-slate-200 flex justify-between items-center h-[42px]">
              <span className="truncate">{isSwahili ? 'Miamala Iliyochujwa' : 'Filtered Records'}</span>
              <span className={`px-2.5 py-0.5 rounded-md font-black shrink-0 ${
                isUbuntu ? 'bg-[#FFF2EB] text-[#E95420] dark:bg-[#383838]' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
              }`}>{stats.count}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-0 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center min-w-0">
            <div className={`text-base sm:text-xl font-black mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis ${
              isUbuntu ? 'text-[#E95420]' : 'text-emerald-600'
            }`} title={formatCurrency(stats.income)}>{formatCurrency(stats.income)}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold tracking-wide uppercase truncate">{t('income')}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center min-w-0">
            <div className={`text-base sm:text-xl font-black mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis ${
              isUbuntu ? 'text-[#77216F]' : 'text-red-600'
            }`} title={formatCurrency(stats.expense)}>{formatCurrency(stats.expense)}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold tracking-wide uppercase truncate">{t('expense')}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center min-w-0">
            <div className={`text-base sm:text-xl font-black mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis ${
              isUbuntu ? 'text-[#E95420]' : 'text-emerald-800 dark:text-emerald-400'
            }`} title={formatCurrency(stats.net)}>{formatCurrency(stats.net)}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold tracking-wide uppercase truncate">{isSwahili ? 'Akiba Halisi' : 'Net Savings'}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center min-w-0">
            <div className="text-base sm:text-xl font-black text-slate-800 dark:text-slate-100 mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{stats.count}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold tracking-wide uppercase truncate">{t('transactions')}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isUbuntu ? 'bg-[#FFF2EB] text-[#E95420] dark:bg-[#383838]' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
            }`}>
              <Wallet size={16} />
            </span>
            {isSwahili ? 'Salio la Akaunti' : 'Account Balances'}
          </h3>
          <div className="space-y-3">
            {Object.entries(accountBalances).length > 0 ? (
              Object.entries(accountBalances).map(([accId, data]) => {
                const balancesData = data as { income: number; expense: number; net: number };
                const acc = accounts?.find(a => a.id === accId);
                const name = acc ? acc.name : (isSwahili ? 'Akaunti Isiyojulikana' : 'Unknown Account');
                return (
                  <div key={accId} className="p-3 sm:p-4 border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-xl flex flex-col gap-2.5">
                    <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm sm:text-base">{name}</div>
                    <div className="flex flex-col gap-1.5 w-full text-xs sm:text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">{t('inflow')}</span>
                        <span className={`font-semibold max-w-[60%] truncate ${isUbuntu ? 'text-[#E95420]' : 'text-emerald-600'}`} title={'+' + formatCurrency(balancesData.income)}>
                          +{formatCurrency(balancesData.income)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">{t('outflow')}</span>
                        <span className={`font-semibold max-w-[60%] truncate ${isUbuntu ? 'text-[#77216F]' : 'text-red-500'}`} title={'-' + formatCurrency(balancesData.expense)}>
                          -{formatCurrency(balancesData.expense)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700 mt-0.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{isSwahili ? 'Salio Halisi' : 'Net balance'}</span>
                        <span className={`font-bold max-w-[60%] truncate ${
                          balancesData.net >= 0 
                            ? (isUbuntu ? 'text-[#E95420]' : 'text-emerald-600 dark:text-emerald-400') 
                            : (isUbuntu ? 'text-[#77216F]' : 'text-red-600 dark:text-red-400')
                        }`} title={(balancesData.net >= 0 ? '+' : '') + formatCurrency(balancesData.net)}>
                          {balancesData.net >= 0 ? '+' : ''}{formatCurrency(balancesData.net)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                {isSwahili ? 'Hakuna taarifa za akaunti zilizopo' : 'No account data available'}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isUbuntu ? 'bg-[#FFF2EB] text-[#E95420] dark:bg-[#383838]' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
              }`}>
                <PieChartIcon size={16} />
              </span>
              {t('expenseBreakdown')}
            </h3>
            {expenseBreakdown.length > 0 && (
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-2.5 py-1 rounded-full">
                {expenseBreakdown.length} {isSwahili ? 'Makundi' : 'Categories'}
              </span>
            )}
          </div>

          {expenseBreakdown.length > 0 ? (
            <div className="w-full">
              {/* Interactive Pie Chart with Zoom Segment */}
              <div className="h-64 sm:h-72 w-full relative select-none [&_*]:focus:outline-none [&_*]:focus:ring-0 [-webkit-tap-highlight-color:transparent]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <PieAny
                      activeIndex={activePieIndex}
                      activeShape={renderActiveShape}
                      data={expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={92}
                      paddingAngle={3}
                      dataKey="value"
                      style={{ outline: 'none' }}
                      onMouseEnter={(_: any, index: number) => setActivePieIndex(index)}
                      onClick={(_: any, index: number) => setActivePieIndex(index)}
                    >
                      {expenseBreakdown.map((_, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                          stroke="none"
                          strokeWidth={0}
                          style={{ outline: 'none', border: 'none' }}
                          className="transition-all duration-300 cursor-pointer focus:outline-none"
                        />
                      ))}
                    </PieAny>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Keys Legend Container */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
                  {isSwahili ? 'Makundi ya Matumizi (Gusa kukuza sehemu)' : 'Category Keys (Tap/Hover to Zoom Segment)'}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {expenseBreakdown.map((entry, i) => {
                    const isSelected = activePieIndex === i;
                    const color = COLORS[i % COLORS.length];
                    return (
                      <button
                        key={entry.name}
                        onClick={() => setActivePieIndex(i)}
                        onMouseEnter={() => setActivePieIndex(i)}
                        className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all border text-left cursor-pointer ${
                          isSelected 
                            ? (isUbuntu ? 'bg-[#FFF2EB] dark:bg-[#383838] border-[#E95420] shadow-sm scale-[1.02]' : 'bg-slate-100 dark:bg-slate-700 border-indigo-500/80 dark:border-indigo-400/80 shadow-sm scale-[1.02]')
                            : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }}></div>
                          <span className="truncate text-slate-800 dark:text-slate-200 capitalize text-[11px] sm:text-xs">{entry.name}</span>
                        </div>
                        <span className="font-extrabold text-[11px] text-slate-900 dark:text-slate-100 flex-shrink-0">
                          {formatCurrency(entry.value)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              {isSwahili ? 'Hakuna taarifa za matumizi zilizopo' : 'No expense data available'}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between min-w-0">
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 mb-4 sm:mb-6">
            <h2 className="font-extrabold text-sm sm:text-base lg:text-lg flex items-center gap-2 text-slate-800 dark:text-slate-100 min-w-0">
              <TrendingUp size={18} className={isUbuntu ? "text-[#E95420] flex-shrink-0" : "text-emerald-600 dark:text-emerald-400 flex-shrink-0"} />
              <span className="truncate">{isSwahili ? 'Mwenendo wa Mtiririko wa Fedha' : 'Cash Flow Trend Audit'}</span>
            </h2>
            <div className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0">
              {isSwahili ? 'Daftari la Kipindi' : 'Period Register'}
            </div>
          </div>
          {barChartData.length > 0 ? (
            <div className="w-full">
              <div style={{ width: '100%', height: 220 }} className="mb-4 select-none [&_*]:focus:outline-none [&_*]:focus:ring-0 [-webkit-tap-highlight-color:transparent]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 20, right: 12, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: axisTextColor }} dy={10} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: axisTextColor }} 
                      tickFormatter={(value) => formatCurrency(value)} 
                      width={yAxisWidth} 
                    />
                    <Tooltip 
                      content={<CompactTooltip />}
                      cursor={false}
                    />
                    <Bar 
                      dataKey="income" 
                      name={t('income')} 
                      fill={incomeBarColor} 
                      radius={[6, 6, 0, 0]} 
                      maxBarSize={45} 
                      minPointSize={4}
                      activeBar={false}
                      onClick={(_, index) => {
                        setSelectedBar(prev => (prev?.index === index && prev?.dataKey === 'income' ? null : { index, dataKey: 'income' }));
                      }}
                      shape={(props: any) => {
                        const isSelected = selectedBar?.index === props.index && selectedBar?.dataKey === 'income';
                        return renderZoomBarShape(props, isSelected);
                      }}
                    />
                    <Bar 
                      dataKey="expense" 
                      name={t('expense')} 
                      fill={expenseBarColor} 
                      radius={[6, 6, 0, 0]} 
                      maxBarSize={45} 
                      minPointSize={4}
                      activeBar={false}
                      onClick={(_, index) => {
                        setSelectedBar(prev => (prev?.index === index && prev?.dataKey === 'expense' ? null : { index, dataKey: 'expense' }));
                      }}
                      shape={(props: any) => {
                        const isSelected = selectedBar?.index === props.index && selectedBar?.dataKey === 'expense';
                        return renderZoomBarShape(props, isSelected);
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Bottom Summary & Legend Badges */}
              <div className="pt-3.5 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-3 gap-1.5 sm:gap-3 items-center w-full">
                {/* Amount In Badge */}
                <div className={`flex flex-col xl:flex-row items-center justify-center gap-0.5 xl:gap-1.5 px-1 py-2 sm:px-2.5 sm:py-2.5 rounded-xl border shadow-sm min-w-0 text-center ${
                  isUbuntu 
                    ? 'bg-[#FFF2EB] dark:bg-[rgba(233,84,32,0.16)] border-[#FCD2C2] dark:border-[rgba(233,84,32,0.5)]'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/60'
                }`}>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 animate-pulse ${isUbuntu ? 'bg-[#E95420]' : 'bg-emerald-500'}`}></span>
                    <span className={`text-[10px] sm:text-xs font-bold ${isUbuntu ? 'text-[#2D2D2D] dark:text-white' : 'text-emerald-800 dark:text-emerald-300'}`}>
                      {t('inflow')}:
                    </span>
                  </div>
                  <span className={`font-black text-[10px] sm:text-xs xl:text-sm whitespace-nowrap truncate max-w-full ${isUbuntu ? 'text-[#E95420]' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    +{formatCurrency(stats.income)}
                  </span>
                </div>

                {/* Amount Out Badge */}
                <div className={`flex flex-col xl:flex-row items-center justify-center gap-0.5 xl:gap-1.5 px-1 py-2 sm:px-2.5 sm:py-2.5 rounded-xl border shadow-sm min-w-0 text-center ${
                  isUbuntu 
                    ? 'bg-[#FDF0F7] dark:bg-[rgba(119,33,111,0.25)] border-[#F3CFEA] dark:border-[rgba(119,33,111,0.6)]'
                    : 'bg-red-50 dark:bg-red-950/40 border-red-200/80 dark:border-red-800/60'
                }`}>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 animate-pulse ${isUbuntu ? 'bg-[#77216F]' : 'bg-red-500'}`}></span>
                    <span className={`text-[10px] sm:text-xs font-bold ${isUbuntu ? 'text-[#2D2D2D] dark:text-white' : 'text-red-800 dark:text-red-300'}`}>
                      {t('outflow')}:
                    </span>
                  </div>
                  <span className={`font-black text-[10px] sm:text-xs xl:text-sm whitespace-nowrap truncate max-w-full ${isUbuntu ? 'text-[#77216F]' : 'text-red-600 dark:text-red-400'}`}>
                    -{formatCurrency(stats.expense)}
                  </span>
                </div>

                {/* Net Flow Balance Badge */}
                <div className={`flex flex-col xl:flex-row items-center justify-center gap-0.5 xl:gap-1.5 px-1 py-2 sm:px-2.5 sm:py-2.5 rounded-xl border text-center shadow-sm min-w-0 ${
                  isUbuntu
                    ? (stats.net >= 0 
                        ? 'bg-[#FFF2EB] dark:bg-[rgba(233,84,32,0.16)] border-[#FCD2C2] dark:border-[rgba(233,84,32,0.5)] text-[#2D2D2D] dark:text-white' 
                        : 'bg-[#FDF0F7] dark:bg-[rgba(119,33,111,0.25)] border-[#F3CFEA] dark:border-[rgba(119,33,111,0.6)] text-[#2D2D2D] dark:text-white')
                    : (stats.net >= 0 
                        ? 'bg-emerald-100/80 dark:bg-emerald-900/50 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200' 
                        : 'bg-red-100/80 dark:bg-red-900/50 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200')
                }`}>
                  <span className="text-[10px] sm:text-xs font-bold opacity-90 flex-shrink-0">
                    {t('net')}:
                  </span>
                  <span className={`font-black text-[10px] sm:text-xs xl:text-sm whitespace-nowrap truncate max-w-full ${
                    isUbuntu ? (stats.net >= 0 ? 'text-[#E95420]' : 'text-[#77216F]') : ''
                  }`}>
                    {stats.net >= 0 ? '+' : ''}{formatCurrency(stats.net)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
             <div className="text-center py-8 text-slate-500 dark:text-slate-400">
               {isSwahili ? 'Hakuna taarifa za mwenendo zilizopo' : 'No trend data available'}
             </div>
          )}
        </div>
      </div>

      <ExportPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        defaultAccount={activeAccount}
        defaultPeriod={period}
      />
    </div>
  );
}
