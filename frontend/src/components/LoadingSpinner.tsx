function LoadingSpinner() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
      </div>
      <p className="mt-4 text-lg text-gray-600">Laster tilbud...</p>
    </div>
  );
}

export default LoadingSpinner;
