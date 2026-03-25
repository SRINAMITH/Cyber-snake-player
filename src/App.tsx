import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, RefreshCw, Trophy } from 'lucide-react';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIR = { x: 0, y: -1 };
const GAME_SPEED = 120;

const TRACKS = [
  { id: 1, title: "Cyberpunk City (AI Gen)", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 2, title: "Neon Drive (AI Gen)", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: 3, title: "Digital Horizon (AI Gen)", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
];

export default function App() {
  // Game State
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [dir, setDir] = useState(INITIAL_DIR);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);
  
  // Music Player State
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Refs for game loop
  const dirRef = useRef(dir);
  const snakeRef = useRef(snake);
  const foodRef = useRef(food);
  const gameOverRef = useRef(gameOver);
  const isGameStartedRef = useRef(isGameStarted);

  // Sync refs
  useEffect(() => { dirRef.current = dir; }, [dir]);
  useEffect(() => { snakeRef.current = snake; }, [snake]);
  useEffect(() => { foodRef.current = food; }, [food]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { isGameStartedRef.current = isGameStarted; }, [isGameStarted]);

  // Handle Keyboard Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' && !isGameStartedRef.current) {
        setIsGameStarted(true);
        return;
      }

      if (e.key === ' ' && gameOverRef.current) {
        resetGame();
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
  }, []);

  // Game Loop
  useEffect(() => {
    if (!isGameStarted || gameOver) return;

    const moveSnake = () => {
      const currentSnake = snakeRef.current;
      const currentDir = dirRef.current;
      const currentFood = foodRef.current;

      const newHead = {
        x: currentSnake[0].x + currentDir.x,
        y: currentSnake[0].y + currentDir.y,
      };

      // Check wall collision
      if (
        newHead.x < 0 || newHead.x >= GRID_SIZE ||
        newHead.y < 0 || newHead.y >= GRID_SIZE
      ) {
        handleGameOver();
        return;
      }

      // Check self collision
      if (currentSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        handleGameOver();
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
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      setSnake(newSnake);
    };

    const intervalId = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(intervalId);
  }, [isGameStarted, gameOver, highScore]);

  const handleGameOver = () => {
    setGameOver(true);
    setIsGameStarted(false);
  };

  const generateFood = (currentSnake: {x: number, y: number}[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      if (!currentSnake.some(s => s.x === newFood.x && s.y === newFood.y)) {
        break;
      }
    }
    return newFood;
  };

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDir(INITIAL_DIR);
    setScore(0);
    setGameOver(false);
    setFood(generateFood(INITIAL_SNAKE));
    setIsGameStarted(true);
  };

  // Music Player Effects
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [currentTrackIndex, isPlaying]);

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

      <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start max-w-6xl w-full px-4 justify-center">
        
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
        </div>

        {/* Center Panel: Game Grid */}
        <div className="relative order-1 lg:order-2">
          <div 
            className="grid bg-neutral-900/50 border-2 border-cyan-500/50 rounded-lg overflow-hidden shadow-[0_0_30px_rgba(0,243,255,0.2)]"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
              width: 'min(85vw, 500px)',
              height: 'min(85vw, 500px)'
            }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
              const x = i % GRID_SIZE;
              const y = Math.floor(i / GRID_SIZE);
              const isSnakeHead = snake[0].x === x && snake[0].y === y;
              const isSnakeBody = snake.some((s, idx) => idx !== 0 && s.x === x && s.y === y);
              const isFood = food.x === x && food.y === y;

              return (
                <div
                  key={i}
                  className={`
                    w-full h-full
                    ${isSnakeHead ? 'bg-green-400 shadow-[0_0_10px_#39ff14] z-10 rounded-sm' : ''}
                    ${isSnakeBody ? 'bg-green-500/80 rounded-sm scale-90' : ''}
                    ${isFood ? 'bg-fuchsia-500 shadow-[0_0_15px_#ff00ff] rounded-full scale-75 animate-pulse' : ''}
                  `}
                />
              );
            })}
          </div>

          {/* Overlays */}
          {!isGameStarted && !gameOver && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg">
              <button 
                onClick={() => setIsGameStarted(true)}
                className="px-8 py-3 bg-cyan-500/20 border border-cyan-400 text-cyan-400 font-bold tracking-widest uppercase rounded hover:bg-cyan-500/40 hover:shadow-[0_0_20px_rgba(0,243,255,0.5)] transition-all duration-300"
              >
                Start Game
              </button>
              <p className="mt-4 text-neutral-400 text-sm">Press SPACE to start</p>
              <p className="mt-2 text-neutral-500 text-xs">Use Arrow Keys or WASD to move</p>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center rounded-lg border border-red-500/50 shadow-[inset_0_0_50px_rgba(239,68,68,0.2)]">
              <h2 className="text-4xl font-black text-red-500 mb-2 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] uppercase tracking-widest">System Failure</h2>
              <p className="text-white mb-6">Final Score: <span className="text-cyan-400 font-bold">{score}</span></p>
              <button 
                onClick={resetGame}
                className="flex items-center gap-2 px-6 py-3 bg-fuchsia-500/20 border border-fuchsia-400 text-fuchsia-400 font-bold tracking-widest uppercase rounded hover:bg-fuchsia-500/40 hover:shadow-[0_0_20px_rgba(255,0,255,0.5)] transition-all duration-300"
              >
                <RefreshCw className="w-5 h-5" />
                Reboot
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
          <audio 
            ref={audioRef}
            src={TRACKS[currentTrackIndex].url}
            onEnded={handleTrackEnd}
            preload="auto"
          />
        </div>

      </div>
    </div>
  );
}
