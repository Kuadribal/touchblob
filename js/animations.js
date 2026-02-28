// Animation System - Sprite-based frame animations from PixelLab

class AnimationManager {
  constructor() {
    this.animations = {};
    this.currentAnimation = 'idle';
    this.currentDirection = 'south';
    this.currentFrame = 0;
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.frameSpeed = 150; // ms per frame (base speed)
    this.isPlaying = true;
    this.loaded = false;
    
    // Direction mapping
    this.directions = ['south', 'east', 'north', 'west'];
  }

  async loadSprites(characterId) {
    const basePath = 'assets/sprites/animations';
    
    // Animation mapping: app name -> folder name
    const animMap = {
      'idle': 'breathing-idle',
      'jump': 'jumping-1',
      'splat': 'falling-back-death'
    };
    
    for (const [animName, folderName] of Object.entries(animMap)) {
      this.animations[animName] = { directions: {}, frames: [] };
      
      for (const dir of this.directions) {
        const dirPath = `${basePath}/${folderName}/${dir}`;
        const frames = [];
        
        // Load all frames for this direction
        let frameNum = 0;
        while (frameNum < 20) { // Max 20 frames
          const img = new Image();
          const src = `${dirPath}/frame_${String(frameNum).padStart(3, '0')}.png`;
          
          try {
            // Create a promise-based loader
            await new Promise((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => reject();
              img.src = src;
            });
            frames.push(img);
            frameNum++;
          } catch (e) {
            // No more frames
            break;
          }
        }
        
        if (frames.length > 0) {
          this.animations[animName].directions[dir] = frames;
        }
      }
    }
    
    // Set default animation frames (south direction)
    if (this.animations['idle']?.directions['south']) {
      this.animations['idle'].frames = this.animations['idle'].directions['south'];
    }
    if (this.animations['jump']?.directions['south']) {
      this.animations['jump'].frames = this.animations['jump'].directions['south'];
    }
    if (this.animations['splat']?.directions['south']) {
      this.animations['splat'].frames = this.animations['splat'].directions['south'];
    }
    
    this.loaded = true;
    console.log('Sprites loaded:', this.animations);
  }

  setAnimation(name, direction = 'south') {
    if (!this.animations[name]) return;
    
    // Get frames for this direction
    const dirFrames = this.animations[name]?.directions?.[direction];
    if (dirFrames) {
      this.animations[name].frames = dirFrames;
    }
    
    // Always reset animation state when changing animation or direction
    if (this.currentAnimation !== name || this.currentDirection !== direction) {
      this.currentAnimation = name;
      this.currentDirection = direction;
      this.frameIndex = 0;
      this.frameTimer = 0;
    }
  }

  update(deltaTime) {
    if (!this.loaded) return;
    
    const anim = this.animations[this.currentAnimation];
    if (!anim || !anim.frames || anim.frames.length === 0) return;

    // Use instance frameSpeed (configurable), with idle being slower
    const speed = this.currentAnimation === 'idle' ? this.frameSpeed * 1.5 : this.frameSpeed;
    this.frameTimer += deltaTime;
    
    if (this.frameTimer >= speed) {
      this.frameTimer -= speed; // Preserve excess time for smooth animation
      this.frameIndex++;
      
      if (this.frameIndex >= anim.frames.length) {
        // Animation loop or end
        if (this.isLooping(this.currentAnimation)) {
          this.frameIndex = 0;
        } else {
          // One-shot animation, return to idle
          this.frameIndex = 0; // Reset to first frame
          this.currentAnimation = 'idle';
          this.frameTimer = 0; // Reset timer when transitioning
          // Ensure idle animation is properly set
          if (this.animations['idle']?.directions?.[this.currentDirection]) {
            this.animations['idle'].frames = this.animations['idle'].directions[this.currentDirection];
          }
        }
      }
    }
  }

  isLooping(animName) {
    // These animations loop
    return animName === 'idle';
  }

  getCurrentFrame() {
    const anim = this.animations[this.currentAnimation];
    if (!anim || !anim.frames || anim.frames.length === 0) return null;
    return anim.frames[this.frameIndex];
  }

  setDirection(dir) {
    if (this.directions.includes(dir)) {
      const oldAnim = this.currentAnimation;
      this.currentDirection = dir;
      // Update frames for new direction
      this.setAnimation(oldAnim, dir);
    }
  }
}

window.AnimationManager = AnimationManager;
