import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Timer, Target, Zap } from 'lucide-react';

interface TypeSpeedTestProps {
  onRestart?: () => void;
}

const sampleTexts = [
  "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet and is commonly used for typing practice.",
  "Technology has revolutionized the way we communicate, work, and live. From smartphones to artificial intelligence, innovation continues to shape our future.",
  "Learning to type efficiently is a valuable skill in today's digital world. Practice makes perfect, and consistency is key to improvement.",
  "The art of programming requires patience, logic, and creativity. Each line of code is a step towards solving complex problems and building amazing applications.",
  "Reading books expands our knowledge and imagination. Literature has the power to transport us to different worlds and teach us about life.",
  "Music is a universal language that connects people across cultures and generations. Every melody tells a story and every rhythm moves the soul.",
  "Cooking is both an art and a science. The perfect combination of ingredients, timing, and technique creates memorable culinary experiences.",
  "Nature provides us with incredible beauty and resources. Protecting our environment is essential for future generations to enjoy.",
  "Traveling opens our minds to new cultures and perspectives. Each journey enriches our understanding of the world and broadens our horizons.",
  "Exercise strengthens the body and refreshes the mind. A healthy lifestyle balances physical activity, nutrition, and rest.",
  "History teaches us valuable lessons about humanity. By studying the past, we gain insights to build a better future.",
  "Friendship brings joy, support, and companionship. True friends stand by us through both challenges and triumphs.",
  "Creativity fuels innovation and self-expression. Whether through art, writing, or invention, imagination shapes our reality.",
  "Education empowers individuals to pursue their dreams. Knowledge is the foundation of progress and personal growth.",
  "Mindfulness helps us stay present and appreciate each moment. A calm mind leads to clarity, peace, and resilience.",
  "Teamwork combines diverse strengths to achieve common goals. Collaboration often leads to outcomes greater than the sum of individual efforts.",
];


export function TypeSpeedTest({ onRestart }: TypeSpeedTestProps) {
  const [currentText, setCurrentText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const initializeTest = () => {
    const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    setCurrentText(randomText);
    setUserInput('');
    setStartTime(null);
    setEndTime(null);
    setIsActive(false);
    setIsCompleted(false);
  };

  useEffect(() => {
    initializeTest();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Start timer on first character
    if (!startTime && value.length === 1) {
      setStartTime(Date.now());
      setIsActive(true);
    }

    setUserInput(value);

    // Check if completed
    if (value === currentText) {
      setEndTime(Date.now());
      setIsActive(false);
      setIsCompleted(true);
    }
  };

  const calculateWPM = (): number => {
    if (!startTime || !endTime) return 0;
    const timeInMinutes = (endTime - startTime) / 60000;
    const wordsTyped = userInput.trim().split(' ').length;
    return Math.round(wordsTyped / timeInMinutes);
  };

  const calculateAccuracy = (): number => {
    if (userInput.length === 0) return 100;
    let correctChars = 0;
    for (let i = 0; i < userInput.length; i++) {
      if (i < currentText.length && userInput[i] === currentText[i]) {
        correctChars++;
      }
    }
    return Math.round((correctChars / userInput.length) * 100);
  };

  const getCharacterClass = (index: number): string => {
    if (index >= userInput.length) {
      return 'text-muted-foreground';
    }
    if (userInput[index] === currentText[index]) {
      return 'text-green-500 bg-green-100 dark:bg-green-900/30';
    }
    return 'text-red-500 bg-red-100 dark:bg-red-900/30';
  };

  const handleRestart = () => {
    initializeTest();
    onRestart?.();
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  return (
    <div className="space-y-6">
      {/* Stats Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Speed</p>
                <p className="text-2xl font-bold">
                  {isCompleted ? calculateWPM() : 0} WPM
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Accuracy</p>
                <p className="text-2xl font-bold">
                  {calculateAccuracy()}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Timer className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={isCompleted ? "default" : isActive ? "secondary" : "outline"}>
                  {isCompleted ? "Completed" : isActive ? "Typing..." : "Ready"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Text Display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Type the following text:</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted/30 rounded-lg font-mono text-lg leading-relaxed">
            {currentText.split('').map((char, index) => (
              <span
                key={index}
                className={`${getCharacterClass(index)} ${
                  index === userInput.length ? 'animate-pulse bg-primary/20' : ''
                }`}
              >
                {char}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Input Area */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Input
              ref={inputRef}
              value={userInput}
              onChange={handleInputChange}
              placeholder="Start typing here..."
              disabled={isCompleted}
              autoFocus
              className="text-lg p-4 h-12"
            />
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Progress: {userInput.length} / {currentText.length} characters
              </div>
              
              <Button
                onClick={handleRestart}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Retry</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completion Message */}
      {isCompleted && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
          <CardContent className="p-6 text-center">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-green-700 dark:text-green-300">
                🎉 Test Completed!
              </h3>
              <p className="text-green-600 dark:text-green-400">
                You typed at <strong>{calculateWPM()} WPM</strong> with{' '}
                <strong>{calculateAccuracy()}% accuracy</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Time taken: {startTime && endTime ? ((endTime - startTime) / 1000).toFixed(1) : 0}s
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}