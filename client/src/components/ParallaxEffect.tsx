/**
 * ParallaxEffect.tsx
 * 
 * Reusable parallax scroll components for the Student Accommodation Safety Platform
 * 
 * Components:
 * - useScrollReveal: Hook for fade-in animations on scroll
 * - useParallax: Hook for smooth parallax scrolling effect
 * - ScrollReveal: Wrapper component for reveal animations
 * - StaggerReveal: Wrapper for staggered child animations
 * - ParallaxContainer: Container for parallax backgrounds
 */

import { useEffect, useRef, useState, ReactNode, Children } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// useScrollReveal Hook
// ─────────────────────────────────────────────────────────────────────────────
interface UseScrollRevealOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean; // Default: true
}

export function useScrollReveal(options?: UseScrollRevealOptions) {
  const { freezeOnceVisible = true, ...observerOptions } = options || {};
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (freezeOnceVisible) {
            obs.unobserve(el);
          }
        } else if (!freezeOnceVisible) {
          setVisible(false);
        }
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
        ...observerOptions,
      }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [freezeOnceVisible, observerOptions]);

  return { ref, visible };
}

// ─────────────────────────────────────────────────────────────────────────────
// useParallax Hook
// ─────────────────────────────────────────────────────────────────────────────
export function useParallax(speed = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const raf = useRef<number>(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Only run parallax when element is near viewport
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: '200px' }
    );
    visibilityObserver.observe(el);

    const tick = () => {
      if (isVisible && ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const center = rect.top + rect.height / 2 - window.innerHeight / 2;
        const offset = center * speed;
        ref.current.style.transform = `translateY(${offset}px)`;
      }
      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf.current);
      visibilityObserver.disconnect();
    };
  }, [speed, isVisible]);

  return ref;
}

// ─────────────────────────────────────────────────────────────────────────────
// ScrollReveal Component
// ─────────────────────────────────────────────────────────────────────────────
interface ScrollRevealProps {
  children: ReactNode;
  delay?: number; // ms
  distance?: number; // px
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number; // seconds
  className?: string;
  style?: React.CSSProperties;
}

export function ScrollReveal({
  children,
  delay = 0,
  distance = 24,
  direction = 'up',
  duration = 0.65,
  className = '',
  style,
}: ScrollRevealProps) {
  const { ref, visible } = useScrollReveal();

  const getTransform = (isVisible: boolean) => {
    if (isVisible) return 'translate(0, 0)';

    switch (direction) {
      case 'down':
        return `translateY(-${distance}px)`;
      case 'left':
        return `translateX(${distance}px)`;
      case 'right':
        return `translateX(-${distance}px)`;
      case 'up':
      default:
        return `translateY(${distance}px)`;
    }
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: getTransform(visible),
        transition: `opacity ${duration}s cubic-bezier(.22,.68,0,1.2) ${delay}ms, transform ${duration}s cubic-bezier(.22,.68,0,1.2) ${delay}ms`,
        willChange: 'opacity, transform',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StaggerReveal Component
// ─────────────────────────────────────────────────────────────────────────────
interface StaggerRevealProps {
  children: ReactNode;
  stagger?: number; // ms between each child
  distance?: number; // px
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number; // seconds
  className?: string;
}

export function StaggerReveal({
  children,
  stagger = 80,
  distance = 20,
  direction = 'up',
  duration = 0.55,
  className = '',
}: StaggerRevealProps) {
  const { ref, visible } = useScrollReveal();
  const childArray = Children.toArray(children);

  const getTransform = (isVisible: boolean) => {
    if (isVisible) return 'translate(0, 0)';

    switch (direction) {
      case 'down':
        return `translateY(-${distance}px)`;
      case 'left':
        return `translateX(${distance}px)`;
      case 'right':
        return `translateX(-${distance}px)`;
      case 'up':
      default:
        return `translateY(${distance}px)`;
    }
  };

  return (
    <div ref={ref} className={className}>
      {childArray.map((child, i) => (
        <div
          key={i}
          style={{
            opacity: visible ? 1 : 0,
            transform: getTransform(visible),
            transition: `opacity ${duration}s cubic-bezier(.22,.68,0,1.2) ${i * stagger}ms, transform ${duration}s cubic-bezier(.22,.68,0,1.2) ${i * stagger}ms`,
            willChange: 'opacity, transform',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ParallaxContainer Component (for background images)
// ─────────────────────────────────────────────────────────────────────────────
interface ParallaxContainerProps {
  children: ReactNode;
  speed?: number; // 0.1 (slow) to 1 (fast)
  className?: string;
  style?: React.CSSProperties;
}

export function ParallaxContainer({
  children,
  speed = 0.3,
  className = '',
  style,
}: ParallaxContainerProps) {
  const ref = useParallax(speed);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div ref={ref} style={{ ...style }}>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FadeIn Component (simple opacity fade)
// ─────────────────────────────────────────────────────────────────────────────
interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.6,
  className = '',
}: FadeInProps) {
  const { ref, visible } = useScrollReveal();

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transition: `opacity ${duration}s ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ScaleIn Component (scale + fade effect)
// ─────────────────────────────────────────────────────────────────────────────
interface ScaleInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  scale?: number; // initial scale (0.8 - 1.0)
  className?: string;
}

export function ScaleIn({
  children,
  delay = 0,
  duration = 0.6,
  scale = 0.9,
  className = '',
}: ScaleInProps) {
  const { ref, visible } = useScrollReveal();

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : `scale(${scale})`,
        transition: `opacity ${duration}s cubic-bezier(.22,.68,0,1.2) ${delay}ms, transform ${duration}s cubic-bezier(.22,.68,0,1.2) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}