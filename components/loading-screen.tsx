export default function LoadingScreen({
  label = "Connecting to your workspace",
}: {
  label?: string;
}) {
  return (
    <main className="futuristic-loading" role="status" aria-live="polite">
      <div className="loader-orbit orbit-one" />
      <div className="loader-orbit orbit-two" />
      <div className="loader-core">
        <span>D</span>
      </div>
      <div className="loader-copy">
        <strong>DE-BLOSSOM</strong>
        <span>
          {label}
          <i>...</i>
        </span>
      </div>
    </main>
  );
}
