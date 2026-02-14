import { Variants } from 'framer-motion';

/**
 * Standardized Animation Variants
 * Following the "Instagram/WhatsApp" feel: subtle, springy, and smooth.
 */

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.2, ease: "easeOut" }
  },
  exit: { opacity: 0 }
};

export const slideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 300 }
  },
  exit: { opacity: 0, y: 20 }
};

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { type: "spring", damping: 25, stiffness: 300 }
  },
  exit: { opacity: 0, x: 20 }
};

export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { type: "spring", damping: 25, stiffness: 300 }
  },
  exit: { opacity: 0, x: -20 }
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", damping: 20, stiffness: 300 }
  },
  exit: { opacity: 0, scale: 0.9 }
};

export const messageAppear = (isOwn: boolean): Variants => ({
  initial: { 
    opacity: 0, 
    y: 10, 
    scale: 0.95,
    x: isOwn ? 20 : -20 
  },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    x: 0,
    transition: { 
      type: "spring",
      damping: 25,
      stiffness: 400,
      mass: 0.8
    }
  }
});

export const springUp: Variants = {
  initial: { y: 100, opacity: 0 },
  animate: { 
    y: 0, 
    opacity: 1,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300
    }
  },
  exit: { y: 100, opacity: 0 }
};
