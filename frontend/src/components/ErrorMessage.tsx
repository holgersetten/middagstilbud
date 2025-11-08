import './ErrorMessage.css';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="error-container">
      <div className="error-content">
        <span className="error-icon">⚠️</span>
        <h2>Noe gikk galt</h2>
        <p>{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="retry-button">
            Prøv igjen
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorMessage;
