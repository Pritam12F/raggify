import { createContext } from "react";

export const SourceContext = createContext<{ nword: string } | null>();

export const SourceContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <SourceContext.Provider value={{ nword: "nword" }}>
      {children}
    </SourceContext.Provider>
  );
};
