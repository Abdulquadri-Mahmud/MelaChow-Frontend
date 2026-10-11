// Rendered in the exported HTML before the mobile React bundle hydrates.
// Keep it visually identical to the customer splash during the handoff.
export default function StartupFallback() {
  return (
    <div className="native-startup-splash" role="status" aria-label="Opening MelaChow">
      <img
        src="/melachow-vendor-splash-clean.png"
        alt=""
        fetchPriority="high"
      />
      <div className="native-startup-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
