import { Upload, FileText, CheckCircle, AlertCircle, Loader2, ChevronRight, ArrowLeft, Calendar, UserCheck, Database, X, Sparkles, BrainCircuit } from 'lucide-react';
import { parseFile, getSampleData } from '../../lib/importUtils';
import { analyzeStructure, suggestDates } from '../../lib/aiAgent';
import { supabase } from '../../lib/supabase';
import { useBulkUpload } from '../../contexts/BulkUploadContext';
import { useAuth } from '../../contexts/AuthContext';

export default function BulkUpload() {
  const { userProfile } = useAuth();
  const {
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
  } = useBulkUpload();

  // --- Step 1: File Upload ---
  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setLoading(true);
    setError(null);
    try {
      const parsed = await parseFile(uploadedFile);
      setFile(uploadedFile);
      setRawData(parsed);

      if (parsed.type === 'xlsx' && Object.keys(parsed.sheets).length > 1) {
        setStep(2);
      } else {
        const sheetName = parsed.type === 'xlsx' ? Object.keys(parsed.sheets)[0] : 'csv';
        setSelectedSheet(sheetName);
        startAnalysis(parsed.type === 'xlsx' ? parsed.sheets[sheetName] : parsed.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Step 3: AI Analysis ---
  const startAnalysis = async (rows) => {
    setStep(3);
    setLoading(true);
    try {
      const sample = getSampleData(rows);
      const result = await analyzeStructure(sample.headers, sample.sample);
      setAiResult(result);
      setStep(4);
    } catch (err) {
      setError(err.message);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  // --- Step 5: Data Preparation & Conflict Check ---
  const prepareFinalData = async () => {
    setLoading(true);
    try {
      const rows = rawData.type === 'xlsx' ? rawData.sheets[selectedSheet] : rawData.data;
      const dataRows = rows.slice(1);

      let finalSessions = [...aiResult.sessionColumns];

      if (finalSessions.some(s => !s.detectedDate)) {
        const suggested = await suggestDates(finalSessions, manualConfig.startDate, manualConfig.daysOfWeek);
        finalSessions = finalSessions.map((s, i) => ({
          ...s,
          detectedDate: s.detectedDate || suggested[i],
        }));
      }

      const sessionDates = finalSessions.map(s => s.detectedDate);
      const { data: existingSessions } = await supabase
        .from('sessions')
        .select('date, topic')
        .in('date', sessionDates);

      setConflicts(existingSessions || []);

      const studentsToImport = dataRows.map(row => ({
        usn: row[aiResult.usnIndex],
        name: row[aiResult.nameIndex],
        attendance: finalSessions.map(session => ({
          date: session.detectedDate,
          present: aiResult.markerMapping.present.includes(String(row[session.index])),
        })),
      })).filter(s => s.usn && s.name);

      setPreparedData({ sessions: finalSessions, students: studentsToImport });
      setStep(5);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Step 6: Save to DB ---
  const handleSave = async () => {
    if (userProfile?.is_bypass) {
      setError("Your account profile is missing in the database. Please run the setup_auth_sync.sql script in your Supabase SQL editor to fix this, otherwise the database will reject your import.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const sessionIdMap = {};

      for (const session of preparedData.sessions) {
        const { data: sData, error: sErr } = await supabase
          .from('sessions')
          .upsert({
            date: session.detectedDate,
            topic: `Imported: ${session.header || 'Bulk Session'}`,
            month_number: new Date(session.detectedDate).getMonth() + 1,
          }, { onConflict: 'date' })
          .select()
          .single();
        if (sErr) throw new Error(`Session save failed for ${session.detectedDate}: ${sErr.message}`);
        sessionIdMap[session.detectedDate] = sData.id;
      }

      const usns = preparedData.students.map(s => s.usn);
      const { data: existingStudents, error: fetchErr } = await supabase
        .from('students')
        .select('id, usn')
        .in('usn', usns);

      if (fetchErr) throw new Error(`Failed to fetch students: ${fetchErr.message}`);

      const studentMap = {};
      (existingStudents || []).forEach(s => (studentMap[s.usn] = s.id));

      for (const student of preparedData.students) {
        if (!studentMap[student.usn]) {
          const { data: nData, error: nErr } = await supabase
            .from('students')
            .insert({ name: student.name, usn: student.usn, branch_code: 'UNK' })
            .select()
            .single();
          if (nErr) throw new Error(`Failed to create student ${student.usn}: ${nErr.message}`);
          studentMap[student.usn] = nData.id;
        }

        const attendanceData = student.attendance
          .filter(a => sessionIdMap[a.date])
          .map(a => ({
            student_id: studentMap[student.usn],
            session_id: sessionIdMap[a.date],
            present: a.present,
          }));

        if (attendanceData.length > 0) {
          const { error: attErr } = await supabase
            .from('attendance')
            .upsert(attendanceData, { onConflict: 'student_id,session_id' });
          if (attErr) throw new Error(`Attendance save failed for ${student.usn}: ${attErr.message}`);
        }
      }

      setStep(6);
    } catch (err) {
      console.error('Import failed:', err);
      setError(err.message || 'An unknown error occurred during import.');
    } finally {
      setLoading(false);
    }
  };

  const ProgressSteps = () => (
    <div className="flex items-center justify-center gap-4 mb-12">
      {[1, 2, 3, 4, 5].map((s) => (
        <div key={s} className="flex items-center gap-4">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold transition-all duration-500 border-2 ${
            step >= s ? 'bg-accent-glow border-accent-glow text-white shadow-glow' : 'bg-white/5 border-white/10 text-tertiary'
          }`}>
            {step > s ? <CheckCircle className="h-5 w-5" /> : s}
          </div>
          {s < 5 && <div className={`w-12 h-0.5 rounded-full ${step > s ? 'bg-accent-glow' : 'bg-white/10'}`}></div>}
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-glow/10 border border-accent-glow/20 text-accent-glow text-[10px] font-bold uppercase tracking-widest mb-4">
          <BrainCircuit className="h-3 w-3" /> AI-Powered Import
        </div>
        <h1 className="text-4xl font-display font-bold text-primary tracking-tight">Bulk Attendance Upload</h1>
        <p className="text-secondary mt-3 max-w-xl mx-auto">
          Upload your class spreadsheet and let our AI agent handle the mapping and validation automatically.
        </p>
      </div>

      <ProgressSteps />

      {userProfile?.is_bypass && (
        <div className="mb-8 p-5 glass-card border-warning/30 bg-warning/5 flex items-center gap-4 text-warning-fg animate-in slide-in-from-top-2">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <div className="text-sm">
            <p className="font-bold">Database Sync Required</p>
            <p className="opacity-80 mt-0.5">Your profile isn't fully registered in the database. Run the SQL sync script to enable imports.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-8 p-5 glass-card border-danger/30 bg-danger/5 flex items-center gap-4 text-danger-fg animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <div className="flex-1">
             <p className="text-sm font-bold">Process Error</p>
             <p className="text-xs opacity-80 mt-0.5">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="p-2 hover:bg-danger/10 rounded-lg transition-all"><X className="h-5 w-5" /></button>
        </div>
      )}

      {/* --- Step 1: Upload --- */}
      {step === 1 && (
        <div className="glass-card p-16 flex flex-col items-center justify-center border-dashed border-2 border-white/10 hover:border-accent-glow/50 transition-all group cursor-pointer bg-white/[0.02]">
          <div className="h-24 w-24 bg-accent-glow/5 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform group-hover:rotate-6 shadow-glow">
            <Upload className="h-12 w-12 text-accent-glow" />
          </div>
          <h3 className="text-2xl font-display font-bold text-primary mb-3">Drop your spreadsheet here</h3>
          <p className="text-secondary mb-10 text-center max-w-md">
            Support for Excel (.xlsx) and CSV files. Our AI will automatically identify USNs, names, and session columns.
          </p>
          <label className="btn-premium px-10 h-14 flex items-center gap-3 cursor-pointer shadow-glow">
            <FileText className="h-5 w-5" />
            <span className="text-lg">Select File</span>
            <input type="file" className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} />
          </label>
        </div>
      )}

      {/* --- Step 2: Sheet Selection --- */}
      {step === 2 && (
        <div className="glass-card p-8 animate-in fade-in zoom-in-95">
          <h3 className="text-2xl font-display font-bold text-primary mb-8 flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-accent-glow" />
            Multiple Sheets Detected
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.keys(rawData.sheets).map(name => (
              <button
                key={name}
                onClick={() => {
                  setSelectedSheet(name);
                  startAnalysis(rawData.sheets[name]);
                }}
                className="p-6 glass-card border-white/5 hover:border-accent-glow/50 bg-white/[0.02] hover:bg-white/[0.05] text-left transition-all group"
              >
                <div className="text-primary font-bold text-lg mb-1 group-hover:text-accent-glow transition-colors">{name}</div>
                <div className="text-tertiary text-sm font-medium">{rawData.sheets[name].length} records found</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --- Step 3: Analysis --- */}
      {step === 3 && (
        <div className="glass-card p-24 flex flex-col items-center justify-center">
          <div className="relative mb-10">
            <div className="absolute inset-0 bg-accent-glow/20 blur-3xl rounded-full animate-pulse"></div>
            <BrainCircuit className="h-20 w-20 text-accent-glow relative animate-bounce" />
          </div>
          <h3 className="text-2xl font-display font-bold text-primary mb-3">AI Agent is Thinking...</h3>
          <p className="text-secondary text-center max-w-sm">
            Identifying USNs, names, and date structures in your file. This usually takes 5-10 seconds.
          </p>
        </div>
      )}

      {/* --- Step 4: Configuration --- */}
      {step === 4 && aiResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-right-10">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="glass-card p-8 border-success/20 bg-success/[0.02]">
              <h4 className="text-[10px] text-success font-black mb-6 flex items-center gap-2 uppercase tracking-[0.2em]">
                <Sparkles className="h-4 w-4" /> AI Mappings Confirmed
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-5 bg-white/[0.03] rounded-2xl border border-white/5">
                  <div className="text-[10px] text-tertiary uppercase font-bold tracking-widest mb-2">Student USN Column</div>
                  <div className="text-lg text-primary font-bold">{rawData.type === 'xlsx' ? rawData.sheets[selectedSheet][0][aiResult.usnIndex] : rawData.data[0][aiResult.usnIndex]}</div>
                </div>
                <div className="p-5 bg-white/[0.03] rounded-2xl border border-white/5">
                  <div className="text-[10px] text-tertiary uppercase font-bold tracking-widest mb-2">Student Name Column</div>
                  <div className="text-lg text-primary font-bold">{rawData.type === 'xlsx' ? rawData.sheets[selectedSheet][0][aiResult.nameIndex] : rawData.data[0][aiResult.nameIndex]}</div>
                </div>
              </div>
            </div>

            <div className="glass-card p-0 overflow-hidden">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                 <h4 className="text-[10px] text-primary font-black uppercase tracking-[0.2em] flex items-center gap-2">
                   <Calendar className="h-4 w-4 text-accent-glow" /> Detected Sessions ({aiResult.sessionColumns.length})
                 </h4>
              </div>
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white/[0.02] sticky top-0 z-10">
                    <tr>
                      <th className="p-4 text-[10px] font-bold text-tertiary uppercase tracking-widest">Index</th>
                      <th className="p-4 text-[10px] font-bold text-tertiary uppercase tracking-widest">Header</th>
                      <th className="p-4 text-[10px] font-bold text-tertiary uppercase tracking-widest">Inferred Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {aiResult.sessionColumns.map(col => (
                      <tr key={col.index} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 text-xs font-mono text-tertiary">#{(col.index + 1).toString().padStart(2, '0')}</td>
                        <td className="p-4 text-sm text-primary font-semibold">{col.header || <span className="italic text-tertiary">Untitled</span>}</td>
                        <td className="p-4 text-sm">
                          {col.detectedDate ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success font-bold text-[10px] border border-success/20 uppercase tracking-widest">
                              {col.detectedDate}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning/10 text-warning font-bold text-[10px] border border-warning/20 uppercase tracking-widest">
                              Inference Required
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="glass-card p-8 border-accent-glow/20 bg-accent-glow/[0.02]">
              <h4 className="text-[10px] text-primary font-black mb-6 uppercase tracking-[0.2em]">Date Inference Logic</h4>
              <p className="text-xs text-secondary mb-8 leading-relaxed">For columns without clear dates, we'll use your class schedule to generate them chronologically.</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-tertiary mb-3 uppercase tracking-widest">Start Date</label>
                  <input
                    type="date"
                    className="input-premium w-full text-sm"
                    value={manualConfig.startDate}
                    onChange={e => setManualConfig({ ...manualConfig, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-tertiary mb-3 uppercase tracking-widest">Schedule Days</label>
                  <div className="flex flex-wrap gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <button
                        key={day}
                        onClick={() => {
                          const newDays = manualConfig.daysOfWeek.includes(day)
                            ? manualConfig.daysOfWeek.filter(d => d !== day)
                            : [...manualConfig.daysOfWeek, day];
                          setManualConfig({ ...manualConfig, daysOfWeek: newDays });
                        }}
                        className={`text-[10px] font-bold px-3 py-2 rounded-xl border transition-all duration-300 ${
                          manualConfig.daysOfWeek.includes(day) 
                            ? 'bg-accent-glow border-accent-glow text-white shadow-glow' 
                            : 'bg-white/5 text-tertiary border-white/5 hover:border-white/10'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={prepareFinalData}
              disabled={loading}
              className="btn-premium h-16 flex items-center justify-center gap-3 text-lg shadow-glow mt-2"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <>Validate Records <ChevronRight className="h-5 w-5" /></>}
            </button>
          </div>
        </div>
      )}

      {/* --- Step 5: Review & Conflicts --- */}
      {step === 5 && preparedData && (
        <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95">
          {conflicts.length > 0 && (
            <div className="glass-card p-6 border-warning/30 bg-warning/[0.02]">
              <h4 className="text-[10px] text-warning font-black mb-4 flex items-center gap-2 uppercase tracking-[0.2em]">
                <AlertCircle className="h-4 w-4" /> Collision Detected
              </h4>
              <p className="text-sm text-secondary mb-6 max-w-2xl leading-relaxed">
                The following dates already have data in ForgeTrack. <strong>Continuing will update existing records for these sessions.</strong>
              </p>
              <div className="flex flex-wrap gap-2">
                {conflicts.map(c => (
                  <span key={c.date} className="px-3 py-1.5 bg-white/5 border border-warning/20 rounded-xl text-[10px] text-warning font-bold uppercase tracking-widest">
                    {c.date}: {c.topic.slice(0, 20)}...
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="glass-card p-0 overflow-hidden">
            <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div>
                 <h4 className="text-2xl font-display font-bold text-primary">Import Preview</h4>
                 <p className="text-xs text-tertiary mt-1 font-medium">Verify the data mapping before final database commit.</p>
              </div>
              <div className="flex gap-8">
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-primary">{preparedData.students.length}</div>
                  <div className="text-[10px] text-tertiary uppercase font-black tracking-tighter mt-1">Students</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-accent-glow">{preparedData.sessions.length}</div>
                  <div className="text-[10px] text-tertiary uppercase font-black tracking-tighter mt-1">Sessions</div>
                </div>
              </div>
            </div>

            <div className="max-h-[500px] overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/[0.03] sticky top-0 z-20">
                  <tr>
                    <th className="p-5 text-[10px] font-black text-tertiary uppercase tracking-widest border-b border-white/5 sticky left-0 bg-[#0f0f18] z-30">Student Info</th>
                    {preparedData.sessions.map((s, i) => (
                      <th key={i} className="p-5 text-[10px] font-black text-tertiary uppercase tracking-widest border-b border-white/5 text-center whitespace-nowrap bg-white/[0.03]">
                        {s.detectedDate}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {preparedData.students.slice(0, 15).map((student, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] group transition-colors">
                      <td className="p-5 border-r border-white/5 sticky left-0 bg-[#0f0f18] z-10 group-hover:bg-[#151520] transition-colors">
                        <div className="text-sm font-bold text-primary">{student.name}</div>
                        <div className="text-[10px] font-mono text-tertiary mt-1 font-bold">{student.usn}</div>
                      </td>
                      {student.attendance.map((att, i) => (
                        <td key={i} className="p-5 text-center">
                          {att.present ?
                            <div className="h-8 w-8 rounded-xl bg-success/10 flex items-center justify-center mx-auto border border-success/20"><CheckCircle className="h-4 w-4 text-success" /></div> :
                            <div className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center mx-auto border border-white/10 opacity-20"><X className="h-4 w-4 text-secondary" /></div>
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {preparedData.students.length > 15 && (
                <div className="p-8 text-center text-tertiary text-xs font-bold uppercase tracking-widest bg-white/[0.01]">
                  + {preparedData.students.length - 15} more records to be processed
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={() => setStep(4)} className="btn-premium-outline h-16 px-10 flex items-center gap-3">
              <ArrowLeft className="h-5 w-5" /> Back
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn-premium flex-1 h-16 flex items-center justify-center gap-4 text-xl shadow-glow"
            >
              {loading ? <Loader2 className="h-7 w-7 animate-spin" /> : <><UserCheck className="h-7 w-7" /> Confirm & Commit to Database</>}
            </button>
          </div>
        </div>
      )}

      {/* --- Step 6: Success --- */}
      {step === 6 && (
        <div className="glass-card p-24 flex flex-col items-center justify-center animate-in zoom-in-95">
          <div className="relative mb-10">
            <div className="absolute inset-0 bg-success/20 blur-3xl rounded-full"></div>
            <div className="h-32 w-32 bg-success/10 rounded-[40px] border border-success/20 flex items-center justify-center relative">
               <CheckCircle className="h-16 w-16 text-success" />
            </div>
          </div>
          <h2 className="text-4xl font-display font-bold text-primary mb-4 text-center tracking-tight">Sync Completed!</h2>
          <p className="text-secondary mb-12 text-center max-w-md font-medium">
            Your data has been successfully mapped and committed to the database. Student history and analytics are now updated.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
            <button onClick={() => window.location.href = '/dashboard'} className="btn-premium flex-1 h-14">View Dashboard</button>
            <button onClick={resetUpload} className="btn-premium-outline flex-1 h-14">Import More</button>
          </div>
        </div>
      )}
    </div>
  );
}
