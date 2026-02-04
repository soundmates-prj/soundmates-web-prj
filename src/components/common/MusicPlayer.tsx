import { useState } from 'react';
import svgPaths from "../imports/svg-bkf1gvjtpa";
import './MusicPlayer.css';

// Play Button Component with SVG
function PlayButtonSVG({ isPlaying }: { isPlaying: boolean }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 39.1 39.1" fill="none" preserveAspectRatio="none">
      <defs>
        <linearGradient id="playGradient0" x1="19.55" y1="2" x2="19.55" y2="37.1" gradientUnits="userSpaceOnUse">
          <stop stopColor="#003580" />
          <stop offset="1" stopColor="#5F6EE0" />
        </linearGradient>
        <linearGradient id="playGradient1" x1="20.5175" y1="12.4551" x2="20.5175" y2="26.6451" gradientUnits="userSpaceOnUse">
          <stop stopColor="#003580" />
          <stop offset="1" stopColor="#5F6EE0" />
        </linearGradient>
        <linearGradient id="playGradient2" x1="20.5175" y1="12.4551" x2="20.5175" y2="26.6451" gradientUnits="userSpaceOnUse">
          <stop stopColor="#003580" />
          <stop offset="1" stopColor="#5F6EE0" />
        </linearGradient>
      </defs>
      <g>
        <path 
          d={svgPaths.p3014b000}
          stroke="url(#playGradient0)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
          fill="none"
        />
        <path 
          d={svgPaths.p23b27e80}
          fill="url(#playGradient1)"
          stroke="url(#playGradient2)"
          strokeWidth="4"
        />
      </g>
    </svg>
  );
}

// Volume Icon Component
function HeartIconSVG() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 16.6697 15.8319" fill="none" preserveAspectRatio="none">
      <defs>
        <linearGradient id="volumeGradient" x1="8.33486" y1="0" x2="8.33486" y2="15.8319" gradientUnits="userSpaceOnUse">
          <stop stopColor="#003580" />
          <stop offset="1" stopColor="#5F6EE0" />
        </linearGradient>
      </defs>
      <path 
        d={svgPaths.p31248d00}
        fill="url(#volumeGradient)"
      />
    </svg>
  );
}

// Progress Dot Component
function ProgressDotSVG() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 13 13" fill="none" preserveAspectRatio="none">
      <defs>
        <linearGradient id="dotGradient" x1="6.5" y1="0" x2="6.5" y2="13" gradientUnits="userSpaceOnUse">
          <stop stopColor="#003580" />
          <stop offset="1" stopColor="#5F6EE0" />
        </linearGradient>
      </defs>
      <circle cx="6.5" cy="6.5" r="6.5" fill="url(#dotGradient)" />
    </svg>
  );
}

export function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  
  return (
    <div className="music-player">
      <div className="music-player-container">
        {/* Progress Bar Section */}
        <div className="progress-section">
          <div className="progress-bar-active" />
          <div className="progress-bar-inactive" />
        </div>
        
        {/* Main Player Content */}
        <div className="player-content">
          {/* Left Section - Album Art and Track Info */}
          <div className="left-section">
            <div className="album-art-container">
              <img src={"../../assets/images/playlist_cover_1.png"} alt="Album Art" className="album-art" />
            </div>
            
            <div className="track-info-container">
              <p className="track-title">PIXELATED KISSES</p>
              <p className="track-artist">Joji</p>
            </div>
            
            <div className="heart-icon-container">
              <HeartIconSVG />
            </div>
            
            <div className="menu-icon-container">
              <svg width="100%" height="100%" viewBox="0 0 24.3333 19" fill="none" preserveAspectRatio="none">
                <path 
                  d={svgPaths.p26913670}
                  stroke="#55C5F1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  fill="none"
                />
              </svg>
            </div>
          </div>
          
          {/* Center Section - Play Controls */}
          <div className="center-section">
            <span className="time-display">3:13</span>
            
            <div className="play-button-wrapper">
              <button className="play-button" onClick={() => setIsPlaying(!isPlaying)}>
                <div className="play-button-bg">
                  <div className="play-button-circle">
                    <PlayButtonSVG isPlaying={isPlaying} />
                  </div>
                </div>
              </button>
            </div>
            
            <span className="time-display">4:05</span>
          </div>
          
          {/* Right Section - Controls */}
          <div className="right-section">
            <div className="download-list-icon-container">
              <svg width="100%" height="100%" viewBox="0 0 23 23.0002" fill="none" preserveAspectRatio="none">
                <g>
                  <path 
                    d={svgPaths.p25f02f00}
                    stroke="#55C5F1"
                    strokeLinecap="round"
                    strokeWidth="3"
                    fill="none"
                  />
                  <path 
                    d={svgPaths.p2ca0cb00}
                    stroke="#55C5F1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    fill="none"
                  />
                </g>
              </svg>
            </div>
            
            <div className="volume-icon-container">
              <svg width="100%" height="100%" viewBox="0 0 27 24.6506" fill="none" preserveAspectRatio="none">
                <path 
                  d={svgPaths.p177f5400}
                  stroke="#55C5F1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  fill="none"
                />
              </svg>
            </div>
            
            <div className="volume-slider-container">
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="volume-slider"
                style={{
                  background: `linear-gradient(to right, #55C5F1 0%, #55C5F1 ${volume}%, #D9D9D9 ${volume}%, #D9D9D9 100%)`
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
