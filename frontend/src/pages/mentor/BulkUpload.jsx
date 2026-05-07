import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, ChevronRight, ArrowLeft, Calendar, UserCheck, Database, X } from 'lucide-react';
import { parseFile, getSampleData } from '../../lib/importUtils';
import { analyzeStructure, suggestDates } from '../../lib/aiAgent';
import { supabase } from '../../lib/supabase';

export default function BulkUpload() {
  // Wizard State
  const [step, setStep] = useState(1); // 1: Upload, 2: Sheets, 3: Analysis, 4: Config, 5: Review, 6: Success
  const [file, setFile] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState(null);
  
  // AI/Mapping State
  const [aiResult, setAiResult] = useState(null);
  const [manualConfig, setManualConfig] = useState({
    startDate: new Date().toISOString().split('T')[0],
    daysOfWeek: ['Monday', 'Wednesday', 'Friday'],
    useAiDates: true
  });
  
  // Final Data
  const [preparedData, setPreparedData] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      const headers = rows[0];
      const dataRows = rows.slice(1);
      
      let finalSessions = [...aiResult.sessionColumns];
      
      // Resolve missing dates if needed
      if (finalSessions.some(s => !s.detectedDate)) {
        const suggested = await suggestDates(finalSessions, manualConfig.startDate, manualConfig.daysOfWeek);
        finalSessions = finalSessions.map((s, i) => ({
          ...s,
          detectedDate: s.detectedDate || suggested[i]
        }));
      }

      // Check conflicts in Supabase
      const sessionDates = finalSessions.map(s => s.detectedDate);
      const { data: existingSessions } = await supabase
        .from('sessions')
        .select('date, topic')
        .in('date', sessionDates);
      
      setConflicts(existingSessions || []);
      
      // Map students and attendance
      const studentsToImport = dataRows.map(row => ({
        usn: row[aiResult.usnIndex],
        name: row[aiResult.nameIndex],
        attendance: finalSessions.map(session => ({
          date: session.detectedDate,
          present: aiResult.markerMapping.present.includes(String(row[session.index]))
        }))
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
    setLoading(true);
    try {
      // 1. Upsert Sessions
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
        if (sErr) throw sErr;
        session.dbId = sData.id;
      }

      // 2. Fetch/Create Students
      const usns = preparedData.students.map(s => s.usn);
      const { data: existingStudents } = await supabase
        .from('students')
        .select('id, usn')
        .in('usn', usns);
      
      const studentMap = {};
      existingStudents.forEach(s => studentMap[s.usn] = s.id);

      for (const student of preparedData.students) {
        if (!studentMap[student.usn]) {
          const { data: nData, error: nErr } = await supabase
            .from('students')
            .insert({ name: student.name, usn: student.usn, branch_code: 'UNK' })
            .select()
            .single();
          if (nErr) throw nErr;
          studentMap[student.usn] = nData.id;
        }
        
        // 3. Insert Attendance
        const attendanceData = student.attendance.map(a => ({
          student_id: studentMap[student.usn],
          session_id: preparedData.sessions.find(s => s.detectedDate === a.date).dbId,
          present: a.present
        }));

        await supabase.from('attendance').upsert(attendanceData, { onConflict: 'student_id, session_id' });
      }

      setStep(6);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-h2 text-primary flex items-center gap-3">
          <Database className="text-accent-glow h-8 w-8" />
          Bulk Attendance Upload
        </h1>
        <p className="text-body text-secondary mt-2">
          Upload your class tracker. Our AI agent will automatically map students and sessions.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-danger-bg border border-danger-border rounded-xl flex items-center gap-3 text-danger-fg animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-danger-fg/60 hover:text-danger-fg"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* --- Step 1: Upload --- */}
      {step === 1 && (
        <div className="card p-12 flex flex-col items-center justify-center border-dashed border-2 border-border-default hover:border-primary transition-all group bg-surface/50">
          <div className="h-20 w-20 bg-surface-inset rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Upload className="h-10 w-10 text-secondary group-hover:text-primary transition-colors" />
          </div>
          <h3 className="text-h3 text-primary mb-2">Select Spreadsheet</h3>
          <p className="text-body text-tertiary mb-8 text-center max-w-sm">
            Support for Excel (.xlsx) and CSV files. Make sure the file contains USN/Name and session columns.
          </p>
          
          <label className="btn-primary px-8 h-12 flex items-center gap-2 cursor-pointer">
            <FileText className="h-5 w-5" />
            Browse Files
            <input type="file" className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} />
          </label>
        </div>
      )}

      {/* --- Step 2: Sheet Selection --- */}
      {step === 2 && (
        <div className="card p-8 animate-in fade-in zoom-in-95 duration-200">
          <h3 className="text-h3 text-primary mb-6">Select Sheet</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.keys(rawData.sheets).map(name => (
              <button 
                key={name}
                onClick={() => {
                  setSelectedSheet(name);
                  startAnalysis(rawData.sheets[name]);
                }}
                className="p-6 border border-border-default rounded-xl hover:border-primary hover:bg-surface-hover text-left transition-all"
              >
                <div className="text-primary font-bold text-lg mb-1">{name}</div>
                <div className="text-tertiary text-sm">{rawData.sheets[name].length} rows detected</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --- Step 3: Analysis --- */}
      {step === 3 && (
        <div className="card p-20 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 text-accent-glow animate-spin mb-6" />
          <h3 className="text-h3 text-primary mb-2">AI Agent Analyzing...</h3>
          <p className="text-body text-tertiary text-center">
            Reasoning about file structure, identifying USNs, names, and session headers.
          </p>
        </div>
      )}

      {/* --- Step 4: Configuration --- */}
      {step === 4 && aiResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-right-4">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="card p-6 border border-success/20 bg-success/5">
              <h4 className="text-label text-success font-bold mb-4 flex items-center gap-2 uppercase tracking-widest">
                <CheckCircle className="h-4 w-4" /> AI Mappings Found
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-surface rounded-lg border border-border-subtle">
                  <div className="text-xs text-tertiary uppercase mb-1">Student USN Column</div>
                  <div className="text-primary font-medium">{rawData.type === 'xlsx' ? rawData.sheets[selectedSheet][0][aiResult.usnIndex] : rawData.data[0][aiResult.usnIndex]}</div>
                </div>
                <div className="p-4 bg-surface rounded-lg border border-border-subtle">
                  <div className="text-xs text-tertiary uppercase mb-1">Student Name Column</div>
                  <div className="text-primary font-medium">{rawData.type === 'xlsx' ? rawData.sheets[selectedSheet][0][aiResult.nameIndex] : rawData.data[0][aiResult.nameIndex]}</div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h4 className="text-label text-secondary font-bold mb-4 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Detected Sessions ({aiResult.sessionColumns.length})
              </h4>
              <div className="max-h-[300px] overflow-y-auto border border-border-subtle rounded-lg">
                <table className="w-full text-left">
                  <thead className="bg-surface-inset sticky top-0">
                    <tr>
                      <th className="p-3 text-xs font-bold text-tertiary uppercase">Index</th>
                      <th className="p-3 text-xs font-bold text-tertiary uppercase">Header</th>
                      <th className="p-3 text-xs font-bold text-tertiary uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {aiResult.sessionColumns.map(col => (
                      <tr key={col.index} className="hover:bg-surface-hover">
                        <td className="p-3 text-sm text-tertiary">Col {col.index + 1}</td>
                        <td className="p-3 text-sm text-primary font-medium">{col.header || 'Empty'}</td>
                        <td className="p-3 text-sm">
                          {col.detectedDate ? (
                            <span className="text-success flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {col.detectedDate}</span>
                          ) : (
                            <span className="text-warning flex items-center gap-1"><AlertCircle className="h-3 w-3" /> To be inferred</span>
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
            <div className="card p-6 bg-surface-inset">
              <h4 className="text-label text-primary font-bold mb-4 uppercase tracking-widest">Date Inference</h4>
              <p className="text-xs text-tertiary mb-6">For sessions without dates in headers, provide class schedule.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-secondary mb-2 uppercase">Start Date</label>
                  <input 
                    type="date" 
                    className="input w-full"
                    value={manualConfig.startDate}
                    onChange={e => setManualConfig({...manualConfig, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary mb-2 uppercase">Held On</label>
                  <div className="flex flex-wrap gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <button 
                        key={day}
                        onClick={() => {
                          const newDays = manualConfig.daysOfWeek.includes(day)
                            ? manualConfig.daysOfWeek.filter(d => d !== day)
                            : [...manualConfig.daysOfWeek, day];
                          setManualConfig({...manualConfig, daysOfWeek: newDays});
                        }}
                        className={`text-[10px] px-2 py-1 rounded-full border transition-all ${manualConfig.daysOfWeek.includes(day) ? 'bg-primary text-void border-primary' : 'bg-surface text-tertiary border-border-default'}`}
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
              className="btn-primary h-14 flex items-center justify-center gap-2 text-lg shadow-glow"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Analyze Data & Conflicts <ChevronRight className="h-5 w-5" /></>}
            </button>
          </div>
        </div>
      )}

      {/* --- Step 5: Review & Conflicts --- */}
      {step === 5 && preparedData && (
        <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95">
          {conflicts.length > 0 && (
            <div className="card p-6 border-warning/30 bg-warning/5">
              <h4 className="text-label text-warning font-bold mb-4 flex items-center gap-2 uppercase tracking-widest">
                <AlertCircle className="h-4 w-4" /> Duplicate Sessions Detected
              </h4>
              <p className="text-sm text-secondary mb-4">
                The following dates already have sessions in the database. <strong>Importing will overwrite the topic and update attendance for these dates.</strong>
              </p>
              <div className="flex flex-wrap gap-2">
                {conflicts.map(c => (
                  <span key={c.date} className="px-3 py-1 bg-surface border border-warning/40 rounded-full text-xs text-warning-fg font-mono">
                    {c.date}: {c.topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="p-6 border-b border-border-subtle bg-surface flex items-center justify-between">
              <h4 className="text-h3 text-primary">Import Preview</h4>
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-xl font-bold text-primary">{preparedData.students.length}</div>
                  <div className="text-[10px] text-tertiary uppercase font-bold tracking-tighter">Students</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-primary">{preparedData.sessions.length}</div>
                  <div className="text-[10px] text-tertiary uppercase font-bold tracking-tighter">Sessions</div>
                </div>
              </div>
            </div>
            
            <div className="max-h-[400px] overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-inset sticky top-0 z-10">
                  <tr>
                    <th className="p-4 text-xs font-bold text-tertiary uppercase border-b border-border-subtle sticky left-0 bg-surface-inset">Student</th>
                    {preparedData.sessions.map((s, i) => (
                      <th key={i} className="p-4 text-xs font-bold text-tertiary uppercase border-b border-border-subtle text-center whitespace-nowrap">
                        {s.detectedDate}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {preparedData.students.slice(0, 10).map((student, idx) => (
                    <tr key={idx} className="hover:bg-surface-hover group">
                      <td className="p-4 border-r border-border-subtle sticky left-0 bg-surface group-hover:bg-surface-hover">
                        <div className="text-sm font-bold text-primary">{student.name}</div>
                        <div className="text-[10px] font-mono text-tertiary">{student.usn}</div>
                      </td>
                      {student.attendance.map((att, i) => (
                        <td key={i} className="p-4 text-center">
                          {att.present ? 
                            <CheckCircle className="h-5 w-5 text-success mx-auto" /> : 
                            <X className="h-5 w-5 text-danger/30 mx-auto" />
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {preparedData.students.length > 10 && (
                <div className="p-4 text-center text-tertiary text-sm italic bg-surface-inset/50 border-t border-border-subtle">
                  Showing first 10 students of {preparedData.students.length}...
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => setStep(4)} 
              className="btn-secondary h-14 px-8 flex items-center gap-2"
            >
              <ArrowLeft className="h-5 w-5" /> Back
            </button>
            <button 
              onClick={handleSave}
              disabled={loading}
              className="btn-primary flex-1 h-14 flex items-center justify-center gap-3 text-lg shadow-glow"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><UserCheck className="h-6 w-6" /> Confirm & Import to Database</>}
            </button>
          </div>
        </div>
      )}

      {/* --- Step 6: Success --- */}
      {step === 6 && (
        <div className="card p-20 flex flex-col items-center justify-center animate-in zoom-in-95">
          <div className="h-24 w-24 bg-success/20 rounded-full flex items-center justify-center mb-8">
            <CheckCircle className="h-14 w-14 text-success" />
          </div>
          <h2 className="text-h2 text-primary mb-4 text-center">Import Successful!</h2>
          <p className="text-body text-secondary mb-10 text-center max-w-md">
            All students and sessions have been successfully imported and mapped. You can now view them in the Student History and Dashboard.
          </p>
          <div className="flex gap-4">
            <button onClick={() => window.location.href = '/dashboard'} className="btn-primary px-8 h-12">View Dashboard</button>
            <button onClick={() => setStep(1)} className="btn-secondary px-8 h-12">Import Another File</button>
          </div>
        </div>
      )}
    </div>
  );
}
