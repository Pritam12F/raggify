"use client";

import { createContext, TransitionStartFunction, useTransition } from "react";

export const LoadingContext = createContext<
  | {
      isFilePending: boolean;
      isURLPending: boolean;
      startFileTransition: TransitionStartFunction;
      startURLTransition: TransitionStartFunction;
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

  return (
    <LoadingContext
      value={{
        isFilePending,
        isURLPending,
        startFileTransition,
        startURLTransition,
      }}
    >
      {children}
    </LoadingContext>
  );
};
