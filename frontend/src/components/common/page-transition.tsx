import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children, className }) => {
  const location = useLocation();

  // Check if user prefers reduced motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    document.body.classList.toggle('motion-safe', !mediaQuery.matches);
    document.body.classList.toggle('motion-reduce', mediaQuery.matches);
  }, []);

  const variants = {
    hidden: { opacity: 0, y: 20 },
    enter: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={variants}
        initial="hidden"
        animate="enter"
        exit="exit"
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export { PageTransition };