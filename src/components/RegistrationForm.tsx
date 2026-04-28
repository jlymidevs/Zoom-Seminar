import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, signInWithGoogle, auth, isAdmin } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandling';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Briefcase, 
  Star, 
  CheckCircle, 
  AlertCircle,
  Camera,
  Calendar,
  Send,
  Loader2,
  Download,
  Church,
  ChevronRight,
  ChevronLeft,
  Facebook,
  Instagram,
  Send as Telegram,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { cn } from '../lib/utils';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  facebookUrl: string;
  instagramHandle: string;
  telegramHandle: string;
  contactNumber: string;
  department: string;
  role: string;
  churchBranch: string;
  experience: string;
  topics: string[];
  learnGoals: string;
  equipment: string[];
  challenges: string[];
  cameraFraming: string;
  lightingTerms: string;
  soundMixer: string;
  preferredSchedule: string;
  willAttend: string;
  questions: string;
  committed: boolean;
}

const INITIAL_DATA: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  facebookUrl: '',
  instagramHandle: '',
  telegramHandle: '',
  contactNumber: '',
  department: '',
  role: '',
  churchBranch: '',
  experience: '',
  topics: [],
  learnGoals: '',
  equipment: [],
  challenges: [],
  cameraFraming: '',
  lightingTerms: '',
  soundMixer: '',
  preferredSchedule: '',
  willAttend: '',
  questions: '',
  committed: false,
};

const JLYCC_BRANCHES = [
  "Main", "Butuan", "Gamut", "Nasipit", "Tandag", "Gingoog", "Cantilan", "Kibungsod", 
  "Sta Ana", "Panaosawon", "Lindoy", "Bugsukan", "Marikina", "Imus", "Dasmariñas", 
  "GMA", "Commonwealth", "Antipolo", "Jala-Jala", "San Pedro", "Olongapo", 
  "Castillejos", "San Fernando", "Urdaneta", "Cabanatuan", "Baguio", "San Jose", 
  "Cagayan De Oro", "Davao", "Gensan", "Iligan", "Sto Tomas", "Solano", "Lamut", 
  "Bambang", "Santiago", "Cauayan", "Curifang", "Echague", "Tucal", "Roxas Isabela", 
  "Diffun", "Cebu", "Ilo-Ilo", "USA", "Hongkong", "Kota Kinabalu", "Australia", 
  "Italy", "Lapu-Lapu", "Talisay", "Leyte", "Roxas Capiz", "Naga", "Pres Roxas", 
  "Bataan", "New Dapitan", "Cabadbaran", "Bagabag", "Malungon", "Mandaue"
].sort((a, b) => {
  if (a === "Main") return -1;
  if (b === "Main") return 1;
  return a.localeCompare(b);
});

