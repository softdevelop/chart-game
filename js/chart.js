function Graph() {
  this.rendering = false;
  this.animRequest = null;
}

Graph.prototype.getColorStatus = function() {
  let themeStatus = {
    "PLAYING": "#0ee07b",
    "NOT_PLAY": "#c1c6ca",
    "CRASHED": "#ff5959"
  };

  if (Engine.gameState === "IN_PROGRESS") {
    return Engine.currentlyPlaying() ? themeStatus.PLAYING : themeStatus.PLAYING;
  }
  return themeStatus.CRASHED;
}

Graph.prototype.setFontSizeText = function(fontSize) {
  this.fontSize = fontSize;
}

Graph.prototype.startRendering = function (canvasNode) {
  window.cancelAnimationFrame(this.animRequest);
  if (!canvasNode.getContext)
    return console.error('No canvas');

  this.rendering = true;
  this.ctx = canvasNode.getContext('2d');
  this.canvas = canvasNode;
  this.fixDPICanvas(this.ctx);
  this.configPlotSettings();

  this.animRequest = window.requestAnimationFrame(this.render.bind(this));
  window.addEventListener('resize', this.onResizeWindow.bind(this));
};

Graph.prototype.calcRatio = function(ctx) {
    const dpr = window.devicePixelRatio || 1;
    const bsr = ctx.webkitBackingStorePixelRatio ||
          ctx.mozBackingStorePixelRatio ||
          ctx.msBackingStorePixelRatio ||
          ctx.oBackingStorePixelRatio ||
          ctx.backingStorePixelRatio || 1;
    return dpr / bsr;
}

Graph.prototype.fixDPICanvas = function(ctx) {
  const ratio = this.calcRatio(ctx);

  console.log(ratio)
  this.canvasWidth = this.canvas.clientWidth * ratio;
  this.canvasHeight = this.canvas.clientHeight * ratio;
}

Graph.prototype.onResizeWindow = function() {
  this.fixDPICanvas(this.ctx);
  this.configPlotSettings();
}

Graph.prototype.stopRendering = function () {
  this.rendering = false;
};

Graph.prototype.render = function () {
  if (!this.rendering)
    return;

  this.calcGameData();
  this.calculatePlotValues();
  this.clean();
  this.drawAxes();
  this.drawBackground();
  this.drawGraph();
  this.drawGameData();
  this.animRequest = window.requestAnimationFrame(this.render.bind(this))
};

Graph.prototype.configPlotSettings = function () {
  this.canvas.width = this.canvasWidth;
  this.canvas.height = this.canvasHeight;

  this.heightArrow = 40;
  this.widthArrow = 15;
  this.multiple = 100;

  this.xStart = 30;
  this.yStart = 20;
  this.plotWidth = this.canvasWidth - this.xStart - 10;
  this.plotHeight = this.canvasHeight - this.yStart;

  this.XAxisMaxDefault = 10000;
  this.YAxisMaxDefault = 2 * this.multiple;

  // NOTE: Update to draw smoothy
  this.YStep = 200;
  this.XTimeBegin = 0;
  this.YPayoutBegin = 1 * this.multiple;
};

Graph.prototype.calcGameData = function () {
  this.currentTime = Clib.getElapsedTimeWithLag(Engine);
  this.currentGamePayout = Clib.calcGamePayout(this.currentTime);
};

Graph.prototype.calculatePlotValues = function () {
  this.currentPayoutGrowth = this.multiple * Clib.growthFunc(this.currentTime);
  this.XTimeEnd = Math.max(this.XAxisMaxDefault, this.currentTime);
  this.YPayoutEnd = Math.max(this.YAxisMaxDefault, this.currentPayoutGrowth);
  this.XScale = this.plotWidth / (this.XTimeEnd - this.XTimeBegin);
  this.YScale = this.plotHeight / (this.YPayoutEnd - this.YPayoutBegin);
};

Graph.prototype.clean = function () {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
};

Graph.prototype.drawGraph = function () {
  if (Engine.gameState === 'IN_PROGRESS' || Engine.gameState === 'ENDED') {
    this.ctx.save();
    this.ctx.strokeStyle = this.getColorStatus();
    this.ctx.lineWidth = 9;
    this.ctx.beginPath();

    var step = Math.max(200, Math.floor(5 / this.XScale));
    for ( var t = 0, i = 0; ; t += step, i++) {
      var payout = Clib.calcGamePayout(t);
      var y = this.payoutToY(payout);
      var x = this.timeToX(t);
      this.ctx.lineTo(x, y);

      if (this.distanceBetweenTime(t, this.currentTime) < Math.pow(this.heightArrow, 2) || t >= this.currentTime) { break; }
      if (i > 5000) { console.log("For 1 too long!"); break; }
    }

    this.ctx.stroke();
    this.ctx.restore();

    if (this.timeToX(this.currentTime) > this.heightArrow && this.currentTime > 100){
      this.drawArrow(this.currentTime);
    }
  }
};

