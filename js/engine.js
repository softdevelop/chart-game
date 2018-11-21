const Engine = {
  startTime: null,
  crashTime: null,
  gameState: null,
  isPlaying: false,
  

  setStartTime(time = Date.now()) {
    this.startTime = time;
  },

  setCrashTime(time) {
    this.crashTime = time;
  },

  setGameState(state) {
    this.gameState = state;
  },

  currentlyPlaying() {
    return this.isPlaying;
  }
};
