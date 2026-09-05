import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "./api.js";

const UsersContext = createContext(null);

export function UsersProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const nameFor = useCallback(
    (userId) => users.find((u) => u.id === userId)?.name || "Unknown",
    [users]
  );

  return (
    <UsersContext.Provider value={{ users, loading, error, reload, nameFor }}>
      {children}
    </UsersContext.Provider>
  );
}

export function useUsers() {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error("useUsers must be used within UsersProvider");
  return ctx;
}
