"use client";

import { useEffect, useState } from "react";


type Question = {
  question: string;
  options: string[];
  answer: number;
};

type Confetti = {
  id: number;
  left: number;
  delay: number;
  duration: number;
};

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateConfetti(): Confetti[] {
  // Venstre side - kommer fra venstre
  const leftSide = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 10 - 10, // -10 til 10
    delay: Math.random() * 0.3,
    duration: 2 + Math.random() * 0.6,
  }));
  
  // Høyre side - kommer fra høyre
  const rightSide = Array.from({ length: 60 }, (_, i) => ({
    id: i + 60,
    left: 90 + Math.random() * 10, // 90 til 100
    delay: Math.random() * 0.3,
    duration: 2 + Math.random() * 0.6,
  }));
  
  return [...leftSide, ...rightSide];
}

export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const [score, setScore] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<Question[]>([]);

  // CSV parser som håndterer sitater og komma korrekt
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          // Escaped quote ""
          current += '"';
          i++;
        } else {
          // Toggle quote state
          insideQuotes = !insideQuotes;
        }
      } else if (char === "," && !insideQuotes) {
        // Field separator
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  };

  useEffect(() => {
    fetch("/data/questions.csv")
      .then((res) => res.text())
      .then((text) => {
        const lines = text.split("\n").filter((line) => line.trim());
        const parsed: Question[] = lines.slice(1).map((line) => {
          const fields = parseCSVLine(line);
          const q = fields[0];
          const options = [fields[1], fields[2], fields[3], fields[4]];
          const correctAnswer = fields[5];
          const answerIndex = options.findIndex((o) => o === correctAnswer);

          return { question: q, options, answer: answerIndex };
        });
        setQuestions(shuffleArray(parsed));
      });
  }, []);

  useEffect(() => {
    if (questions.length) {
      const opts = questions[current].options.map((opt, idx) => ({ opt, idx }));
      const shuffled = shuffleArray(opts);
      setShuffledOptions(shuffled.map((o) => o.opt));
    }
    setSelected(null);
  }, [current, questions]);

  // Slett confetti etter animasjon
  useEffect(() => {
    if (confetti.length > 0) {
      const timer = setTimeout(() => {
        setConfetti([]);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [confetti]);

  const handleSelect = (index: number) => {
    setSelected(index);
    // Trigger confetti når svar blir valgt
    const isCorrect = index === correctIndexShuffled;
    if (isCorrect) {
      setConfetti(generateConfetti());
    }
  };

  const handleNext = () => {
    if (selected !== correctIndexShuffled) {
      setWrongAnswers((prev) => [...prev, q]);
    } else {
      setScore((prev) => prev + 1);
    }

    if (current + 1 < questions.length) {
      setCurrent((prev) => prev + 1);
    } else {
      setShowStats(true);
    }
  };

  const resetQuiz = () => {
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setShowStats(false);
    setConfetti([]);
    setWrongAnswers([]);
    setQuestions(shuffleArray(questions));
  };

  if (!questions.length) {
    return (
      <main className="main-container loading-state">
        <div className="loader"></div>
        <p>Laster spørsmål...</p>
      </main>
    );
  }

  if (showStats) {
    const percentage = Math.round((score / questions.length) * 100);
    let emoji = "";

    if (percentage === 100) {
      emoji = "🏆";
    } else if (percentage >= 80) {
      emoji = "🌟";
    } else if (percentage >= 60) {
      emoji = "📚";
    } else {
      emoji = "💪";
    }

    return (
      <main className="main-container results-page">
        <div className="results-container">
          <div className="results-content">
            <div className="results-header">
              <div className="results-emoji">{emoji}</div>
              <h1>Quiz Fullført!</h1>
              <div className="score-display">
                <div className="score-number">{percentage}%</div>
                <div className="score-text">
                  {score} av {questions.length} riktig
                </div>
              </div>
            </div>

            {wrongAnswers.length > 0 && (
              <div className="wrong-section">
                <h2>Gjennomgå feil svar</h2>
                <div className="wrong-list">
                  {wrongAnswers.map((q, idx) => (
                    <div key={idx} className="wrong-item">
                      <div className="wrong-q">{q.question}</div>
                      <div className="wrong-a">
                        ✓ {q.options[q.answer]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button className="restart-button" onClick={resetQuiz}>
              Prøv igjen
            </button>
          </div>
        </div>
      </main>
    );
  }

  const q = questions[current];
  const correctAnswerText = q.options[q.answer];
  const correctIndexShuffled = shuffledOptions.findIndex(
    (o) => o === correctAnswerText
  );
  const isCorrect = selected === correctIndexShuffled;

  return (
    <main className="main-container">
      {confetti.length > 0 && (
        <div className="confetti-container">
          {confetti.map((c) => {
            const fromLeft = c.id < 60; // Første 60 fra venstre
            // Større X-bevegelse for naturlig bue
            const randomX = fromLeft 
              ? (Math.random() + 0.5) * 300 // 150 til 300px til høyre
              : -(Math.random() + 0.5) * 300; // -300 til -150px til venstre
            
            return (
              <div
                key={c.id}
                className="confetti-square"
                style={{
                  left: fromLeft ? "-10%" : "110%",
                  top: "50%",
                  animation: `burst ${c.duration}s cubic-bezier(0.34, 1.56, 0.64, 0.1) ${c.delay}s forwards`,
                  width: Math.random() > 0.5 ? "12px" : "8px",
                  height: Math.random() > 0.5 ? "12px" : "8px",
                  "--tx": `${randomX}px`,
                } as any}
              />
            );
          })}
        </div>
      )}

      <div className="quiz-header">
        <div className="header-left">
          <div className="quiz-title">Quiz</div>
          <div className="progress-info">
            <span className="progress-number">
              {current + 1}/{questions.length}
            </span>
          </div>
        </div>
        <div className="header-right">
          <div className="score-badge">
            <span className="score-value">{score}</span>
            <span className="score-label">riktig</span>
          </div>
        </div>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="quiz-content">
        <div className="question-container">
          <h2 className="question-text">{q.question}</h2>
        </div>

        <div className="options-container">
          {shuffledOptions.map((opt, idx) => {
            let optionState = "";
            if (selected !== null) {
              if (idx === correctIndexShuffled) {
                optionState = "correct";
              } else if (selected === idx && !isCorrect) {
                optionState = "wrong";
              } else {
                optionState = "disabled";
              }
            }

            return (
              <button
                key={idx}
                className={`option ${optionState}`}
                onClick={() => handleSelect(idx)}
                disabled={selected !== null}
              >
                <span className="option-letter">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="option-text">{opt}</span>
                {selected !== null && idx === correctIndexShuffled && (
                  <span className="option-icon">✓</span>
                )}
                {selected !== null && selected === idx && !isCorrect && (
                  <span className="option-icon">✗</span>
                )}
              </button>
            );
          })}
        </div>

        {selected !== null && (
          <button
            className="next-button active"
            onClick={handleNext}
          >
            Neste
          </button>
        )}
      </div>

      <style jsx global>{`
        html,
        body,
        #__next {
          margin: 0;
          padding: 0;
          height: 100%;
          width: 100%;
          overflow: hidden !important;
          background: hsl(215, 56.50%, 22.50%);
        }
      `}</style>

      <style jsx>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes burst {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 1;
          }
          20% {
            transform: translateY(-250px) translateX(calc(var(--tx, 0) * 0.6)) rotate(180deg);
            opacity: 1;
          }
          70% {
            opacity: 0.7;
          }
          100% {
            transform: translateY(120vh) translateX(var(--tx, 0)) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .main-container {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          background: hsl(215, 56.50%, 22.50%);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            Oxygen, Ubuntu, Cantarell, sans-serif;
          overflow: hidden;
        }

        .main-container.loading-state {
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.1rem;
        }

        .loader {
          border: 4px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          border-top: 4px solid white;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin-bottom: 1.5rem;
        }

        .quiz-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .quiz-title {
          font-size: 1.8rem;
          font-weight: 700;
          color: white;
        }

        .progress-info {
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .progress-number {
          font-weight: 600;
        }

        .header-right {
          display: flex;
          gap: 1rem;
        }

        .score-badge {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          padding: 0.6rem 1.2rem;
          border-radius: 50px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: white;
          font-weight: 600;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .score-value {
          font-size: 1.3rem;
          font-weight: 700;
        }

        .score-label {
          font-size: 0.85rem;
          opacity: 0.9;
        }

        .progress-bar-container {
          padding: 0 2rem;
          padding-top: 1rem;
          padding-bottom: 1.5rem;
        }

        .progress-bar {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #b8a0d9, #c9b4e0);
          transition: width 0.4s ease;
          border-radius: 10px;
        }

        .quiz-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 0 2rem;
          overflow-y: auto;
          max-width: 700px;
          margin: 0 auto;
          width: 100%;
        }

        .question-container {
          margin-bottom: 2.5rem;
          padding-top: 0.5rem;
          text-align: center;
        }

        .question-text {
          font-size: 1.8rem;
          font-weight: 600;
          color: white;
          line-height: 1.5;
          margin-bottom: 0;
        }

        .options-container {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
          margin-bottom: 0.5rem;
          flex: 1;
        }

        .option {
          display: flex;
          align-items: center;
          gap: 1.2rem;
          padding: 1.2rem;
          background: white;
          border: 2px solid white;
          border-radius: 12px;
          cursor: pointer;
          font-size: 1.05rem;
          font-weight: 500;
          transition: all 0.2s ease;
          text-align: left;
          color: #1f0a7a;
        }

        .option:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(184, 160, 217, 0.3);
        }

        .option:disabled {
          cursor: not-allowed;
        }

        .option-letter {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: hsl(260, 50%, 35%);
          color: white;
          border-radius: 50%;
          font-weight: 700;
          flex-shrink: 0;
          font-size: 1.1rem;
        }

        .option-text {
          flex: 1;
        }

        .option-icon {
          font-size: 1.3rem;
          flex-shrink: 0;
        }

        .option.correct {
          background: #d4edda;
          border-color: #28a745;
          color: #155724;
        }

        .option.correct .option-letter {
          background: #28a745;
        }

        .option.wrong {
          background: #f8d7da;
          border-color: #dc3545;
          color: #721c24;
        }

        .option.wrong .option-letter {
          background: #dc3545;
        }

        .option.disabled {
          opacity: 0.5;
        }

        .feedback {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.2rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          animation: slideIn 0.3s ease;
        }

        .feedback-correct {
          background: rgba(40, 167, 69, 0.15);
          border: 2px solid #28a745;
          color: #28a745;
        }

        .feedback-wrong {
          background: rgba(220, 53, 69, 0.15);
          border: 2px solid #dc3545;
          color: #dc3545;
        }

        .feedback-icon {
          font-size: 1.8rem;
          flex-shrink: 0;
        }

        .feedback-title {
          font-weight: 600;
          font-size: 1.05rem;
          margin-bottom: 0.3rem;
        }

        .feedback-answer {
          font-size: 0.95rem;
          opacity: 0.9;
        }

        .quiz-footer {
          display: none;
        }

        .header-next-btn {
          display: none;
        }

        .header-next-btn.active {
          display: none;
        }

        .header-next-btn.active:hover {
          display: none;
        }

        .next-button {
          width: 100%;
          padding: 1rem;
          font-size: 1.1rem;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 0.5rem;
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.5);
        }

        .next-button.active {
          background: rgba(255, 255, 255, 0.3);
          color: white;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(255, 255, 255, 0.2);
          font-weight: 700;
        }

        .next-button.active:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.35);
          box-shadow: 0 12px 32px rgba(255, 255, 255, 0.3);
        }

        .next-button.active-wrong {
          display: none;
        }

        .next-button.active-wrong:hover {
          display: none;
        }

        .confetti-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1000;
        }

        .confetti-square {
          position: fixed;
          background: #28a745;
          opacity: 1;
          will-change: transform, opacity;
          border-radius: 2px;
        }

        /* Results Page */

        .main-container.results-page {
          justify-content: center;
          align-items: center;
          padding: 2rem;
        }

        .results-container {
          width: 100%;
          max-width: 600px;
          display: flex;
          justify-content: center;
        }

        .results-content {
          width: 100%;
          background: white;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-height: 90vh;
          overflow-y: auto;
        }

        .results-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .results-emoji {
          font-size: 4rem;
          margin-bottom: 1rem;
          animation: pulse 0.8s ease infinite;
        }

        .results-content h1 {
          font-size: 2rem;
          color: #1f0a7a;
          margin-bottom: 1.5rem;
        }

        .score-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .score-number {
          font-size: 3.5rem;
          font-weight: 700;
          color: #b8a0d9;
        }

        .score-text {
          font-size: 1.1rem;
          color: #666;
        }

        .wrong-section {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
        }

        .wrong-section h2 {
          font-size: 1.1rem;
          color: #dc3545;
          margin-bottom: 1rem;
          font-weight: 600;
        }

        .wrong-list {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          max-height: 250px;
          overflow-y: auto;
        }

        .wrong-item {
          background: white;
          padding: 1rem;
          border-radius: 8px;
          border-left: 4px solid #dc3545;
        }

        .wrong-q {
          font-weight: 600;
          color: #333;
          margin-bottom: 0.5rem;
          font-size: 0.95rem;
          line-height: 1.3;
        }

        .wrong-a {
          color: #28a745;
          font-size: 0.9rem;
          line-height: 1.3;
        }

        .restart-button {
          width: 100%;
          padding: 1.2rem;
          font-size: 1.05rem;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #b8a0d9, #c9b4e0);
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .restart-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(184, 160, 217, 0.6);
        }

        @media (max-width: 768px) {
          .quiz-header {
            padding: 1rem 1.5rem;
          }

          .quiz-title {
            font-size: 1.5rem;
          }

          .quiz-content {
            padding: 0 1.5rem;
          }

          .question-text {
            font-size: 1.4rem;
          }

          .option {
            padding: 1rem;
            gap: 1rem;
          }

          .option-letter {
            width: 36px;
            height: 36px;
            font-size: 1rem;
          }

          .option-text {
            font-size: 0.95rem;
          }

          .quiz-footer {
            padding: 1rem 1.5rem;
          }
        }
      `}</style>
    </main>
  );
}