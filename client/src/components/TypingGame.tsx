import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw, Timer, Target, Zap, TrendingUp } from 'lucide-react';

// Sample sentences optimized for 60-second typing
const SAMPLE_SENTENCES = [
  "The quick brown fox jumps over the lazy dog and runs through the beautiful meadow.",
  "Technology has transformed the way we communicate, work, and live our daily lives in remarkable ways.",
  "Programming languages like JavaScript, Python, and TypeScript help developers build amazing applications.",
  "Practice makes perfect when it comes to improving your typing speed and accuracy over time.",
  "Mountain climbing requires careful preparation, proper equipment, and a strong determination to succeed.",
  "The ocean waves crashed against the rocky shore while seagulls soared overhead in the bright blue sky.",
  "Modern education systems are evolving to incorporate digital tools and innovative teaching methods.",
  "Artificial intelligence and machine learning are revolutionizing industries across the globe today.",
  "Reading books expands your vocabulary, improves your writing skills, and broadens your perspective on life.",
  "Successful entrepreneurs often start with a simple idea and transform it into a thriving business venture."
];

interface GameStats {
  timeLeft: number;
  totalTyped: number;
  correctChars: number;
  accuracy: number;
  wpm: number;
}

interface TypingGameProps {
  onGameComplete?: (stats: GameStats) => void;
}

export default function TypingGame({ onGameComplete }: TypingGameProps) {
  // Game state
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [currentSentence, setCurrentSentence] = useState('');
  const [userInput, setUserInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [totalTyped, setTotalTyped] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate real-time stats
  const elapsedMinutes = startTime ? (Date.now() - startTime.getTime()) / 60000 : 0;
  const accuracy = totalTyped > 0 ? Math.round((correctChars / totalTyped) * 100) : 100;
  const wpm = elapsedMinutes > 0 ? Math.round(correctChars / 5 / elapsedMinutes) : 0;

  // Initialize game with random sentence
  const initializeGame = () => {
    const randomSentence = SAMPLE_SENTENCES[Math.floor(Math.random() * SAMPLE_SENTENCES.length)];
    setCurrentSentence(randomSentence);
    setUserInput('');
    setTimeLeft(60);
    setTotalTyped(0);
    setCorrectChars(0);
    setGameState('waiting');
    setStartTime(null);
    
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Start game on first keypress
  const startGame = () => {
    if (gameState === 'waiting') {
      setGameState('playing');
      setStartTime(new Date());
      
      // Start countdown timer
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  // End game
  const endGame = () => {
    setGameState('finished');
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Call completion callback
    if (onGameComplete) {
      onGameComplete({
        timeLeft,
        totalTyped,
        correctChars,
        accuracy,
        wpm
      });
    }
  };

  // Handle typing input
  const handleInput = (value: string) => {
    // Start game on first character
    if (gameState === 'waiting' && value.length > 0) {
      startGame();
    }
    
    // Don't allow input if game is finished
    if (gameState === 'finished') return;
    
    setUserInput(value);
    
    // Calculate stats
    let correct = 0;
    for (let i = 0; i < value.length && i < currentSentence.length; i++) {
      if (value[i] === currentSentence[i]) {
        correct++;
      }
    }
    
    setTotalTyped(value.length);
    setCorrectChars(correct);
    
    // Check if sentence is completed
    if (value === currentSentence) {
      endGame();
    }
  };

  // Render character with highlighting
  const renderCharacter = (char: string, index: number) => {
    const userChar = userInput[index];
    let className = 'font-mono text-xl ';
    
    if (index < userInput.length) {
      // Character has been typed
      if (userChar === char) {
        className += 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'; // Correct
      } else {
        className += 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'; // Incorrect
      }
    } else if (index === userInput.length) {
      // Current character (cursor position)
      className += 'bg-primary/20 border-l-2 border-primary animate-pulse';
    } else {
      // Untyped character
      className += 'text-muted-foreground';
    }
    
    return (
      <span key={index} className={className}>
        {char}
      </span>
    );
  };

  // Reset game
  const resetGame = () => {
    initializeGame();
    // Focus input after brief delay to ensure state is updated
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Initialize game on mount
  useEffect(() => {
    initializeGame();
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Focus input when game starts
  useEffect(() => {
    if (gameState === 'waiting') {
      inputRef.current?.focus();
    }
  }, [gameState]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8" data-testid="typing-game-container">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold" data-testid="text-game-title">
          Typing Speed Test
        </h1>
        <p className="text-muted-foreground" data-testid="text-game-subtitle">
          Test your typing speed and accuracy with a 60-second challenge
        </p>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Timer className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Time</span>
          </div>
          <div 
            className={`text-2xl font-bold font-mono ${
              timeLeft <= 10 ? 'text-red-500' : timeLeft <= 30 ? 'text-yellow-500' : 'text-green-500'
            }`}
            data-testid="text-time-remaining"
          >
            {timeLeft}s
          </div>
        </Card>

        <Card className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Target className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Accuracy</span>
          </div>
          <div className="text-2xl font-bold font-mono" data-testid="text-accuracy">
            {accuracy}%
          </div>
        </Card>

        <Card className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">WPM</span>
          </div>
          <div className="text-2xl font-bold font-mono" data-testid="text-wpm">
            {wpm}
          </div>
        </Card>

        <Card className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Characters</span>
          </div>
          <div className="text-2xl font-bold font-mono" data-testid="text-characters-typed">
            {totalTyped}
          </div>
        </Card>
      </div>

      {/* Sample Text Display */}
      <Card className="p-8">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-center" data-testid="text-sample-heading">
            Type the following text:
          </h2>
          <div 
            className="text-xl leading-relaxed p-4 rounded-lg bg-muted/30 min-h-[120px] flex items-center justify-center"
            data-testid="text-sample-display"
          >
            <div className="max-w-3xl text-center">
              {currentSentence.split('').map((char, index) => renderCharacter(char, index))}
            </div>
          </div>
        </div>
      </Card>

      {/* Hidden Input Field */}
      <input
        ref={inputRef}
        type="text"
        value={userInput}
        onChange={(e) => handleInput(e.target.value)}
        className="absolute opacity-0 pointer-events-none"
        disabled={gameState === 'finished'}
        data-testid="input-typing"
        aria-label="Typing input field"
      />

      {/* Game Instructions and Reset */}
      <div className="text-center space-y-4">
        {gameState === 'waiting' && (
          <p className="text-muted-foreground" data-testid="text-instructions">
            Click anywhere and start typing to begin the 60-second challenge!
          </p>
        )}
        
        {gameState === 'finished' && (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-primary" data-testid="text-game-complete">
                Game Complete!
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Final WPM</div>
                  <div className="text-2xl font-bold" data-testid="text-final-wpm">{wpm}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                  <div className="text-2xl font-bold" data-testid="text-final-accuracy">{accuracy}%</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Characters</div>
                  <div className="text-2xl font-bold" data-testid="text-final-characters">{totalTyped}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Correct</div>
                  <div className="text-2xl font-bold" data-testid="text-final-correct">{correctChars}</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <Button 
          onClick={resetGame}
          className="gap-2"
          data-testid="button-reset"
        >
          <RotateCcw className="w-4 h-4" />
          {gameState === 'finished' ? 'Play Again' : 'Reset Game'}
        </Button>
      </div>

      {/* Click to focus */}
      <div 
        className="fixed inset-0 z-10"
        onClick={() => inputRef.current?.focus()}
        style={{ pointerEvents: gameState === 'finished' ? 'none' : 'auto' }}
        data-testid="click-to-focus-overlay"
      />
    </div>
  );
}