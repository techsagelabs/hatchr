"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0.0, 0.2, 1] // Custom easing for smoother feel
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function CardTransition({ children, index = 0, className }: PageTransitionProps & { index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1, // Stagger animation
        ease: [0.4, 0.0, 0.2, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function SlideUpTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: [0.4, 0.0, 0.2, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
