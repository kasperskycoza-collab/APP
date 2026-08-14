import React, { useState } from 'react';
import { X, Bell, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
import { useStore } from '../store';
import { useTranslation } from '../useTranslation';
import { requestNotificationPermission, sendBrowserNotification, isNotificationSupported, getNotificationPermission } from '../notifications';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const { notifications, setNotificationSettings, themePalette } = useStore();
  const { t, language } = useTranslation();
  const [testSent, setTestSent] = useState(false);
  const [permState, setPermState] = useState<string>(getNotificationPermission());

  if (!isOpen) return null;

  const handleRequestPush = async () => {
    const granted = await requestNotificationPermission();
    setPermState(getNotificationPermission());
    setNotificationSettings({ pushEnabled: granted });
  };

  const handleToggle = (key: keyof typeof notifications) => {
    setNotificationSettings({ [key]: !notifications[key] });
  };

  const handleSendTest = () => {
    const title = language === 'sw' ? 'Simzy Akiba na Matumizi 💰' : 'Simzy Expense & Savings 💰';
    const body = language === 'sw' 
      ? 'Taarifa zako za Simzy zinafanya kazi kikamilifu! Endelea kuweka akiba na kufuatilia matumizi.' 
      : 'Your Simzy notifications are enabled and working smoothly. Keep saving towards your goals!';
    
    sendBrowserNotification(title, { body });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3500);
  };

  const isUbuntu = themePalette === 'ubuntu';

  const toggleItems = [
    { 
      id: 'reminders', 
      label: t('dailyReminders'), 
      desc: t('dailyRemindersDesc'), 
      state: notifications?.reminders ?? true 
    },
    { 
      id: 'goalAlerts', 
      label: t('goalAlerts'), 
      desc: t('goalAlertsDesc'), 
      state: notifications?.goalAlerts ?? true 
    },
    { 
      id: 'budgetAlerts', 
      label: t('budgetAlerts'), 
      desc: t('budgetAlertsDesc'), 
      state: notifications?.budgetAlerts ?? true 
    },
    { 
      id: 'weeklySummary', 
      label: t('weeklySummary'), 
      desc: t('weeklySummaryDesc'), 
      state: notifications?.weeklySummary ?? false 
    },
  ];

  return (
    <div className="fixed inset-0 w-screen h-screen bg-slate-950/65 dark:bg-black/75 z-[100] flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 w-full sm:max-w-md rounded-2xl flex flex-col max-h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/80 flex-shrink-0">
          <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isUbuntu ? 'bg-[#E95420]/10 text-[#E95420]' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'}`}>
              <Bell size={18} />
            </div>
            <span>{t('notificationSettingsTitle')}</span>
          </h2>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto custom-scrollbar p-5 flex-1 space-y-4">
          
          {/* Browser Permission Card */}
          {isNotificationSupported() && (
            <div className={`p-4 rounded-xl border flex flex-col gap-3 transition-colors ${
              permState === 'granted'
                ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50'
                : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50'
            }`}>
              <div className="flex items-start gap-3">
                {permState === 'granted' ? (
                  <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" size={20} />
                ) : (
                  <AlertTriangle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" size={20} />
                )}
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    {t('pushNotifications')}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    {permState === 'granted'
                      ? (language === 'sw' ? 'Ruhusa ya taarifa za kifaa imekubaliwa na inafanya kazi.' : 'Browser notification permission is active.')
                      : (language === 'sw' ? 'Bofya hapa chini ili kuruhusu taarifa za mfumo.' : 'Enable system push permissions to receive instant updates.')}
                  </div>
                </div>
              </div>

              {permState !== 'granted' && (
                <button
                  type="button"
                  onClick={handleRequestPush}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold text-white shadow-sm transition-all flex items-center justify-center gap-1.5 ${
                    isUbuntu ? 'bg-[#E95420] hover:bg-[#D14818]' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <Bell size={14} />
                  <span>{language === 'sw' ? 'Ruhusu Taarifa za Kifaa' : 'Enable Device Notifications'}</span>
                </button>
              )}
            </div>
          )}

          {/* Toggle Options */}
          <div className="space-y-2.5">
            {toggleItems.map((item) => (
              <div 
                key={item.id} 
                className="flex justify-between items-center p-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 hover:bg-slate-100/70 dark:hover:bg-slate-900 transition-colors cursor-pointer" 
                onClick={() => handleToggle(item.id as any)}
              >
                <div className="pr-3">
                  <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">{item.label}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{item.desc}</div>
                </div>
                <div className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 ${
                  item.state 
                    ? (isUbuntu ? 'bg-[#E95420]' : 'bg-emerald-500') 
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md absolute top-0.5 left-0.5 transition-transform duration-200 ${item.state ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </div>
              </div>
            ))}
          </div>

          {/* Test Notification Trigger */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSendTest}
              className={`w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                testSent 
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750'
              }`}
            >
              {testSent ? (
                <>
                  <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />
                  <span>{t('testNotificationSent')}</span>
                </>
              ) : (
                <>
                  <Send size={14} className={isUbuntu ? 'text-[#E95420]' : 'text-emerald-600 dark:text-emerald-400'} />
                  <span>{t('sendTestNotification')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-xl text-white font-bold text-sm shadow-sm transition-all ${
              isUbuntu ? 'bg-[#E95420] hover:bg-[#D14818]' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {t('applyAndDone')}
          </button>
        </div>

      </div>
    </div>
  );
}
