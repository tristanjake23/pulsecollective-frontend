import { createContext, useContext } from "react";
import useClinicState from "./useClinicState.js";
const Context = createContext(null);
export function WorkspaceProvider({ onLogout, children }) {
  const clinic = useClinicState();
  return (
    <Context.Provider value={{ ...clinic, onLogout }}>
      {children}
    </Context.Provider>
  );
}
export function useWorkspace() {
  const value = useContext(Context);
  if (!value) throw Error("WorkspaceProvider is required");
  return value;
}
