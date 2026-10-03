import { useId, type ReactNode } from "react";

const CLASSE_CONTROLE =
  "touch-target mt-1 w-full rounded-xl border bg-white px-4 text-base text-tinta outline-none focus:border-projeto-500";

export function Secao({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-concreto-300 border-l-[3px] border-l-projeto-900 bg-white p-4">
      <h2 className="font-display text-base text-tinta">{titulo}</h2>
      {descricao && <p className="mt-1 text-sm text-tinta-suave">{descricao}</p>}
      <div className="mt-4 flex flex-col gap-3">{children}</div>
    </section>
  );
}

export function Campo({
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  inputMode,
  autoComplete,
  erro,
  dica,
}: {
  label: string;
  value: string | null;
  onChange: (valor: string) => void;
  onBlur?: () => void;
  type?: string;
  inputMode?: "text" | "numeric" | "tel" | "email";
  autoComplete?: string;
  erro?: string | null;
  dica?: string;
}) {
  const id = useId();
  const erroId = `${id}-erro`;

  return (
    <label className="text-sm text-tinta-suave" htmlFor={id}>
      {label}
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value ?? ""}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? erroId : undefined}
        onBlur={onBlur}
        onChange={(e) => onChange(e.target.value)}
        className={`${CLASSE_CONTROLE} ${erro ? "border-alerta" : "border-concreto-300"}`}
      />
      {erro ? (
        <span id={erroId} className="mt-1 block text-sm text-alerta">
          {erro}
        </span>
      ) : (
        dica && <span className="mt-1 block text-sm text-tinta-suave">{dica}</span>
      )}
    </label>
  );
}

export { CLASSE_CONTROLE };
