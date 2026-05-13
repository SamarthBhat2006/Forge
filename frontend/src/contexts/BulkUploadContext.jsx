import { createContext, useContext, useState } from 'react';

const BulkUploadContext = createContext(null);

export function BulkUploadProvider({ children }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState(null);

  const [aiResult, setAiResult] = useState(null);
  const [manualConfig, setManualConfig] = useState({
    startDate: new Date().toISOString().split('T')[0],
    daysOfWeek: ['Monday', 'Wednesday', 'Friday'],
    useAiDates: true,
  });

  const [preparedData, setPreparedData] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const resetUpload = () => {
    setStep(1);
    setFile(null);
    setRawData(null);
    setSelectedSheet(null);
    setAiResult(null);
    setManualConfig({
      startDate: new Date().toISOString().split('T')[0],
      daysOfWeek: ['Monday', 'Wednesday', 'Friday'],
      useAiDates: true,
    });
    setPreparedData(null);
    setConflicts([]);
    setError(null);
  };

  return (
    <BulkUploadContext.Provider
      value={{
        step, setStep,
        file, setFile,
        rawData, setRawData,
        selectedSheet, setSelectedSheet,
        aiResult, setAiResult,
        manualConfig, setManualConfig,
        preparedData, setPreparedData,
        conflicts, setConflicts,
        loading, setLoading,
        error, setError,
        resetUpload,
      }}
    >
      {children}
    </BulkUploadContext.Provider>
  );
}

export function useBulkUpload() {
  const ctx = useContext(BulkUploadContext);
  if (!ctx) throw new Error('useBulkUpload must be used inside BulkUploadProvider');
  return ctx;
}
