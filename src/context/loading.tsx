import { createContext } from "vm";

export const LoadingContext = createContext(6);

export const LoadingProvider = () => {
  return <LoadingContext></LoadingContext>;
};
