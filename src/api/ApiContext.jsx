import { createContext, useContext } from "react";
export const ApiContext = createContext({ profile: null });
export const useApi = () => useContext(ApiContext);
