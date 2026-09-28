import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import madaLogo from "../assets/images/maya-bird.png";

interface LoadingContextValue {
  showLoader: (message?: string) => void;
  hideLoader: () => void;
  withLoader: <T>(task: () => Promise<T>, message?: string) => Promise<T>;
  isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextValue | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("Loading...");

  const showLoader = (msg?: string) => {
    if (msg) setMessage(msg);
    setIsLoading(true);
  };

  const hideLoader = () => setIsLoading(false);

  const withLoader = async <T,>(
    task: () => Promise<T>,
    msg?: string
  ): Promise<T> => {
    if (msg) setMessage(msg);
    setIsLoading(true);
    try {
      return await task();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoadingContext.Provider
      value={{ showLoader, hideLoader, withLoader, isLoading }}
    >
      {children}
      {isLoading && (
        <LoadingSpinner
          variant="leaf"
          logo={madaLogo}
          title="MADA"
          text={message}
        />
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error("useLoading must be used inside <LoadingProvider>");
  return ctx;
}