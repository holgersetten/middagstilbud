interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <span className="text-6xl mb-4 block">⚠️</span>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">Noe gikk galt</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        {onRetry && (
          <button 
            onClick={onRetry} 
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Prøv igjen
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorMessage;
