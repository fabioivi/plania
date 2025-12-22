'use client';

import React from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { Share2, Shield, Zap, BookOpen, Calendar, FileText } from 'lucide-react';

const availableFeatures = [
    {
        icon: Zap,
        color: "text-amber-400",
        title: "IA Especializada",
        desc: "Algoritmos treinados especificamente na pedagogia brasileira, entendendo a realidade da sala de aula."
    },
    {
        icon: BookOpen,
        color: "text-blue-400",
        title: "BNCC Nativa",
        desc: "Mapeamento automático e contextualizado de todas as competências e habilidades da Base Nacional."
    },
    {
        icon: Calendar,
        color: "text-emerald-400",
        title: "Diário Automático",
        desc: "Registre conteúdos, frequências e ocorrências com um clique, integrado ao seu planejamento."
    },
    {
        icon: FileText,
        color: "text-purple-400",
        title: "Exportação Pro",
        desc: "Seus planos prontos em Word editável ou PDF profissional, formatados para impressão em segundos."
    },
    {
        icon: Share2,
        color: "text-indigo-400",
        title: "Colaboração",
        desc: "Compartilhe planos com coordenadores ou outros professores da rede em tempo real."
    },
    {
        icon: Shield,
        color: "text-rose-400",
        title: "Dados Seguros (LGPD)",
        desc: "Proteção total da sua produção intelectual e dados dos alunos com criptografia de ponta."
    }
];

function FeatureCard({ feature, index }: { feature: typeof availableFeatures[0], index: number }) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    const Icon = feature.icon;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
                type: "spring",
                stiffness: 100,
                damping: 15,
                delay: index * 0.1
            }}
            viewport={{ once: true, margin: "-50px" }}
            className="group relative border border-slate-200 dark:border-indigo-500/20 bg-slate-50 dark:bg-[#020617]/80 backdrop-blur-sm rounded-3xl p-6 md:p-8 overflow-hidden hover:border-slate-300 dark:hover:border-indigo-500/50 transition-colors duration-500 h-full flex flex-col"
            onMouseMove={handleMouseMove}
        >
            {/* Spotlight Effect */}
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                          650px circle at ${mouseX}px ${mouseY}px,
                          rgba(99, 102, 241, 0.10),
                          transparent 80%
                        )
                    `,
                }}
            />

            <div className="relative z-10 font-sans flex-1 flex flex-col">
                <div className="mb-6 inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-sm dark:shadow-none">
                    <Icon className={`w-6 h-6 md:w-7 md:h-7 ${feature.color}`} />
                    {/* SVG Drawing Animation Simulation */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <motion.rect
                            width="100%"
                            height="100%"
                            rx="16"
                            fill="none"
                            stroke={feature.color.replace('text-', 'var(--color-')}
                            strokeWidth="2"
                            initial={{ pathLength: 0, opacity: 0 }}
                            whileInView={{ pathLength: 1, opacity: 0.2 }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                        />
                    </svg>
                </div>

                <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                    {/* Typewriter Effect */}
                    {feature.title.split('').map((char, i) => (
                        <motion.span
                            key={i}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0, delay: 0.3 + (i * 0.02) }}
                        >
                            {char}
                        </motion.span>
                    ))}
                </h3>

                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-medium"
                >
                    {feature.desc}
                </motion.p>

                {/* Tech Deco Lines */}
                <div className="absolute top-6 right-6 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 animate-pulse"></span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 animate-pulse delay-75"></span>
                </div>
            </div>
        </motion.div>
    );
}

export const FeaturesSection = () => {
    return (
        <section id="funcionalidades" className="py-10 md:py-20 bg-white dark:bg-transparent relative overflow-hidden">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 dark:opacity-5 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-4xl mx-auto mb-10 md:mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-block mb-3"
                    >
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.4em]">Infraestrutura Escolar</span>
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter leading-[0.95]"
                    >
                        Ferramentas que <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">libertam você.</span>
                    </motion.h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {availableFeatures.map((feature, index) => (
                        <FeatureCard key={index} feature={feature} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
};
