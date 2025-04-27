"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Voto = {
  membro: string;
  voto: "Sim" | "Não" | "Abstenção";
};

type Processo = {
  id: number;
  nome: string;
  votos: Voto[];
};

type ProcessosContextType = {
  processos: Processo[];
  votar: (usuario: string, processoId: number, votoEscolhido: "Sim" | "Não" | "Abstenção") => void;
};

const ProcessosContext = createContext<ProcessosContextType | undefined>(undefined);

const PROCESSOS_STORAGE_KEY = "processos-votacao";

export function ProcessosProvider({ children }: { children: ReactNode }) {
  const [processos, setProcessos] = useState<Processo[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(PROCESSOS_STORAGE_KEY);
    if (stored) {
      setProcessos(JSON.parse(stored));
    } else {
      setProcessos([
        { id: 1, nome: "Processo 1", votos: [] },
        { id: 2, nome: "Processo 2", votos: [] },
      ]);
    }
  }, []);

  useEffect(() => {
    if (processos.length > 0) {
      localStorage.setItem(PROCESSOS_STORAGE_KEY, JSON.stringify(processos));
    }
  }, [processos]);

  function votar(usuario: string, processoId: number, votoEscolhido: "Sim" | "Não" | "Abstenção") {
    setProcessos((prev) =>
      prev.map((p) => {
        if (p.id === processoId) {
          const novosVotos = [...p.votos.filter((v) => v.membro !== usuario), { membro: usuario, voto: votoEscolhido }];
          return { ...p, votos: novosVotos };
        }
        return p;
      })
    );
  }

  return (
    <ProcessosContext.Provider value={{ processos, votar }}>
      {children}
    </ProcessosContext.Provider>
  );
}

export function useProcessos() {
  const context = useContext(ProcessosContext);
  if (!context) {
    throw new Error("useProcessos deve ser usado dentro de um ProcessosProvider");
  }
  return context;
}