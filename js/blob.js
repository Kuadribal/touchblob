// Blob - Main character rendering and behavior with enhanced interactions

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
    
    // Follow finger/mouse
    this.followX = null;
    this.followY = null;
    this.isFollowing = false;
    this.followSpeed = 0.12;
    
    // Drag
    this.isDragging = false;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.flingVelocityX = 0;
    this.flingVelocityY = 0;
    
    // Petting
    this.isPettingActive = false;
    this.happiness = 0;
    this.maxHappiness = 100;
    this.petParticlesSpawned = 0;
    
    // Physics
    this.vx = 0;
    this.vy = 0;
    this.gravity = 0.5;
    this.friction = 0.92;
    this.groundFriction = 0.85;
    
    // Squash and stretch
    this.scaleX = 1;
    this.scaleY = 1;
    this.targetScaleX = 1;
    this.targetScaleY = 1;
    this.squashAmount = 0;
    this.stretchAmount = 0;
    
    // Rotation
    this.rotation = 0;
    this.targetRotation = 0;
    
    // Current action
    this.action = 'idle';
    this.actionTimer = 0;
    this.previousAction = 'idle';
    
    // Animation crossfade
    this.currentFrame = null;
    this.previousFrame = null;
    this.frameBlend = 0;
    
    // Custom color
    this.customColor = null;
    
    // Ambient idle animation
    this.idleTime = 0;
    this.idleWobble = 0;
    this.idleBreathPhase = 0;
    
    // Shadow
    this.shadowScale = 1;
    this.shadowAlpha = 0.3;
    
    // Micro-interaction states
    this.isHappy = false;
    this.isTired = false;
    this.isHungry = false;
    
    // Poke reaction
    this.pokeReaction = 0;
  }

  resize() {
    this.x = this.canvas.width / 2;
    this.y = this.canvas.height * 0.6;
    this.targetX = this.x;
    this.targetY = this.y;
  }

  // === NEW INTERACTION HANDLERS ===
  
  onTouchStart(x, y) {
    const dist = Math.sqrt(Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2));
    if (dist < 100) {
      // Start following finger
      this.isFollowing = true;
      this.followX = x;
      this.followY = y;
    }
  }

  onDragStart() {
    if (!this.isDragging) {
      this.isDragging = true;
      this.action = 'drag';
      // Squash when grabbed
      this.applySquash(0.7, 1.3);
    }
  }

  onDrag(x, y) {
    if (this.isDragging) {
      // Calculate velocity for fling
      const dx = x - this.x;
      const dy = y - this.y;
      
      // Move blob with finger (with some lag for smoothness)
      this.x += dx * 0.3;
      this.y += dy * 0.3;
      
      // Tilt based on movement direction
      this.targetRotation = dx * 0.01;
    }
  }

  onDragEnd(x, y, vx, vy) {
    if (this.isDragging) {
      this.isDragging = false;
      
      // Apply fling velocity
      this.flingVelocityX = vx * 2;
      this.flingVelocityY = vy * 2;
      
      // Stretch in direction of fling
      const speed = Math.sqrt(vx * vx + vy * vy);
      const stretchAmount = Math.min(0.4, speed * 0.05);
      this.applySquash(1 - stretchAmount, 1 + stretchAmount);
      
      // Show fling feedback
      const app = window.app;
      if (app && app.ui) {
        app.ui.showFeedback('💫', x, y);
      }
      
      this.action = 'idle';
    }
  }

  onTouchEnd(x, y) {
    // Stop following
    this.isFollowing = false;
    this.followX = null;
    this.followY = null;
    
    // Stop dragging
    if (this.isDragging) {
      this.isDragging = false;
      this.action = 'idle';
    }
  }

  onPoke(x, y) {
    if (this.action !== 'idle' && this.action !== 'poke') return;
    
    // Poke reaction - quick squash and bounce
    this.action = 'poke';
    this.pokeReaction = 1;
    this.applySquash(0.8, 1.2);
    this.vy = -5;
    
    // Push away from poke direction
    const dx = this.x - x;
    const pushDir = dx > 0 ? 1 : -1;
    this.vx = pushDir * 3;
    
    // Different emoji based on mood
    let emoji = '😮';
    const mood = this.state.stats.mood;
    if (mood > 80) emoji = '😄';
    else if (mood < 30) emoji = '😢';
    else if (this.isTired) emoji = '😴';
    
    // Visual feedback - ripple effect
    const app = window.app;
    if (app) {
      if (app.ui) app.ui.showFeedback(emoji, x, y - 30);
      if (app.screenShake) app.screenShake.shake(3);
      if (app.rippleEffect) app.rippleEffect(x, y);
    }
    
    this.state.interact('poke');
    this.actionTimer = 200;
  }

  onLongPress() {
    this.squish();
    const app = window.app;
    if (app && app.particles) app.particles.squishEffect(this.x, this.y);
  }

  onPet(x, y) {
    this.isPettingActive = true;
    this.happiness = Math.min(this.maxHappiness, this.happiness + 2);
    
    // Happy particles
    const app = window.app;
    if (app && app.particles && this.petParticlesSpawned % 10 === 0) {
      app.particles.emit(x, y - 30, {
        count: 3,
        speed: 2,
        size: 4,
        color: '#FFD700',
        life: 0.5,
        decay: 0.03,
        gravity: -0.1
      });
    }
    this.petParticlesSpawned++;
    
    // Happy feedback
    if (this.happiness >= this.maxHappiness) {
      if (app && app.ui) {
        app.ui.showFeedback('🥰', x, y - 50);
        app.ui.spawnFloatingHearts(5);
      }
      this.happiness = 0; // Reset after max happiness
      this.state.stats.mood = Math.min(100, this.state.stats.mood + 15);
    }
    
    // Soft squash while petting
    this.applySquash(1.05, 0.95);
  }

  onPetEnd() {
    this.isPettingActive = false;
  }

  // === PHYSICS & MOVEMENT ===

  applySquash(x, y) {
    this.targetScaleX = x;
    this.targetScaleY = y;
  }

  handleGesture(gesture, zone) {
    const energy = this.state.getEnergyLevel();
    const jumpMultiplier = energy > 30 ? 1 : 0.5;
    const app = window.app;
    
    switch (gesture) {
      case 'tap':
        if (zone === 'top') {
          this.jump(jumpMultiplier);
          if (app && app.particles) app.particles.jumpEffect(this.x, this.y);
        } else if (zone === 'bottom') {
          this.splat();
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
        if (app && app.particles) app.particles.squishEffect(this.x, this.y);
        break;
    }
  }

  jump(multiplier = 1) {
    if (this.action !== 'idle') return;
    
    this.action = 'jump';
    this.previousAction = 'jump';
    this.vy = -15 * multiplier;
    this.animations.setAnimation('jump');
    this.state.interact('jump');
    this.actionTimer = 500;
    
    // Stretch when jumping
    this.applySquash(0.85, 1.2);
    
    // Feedback
    if (window.app && window.app.ui) {
      window.app.ui.showFeedback('🎉', 'center');
      window.app.ui.spawnSparkles(this.x, this.y - 60, 4);
    }
  }

  splat() {
    if (this.action !== 'idle') return;
    
    this.action = 'splat';
    this.previousAction = 'splat';
    this.scaleY = 0.5;
    this.scaleX = 1.5;
    this.animations.setAnimation('splat');
    this.state.interact('splat');
    this.actionTimer = 300;
    
    if (window.app && window.app.ui) {
      window.app.ui.showFeedback('💥', 'center');
    }
  }

  slide(direction) {
    if (this.action !== 'idle') return;
    
    this.action = 'slide';
    this.previousAction = 'slide';
    this.vx = direction * 10;
    this.animations.setAnimation('slide');
    this.state.interact('slide');
    this.actionTimer = 400;
    
    // Lean into slide
    this.targetRotation = direction * 0.3;
    
    if (window.app && window.app.ui) {
      window.app.ui.showFeedback(direction > 0 ? '💨→' : '←💨', 'center');
    }
  }

  squish() {
    if (this.action !== 'idle') return;
    
    this.action = 'squish';
    this.previousAction = 'squish';
    this.scaleX = 1.3;
    this.scaleY = 0.7;
    this.state.interact('squish');
    this.actionTimer = 500;
    
    if (window.app && window.app.ui) {
      window.app.ui.showFeedback('❤️', 'center');
      window.app.ui.spawnFloatingHearts(3);
    }
  }

  bounce() {
    this.scaleY = 0.9;
    this.scaleX = 1.1;
    
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
    
    // === FOLLOW FINGER ===
    if (this.isFollowing && this.followX !== null) {
      // Smooth follow
      const dx = this.followX - this.x;
      const dy = this.followY - this.y;
      
      this.x += dx * this.followSpeed;
      this.y += dy * this.followSpeed;
      
      // Slight stretch in movement direction
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 10) {
        const stretch = Math.min(0.15, dist * 0.002);
        const angle = Math.atan2(dy, dx);
        this.targetScaleX = 1 + stretch * Math.abs(Math.cos(angle));
        this.targetScaleY = 1 - stretch * 0.3 * Math.abs(Math.sin(angle));
      }
    }
    
    // === FLING VELOCITY ===
    if (Math.abs(this.flingVelocityX) > 0.5 || Math.abs(this.flingVelocityY) > 0.5) {
      this.x += this.flingVelocityX;
      this.y += this.flingVelocityY;
      this.flingVelocityX *= 0.95;
      this.flingVelocityY *= 0.95;
    }
    
    // === PHYSICS ===
    // Apply gravity when not dragging or following
    if (!this.isDragging && !this.isFollowing) {
      this.vy += this.gravity;
    }
    
    this.x += this.vx;
    this.y += this.vy;
    
    // Ground collision
    const groundY = this.canvas.height * 0.7;
    if (this.y > groundY) {
      this.y = groundY;
      
      if (this.vy > 5) {
        // Landed from jump - squash
        const impactSquash = Math.min(0.3, (this.vy - 5) * 0.05);
        this.applySquash(1 + impactSquash, 1 - impactSquash);
        
        // Small impact particles
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
      this.vx *= this.groundFriction;
    }
    
    // Friction
    this.vx *= this.friction;
    
    // Screen bounds
    const margin = 50;
    if (this.x < margin) { this.x = margin; this.vx *= -0.5; }
    if (this.x > this.canvas.width - margin) { 
      this.x = this.canvas.width - margin; 
      this.vx *= -0.5; 
    }
    
    // Return to center slowly when idle
    if (this.action === 'idle' && !this.isFollowing && !this.isDragging) {
      this.targetX = this.canvas.width / 2;
      this.x += (this.targetX - this.x) * 0.02;
    }
    
    // === SCALE RECOVERY (SQUASH/STRETCH) ===
    this.scaleX += (this.targetScaleX - this.scaleX) * 0.15;
    this.scaleY += (this.targetScaleY - this.scaleY) * 0.15;
    
    // Return to normal scale
    this.targetScaleX += (1 - this.targetScaleX) * 0.1;
    this.targetScaleY += (1 - this.targetScaleY) * 0.1;
    
    // === ROTATION ===
    this.rotation += (this.targetRotation - this.rotation) * 0.1;
    this.targetRotation *= 0.9; // Return to upright
    
    // === SHADOW ===
    const heightFromGround = groundY - this.y;
    const normalizedHeight = Math.min(1, heightFromGround / 200);
    this.shadowScale = 1 - normalizedHeight * 0.5;
    this.shadowAlpha = 0.4 - normalizedHeight * 0.3;
    
    // === ACTION TIMER ===
    if (this.actionTimer > 0) {
      this.actionTimer -= deltaTime;
      if (this.actionTimer <= 0) {
        this.previousAction = this.action;
        this.action = 'idle';
        this.animations.setAnimation('idle');
      }
    }
    
    // === AMBIENT IDLE ANIMATION ===
    if (this.action === 'idle' && !this.isFollowing && !this.isDragging) {
      this.updateIdleAnimation(deltaTime, mood, energy, hunger);
    }
    
    // === POKE REACTION DECAY ===
    if (this.pokeReaction > 0) {
      this.pokeReaction -= deltaTime * 0.005;
    }
    
    // === UPDATE ANIMATIONS ===
    this.animations.update(deltaTime);
    
    // === FRAME CROSSFADE ===
    this.frameBlend = Math.min(1, this.frameBlend + deltaTime * 0.01);
  }
  
  updateIdleAnimation(deltaTime, mood, energy, hunger) {
    this.idleTime += deltaTime;
    this.idleBreathPhase += deltaTime * 0.0015; // Slower, more subtle
    
    // More subtle breathing - less extreme
    const breathAmount = Math.sin(this.idleBreathPhase) * 0.015;
    
    if (this.isHappy) {
      // Happy: gentle bouncing/wiggling
      this.idleWobble = Math.sin(this.idleTime * 0.003) * 0.02;
      this.scaleX = 1 + Math.sin(this.idleTime * 0.002) * 0.015;
      this.scaleY = 1 - Math.sin(this.idleTime * 0.002) * 0.015;
    } else if (mood < 30) {
      // Sad: slow, droopy movement
      this.idleWobble = Math.sin(this.idleTime * 0.001) * 0.015;
      this.scaleY = 1 - Math.abs(Math.sin(this.idleBreathPhase)) * 0.03;
      this.scaleX = 1 + Math.abs(Math.sin(this.idleBreathPhase)) * 0.02;
    } else if (this.isTired) {
      // Tired: very slow breathing
      const tiredBreath = Math.sin(this.idleBreathPhase * 0.4) * 0.02;
      this.scaleY = 1 + tiredBreath;
      this.scaleX = 1 - tiredBreath;
      this.rotation = Math.sin(this.idleTime * 0.0008) * 0.03;
    } else if (this.isHungry) {
      // Hungry: jittery, restless
      this.idleWobble = Math.sin(this.idleTime * 0.008) * 0.03;
      this.scaleX = 1 + Math.sin(this.idleTime * 0.006) * 0.015;
    } else {
      // Normal idle: subtle breathing only
      this.scaleY = 1 + breathAmount;
      this.scaleX = 1 - breathAmount * 0.5;
    }
  }

  draw() {
    const ctx = this.ctx;
    
    // === DRAW SHADOW ===
    this.drawShadow(ctx);
    
    ctx.save();
    ctx.translate(this.x, this.y);
    
    // Scale based on squash/stretch
    ctx.scale(this.scaleX, this.scaleY);
    
    // Rotation
    ctx.rotate(this.rotation);
    
    // Draw sprite with crossfade, otherwise placeholder
    const frame = this.animations.getCurrentFrame();
    if (frame && frame.complete) {
      // Crossfade between animations
      const scale = 4;
      ctx.globalAlpha = this.frameBlend;
      ctx.drawImage(
        frame, 
        -frame.width * scale / 2, 
        -frame.height * scale / 2,
        frame.width * scale,
        frame.height * scale
      );
      ctx.globalAlpha = 1;
    } else {
      // Fallback to placeholder
      this.drawPlaceholder(ctx);
    }
    
    ctx.restore();
  }
  
  drawShadow(ctx) {
    const groundY = this.canvas.height * 0.7;
    const heightFromGround = groundY - this.y;
    const normalizedHeight = Math.min(1, heightFromGround / 150);
    
    // Shadow position and size
    const shadowX = this.x;
    const shadowY = groundY + 10;
    const shadowWidth = 80 * this.shadowScale;
    const shadowHeight = 15 * this.shadowScale;
    
    // Draw soft shadow
    ctx.save();
    ctx.globalAlpha = this.shadowAlpha;
    
    const gradient = ctx.createRadialGradient(
      shadowX, shadowY, 0,
      shadowX, shadowY, shadowWidth
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(shadowX, shadowY, shadowWidth, shadowHeight, 0, 0, Math.PI * 2);
    ctx.fill();
    
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
      const hue = 150 + (100 - mood) * 0.5;
      const saturation = 60 + mood * 0.2;
      const lightness = 50 + (100 - mood) * 0.1;
      fillColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
    
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = this.customColor ? 'rgba(0,0,0,0.3)' : '#000';
    ctx.lineWidth = 3;
    
    // Apply ambient wobble
    ctx.save();
    ctx.rotate(this.idleWobble || 0);
    
    // Body
    ctx.beginPath();
    ctx.arc(0, 0, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Eyes
    let eyeOffset = 0;
    let eyeSize = 15;
    let eyeShape = 'normal';
    
    if (mood < 30) {
      eyeOffset = -5;
      eyeShape = 'droopy';
    } else if (energy < 30) {
      eyeShape = 'tired';
      eyeSize = 12;
    } else if (this.isHappy) {
      eyeOffset = 2;
    }
    
    // Poke reaction - wide eyes
    if (this.pokeReaction > 0.5) {
      eyeSize = 18;
      eyeOffset = -3;
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
    
    // Eyebrows
    ctx.lineWidth = 2;
    if (this.isHappy || this.pokeReaction > 0.5) {
      // Happy/excited eyebrows
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
      // Tired eyelids
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.ellipse(-20, -10 + eyeOffset, eyeSize, eyeSize * 0.3, 0, 0, Math.PI * 2);
      ctx.ellipse(20, -10 + eyeOffset, eyeSize, eyeSize * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Mouth
    ctx.strokeStyle = this.customColor ? 'rgba(0,0,0,0.5)' : '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    // Different mouth expressions
    if (this.isPettingActive || this.pokeReaction > 0.5) {
      // Happy/open mouth during pet
      ctx.arc(0, 15, 15, 0, Math.PI);
    } else if (this.isHappy) {
      ctx.arc(0, 15, 18, 0, Math.PI);
    } else if (mood < 30) {
      ctx.arc(0, 28, 12, Math.PI, 0);
    } else if (energy < 30) {
      ctx.moveTo(-5, 22);
      ctx.lineTo(5, 22);
    } else if (hunger > 80) {
      ctx.moveTo(-10, 20);
      ctx.quadraticCurveTo(-5, 15, 0, 20);
      ctx.quadraticCurveTo(5, 25, 10, 20);
    } else if (mood > 50) {
      ctx.arc(0, 15, 12, 0, Math.PI);
    } else {
      ctx.moveTo(-8, 20);
      ctx.lineTo(8, 20);
    }
    ctx.stroke();
    
    // Sparkle for happy state
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
