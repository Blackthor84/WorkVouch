"use client";

export function TrustLabHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: 420,
        height: "100vh",
        background: "#0b0b0b",
        color: "#fff",
        padding: 20,
        overflowY: "auto",
        zIndex: 10000,
        boxShadow: "-4px 0 20px rgba(0,0,0,0.4)",
      }}
    >
      <button
        onClick={onClose}
        style={{
          float: "right",
          background: "none",
          border: "none",
          color: "#fff",
          fontSize: 18,
          cursor: "pointer",
        }}
      >
        ✕
      </button>

      <h2>Trust Simulation Lab — Quick Guide</h2>

      <p style={{ opacity: 0.85 }}>
        Everything in this lab is simulated. Real employee records are never modified.
      </p>

      <hr />

      <h3>Basic Workflow</h3>
      <ol>
        <li>Select an industry to set trust thresholds</li>
        <li>Review the employee&rsquo;s current trust profile</li>
        <li>Add simulated verification or adjust thresholds</li>
        <li>Review projected trust and risk impact</li>
        <li>Save or export the scenario if needed</li>
      </ol>

      <h3>Key Concepts</h3>
      <ul>
        <li><strong>Trust Score</strong>: Verified signal strength</li>
        <li><strong>Confidence Score</strong>: Certainty of the trust score</li>
        <li><strong>Scenario</strong>: A saved simulation</li>
        <li><strong>Delta</strong>: Difference between real and simulated outcomes</li>
      </ul>

      <h3>What This Is Not</h3>
      <ul>
        <li>No automatic hiring decisions</li>
        <li>No editing of historical data</li>
        <li>No hidden scoring logic</li>
      </ul>

      <h3>One-Sentence Summary</h3>
      <blockquote style={{ opacity: 0.85 }}>
        &ldquo;Trust Simulation Lab lets us test hiring and verification decisions before making them.&rdquo;
      </blockquote>
    </div>
  );
}
