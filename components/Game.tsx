import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, Ball, Paddle, Brick, PowerUp, PowerUpType } from '../types';
import { audioService } from '../services/audioService';
import { getLevelIntro } from '../services/geminiService';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_START_WIDTH = 120;
const DEFAULT_PADDLE_SPEED = 9;

interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  life: number;
  color: string;
}

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game State
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [levelIntro, setLevelIntro] = useState<string>("");
  const [loading, setLoading] = useState(false);
  
  // Controls State
  const [isMobile, setIsMobile] = useState(false);

  // Mutable Game Objects (Refs for performance in game loop)
  const ballsRef = useRef<Ball[]>([]);
  const paddleRef = useRef<Paddle>({ x: CANVAS_WIDTH / 2 - 60, y: CANVAS_HEIGHT - 40, width: PADDLE_START_WIDTH, height: 20, color: '#3b82f6' });
  const paddleSpeedRef = useRef<number>(DEFAULT_PADDLE_SPEED);
  const bricksRef = useRef<Brick[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  
  // Input State
  const keysPressed = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const touchControls = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });

  // Detect Mobile on Mount
  useEffect(() => {
    const checkMobile = () => {
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobile(isTouch);
    };
    checkMobile();
  }, []);

  // --- Level Generation ---
  const generateLevel = useCallback((levelNum: number) => {
    const bricks: Brick[] = [];
    const cols = 9;
    const padding = 8;
    const width = (CANVAS_WIDTH - (cols + 1) * padding) / cols;
    const height = 30;
    
    // Level configurations
    let pattern: (r: number, c: number) => Brick['type'] | null = () => 'NORMAL';
    let rows = 4;
    let chars = ['🐺']; // Evil Wolf
    let colors = ['#f87171']; 

    // Theme: Super Pig vs Evil Wolves
    switch(levelNum) {
        case 1: // Invasion
            rows = 4;
            chars = ['🐺']; 
            colors = ['#94a3b8']; // Wolf Grey
            pattern = () => 'NORMAL';
            break;
        case 2: // Wolf Clones
            rows = 5;
            chars = ['🐺', '🐕']; 
            colors = ['#cbd5e1', '#64748b']; 
            pattern = (r, c) => (r + c) % 2 === 0 ? 'NORMAL' : null;
            break;
        case 3: // Sewers
            rows = 5;
            chars = ['🐺', '🐀']; 
            colors = ['#475569', '#1e293b'];
            pattern = (r, c) => Math.random() > 0.3 ? 'NORMAL' : null;
            break;
        case 4: // Robo-Wolves
            rows = 6;
            chars = ['🤖']; 
            colors = ['#9ca3af'];
            pattern = (r, c) => (c % 2 === 0 && r % 2 !== 0) ? 'HARD' : 'NORMAL';
            break;
        case 5: // Flying
            rows = 6;
            chars = ['🦅']; 
            colors = ['#60a5fa'];
            pattern = (r, c) => r % 2 === 0 ? 'NORMAL' : null;
            break;
        case 6: // Mini Wolves
            rows = 8;
            chars = ['🐺']; 
            colors = ['#ef4444'];
            pattern = () => Math.random() > 0.2 ? 'NORMAL' : null;
            break;
        case 7: // Hardened
            rows = 6;
            chars = ['🐺', '🤖'];
            colors = ['#fbbf24', '#f472b6'];
            pattern = () => Math.random() > 0.6 ? 'HARD' : 'NORMAL';
            break;
        case 8: // Fortress
            rows = 7;
            chars = ['🧱', '🐺']; 
            colors = ['#4b5563', '#a78bfa'];
            pattern = (r, c) => (c === 3 || c === 5) ? 'UNBREAKABLE' : 'NORMAL';
            break;
        case 9: // Chaos
            rows = 8;
            chars = ['🐺', '🤖', '🐀', '🦅'];
            colors = ['#fbbf24', '#f472b6', '#34d399', '#9ca3af'];
            pattern = () => Math.random() > 0.8 ? 'HARD' : 'NORMAL';
            break;
        case 10: // Alpha Wolf
            rows = 9;
            chars = ['👑', '🐺']; 
            colors = ['#f59e0b', '#fbbf24'];
            pattern = (r,c) => r === 0 ? 'HARD' : 'NORMAL';
            break;
        default:
            rows = 3;
            break;
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const pType = pattern(r, c);
        if (!pType) continue;

        let type = pType;
        if (type === 'UNBREAKABLE' && r === rows - 1) type = 'HARD'; 

        const charIndex = (r + c) % chars.length;
        const char = type === 'UNBREAKABLE' ? '🧱' : chars[charIndex];
        const color = type === 'UNBREAKABLE' ? '#374151' : colors[charIndex % colors.length];
        
        bricks.push({
          id: `b-${levelNum}-${r}-${c}`,
          x: padding + c * (width + padding),
          y: padding + 80 + r * (height + padding),
          width,
          height,
          type: type as Brick['type'],
          health: type === 'HARD' ? 2 : (type === 'UNBREAKABLE' ? 999 : 1),
          color,
          character: char,
          value: type === 'HARD' ? 200 : 100
        });
      }
    }
    bricksRef.current = bricks;
  }, []);

  const spawnParticles = useCallback((x: number, y: number, color: string) => {
    for (let i = 0; i < 12; i++) {
      particlesRef.current.push({
        x,
        y,
        dx: (Math.random() - 0.5) * 8,
        dy: (Math.random() - 0.5) * 8,
        life: 1.0,
        color: color
      });
    }
  }, []);

  const spawnPowerUp = (x: number, y: number) => {
    const rand = Math.random();
    let type = PowerUpType.MULTIBALL;
    let icon = '😽'; 

    if (rand < 0.20) { 
        type = PowerUpType.EXPAND; 
        icon = '🧃'; // Supah Juice
    } else if (rand < 0.40) { 
        type = PowerUpType.SHRINK; 
        icon = '⚡'; // Shrink Ray
    } else if (rand < 0.55) { 
        type = PowerUpType.EXTRA_LIFE; 
        icon = '🌭'; // Hot Dog (Life)
    } else if (rand < 0.70) {
        type = PowerUpType.SPEED_UP;
        icon = '🚀'; // Rocket
    } else { 
        type = PowerUpType.MULTIBALL; 
        icon = '🐷'; // Super Pig (Multiball)
    }

    powerUpsRef.current.push({
      id: Math.random().toString(36),
      x, y, width: 30, height: 30, dy: 3, type, icon
    });
  };

  const resetBall = useCallback(() => {
    ballsRef.current = [{
      id: 'main',
      x: paddleRef.current.x + paddleRef.current.width / 2,
      y: paddleRef.current.y - 20,
      radius: 10,
      dx: 0, // Starts stuck to paddle
      dy: 0,
      active: true,
      color: '#f472b6', // Pig Pink
      trail: []
    }];
  }, []);

  // Determine ball speed based on level (Slower for levels 1-4)
  const getBallSpeed = useCallback(() => {
    return level <= 4 ? 5 : 8;
  }, [level]);

  const launchBall = useCallback(() => {
    // Only launch if the first ball is stuck
    if (ballsRef.current.length > 0 && ballsRef.current[0].dx === 0 && ballsRef.current[0].dy === 0) {
      const speed = getBallSpeed();
      // Launch all stuck balls
      ballsRef.current.forEach(b => {
         if (b.dx === 0 && b.dy === 0) {
            b.dx = (Math.random() * 4 - 2);
            b.dy = -speed;
         }
      });
      audioService.playDogBark();
    }
  }, [level, getBallSpeed]);

  const togglePause = useCallback(() => {
    if (gameState === GameState.PLAYING) {
        setGameState(GameState.PAUSED);
    } else if (gameState === GameState.PAUSED) {
        setGameState(GameState.PLAYING);
    }
  }, [gameState]);

  const handleExit = useCallback(() => {
    audioService.stopBGM();
    setGameState(GameState.MENU);
  }, []);

  // --- Keyboard Controls ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (gameState !== GameState.PLAYING) {
             if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') togglePause();
             return;
        }
        
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            keysPressed.current.left = true;
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            keysPressed.current.right = true;
        }
        if (e.code === 'Space') {
            launchBall();
        }
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
            togglePause();
        }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            keysPressed.current.left = false;
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            keysPressed.current.right = false;
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, launchBall, togglePause]);

  // --- Game Loop ---
  const update = useCallback((time: number) => {
    // Exit if not playing or dying
    if (gameState !== GameState.PLAYING && gameState !== GameState.DYING) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    // Only update physics if PLAYING
    if (gameState === GameState.PLAYING) {
      // 1. Move Paddle (Keyboard or Touch)
      const p = paddleRef.current;
      const speed = paddleSpeedRef.current;
      
      if (keysPressed.current.left || touchControls.current.left) {
          p.x -= speed;
          if (p.x < 0) p.x = 0;
      }
      if (keysPressed.current.right || touchControls.current.right) {
          p.x += speed;
          if (p.x + p.width > CANVAS_WIDTH) p.x = CANVAS_WIDTH - p.width;
      }
      
      // Update sticky ball position if moving paddle
      ballsRef.current.forEach(ball => {
          if (ball.dx === 0 && ball.dy === 0) {
              ball.x = p.x + p.width / 2;
          }
      });

      // 2. Move PowerUps
      for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
        const pu = powerUpsRef.current[i];
        pu.y += pu.dy;

        // Collision with Paddle
        if (
          pu.x < p.x + p.width &&
          pu.x + pu.width > p.x &&
          pu.y < p.y + p.height &&
          pu.y + pu.height > p.y
        ) {
          // Activate PowerUp
          audioService.playPowerUp();
          if (pu.type === PowerUpType.EXPAND) p.width = Math.min(p.width + 40, 300);
          if (pu.type === PowerUpType.SHRINK) p.width = Math.max(p.width - 30, 60);
          if (pu.type === PowerUpType.EXTRA_LIFE) setLives(prev => prev + 1);
          if (pu.type === PowerUpType.SPEED_UP) paddleSpeedRef.current = Math.min(paddleSpeedRef.current + 4, 20); // Increase speed, cap at 20
          if (pu.type === PowerUpType.MULTIBALL) {
            // Spawn 2 more balls
            if (ballsRef.current.length > 0) {
              const base = ballsRef.current.find(b => b.active) || ballsRef.current[0];
              let baseDy = base.dy;
              const currentLevelSpeed = getBallSpeed();
              if (Math.abs(baseDy) < 1) baseDy = -currentLevelSpeed;

              let newDy1 = baseDy; 
              let newDy2 = baseDy;
              if (Math.abs(newDy1) < 1) newDy1 = -3;
              if (Math.abs(newDy2) < 1) newDy2 = -3;

              ballsRef.current.push(
                { ...base, id: Math.random().toString(), dx: base.dx + 2, dy: newDy1, color: '#fca5a5', trail: [] },
                { ...base, id: Math.random().toString(), dx: base.dx - 2, dy: newDy2, color: '#93c5fd', trail: [] }
              );
            }
          }
          powerUpsRef.current.splice(i, 1);
        } else if (pu.y > CANVAS_HEIGHT) {
          powerUpsRef.current.splice(i, 1);
        }
      }

      // 3. Move Balls & Collisions
      let activeBalls = 0;
      const maxSpeed = level <= 4 ? 10 : 15; // Cap max speed based on level

      ballsRef.current.forEach(ball => {
        if (!ball.active) return;
        
        // Update Trail
        if (Math.abs(ball.dx) > 0 || Math.abs(ball.dy) > 0) {
          ball.trail.push({ x: ball.x, y: ball.y });
          if (ball.trail.length > 15) { // Keep last 15 positions
              ball.trail.shift();
          }
        }

        // Sticky Ball check (start of life)
        if (ball.dx === 0 && ball.dy === 0) {
          ball.x = p.x + p.width / 2;
          ball.y = p.y - ball.radius - 2;
          activeBalls++;
          return;
        }

        ball.x += ball.dx;
        ball.y += ball.dy;

        // Wall Collisions
        if (ball.x + ball.radius > CANVAS_WIDTH) { ball.x = CANVAS_WIDTH - ball.radius; ball.dx *= -1; audioService.playHit('wall'); }
        if (ball.x - ball.radius < 0) { ball.x = ball.radius; ball.dx *= -1; audioService.playHit('wall'); }
        if (ball.y - ball.radius < 0) { ball.y = ball.radius; ball.dy *= -1; audioService.playHit('wall'); }
        
        if (Math.abs(ball.dy) < 0.2) {
            ball.dy = ball.dy >= 0 ? 1 : -1;
        }

        // Bottom Collision (Death of a ball)
        if (ball.y - ball.radius > CANVAS_HEIGHT) {
          ball.active = false;
        } else {
          activeBalls++;
        }

        // Paddle Collision
        if (
          ball.y + ball.radius > p.y &&
          ball.y - ball.radius < p.y + p.height &&
          ball.x + ball.radius > p.x &&
          ball.x - ball.radius < p.x + p.width
        ) {
          let collidePoint = ball.x - (p.x + p.width / 2);
          collidePoint = collidePoint / (p.width / 2);
          const angle = collidePoint * (Math.PI / 3); 

          const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
          const newSpeed = Math.min(speed * 1.02, maxSpeed);

          ball.dx = newSpeed * Math.sin(angle);
          ball.dy = -newSpeed * Math.cos(angle);
          ball.y = p.y - ball.radius; 
          audioService.playHit('paddle');
        }

        // Brick Collision
        let hitBrick = false;
        for (const brick of bricksRef.current) {
          if (hitBrick) break; 
          if (brick.health <= 0 && brick.type !== 'UNBREAKABLE') continue;
          
          if (
            ball.x + ball.radius > brick.x &&
            ball.x - ball.radius < brick.x + brick.width &&
            ball.y + ball.radius > brick.y &&
            ball.y - ball.radius < brick.y + brick.height
          ) {
            const overlapLeft = (ball.x + ball.radius) - brick.x;
            const overlapRight = (brick.x + brick.width) - (ball.x - ball.radius);
            const overlapTop = (ball.y + ball.radius) - brick.y;
            const overlapBottom = (brick.y + brick.height) - (ball.y - ball.radius);

            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

            if (minOverlap === overlapLeft || minOverlap === overlapRight) {
              ball.dx *= -1;
            } else {
              ball.dy *= -1;
            }

            audioService.playHit('brick');
            hitBrick = true;
            
            if (brick.type !== 'UNBREAKABLE') {
              brick.health--;
              spawnParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color);
              if (brick.health <= 0) {
                setScore(s => s + brick.value);
                if (Math.random() < 0.15) {
                  spawnPowerUp(brick.x + brick.width/2, brick.y + brick.height/2);
                }
              }
            }
          }
        }
      });
      
      const remainingBricks = bricksRef.current.filter(b => b.type !== 'UNBREAKABLE' && b.health > 0).length;
      if (remainingBricks === 0) {
         handleLevelComplete();
         return; 
      }

      if (activeBalls === 0) {
        if (lives > 1) {
          setLives(l => l - 1);
          resetBall(); // Only reset to 1 ball if we lose life
          audioService.playLoseLife();
        } else {
          // Trigger DYING sequence
          // We are in PLAYING state, so we can transition to DYING
          setLives(0);
          setGameState(GameState.DYING);
          audioService.playGameOverStinger();
          
          // Dramatic Paddle Explosion
          const px = paddleRef.current.x + paddleRef.current.width/2;
          const py = paddleRef.current.y + paddleRef.current.height/2;
          spawnParticles(px, py, '#ec4899');
          spawnParticles(px, py, '#fbcfe8');
          spawnParticles(px, py, '#000000');
          spawnParticles(px + 20, py, '#ec4899');
          spawnParticles(px - 20, py, '#ec4899');
          
          // Transition to Game Over after delay
          setTimeout(() => {
              setGameState(GameState.GAME_OVER);
          }, 2500);
          
          return;
        }
      }
    }

    // 4. Update Particles (Run even if DYING)
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.dx;
      p.y += p.dy;
      p.life -= 0.05;
      if (p.life <= 0) {
        particlesRef.current.splice(i, 1);
      }
    }

    animationFrameRef.current = requestAnimationFrame(update);
  }, [gameState, lives, resetBall, level, getBallSpeed, spawnParticles]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Background
    ctx.fillStyle = '#f0f9ff'; 
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw Grid hint 
    ctx.fillStyle = '#e0f2fe';
    for(let i=0; i<CANVAS_WIDTH; i+=20) {
        for(let j=0; j<CANVAS_HEIGHT; j+=20) {
            if((i+j)%40 === 0) ctx.fillRect(i,j,2,2);
        }
    }

    // Draw Bricks
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    bricksRef.current.forEach(b => {
      if (b.health > 0 || b.type === 'UNBREAKABLE') {
        ctx.fillStyle = b.color;
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(b.x + 4, b.y + 4, b.width, b.height);
        
        // Main block
        ctx.fillStyle = b.color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.strokeRect(b.x, b.y, b.width, b.height);
        
        // Character
        ctx.fillStyle = '#000';
        ctx.fillText(b.character, b.x + b.width / 2, b.y + b.height / 2 + 2);

        // Cracks
        if (b.type === 'HARD' && b.health === 1) {
             ctx.strokeStyle = '#fff';
             ctx.beginPath();
             ctx.moveTo(b.x + 5, b.y + 5);
             ctx.lineTo(b.x + b.width - 5, b.y + b.height - 5);
             ctx.moveTo(b.x + b.width - 5, b.y + 5);
             ctx.lineTo(b.x + 5, b.y + b.height - 5);
             ctx.stroke();
        }
      }
    });

    // Draw Particles
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Draw Paddle - Hide if DYING (Paddle Exploded)
    if (gameState !== GameState.DYING) {
        const p = paddleRef.current;
        ctx.fillStyle = '#ec4899'; // Super Pig Pink
        
        // Paddle Body
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.width, p.height, 10);
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000';
        ctx.stroke();

        // Pig details (Ears/Snout style)
        ctx.fillStyle = '#fbcfe8'; 
        ctx.beginPath();
        ctx.arc(p.x + 15, p.y + 5, 5, 0, Math.PI*2);
        ctx.fill();
        
        ctx.fillStyle = '#fbcfe8'; 
        ctx.beginPath();
        ctx.arc(p.x + p.width - 15, p.y + 5, 5, 0, Math.PI*2);
        ctx.fill();
        
        ctx.fillStyle = '#f472b6'; // Snout
        ctx.beginPath();
        ctx.ellipse(p.x + p.width/2, p.y + p.height/2, 10, 6, 0, 0, Math.PI*2);
        ctx.fill();
    }

    // Draw Balls & Trails
    ballsRef.current.forEach(ball => {
      if (!ball.active) return;

      // Draw Trail
      if (ball.trail) {
        ball.trail.forEach((pos, index) => {
            const alpha = (index + 1) / ball.trail.length; // Fade in towards head
            const size = ball.radius * (alpha * 0.8); // Smaller at tail
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
            ctx.fillStyle = ball.color;
            ctx.globalAlpha = alpha * 0.4;
            ctx.fill();
            ctx.globalAlpha = 1.0;
        });
      }

      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = ball.color;
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Shine
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ball.x - 3, ball.y - 3, 3, 0, Math.PI*2);
      ctx.fill();
    });

    // Draw PowerUps
    powerUpsRef.current.forEach(pu => {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(pu.x + 15, pu.y + 15, 18, 0, Math.PI*2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#000';
      ctx.font = '24px Arial';
      ctx.fillText(pu.icon, pu.x + 15, pu.y + 15);
    });

  }, [gameState]);

  // Animation Loop Setup
  useEffect(() => {
    // Run update loop if PLAYING or DYING
    if (gameState === GameState.PLAYING || gameState === GameState.DYING) {
      lastTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(update);
    }
    // Draw loop still runs
    const interval = setInterval(draw, 1000 / 60);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      clearInterval(interval);
    };
  }, [gameState, update, draw]);

  const handleLevelComplete = () => {
    if (level >= 10) {
      setGameState(GameState.VICTORY);
      audioService.stopBGM();
    } else {
      setLevel(l => l + 1);
      setGameState(GameState.LOADING_LEVEL);
    }
  };

  // State transitions
  useEffect(() => {
    const loadLevel = async () => {
      if (gameState === GameState.LOADING_LEVEL) {
        setLoading(true);
        // Important: We DO NOT reset lives here. They persist.
        // We also check for active balls to persist them.
        
        const survivingBalls = ballsRef.current.filter(b => b.active);
        
        if (survivingBalls.length > 0 && level > 1) { // If persist from previous level
             // Reposition to paddle for next start
             ballsRef.current = survivingBalls.map((b, i) => ({
                 ...b,
                 x: paddleRef.current.x + paddleRef.current.width / 2,
                 y: paddleRef.current.y - 20, 
                 dx: 0, 
                 dy: 0,
                 trail: []
             }));
        } else {
            resetBall();
        }
        
        powerUpsRef.current = [];
        particlesRef.current = []; // Reset particles
        paddleSpeedRef.current = DEFAULT_PADDLE_SPEED; // Reset paddle speed per level
        
        audioService.updateBGMForLevel(level);

        const intro = await getLevelIntro(level);
        setLevelIntro(intro);
        generateLevel(level);
        
        setLoading(false);
      }
    };
    loadLevel();
  }, [gameState, level, generateLevel, resetBall]);

  const startGame = () => {
    setGameState(GameState.LOADING_LEVEL);
    setScore(0);
    setLives(3); // Only reset lives on full restart
    setLevel(1);
    paddleRef.current.width = PADDLE_START_WIDTH; // Reset paddle only on new game
    paddleSpeedRef.current = DEFAULT_PADDLE_SPEED;
    audioService.startBGM();
  };

  const nextLevelStart = () => {
    setGameState(GameState.PLAYING);
    audioService.playDogBark();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-pink-100 font-sans relative overflow-hidden select-none pb-4">
      <style>{`
        @keyframes shake {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          10% { transform: translate(-1px, -2px) rotate(-1deg); }
          20% { transform: translate(-3px, 0px) rotate(1deg); }
          30% { transform: translate(3px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          70% { transform: translate(3px, 1px) rotate(-1deg); }
          80% { transform: translate(-1px, -1px) rotate(1deg); }
          90% { transform: translate(1px, 2px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
        .shake-anim {
          animation: shake 0.5s;
          animation-iteration-count: infinite;
        }
      `}</style>
      
      {/* HUD */}
      <div className="w-full max-w-[800px] flex justify-between items-center bg-pink-600 text-white p-4 rounded-t-xl border-4 border-black z-10 shadow-lg gap-2 sm:gap-4">
        <div className="text-xl sm:text-2xl font-bold font-comic">SCORE: {score}</div>
        <div className="text-2xl sm:text-3xl font-black text-yellow-300">LEVEL {level}</div>
        <div className="flex items-center gap-2 sm:gap-4">
             <div className="text-xl sm:text-2xl font-bold">LIVES: {'🐷'.repeat(lives)}</div>
             {gameState === GameState.PLAYING && (
                 <button 
                    onClick={togglePause}
                    className="ml-2 sm:ml-4 px-3 py-1 bg-yellow-400 text-black border-2 border-black rounded hover:bg-yellow-500 font-bold"
                 >
                    ⏸️
                 </button>
             )}
        </div>
      </div>

      {/* Game Canvas Container */}
      <div className={`relative w-full max-w-[800px] border-4 border-black bg-white shadow-2xl touch-none ${gameState === GameState.DYING ? 'shake-anim' : ''}`}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="block w-full h-auto"
        />

        {/* Overlays */}
        {gameState === GameState.MENU && (
          <div className="absolute inset-0 bg-pink-500/90 flex flex-col items-center justify-center text-white px-4 text-center">
            <h1 className="text-5xl sm:text-7xl font-black mb-4 drop-shadow-md text-yellow-300 tracking-tighter" style={{ textShadow: '4px 4px 0 #000' }}>SUPER PIG</h1>
            <h2 className="text-2xl sm:text-4xl font-bold mb-8 text-white drop-shadow-md" style={{ textShadow: '2px 2px 0 #000' }}>vs EVIL WOLVES PINBALL</h2>
            <button 
              onClick={startGame}
              className="px-6 py-3 sm:px-8 sm:py-4 bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-xl sm:text-2xl rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-1 active:shadow-none"
            >
              PLAY NOW!
            </button>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center">
                 <p className="text-lg font-medium">Controls:</p>
                 <button 
                    onClick={() => setIsMobile(!isMobile)}
                    className="px-4 py-2 bg-white text-black font-bold rounded border-2 border-black"
                 >
                    {isMobile ? "📱 Mobile Mode" : "💻 PC Mode"}
                 </button>
            </div>
            {!isMobile && <p className="mt-2 text-xs sm:text-sm font-medium">Arrow Keys to Move • Spacebar to Launch • P to Pause</p>}
          </div>
        )}

        {gameState === GameState.PAUSED && (
           <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-sm z-30 px-4">
                <h2 className="text-4xl sm:text-6xl font-black mb-8 text-yellow-300 tracking-wider" style={{ textShadow: '3px 3px 0 #000' }}>PAUSED</h2>
                <div className="flex gap-4">
                    <button 
                        onClick={togglePause}
                        className="px-6 py-2 sm:px-8 sm:py-3 bg-green-500 hover:bg-green-600 text-white font-bold text-xl sm:text-2xl rounded-lg border-4 border-black shadow-lg"
                    >
                        RESUME
                    </button>
                    <button 
                        onClick={handleExit}
                        className="px-6 py-2 sm:px-8 sm:py-3 bg-red-500 hover:bg-red-600 text-white font-bold text-xl sm:text-2xl rounded-lg border-4 border-black shadow-lg"
                    >
                        EXIT
                    </button>
                </div>
           </div>
        )}

        {gameState === GameState.DYING && (
           <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-500/20 backdrop-blur-sm">
                <h1 className="text-8xl sm:text-9xl font-black text-red-600 drop-shadow-[4px_4px_0_#000] animate-pulse scale-110">OH NO!</h1>
           </div>
        )}

        {gameState === GameState.LOADING_LEVEL && (
           <div className="absolute inset-0 bg-yellow-400 flex flex-col items-center justify-center text-black p-4 sm:p-8 text-center">
             {loading ? (
                <div className="text-2xl sm:text-4xl font-bold animate-pulse">Summoning Super Pig & Writing Story...</div>
             ) : (
               <>
                <h2 className="text-4xl sm:text-6xl font-black mb-6 drop-shadow-sm text-white" style={{ textShadow: '3px 3px 0 #000' }}>LEVEL {level}</h2>
                <div className="bg-white p-4 sm:p-6 rounded-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 max-w-lg transform -rotate-1">
                  <p className="text-xl sm:text-2xl font-bold italic font-serif leading-relaxed">"{levelIntro}"</p>
                </div>
                <button 
                  onClick={nextLevelStart}
                  className="px-6 py-3 sm:px-8 sm:py-3 bg-green-500 hover:bg-green-600 text-white font-bold text-xl sm:text-2xl rounded-lg border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  GO!
                </button>
                <p className="mt-4 text-xs sm:text-sm font-bold opacity-75">Tip: {isMobile ? "Tap Sides to Move!" : "Use Arrow Keys!"}</p>
               </>
             )}
           </div>
        )}

        {gameState === GameState.GAME_OVER && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-white px-4 text-center z-50">
            <h2 className="text-5xl sm:text-7xl font-black text-red-600 mb-2 tracking-widest" style={{ textShadow: '4px 4px 0 #fff' }}>GAME OVER</h2>
            <p className="text-xl sm:text-2xl mb-8 font-comic text-gray-300">The Wolves Won...</p>
            
            <div className="bg-gray-800 p-6 rounded-xl border-4 border-gray-600 mb-8 shadow-2xl">
                <p className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-2">FINAL SCORE</p>
                <p className="text-4xl sm:text-6xl font-black text-white">{score}</p>
            </div>

            <button 
              onClick={() => setGameState(GameState.MENU)}
              className="px-8 py-4 bg-white hover:bg-gray-200 text-black font-black text-2xl rounded-full border-4 border-gray-500 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)] transition-transform active:translate-y-1 active:shadow-none mb-12"
            >
              TRY AGAIN
            </button>
            
            <div className="mt-auto mb-8">
                <p className="text-lg sm:text-xl font-bold text-gray-500 font-comic">Created by J.Kang & 5914 Production</p>
            </div>
          </div>
        )}

        {gameState === GameState.VICTORY && (
          <div className="absolute inset-0 bg-yellow-300 flex flex-col items-center justify-center text-black animate-bounce px-4 text-center">
            <h2 className="text-4xl sm:text-6xl font-black mb-4 text-blue-600" style={{ textShadow: '4px 4px 0 #000' }}>YOU WIN!</h2>
            <p className="text-2xl sm:text-3xl mb-8 font-bold">Super Pig Saved the Day!</p>
            <p className="text-xl sm:text-2xl mb-8">Score: {score}</p>
            <button 
              onClick={() => setGameState(GameState.MENU)}
              className="px-8 py-4 bg-purple-500 text-white font-bold text-xl sm:text-2xl rounded-full border-4 border-black mb-12"
            >
              Play Again
            </button>
            <div className="mt-auto mb-8">
                <p className="text-lg sm:text-xl font-bold text-gray-700 font-comic">Created by J.Kang & 5914 Production</p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Control Bar - Dedicated Area */}
      {gameState === GameState.PLAYING && isMobile && (
        <div className="w-full max-w-[800px] bg-gray-900 border-x-4 border-b-4 border-black p-4 flex justify-between items-center gap-4 touch-none select-none">
            {/* Left Button */}
            <button 
                className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-600 rounded-full border-4 border-gray-400 active:bg-gray-500 flex items-center justify-center shadow-lg transition-transform active:scale-95"
                onTouchStart={(e) => { e.preventDefault(); touchControls.current.left = true; }}
                onTouchEnd={(e) => { e.preventDefault(); touchControls.current.left = false; }}
                onTouchCancel={(e) => { e.preventDefault(); touchControls.current.left = false; }}
                onMouseDown={(e) => { e.preventDefault(); touchControls.current.left = true; }}
                onMouseUp={(e) => { e.preventDefault(); touchControls.current.left = false; }}
                onMouseLeave={(e) => { e.preventDefault(); touchControls.current.left = false; }}
            >
                <span className="text-4xl">⬅️</span>
            </button>

            {/* Launch Button */}
             <button 
                className="flex-1 h-16 sm:h-20 bg-red-500 rounded-2xl border-4 border-red-700 active:bg-red-600 flex items-center justify-center shadow-lg transition-transform active:scale-95 mx-2"
                onTouchStart={(e) => { e.preventDefault(); launchBall(); }}
                onMouseDown={(e) => { e.preventDefault(); launchBall(); }}
            >
                <span className="text-xl sm:text-2xl font-black text-white tracking-widest">LAUNCH</span>
            </button>

            {/* Right Button */}
            <button 
                className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-600 rounded-full border-4 border-gray-400 active:bg-gray-500 flex items-center justify-center shadow-lg transition-transform active:scale-95"
                onTouchStart={(e) => { e.preventDefault(); touchControls.current.right = true; }}
                onTouchEnd={(e) => { e.preventDefault(); touchControls.current.right = false; }}
                onTouchCancel={(e) => { e.preventDefault(); touchControls.current.right = false; }}
                onMouseDown={(e) => { e.preventDefault(); touchControls.current.right = true; }}
                onMouseUp={(e) => { e.preventDefault(); touchControls.current.right = false; }}
                onMouseLeave={(e) => { e.preventDefault(); touchControls.current.right = false; }}
            >
                <span className="text-4xl">➡️</span>
            </button>
        </div>
      )}

      <div className="mt-4 text-gray-700 font-bold bg-white p-2 rounded border-2 border-black shadow-md text-center w-full max-w-[800px] text-xs sm:text-base">
        Items: 🐷 Multiball | 🧃 Expand | ⚡ Shrink | 🚀 Speed Up | 🌭 1-Up
      </div>
    </div>
  );
};

export default Game;