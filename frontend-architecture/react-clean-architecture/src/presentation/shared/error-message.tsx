import "./error-message.css";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="error-message">
      <p>{message}</p>
      {onRetry && (
        <button className="error-retry" onClick={onRetry}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}
