// State Management - Blob stats and persistence

class BlobState {
  constructor() {
    this.stats = {
      mood: 80,
      energy: 100,
      hunger: 20
    };
    
    this.name = 'Blob';
    this.totalInteractions = 0;
    this.createdAt = Date.now();
    
    this.load();
  }

  save() {
    const data = {
      name: this.name,
      stats: this.stats,
      totalInteractions: this.totalInteractions,
      createdAt: this.createdAt
    };
    localStorage.setItem('touchblob_state', JSON.stringify(data));
  }

  load() {
    const saved = localStorage.getItem('touchblob_state');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.name = data.name || 'Blob';
        this.stats = data.stats || this.stats;
        this.totalInteractions = data.totalInteractions || 0;
        this.createdAt = data.createdAt || Date.now();
      } catch (e) {
        console.warn('Failed to load save:', e);
      }
    }
  }

  update(deltaTime) {
    // Slowly decay stats over time
    const decayRate = deltaTime / 60000; // Per minute
    
    this.stats.mood = Math.max(0, this.stats.mood - decayRate * 2);
    this.stats.energy = Math.min(100, this.stats.energy + decayRate * 5);
    this.stats.hunger = Math.min(100, this.stats.hunger + decayRate * 3);
    
    this.save();
  }

  interact(type) {
    this.totalInteractions++;
    
    switch (type) {
      case 'jump':
        this.stats.mood = Math.min(100, this.stats.mood + 5);
        this.stats.energy = Math.max(0, this.stats.energy - 10);
        this.stats.hunger = Math.min(100, this.stats.hunger + 2);
        break;
      case 'splat':
        this.stats.mood = Math.min(100, this.stats.mood + 3);
        this.stats.energy = Math.max(0, this.stats.energy - 5);
        break;
      case 'slide':
        this.stats.mood = Math.min(100, this.stats.mood + 4);
        this.stats.energy = Math.max(0, this.stats.energy - 8);
        break;
      case 'squish':
        this.stats.mood = Math.min(100, this.stats.mood + 2);
        break;
      case 'poke':
        this.stats.mood = Math.min(100, this.stats.mood + 3);
        this.stats.energy = Math.max(0, this.stats.energy - 2);
        break;
    }
    
    this.save();
  }

  getMoodEmoji() {
    if (this.stats.mood > 80) return '😊';
    if (this.stats.mood > 50) return '😐';
    if (this.stats.mood > 20) return '😢';
    return '😭';
  }

  getEnergyLevel() {
    return this.stats.energy;
  }

  isTired() {
    return this.stats.energy < 30;
  }

  isHungry() {
    return this.stats.hunger > 70;
  }
}

window.BlobState = BlobState;
