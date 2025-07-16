import React from "react";

interface LoaderProps {
  message?: string;
  className?: string;
}

const Loader: React.FC<LoaderProps> = ({ message = "Loading...", className = "" }) => {
  return (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
      <span className="text-gray-600 text-base text-center">{message}</span>
    </div>
  );
};

export default Loader; 