import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { formatCurrency } from '../utils';
import { X, FileText, Download, Filter, Calendar, BookOpen, Layers, CheckCircle2, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAccount?: string;
  defaultPeriod?: string;
}

export default function ExportPdfModal({ isOpen, onClose, defaultAccount = 'all', defaultPeriod = 'monthly' }: ExportPdfModalProps) {
  const { transactions, accounts, currency, user } = useStore();

  // Customization State
  const [selectedAccount, setSelectedAccount] = useState<string>(defaultAccount);
  const [periodPreset, setPeriodPreset] = useState<string>(defaultPeriod);
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Report Customization Options
  const [reportTitle, setReportTitle] = useState<string>('Financial Audit & Analytics Report');
  const [auditorName, setAuditorName] = useState<string>(user?.name || 'Financial Audit Register');
  const [reportNotes, setReportNotes] = useState<string>('Audited and verified financial transaction record generated from Simzy Finance System.');
  const [includeSummaryCards, setIncludeSummaryCards] = useState<boolean>(true);
  const [includeCategoryBreakdown, setIncludeCategoryBreakdown] = useState<boolean>(true);

  // State for loading font
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Available Categories
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set).sort();
  }, [transactions]);

  // Date filtering logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Account filter
      if (selectedAccount !== 'all' && (t.account || 'default') !== selectedAccount) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'all' && t.type !== typeFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && t.category !== categoryFilter) {
        return false;
      }

      // Period filter
      if (periodPreset === 'all') return true;

      const tDate = new Date(t.date);
      const now = new Date();

      if (periodPreset === 'today') {
        return tDate.toDateString() === now.toDateString();
      }

      if (periodPreset === 'weekly') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return tDate >= oneWeekAgo && tDate <= now;
      }

      if (periodPreset === 'monthly') {
        return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
      }

      if (periodPreset === 'yearly') {
        return tDate.getFullYear() === now.getFullYear();
      }

      if (periodPreset === 'custom') {
        if (customStartDate && new Date(t.date) < new Date(customStartDate)) return false;
        if (customEndDate && new Date(t.date) > new Date(customEndDate + 'T23:59:59')) return false;
        return true;
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedAccount, typeFilter, categoryFilter, periodPreset, customStartDate, customEndDate]);

  // Summary Metrics
  const stats = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const net = income - expense;
    return { income, expense, net, count: filteredTransactions.length };
  }, [filteredTransactions]);

  // Category breakdown stats
  const categoryBreakdown = useMemo(() => {
    const map: { [key: string]: number } = {};
    filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
      const cat = t.category || 'Uncategorized';
      map[cat] = (map[cat] || 0) + t.amount;
    });
    const totalExp = stats.expense || 1;
    return Object.entries(map)
      .map(([name, value]) => ({ name, value, percentage: Math.round((value / totalExp) * 100) }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, stats.expense]);

  const activeAccountObj = accounts.find(a => a.id === selectedAccount);
  const accountNameDisplay = selectedAccount === 'all' ? 'All Books / Accounts' : (activeAccountObj?.name || 'Selected Book');

  if (!isOpen) return null;

  // Helper to convert ArrayBuffer to Base64
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Generate & Save PDF Function using Ubuntu Font (26pt Title)
  const handleGeneratePDF = async () => {
    setIsGenerating(true);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      let fontFamily = 'helvetica';

      // Load Ubuntu Sans Regular & Bold fonts dynamically
      try {
        const [regRes, boldRes] = await Promise.all([
          fetch('https://cdn.jsdelivr.net/fontsource/fonts/ubuntu-sans@v1/latin-400-normal.ttf'),
          fetch('https://cdn.jsdelivr.net/fontsource/fonts/ubuntu-sans@v1/latin-700-normal.ttf')
        ]);

        if (regRes.ok && boldRes.ok) {
          const [regBuf, boldBuf] = await Promise.all([
            regRes.arrayBuffer(),
            boldRes.arrayBuffer()
          ]);

          const regBase64 = arrayBufferToBase64(regBuf);
          const boldBase64 = arrayBufferToBase64(boldBuf);

          doc.addFileToVFS('UbuntuSans-Regular.ttf', regBase64);
          doc.addFont('UbuntuSans-Regular.ttf', 'Ubuntu Sans', 'normal');

          doc.addFileToVFS('UbuntuSans-Bold.ttf', boldBase64);
          doc.addFont('UbuntuSans-Bold.ttf', 'Ubuntu Sans', 'bold');

          fontFamily = 'Ubuntu Sans';
        } else {
          // Fallback to standard Ubuntu font CDN
          const [uRegRes, uBoldRes] = await Promise.all([
            fetch('https://cdn.jsdelivr.net/fontsource/fonts/ubuntu@v50/latin-400-normal.ttf'),
            fetch('https://cdn.jsdelivr.net/fontsource/fonts/ubuntu@v50/latin-700-normal.ttf')
          ]);
          if (uRegRes.ok && uBoldRes.ok) {
            const [uRegBuf, uBoldBuf] = await Promise.all([uRegRes.arrayBuffer(), uBoldRes.arrayBuffer()]);
            doc.addFileToVFS('Ubuntu-Regular.ttf', arrayBufferToBase64(uRegBuf));
            doc.addFont('Ubuntu-Regular.ttf', 'Ubuntu Sans', 'normal');
            doc.addFileToVFS('Ubuntu-Bold.ttf', arrayBufferToBase64(uBoldBuf));
            doc.addFont('Ubuntu-Bold.ttf', 'Ubuntu Sans', 'bold');
            fontFamily = 'Ubuntu Sans';
          }
        }
      } catch (fontErr) {
        console.warn('Could not load Ubuntu Sans font online, falling back to Helvetica:', fontErr);
      }

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      let yPos = 14;

      // Helper for currency without cents
      const fmt = (val: number) => formatCurrency(val, currency, 0);

      // --- 1. APP GRAPHICS MATCHED TOP HEADER BANNER ---
      // Deep Emerald Gradient Fill Box
      doc.setFillColor(4, 120, 87); // Emerald 700
      doc.rect(margin, yPos, pageWidth - (margin * 2), 34, 'F');

      // Header Accent Line
      doc.setFillColor(16, 185, 129); // Emerald 500
      doc.rect(margin, yPos + 32, pageWidth - (margin * 2), 2, 'F');

      // Header Text - UBUNTU SANS 26 FONT TITLE
      doc.setTextColor(255, 255, 255);
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(26);
      doc.text(reportTitle, margin + 6, yPos + 13);

      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(9);
      doc.text(`SIMZY FINANCE AUDIT REGISTER | Generated by ${auditorName}`, margin + 6, yPos + 22);

      const nowStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      doc.setFontSize(8);
      doc.text(`Date: ${nowStr} | Ref: AUD-${Math.floor(100000 + Math.random() * 900000)}`, margin + 6, yPos + 28);

      yPos += 40;

      // --- 2. AUDIT SCOPE & CUSTOM ADJUSTMENTS SUMMARY BOX ---
      doc.setFillColor(248, 250, 252); // Light slate background
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 16, 2, 2, 'FD');

      doc.setTextColor(15, 23, 42);
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(8);
      
      // Grid of parameters
      doc.text(`ACCOUNT SCOPE:`, margin + 4, yPos + 6);
      doc.setFont(fontFamily, 'normal');
      doc.text(accountNameDisplay, margin + 32, yPos + 6);

      doc.setFont(fontFamily, 'bold');
      doc.text(`TIMEFRAME:`, margin + 100, yPos + 6);
      doc.setFont(fontFamily, 'normal');
      doc.text(periodPreset.toUpperCase(), margin + 120, yPos + 6);

      doc.setFont(fontFamily, 'bold');
      doc.text(`FILTER TYPE:`, margin + 4, yPos + 12);
      doc.setFont(fontFamily, 'normal');
      doc.text(typeFilter.toUpperCase(), margin + 28, yPos + 12);

      doc.setFont(fontFamily, 'bold');
      doc.text(`AUDITED RECORDS:`, margin + 100, yPos + 12);
      doc.setFont(fontFamily, 'bold');
      doc.setTextColor(5, 150, 105);
      doc.text(`${stats.count} Transactions`, margin + 132, yPos + 12);

      yPos += 22;

      // --- 3. EXECUTIVE KPI CARDS (If enabled) ---
      if (includeSummaryCards) {
        const cardWidth = (pageWidth - (margin * 2) - 6) / 3;
        const cardHeight = 18;

        // Inflow Tile
        doc.setFillColor(236, 253, 245); // Emerald 50
        doc.setDrawColor(167, 243, 208); // Emerald 200
        doc.roundedRect(margin, yPos, cardWidth, cardHeight, 2, 2, 'FD');

        doc.setTextColor(6, 95, 70); // Emerald 800
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(7);
        doc.text('TOTAL AMOUNT IN', margin + 4, yPos + 5);
        doc.setFontSize(11);
        doc.setTextColor(5, 150, 105);
        doc.text(`+${fmt(stats.income)}`, margin + 4, yPos + 13);

        // Outflow Tile
        const x2 = margin + cardWidth + 3;
        doc.setFillColor(254, 242, 242); // Red 50
        doc.setDrawColor(254, 202, 202); // Red 200
        doc.roundedRect(x2, yPos, cardWidth, cardHeight, 2, 2, 'FD');

        doc.setTextColor(153, 27, 27); // Red 800
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(7);
        doc.text('TOTAL AMOUNT OUT', x2 + 4, yPos + 5);
        doc.setFontSize(11);
        doc.setTextColor(220, 38, 38);
        doc.text(`-${fmt(stats.expense)}`, x2 + 4, yPos + 13);

        // Net Cash Flow Tile
        const x3 = x2 + cardWidth + 3;
        const isPositive = stats.net >= 0;
        doc.setFillColor(isPositive ? 209 : 254, isPositive ? 250 : 226, isPositive ? 229 : 226);
        doc.setDrawColor(isPositive ? 110 : 252, isPositive ? 231 : 165, isPositive ? 183 : 165);
        doc.roundedRect(x3, yPos, cardWidth, cardHeight, 2, 2, 'FD');

        doc.setTextColor(isPositive ? 6 : 153, isPositive ? 78 : 27, isPositive ? 59 : 27);
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(7);
        doc.text('NET CASH FLOW', x3 + 4, yPos + 5);
        doc.setFontSize(11);
        doc.text(`${isPositive ? '+' : ''}${fmt(stats.net)}`, x3 + 4, yPos + 13);

        yPos += cardHeight + 8;
      }

      // --- 4. CATEGORY BREAKDOWN SUMMARY TABLE (If enabled & expenses exist) ---
      if (includeCategoryBreakdown && categoryBreakdown.length > 0) {
        doc.setTextColor(15, 23, 42);
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(9);
        doc.text('Expense Category Breakdown Audit', margin, yPos);
        yPos += 3;

        const breakdownRows = categoryBreakdown.slice(0, 8).map(c => [
          c.name,
          fmt(c.value),
          `${c.percentage}%`
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Category Name', 'Total Amount Spent', 'Expense Share']],
          body: breakdownRows,
          margin: { left: margin, right: margin },
          theme: 'grid',
          styles: {
            font: fontFamily
          },
          headStyles: {
            fillColor: [15, 23, 42],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8,
            cellPadding: 2,
            font: fontFamily
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [30, 41, 59],
            cellPadding: 2,
            font: fontFamily
          },
          columnStyles: {
            0: { fontStyle: 'bold' },
            1: { halign: 'right', fontStyle: 'bold', textColor: [220, 38, 38] },
            2: { halign: 'right' }
          }
        });

        yPos = (doc as any).lastAutoTable.finalY + 8;
      }

      // --- 5. DETAILED AUDITED TRANSACTIONS TABLE ---
      doc.setTextColor(15, 23, 42);
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(10);
      doc.text('Audited Ledger Register', margin, yPos);
      yPos += 3;

      const tableData = filteredTransactions.map((t, idx) => {
        const acc = accounts.find(a => a.id === t.account)?.name || 'Default Book';
        const isInc = t.type === 'income';
        const amtStr = `${isInc ? '+' : '-'}${fmt(t.amount)}`;
        return [
          (idx + 1).toString(),
          t.date,
          t.type.toUpperCase(),
          t.category || 'General',
          t.description || '-',
          acc,
          amtStr
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Date', 'Type', 'Category', 'Description', 'Book / Account', 'Amount']],
        body: tableData,
        margin: { left: margin, right: margin },
        theme: 'striped',
        styles: {
          font: fontFamily
        },
        headStyles: {
          fillColor: [5, 150, 105], // App Emerald Primary
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          cellPadding: 2.5,
          font: fontFamily
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [30, 41, 59],
          cellPadding: 2,
          font: fontFamily
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 20 },
          2: { cellWidth: 16, fontStyle: 'bold', halign: 'center' },
          3: { cellWidth: 28 },
          4: { cellWidth: 'auto' },
          5: { cellWidth: 28 },
          6: { cellWidth: 26, halign: 'right', fontStyle: 'bold' }
        },
        didParseCell: (data) => {
          // Color amount cell according to Income (+) or Expense (-)
          if (data.section === 'body' && data.column.index === 6) {
            const text = data.cell.text[0] || '';
            if (text.startsWith('+')) {
              data.cell.styles.textColor = [16, 185, 129]; // Emerald 600
            } else {
              data.cell.styles.textColor = [220, 38, 38]; // Red 600
            }
          }
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;

      // --- 6. REMARKS / NOTES SECTION ---
      if (reportNotes && yPos < doc.internal.pageSize.getHeight() - 25) {
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 14, 2, 2, 'F');
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text('AUDIT NOTES & CERTIFICATION:', margin + 4, yPos + 5);
        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(7);
        doc.text(doc.splitTextToSize(reportNotes, pageWidth - (margin * 2) - 8), margin + 4, yPos + 9);
      }

      // --- 7. FOOTER PAGE NUMBERS & WATERMARK ---
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);

        // Footer line
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, doc.internal.pageSize.getHeight() - 10, pageWidth - margin, doc.internal.pageSize.getHeight() - 10);

        doc.text('Simzy Financial Audit & Cash Book Register - Confidential', margin, doc.internal.pageSize.getHeight() - 6);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 6, { align: 'right' });
      }

      // Save document
      const filename = `Simzy-Audit-Report-${selectedAccount}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      onClose();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-md overflow-hidden">
      <div className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 p-4 sm:p-5 text-white flex justify-between items-center relative flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 flex-shrink-0">
              <FileText className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">Export Custom Audit PDF</h2>
              <p className="text-xs text-emerald-100 opacity-90">Customize report parameters, scope & visual formatting before downloading</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-5 flex-1 overflow-y-auto custom-scrollbar">

          {/* Section 1: Book & Period Adjustments */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <SlidersHorizontal size={14} />
              1. Scope & Period Adjustments
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Account / Book Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <BookOpen size={14} className="text-emerald-500" />
                  Account / Cash Book
                </label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 cursor-pointer focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">All Books / Accounts ({accounts.length})</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance, currency, 0)})</option>
                  ))}
                </select>
              </div>

              {/* Timeframe Preset */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar size={14} className="text-emerald-500" />
                  Time Period Range
                </label>
                <select
                  value={periodPreset}
                  onChange={(e) => setPeriodPreset(e.target.value)}
                  className="w-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 cursor-pointer focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">All Available Records</option>
                  <option value="today">Today Only</option>
                  <option value="weekly">This Past Week (7 Days)</option>
                  <option value="monthly">This Month Register</option>
                  <option value="yearly">This Current Year</option>
                  <option value="custom">Custom Date Range...</option>
                </select>
              </div>
            </div>

            {/* Custom Date Range Pickers if selected */}
            {periodPreset === 'custom' && (
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200 dark:border-slate-700/60">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-medium"
                  />
                </div>
              </div>
            )}

            {/* Filters Row: Type & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Type Scope */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Filter size={14} className="text-emerald-500" />
                  Transaction Types
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl">
                  {(['all', 'income', 'expense'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTypeFilter(t)}
                      className={`py-1.5 text-[11px] font-bold rounded-lg capitalize transition-all ${
                        typeFilter === t
                          ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Layers size={14} className="text-emerald-500" />
                  Category Scope
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 cursor-pointer focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">All Categories</option>
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: PDF Report Styling & Header Customization */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={14} />
              2. Report Styling & PDF Customization
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Report Document Title
                </label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Auditor / Prepared By Name
                </label>
                <input
                  type="text"
                  value={auditorName}
                  onChange={(e) => setAuditorName(e.target.value)}
                  className="w-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Audit Certification Notes / Remarks
              </label>
              <textarea
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                rows={2}
                className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Layout Toggles */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSummaryCards}
                  onChange={(e) => setIncludeSummaryCards(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                Include Executive KPI Cards
              </label>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCategoryBreakdown}
                  onChange={(e) => setIncludeCategoryBreakdown(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                Include Expense Category Breakdown Table
              </label>
            </div>
          </div>

          {/* Section 3: Live Output Summary Preview Box */}
          <div className="bg-emerald-50/80 dark:bg-slate-900 border border-emerald-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5 justify-center sm:justify-start">
                <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                Live PDF Export Audit Summary
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                {stats.count} transaction records matched for <span className="font-bold text-slate-800 dark:text-slate-200">{accountNameDisplay}</span> ({periodPreset})
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-black">
              <div className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800/60">
                In: +{formatCurrency(stats.income, currency, 0)}
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-300/60 dark:border-red-800/60">
                Out: -{formatCurrency(stats.expense, currency, 0)}
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGeneratePDF}
            disabled={stats.count === 0 || isGenerating}
            className="px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating Audit PDF...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Download Custom Audit PDF</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
