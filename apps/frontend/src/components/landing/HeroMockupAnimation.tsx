'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Sparkles } from 'lucide-react';

export const HeroMockupAnimation: React.FC = () => {
    return (
        <div className="relative group perspective-1000">
            {/* Background Glow */}
            <div className="absolute -inset-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-[3rem] opacity-20 blur-3xl animate-pulse"></div>

            {/* Main Card Container with 3D Float */}
            <motion.div
                initial={{ rotateX: 5, rotateY: 5, opacity: 0, scale: 0.9 }}
                animate={{ rotateX: 0, rotateY: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                whileHover={{ rotateY: -2, rotateX: 2, transition: { duration: 0.2 } }}
                className="relative bg-white dark:bg-card rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] dark:shadow-2xl dark:shadow-indigo-500/10 border border-slate-100 dark:border-border p-10 z-20 overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center space-x-4 mb-10 pb-6 border-b border-slate-50 dark:border-border/50">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                        className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg"
                    >
                        <BrainCircuit className="h-8 w-8 text-white" />
                    </motion.div>
                    <div>
                        <motion.p
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-lg font-black text-slate-900 dark:text-foreground"
                        >
                            Assistente Plania
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-xs text-emerald-500 font-bold flex items-center"
                        >
                            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span> Sistema Pronto
                        </motion.div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* User Query Bubble */}
                    <motion.div
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ type: "spring", stiffness: 100, delay: 0.8 }}
                        className="flex justify-end"
                    >
                        <div className="bg-indigo-600 text-white rounded-3xl rounded-tr-sm px-6 py-4 text-sm font-bold shadow-xl dark:shadow-none">
                            Crie um plano sobre Fotossíntese para o 6º ano.
                        </div>
                    </motion.div>

                    {/* AI Response Card - The "Construction" Effect */}
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.5, delay: 1.5 }}
                        className="bg-slate-50 dark:bg-secondary/20 rounded-[2rem] p-8 border border-slate-100 dark:border-border relative overflow-hidden"
                    >
                        {/* Scanning Beam Effect */}
                        <motion.div
                            initial={{ top: '-10%', opacity: 0 }}
                            animate={{ top: ['0%', '100%'], opacity: [0, 1, 0] }}
                            transition={{ duration: 2, delay: 1.5, ease: "linear", repeat: 0 }}
                            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent z-30 blur-sm"
                        />

                        {/* Content Stagger */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.8 }}
                            className="flex gap-2 mb-5"
                        >
                            <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full font-black uppercase">
                                BNCC EF06CI07
                            </span>
                        </motion.div>

                        <motion.h3
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 2.0 }}
                            className="font-black text-slate-900 dark:text-foreground mb-4 text-xl tracking-tight"
                        >
                            {/* Typing Effect */}
                            {Array.from("Energia Solar e Vida").map((char, i) => (
                                <motion.span
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 2.0 + (i * 0.03) }}
                                >
                                    {char}
                                </motion.span>
                            ))}
                        </motion.h3>

                        <div className="space-y-3">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '75%' }}
                                transition={{ duration: 0.8, delay: 2.5, type: "spring" }}
                                className="h-2.5 bg-slate-200 dark:bg-muted rounded-full"
                            ></motion.div>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 0.8, delay: 2.7, type: "spring" }}
                                className="h-2.5 bg-slate-200 dark:bg-muted rounded-full"
                            ></motion.div>
                        </div>

                        {/* Sparkle Icon to denote creation */}
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 3, type: 'spring' }}
                            className="absolute bottom-4 right-4 text-indigo-400"
                        >
                            <Sparkles className="w-5 h-5" />
                        </motion.div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};