export default function RegistrationForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>(INITIAL_DATA);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ id: string, name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isMobileWebview = () => {
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    return (ua.indexOf("FBAN") > -1) || (ua.indexOf("FBAV") > -1) || (ua.indexOf("Instagram") > -1) || (ua.indexOf("Messenger") > -1);
  };

  const steps = [
    { id: 'start', title: "Ready to start your registration?", field: 'email', placeholder: "Your email..." },
    { id: 'firstName', title: "First, what's your first name?", field: 'firstName', placeholder: "Enter your first name..." },
    { id: 'lastName', title: "And your last name?", field: 'lastName', placeholder: "Enter your last name..." },
    { id: 'email', title: "What's your email address?", field: 'email', type: 'email', placeholder: "email@example.com" },
    { id: 'contact', title: "What's your contact number?", field: 'contactNumber', placeholder: "+63 9XX XXX XXXX" },
    { id: 'socials', title: "Your Social Accounts", multi: true },
    { id: 'branch', title: "Which JLYCC branch are you from?", field: 'churchBranch' },
    { id: 'experience', title: "Skill experience level?", field: 'experience' },
    { id: 'role', title: "What is your primary role?", field: 'role', placeholder: "e.g. Director, Camera, Editor..." },
    { id: 'department', title: "Your department or organization?", field: 'department', placeholder: "e.g. Media Team, Youth..." },
    { id: 'topics', title: "Which topics interest you most?", field: 'topics' },
    { id: 'goals', title: "What do you want to learn?", field: 'learnGoals' },
    { id: 'equipment', title: "What equipment do you own?", field: 'equipment' },
    { id: 'challenges', title: "Common challenges you face?", field: 'challenges' },
    { id: 'frame', title: "Familiar with camera framing?", field: 'cameraFraming' },
    { id: 'light', title: "Familiar with basic lighting?", field: 'lightingTerms' },
    { id: 'sound', title: "Familiar with sound mixers?", field: 'soundMixer' },
    { id: 'schedule', title: "Preferred seminar schedule?", field: 'preferredSchedule', placeholder: "MM/DD/YYYY HH:MM" },
    { id: 'attend', title: "Will you be attending?", field: 'willAttend' },
    { id: 'questions', title: "Questions for the trainer?", field: 'questions' },
    { id: 'commitment', title: "Final Commitment", field: 'committed' }
  ];

  const validateStep = () => {
    const step = steps[currentStep];
    if (step.field) {
      const val = formData[step.field as keyof FormData];
      if (['firstName', 'lastName', 'email', 'contactNumber', 'churchBranch', 'experience', 'willAttend'].includes(step.field)) {
        if (typeof val === 'string' && !val.trim()) return "This field is required.";
      }
    }
    return null;
  };

  const nextStep = async () => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }

    // Admin Check - if they typed 'admin', try to sign in but stay on current step if it fails
    if (steps[currentStep].id === 'firstName' && formData.firstName.toLowerCase() === 'admin') {
      try {
        const result = await signInWithGoogle();
        if (isAdmin(result.user.email)) {
          navigate('/admin');
          return;
        } else {
          setError("You are not authorized as an admin.");
          return;
        }
      } catch (e: any) {
        if (e.code === 'auth/popup-closed-by-user') {
          setError("Login cancelled. If you are a participant, please enter your real name.");
        } else {
          setError(`Auth Error: ${e.message}`);
        }
        return;
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setError(null);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const handleCheckboxChange = (field: keyof FormData, value: string) => {
    setFormData(prev => {
      const current = prev[field] as string[];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(v => v !== value) };
      }
      return { ...prev, [field]: [...current, value] };
    });
  };

  const handleSubmit = async () => {
    if (!formData.committed) {
      setError("Please check the commitment box to finalize.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let finalEmail = formData.email;
      
      // Try to verify identity if not signed in, but handle errors gracefully
      if (!auth.currentUser) {
        try {
          const result = await signInWithGoogle();
          finalEmail = result.user.email || formData.email;
        } catch (authErr: any) {
          console.error("Auth failed during submission:", authErr);
          if (authErr.code === 'auth/unauthorized-domain' || authErr.message?.includes('unauthorized domain')) {
            setError("Domain Error: This website domain is not authorized in Firebase. Please add it to 'Authorized Domains' in your Firebase Console (Auth > Settings).");
            setIsSubmitting(false);
            return;
          }
          // For other auth errors, we inform the user but they might need to try again
          if (authErr.code === 'auth/disallowed-useragent' || authErr.message?.includes('disallowed_useragent')) {
            setError("Google blocks sign-in from this app (e.g. Messenger/FB). Please tap the menu (...) and select 'Open in Browser' to continue.");
          } else {
            setError(`Identity verification failed: ${authErr.message}. Please try again.`);
          }
          setIsSubmitting(false);
          return;
        }
      } else {
        finalEmail = auth.currentUser.email || formData.email;
      }
      
      const docRef = await addDoc(collection(db, 'registrations'), {
        ...formData,
        email: finalEmail,
        createdAt: serverTimestamp(),
      });
      setSuccessInfo({ id: docRef.id, name: `${formData.firstName} ${formData.lastName}` });
    } catch (err: any) {
      console.error("Submission failed:", err);
      setError(`Submission failed: ${err.message || 'Unknown error'}. Please check your connection and try again.`);
      try {
        handleFirestoreError(err, OperationType.WRITE, 'registrations');
      } catch (e) {
        // handleFirestoreError logs and re-throws
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById('registration-qr');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Increase resolution for better quality
        const scale = 4;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx?.scale(scale, scale);
        ctx?.drawImage(img, 0, 0);
        
        const pngFile = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `JLYCC_QR_${successInfo?.name.replace(/\s+/g, '_')}.png`;
        link.href = pngFile;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      
      // Use encodeURIComponent to handle non-ASCII characters safely
      const encodedData = window.btoa(unescape(encodeURIComponent(svgData)));
      img.src = 'data:image/svg+xml;base64,' + encodedData;
    }
  };

  if (successInfo) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-sans italic overflow-hidden relative">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#002D62] rounded-full blur-[160px] opacity-20"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600 rounded-full blur-[160px] opacity-20"></div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="max-w-md w-full backdrop-blur-[120px] bg-white/[0.04] border border-white/10 rounded-[60px] p-12 text-center relative z-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          {/* Inner Glow Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/30">
              <CheckCircle className="text-green-500 w-10 h-10" />
            </div>
            <h2 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase italic">Confirmed</h2>
            <p className="text-slate-400 mb-10 italic text-sm">Excellent, <span className="font-bold text-white uppercase">{successInfo.name}</span>. Your registration is secured.</p>
            
            <div className="bg-white p-6 rounded-[40px] inline-block mb-10 shadow-[0_0_50px_-10px_rgba(255,255,255,0.2)]">
              <QRCodeSVG 
                id="registration-qr"
                value={successInfo.id} 
                size={180}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={downloadQR}
                className="w-full py-5 bg-white text-[#0a0a0a] rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-blue-500 hover:text-white hover:scale-105 transition-all flex items-center justify-center gap-3 shadow-xl"
              >
                <Download className="w-5 h-5" />
                Download QR
              </button>
              <button 
                onClick={() => { setSuccessInfo(null); setCurrentStep(0); }}
                className="w-full py-5 bg-white/5 text-slate-400 rounded-2xl font-black uppercase tracking-[0.2em] text-sm border border-white/10 hover:bg-white/10 transition-all"
              >
                New Entry
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-200 py-12 px-4 font-sans italic relative overflow-hidden flex items-center justify-center">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#002D62] rounded-full blur-[200px] opacity-10 -mr-64 -mt-64"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-900 rounded-full blur-[180px] opacity-10 -ml-48 -mb-48"></div>

      <div className="max-w-3xl w-full relative z-10">
        <header className="mb-12 flex items-end justify-between border-b border-white/5 pb-8">
           <div>
             <h1 className="text-3xl font-black tracking-tight uppercase italic text-white flex items-center gap-3">
               <Zap className="w-6 h-6 text-blue-500 fill-blue-500" />
               JLYCC ZOOM, WAVE & LIGHTS
             </h1>
             <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-slate-500 mt-2">Registration Experience v2.0</p>
           </div>
           <div className="text-right">
             <div className="text-3xl font-black text-white tabular-nums tracking-tighter italic">
               {String(currentStep + 1).padStart(2, '0')}<span className="text-slate-600 text-lg mx-1">/</span>{String(steps.length).padStart(2, '0')}
             </div>
           </div>
        </header>

        <div className="backdrop-blur-[160px] bg-white/[0.03] border border-white/10 rounded-[60px] p-8 md:p-16 min-h-[520px] flex flex-col justify-center relative shadow-[0_64px_128px_-32px_rgba(0,0,0,0.8)]">
          {/* Inner Gloss */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent rounded-[60px] pointer-events-none"></div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 1.02 }}
              transition={{ duration: 0.4, ease: "anticipate" }}
              className="space-y-12"
            >
              <div className="space-y-4">
                <p className="text-blue-500 font-black uppercase tracking-[0.4em] text-[10px]">Current Selection</p>
                <h2 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter leading-[1.1] uppercase">
                  {currentStepData.title}
                </h2>
              </div>

              <div className="pt-4">
                {currentStepData.id === 'start' && (
                  <div className="space-y-6">
                    {isMobileWebview() && (
                      <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-[30px] flex gap-4 items-start text-left">
                        <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
                        <div>
                          <p className="text-amber-500 font-bold uppercase tracking-widest text-[10px]">Browser Warning</p>
                          <p className="text-white text-sm mt-1">You are in an in-app browser. Google Sign-in may be blocked. Please use "Open in Browser".</p>
                        </div>
                      </div>
                    )}
                    <button 
                      onClick={async () => {
                        try {
                          setError(null);
                          await signInWithGoogle();
                          nextStep();
                        } catch (err: any) {
                          if (err.code === 'auth/disallowed-useragent' || err.message?.includes('disallowed_useragent')) {
                            setError("Google blocks sign-in here. Please use 'Open in Browser'.");
                          } else {
                            setError(err.message);
                          }
                        }
                      }}
                      className="w-full py-8 bg-white text-[#0a0a0a] rounded-[35px] font-black uppercase tracking-[0.2em] text-lg hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-4"
                    >
                      <Zap className="w-6 h-6 fill-[#0a0a0a]" />
                      Sign In with Google
                    </button>
                    <div className="flex items-center gap-4 py-4">
                      <div className="h-px bg-white/10 flex-1"></div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Or Continue</span>
                      <div className="h-px bg-white/10 flex-1"></div>
                    </div>
                  </div>
                )}
                {currentStepData.id === 'firstName' && <InputField placeholder={currentStepData.placeholder} value={formData.firstName} onChange={v => setFormData({...formData, firstName: v})} />}
                {currentStepData.id === 'lastName' && <InputField placeholder={currentStepData.placeholder} value={formData.lastName} onChange={v => setFormData({...formData, lastName: v})} />}
                {currentStepData.id === 'email' && <InputField type="email" placeholder={currentStepData.placeholder} icon={<Mail className="w-5 h-5"/>} value={formData.email} onChange={v => setFormData({...formData, email: v})} />}
                {currentStepData.id === 'contact' && <InputField placeholder={currentStepData.placeholder} icon={<Phone className="w-5 h-5"/>} value={formData.contactNumber} onChange={v => setFormData({...formData, contactNumber: v})} />}
                {currentStepData.id === 'socials' && (
                  <div className="space-y-6">
                    <InputField placeholder="Facebook URL" icon={<Facebook className="w-4 h-4"/>} value={formData.facebookUrl} onChange={v => setFormData({...formData, facebookUrl: v})} />
                    <InputField placeholder="Instagram Handle" icon={<Instagram className="w-4 h-4"/>} value={formData.instagramHandle} onChange={v => setFormData({...formData, instagramHandle: v})} />
                    <InputField placeholder="Telegram Handle" icon={<Telegram className="w-4 h-4"/>} value={formData.telegramHandle} onChange={v => setFormData({...formData, telegramHandle: v})} />
                  </div>
                )}
                {currentStepData.id === 'branch' && <DropdownField options={JLYCC_BRANCHES} value={formData.churchBranch} onChange={v => setFormData({...formData, churchBranch: v})} icon={<Church className="w-5 h-5"/>} />}
                {currentStepData.id === 'experience' && <RadioGroup options={["Beginner", "Intermediate", "Advanced"]} value={formData.experience} onChange={v => setFormData({...formData, experience: v})} />}
                {currentStepData.id === 'role' && <InputField placeholder={currentStepData.placeholder} icon={<Briefcase className="w-5 h-5"/>} value={formData.role} onChange={v => setFormData({...formData, role: v})} />}
                {currentStepData.id === 'department' && <InputField placeholder={currentStepData.placeholder} icon={<Building className="w-5 h-5"/>} value={formData.department} onChange={v => setFormData({...formData, department: v})} />}
                {currentStepData.id === 'topics' && <CheckboxGroup options={["Camera shooting", "Lighting setup", "Sound mixing", "Video production workflow", "All of the above"]} selected={formData.topics} onChange={v => handleCheckboxChange('topics', v)} />}
                {currentStepData.id === 'goals' && <TextAreaField placeholder="Type here..." value={formData.learnGoals} onChange={v => setFormData({...formData, learnGoals: v})} />}
                {currentStepData.id === 'equipment' && <CheckboxGroup options={["Camera", "Phone camera", "Microphone", "Lights", "Laptop", "None"]} selected={formData.equipment} onChange={v => handleCheckboxChange('equipment', v)} />}
                {currentStepData.id === 'challenges' && <CheckboxGroup options={["Blurry shots", "Noisy audio", "Poor lighting", "Editing"]} selected={formData.challenges} onChange={v => handleCheckboxChange('challenges', v)} />}
                {currentStepData.id === 'frame' && <RadioGroup options={["Yes", "No", "Basic"]} value={formData.cameraFraming} onChange={v => setFormData({...formData, cameraFraming: v})} />}
                {currentStepData.id === 'light' && <RadioGroup options={["Yes", "No", "Basic"]} value={formData.lightingTerms} onChange={v => setFormData({...formData, lightingTerms: v})} />}
                {currentStepData.id === 'sound' && <RadioGroup options={["Yes", "No", "Basic"]} value={formData.soundMixer} onChange={v => setFormData({...formData, soundMixer: v})} />}
                {currentStepData.id === 'schedule' && <InputField placeholder={currentStepData.placeholder} value={formData.preferredSchedule} onChange={v => setFormData({...formData, preferredSchedule: v})} icon={<Calendar className="w-5 h-5"/>} />}
                {currentStepData.id === 'attend' && <RadioGroup options={["Yes", "Maybe", "No"]} value={formData.willAttend} onChange={v => setFormData({...formData, willAttend: v})} />}
                {currentStepData.id === 'questions' && <TextAreaField placeholder="Type here..." value={formData.questions} onChange={v => setFormData({...formData, questions: v})} />}
                {currentStepData.id === 'commitment' && (
                  <div className="bg-white/5 border border-white/10 p-10 rounded-[40px] backdrop-blur-2xl">
                    <div className="flex gap-8 items-start cursor-pointer group" onClick={() => setFormData({...formData, committed: !formData.committed})}>
                      <div className={cn(
                        "w-12 h-12 rounded-2xl border-2 flex items-center justify-center shrink-0 transition-all duration-300",
                        formData.committed ? "bg-blue-500 border-blue-500 scale-110" : "bg-white/5 border-white/20 group-hover:border-white/40"
                      )}>
                        {formData.committed && <CheckCircle className="w-6 h-6 text-white" />}
                      </div>
                      <div>
                        <span className="text-xl font-black text-white italic uppercase tracking-tighter">I Hereby Commit</span>
                        <p className="text-slate-500 text-sm mt-2 leading-relaxed">I confirm that all information is true and I am ready to engage in this seminar.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2 p-6 bg-red-500/10 border border-red-500/20 rounded-[30px]">
                  <div className="flex items-center gap-2 text-red-500 font-bold uppercase tracking-widest text-[10px]">
                    <AlertCircle className="w-4 h-4" />
                    System Error
                  </div>
                  <p className="text-white text-sm font-medium italic">{error}</p>
                  {isMobileWebview() && (
                    <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest mt-2">
                       Hint: Tap ... then "Open in Browser"
                    </p>
                  )}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="mt-16 flex items-center justify-between pointer-events-none">
             <button 
                onClick={prevStep}
                disabled={currentStep === 0}
                className={cn(
                  "p-5 rounded-3xl bg-white/5 border border-white/5 text-white transition-all pointer-events-auto",
                  currentStep === 0 ? "opacity-0 cursor-default" : "hover:bg-white/10 active:scale-95"
                )}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <button 
                onClick={nextStep}
                disabled={isSubmitting}
                className="px-12 py-6 rounded-[30px] bg-white text-[#0a0a0a] font-black uppercase tracking-[0.3em] text-sm hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center gap-4 pointer-events-auto group"
              >
                {isSubmitting ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : currentStep === steps.length - 1 ? (
                  <>FINALIZE <Send className="w-5 h-5" /></>
                ) : (
                  <>NEXT <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({ type = "text", placeholder, icon, value, onChange }: { 
  type?: string, 
  placeholder?: string,
  icon?: React.ReactNode, 
  value: string,
  onChange: (v: string) => void
}) {
  return (
    <div className="relative group">
      {icon && <div className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-white transition-colors">{icon}</div>}
      <input 
        type={type} 
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        autoFocus
        className={cn(
          "w-full bg-white/[0.03] border-2 border-white/10 rounded-[35px] py-9 focus:ring-[20px] focus:ring-blue-500/10 focus:border-white/30 outline-none transition-all font-black text-2xl md:text-3xl text-white placeholder-slate-700 italic tracking-tight",
          icon ? "pl-22 pr-8" : "px-10"
        )}
      />
    </div>
  );
}

function DropdownField({ options, icon, value, onChange }: { 
  options: string[], 
  icon?: React.ReactNode, 
  value: string,
  onChange: (v: string) => void
}) {
  return (
    <div className="relative group">
      {icon && <div className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-white transition-colors">{icon}</div>}
      <select 
        value={value}
        onChange={e => onChange(e.target.value)}
        className={cn(
          "w-full bg-white/[0.03] border-2 border-white/10 rounded-[35px] py-9 focus:ring-[20px] focus:ring-blue-500/10 focus:border-white/30 outline-none transition-all font-black text-2xl md:text-3xl text-white appearance-none italic tracking-tight",
          icon ? "pl-22 pr-12" : "px-10"
        )}
      >
        <option value="" className="bg-[#1a1a1a]">Select your branch...</option>
        {options.map(opt => (
          <option key={opt} value={opt} className="bg-[#1a1a1a]">{opt}</option>
        ))}
      </select>
      <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
         <ChevronRight className="w-8 h-8 rotate-90" />
      </div>
    </div>
  );
}

function TextAreaField({ placeholder, value, onChange }: { placeholder?: string, value: string, onChange: (v: string) => void }) {
  return (
    <textarea 
      rows={4}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      autoFocus
      className="w-full bg-white/[0.03] border-2 border-white/10 rounded-[40px] p-10 focus:ring-[20px] focus:ring-blue-500/10 focus:border-white/30 outline-none transition-all font-bold text-2xl text-white italic placeholder-slate-700 leading-relaxed"
    />
  );
}

function RadioGroup({ options, value, onChange, label }: { 
  options: string[], 
  value: string,
  onChange: (v: string) => void,
  label?: string
}) {
  return (
    <div className="space-y-4">
      {label && <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block pl-2">{label}</label>}
      <div className="flex flex-wrap gap-4">
        {options.map(opt => (
          <label key={opt} className={cn(
            "flex items-center gap-5 cursor-pointer p-8 rounded-[35px] border-2 transition-all flex-1 min-w-[180px] group",
            value === opt ? "bg-white border-white text-[#0a0a0a]" : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20"
          )}>
            <input 
              type="radio" 
              checked={value === opt}
              onChange={() => onChange(opt)}
              className="sr-only"
            />
            <div className={cn(
              "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
              value === opt ? "border-[#0a0a0a]" : "border-slate-700 group-hover:border-slate-500"
            )}>
              {value === opt && <div className="w-4 h-4 bg-[#0a0a0a] rounded-full" />}
            </div>
            <span className="text-xl md:text-2xl font-black uppercase tracking-tighter italic">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function CheckboxGroup({ options, selected, onChange }: { 
  options: string[], 
  selected: string[],
  onChange: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {options.map(opt => (
        <label key={opt} className={cn(
           "flex items-center gap-6 cursor-pointer p-8 rounded-[35px] border-2 transition-all group",
           selected.includes(opt) ? "bg-white/10 border-blue-500 text-white" : "bg-white/5 border-white/10 text-slate-500 hover:bg-white/10"
        )}>
          <div className={cn(
            "w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all shrink-0",
            selected.includes(opt) ? "bg-blue-500 border-blue-500 text-white" : "border-slate-700 group-hover:border-slate-500"
          )}>
            {selected.includes(opt) && <CheckCircle className="w-5 h-5" />}
          </div>
          <input 
            type="checkbox" 
            checked={selected.includes(opt)}
            onChange={() => onChange(opt)}
            className="sr-only"
          />
          <span className="text-xl font-black uppercase tracking-tighter italic">{opt}</span>
        </label>
      ))}
    </div>
  );
}
