import React, { useEffect, useMemo, useState } from 'react';
import { RESIDENCES } from './data/residences';
import { TRANSLATIONS } from './data/translations';
import type {
  Currency,
  DepositHoldRecord,
  Language,
  MortgageInputs,
  Residence,
  ThemeMode,
  VipPassRecord,
} from './types/proptech';
import { computeResidenceMonthlyMaintenance } from './engines/residenceEngine';
import {
  analyzeMortgageAndRoi,
  computeInterestRateStressTest,
} from './engines/mortgageEngine';
import {
  loadDepositHolds,
  loadShortlistIds,
  loadVipPasses,
  saveDepositHolds,
  saveShortlistIds,
  saveVipPasses,
  upsertVipPass,
} from './engines/vaultStorageEngine';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ResidenceExplorer } from './components/ResidenceExplorer';
import { MortgageSimulator } from './components/MortgageSimulator';
import { ComparisonDrawer } from './components/ComparisonDrawer';
import { ViewingSchedulerModal } from './components/ViewingSchedulerModal';
import { VipVaultDrawer } from './components/VipVaultDrawer';
import { ReservationDepositModal } from './components/ReservationDepositModal';
import { PrintableDossier } from './components/PrintableDossier';
import { Footer } from './components/Footer';

const INITIAL_RESIDENCE = RESIDENCES[10]; // K-40P Obsidian Sky Penthouse (Available, Floor 40)
const VALID_RESIDENCE_IDS = RESIDENCES.map((r) => r.id);

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
  const [theme, setTheme] = useState<ThemeMode>('light');

  const [selectedResidence, setSelectedResidence] = useState<Residence>(INITIAL_RESIDENCE);
  const [compareIds, setCompareIds] = useState<string[]>(['knx-28a', 'knx-40p']);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Persistent VIP Shortlist, Private Viewing Passes & Deposit Holds (localStorage)
  const [shortlistIds, setShortlistIds] = useState<string[]>(() =>
    loadShortlistIds(VALID_RESIDENCE_IDS)
  );
  const [vipPasses, setVipPasses] = useState<VipPassRecord[]>(() => loadVipPasses());
  const [depositHolds, setDepositHolds] = useState<DepositHoldRecord[]>(() => loadDepositHolds());

  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [vaultTab, setVaultTab] = useState<'shortlist' | 'passes'>('shortlist');

  // Mortgage Simulator + Floating-Rate Stress Test + DTI Underwriting
  const [isCustomSimMode, setIsCustomSimMode] = useState(false);
  const [simInputs, setSimInputs] = useState<MortgageInputs>(() =>
    createInputsFromResidence(INITIAL_RESIDENCE)
  );
  const [rateShockPct, setRateShockPct] = useState<number>(2);
  const [monthlyIncomeVnd, setMonthlyIncomeVnd] = useState<number>(950_000_000);

  // Private Viewing Scheduler & Techcombank VietQR Deposit Hold Modal
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [schedulerUnit, setSchedulerUnit] = useState<Residence>(INITIAL_RESIDENCE);

  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositUnit, setDepositUnit] = useState<Residence>(INITIAL_RESIDENCE);
  const [depositLinkedPassCode, setDepositLinkedPassCode] = useState<string | undefined>(undefined);

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

  // Persist Shortlist, VIP Passes & Deposit Holds to localStorage
  useEffect(() => {
    saveShortlistIds(shortlistIds);
  }, [shortlistIds]);

  useEffect(() => {
    saveVipPasses(vipPasses);
  }, [vipPasses]);

  useEffect(() => {
    saveDepositHolds(depositHolds);
  }, [depositHolds]);

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

  const analysis = useMemo(() => analyzeMortgageAndRoi(simInputs), [simInputs]);

  const stressSummary = useMemo(
    () => computeInterestRateStressTest(simInputs, rateShockPct, monthlyIncomeVnd),
    [simInputs, rateShockPct, monthlyIncomeVnd]
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

  const handleToggleShortlist = (unitId: string) => {
    setShortlistIds((prev) =>
      prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [unitId, ...prev]
    );
  };

  const handlePassIssued = (pass: VipPassRecord) => {
    setVipPasses((prev) => upsertVipPass(prev, pass));
  };

  const handleSaveHoldRecord = (record: DepositHoldRecord) => {
    setDepositHolds((prev) => [
      record,
      ...prev.filter((item) => item.holdId !== record.holdId),
    ]);
  };

  const handleBookViewing = (unit: Residence) => {
    setSchedulerUnit(unit);
    setIsSchedulerOpen(true);
  };

  const handleOpenDeposit = (unit: Residence, passCode?: string) => {
    setDepositUnit(unit);
    setDepositLinkedPassCode(passCode);
    setIsDepositOpen(true);
  };

  const handleOpenVault = (tab: 'shortlist' | 'passes' = 'shortlist') => {
    setVaultTab(tab);
    setIsVaultOpen(true);
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

  const handlePrintDossier = () => {
    window.print();
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
        vaultCount={shortlistIds.length + vipPasses.length}
        onOpenCompare={() => setIsCompareOpen(true)}
        onOpenVault={() => handleOpenVault(vipPasses.length > 0 && shortlistIds.length === 0 ? 'passes' : 'shortlist')}
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
          shortlistIds={shortlistIds}
          onToggleShortlist={handleToggleShortlist}
          onBookViewing={handleBookViewing}
          onOpenDeposit={(unit) => handleOpenDeposit(unit)}
          onSimulateResidence={handleSimulateResidence}
          onPrintDossier={handlePrintDossier}
          currency={currency}
          lang={lang}
          copy={copy.explorer}
        />

        <MortgageSimulator
          selectedResidence={selectedResidence}
          inputs={simInputs}
          onChangeInputs={setSimInputs}
          analysis={analysis}
          stressSummary={stressSummary}
          rateShockPct={rateShockPct}
          onChangeRateShock={setRateShockPct}
          monthlyIncomeVnd={monthlyIncomeVnd}
          onChangeMonthlyIncome={setMonthlyIncomeVnd}
          isCustomMode={isCustomSimMode}
          onToggleMode={handleToggleSimMode}
          onPrintDossier={handlePrintDossier}
          currency={currency}
          lang={lang}
          copy={copy.simulator}
        />

        {/* Formal Printable A4 Investment Dossier (@media print) */}
        <PrintableDossier
          residence={isCustomSimMode ? null : selectedResidence}
          inputs={simInputs}
          analysis={analysis}
          stressSummary={stressSummary}
          currency={currency}
          lang={lang}
          copy={copy.print}
          simCopy={copy.simulator}
          explorerCopy={copy.explorer}
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
        onPassIssued={handlePassIssued}
        onOpenVault={() => handleOpenVault('passes')}
        onOpenDeposit={(unit, passCode) => handleOpenDeposit(unit, passCode)}
        lang={lang}
        copy={copy.scheduler}
      />

      <VipVaultDrawer
        isOpen={isVaultOpen}
        initialTab={vaultTab}
        onClose={() => setIsVaultOpen(false)}
        residences={RESIDENCES}
        shortlistIds={shortlistIds}
        vipPasses={vipPasses}
        depositHolds={depositHolds}
        onRemoveShortlist={(id) => setShortlistIds((prev) => prev.filter((item) => item !== id))}
        onRemovePass={(code) => setVipPasses((prev) => prev.filter((p) => p.passCode !== code))}
        onInspectUnit={(unit) => {
          setSelectedResidence(unit);
          document.getElementById('tower-explorer')?.scrollIntoView({ behavior: 'smooth' });
        }}
        onSimulateUnit={handleSimulateResidence}
        onBookUnit={handleBookViewing}
        onOpenDeposit={(unit, passCode) => handleOpenDeposit(unit, passCode)}
        currency={currency}
        lang={lang}
        copy={copy.vault}
        schedulerCopy={copy.scheduler}
      />

      <ReservationDepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        residence={depositUnit}
        linkedPassCode={depositLinkedPassCode}
        currency={currency}
        lang={lang}
        copy={copy.deposit}
        onSaveHoldRecord={handleSaveHoldRecord}
      />
    </div>
  );
};

export default App;
