import axios from "axios";
import Link from "next/link";

// Signed out → a sign-in link. Anything else (server down, no connection) → say so,
// with a Retry button, instead of leaving the page blank.
const RedirectMessage = ({
  error,
  onRetry,
}: {
  error: Error | null;
  onRetry?: () => void;
}) => {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;

  if (status === 401) {
    return (
      <div className="mt-10 text-center text-2xl font-semibold">
        Please{" "}
        <Link href="/sign-in" className="link link-primary">
          sign in
        </Link>{" "}
        to view your library.
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="mx-auto mt-10 flex max-w-sm flex-col items-center gap-3 text-center"
    >
      <p className="font-serif text-xl font-semibold">
        Couldn&apos;t load your shelf
      </p>
      <p className="text-sm opacity-70">
        Check your connection, then try again.
      </p>
      {onRetry && (
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={onRetry}
        >
          Try again
        </button>
      )}
    </div>
  );
};
export default RedirectMessage;
