import React, { useEffect, useMemo, useState } from 'react';
import { RESIDENCES } from './data/residences';
import { TRANSLATIONS } from './data/translations';
import type { Currency, Language, MortgageInputs, Residence, ThemeMode } from './types/proptech';
import { computeResidenceMonthlyMaintenance } from './engines/residenceEngine';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ResidenceExplorer } from './components/ResidenceExplorer';
import { MortgageSimulator } from './components/MortgageSimulator';
import { ComparisonDrawer } from './components/ComparisonDrawer';
import { ViewingSchedulerModal } from './components/ViewingSchedulerModal';
import { Footer } from './components/Footer';

const INITIAL_RESIDENCE = RESIDENCES[10]; // K-40P Obsidian Sky Penthouse (Available, Floor 40)

function createInputsFromResidence(unit: Residence, prev?: MortgageInputs): MortgageInputs {
  return {
    propertyPriceVnd: unit.priceVnd,
    downPaymentPct: prev?.downPaymentPct ?? 30,
    loanTermYears: prev?.loanTermYears ?? 20,
    annualInterestRatePct: prev?.annualInterestRatePct ?? 7.2,
    estimatedMonthlyRentVnd: unit.estMonthlyRentVnd,
    monthlyMaintenanceFeeVnd: computeResidenceMonthlyMaintenance(unit),
    annualAppreciationPct: prev?.annualAppreciationPct ?? 6.0,
  };
}

export const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('vi');
  const [currency, setCurrency] = useState<Currency>('VND');
  const [theme, setTheme] = useState<ThemeMode>('dark');

  const [selectedResidence, setSelectedResidence] = useState<Residence>(INITIAL_RESIDENCE);
  const [compareIds, setCompareIds] = useState<string[]>(['knx-28a', 'knx-40p']);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const [isCustomSimMode, setIsCustomSimMode] = useState(false);
  const [simInputs, setSimInputs] = useState<MortgageInputs>(() =>
    createInputsFromResidence(INITIAL_RESIDENCE)
  );

  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [schedulerUnit, setSchedulerUnit] = useState<Residence>(INITIAL_RESIDENCE);

  // Sync HTML theme class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
  }, [theme]);

  // Keep simulator synced when user picks a residence (unless explicitly in custom mode)
  useEffect(() => {
    if (!isCustomSimMode) {
      setSimInputs((prev) => createInputsFromResidence(selectedResidence, prev));
    }
  }, [selectedResidence, isCustomSimMode]);

  const copy = TRANSLATIONS[lang];

  const availableCount = useMemo(
    () => RESIDENCES.filter((r) => r.status === 'AVAILABLE').length,
    []
  );

  const compareResidences = useMemo(
    () =>
      compareIds
        .map((id) => RESIDENCES.find((r) => r.id === id))
        .filter((r): r is Residence => Boolean(r)),
    [compareIds]
  );

  const handleToggleCompare = (unitId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(unitId)) {
        return prev.filter((id) => id !== unitId);
      }
      if (prev.length >= 3) return prev;
      return [...prev, unitId];
    });
  };

  const handleBookViewing = (unit: Residence) => {
    setSchedulerUnit(unit);
    setIsSchedulerOpen(true);
  };

  const handleSimulateResidence = (unit: Residence) => {
    setSelectedResidence(unit);
    setIsCustomSimMode(false);
    setSimInputs((prev) => createInputsFromResidence(unit, prev));
    document.getElementById('mortgage-simulator')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleToggleSimMode = (custom: boolean) => {
    setIsCustomSimMode(custom);
    if (!custom) {
      setSimInputs((prev) => createInputsFromResidence(selectedResidence, prev));
    }
  };

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Header
        lang={lang}
        setLang={setLang}
        currency={currency}
        setCurrency={setCurrency}
        theme={theme}
        toggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        compareCount={compareIds.length}
        onOpenCompare={() => setIsCompareOpen(true)}
        onOpenScheduler={() => handleBookViewing(selectedResidence)}
        copy={copy.nav}
      />

      <main>
        <HeroSection
          copy={copy.hero}
          availableCount={availableCount}
          totalCount={RESIDENCES.length}
          onOpenScheduler={() => handleBookViewing(selectedResidence)}
        />

        <ResidenceExplorer
          residences={RESIDENCES}
          selectedResidence={selectedResidence}
          onSelectResidence={setSelectedResidence}
          compareIds={compareIds}
          onToggleCompare={handleToggleCompare}
          onBookViewing={handleBookViewing}
          onSimulateResidence={handleSimulateResidence}
          currency={currency}
          lang={lang}
          copy={copy.explorer}
        />

        <MortgageSimulator
          selectedResidence={selectedResidence}
          inputs={simInputs}
          onChangeInputs={setSimInputs}
          isCustomMode={isCustomSimMode}
          onToggleMode={handleToggleSimMode}
          currency={currency}
          lang={lang}
          copy={copy.simulator}
        />
      </main>

      <Footer copy={copy.footer} />

      <ComparisonDrawer
        residences={compareResidences}
        isOpen={isCompareOpen}
        onOpen={() => setIsCompareOpen(true)}
        onClose={() => setIsCompareOpen(false)}
        onRemove={(id) => setCompareIds((prev) => prev.filter((item) => item !== id))}
        onClearAll={() => setCompareIds([])}
        onInspect={(unit) => {
          setSelectedResidence(unit);
          document.getElementById('tower-explorer')?.scrollIntoView({ behavior: 'smooth' });
        }}
        onBook={handleBookViewing}
        mortgageAssumptions={{
          downPaymentPct: simInputs.downPaymentPct,
          loanTermYears: simInputs.loanTermYears,
          annualInterestRatePct: simInputs.annualInterestRatePct,
        }}
        currency={currency}
        lang={lang}
        copy={copy.compare}
        explorerCopy={copy.explorer}
      />

      <ViewingSchedulerModal
        isOpen={isSchedulerOpen}
        onClose={() => setIsSchedulerOpen(false)}
        residences={RESIDENCES}
        initialResidence={schedulerUnit}
        lang={lang}
        copy={copy.scheduler}
      />
    </div>
  );
};

export default App;
