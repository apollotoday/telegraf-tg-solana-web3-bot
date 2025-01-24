// initiate
export const initiateFromBottom = { opacity: 0, y: 150 }
export const initiateFromTop = { opacity: 0, y: -150 }
export const initiateFromLeft = { opacity: 0, x: -150 }
export const initiateFromRight = { opacity: 0, x: 150 }
export const initiateScale = { opacity: 0, scale: 0.8 } // Start smaller and invisible
export const initiateOpacity = { opacity: 0 } // Start invisible

// whileInView
export const whileInViewInXZero = { opacity: 1, x: 0 }
export const whileInViewInYZero = { opacity: 1, y: 0 }
export const whileInViewStatic = { opacity: 1, x: 0, y: 0 }
export const whileInViewWithBump = { scale: [0.8, 1.1, 1], opacity: [0, 1] }

// viewport
export const viewportHalf = { once: false, amount: 0.5 } // Trigger when 50% is visible
export const viewportFull = { once: false, amount: 1 } // Trigger when 100% is visible

// transition
export const transitionTween = { duration: 0.5, type: 'tween' }

// stagger
export const staggerChildren = {
  start: {},
  end: {
    transition: {
      staggerChildren: 0.5,
    },
  },
}

// fadeIn
export const fadeIn = {
  start: { opacity: 0 },
  end: {
    opacity: 1,
    transition: {
      duration: 0.7,
      ease: 'easeOut',
      when: 'beforeChildren',
    },
  },
  out: {
    opacity: 0,
    transition: {
      duration: 0.7,
      ease: 'easeIn',
    },
  },
}
