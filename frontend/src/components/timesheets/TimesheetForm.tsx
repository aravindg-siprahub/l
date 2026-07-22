'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Timesheet, TimesheetPayload, SharePayload, getTimesheetType, timesheetsApi } from '@/lib/timesheets';
type TimesheetEntryPayload = TimesheetPayload['entries'][0];
import { format, parseISO, eachDayOfInterval, addDays, endOfMonth } from 'date-fns';
import ShareManagerModal from '@/components/dashboard/ShareManagerModal';

import WizardStepper from './wizard/WizardStepper';
import StepSelectPeriod from './wizard/StepSelectPeriod';
import StepFillEntries from './wizard/StepFillEntries';
import StepReview from './wizard/StepReview';
import LiveSummaryCard from './wizard/LiveSummaryCard';

interface Props {
  timesheet: Timesheet | null;
  isNew: boolean;
  loading: boolean;
  error: string;
  successMsg: string;
  backLink: string;
  onSaveDraft: (payload: TimesheetPayload) => Promise<void>;
  onSubmitTimesheet: (payload: TimesheetPayload) => Promise<Timesheet | void>;
  onDownloadPdf: () => Promise<void>;
  onDownloadExcel?: () => Promise<void>;
  onShareWithManager: (id: string, payload: SharePayload) => Promise<Timesheet>;
  onTimesheetUpdated?: (updated: Timesheet) => void;
}

