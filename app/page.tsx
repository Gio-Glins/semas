"use client";

import { useState, useEffect} from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import * as XLSX from "xlsx";

const membrosPleno = [
  "Rodolpho  Bastos",
  "Lilia Reis",
  "Fabricio Júnior",
  "Marcelo Moreno",
  "Luciene Chaves",
  "Raul Protázio",
  "Giovanni Glins",
  "teste",
];

const administrador = "Giovanni Nogueira Glins";

export default function PlenariaApp() {
  const [processos, setProcessos] = useState<any[]>([]);
  const [processoSelecionado, setProcessoSelecionado] = useState<any>(null);
  const [usuario, setUsuario] = useState("");
  const [autenticado, setAutenticado] = useState(false);
  const [senha, setSenha] = useState("");
  const [nomeInput, setNomeInput] = useState("");
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [mostrarMotivo, setMostrarMotivo] = useState(false);
  const [planilhaCarregada, setPlanilhaCarregada] = useState(false);

   useEffect(() => {
    const dadosSalvos = localStorage.getItem('dadosDaPlenaria');
    // O 'if' verifica se existem dados salvos antes de usá-los
    if (dadosSalvos) {
      setProcessos(JSON.parse(dadosSalvos));
      setPlanilhaCarregada(true);
    }
  }, []);

    useEffect(() => {
    // O 'if' evita salvar uma lista vazia no início
    if (processos.length > 0) {
      localStorage.setItem('dadosDaPlenaria', JSON.stringify(processos));
    }
  }, [processos]);

  const selecionarProcesso = (idStr: string) => {
    const id = Number(idStr);
    const proc = processos.find((p) => p.id === id);
    setProcessoSelecionado(proc);
    setMostrarMotivo(false);
    setMotivoRejeicao("");
  };

  const registrarVoto = (voto: string) => {
    if (!processoSelecionado || !usuario) return;
    if (voto === "contra" && !motivoRejeicao) return;

    const atualizado = processos.map((p) => {
      if (p.id !== processoSelecionado.id) return p;

      const novosVotos = [
        ...(p.votos || []),
        {
          membro: usuario,
          voto,
          motivo: voto === "contra" ? motivoRejeicao : null,
        },
      ];

      const todosVotaram = membrosPleno.every((m) =>
        novosVotos.some((v) => v.membro === m)
      );

      return {

        ...p,
        votos: novosVotos,
        status: todosVotaram ? "finalizado" : "pendente",
      };
    });

    setProcessos(atualizado);
    setProcessoSelecionado(null);
    setMotivoRejeicao("");
    setMostrarMotivo(false);
  };

  const processosRestantes = processos.filter(
    (p) => !(p.votos && p.votos.some((v: { membro: string }) => v.membro === usuario))
  );

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const processosConvertidos = jsonData.map((row: any, index: number) => ({
        id: row["ID"] || index + 1,
        numero: row["Número do Processo"] || `N/A-${index + 1}`,
        nome: row["Autuado"] || "sem nome",
        resumo: row["Ementa"] || "Sem resumo",
        pc: row ["Parecer Técnico"] || "Sem parecer",
        parecer: row["Primeira Instancia"] || "Sem manifestacao",
        sugestao: row["Sugestão de Julgamento"] || "Sem sugestão",
        obs: row["Obs"] || "",
        termo: row["Termo"] || "",
        status: "pendente",
        votos: [],
        // --- ALTERAÇÃO AQUI ---
        // Adiciona o campo de documentos, lendo a coluna "Documentos" do Excel
        documentos: row["Documentos"]?.split(",").map((d: string) => d.trim()) || [],
      }));

      setProcessos(processosConvertidos);
      setPlanilhaCarregada(true);
    };
    reader.readAsArrayBuffer(file);
  };

  const autenticarUsuario = () => {
    const nomesValidos = [administrador, ...membrosPleno];
    if (nomesValidos.includes(nomeInput) && senha === "1234") {
      setUsuario(nomeInput);
      setAutenticado(true);
    } else {
      alert("Nome ou senha incorretos.");
    }
  };

  const exportarResultados = () => {
    const dadosExportados = processos.map((proc) => ({
      "Obs": proc.obs,
      "Termo": proc.termo,
      ...Object.fromEntries(
        (proc.votos || []).map((v: any, i: number) => [
          `Voto ${i + 1}`,
          `${v.membro}: ${v.voto === "favor" ? "Aprovou o parecer" : `Voto (${v.motivo || "Sem motivo especificado"})`}`,
        ])
      ),
    }));

    const ws = XLSX.utils.json_to_sheet(dadosExportados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultados");
    XLSX.writeFile(wb, "resultados_plenaria.xlsx");
  };

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen text-white">
      <img
        src="logo_semas.png"  
        alt="Tribunal Administrativo de Recursos Ambientais"
        className="mx-auto mb-4 w-auto h-16"  
      />
      <h2 className="text-2xl font-bold text-center mb-4"> 18ª Plenaria Extraordinária </h2>
        {!planilhaCarregada ? (
          <div className="space-y-4 max-w-xl bg-gray-900 rounded p-6 mx-auto text-center">
            <label className="block mb-2 font-semibold text-lg">Carregar planilha do Excel:</label>
            <label className="inline-block cursor-pointer bg-gray-600 text-white font-semibold py-2 px-4 rounded hover:bg-gray-700 transition">
              Carregar
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleUpload}
                className="hidden"
              />
            </label>
          </div>
      
        ) : !autenticado ? (
          <div className="space-y-4 max-w-md bg-gray-800 shadow-md rounded p-6 mx-auto">
            <p className="text-lg font-medium">Insira seu nome e senha para acessar:</p>
            <input
              type="text"
              placeholder="Nome"
              className="w-full border px-3 py-2 rounded bg-gray-700 text-white"
              value={nomeInput}
              onChange={(e) => setNomeInput(e.target.value)}
            />
            <input
              type="password"
              placeholder="Senha"
              className="w-full border px-3 py-2 rounded bg-gray-700 text-white"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
            <Button className="w-full" onClick={autenticarUsuario}>Entrar</Button>
          </div>
        ) : (
    
          <div className="space-y-6">
            <p className="text-sm text-right text-gray-400">
              Usuário autenticado: <strong>{usuario}</strong>
            </p>
            {usuario !== administrador && processos.length > 0 && processosRestantes.length > 0 && (
              <div className="flex flex-row flex-wrap justify-center items-center space-x-2 space-y-1 max-w-7xl bg-gray-900 p-2 mx-auto">
                {processosRestantes.map((proc) => (
                  <Button
                    key={proc.id}
                    className=" font-bold border-2 px-4 py-2 bg-gray-950 hover:bg-slate-500 transition transition"
                    onClick={() => selecionarProcesso(proc.id.toString())}
                  >
                    {proc.id}
                  </Button>
                ))}
              </div>
            )}

            {usuario !== administrador && processos.length > 0 && processosRestantes.length === 0 && (
              <p className="text-green-600 text-xl text-center font-bold">Você já votou em todos os processos.</p>
            )}

            {/* --- GRANDE ALTERAÇÃO AQUI --- */}
            {/* Implementa o layout de 2 colunas para exibir documentos e detalhes do processo */}
            {usuario !== administrador && processoSelecionado && (
              <div className="flex flex-col md:flex-row gap-2 max-w-7xl mx-auto">
                {/* Coluna da Esquerda: Documentos */}
                <div className="w-full md:w-1/4">
                  {processoSelecionado.documentos && processoSelecionado.documentos.length > 0 && (
                   <Card className="bg-gray-800 text-white border border-gray-700"> 
  <CardContent className="p-6"> 
    <h3 className="text-lg font-bold mb-4 pb-4 border-b border-gray-600">Documentos do Processo</h3>
                        <ul className="space-y-2">
                          {processoSelecionado.documentos.map((doc: string, index: number) => (
                            <li key={index}>
                              <a
                                href={`/documentos/processo_${processoSelecionado.id}/${doc}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                 className="flex items-center w-full p-3 rounded-lg text-gray-200 hover:bg-gray-700 transition-colors duration-200"
                              >
 
                                {doc}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
                {/* Coluna da Direita: Detalhes e Votação */}
                <div className="w-full md:w-2/3">
                  <Card className="shadow-lg">
                    <CardContent className="space-y-4 pt-6">
                      <h2 className="text-2xl font-bold text-black"> 
                        PROCESSO Nº {processoSelecionado.numero}
                      </h2>  
                      <p className=" text-justify text-[17px] text-sm/6"><strong>Autuado(a):</strong> {processoSelecionado.nome}</p>
                      <p className=" text-justify text-[17px] text-sm/6"><strong>Ementa:</strong> {processoSelecionado.resumo}</p>
                      <p className=" text-justify text-[17px] text-sm/6"><strong>Sintese do parecer:</strong> {processoSelecionado.pc}</p>
                      <p className=" text-justify text-[17px] text-sm/6"><strong>Primeira instancia:</strong> {processoSelecionado.parecer}</p>
                      <p className=" text-justify text-[17px] text-sm/6"><strong>Sugestão de Julgamento:</strong> {processoSelecionado.sugestao}</p>
                      <p className=" text-justify font-semibold text-xs text-cyan-800 underline"> {processoSelecionado.obs}</p>

                      <div className="space-y-4">
                        <div className="flex space-x-4">
                          <Button className="flex-1 bg-lime-500 hover:bg-lime-700 text-white font-bold py-2 px-4 rounded-full" onClick={() => registrarVoto("favor")}>Aprovar parecer</Button>
                          <Button
                            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-full"
                            onClick={() => setMostrarMotivo(true)}
                          >
                            Acatar Parcialmente
                          </Button>
                          <Button
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full"
                            onClick={() => setMostrarMotivo(true)}
                          >
                            Rejeitar parecer
                          </Button>
                        </div>

                        {mostrarMotivo && (
                          <div className="bg-gray-100 p-4 rounded text-black">
                            <label className="block mb-2 font-medium">
                              Voto (obrigatório):
                            </label>
                            <Select onValueChange={setMotivoRejeicao} value={motivoRejeicao}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione o voto" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="majorar">Majorar</SelectItem>
                                <SelectItem value="minorar">Minorar</SelectItem>
                                <SelectItem value="manter o PJ">Manter o PJ</SelectItem>
                                <SelectItem value="cancelar o auto">Cancelar o auto</SelectItem>
                                <SelectItem value="baixar em diligencia">Baixar em diligência</SelectItem>
                                <SelectItem value="outro">Outro</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="mt-4 flex space-x-4">
                              <Button
                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-full"
                                onClick={() => registrarVoto("contra")}
                                disabled={!motivoRejeicao}
                              >
                                Confirmar voto
                              </Button>
                              <Button className="flex-1 bg-stone-700 hover:bg-stone-800 text-white font-bold py-2 px-4 rounded-full" onClick={() => setMostrarMotivo(false)}>
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
            
            {/* Seção de Resumo para o Administrador (não foi alterada) */}
            {usuario === administrador && (
              <div className="mt-16 bg-gray-900 p-6 rounded shadow-md text-black">
                <h2 className="text-2xl font-bold mb-4 text-white">
                  Resumo dos Votos
                </h2>
                <Button className="mb-6 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 px-4 rounded-full" onClick={exportarResultados}>
                  Exportar Resultados
                </Button>
                {processos.map((proc) => (
                  <Card key={proc.id} className="mb-4">
                    <CardContent className="pt-4">
                      <h3 className="text-xl font-bold text-gray-800">
                        Processo {proc.numero}
                      </h3>
                      <ul className="mt-2 space-y-1">
                        {(proc.votos || []).map((v: any, index: number) => (
                          <li key={index}>
                            <strong>{v.membro}:</strong> {v.voto === "favor" ? "Aprovou" : `Voto: (${v.motivo})`}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
    </div>
  );
     
}
