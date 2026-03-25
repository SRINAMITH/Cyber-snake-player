import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, RefreshCw, Trophy, Heart } from 'lucide-react';
import ReactPlayer from 'react-player';

const GRID_SIZE = 30;
const INITIAL_SNAKE = [{ x: 15, y: 15 }];
const INITIAL_DIR = { x: 0, y: -1 };

const DIFFICULTIES = {
  BEGINNER: { name: 'Beginner', speed: 120, color: 'text-green-400', border: 'border-green-400', lives: 5, obstaclesCount: 10, wallWraps: true },
  PRO: { name: 'Pro', speed: 80, color: 'text-fuchsia-400', border: 'border-fuchsia-400', lives: 3, obstaclesCount: 25, wallWraps: false },
  NIGHTMARE: { name: 'Nightmare', speed: 50, color: 'text-red-500', border: 'border-red-500', lives: 1, obstaclesCount: 50, wallWraps: false },
};
type DifficultyKey = keyof typeof DIFFICULTIES;

const TRACKS = [
  { id: 1, title: "EL CONTROL - Super slowed", url: "https://www.youtube.com/watch?v=yiE_sQFVkLM" },
  { id: 2, title: "Cyberpunk City (AI Gen)", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 3, title: "Neon Drive (AI Gen)", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
];

export default function App() {
  // Game State
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [dir, setDir] = useState(INITIAL_DIR);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [obstacles, setObstacles] = useState<{x: number, y: number}[]>([]);
  const [lives, setLives] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('neonSnakeHighScore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState<DifficultyKey>('BEGINNER');
  const [isShaking, setIsShaking] = useState(false);
  
  // Music Player State
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);

  // Refs for game loop
  const dirRef = useRef(dir);
  const snakeRef = useRef(snake);
  const foodRef = useRef(food);
  const obstaclesRef = useRef(obstacles);
  const livesRef = useRef(lives);
  const gameOverRef = useRef(gameOver);
  const isGameStartedRef = useRef(isGameStarted);

  // Sync refs
  useEffect(() => { dirRef.current = dir; }, [dir]);
  useEffect(() => { snakeRef.current = snake; }, [snake]);
  useEffect(() => { foodRef.current = food; }, [food]);
  useEffect(() => { obstaclesRef.current = obstacles; }, [obstacles]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { isGameStartedRef.current = isGameStarted; }, [isGameStarted]);

  useEffect(() => {
    localStorage.setItem('neonSnakeHighScore', highScore.toString());
  }, [highScore]);

  const generateObstacles = (count: number) => {
    const newObstacles: {x: number, y: number}[] = [];
    while (newObstacles.length < count) {
      const obs = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      // Avoid placing near the center (spawn point)
      const isNearCenter = Math.abs(obs.x - INITIAL_SNAKE[0].x) < 4 && Math.abs(obs.y - INITIAL_SNAKE[0].y) < 4;
      const isDuplicate = newObstacles.some(o => o.x === obs.x && o.y === obs.y);
      
      if (!isNearCenter && !isDuplicate) {
        newObstacles.push(obs);
      }
    }
    return newObstacles;
  };

  const generateFood = (currentSnake: {x: number, y: number}[], currentObstacles: {x: number, y: number}[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      const onSnake = currentSnake.some(s => s.x === newFood.x && s.y === newFood.y);
      const onObstacle = currentObstacles.some(o => o.x === newFood.x && o.y === newFood.y);
      if (!onSnake && !onObstacle) {
        break;
      }
    }
    return newFood;
  };

  const startGame = () => {
    const diff = DIFFICULTIES[difficulty];
    const newObstacles = generateObstacles(diff.obstaclesCount);
    setObstacles(newObstacles);
    setLives(diff.lives);
    setSnake(INITIAL_SNAKE);
    setDir(INITIAL_DIR);
    setScore(0);
    setGameOver(false);
    setFood(generateFood(INITIAL_SNAKE, newObstacles));
    setIsGameStarted(true);
  };

  // Handle Keyboard Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' && !isGameStartedRef.current) {
        startGame();
        return;
      }

      if (e.key === ' ' && gameOverRef.current) {
        startGame();
        return;
      }

      const currentDir = dirRef.current;
      if (['ArrowUp', 'w', 'W'].includes(e.key) && currentDir.y === 0) {
        setDir({ x: 0, y: -1 });
      } else if (['ArrowDown', 's', 'S'].includes(e.key) && currentDir.y === 0) {
        setDir({ x: 0, y: 1 });
      } else if (['ArrowLeft', 'a', 'A'].includes(e.key) && currentDir.x === 0) {
        setDir({ x: -1, y: 0 });
      } else if (['ArrowRight', 'd', 'D'].includes(e.key) && currentDir.x === 0) {
        setDir({ x: 1, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [difficulty]); // Re-bind if difficulty changes so startGame uses latest

  // Game Loop
  useEffect(() => {
    if (!isGameStarted || gameOver) return;

    const moveSnake = () => {
      const currentSnake = snakeRef.current;
      const currentDir = dirRef.current;
      const currentFood = foodRef.current;
      const currentObstacles = obstaclesRef.current;
      const currentLives = livesRef.current;
      const currentDifficulty = DIFFICULTIES[difficulty];

      let newHead = {
        x: currentSnake[0].x + currentDir.x,
        y: currentSnake[0].y + currentDir.y,
      };

      let collision = false;

      // Check wall collision
      if (
        newHead.x < 0 || newHead.x >= GRID_SIZE ||
        newHead.y < 0 || newHead.y >= GRID_SIZE
      ) {
        if (currentDifficulty.wallWraps) {
          newHead.x = (newHead.x + GRID_SIZE) % GRID_SIZE;
          newHead.y = (newHead.y + GRID_SIZE) % GRID_SIZE;
        } else {
          collision = true;
        }
      }

      // Check self collision
      if (!collision && currentSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        collision = true;
      }

      // Check obstacle collision
      if (!collision && currentObstacles.some(obs => obs.x === newHead.x && obs.y === newHead.y)) {
        collision = true;
      }

      if (collision) {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 400);

        if (currentLives > 1) {
          setLives(l => l - 1);
          setSnake(INITIAL_SNAKE);
          setDir(INITIAL_DIR);
        } else {
          setLives(0);
          setGameOver(true);
          setIsGameStarted(false);
        }
        return;
      }

      const newSnake = [newHead, ...currentSnake];

      // Check food collision
      if (newHead.x === currentFood.x && newHead.y === currentFood.y) {
        setScore(s => {
          const newScore = s + 10;
          if (newScore > highScore) setHighScore(newScore);
          return newScore;
        });
        setFood(generateFood(newSnake, currentObstacles));
      } else {
        newSnake.pop();
      }

      setSnake(newSnake);
    };

    const intervalId = setInterval(moveSnake, DIFFICULTIES[difficulty].speed);
    return () => clearInterval(intervalId);
  }, [isGameStarted, gameOver, highScore, difficulty]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const handleTrackEnd = () => {
    nextTrack();
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center font-mono overflow-hidden py-8">
      
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-cyan-400 drop-shadow-[0_0_15px_rgba(0,243,255,0.6)] uppercase italic">
          Neon Synth Snake
        </h1>
        <p className="text-cyan-400/70 mt-2 text-sm tracking-widest uppercase">Cyberpunk Edition</p>
      </div>

      <div className={`flex flex-col lg:flex-row gap-8 items-center lg:items-start max-w-[1400px] w-full px-4 justify-center ${isShaking ? 'animate-shake' : ''}`}>
        
        {/* Left Panel: Score & Stats */}
        <div className="flex flex-row lg:flex-col gap-4 w-full lg:w-48 order-2 lg:order-1 justify-center">
          <div className="bg-neutral-900/80 border border-cyan-500/30 rounded-xl p-4 shadow-[0_0_15px_rgba(0,243,255,0.1)] backdrop-blur-sm flex-1">
            <h2 className="text-cyan-400 text-xs uppercase tracking-widest mb-1 opacity-80">Current Score</h2>
            <div className="text-4xl font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
              {score.toString().padStart(4, '0')}
            </div>
          </div>
          
          <div className="bg-neutral-900/80 border border-fuchsia-500/30 rounded-xl p-4 shadow-[0_0_15px_rgba(255,0,255,0.1)] backdrop-blur-sm flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-fuchsia-400" />
              <h2 className="text-fuchsia-400 text-xs uppercase tracking-widest opacity-80">High Score</h2>
            </div>
            <div className="text-2xl font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
              {highScore.toString().padStart(4, '0')}
            </div>
          </div>

          <div className="bg-neutral-900/80 border border-red-500/30 rounded-xl p-4 shadow-[0_0_15px_rgba(239,68,68,0.1)] backdrop-blur-sm flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-red-400" />
              <h2 className="text-red-400 text-xs uppercase tracking-widest opacity-80">Lives</h2>
            </div>
            <div className="text-2xl font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
              {lives}
            </div>
          </div>
        </div>

        {/* Center Panel: Game Grid */}
        <div className="relative order-1 lg:order-2">
          <div 
            className="grid bg-neutral-900/50 border-2 border-cyan-500/50 rounded-lg overflow-hidden shadow-[0_0_30px_rgba(0,243,255,0.2)]"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
              width: 'min(90vw, 600px)',
              height: 'min(90vw, 600px)'
            }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
              const x = i % GRID_SIZE;
              const y = Math.floor(i / GRID_SIZE);
              const isSnakeHead = snake[0].x === x && snake[0].y === y;
              const isSnakeBody = snake.some((s, idx) => idx !== 0 && s.x === x && s.y === y);
              const isFood = food.x === x && food.y === y;
              const isObstacle = obstacles.some(o => o.x === x && o.y === y);

              return (
                <div
                  key={i}
                  className={`
                    w-full h-full
                    ${isSnakeHead ? 'bg-green-400 shadow-[0_0_10px_#39ff14] z-10 rounded-sm' : ''}
                    ${isSnakeBody ? 'bg-green-500/80 rounded-sm scale-90' : ''}
                    ${isFood ? 'bg-fuchsia-500 shadow-[0_0_15px_#ff00ff] rounded-full scale-75 animate-pulse' : ''}
                    ${isObstacle ? 'bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.6)] rounded-sm scale-90' : ''}
                  `}
                />
              );
            })}
          </div>

          {/* Overlays */}
          {!isGameStarted && !gameOver && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-20">
              <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-widest">Select Difficulty</h2>
              <div className="flex gap-3 mb-8">
                {(Object.keys(DIFFICULTIES) as DifficultyKey[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setDifficulty(key)}
                    className={`px-3 py-2 border rounded text-sm font-bold tracking-wider uppercase transition-all duration-300
                      ${difficulty === key 
                        ? `${DIFFICULTIES[key].border} ${DIFFICULTIES[key].color} bg-white/10 shadow-[0_0_15px_currentColor]` 
                        : `border-neutral-600 text-neutral-500 hover:border-neutral-400 hover:text-neutral-300`
                      }`}
                  >
                    {DIFFICULTIES[key].name}
                  </button>
                ))}
              </div>
              <div className="text-center mb-6 text-neutral-400 text-xs space-y-1">
                <p>Lives: <span className="text-white">{DIFFICULTIES[difficulty].lives}</span></p>
                <p>Obstacles: <span className="text-white">{DIFFICULTIES[difficulty].obstaclesCount}</span></p>
                <p>Wall Collision: <span className="text-white">{DIFFICULTIES[difficulty].wallWraps ? 'Wraps Around' : 'Lethal'}</span></p>
              </div>
              <button 
                onClick={startGame}
                className="px-8 py-3 bg-cyan-500/20 border border-cyan-400 text-cyan-400 font-bold tracking-widest uppercase rounded hover:bg-cyan-500/40 hover:shadow-[0_0_20px_rgba(0,243,255,0.5)] transition-all duration-300"
              >
                Start Game
              </button>
              <p className="mt-4 text-neutral-400 text-sm">Press SPACE to start</p>
              <p className="mt-2 text-neutral-500 text-xs">Use Arrow Keys or WASD to move</p>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center rounded-lg border border-red-500/50 shadow-[inset_0_0_50px_rgba(239,68,68,0.2)] z-20">
              <h2 className="text-4xl font-black text-red-500 mb-2 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] uppercase tracking-widest">System Failure</h2>
              <p className="text-white mb-6">Final Score: <span className="text-cyan-400 font-bold">{score}</span></p>
              <button 
                onClick={startGame}
                className="flex items-center gap-2 px-6 py-3 bg-fuchsia-500/20 border border-fuchsia-400 text-fuchsia-400 font-bold tracking-widest uppercase rounded hover:bg-fuchsia-500/40 hover:shadow-[0_0_20px_rgba(255,0,255,0.5)] transition-all duration-300"
              >
                <RefreshCw className="w-5 h-5" />
                Reboot
              </button>
              <button 
                onClick={() => {
                  setSnake(INITIAL_SNAKE);
                  setDir(INITIAL_DIR);
                  setScore(0);
                  setGameOver(false);
                  setObstacles([]);
                  setLives(0);
                  setIsGameStarted(false);
                }}
                className="mt-6 text-neutral-400 text-xs hover:text-white underline decoration-neutral-500 underline-offset-4 uppercase tracking-widest transition-colors"
              >
                Change Difficulty
              </button>
            </div>
          )}
        </div>

        {/* Right Panel: Music Player */}
        <div className="w-full lg:w-72 order-3 bg-neutral-900/80 border border-fuchsia-500/30 rounded-xl p-5 shadow-[0_0_20px_rgba(255,0,255,0.1)] backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-fuchsia-400 text-xs uppercase tracking-widest font-bold">Now Playing</h2>
            <div className="flex gap-1">
              <div className={`w-1 bg-fuchsia-500 rounded-full ${isPlaying ? 'animate-[bounce_1s_infinite]' : 'h-1'}`} style={{ height: isPlaying ? '12px' : '4px', animationDelay: '0s' }}></div>
              <div className={`w-1 bg-cyan-500 rounded-full ${isPlaying ? 'animate-[bounce_1s_infinite]' : 'h-1'}`} style={{ height: isPlaying ? '16px' : '4px', animationDelay: '0.2s' }}></div>
              <div className={`w-1 bg-fuchsia-500 rounded-full ${isPlaying ? 'animate-[bounce_1s_infinite]' : 'h-1'}`} style={{ height: isPlaying ? '10px' : '4px', animationDelay: '0.4s' }}></div>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-white font-bold truncate drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
              {TRACKS[currentTrackIndex].title}
            </div>
            <div className="text-neutral-400 text-xs mt-1">Track {currentTrackIndex + 1} of {TRACKS.length}</div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button 
              onClick={prevTrack}
              className="p-2 text-neutral-400 hover:text-cyan-400 transition-colors"
            >
              <SkipBack className="w-6 h-6" />
            </button>
            
            <button 
              onClick={togglePlay}
              className="p-4 bg-gradient-to-br from-cyan-500 to-fuchsia-500 rounded-full text-white shadow-[0_0_15px_rgba(0,243,255,0.4)] hover:shadow-[0_0_25px_rgba(255,0,255,0.6)] hover:scale-105 transition-all duration-300"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
            </button>
            
            <button 
              onClick={nextTrack}
              className="p-2 text-neutral-400 hover:text-cyan-400 transition-colors"
            >
              <SkipForward className="w-6 h-6" />
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="text-neutral-400 hover:text-fuchsia-400 transition-colors"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
            />
          </div>

          {/* Hidden Audio Element */}
          <ReactPlayer 
            url={TRACKS[currentTrackIndex].url}
            playing={isPlaying}
            volume={isMuted ? 0 : volume}
            onEnded={handleTrackEnd}
            width="0"
            height="0"
            style={{ display: 'none' }}
            config={{
              youtube: {
                playerVars: { showinfo: 0, controls: 0 }
              }
            }}
          />
        </div>

      </div>
    </div>
  );
}
