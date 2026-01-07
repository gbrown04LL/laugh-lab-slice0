export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif", maxWidth: "900px", margin: "0 auto" }}>
      <h1>Laugh Lab API - Slice 0</h1>
      <p>Next.js (App Router) + Prisma + Neon backend. Truth Contract v1.0.0 compliant output (stubbed user; no auth/payments; no real LLM calls).</p>

      <h2>API Endpoints</h2>

      <section style={{ marginBottom: "1.5rem" }}>
        <h3>GET /api/health</h3>
        <p>Minimal health check (DB connectivity).</p>
        <pre style={{ background: "#f4f4f4", padding: "1rem", borderRadius: "4px", overflow: "auto" }}>
{`// Response (200)
{ "ok": true }

// Response (503)
{
  "ok": false,
  "errors": [
    {
      "code": "INTERNAL_ERROR",
      "message": "Database connectivity check failed",
      "stage": "persistence",
      "retryable": true,
      "request_id": "req_...",
      "details": {}
    }
  ]
}`}
        </pre>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h3>POST /api/scripts</h3>
        <p>Submit script text (stored for Slice-0). Returns script_id.</p>
        <pre style={{ background: "#f4f4f4", padding: "1rem", borderRadius: "4px", overflow: "auto" }}>
{`// Request
{ "text": "Your comedy script text here..." }

// Response (201)
{
  "id": "uuid",
  "user_id": "test-user-1",
  "created_at": "2024-01-01T00:00:00.000Z"
}`}
        </pre>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h3>POST /api/jobs</h3>
        <p>Create an analysis job for a submitted script. Returns job_id.</p>
        <pre style={{ background: "#f4f4f4", padding: "1rem", borderRadius: "4px", overflow: "auto" }}>
{`// Request
{ "script_id": "uuid" }

// Response (201)
{
  "id": "uuid",
  "script_id": "uuid",
  "user_id": "test-user-1",
  "status": "pending",
  "run_id": null,
  "created_at": "2024-01-01T00:00:00.000Z",
  "started_at": null,
  "completed_at": null
}`}
        </pre>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h3>POST /api/jobs/[job_id]/run</h3>
        <p>Run Slice-0 analysis (Prompt A → Prompt B). Idempotent for completed jobs.</p>
        <pre style={{ background: "#f4f4f4", padding: "1rem", borderRadius: "4px", overflow: "auto" }}>
{`// Response (200)
{
  "job_id": "uuid",
  "run_id": "uuid",
  "status": "completed",
  "already_completed": false
}`}
        </pre>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h3>GET /api/reports/[run_id]</h3>
        <p>Retrieve the immutable report. Output conforms to the Truth Contract Final Output schema.</p>
        <pre style={{ background: "#f4f4f4", padding: "1rem", borderRadius: "4px", overflow: "auto", fontSize: "0.85em" }}>
{`// Response (200)
{
  "id": "uuid",
  "job_id": "uuid",
  "schema_version": "1.0.0",
  "output": {
    "schema_version": "1.0.0",
    "run": {
      "run_id": "uuid",
      "created_at": "2024-01-01T00:00:00.000Z",
      "tier_config": {
        "depth_level": "pro",
        "max_issues": 4,
        "punch_up_moments": 3,
        "options_per_moment": 3,
        "metrics_verbosity": "interpretive",
        "revision_guidance_level": "time_boxed"
      },
      "script_fingerprint": {
        "input_hash": "sha256...",
        "word_count": 6500,
        "estimated_pages": 26.0,
        "inferred_format": "half_hour",
        "tier_compatibility": "ok"
      }
    },
    "prompt_a": {
      "classification": {
        "inferred_format": "half_hour",
        "word_count": 6500,
        "estimated_pages": 26.0,
        "tier_compatibility": "ok"
      },
      "metrics": {
        "overall_score": 72.4,
        "lpm_intermediate_plus": 3.6,
        "lines_per_joke": 6.0,
        "peak_moments": [
          {
            "moment_id": "moment_1_aaaaaaaa",
            "label": "Early hook",
            "location": { "type": "line_range", "value": "L10-L18" },
            "reason_tag": "surprise"
          }
        ],
        "character_balance": {
          "ensemble_balance": 0.72,
          "dominant_character": "CHAR_A",
          "characters": [
            { "name": "CHAR_A", "joke_share": 0.45, "line_share": 0.5, "underutilized": false }
          ]
        },
        "retention_risk": {
          "overall_risk": "medium",
          "indicators": [
            { "indicator_id": "indicator_1_aaaaaaaa", "type": "gap_cluster", "location": { "type": "line_range", "value": "L85-L110" }, "severity": "moderate" }
          ]
        }
      },
      "issue_candidates": [
        {
          "issue_id": "issue_1_aaaaaaaa",
          "type": "pacing_soft_spot",
          "location": { "type": "line_range", "value": "L85-L110" },
          "severity": "moderate",
          "tags": ["pacing", "momentum"],
          "evidence": { "quote_snippet": "Snippet withheld in Slice-0 (pacing soft spot).", "metric_refs": ["lines_per_joke"] }
        }
      ]
    },
    "prompt_b": {
      "sections": {
        "comedy_metrics_snapshot": {
          "bullets": ["Overall score: 72.4/100"],
          "notes": "Deterministic Slice-0 placeholders (no external calls)."
        },
        "strengths_to_preserve": ["Clear premise signal early."],
        "whats_getting_in_the_way": [
          {
            "issue_id": "issue_1_aaaaaaaa",
            "why_it_matters": "This creates a local dip in momentum and reduces payoff clarity.",
            "concrete_fix": {
              "title": "Fix 1: tighten and escalate",
              "steps": ["Trim one beat that restates the same idea."],
              "expected_result": "Faster pace, clearer progression, stronger payoff density."
            }
          }
        ],
        "recommended_fixes": [{ "issue_id": "issue_1_aaaaaaaa", "fix": "Apply the concrete fix steps above; keep the change localized to the tagged location." }],
        "punch_up_suggestions": [
          {
            "moment_id": "moment_1_aaaaaaaa",
            "moment_context": "Early hook (L10-L18)",
            "options": [{ "option_id": "opt_1_1_bbbbbbbb", "device": "misdirection", "text": "Slice-0 placeholder punch-up option 1 for Early hook." }]
          }
        ],
        "how_to_revise_this_efficiently": {
          "revision_plan": {
            "mode": "time_boxed",
            "steps": [{ "step": "Pass 1: Fix the top issues in order.", "timebox_minutes": 25 }]
          }
        }
      }
    },
    "warnings": [],
    "errors": []
  }
}`}
        </pre>
      </section>
    </main>
  );
}
