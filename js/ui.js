// UI - User interface handling for stats, color picker, feedback

class UIManager {
  constructor(app) {
    this.app = app;
    
    // Elements
    this.statsIndicator = document.getElementById('stats-indicator');
    this.colorToggle = document.getElementById('color-toggle');
    this.colorPicker = document.getElementById('color-picker');
    this.feedback = document.getElementById('feedback');
    
    // Color buttons
    this.colorButtons = document.querySelectorAll('.color-btn');
    
    // State
    this.colorPickerOpen = false;
    
    this.init();
  }

  init() {
    // Color picker toggle
    this.colorToggle.addEventListener('click', () => this.toggleColorPicker());
    
    // Color button clicks
    this.colorButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const color = e.target.dataset.color;
        this.setBlobColor(color);
      });
    });
    
    // Close color picker when clicking outside
    document.addEventListener('click', (e) => {
      if (this.colorPickerOpen && 
          !this.colorPicker.contains(e.target) && 
          e.target !== this.colorToggle) {
        this.closeColorPicker();
      }
    });
    
    // Initial stats update
    this.updateStats();
  }

  toggleColorPicker() {
    if (this.colorPickerOpen) {
      this.closeColorPicker();
    } else {
      this.openColorPicker();
    }
  }

  openColorPicker() {
    this.colorPickerOpen = true;
    this.colorPicker.classList.remove('hidden');
  }

  closeColorPicker() {
    this.colorPickerOpen = false;
    this.colorPicker.classList.add('hidden');
  }

  setBlobColor(color) {
    if (this.app && this.app.blob) {
      this.app.blob.customColor = color;
      // Save to localStorage
      try {
        localStorage.setItem('touchblob_color', color);
      } catch (e) {
        // localStorage not available
      }
      this.showFeedback('✨');
    }
  }

  updateStats() {
    if (!this.app || !this.app.state) return;
    
    const stats = this.app.state.stats;
    
    // Update mood
    this.updateStatBar('mood', stats.mood);
    // Update energy  
    this.updateStatBar('energy', stats.energy);
    // Update hunger
    this.updateStatBar('hunger', stats.hunger);
  }

  updateStatBar(statName, value) {
    const statItem = document.querySelector(`.stat-item[data-stat="${statName}"]`);
    if (!statItem) return;
    
    const fill = statItem.querySelector('.stat-fill');
    if (fill) {
      fill.style.width = `${value}%`;
    }
    
    // Warning state
    if (value < 30) {
      statItem.classList.add('warning');
    } else {
      statItem.classList.remove('warning');
    }
  }

  showFeedback(text, x, y) {
    const el = document.createElement('div');
    el.className = 'feedback-text';
    el.textContent = text;
    
    // Handle 'center' position
    if (x === 'center' && this.app && this.app.blob) {
      x = this.app.blob.x;
      y = this.app.blob.y - 60;
    } else if (x === undefined && y === undefined && this.app && this.app.blob) {
      // Position at blob if not specified
      x = this.app.blob.x;
      y = this.app.blob.y - 50;
    }
    
    if (x !== undefined && y !== undefined) {
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
    }
    
    this.feedback.appendChild(el);
    
    // Remove after animation
    setTimeout(() => {
      el.remove();
    }, 800);
  }

  showHeart(x, y) {
    const el = document.createElement('div');
    el.className = 'floating-heart';
    el.textContent = '❤️';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    
    this.feedback.appendChild(el);
    
    setTimeout(() => {
      el.remove();
    }, 1000);
  }

  spawnSparkles(x, y, count = 3) {
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'sparkle';
      el.style.left = `${x + (Math.random() - 0.5) * 60}px`;
      el.style.top = `${y + (Math.random() - 0.5) * 40}px`;
      el.style.setProperty('--tx', `${(Math.random() - 0.5) * 100}px`);
      el.style.setProperty('--ty', `${-50 - Math.random() * 50}px`);
      
      this.feedback.appendChild(el);
      
      setTimeout(() => el.remove(), 600);
    }
  }

  spawnFloatingHearts(count = 3) {
    if (!this.app || !this.app.blob) return;
    const x = this.app.blob.x;
    const y = this.app.blob.y - 60;
    
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        this.showHeart(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 20);
      }, i * 150);
    }
  }
}

// Auto-init when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Wait for app to be ready
  const initUI = () => {
    if (window.app) {
      window.ui = new UIManager(window.app);
    } else {
      setTimeout(initUI, 100);
    }
  };
  initUI();
});
