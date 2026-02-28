// Blob - Main character rendering and behavior

class Blob {
  constructor(canvas, state, animations) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = state;
    this.animations = animations;
    
    // Position
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    this.targetX = this.x;
    this.targetY = this.y;
    
    // Physics
    this.vx = 0;
    this.vy = 0;
    this.gravity = 0.5;
    this.friction = 0.9;
    
    // Animation state
    this.scaleX = 1;
    this.scaleY = 1;
    this.rotation = 0;
    
    // Current action
    this.action = 'idle';
    this.actionTimer = 0;
    
    // Custom color
    this.customColor = null;
    
    // Ambient idle animation
    this.idleTime = 0;
    this.idleWobble = 0;
    this.idleBreathPhase = 0;
    
    // Micro-interaction states
    this.isHappy = false;
    this.isTired = false;
    this.isHungry = false;
  }

  resize() {
    this.x = this.canvas.width / 2;
    this.y = this.canvas.height / 2;
    this.targetX = this.x;
    this.targetY = this.y;
  }

  handleGesture(gesture, zone) {
    const energy = this.state.getEnergyLevel();
    const jumpMultiplier = energy > 30 ? 1 : 0.5;
    const app = window.app;
    
    switch (gesture) {
      case 'tap':
        if (zone === 'top') {
          this.jump(jumpMultiplier);
          // Particle effect on jump
          if (app && app.particles) app.particles.jumpEffect(this.x, this.y);
        } else if (zone === 'bottom') {
          this.splat();
          // Particle effect + screen shake on splat
          if (app && app.particles) app.particles.splatEffect(this.x, this.y);
          if (app && app.screenShake) app.screenShake.shake(15);
        } else {
          this.bounce();
        }
        break;
        
      case 'doubletap':
        this.jump(1.5 * jumpMultiplier);
        if (app && app.particles) app.particles.jumpEffect(this.x, this.y);
        break;
        
      case 'swipe':
        if (zone === 'left') this.slide(-1);
        else if (zone === 'right') this.slide(1);
        else {
          this.jump(jumpMultiplier);
          if (app && app.particles) app.particles.jumpEffect(this.x, this.y);
        }
        break;
        
      case 'longpress':
        this.squish();
        // Particle effect on squish
        if (app && app.particles) app.particles.squishEffect(this.x, this.y);
        break;
    }
  }

  jump(multiplier = 1) {
    if (this.action !== 'idle') return;
    
    this.action = 'jump';
    this.vy = -15 * multiplier;
    this.animations.setAnimation('jump');
    this.state.interact('jump');
    this.actionTimer = 500;
    
    // Micro-interaction: sparkles on jump
    if (window.app && window.app.ui) {
      window.app.ui.showFeedback('🎉', 'center');
      window.app.ui.spawnSparkles(this.x, this.y - 60, 4);
    }
  }

  splat() {
    if (this.action !== 'idle') return;
    
    this.action = 'splat';
    this.scaleY = 0.5;
    this.scaleX = 1.5;
    this.animations.setAnimation('splat');
    this.state.interact('splat');
    this.actionTimer = 300;
    
    // Micro-interaction
    if (window.app && window.app.ui) {
      window.app.ui.showFeedback('💥', 'center');
    }
  }

  slide(direction) {
    if (this.action !== 'idle') return;
    
    this.action = 'slide';
    this.vx = direction * 10;
    this.animations.setAnimation('slide');
    this.state.interact('slide');
    this.actionTimer = 400;
    
    // Micro-interaction
    if (window.app && window.app.ui) {
      window.app.ui.showFeedback(direction > 0 ? '💨→' : '←💨', 'center');
    }
  }

  squish() {
    if (this.action !== 'idle') return;
    
    this.action = 'squish';
    this.scaleX = 1.3;
    this.scaleY = 0.7;
    this.state.interact('squish');
    this.actionTimer = 500;
    
    // Micro-interaction: hearts for squish
    if (window.app && window.app.ui) {
      window.app.ui.showFeedback('❤️', 'center');
      window.app.ui.spawnFloatingHearts(3);
    }
  }

  bounce() {
    this.scaleY = 0.9;
    this.scaleX = 1.1;
    
    // Tiny interaction feedback
    if (window.app && window.app.ui) {
      window.app.ui.spawnSparkles(this.x, this.y - 40, 2);
    }
  }

  update(deltaTime) {
    // Update mood states
    const mood = this.state.stats.mood;
    const energy = this.state.stats.energy;
    const hunger = this.state.stats.hunger;
    
    this.isHappy = mood > 80 && energy > 40;
    this.isTired = energy < 30;
    this.isHungry = hunger > 80;
    
    // Ambient idle animations based on stats
    if (this.action === 'idle') {
      this.updateIdleAnimation(deltaTime, mood, energy, hunger);
    }
    
    // Physics
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    
    // Ground collision
    const groundY = this.canvas.height * 0.7;
    if (this.y > groundY) {
      this.y = groundY;
      
      if (this.vy > 5) {
        // Landed from jump - small splat
        this.scaleY = 0.8;
        this.scaleX = 1.2;
        
        // Small impact particles on landing
        const app = window.app;
        if (app && app.particles && this.vy > 8) {
          app.particles.emit(this.x, this.y + 30, {
            count: 8,
            speed: 4,
            size: 4,
            color: '#E6C9A8',
            life: 0.4,
            decay: 0.04,
            gravity: 0.1
          });
        }
      }
      
      this.vy = 0;
    }
    
    // Friction
    this.vx *= this.friction;
    
    // Screen bounds
    const margin = 50;
    if (this.x < margin) this.x = margin;
    if (this.x > this.canvas.width - margin) this.x = this.canvas.width - margin;
    
    // Return to center slowly when idle
    if (this.action === 'idle') {
      this.targetX = this.canvas.width / 2;
      this.x += (this.targetX - this.x) * 0.02;
    }
    
    // Scale recovery
    this.scaleX += (1 - this.scaleX) * 0.2;
    this.scaleY += (1 - this.scaleY) * 0.2;
    
    // Action timer
    if (this.actionTimer > 0) {
      this.actionTimer -= deltaTime;
      if (this.actionTimer <= 0) {
        this.action = 'idle';
        this.animations.setAnimation('idle');
      }
    }
    
    // Update animations
    this.animations.update(deltaTime);
  }
  
  updateIdleAnimation(deltaTime, mood, energy, hunger) {
    this.idleTime += deltaTime;
    this.idleBreathPhase += deltaTime * 0.002;
    
    // Different idle animations based on stats
    if (this.isHappy) {
      // Happy: gentle bouncing/wiggling
      this.idleWobble = Math.sin(this.idleTime * 0.004) * 0.03;
      this.scaleX = 1 + Math.sin(this.idleTime * 0.003) * 0.02;
      this.scaleY = 1 - Math.sin(this.idleTime * 0.003) * 0.02;
    } else if (mood < 30) {
      // Sad: slow, droopy movement
      this.idleWobble = Math.sin(this.idleTime * 0.001) * 0.02;
      this.scaleY = 1 - Math.abs(Math.sin(this.idleBreathPhase)) * 0.05;
      this.scaleX = 1 + Math.abs(Math.sin(this.idleBreathPhase)) * 0.03;
    } else if (this.isTired) {
      // Tired: slow breathing, drooping
      const breathAmount = Math.sin(this.idleBreathPhase * 0.5) * 0.03;
      this.scaleY = 1 + breathAmount;
      this.scaleX = 1 - breathAmount;
      this.rotation = Math.sin(this.idleTime * 0.001) * 0.05;
    } else if (this.isHungry) {
      // Hungry: jittery, restless
      this.idleWobble = Math.sin(this.idleTime * 0.01) * 0.04;
      this.scaleX = 1 + Math.sin(this.idleTime * 0.008) * 0.02;
    } else {
      // Normal idle: gentle breathing
      const breathAmount = Math.sin(this.idleBreathPhase) * 0.02;
      this.scaleY = 1 + breathAmount;
      this.scaleX = 1 - breathAmount * 0.5;
    }
  }

  draw() {
    const ctx = this.ctx;
    
    ctx.save();
    ctx.translate(this.x, this.y);
    
    // Scale based on action
    ctx.scale(this.scaleX, this.scaleY);
    
    // Draw sprite if loaded, otherwise placeholder
    const frame = this.animations.getCurrentFrame();
    if (frame && frame.complete) {
      // Draw sprite centered
      const scale = 4; // Scale up the 48px sprite
      ctx.drawImage(
        frame, 
        -frame.width * scale / 2, 
        -frame.height * scale / 2,
        frame.width * scale,
        frame.height * scale
      );
    } else {
      // Fallback to placeholder
      this.drawPlaceholder(ctx);
    }
    
    ctx.restore();
  }

  drawPlaceholder(ctx) {
    // Placeholder blob rendering
    const mood = this.state.stats.mood;
    const energy = this.state.stats.energy;
    const hunger = this.state.stats.hunger;
    
    // Color: use custom color if set, otherwise mood-based
    let fillColor;
    if (this.customColor) {
      fillColor = this.customColor;
    } else {
      const hue = 150 + (100 - mood) * 0.5; // Blue-green to sad green
      const saturation = 60 + mood * 0.2;
      const lightness = 50 + (100 - mood) * 0.1;
      fillColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
    
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = this.customColor ? 'rgba(0,0,0,0.3)' : '#000';
    ctx.lineWidth = 3;
    
    // Apply ambient wobble from idle animation
    ctx.save();
    ctx.rotate(this.idleWobble || 0);
    
    // Body
    ctx.beginPath();
    ctx.arc(0, 0, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Eyes - vary based on stats
    let eyeOffset = 0;
    let eyeSize = 15;
    let eyeShape = 'normal'; // normal, droopy, tired
    
    if (mood < 30) {
      eyeOffset = -5;
      eyeShape = 'droopy';
    } else if (energy < 30) {
      eyeShape = 'tired';
      eyeSize = 12;
    } else if (this.isHappy) {
      eyeOffset = 2;
    }
    
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(-20, -10 + eyeOffset, eyeSize, eyeSize + (eyeShape === 'tired' ? 3 : 0), 0, 0, Math.PI * 2);
    ctx.ellipse(20, -10 + eyeOffset, eyeSize, eyeSize + (eyeShape === 'tired' ? 3 : 0), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Pupils
    ctx.fillStyle = '#000';
    const pupilSize = eyeShape === 'tired' ? 4 : 6;
    ctx.beginPath();
    ctx.arc(-20, -10 + eyeOffset, pupilSize, 0, Math.PI * 2);
    ctx.arc(20, -10 + eyeOffset, pupilSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyebrows (for expression)
    ctx.lineWidth = 2;
    if (this.isHappy) {
      // Happy eyebrows
      ctx.beginPath();
      ctx.moveTo(-30, -30);
      ctx.lineTo(-15, -35);
      ctx.moveTo(30, -30);
      ctx.lineTo(15, -35);
      ctx.stroke();
    } else if (mood < 30) {
      // Sad eyebrows
      ctx.beginPath();
      ctx.moveTo(-30, -35);
      ctx.lineTo(-15, -30);
      ctx.moveTo(30, -35);
      ctx.lineTo(15, -30);
      ctx.stroke();
    } else if (energy < 30) {
      // Tired eyelids (half-closed)
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.ellipse(-20, -10 + eyeOffset, eyeSize, eyeSize * 0.3, 0, 0, Math.PI * 2);
      ctx.ellipse(20, -10 + eyeOffset, eyeSize, eyeSize * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Mouth - varies by mood/energy/hunger
    ctx.strokeStyle = this.customColor ? 'rgba(0,0,0,0.5)' : '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    if (this.isHappy) {
      // Big happy smile
      ctx.arc(0, 15, 18, 0, Math.PI);
    } else if (mood < 30) {
      // Sad frown
      ctx.arc(0, 28, 12, Math.PI, 0);
    } else if (energy < 30) {
      // Tired: small line
      ctx.moveTo(-5, 22);
      ctx.lineTo(5, 22);
    } else if (hunger > 80) {
      // Hungry: wavy line
      ctx.moveTo(-10, 20);
      ctx.quadraticCurveTo(-5, 15, 0, 20);
      ctx.quadraticCurveTo(5, 25, 10, 20);
    } else if (mood > 50) {
      // Normal smile
      ctx.arc(0, 15, 12, 0, Math.PI);
    } else {
      // Neutral
      ctx.moveTo(-8, 20);
      ctx.lineTo(8, 20);
    }
    ctx.stroke();
    
    // Add sparkle for happy state
    if (this.isHappy) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      const sparkleTime = Date.now() * 0.003;
      for (let i = 0; i < 3; i++) {
        const sx = Math.cos(sparkleTime + i * 2) * 45;
        const sy = Math.sin(sparkleTime + i * 2) * 45 - 20;
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    ctx.restore();
  }
}

window.Blob = Blob;
