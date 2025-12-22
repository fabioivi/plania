'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BrainCircuit,
  Menu,
  X,
  ArrowRight,
  PlayCircle,
  Sparkles,
  CheckCircle2,
  Zap,
  BookOpen,
  Calendar,
  FileText,
  Share2,
  Shield,
  Wand2,
  Clock,
  Target,
  AlertCircle,
  Check,
  Heart,
  Loader2,
  Instagram,
  Twitter,
  Linkedin
} from 'lucide-react';
import { GradeLevel, GeneratedPlan } from '@/components/landing/types';
import { generateLessonPlan } from '@/components/landing/services/geminiService';
import { ScrollAnimation } from '@/components/ui/ScrollAnimation';
import { HeroMockupAnimation } from '@/components/landing/HeroMockupAnimation';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

// --- Subcomponent: Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'white';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-bold transition-all duration-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap";
  const sizes = {
    sm: "px-4 py-2 text-xs rounded-xl",
    md: "px-6 py-3.5 text-sm rounded-2xl",
    lg: "px-8 py-4 text-base rounded-[1.25rem]",
    xl: "px-10 py-5 text-lg rounded-[1.5rem]"
  };
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200 dark:shadow-none border-none",
    secondary: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none",
    outline: "bg-transparent border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-600 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400",
    white: "bg-white text-slate-900 hover:bg-slate-50 shadow-2xl shadow-black/5 dark:shadow-none border-none"
  };

  return (
    <button className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`} disabled={isLoading || disabled} {...props}>
      {isLoading && <Loader2 className="animate-spin mr-3 h-5 w-5" />}
      <span className="flex items-center justify-center">{children}</span>
    </button>
  );
};

// --- Main Landing Component ---
export default function Home() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Demo States
  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState<GradeLevel>(GradeLevel.ELEMENTARY_1);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const onNavigate = (page: string) => {
    if (page === 'login') router.push('/login');
    if (page === 'signup') router.push('/register');
  };

  const handleGenerateDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setIsLoadingDemo(true);
    setDemoError(null);
    setPlan(null);
    try {
      const result = await generateLessonPlan({ topic, grade });
      setPlan(result);
    } catch (err) {
      setDemoError("Erro ao conectar com a IA. Verifique sua conexão.");
    } finally {
      setIsLoadingDemo(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background text-slate-900 dark:text-foreground font-sans selection:bg-indigo-100 selection:text-indigo-900 dark:selection:bg-indigo-900 dark:selection:text-indigo-100">

      {/* HEADER */}
      <header className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 dark:bg-background/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="bg-indigo-600 p-2 rounded-lg shadow-md dark:shadow-none"><BrainCircuit className="h-6 w-6 text-white" /></div>
            <span className="text-2xl font-black text-slate-900 dark:text-foreground tracking-tighter">Plania</span>
          </div>
          <div className="hidden lg:flex items-center space-x-8">
            <a href="#funcionalidades" className="text-slate-600 dark:text-slate-300 font-bold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Funcionalidades</a>
            <a href="#precos" className="text-slate-600 dark:text-slate-300 font-bold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Preços</a>
            <ThemeToggle />
            <Button variant="outline" onClick={() => onNavigate('login')}>Entrar</Button>
            <Button onClick={() => onNavigate('signup')}>Criar Conta</Button>
          </div>
          <div className="lg:hidden flex items-center space-x-4">
            <ThemeToggle />
            <button className="p-2 text-slate-600 dark:text-slate-300 transition-colors" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE NAV */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-white dark:bg-slate-950 p-6 flex flex-col space-y-6 pt-24 animate-fade-in">
          <a href="#funcionalidades" className="text-2xl font-black text-slate-900 dark:text-slate-100" onClick={() => setIsMobileMenuOpen(false)}>Funcionalidades</a>
          <a href="#demonstracao" className="text-2xl font-black text-slate-900 dark:text-slate-100" onClick={() => setIsMobileMenuOpen(false)}>Demonstração</a>
          <a href="#precos" className="text-2xl font-black text-slate-900 dark:text-slate-100" onClick={() => setIsMobileMenuOpen(false)}>Preços</a>
          <Button size="xl" onClick={() => onNavigate('signup')}>Criar Conta Grátis</Button>
          <Button variant="outline" size="xl" onClick={() => onNavigate('login')}>Fazer Login</Button>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 lg:pt-56 lg:pb-40 overflow-hidden">
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[600px] h-[600px] bg-indigo-200/40 dark:bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="text-center lg:text-left">
              <ScrollAnimation>
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 mb-10 shadow-sm dark:shadow-none animate-fade-in">
                  <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mr-2" />
                  <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 tracking-[0.2em] uppercase">IA Pedagógica Brasileira</span>
                </div>
              </ScrollAnimation>
              <ScrollAnimation delay={100}>
                <h1 className="text-6xl md:text-7xl lg:text-[90px] xl:text-[100px] font-black text-slate-900 dark:text-foreground tracking-tighter mb-8 leading-[0.9] lg:leading-[0.85]">
                  O professor <br /> agora tem <br /> <span className="gradient-text">superpoderes.</span>
                </h1>
              </ScrollAnimation>
              <ScrollAnimation delay={200}>
                <p className="text-xl md:text-2xl text-slate-500 dark:text-muted-foreground mb-12 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">Esqueça a burocracia. O Plania usa IA de ponta para gerar planos de aula BNCC e diários de classe em segundos.</p>
              </ScrollAnimation>
              <ScrollAnimation delay={300}>
                <div className="flex flex-col sm:flex-row gap-5 mb-14 justify-center lg:justify-start">
                  <Button onClick={() => onNavigate('signup')} size="xl" className="group w-full sm:w-auto">Criar Conta Grátis <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" /></Button>
                  <a href="#demonstracao" className="w-full sm:w-auto"><Button variant="outline" size="xl" className="bg-white/50 dark:bg-white/5 backdrop-blur-md w-full sm:w-auto"><PlayCircle className="mr-3 h-6 w-6" /> Ver Demo</Button></a>
                </div>
              </ScrollAnimation>
              <ScrollAnimation delay={500}>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-4">
                  {['BNCC Aprovado', '10.000+ Professores', 'Diário Integrado'].map((item) => (
                    <div key={item} className="flex items-center text-xs font-black text-slate-400 uppercase tracking-widest"><CheckCircle2 className="h-4 w-4 text-emerald-500 mr-2" /> {item}</div>
                  ))}
                </div>
              </ScrollAnimation>
            </div>
            {/* Hero Mockup */}
            {/* Hero Mockup */}
            <div className="hidden lg:block relative z-20">
              <ScrollAnimation delay={200}>
                <HeroMockupAnimation />
              </ScrollAnimation>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      {/* FEATURES SECTION */}
      <FeaturesSection />

      {/* DEMO SECTION */}
      <section id="demonstracao" className="py-32 bg-slate-50 dark:bg-background relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black text-slate-900 dark:text-foreground mb-6 tracking-tight">Experimente a <span className="gradient-text">inteligência</span>.</h2>
            <p className="text-xl text-slate-500 dark:text-muted-foreground font-medium">Escolha um tema e veja a IA criar seu plano profissional.</p>
          </div>
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5">
              <ScrollAnimation>
                <div className="bg-white dark:bg-card p-10 rounded-[2.5rem] border border-slate-200 dark:border-border shadow-xl dark:shadow-none">
                  <form onSubmit={handleGenerateDemo} className="space-y-8">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Nível de Ensino</label>
                      <select value={grade} onChange={(e) => setGrade(e.target.value as GradeLevel)} className="w-full px-5 py-4 rounded-2xl border border-slate-100 dark:border-border bg-slate-50 dark:bg-secondary/50 font-bold text-slate-700 dark:text-foreground outline-none focus:ring-4 focus:ring-indigo-500/10 appearance-none">
                        {Object.values(GradeLevel).map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Tema Pedagógico</label>
                      <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ex: Sistemas Solares" className="w-full px-5 py-4 rounded-2xl border border-slate-100 dark:border-border bg-slate-50 dark:bg-secondary/50 font-bold text-slate-700 dark:text-foreground outline-none focus:ring-4 focus:ring-indigo-500/10" />
                    </div>
                    <Button type="submit" className="w-full h-16 text-xl rounded-2xl" isLoading={isLoadingDemo} disabled={!topic.trim()}><Wand2 className="mr-3" /> Gerar com IA</Button>
                    {demoError && <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center text-sm font-bold border border-red-100"><AlertCircle className="mr-3" /> {demoError}</div>}
                  </form>
                </div>
              </ScrollAnimation>
            </div>
            <div className="lg:col-span-7">
              <ScrollAnimation delay={200} className="h-full">
                <div className="relative min-h-[600px] bg-white dark:bg-card rounded-[2rem] border border-slate-200 dark:border-border shadow-2xl dark:shadow-none overflow-hidden flex flex-col h-full">
                  {isLoadingDemo ? (
                    <div className="p-10 space-y-10 animate-pulse">
                      <div className="h-12 bg-slate-100 rounded-2xl w-3/4"></div>
                      <div className="grid grid-cols-2 gap-6"><div className="h-24 bg-slate-50 rounded-2xl"></div><div className="h-24 bg-slate-50 rounded-2xl"></div></div>
                      <div className="h-40 bg-slate-100 rounded-2xl"></div>
                    </div>
                  ) : plan ? (
                    <div className="p-10 lg:p-14 animate-fade-in overflow-y-auto max-h-[600px]">
                      <span className="bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-lg text-[10px] font-black uppercase mb-6 inline-block">{grade}</span>
                      <h3 className="text-4xl font-black text-slate-900 dark:text-foreground mb-10 tracking-tight">{plan.title}</h3>
                      <div className="grid sm:grid-cols-2 gap-8 mb-12">
                        <div className="bg-slate-50 dark:bg-secondary/30 p-6 rounded-3xl border border-slate-100 dark:border-border"><span className="text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase flex items-center mb-2"><Clock className="w-4 h-4 mr-2" /> Duração</span><p className="font-bold text-slate-800 dark:text-foreground">{plan.duration}</p></div>
                        <div className="bg-slate-50 dark:bg-secondary/30 p-6 rounded-3xl border border-slate-100 dark:border-border"><span className="text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase flex items-center mb-2"><BookOpen className="w-4 h-4 mr-2" /> BNCC</span><div className="flex flex-wrap gap-2">{plan.bnccCodes.map(c => <span key={c} className="bg-white dark:bg-card px-2 py-1 rounded-lg text-[10px] font-bold border border-indigo-100 dark:border-border">{c}</span>)}</div></div>
                      </div>
                      <div className="space-y-12">
                        <div><h4 className="text-xl font-black mb-6 flex items-center dark:text-foreground"><Target className="w-6 h-6 mr-3 text-indigo-500" /> Objetivos</h4><ul className="space-y-4">{plan.objectives.map((obj, i) => <li key={i} className="flex items-start text-slate-600 dark:text-muted-foreground font-medium"><div className="mr-4 mt-2 w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0" />{obj}</li>)}</ul></div>
                        <div><h4 className="text-xl font-black mb-6 flex items-center dark:text-foreground"><Sparkles className="w-6 h-6 mr-3 text-indigo-500" /> Metodologia</h4><p className="text-slate-600 dark:text-muted-foreground font-medium leading-relaxed">{plan.methodology}</p></div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                      <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2rem] flex items-center justify-center mb-8"><Sparkles className="h-12 w-12 text-indigo-400" /></div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-foreground mb-4">Pronto para começar?</h3>
                      <p className="text-slate-500 dark:text-muted-foreground max-w-xs font-medium">Insira um tema ao lado para ver a IA criar um plano profissional em segundos.</p>
                    </div>
                  )}
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="precos" className="py-32 bg-white dark:bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24"><h2 className="text-5xl font-black text-slate-900 dark:text-foreground mb-8 tracking-tighter">Quanto vale seu <span className="gradient-text">tempo?</span></h2></div>
          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <ScrollAnimation className="h-full">
              <div className="bg-slate-50 dark:bg-secondary/10 p-12 rounded-[3rem] border border-slate-200 dark:border-border flex flex-col h-full">
                <h3 className="text-2xl font-black mb-2 text-slate-900 dark:text-foreground">Plano Gratuito</h3>
                <div className="flex items-baseline my-10"><span className="text-6xl font-black text-slate-900 dark:text-foreground">R$ 0</span><span className="text-slate-400 font-bold ml-3 uppercase tracking-widest text-xs">/ mês</span></div>
                <ul className="space-y-6 mb-12 flex-1">
                  {['3 Planos / semana', 'Acesso BNCC', 'Exportação PDF (Marca d\'água)'].map(item => (
                    <li key={item} className="flex items-center text-slate-600 dark:text-muted-foreground font-medium"><Check className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-4" /> {item}</li>
                  ))}
                </ul>
                <Button variant="outline" size="lg" onClick={() => onNavigate('signup')} className="w-full">Começar Grátis</Button>
              </div>
            </ScrollAnimation>
            <ScrollAnimation delay={200} className="h-full">
              <div className="relative group h-full">
                <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-[3.25rem] blur opacity-30 group-hover:opacity-100 transition duration-1000 dark:opacity-20 dark:group-hover:opacity-80"></div>
                <div className="relative bg-indigo-600 p-12 rounded-[3rem] text-white flex flex-col h-full overflow-hidden shadow-2xl dark:shadow-[0_20px_50px_-12px_rgba(79,70,229,0.3)]">
                  <div className="absolute top-0 right-0 bg-amber-400 text-amber-950 text-[10px] font-black px-6 py-2 rounded-bl-3xl uppercase tracking-widest">Mais Escolhido</div>
                  <h3 className="text-2xl font-black mb-2">Professor Pro</h3>
                  <div className="flex items-baseline my-10"><span className="text-6xl font-black">R$ 29</span><span className="text-indigo-300 font-bold ml-3 uppercase tracking-widest text-xs">/ mês</span></div>
                  <ul className="space-y-6 mb-12 flex-1">
                    {['Planos ilimitados', 'IA de Alta Performance', 'Preenchimento de Diários', 'Exportação Word editável'].map(item => (
                      <li key={item} className="flex items-center font-medium"><Check className="w-5 h-5 text-amber-400 mr-4" /> {item}</li>
                    ))}
                  </ul>
                  <Button variant="white" size="lg" onClick={() => onNavigate('signup')} className="w-full">Assinar e Testar 7 Dias</Button>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 p-2 rounded-xl"><BrainCircuit className="h-6 w-6 text-white" /></div>
              <span className="text-2xl font-black text-white tracking-tighter">Plania</span>
            </div>
            <div className="flex space-x-8">
              {[Instagram, Twitter, Linkedin].map((Icon, i) => <a key={i} href="#" className="hover:text-white transition-colors"><Icon /></a>)}
            </div>
          </div>
          <div className="border-t border-slate-800 mt-16 pt-12 flex flex-col md:flex-row justify-between items-center text-xs font-bold uppercase tracking-widest">
            <p>&copy; {new Date().getFullYear()} Plania Tecnologia Educacional</p>
            <p className="flex items-center mt-4 md:mt-0">Feito com <Heart className="w-3 h-3 mx-2 text-rose-500 fill-rose-500" /> para o Brasil</p>
          </div>
        </div>
      </footer>

    </div>
  );
};
