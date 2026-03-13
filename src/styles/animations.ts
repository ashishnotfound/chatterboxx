import { Variants } from 'framer-motion';

/**
 * Standardized Animation Variants
 * Following the "Instagram/WhatsApp" feel: subtle, springy, and smooth.
 * Optimized for 60fps — minimal layout thrash, GPU-accelerated transforms only.
 */

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.2, ease: "easeOut" }
  },
  exit: { opacity: 0, transition: { duration: 0.15 } }
};

export const slideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 300 }
  },
  exit: { opacity: 0, y: 20, transition: { duration: 0.15 } }
};

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", damping: 25, stiffness: 300 }
  },
  exit: { opacity: 0, x: 20, transition: { duration: 0.15 } }
};

export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", damping: 25, stiffness: 300 }
  },
  exit: { opacity: 0, x: -20, transition: { duration: 0.15 } }
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", damping: 20, stiffness: 300 }
  },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15 } }
};

/**
 * iMessage-style message pop animation.
 * Messages slide vertically with a smooth fade for a premium feel.
 */
export const messageAppear = (isOwn: boolean): Variants => ({
  initial: {
    opacity: 0,
    y: 10,
    x: isOwn ? 20 : -20,
  },
  animate: {
    opacity: 1,
    y: 0,
    x: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300,
    }
  }
});

/**
 * Optimistic message sending animation — instant appear with subtle pulse
 */
export const messageSending: Variants = {
  initial: {
    opacity: 0.7,
    y: 8,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 500,
      mass: 0.4,
    }
  }
};

/**
 * New message badge pop animation
 */
export const badgePop: Variants = {
  initial: { opacity: 0, scale: 0.5, y: 10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 400,
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -5,
    transition: { duration: 0.15 }
  }
};

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
  exit: { y: 100, opacity: 0, transition: { duration: 0.2 } }
};
