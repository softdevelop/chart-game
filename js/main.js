function ChartCanvas() {
  const g = new Graph();
  const canvas = document.getElementById("chart-game-canvas");
  // canvas.width = $("#chartContainer").width();
  // canvas.height = $("#chartContainer").height();

  // g.setFontSizeText($(window).width() < 600 ? 10 : 15);
  g.setFontSizeText(15);

  const setPlayer = (isPlaying = false) => {
    Engine.isPlaying = isPlaying;
  }

  const starting = () => {
    const date = new Date();
    date.setMilliseconds(date.getMilliseconds() + 5000);

    Engine.setGameState('STARTING');
    Engine.setStartTime(date.getTime());
    Engine.setCrashTime(null);
    g.stopRendering();
    g.startRendering(canvas);
  }


  const started = (elcaped = 0) => {
    const date = new Date();
    date.setMilliseconds(date.getMilliseconds() - elcaped);

    Engine.setGameState('IN_PROGRESS');
    Engine.setStartTime(date.getTime());
    g.stopRendering();
    g.startRendering(canvas);
  }

  const stoped = (at = 100) => {
    Engine.setGameState('ENDED');
    let startTime = Date.now() - Clib.inverseGrowth(at);
    Engine.setStartTime(startTime);
    Engine.setCrashTime(Date.now());
    g.stopRendering();
    g.startRendering(canvas);

  }

  return {
    starting, started, stoped, setPlayer
  }
}

  document.getElementById('js-start').addEventListener('click', () => {
    ChartCanvas().starting();
  });

  document.getElementById('js-in-progress').addEventListener('click', () => {
    ChartCanvas().started(0);
  });

  document.getElementById('js-crash').addEventListener('click', () => {
    ChartCanvas().stoped(350);
  })