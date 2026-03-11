const ThinkingIndicator = () => {
  return (
    <div className="flex items-center space-x-2">
      <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse"></div>
      <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse delay-75"></div>
      <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse delay-150"></div>
    </div>
  );
};

export default ThinkingIndicator;
