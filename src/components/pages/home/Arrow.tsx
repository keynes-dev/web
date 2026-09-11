export type ArrowPosition = "keynes" | "transit" | "app";

interface ArrowProps {
  position?: ArrowPosition;
  vertical?: boolean;
}

const STEP_CENTERS = [12, 52, 92] as const;

export function Arrow({ position = "app", vertical = false }: ArrowProps) {
  const activeStep = position === "keynes" ? 1 : position === "transit" ? 2 : 3;

  return (
    <div
      aria-hidden="true"
      className="step-indicator relative block shrink-0"
      data-indicator-position={position}
      style={{ height: vertical ? 104 : 24, width: vertical ? 24 : 104 }}
    >
      <div
        className={
          vertical
            ? "absolute left-1/2 top-1/2 h-6 w-[104px] -translate-x-1/2 -translate-y-1/2 rotate-90"
            : "relative h-6 w-[104px]"
        }
      >
        <img
          alt=""
          className="step-indicator-rail absolute inset-0 block h-6 w-[104px] max-w-none"
          data-node-id="572:56"
          src="/indicator.svg"
        />
        {STEP_CENTERS.map((center, index) => (
          <span
            className={`journey-step-fill${activeStep === index + 1 ? " is-active" : ""}`}
            data-journey-step={index + 1}
            key={center}
            style={{ left: center }}
          />
        ))}
      </div>
    </div>
  );
}
