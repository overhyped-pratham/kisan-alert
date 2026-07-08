import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  FileText,
  Mic,
  Headphones,
  FlaskConical,
  Droplet,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const SYMPTOMS = ['Brown spots on leaves', 'Yellow edges', 'Reduced growth'];

const TREATMENT_STEPS = [
  'Remove and safely dispose of all infected leaves immediately.',
  'Spray recommended fungicide on all remaining healthy plants.',
  'Avoid overwatering; use drip irrigation to keep leaves dry.',
  'Monitor closely for new spots after 5 days of treatment.',
];

export const formatDiseaseName = (label: string): string => {
  if (!label) return '';
  if (label.includes('___')) {
    const parts = label.split('___');
    const crop = parts[0].replace(/_/g, ' ');
    const disease = parts[1].replace(/_/g, ' ');
    return `${crop} - ${disease}`;
  }
  return label.replace(/_/g, ' ');
};

export const CropDiseaseStep3: React.FC = () => {
  const navigate = useNavigate();
  const { diseaseResult, diseaseInput } = useAppStore();

  const isHighSeverity = diseaseResult?.severity === 'High';
  const severityBgColor = isHighSeverity ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200';
  const severityTextColor = isHighSeverity ? 'text-red-700' : 'text-orange-700';

  return (
    <div className="flex flex-col font-outfit -mx-5 -mt-5">

      {/* ── Full-bleed hero image ── */}
      <div className="relative w-full h-[200px] overflow-hidden bg-black flex items-center justify-center">
        <img
          src={diseaseInput?.cropImage || "/designs/assets/leaf_blight_symptoms.png"}
          alt="Diseased leaf"
          className="w-full h-full object-contain"
        />
        {/* "AI Analysis Complete" badge */}
        <div className="absolute bottom-3 left-4 bg-primary text-on-primary text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-m3-2">
          <CheckCircle2 size={13} className="fill-current stroke-on-primary" />
          AI Analysis Complete
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex flex-col gap-4 px-5 pt-5 pb-24">

        {/* Disease name + confidence */}
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[26px] font-black text-on-surface tracking-tight leading-none">
            {diseaseResult ? formatDiseaseName(diseaseResult.disease) : 'Leaf Blight'}
          </h2>
          <span className="bg-white border border-surface-container-high rounded-full px-3 py-1.5 text-[12px] font-bold text-on-surface flex items-center gap-1.5 shadow-m3-1 shrink-0">
            <span className="w-2 h-2 rounded-full bg-primary inline-block" />
            {diseaseResult?.confidence || '96% Confidence'}
          </span>
        </div>

        {/* Severity warning banner */}
        <div className={`w-full rounded-xl p-4 flex flex-col gap-1 border ${severityBgColor}`}>
          <div className={`flex items-center gap-2 font-bold text-[13px] ${severityTextColor}`}>
            <AlertTriangle size={16} className="shrink-0" />
            {diseaseResult?.severity || 'Medium'} Severity
          </div>
          <p className="text-[12px] text-[#795548] font-medium leading-snug">
            Early treatment is recommended to prevent spreading to entire crop.
          </p>
        </div>

        {/* Symptoms */}
        <section>
          <h3 className="text-[16px] font-bold text-on-surface mb-3">Symptoms</h3>
          <div className="flex flex-col gap-2">
            {SYMPTOMS.map(s => (
              <div key={s} className="bg-white rounded-xl border border-surface-container-high px-4 py-3 flex items-center gap-3 shadow-m3-1">
                <CheckCircle2 size={18} className="text-primary shrink-0" />
                <span className="text-[13px] text-on-surface font-medium">{s}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Treatment Plan */}
        <section>
          <h3 className="text-[16px] font-bold text-on-surface mb-3">Treatment Plan</h3>
          <div className="flex flex-col gap-2.5">
            {diseaseResult?.treatment ? (
              diseaseResult.treatment.split('.').map(s => s.trim()).filter(s => s.length > 0).map((step, i) => (
                <div key={i} className="bg-white rounded-xl border border-surface-container-high px-4 py-3.5 flex items-start gap-3 shadow-m3-1">
                  <div className="w-7 h-7 rounded-full bg-primary text-on-primary text-[12px] font-black flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <span className="text-[13px] text-on-surface font-medium leading-snug">{step}.</span>
                </div>
              ))
            ) : (
              TREATMENT_STEPS.map((step, i) => (
                <div key={i} className="bg-white rounded-xl border border-surface-container-high px-4 py-3.5 flex items-start gap-3 shadow-m3-1">
                  <div className="w-7 h-7 rounded-full bg-primary text-on-primary text-[12px] font-black flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <span className="text-[13px] text-on-surface font-medium leading-snug">{step}</span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recommended Product / Organic Alternatives */}
        <section>
          <h3 className="text-[16px] font-bold text-on-surface mb-3">Organic & Prevention Measures</h3>
          <div className="bg-white rounded-2xl border-2 border-primary/20 p-4 flex flex-col gap-3 shadow-m3-1 text-[13px]">
            {diseaseResult?.organicAlternatives && (
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-primary block">Organic Alternatives</span>
                  <span className="text-on-surface-variant font-medium">{diseaseResult.organicAlternatives}</span>
                </div>
              </div>
            )}
            {diseaseResult?.prevention && (
              <div className="flex items-start gap-3 border-t border-surface-container pt-3">
                <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-primary block">Prevention Advice</span>
                  <span className="text-on-surface-variant font-medium">{diseaseResult.prevention}</span>
                </div>
              </div>
            )}
            {!diseaseResult?.organicAlternatives && !diseaseResult?.prevention && (
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#cbffc2]/40 border border-primary/10 flex items-center justify-center shrink-0">
                  <FlaskConical size={28} className="text-primary" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[14px] font-bold text-primary">Kisan-Shield Pro</span>
                  <span className="text-[10px] font-black text-on-surface tracking-wider uppercase">
                    Broad Spectrum Fungicide
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 text-[12px] text-outline font-medium">
                    <Droplet size={12} className="text-primary" />
                    Mix 2ml per 1L water
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-1">
          {/* Primary */}
          <button
            onClick={() => navigate('/crop-disease/step-4')}
            className="m3-btn-primary flex items-center justify-center gap-2"
            id="disease-view-treatment"
          >
            <FileText size={18} />
            <span>View Full Treatment Guide</span>
          </button>

          {/* Secondary — outlined green */}
          <button
            onClick={() => navigate('/ask-ai')}
            className="w-full h-14 border-2 border-primary bg-white text-primary font-bold rounded-2xl flex items-center justify-center gap-2 transition-all hover:bg-primary/5 active:scale-95 text-[15px]"
            id="disease-ask-ai"
          >
            <Mic size={18} />
            <span>Ask Kisan AI</span>
          </button>

          {/* Tertiary — light outline */}
          <button
            onClick={() => navigate('/crop-disease/step-4')}
            className="w-full h-14 border border-outline-variant bg-white text-on-surface font-bold rounded-2xl flex items-center justify-center gap-2 transition-all hover:bg-surface-container active:scale-95 text-[15px]"
            id="disease-contact-expert"
          >
            <Headphones size={18} />
            <span>Contact Rythu Seva Kendra</span>
          </button>
        </div>

      </div>
    </div>
  );
};
