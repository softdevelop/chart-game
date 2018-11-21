const Clib = {
  getElapsedTimeWithLag() {
    if (Engine.gameState == 'IN_PROGRESS') {
      return this.getElapsedTime(Engine.startTime);
    } else if (Engine.gameState === 'ENDED') {
      return Engine.crashTime - Engine.startTime;
    }
    return 0;
  },

  getElapsedTime: function (startTime) {
    return Date.now() - startTime;
    // return 100000;
  },

  growthFunc: function (ms) {
    var r = 0.00006;
    return Math.pow(Math.E, r * ms);
  },

  inverseGrowth(at) { // crashPoint -> time duration
    var c = 16666.666667;
    return c * Math.log(0.01 * at);
  },

  calcGamePayout(ms) {
    const gameGrowth = this.growthFunc(ms);
    return Math.floor(1e5 * gameGrowth) / 1e3;
  },

  calcGamePayout2(ms) {
    const gameGrowth = this.growthFunc(ms);
    return Math.floor(100 * gameGrowth);
  },

  seed() { }
}
