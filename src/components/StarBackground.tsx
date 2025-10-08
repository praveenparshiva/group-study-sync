import { useEffect, useState } from 'react';

interface StarProps {
  tailLength: number;
  topOffset: number;
  fallDuration: number;
  fallDelay: number;
}

const StarBackground = () => {
  const [stars, setStars] = useState<StarProps[]>([]);

  useEffect(() => {
    // Generate random properties for each star
    const generateStars = () => {
      const starCount = 50;
      const newStars: StarProps[] = [];
      
      for (let i = 0; i < starCount; i++) {
        newStars.push({
          tailLength: Math.random() * 2.5 + 5, // 5-7.5em
          topOffset: Math.random() * 100, // 0-100vh
          fallDuration: Math.random() * 6 + 6, // 6-12s
          fallDelay: Math.random() * 10, // 0-10s
        });
      }
      
      setStars(newStars);
    };

    generateStars();
  }, []);

  return (
    <div className="stars-container" aria-hidden="true">
      {stars.map((star, index) => (
        <div
          key={index}
          className="shooting-star"
          style={{
            '--star-tail-length': `${star.tailLength}em`,
            '--top-offset': `${star.topOffset}vh`,
            '--fall-duration': `${star.fallDuration}s`,
            '--fall-delay': `${star.fallDelay}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

export default StarBackground;
