"use client";

import { useState } from "react";
import { useProcessos } from "@/app/context/ProcessosContext";

export default function Home() {
  const { processos, votar } = useProcessos();
  const [usuario, setUsuario] = useState("");
  const [votosSelecionados, setVotosSelecionados] = useState<{ [key: number]: "Sim" | "Não" | "Abstenção" }>({});

  function handleVotar(processoId: number) {
    const voto = votosSelecionados[processoId];
    if (usuario && voto) {
      votar(usuario, processoId, voto);
    }
  }

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Sistema de Votação</h1>
      <input
        className="border p-2 w-full"
        placeholder="Digite seu nome"
        value={usuario}
        onChange={(e) => setUsuario(e.target.value)}
      />
      {processos.map((processo) => (
        <div key={processo.id} className="border p-4 rounded-lg">
          <h2 className="text-xl font-semibold">{processo.nome}</h2>
          <select
            className="border p-2 mt-2 w-full"
            value={votosSelecionados[processo.id] || ""}
            onChange={(e) => setVotosSelecionados((prev) => ({ ...prev, [processo.id]: e.target.value as any }))}
          >
            <option value="">Selecione o voto</option>
            <option value="Sim">Sim</option>
            <option value="Não">Não</option>
            <option value="Abstenção">Abstenção</option>
          </select>
          <button
            className="bg-blue-500 text-white mt-2 p-2 rounded w-full"
            onClick={() => handleVotar(processo.id)}
          >
            Votar
          </button>
          <div className="mt-2">
            <h3 className="font-semibold">Votos:</h3>
            <ul className="list-disc ml-4">
              {processo.votos.map((voto, idx) => (
                <li key={idx}>
                  {voto.membro}: {voto.voto}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}