Graph.prototype.drawAxes = function () {
  //Function to calculate the plotting values of the Axes
  function stepValues(x) {
    var c = .4;
    var r = .1;
    while (true) {
      if (x < c) return r;

      c *= 5;
      r *= 2;

      if (x < c) return r;
      c *= 2;
      r *= 5;
    }
  }

  //Calculate Y Axis
  this.payoutSeparation = stepValues(!this.currentGamePayout ? 1 : this.currentGamePayout / this.multiple);

  this.ctx.lineWidth = 1;
  this.ctx.strokeStyle = (this.themeWhite ? "Black" : "#c1c6ca");
  this.ctx.font = "10px Arial";
  this.ctx.fillStyle = (this.themeWhite ? 'black' : "#c1c6ca");
  this.ctx.textAlign = "center";

  //Draw Y Axis Values
  for (var payout = this.payoutSeparation, i = 0; payout < this.YPayoutEnd / this.multiple; payout += this.payoutSeparation, i++) {
    var y = this.plotHeight - (payout * this.multiple * this.YScale);
    this.ctx.fillText((payout + 1) + 'x', 10, y);

    this.ctx.beginPath();
    this.ctx.moveTo(this.xStart, y);
    this.ctx.lineTo(this.xStart + 5, y);
    this.ctx.stroke();

    if (i > 100) { console.log("For 3 too long"); break; }
  }

  //Calculate X Axis
  this.milisecondsSeparation = stepValues(this.XTimeEnd);
  this.XAxisValuesSeparation = this.plotWidth / (this.XTimeEnd / this.milisecondsSeparation);

  //Draw X Axis Values
  for (var miliseconds = 0, counter = 0, i = 0; miliseconds < this.XTimeEnd; miliseconds += this.milisecondsSeparation, counter++ , i++) {
    var seconds = miliseconds / 1000;
    var textWidth = this.ctx.measureText(seconds).width;
    var x = (counter * this.XAxisValuesSeparation) + this.xStart;
    this.ctx.fillText(seconds, x - textWidth / 2, this.plotHeight + 11);

    if (i > 100) { console.log("For 4 too long"); break; }
  }

  //Draw background Axis
  this.ctx.lineWidth = 1;
  this.ctx.beginPath();
  this.ctx.moveTo(this.xStart, 0);
  this.ctx.lineTo(this.xStart, this.canvasHeight - this.yStart);
  this.ctx.lineTo(this.canvasWidth, this.canvasHeight - this.yStart);
  this.ctx.stroke();
};


Graph.prototype.roundRect = function (ctx, x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y,   x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x,   y+h, r);
  ctx.arcTo(x,   y+h, x,   y,   r);
  ctx.arcTo(x,   y,   x+w, y,   r);
  ctx.closePath();
  return ctx;
}


