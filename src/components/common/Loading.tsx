import React from "react";
import "./Loading.css";

interface LoadingProps {
  /**
   * Size of the loading spinner
   * @default "medium"
   */
  size?: "small" | "medium" | "large";
  
  /**
   * Display as fullscreen overlay
   * @default false
   */
  fullscreen?: boolean;
  
  /**
   * Loading text to display below spinner
   */
  text?: string;
  
  /**
   * Color variant of the spinner
   * @default "primary"
   */
  variant?: "primary" | "secondary" | "white";
  
  /**
   * Custom className
   */
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({
  size = "medium",
  fullscreen = false,
  text,
  variant = "primary",
  className = "",
}) => {
  if (fullscreen) {
    return (
      <div className={`loading-overlay ${className}`}>
        <div className="loading-container">
          <div className={`loading-spinner ${size} ${variant}`}>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          {text && <p className="loading-text">{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={`loading-inline ${className}`}>
      <div className={`loading-spinner ${size} ${variant}`}>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

export default Loading;
