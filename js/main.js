// Main - App initialization and game loop

class TouchBlobApp {
  constructor() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    // Initialize systems
    this.animations = new AnimationManager();
    this.state = new BlobState();
    this.blob = new Blob(this.canvas, this.state, this.animations);
    
    // Touch input
    this.touch = new TouchHandler(this.canvas, (gesture, zone) => {
      this.blob.handleGesture(gesture, zone);
    });
    
    // Load sprites (placeholder for now)
    this.animations.loadSprites('787f3bce-23e5-4ccf-bdf9-a5aaf3731983');
    
    // Game loop
    this.lastTime = 0;
    this.gameLoop = this.gameLoop.bind(this);
    requestAnimationFrame(this.gameLoop);
    
    // Stats decay timer
    this.statsTimer = 0;
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    if (this.blob) this.blob.resize();
  }

  gameLoop(timestamp) {
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;
    
    // Update
    this.blob.update(deltaTime);
    
    // Update stats every 10 seconds
    this.statsTimer += deltaTime;
    if (this.statsTimer >= 10000) {
      this.statsTimer = 0;
      this.state.update(10000);
    }
    
    // Draw
    this.draw();
    
    requestAnimationFrame(this.gameLoop);
  }

  draw() {
    const ctx = this.ctx;
    
    // Clear with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw ground hint
    ctx.fillStyle = '#0f3460';
    ctx.fillRect(0, this.canvas.height * 0.7, this.canvas.width, this.canvas.height * 0.3);
    
    // Draw blob
    this.blob.draw();
    
    // Draw subtle stats indicator (optional)
    // this.drawStats();
  }

  drawStats() {
    const ctx = this.ctx;
    const mood = this.state.stats.mood;
    const energy = this.state.stats.energy;
    const hunger = this.state.stats.hunger;
    
    ctx.font = '16px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(`Mood: ${Math.round(mood)}%`, 20, 30);
    ctx.fillText(`Energy: ${Math.round(energy)}%`, 20, 50);
    ctx.fillText(`Hunger: ${Math.round(hunger)}%`, 20, 70);
  }
}

// Start app when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new TouchBlobApp();
});
