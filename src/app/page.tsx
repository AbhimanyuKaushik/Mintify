'use client'
import React from "react";
import TokenCreator from "./Components/TokenCreator";
import TokenMinter from "./Components/TokenMinter";
import { useState, useEffect, useRef } from "react";
import { StarsBackground } from "./Components/StarBackground";
import TokenList from "./TokenList/page";
import Link from "next/link";

export default function Home() {
  const textParts = [
    { text: "Create and deploy tokens instantly, powered by ", color: "text-gray-400" },
    { text: "Solana.", color: "text-[#04d9ff]" }
  ];

  const [displayedText, setDisplayedText] = useState("");
  const [currentPart, setCurrentPart] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const typingSpeed = useRef(30);
  const cursorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentPart < textParts.length) {
      const currentText = textParts[currentPart].text;

      if (currentIndex < currentText.length) {
        const speedVariation = Math.random() * 20 - 10;
        const currentSpeed = Math.max(typingSpeed.current + speedVariation, 10);

        const timer = setTimeout(() => {
          setDisplayedText(prev => prev + currentText[currentIndex]);
          setCurrentIndex(currentIndex + 1);
        }, currentSpeed);

        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => {
          setCurrentPart(currentPart + 1);
          setCurrentIndex(0);
        }, 200);

        return () => clearTimeout(timer);
      }
    } else {
      const timer = setTimeout(() => {
        if (cursorRef.current) {
          cursorRef.current.style.opacity = '0';
          cursorRef.current.style.transition = 'opacity 0.5s ease-out';
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [currentPart, currentIndex, textParts]);
  const [refreshCount, setRefreshCount] = useState(0);

  const handleTokenCreated = () => {
    setRefreshCount(prev => prev + 1);
  };
  return (
    <main className="flex min-h-screen flex-col items-center bg-[#0f101a] p-10 px-5 md:px-20 lg:px-40 gap-5">
      <h3 className="flex flex-row items-center justify-center p-5 text-6xl font-sans font-semibold gap-2 tracking-wide">
        Mint Tokens using
        <span className="flex justify-center items-center border-2 border-[#04d9ff] px-4 py-2 font-sans font-bold w-36 text-6xl uppercase bg-gradient-to-r from-[#04d9ff] to-[#e3faff] text-transparent bg-clip-text rounded-lg shadow-lg transition-transform transform">
          SOL
        </span>
      </h3>
      <p className="text-lg font-mono min-h-6 text-center">
        {textParts.map((part, partIndex) => (
          partIndex < currentPart ||
            (partIndex === currentPart && currentIndex > 0) ? (
            <span key={partIndex} className={part.color}>
              {partIndex < currentPart ?
                part.text :
                part.text.substring(0, currentIndex)}
            </span>
          ) : null
        ))}
        <span
          ref={cursorRef}
          className={`inline-block w-2 h-6 bg-[#04d9ff] align-middle ml-1 ${showCursor ? 'opacity-100' : 'opacity-0'}`}
          style={{ transition: 'opacity 0.2s ease' }}
        />
      </p>
      <div className="w-full flex flex-col md:flex-col justify-around items-center gap-10 h-full p-10 rounded-lg">
        <div className="flex flex-row justify-center items-center gap-10">
          <TokenCreator />
          <Link href="/TokenList">
            <button className="ui-btn">
              <span>
                Token List
              </span>
            </button>
          </Link>
          <Link href="/TokenShare">
            <button className="ui-btn">
              <span>
                Share Token
              </span>
            </button>
          </Link>
        </div>
        <TokenMinter />
      </div>
    </main>
  );
}