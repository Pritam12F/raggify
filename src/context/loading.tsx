"use client";

import {
  createContext,
  TransitionStartFunction,
  useContext,
  useTransition,
} from "react";

export const LoadingContext = createContext<
  | {
      isFilePending: boolean;
      isURLPending: boolean;
      isTextPending: boolean;
      startFileTransition: TransitionStartFunction;
      startURLTransition: TransitionStartFunction;
      startTextTransition: TransitionStartFunction;
    }
  | undefined
>(undefined);

export const LoadingContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isFilePending, startFileTransition] = useTransition();
  const [isURLPending, startURLTransition] = useTransition();
  const [isTextPending, startTextTransition] = useTransition();

  return (
    <LoadingContext
      value={{
        isFilePending,
        isURLPending,
        isTextPending,
        startTextTransition,
        startFileTransition,
        startURLTransition,
      }}
    >
      {children}
    </LoadingContext>
  );
};

export const useLoadingContext = () => {
  const context = useContext(LoadingContext);

  if (!context) {
    throw new Error(
      "useLoadingContext must be used within a LoadingContextProvider",
    );
  }

  return context;
};
