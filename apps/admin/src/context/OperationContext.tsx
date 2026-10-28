"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";

export type OperationType = "POST" | "CHATTER" | "CONFIG" | "GALLERY" | "FRIEND";

export interface Operation {
  id: string;
  type: OperationType;
  label: string;
  description: string;
  timestamp: string;
  payload: any;
}

type OperationInput = Omit<Operation, "id" | "timestamp">;

type OperationApi = {
  operations: Operation[];
  addOperation: (operation: OperationInput) => void;
  removeOperation: (id: string) => void;
  clearOperations: () => void;
};

type Action =
  | { type: "add"; operation: Operation }
  | { type: "remove"; id: string }
  | { type: "clear" };

const OperationContext = createContext<OperationApi | null>(null);

function reducer(state: Operation[], action: Action): Operation[] {
  switch (action.type) {
    case "add": {
      const next = action.operation;
      const withoutDuplicate = state.filter(
        (item) => !(item.type === next.type && item.label === next.label)
      );
      return [...withoutDuplicate, next];
    }
    case "remove":
      return state.filter((item) => item.id !== action.id);
    case "clear":
      return [];
    default:
      return state;
  }
}

export function OperationProvider({ children }: { children: ReactNode }) {
  const [operations, dispatch] = useReducer(reducer, []);
  const serial = useRef(0);

  const addOperation = useCallback((input: OperationInput) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `op-${Date.now()}-${++serial.current}`;

    dispatch({
      type: "add",
      operation: {
        ...input,
        id,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    });
  }, []);

  const removeOperation = useCallback((id: string) => {
    dispatch({ type: "remove", id });
  }, []);

  const clearOperations = useCallback(() => {
    dispatch({ type: "clear" });
  }, []);

  const value = useMemo(
    () => ({ operations, addOperation, removeOperation, clearOperations }),
    [operations, addOperation, removeOperation, clearOperations]
  );

  return <OperationContext.Provider value={value}>{children}</OperationContext.Provider>;
}

export function useOperations() {
  const context = useContext(OperationContext);
  if (!context) throw new Error("useOperations must be used within an OperationProvider");
  return context;
}
