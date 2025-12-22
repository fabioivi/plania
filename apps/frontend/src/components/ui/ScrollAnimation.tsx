'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';

interface ScrollAnimationProps {
    children: React.ReactNode;
    animation?: 'fade-in' | 'fade-in-up' | 'scale-up' | 'slide-in-right';
    delay?: number; // kept as ms for compatibility, converted internally
    className?: string;
    threshold?: number;
    duration?: number;
}

export const ScrollAnimation: React.FC<ScrollAnimationProps> = ({
    children,
    animation = 'fade-in-up',
    delay = 0,
    className = '',
    threshold = 0.1,
    duration = 0.5
}) => {
    // Variants for different animation types
    const variants: Record<string, Variants> = {
        'fade-in-up': {
            hidden: { opacity: 0, y: 40 },
            visible: {
                opacity: 1,
                y: 0,
                transition: {
                    type: "spring",
                    damping: 25,
                    stiffness: 100,
                    duration: duration,
                    delay: delay / 1000 // Convert ms to seconds
                }
            }
        },
        'fade-in': {
            hidden: { opacity: 0 },
            visible: {
                opacity: 1,
                transition: {
                    duration: duration,
                    ease: "easeOut",
                    delay: delay / 1000
                }
            }
        },
        'scale-up': {
            hidden: { opacity: 0, scale: 0.95 },
            visible: {
                opacity: 1,
                scale: 1,
                transition: {
                    type: "spring",
                    damping: 20,
                    stiffness: 100,
                    delay: delay / 1000
                }
            }
        },
        'slide-in-right': {
            hidden: { opacity: 0, x: -20 },
            visible: {
                opacity: 1,
                x: 0,
                transition: {
                    type: "spring",
                    damping: 25,
                    stiffness: 100,
                    delay: delay / 1000
                }
            }
        }
    };

    const selectedVariant = variants[animation] || variants['fade-in-up'];

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: threshold }}
            variants={selectedVariant}
            className={className}
        >
            {children}
        </motion.div>
    );
};
