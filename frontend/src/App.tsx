import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import clsx from "clsx";
import {
  createFlag,
  evaluateFeature,
  getFlagHistory,
  listFlags,
  updateFlag,
} from "./api/featureFlags";
import type { AuditLog, Environment, EvaluationResponse, FeatureFlag } from "./types";

type NewFlagForm = {
  key: string;
  description: string;
  rollout: number;
  environment: Environment;
  actor: string;
};

const environmentOptions: Environment[] = ["DEV", "STAGING", "PROD"];

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

function App() {
  const [environmentFilter, setEnvironmentFilter] = useState<Environment | "ALL">("ALL");
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null);
  const [history, setHistory] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string>("");
  const [newFlag, setNewFlag] = useState<NewFlagForm>({
    key: "",
    description: "",
    rollout: 0,
    environment: "DEV",
    actor: "time-produto",
  });
  const [evaluationUser, setEvaluationUser] = useState("cliente-123");
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResponse | null>(null);

  const groupedFlags = useMemo(() => {
    return flags.reduce<Record<Environment, FeatureFlag[]>>(
      (accumulator, flag) => {
        accumulator[flag.environment].push(flag);
        return accumulator;
      },
      { DEV: [], STAGING: [], PROD: [] },
    );
  }, [flags]);

  const loadFlags = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await listFlags(environmentFilter === "ALL" ? undefined : environmentFilter);
      setFlags(data);
      setFeedback("");
      setSelectedFlag((previous) => {
        if (!previous) {
          return previous;
        }

        return data.find((flag) => flag.id === previous.id) ?? null;
      });
    } catch {
      setFeedback("Nao foi possivel carregar as flags.");
    } finally {
      setIsLoading(false);
    }
  }, [environmentFilter]);

  async function loadHistory(flagId: string) {
    try {
      const data = await getFlagHistory(flagId);
      setHistory(data);
    } catch {
      setFeedback("Falha ao buscar historico de alteracoes.");
    }
  }

  useEffect(() => {
    void loadFlags();
  }, [loadFlags]);

  async function handleCreateFlag(event: FormEvent) {
    event.preventDefault();

    try {
      await createFlag({
        key: newFlag.key,
        description: newFlag.description,
        enabled: false,
        rollout: newFlag.rollout,
        environment: newFlag.environment,
        actor: newFlag.actor,
      });

      setFeedback("Flag criada com sucesso.");
      setNewFlag({ ...newFlag, key: "", description: "", rollout: 0 });
      await loadFlags();
    } catch {
      setFeedback("Erro ao criar flag. Verifique se a chave e unica e valida.");
    }
  }

  async function handleQuickUpdate(flag: FeatureFlag, payload: Partial<FeatureFlag>) {
    try {
      await updateFlag(flag.id, {
        enabled: payload.enabled,
        rollout: payload.rollout,
        environment: payload.environment,
        actor: "operacao-dashboard",
      });

      setFeedback(`Flag ${flag.key} atualizada.`);
      await loadFlags();

      if (selectedFlag?.id === flag.id) {
        await loadHistory(flag.id);
      }
    } catch {
      setFeedback("Nao foi possivel atualizar a flag.");
    }
  }

  async function handleSelectFlag(flag: FeatureFlag) {
    setSelectedFlag(flag);
    setEvaluationResult(null);
    await loadHistory(flag.id);
  }

  async function handleEvaluate() {
    if (!selectedFlag) {
      return;
    }

    try {
      const result = await evaluateFeature({
        key: selectedFlag.key,
        userId: evaluationUser,
        environment: selectedFlag.environment,
      });

      setEvaluationResult(result);
      setFeedback("");
    } catch {
      setFeedback("Falha ao avaliar rollout para este usuario.");
    }
  }

  return (
    <div className="page-shell">
      <div className="bg-gradient" />

      <header className="hero">
        <p className="eyebrow">Portfolio Project</p>
        <h1>Console de Feature Flags</h1>
        <p>
          Controle de release com rollout percentual, governanca por ambiente e auditoria
          rastreavel para times de produto e engenharia.
        </p>
      </header>

      <main className="layout-grid">
        <section className="panel">
          <h2>Nova Feature Flag</h2>
          <form className="stack" onSubmit={handleCreateFlag}>
            <label>
              Chave da feature
              <input
                value={newFlag.key}
                onChange={(event) => setNewFlag({ ...newFlag, key: event.target.value })}
                placeholder="ex: nova-tela-checkout"
                required
              />
            </label>

            <label>
              Descricao
              <textarea
                value={newFlag.description}
                onChange={(event) => setNewFlag({ ...newFlag, description: event.target.value })}
                placeholder="Resumo funcional e contexto de negocio"
                required
              />
            </label>

            <div className="row two">
              <label>
                Rollout inicial (%)
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={newFlag.rollout}
                  onChange={(event) =>
                    setNewFlag({ ...newFlag, rollout: Number(event.target.value) })
                  }
                />
              </label>

              <label>
                Ambiente
                <select
                  value={newFlag.environment}
                  onChange={(event) =>
                    setNewFlag({ ...newFlag, environment: event.target.value as Environment })
                  }
                >
                  {environmentOptions.map((environment) => (
                    <option key={environment} value={environment}>
                      {environment}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Responsavel pela mudanca
              <input
                value={newFlag.actor}
                onChange={(event) => setNewFlag({ ...newFlag, actor: event.target.value })}
                required
              />
            </label>

            <button type="submit">Criar flag</button>
          </form>
        </section>

        <section className="panel wide">
          <div className="row header-row">
            <h2>Painel de Operacao</h2>
            <select
              value={environmentFilter}
              onChange={(event) =>
                setEnvironmentFilter(event.target.value as Environment | "ALL")
              }
            >
              <option value="ALL">Todos os ambientes</option>
              {environmentOptions.map((environment) => (
                <option key={environment} value={environment}>
                  {environment}
                </option>
              ))}
            </select>
          </div>

          {isLoading ? <p>Carregando flags...</p> : null}

          {environmentOptions.map((environment) => (
            <div key={environment} className="stack">
              <h3>{environment}</h3>

              {groupedFlags[environment].length === 0 ? (
                <p className="muted">Sem flags registradas neste ambiente.</p>
              ) : (
                <div className="flag-list">
                  {groupedFlags[environment].map((flag) => (
                    <article
                      key={flag.id}
                      className={clsx("flag-card", selectedFlag?.id === flag.id && "selected")}
                    >
                      <div className="flag-header">
                        <div>
                          <strong>{flag.key}</strong>
                          <p>{flag.description}</p>
                        </div>
                        <span className={clsx("pill", flag.enabled ? "on" : "off")}>
                          {flag.enabled ? "ATIVA" : "INATIVA"}
                        </span>
                      </div>

                      <div className="row">
                        <button onClick={() => handleQuickUpdate(flag, { enabled: !flag.enabled })}>
                          {flag.enabled ? "Desativar" : "Ativar"}
                        </button>

                        <label className="inline-control">
                          Rollout
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={flag.rollout}
                            onChange={(event) =>
                              handleQuickUpdate(flag, {
                                rollout: Number(event.target.value),
                              })
                            }
                          />
                          <span>{flag.rollout}%</span>
                        </label>

                        <button onClick={() => handleSelectFlag(flag)}>Ver historico</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>

        <section className="panel">
          <h2>Auditoria</h2>

          {!selectedFlag ? <p>Selecione uma flag para ver o historico.</p> : null}

          {selectedFlag ? (
            <>
              <p>
                <strong>Flag:</strong> {selectedFlag.key}
              </p>

              <div className="stack">
                {history.length === 0 ? <p className="muted">Sem eventos.</p> : null}
                {history.map((entry) => (
                  <article key={entry.id} className="history-item">
                    <strong>{entry.action}</strong>
                    <span>{entry.actor}</span>
                    <small>{formatDate(entry.createdAt)}</small>
                  </article>
                ))}
              </div>

              <hr />

              <h3>Simulador de avaliacao</h3>
              <label>
                ID do usuario
                <input
                  value={evaluationUser}
                  onChange={(event) => setEvaluationUser(event.target.value)}
                />
              </label>
              <button onClick={handleEvaluate}>Simular rollout</button>

              {evaluationResult ? (
                <p className={clsx("evaluation", evaluationResult.enabled ? "ok" : "fail")}>
                  Resultado: {evaluationResult.enabled ? "Habilitada" : "Bloqueada"} ({" "}
                  {evaluationResult.reason})
                </p>
              ) : null}
            </>
          ) : null}
        </section>
      </main>

      {feedback ? <footer className="feedback">{feedback}</footer> : null}
    </div>
  );
}

export default App;
