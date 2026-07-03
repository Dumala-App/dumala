import React from 'react';
import { motion, type Variants } from 'motion/react';
import { Zap } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface AetherFlowHeroProps {
  className?: string;
  badge?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  footnote?: React.ReactNode;
  /** Particle fill color (any canvas color string). */
  particleColor?: string;
  /** "r,g,b" triplet for the connection lines. */
  lineRGB?: string;
  /** "r,g,b" triplet for lines near the cursor. */
  highlightRGB?: string;
  showParticles?: boolean;
}

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.2 + 0.4,
      duration: 0.8,
      ease: 'easeInOut'
    }
  })
};

interface AetherFlowParticlesProps {
  className?: string;
  particleColor?: string;
  lineRGB?: string;
  highlightRGB?: string;
}

export const AetherFlowParticles = ({
  className,
  particleColor = 'rgba(255,148,74,0.85)',
  lineRGB = '255,179,126',
  highlightRGB = '255,255,255'
}: AetherFlowParticlesProps) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    let animationFrameId = 0;
    let particles: Particle[] = [];
    const mouse: { x: number | null; y: number | null; radius: number } = { x: null, y: null, radius: 200 };

    class Particle {
      constructor(
        public x: number,
        public y: number,
        public directionX: number,
        public directionY: number,
        public size: number,
        public color: string
      ) {}

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
      }

      update() {
        if (this.x > canvas.width || this.x < 0) {
          this.directionX = -this.directionX;
        }
        if (this.y > canvas.height || this.y < 0) {
          this.directionY = -this.directionY;
        }

        // Mouse collision detection — particles are gently pushed away
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < mouse.radius + this.size && distance > 0) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const force = (mouse.radius - distance) / mouse.radius;
            this.x -= forceDirectionX * force * 5;
            this.y -= forceDirectionY * force * 5;
          }
        }

        this.x += this.directionX;
        this.y += this.directionY;
        this.draw();
      }
    }

    const init = () => {
      particles = [];
      // Cap the count so very large screens don't explode the O(n²) connect pass
      const numberOfParticles = Math.min((canvas.height * canvas.width) / 9000, 200);
      for (let i = 0; i < numberOfParticles; i++) {
        const size = Math.random() * 2 + 1;
        const x = Math.random() * (canvas.width - size * 4) + size * 2;
        const y = Math.random() * (canvas.height - size * 4) + size * 2;
        const directionX = Math.random() * 0.4 - 0.2;
        const directionY = Math.random() * 0.4 - 0.2;
        particles.push(new Particle(x, y, directionX, directionY, size, particleColor));
      }
    };

    const connect = () => {
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          const distance =
            (particles[a].x - particles[b].x) * (particles[a].x - particles[b].x) +
            (particles[a].y - particles[b].y) * (particles[a].y - particles[b].y);

          if (distance < (canvas.width / 7) * (canvas.height / 7)) {
            const opacityValue = Math.max(0, 1 - distance / 20000);
            let strokeStyle = `rgba(${lineRGB},${opacityValue})`;

            if (mouse.x !== null && mouse.y !== null) {
              const dxMouse = particles[a].x - mouse.x;
              const dyMouse = particles[a].y - mouse.y;
              if (Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse) < mouse.radius) {
                strokeStyle = `rgba(${highlightRGB},${opacityValue})`;
              }
            }

            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    };

    // Transparent canvas: clear instead of painting a solid background so the
    // page's ambient gradients stay visible behind the particle network.
    const drawStaticFrame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => p.draw());
      connect();
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
      }
      connect();
    };

    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      init();
      if (reduceMotion) drawStaticFrame();
    };

    // Mouse coords translated into canvas space (the original used raw
    // clientX/Y, which drifts once the page scrolls).
    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
    };

    const handleMouseOut = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    if (reduceMotion) {
      return () => {
        window.removeEventListener('resize', resizeCanvas);
      };
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseOut);
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseOut);
      cancelAnimationFrame(animationFrameId);
    };
  }, [particleColor, lineRGB, highlightRGB]);

  return <canvas ref={canvasRef} aria-hidden="true" className={cn('absolute left-0 top-0 h-full w-full', className)} />;
};

const AetherFlowHero = ({
  className,
  badge,
  title,
  description,
  actions,
  footnote,
  particleColor = 'rgba(255,148,74,0.85)',
  lineRGB = '255,179,126',
  highlightRGB = '255,255,255',
  showParticles = true
}: AetherFlowHeroProps) => {
  return (
    <div className={cn('relative flex h-screen w-full flex-col items-center justify-center overflow-hidden', className)}>
      {showParticles ? (
        <AetherFlowParticles particleColor={particleColor} lineRGB={lineRGB} highlightRGB={highlightRGB} />
      ) : null}

      {/* Overlay content */}
      <div className="relative z-10 p-6 text-center">
        {badge ? (
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 backdrop-blur-sm"
            style={{ background: 'rgba(255,138,61,.08)', borderColor: 'rgba(255,138,61,.22)' }}
          >
            <Zap className="h-4 w-4" style={{ color: '#FFB37E' }} aria-hidden="true" />
            <span className="text-sm font-medium" style={{ color: '#DDE4EF' }}>{badge}</span>
          </motion.div>
        ) : null}

        <motion.h1
          custom={1}
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto mb-6 max-w-4xl text-4xl font-extrabold sm:text-6xl lg:text-7xl"
          style={{ fontFamily: "'Manrope', ui-sans-serif, sans-serif", letterSpacing: '-.035em', lineHeight: 1.05 }}
        >
          {title}
        </motion.h1>

        {description ? (
          <motion.p
            custom={2}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="mx-auto mb-10 max-w-2xl text-base sm:text-lg"
            style={{ color: '#8A96AD', lineHeight: 1.75 }}
          >
            {description}
          </motion.p>
        ) : null}

        {actions ? (
          <motion.div
            custom={3}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap items-center justify-center gap-3"
          >
            {actions}
          </motion.div>
        ) : null}

        {footnote ? (
          <motion.p
            custom={4}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="mt-5 text-xs"
            style={{ color: '#5C6880' }}
          >
            {footnote}
          </motion.p>
        ) : null}
      </div>
    </div>
  );
};

export default AetherFlowHero;