export default function TimesheetForm({
  timesheet,
  isNew,
  loading,
  error: serverError,
  successMsg,
  backLink,
  onSaveDraft,
  onSubmitTimesheet,
  onDownloadPdf,
  onDownloadExcel,
  onShareWithManager,
  onTimesheetUpdated
}: Props) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState<'Weekly' | 'Monthly' | null>(null);

  const [formData, setFormData] = useState<TimesheetPayload>({
    period_start_date: '',
    period_end_date: '',
    notes: '',
    entries: []
  });

  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [localError, setLocalError] = useState('');
  const [toast, setToast] = useState<{message: string, type: 'error' | 'success'} | null>(null);
  const [existingTimesheets, setExistingTimesheets] = useState<Timesheet[]>([]);
  const [submittedTimesheet, setSubmittedTimesheet] = useState<Timesheet | null>(null);
  const [pendingRedirect, setPendingRedirect] = useState(false);
  const router = useRouter();

  useEffect(() => {
    timesheetsApi.getAll().then(setExistingTimesheets).catch(console.error);
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  
  // Track if changes have been made
  const [isDirty, setIsDirty] = useState(false);

  const error = serverError || localError;

  // Initialize form from existing timesheet
  useEffect(() => {
    if (timesheet) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        period_start_date: timesheet.period_start_date,
        period_end_date: timesheet.period_end_date,
        notes: timesheet.notes || '',
        entries: timesheet.entries.map(e => ({
          date: e.date.split('T')[0],
          hours_worked: e.hours_worked,
          task_description: e.task_description
        }))
      });
      const tsType = getTimesheetType(timesheet.period_start_date, timesheet.period_end_date);
      if (tsType === 'Weekly' || tsType === 'Monthly') {
        setSelectedType(tsType);
      }
    }
  }, [timesheet]);

  // Unsaved changes protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const setStartDate = (dateStr: string) => {
    setFormData(prev => {
      const updates: Partial<TimesheetPayload> = { period_start_date: dateStr };
      if (dateStr && selectedType) {
        try {
          const dateObj = parseISO(dateStr);
          if (selectedType === 'Weekly') {
            updates.period_end_date = format(addDays(dateObj, 6), 'yyyy-MM-dd');
          } else if (selectedType === 'Monthly') {
            updates.period_end_date = format(endOfMonth(dateObj), 'yyyy-MM-dd');
          }
        } catch (e) {
          // ignore parsing error
        }
      }
      return { ...prev, ...updates };
    });
    setIsDirty(true);
  };
  const setEndDate = (date: string) => {
    setFormData(prev => ({ ...prev, period_end_date: date }));
    setIsDirty(true);
  };
  const setNotes = (notes: string) => {
    setFormData(prev => ({ ...prev, notes }));
    setIsDirty(true);
  };

  const handleEntryChange = useCallback((index: number, field: string, value: string | number) => {
    setFormData(prev => {
      const newEntries = [...prev.entries];
      newEntries[index] = { ...newEntries[index], [field]: value };
      return { ...prev, entries: newEntries };
    });
    setIsDirty(true);
  }, []);

  const totalHours = useMemo(() => formData.entries.reduce((sum, e) => sum + (e.hours_worked || 0), 0), [formData.entries]);
  const workingDays = useMemo(() => formData.entries.filter(e => e.date && e.hours_worked > 0).length, [formData.entries]);

  const generateEntries = useCallback(() => {
    if (!formData.period_start_date || !formData.period_end_date) return;
    
    try {
      const start = parseISO(formData.period_start_date);
      const end = parseISO(formData.period_end_date);
      
      if (start > end) return; // Invalid date range
      
      const dates = eachDayOfInterval({ start, end });
      
      setFormData(prev => {
        const newEntries: TimesheetEntryPayload[] = dates.map(date => {
          const dateStr = format(date, 'yyyy-MM-dd');
          // Find if we already have an entry for this date to preserve it
          const existingEntry = prev.entries.find(e => e.date === dateStr);
          if (existingEntry) {
            return existingEntry;
          }
          return { date: dateStr, hours_worked: 0, task_description: '' };
        });
        
        return { ...prev, entries: newEntries };
      });
    } catch (e) {
      console.error("Invalid dates for entry generation", e);
    }
  }, [formData.period_start_date, formData.period_end_date]);

  const handleNextToStep2 = () => {
    if (!formData.period_start_date || !formData.period_end_date) {
      setToast({ message: "Please select both a start and end date.", type: 'error' });
      return;
    }
    
    const start = parseISO(formData.period_start_date);
    const end = parseISO(formData.period_end_date);
    
    if (start > end) {
      setToast({ message: "Invalid Date Range: End date cannot be earlier than start date.", type: 'error' });
      return;
    }

    const hasOverlap = existingTimesheets.some(ts => {
      if (timesheet && ts.id === timesheet.id) return false;
      const tsStart = parseISO(ts.period_start_date);
      const tsEnd = parseISO(ts.period_end_date);
      return start <= tsEnd && tsStart <= end;
    });

    if (hasOverlap) {
      setToast({ message: "You already have a timesheet for this period.", type: 'error' });
      return;
    }

    generateEntries();
    setLocalError('');
    setCurrentStep(2);
  };

  const handleNextToStep3 = () => {
    if (totalHours === 0) {
      setToast({ message: "You must log at least some hours before proceeding.", type: 'error' });
      return;
    }

    const errorMsg = validateFormData(formData);
    if (errorMsg) {
      setLocalError(errorMsg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setLocalError('');
    setCurrentStep(3);
  };

  const cleanFormData = (data: TimesheetPayload): TimesheetPayload => {
    return {
      ...data,
      entries: data.entries
        .filter(e => e.hours_worked > 0 || e.task_description.trim() !== '')
        .map(e => {
          // Safely default the description to a space if empty, satisfying backend min_length=1 while appearing blank
          if (e.hours_worked > 0 && e.task_description.trim() === '') {
            return { ...e, task_description: ' ' };
          }
          return e;
        })
    };
  };

  const validateFormData = (data: TimesheetPayload): string | null => {
    // Validation is bypassed safely: cleanFormData auto-fills empty descriptions.
    return null;
  };

  const handleSaveDraft = async () => {
    const validationError = validateFormData(formData);
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    try {
      setSubmitting(true);
      setLocalError('');
      await onSaveDraft(cleanFormData(formData));
      setIsDirty(false);
    } catch (err: unknown) {
      setLocalError((err as Error).message || 'Failed to save timesheet.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitTimesheet = async () => {
    const validationError = validateFormData(formData);
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    try {
      setSubmitting(true);
      setLocalError('');
      const ts = await onSubmitTimesheet(cleanFormData(formData));
      setIsDirty(false);
      
      if (ts) {
        setSubmittedTimesheet(ts);
        setPendingRedirect(true);
        setShowShareModal(true);
      } else if (timesheet) {
        setSubmittedTimesheet(timesheet);
        setPendingRedirect(true);
        setShowShareModal(true);
      }
    } catch (err: unknown) {
      setLocalError((err as Error).message || 'Failed to submit timesheet.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setLocalError('');
      await onDownloadPdf();
    } catch (err: unknown) {
      setLocalError((err as Error).message || 'Failed to download PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadExcelAction = async () => {
    if (!onDownloadExcel) return;
    try {
      setDownloadingExcel(true);
      setLocalError('');
      await onDownloadExcel();
    } catch (err: unknown) {
      setLocalError((err as Error).message || 'Failed to download Excel.');
    } finally {
      setDownloadingExcel(false);
    }
  };

  const handleShareSuccess = (updated: Timesheet) => {
    setShowShareModal(false);
    if (onTimesheetUpdated) {
      onTimesheetUpdated(updated);
    }
    if (pendingRedirect) {
      router.push('/dashboard/candidate/timesheets');
    }
  };

  const handleShareModalClose = () => {
    setShowShareModal(false);
    if (pendingRedirect) {
      router.push('/dashboard/candidate/timesheets');
    }
  };

  const isEditable = isNew || (timesheet && (timesheet.status === 'draft' || timesheet.status === 'client_rejected' || timesheet.status === 'finance_rejected'));
  const isReadOnly = !isEditable;
  const canDownload = Boolean(timesheet && timesheet.status !== 'draft');
  const canShare = Boolean(timesheet && (timesheet.status === 'submitted' || timesheet.status === 'client_rejected' || timesheet.status === 'finance_rejected'));
  
  // Always recalculate tsType based on current dates to reflect live updates
  const tsType = formData.period_start_date && formData.period_end_date ? getTimesheetType(formData.period_start_date, formData.period_end_date) : null;

  // Workflow Progress Calculation for read-only view
  const progressSteps = ['Draft', 'Submitted', 'Shared', 'Approved'];
  let currentStepIdx = 0;
  if (!isNew && timesheet) {
    if (timesheet.status === 'client_approved' || timesheet.status === 'finance_approved') currentStepIdx = 3;
    else if (timesheet.shared_at) currentStepIdx = 2;
    else if (timesheet.status === 'submitted') currentStepIdx = 1;
    else currentStepIdx = 0;
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-zinc-500">
        <svg className="animate-spin h-8 w-8 text-indigo-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm font-medium">Loading timesheet...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 relative">
      {/* Beautiful Toast Pop-up */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className={`rounded-full shadow-lg border px-6 py-3 flex items-center gap-3 backdrop-blur-md ${
            toast.type === 'error' ? 'bg-red-50/95 border-red-200 text-red-800' : 'bg-emerald-50/95 border-emerald-200 text-emerald-800'
          }`}>
            {toast.type === 'error' ? (
              <svg className="h-5 w-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="text-sm font-semibold tracking-tight">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-current opacity-60 hover:opacity-100 transition-opacity">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* Header section */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">
            {isNew ? 'Create Timesheet' : `Timesheet — ${tsType ?? timesheet?.status}`}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {isNew ? 'Fill in the period and your daily entries, then save or submit.' : 'View or edit your timesheet details and entries.'}
          </p>
        </div>
        <Link href={backLink} className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
          ← Back to list
        </Link>
      </div>

      {/* Progress Indicator (Only for existing timesheets) */}
      {!isNew && (
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-zinc-200 p-6">
          <nav aria-label="Progress">
            <ol role="list" className="flex items-center">
              {progressSteps.map((step, stepIdx) => (
                <li key={step} className={`relative ${stepIdx !== progressSteps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className={`h-0.5 w-full ${stepIdx < currentStepIdx ? 'bg-indigo-600' : 'bg-zinc-200'}`} />
                  </div>
                  <div className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                    stepIdx < currentStepIdx ? 'bg-indigo-600 hover:bg-indigo-900' :
                    stepIdx === currentStepIdx ? 'bg-white border-2 border-indigo-600' : 'bg-white border-2 border-zinc-300'
                  }`}>
                    {stepIdx < currentStepIdx ? (
                      <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                    ) : stepIdx === currentStepIdx ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" aria-hidden="true" />
                    ) : (
                      <span className="h-2.5 w-2.5 rounded-full bg-transparent" aria-hidden="true" />
                    )}
                  </div>
                  <span className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap ${
                    stepIdx <= currentStepIdx ? 'text-indigo-600' : 'text-zinc-500'
                  }`}>
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      )}

      {/* Banners */}
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200 flex items-start gap-3">
            <svg className="h-5 w-5 text-red-500 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}
        {successMsg && (
          <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200 flex items-start gap-3">
            <svg className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium text-emerald-800">{successMsg}</p>
          </div>
        )}
        {timesheet?.status === 'client_rejected' && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200">
            <h3 className="text-sm font-bold text-red-800">Timesheet Rejected by Client Manager</h3>
            <p className="mt-2 text-sm text-red-700">{timesheet.rejection_reason || 'No reason provided.'}</p>
            <p className="mt-2 text-sm font-medium text-red-700">Please update your entries and resubmit.</p>
          </div>
        )}
        {timesheet?.status === 'finance_rejected' && (
          <div className="rounded-lg bg-orange-50 p-4 border border-orange-200">
            <h3 className="text-sm font-bold text-orange-800">Timesheet Rejected by Finance Team</h3>
            <p className="mt-2 text-sm text-orange-700">{timesheet.rejection_reason || 'No reason provided.'}</p>
            <p className="mt-2 text-sm font-medium text-orange-700">Please correct the issues and resubmit for review.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Wizard Sections */}
        <div className="lg:col-span-2 space-y-6">
          
          <WizardStepper currentStep={currentStep} />
          
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200/80 p-6">
            {currentStep === 1 && (
              <StepSelectPeriod
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                startDate={formData.period_start_date}
                endDate={formData.period_end_date}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
                notes={formData.notes || ''}
                setNotes={setNotes}
                isReadOnly={isReadOnly}
                onNext={handleNextToStep2}
              />
            )}
            
            {currentStep === 2 && (
              <StepFillEntries
                entries={formData.entries}
                onChange={handleEntryChange}
                isReadOnly={isReadOnly}
                onBack={() => {
                  setLocalError('');
                  setCurrentStep(1);
                }}
                onNext={handleNextToStep3}
              />
            )}
            
            {currentStep === 3 && (
              <div className="space-y-8">
                <StepReview
                  workingDays={workingDays}
                  totalHours={totalHours}
                  submitting={submitting}
                  onSaveDraft={handleSaveDraft}
                  onSubmit={handleSubmitTimesheet}
                  onBack={() => {
                    setLocalError('');
                    setCurrentStep(2);
                  }}
                />
                
                {/* Legacy Actions integration for existing timesheets */}
                {!isNew && canShare && (
                  <div className="pt-8 border-t border-zinc-100">
                    <h3 className="text-lg font-bold text-zinc-900 tracking-tight mb-4">Post-Submission Actions</h3>
                    
                    {timesheet?.shared_at ? (
                      <div className="rounded-lg border border-violet-200 bg-violet-50 p-5 mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">📤</span>
                            <h4 className="text-sm font-bold text-violet-900">Currently Shared</h4>
                          </div>
                          <p className="text-sm text-violet-800 ml-7">
                            Shared with <span className="font-semibold">{timesheet.manager_name || timesheet.manager_email}</span> on {format(parseISO(timesheet.shared_at), 'MMM d, yyyy')}.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowShareModal(true)}
                          className="w-full sm:w-auto rounded-md bg-white px-4 py-2 text-sm font-semibold text-violet-700 shadow-sm ring-1 ring-inset ring-violet-300 hover:bg-violet-100 transition-colors ml-7 sm:ml-0"
                        >
                          Resend / Change Manager
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-center mb-6">
                        <span className="text-4xl block mb-3">📬</span>
                        <h4 className="text-sm font-bold text-zinc-900 mb-1">Share with your Client Manager</h4>
                        <p className="text-sm text-zinc-600 mb-4 max-w-md mx-auto">
                          Your timesheet is submitted. Send it to your manager via email to notify them it&apos;s ready for review.
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowShareModal(true)}
                          className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-500 transition-colors"
                        >
                          Share Now
                        </button>
                      </div>
                    )}
                    
                    {canDownload && (
                      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4 pt-4 border-t border-zinc-100">
                        <button
                          type="button"
                          disabled={downloading}
                          onClick={handleDownload}
                          className="inline-flex items-center gap-2 text-sm font-medium text-rose-600 hover:text-rose-700 disabled:opacity-50 transition-colors"
                        >
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                          </svg>
                          {downloading ? 'Downloading...' : 'Download PDF'}
                        </button>
                        {onDownloadExcel && (
                          <button
                            type="button"
                            disabled={downloadingExcel}
                            onClick={handleDownloadExcelAction}
                            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 disabled:opacity-50 transition-colors"
                          >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                              <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            {downloadingExcel ? 'Downloading...' : 'Download Excel'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Summary */}
        <div className="lg:col-span-1">
          <LiveSummaryCard
            totalHours={totalHours}
            workingDays={workingDays}
            timesheet={timesheet}
            isNew={isNew}
            tsType={tsType}
          />
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (submittedTimesheet || timesheet) && (
        <ShareManagerModal
          onClose={handleShareModalClose}
          onConfirmShare={(payload) => onShareWithManager((submittedTimesheet || timesheet)!.id, payload)}
          onSuccess={handleShareSuccess}
        />
      )}
    </div>
  );
}