Graph.prototype.drawGameData = function () {
  //One percent of canvas width
  var onePercent = this.canvasWidth / 100;
  //Multiply it x times
  function fontSizeNum(times) {
    return onePercent * times;
  }
  //Return the font size in pixels of one percent of the width canvas by x times
  function fontSizePx(times) {
    var fontSize = fontSizeNum(times);
    return fontSize.toFixed(2) + 'px';
  }

  this.ctx.textAlign = "center";
  this.ctx.textBaseline = 'middle';

  if (Engine.gameState === 'IN_PROGRESS') {
    this.ctx.fillStyle = this.getColorStatus();
    this.ctx.font = fontSizePx(this.fontSize) + " Arial";

    // NOTE: Draw rectangle overlay
    const resultText = parseFloat(this.currentGamePayout / 100).toFixed(2) + 'x';
    const rectWidth = this.ctx.measureText(resultText).width + 40;
    const rectHeight = fontSizeNum(this.fontSize) + 20;
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
    this.roundRect(this.ctx, this.canvasWidth / 2 - rectWidth / 2, this.canvasHeight / 2 - rectHeight / 2, rectWidth, rectHeight, 10).fill();
    this.ctx.restore();

    this.ctx.fillText(resultText, this.canvasWidth / 2, this.canvasHeight / 2);
  }

  //If the engine enters in the room @ ENDED it doesn't have the crash value, so we don't display it
  if (Engine.gameState === 'ENDED') {
    this.ctx.font = fontSizePx(this.fontSize) + " Arial";
    this.ctx.fillStyle = "#ff5959";

    // NOTE: Draw rectangle overlay
    const endText = 'Completed';
    const endTextWidth = this.ctx.measureText(endText).width;
    const resultText = parseFloat(this.currentGamePayout / 100).toFixed(2) + 'x';
    const textWidth = this.ctx.measureText(resultText).width;
    const rectWidth = Math.max(endTextWidth, textWidth) + 40;
    const rectHeight = 2*fontSizeNum(this.fontSize) + 20;
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
    this.roundRect(this.ctx, this.canvasWidth / 2 - rectWidth / 2, this.canvasHeight / 2 - rectHeight / 2, rectWidth, rectHeight, 10).fill();
    this.ctx.restore();

    this.ctx.fillText(endText, this.canvasWidth / 2, this.canvasHeight / 2 - fontSizeNum(this.fontSize) / 2);
    this.ctx.fillText(resultText, this.canvasWidth / 2, this.canvasHeight / 2 + fontSizeNum(this.fontSize) / 2);
  }

  if (Engine.gameState === 'STARTING') {
    this.ctx.font = fontSizePx(5) + " Arial";
    this.ctx.fillStyle = "#c1c6ca";
    var timeLeft = ((Engine.startTime - Date.now()) / 1000).toFixed(1);
    this.ctx.fillText('Next round in ' + timeLeft + 's', this.canvasWidth / 2, this.canvasHeight / 2);
  }
};

Graph.prototype.distanceBetweenTime = function(startTime, endTime) {
  const XStartTime = this.timeToX(startTime),
        YStartTime = this.payoutToY(Clib.calcGamePayout2(startTime)),
        XEndTime = this.timeToX(endTime),
        YEndTime = this.payoutToY(Clib.calcGamePayout2(endTime));
  return Math.pow(XEndTime - XStartTime, 2) + Math.pow(YEndTime - YStartTime, 2);
}

Graph.prototype.timeToX = function(time) {
  return this.xStart + this.XScale * (time - this.XTimeBegin);
}

Graph.prototype.payoutToY = function(payout) {
  return this.plotHeight - (this.YScale * (payout - this.YPayoutBegin));
}

Graph.prototype.XToTime = function(x) {
  return (x - this.xStart) / this.XScale + this.XTimeBegin;
}

Graph.prototype.YToPayout = function(y) {
  return (this.plotHeight - y) / this.YScale + this.YPayoutBegin;
}
Graph.prototype.drawArrow = function(time) {
  const currentX = this.timeToX(time),
        currentY = this.payoutToY(Clib.calcGamePayout(time)),
        x = currentX - this.timeToX(this.XToTime(currentX - 10)),
        y = currentY - this.payoutToY(Clib.calcGamePayout(this.XToTime(currentX - 10))),
        r = Math.atan2(y, x) + Math.PI / 2;

  this.ctx.save();
  this.ctx.beginPath();
  this.ctx.fillStyle = this.getColorStatus();
  this.ctx.translate(currentX, currentY);
  this.ctx.rotate(r);
  this.ctx.moveTo(0, 0);
  this.ctx.lineTo(this.widthArrow, this.heightArrow);
  this.ctx.lineTo(-this.widthArrow, this.heightArrow);
  this.ctx.closePath();
  this.ctx.fill();
  this.ctx.restore();
}

Graph.prototype.drawBackground = function() {
  if (Engine.gameState === 'IN_PROGRESS' || Engine.gameState === 'ENDED') {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(this.xStart, this.plotHeight);

    var step = Math.max(0, Math.floor(1 / this.XScale));
    for (var t = 0, i = 0; t <= this.currentTime; t += step, i++) {
      var payout = Clib.calcGamePayout(t) - this.YPayoutBegin;
      var y = this.plotHeight - (payout * this.YScale);
      var x = t * this.XScale;
      this.ctx.lineTo(x + this.xStart, y);

      if (i > 5000) { console.log("For 1 too long!"); break; }
    }

    this.ctx.lineTo(this.timeToX(t - step), this.plotHeight);
    this.ctx.lineTo(this.xStart, this.plotHeight);
    this.ctx.fillStyle = this.getColorStatus();

    this.ctx.globalAlpha = 0.2;
    this.ctx.fill();
    this.ctx.restore();
  }
}
