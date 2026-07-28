import { createContext, useContext, useState, type ReactNode } from 'react';
import type { ReportData, UserPreferences, WeightSettings } from './types';
import { MOCK_COMPANIES } from './mockData';

interface AppState {
  currentCompany: string | null;
  reportData: ReportData | null;
  searchedCompanies: ReportData[];
  userPreferences: UserPreferences;
  weightSettings: WeightSettings;
  apiKey: string;
  setReportData: (data: ReportData | null) => void;
  setCurrentCompany: (name: string | null) => void;
  addSearchedCompany: (report: ReportData) => void;
  setUserPreferences: (prefs: UserPreferences) => void;
  setWeightSettings: (weights: WeightSettings) => void;
  setApiKey: (key: string) => void;
}

const defaultPrefs: UserPreferences = { expectedSalary: '30-50万', overtimeTolerance: '适度(月均10-20h)' };
const defaultWeights: WeightSettings = { salary: 30, intensity: 25, culture: 20, growth: 25 };

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentCompany, setCurrentCompany] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [searchedCompanies, setSearchedCompanies] = useState<ReportData[]>(MOCK_COMPANIES);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(() => {
    try {
      const s = localStorage.getItem('userPreferences');
      if (!s) return defaultPrefs;
      const parsed = JSON.parse(s);
      const { expectedIndustry: _removed, ...rest } = parsed;
      return { ...defaultPrefs, ...rest };
    } catch { return defaultPrefs; }
  });
  const [weightSettings, setWeightSettings] = useState<WeightSettings>(() => {
    try { const s = localStorage.getItem('weightSettings'); return s ? JSON.parse(s) : defaultWeights; } catch { return defaultWeights; }
  });
  const [apiKey, setApiKeyState] = useState<string>(() => {
    try { return localStorage.getItem('apiKey') || ''; } catch { return ''; }
  });

  const handleSetPrefs = (prefs: UserPreferences) => { setUserPreferences(prefs); localStorage.setItem('userPreferences', JSON.stringify(prefs)); };
  const handleSetWeights = (weights: WeightSettings) => { setWeightSettings(weights); localStorage.setItem('weightSettings', JSON.stringify(weights)); };
  const setApiKey = (key: string) => { setApiKeyState(key); localStorage.setItem('apiKey', key); };
  const addSearchedCompany = (report: ReportData) => {
    setSearchedCompanies((prev) => prev.find((c) => c.companyName === report.companyName) ? prev : [...prev, report]);
  };

  return (
    <AppContext.Provider value={{ currentCompany, reportData, searchedCompanies, userPreferences, weightSettings, apiKey, setReportData, setCurrentCompany, addSearchedCompany, setUserPreferences: handleSetPrefs, setWeightSettings: handleSetWeights, setApiKey }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
