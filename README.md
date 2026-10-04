# K6 Load and Performance Tests

A k6-based performance-testing framework for testing AI agent inference,
document upload, end-to-end attachment inference, Prometheus monitoring,
Grafana dashboards, and HTML reports.

The framework currently supports two independent performance flows:

1.  **Agent Inference - No Attachment**
2.  **Agent E2E - File Upload → session_id → Inference**

The tests are intentionally separated so each flow can be executed and
analyzed independently.

------------------------------------------------------------------------

## 1. Framework Architecture

The overall flow is:

``` text
                           ┌──────────────────────────┐
                           │        k6 Test           │
                           └────────────┬─────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    │                                       │
                    ▼                                       ▼
       ┌──────────────────────────┐             ┌──────────────────────────┐
       │ No Attachment Flow       │             │ E2E Attachment Flow     │
       │                          │             │                          │
       │ inference request        │             │ File Upload              │
       │ session_id = ""           │             │       ↓                  │
       │       ↓                  │             │ session_id               │
       │ inference response       │             │       ↓                  │
       └────────────┬─────────────┘             │ Agent Inference          │
                    │                           └────────────┬─────────────┘
                    │                                        │
                    └──────────────────┬─────────────────────┘
                                       ▼
                         ┌─────────────────────────┐
                         │ Prometheus Remote Write │
                         │ http://localhost:9090   │
                         └────────────┬────────────┘
                                      ▼
                         ┌─────────────────────────┐
                         │        Grafana          │
                         │                         │
                         │ No-Attachment Dashboard │
                         │ E2E Dashboard            │
                         └─────────────────────────┘

Each flow can also generate its own k6 HTML report.
```

------------------------------------------------------------------------

## 2. Project Structure

``` text
K6/
├── monitoring/
│   ├── docker-compose.yml
│   └── prometheus.yml
│
├── reports/
│   ├── agent-e2e-upload-inference.html
│   ├── agent-inference-no-attachment.html
│   ├── grafana/
│   │   └── grafana-agent-e2e-upload-inference-dashboard.json
│   ├── run-agent-e2e-report.ps1
│   └── run-agent-no-attachment-report.ps1
│
├── test-data/
│   └── samplepolicy.pdf
│
├── tests/
│   └── agent-inference/
│       ├── agent-e2e-upload-inference.ts
│       ├── agent-file-upload.ts
│       ├── agent-inference-no-attachment.ts
│       ├── agent-inference.ts
│       └── agent-only-inference-no-attachment.ts
│
├── package.json
├── package-lock.json
├── .gitignore
├── Readme.md
└── node_modules/
```

### File responsibility

  -----------------------------------------------------------------------------
  File                                      Responsibility
  ----------------------------------------- -----------------------------------
  `agent-file-upload.ts`                    Uploads the PDF and returns
                                            `session_id`

  `agent-inference.ts`                      Shared attachment inference logic

  `agent-inference-no-attachment.ts`        No-attachment performance scenario
                                            using the shared inference flow

  `agent-only-inference-no-attachment.ts`   Completely separate no-attachment
                                            inference implementation

  `agent-e2e-upload-inference.ts`           Upload → `session_id` → inference
                                            E2E scenario

  `run-agent-e2e-report.ps1`                Runs E2E test and exports its HTML
                                            report

  `run-agent-no-attachment-report.ps1`      Runs no-attachment test and exports
                                            its HTML report

  `prometheus.yml`                          Prometheus configuration

  `docker-compose.yml`                      Starts Prometheus and Grafana

  `samplepolicy.pdf`                        Test document used by upload tests
  -----------------------------------------------------------------------------

------------------------------------------------------------------------

# 3. Test Flow

## 3.1 Agent File Upload

The upload module is responsible only for uploading the document.

``` text
samplepolicy.pdf
      ↓
agent-file-upload.ts
      ↓
POST /backend/sessions/upload
      ↓
session_id
```

The returned `session_id` is then passed to the inference module.

------------------------------------------------------------------------

## 3.2 Agent Inference With Attachment

The shared inference module receives the `session_id`.

``` text
agent-file-upload.ts
        ↓
    session_id
        ↓
agent-inference.ts
        ↓
POST /backend/agents/{agent-id}/inference
        ↓
Inference response
```

The inference module records metrics such as:

-   inference duration
-   successful inference
-   failed inference
-   response received
-   empty response
-   HTTP 400
-   HTTP 401
-   HTTP 403
-   HTTP 404
-   HTTP 409
-   HTTP 422
-   HTTP 429
-   HTTP 5xx
-   timeout
-   success duration

------------------------------------------------------------------------

## 3.3 Agent E2E Upload + Inference

`agent-e2e-upload-inference.ts` combines the complete business flow.

``` text
Virtual User
    ↓
Upload PDF
    ↓
Validate upload
    ↓
Extract session_id
    ↓
Run inference using session_id
    ↓
Validate inference response
```

This is the primary test for the complete attachment-based user journey.

------------------------------------------------------------------------

## 3.4 Agent Inference Without Attachment

The no-attachment flow does not upload a document.

``` text
Virtual User
    ↓
Inference request
    ↓
session_id = ""
    ↓
Inference response
```

This test is independent from the upload flow.

------------------------------------------------------------------------

# 4. k6 Test Scenarios

## Agent E2E

The current E2E scenario uses:

-   `per-vu-iterations`
-   `300 VUs`
-   `1 iteration per VU`
-   `maxDuration: 3m`

Therefore the normal test execution is:

``` text
300 VUs
   ↓
1 iteration each
   ↓
300 total iterations
```

## No Attachment

The no-attachment scenario also runs independently with the configured
VU/load profile.

Do not combine the no-attachment and E2E scenarios into one test when
separate performance results are required.

------------------------------------------------------------------------

# 5. Metrics

k6 automatically provides standard metrics such as:

``` text
k6_vus
k6_vus_max
k6_iterations_total
k6_iteration_duration_p99
k6_http_reqs_total
k6_http_req_duration_p99
k6_http_req_failed_rate
k6_http_req_waiting_p99
k6_http_req_sending_p99
k6_http_req_receiving_p99
k6_data_received_total
k6_data_sent_total
k6_checks_rate
```

Custom metrics are also generated.

## No-Attachment Metrics

Examples:

``` text
k6_no_attachment_inference_duration_p99
k6_no_attachment_inference_success_total
k6_no_attachment_inference_failure_total
k6_no_attachment_inference_response_received_total
k6_no_attachment_inference_success_duration_p99
k6_no_attachment_inference_429_total
```

The exact metric names available in Prometheus should be verified from
the Prometheus expression browser after the test has executed.

## Attachment/E2E Metrics

Examples:

``` text
k6_attachment_upload_duration_p99
k6_attachment_upload_success_total
k6_attachment_upload_failure_total
k6_attachment_inference_duration_p99
k6_attachment_inference_success_total
k6_attachment_inference_failure_total
k6_attachment_inference_response_received_total
k6_attachment_inference_success_duration_p99
k6_attachment_inference_5xx_total
```

------------------------------------------------------------------------

# 6. Prerequisites

Install the following before running the framework:

1.  Docker Desktop
2.  k6
3.  Node.js
4.  npm
5.  PowerShell
6.  Git
7.  A valid backend/API credential set

Verify installations:

``` powershell
docker --version
k6 version
node --version
npm --version
git --version
```

------------------------------------------------------------------------

# 7. Install Project Dependencies

From the project root:

``` powershell
npm install
```

The project uses the k6 TypeScript type definitions:

``` text
@types/k6
```

k6 itself must also be installed separately because it is the runtime
that executes the `.ts` test files.

------------------------------------------------------------------------

# 8. Start Prometheus and Grafana

From the project root:

``` powershell
docker compose -f monitoring/docker-compose.yml up -d
```

Check the containers:

``` powershell
docker ps
```

Expected services:

``` text
Prometheus → http://localhost:9090
Grafana    → http://localhost:3000
```

------------------------------------------------------------------------

# 9. Verify Prometheus

Open:

``` text
http://localhost:9090
```

Go to:

``` text
Prometheus → Query
```

After a k6 test has executed, query:

``` text
k6_vus
```

Then query:

``` text
k6_http_reqs_total
```

Then query a custom metric such as:

``` text
k6_no_attachment_inference_success_total
```

If these metrics return data, the k6 → Prometheus remote-write pipeline
is working.

------------------------------------------------------------------------

# 10. Prometheus Remote Write

The k6 test scripts use:

``` text
http://localhost:9090/api/v1/write
```

The PowerShell report scripts configure:

``` powershell
$env:K6_PROMETHEUS_RW_SERVER_URL = "http://localhost:9090/api/v1/write"
```

The k6 command uses:

``` powershell
k6 run -o experimental-prometheus-rw <test-file>
```

The complete pipeline is:

``` text
k6
 ↓
experimental-prometheus-rw
 ↓
Prometheus /api/v1/write
 ↓
Prometheus TSDB
 ↓
Grafana
```

------------------------------------------------------------------------

# 11. Run No-Attachment Test

Run the test directly:

``` powershell
k6 run tests/agent-inference/agent-inference-no-attachment.ts
```

This executes only the no-attachment inference scenario.

For a complete HTML + Prometheus run, use:

``` powershell
./reports/run-agent-no-attachment-report.ps1
```

The report should be generated as:

``` text
reports/agent-inference-no-attachment.html
```

------------------------------------------------------------------------

# 12. Run E2E Upload + Inference Test

Run directly:

``` powershell
k6 run tests/agent-inference/agent-e2e-upload-inference.ts
```

For the HTML + Prometheus run:

``` powershell
./reports/run-agent-e2e-report.ps1
```

The report should be generated as:

``` text
reports/agent-e2e-upload-inference.html
```

------------------------------------------------------------------------

# 13. Why Two Report Scripts Are Required

The two tests represent different performance measurements.

  --------------------------------------------------------------------------------------
  Report Script                          Test                    Measures
  -------------------------------------- ----------------------- -----------------------
  `run-agent-no-attachment-report.ps1`   No attachment           Inference only

  `run-agent-e2e-report.ps1`             E2E                     Upload + session
                                                                 creation + inference
  --------------------------------------------------------------------------------------

Keeping two scripts is recommended because:

-   each test can be executed independently
-   each HTML report has a clear purpose
-   Prometheus metrics can be analyzed independently
-   failures can be isolated
-   Grafana dashboards can be separated by test type

A single PowerShell script can technically run both tests, but separate
scripts are cleaner for QA/performance testing and CI/CD usage.

------------------------------------------------------------------------

# 14. HTML Reports

The k6 web dashboard is enabled by the PowerShell scripts.

The relevant configuration is:

``` powershell
$env:K6_WEB_DASHBOARD = "true"
```

and:

``` powershell
$env:K6_WEB_DASHBOARD_EXPORT = "reports/<report-name>.html"
```

Therefore:

``` text
No Attachment
    ↓
agent-inference-no-attachment.html

E2E
    ↓
agent-e2e-upload-inference.html
```

The HTML reports are useful for detailed execution-level analysis.

Grafana is used for persistent monitoring and Prometheus-backed
visualization.

------------------------------------------------------------------------

# 15. Grafana Dashboard Strategy

Two separate dashboards are recommended.

## Dashboard 1 --- Agent No Attachment

Purpose:

``` text
Inference performance without document upload
```

Recommended panels:

-   Active VUs
-   Maximum VUs
-   Requests/sec
-   HTTP failure rate
-   Inference success
-   Inference failure
-   HTTP 429 count
-   Inference response received
-   Inference duration p50/p90/p95/p99
-   Successful inference duration
-   Iteration duration
-   Total iterations

------------------------------------------------------------------------

## Dashboard 2 --- Agent E2E Upload + Inference

Purpose:

``` text
Complete document-based agent journey
```

Recommended panels:

-   Active VUs
-   Maximum VUs
-   HTTP requests/sec
-   HTTP failure rate
-   Upload success
-   Upload failure
-   Upload duration p50/p90/p95/p99
-   Inference success
-   Inference failure
-   Inference 4xx/5xx errors
-   Inference response received
-   Inference duration p50/p90/p95/p99
-   Successful inference duration
-   Iteration duration
-   Total iterations

The dashboards should use the same Prometheus datasource but different
metric sets.

------------------------------------------------------------------------

# 16. Import Grafana Dashboard

Open:

``` text
http://localhost:3000
```

Configure Prometheus as the Grafana datasource.

Use:

``` text
http://prometheus:9090
```

when Grafana and Prometheus are running in the same Docker Compose
network.

Then import the dashboard JSON from:

``` text
reports/grafana/
```

During import, select the Prometheus datasource.

> If a second no-attachment dashboard JSON is added, keep it as a
> separate dashboard file rather than mixing both test flows into one
> dashboard.

------------------------------------------------------------------------

# 17. Important Prometheus Metric Naming

k6 custom metrics are exposed to Prometheus with the k6/Prometheus
naming convention.

For example, a k6 counter:

``` text
no_attachment_inference_success
```

appears as a Prometheus metric similar to:

``` text
k6_no_attachment_inference_success_total
```

A k6 Trend such as:

``` text
no_attachment_inference_duration
```

can expose percentile-oriented series such as:

``` text
k6_no_attachment_inference_duration_p99
```

Always confirm the exact generated metric name in the Prometheus query
browser before creating or modifying Grafana panels.

------------------------------------------------------------------------

# 18. Useful Prometheus Queries

## Active VUs

``` promql
k6_vus
```

## Maximum VUs

``` promql
k6_vus_max
```

## Total HTTP Requests

``` promql
k6_http_reqs_total
```

## HTTP Request Rate

``` promql
rate(k6_http_reqs_total[1m])
```

## HTTP Failure Rate

``` promql
k6_http_req_failed_rate
```

## No-Attachment Success

``` promql
k6_no_attachment_inference_success_total
```

## No-Attachment Failure

``` promql
k6_no_attachment_inference_failure_total
```

## No-Attachment HTTP 429

``` promql
k6_no_attachment_inference_429_total
```

## No-Attachment p99 Inference Duration

``` promql
k6_no_attachment_inference_duration_p99
```

## Attachment Upload Success

``` promql
k6_attachment_upload_success_total
```

## Attachment Upload Failure

``` promql
k6_attachment_upload_failure_total
```

## Attachment Inference Success

``` promql
k6_attachment_inference_success_total
```

## Attachment Inference Failure

``` promql
k6_attachment_inference_failure_total
```

------------------------------------------------------------------------

# 19. Interpreting the Test Results

A successful test does not necessarily mean the system performed well.

Review at least these dimensions:

  Metric               What to check
  -------------------- ------------------------------------------------
  Success rate         Are inference requests succeeding?
  HTTP failure rate    Are requests failing at the HTTP layer?
  429                  Is the backend rate limiting requests?
  4xx                  Is there a client/request problem?
  5xx                  Is the backend failing?
  p95                  Typical high-end latency
  p99                  Worst high-end latency
  Upload duration      Time required to create the attachment session
  Inference duration   Time required to complete inference
  Response received    Did the server return a response body?
  Empty response       Did the server return no response content?
  VUs                  How much concurrency was generated?

------------------------------------------------------------------------

# 20. Example: Understanding a 429 Result

If the result contains:

``` text
no_attachment_inference_429_total: 200
```

and:

``` text
no_attachment_inference_success_total: 100
```

then the test did not simply experience slow requests.

The backend rejected a significant portion of requests with HTTP 429.

HTTP 429 normally indicates that the server or an upstream component is
applying rate limiting or throttling.

The correct next step is to investigate the backend rate limit rather
than immediately increasing the k6 load.

------------------------------------------------------------------------

# 21. Example: Understanding E2E Upload Failures

If the E2E result contains:

``` text
attachment_upload_success_total: 67
attachment_upload_failure_total: 233
```

but successful inference requests exist, remember that inference is only
executed when a valid `session_id` is returned.

Therefore:

``` text
Upload failure
    ↓
No session_id
    ↓
No inference for that VU
```

This is why upload and inference metrics must be analyzed separately.

------------------------------------------------------------------------

# 22. Credentials and Security

The test files currently contain environment-specific values such as:

-   backend URLs
-   API keys
-   bearer tokens
-   user IDs
-   agent IDs

Do not commit real credentials to source control.

Prefer environment variables.

For example:

``` powershell
$env:K6_BASE_URL = "https://example.com"
$env:K6_API_KEY = "<api-key>"
$env:K6_BEARER_TOKEN = "<token>"
$env:K6_CURRENT_USER_ID = "<user-id>"
```

The test code can then read these values instead of storing secrets
directly in `.ts` files.

If a real bearer token or API key has already been committed to Git,
rotate/revoke it and replace it with a new credential.

------------------------------------------------------------------------

# 23. Recommended Execution Order

For a new environment, follow this exact order.

### Step 1 --- Install dependencies

``` powershell
npm install
```

### Step 2 --- Start monitoring

``` powershell
docker compose -f monitoring/docker-compose.yml up -d
```

### Step 3 --- Verify containers

``` powershell
docker ps
```

### Step 4 --- Verify Prometheus

Open:

``` text
http://localhost:9090
```

### Step 5 --- Run no-attachment test

``` powershell
./reports/run-agent-no-attachment-report.ps1
```

### Step 6 --- Verify no-attachment metrics

Query:

``` text
k6_no_attachment_inference_success_total
```

### Step 7 --- Run E2E test

``` powershell
./reports/run-agent-e2e-report.ps1
```

### Step 8 --- Verify attachment metrics

Query:

``` text
k6_attachment_upload_success_total
```

and:

``` text
k6_attachment_inference_success_total
```

### Step 9 --- Open Grafana

``` text
http://localhost:3000
```

### Step 10 --- Import dashboards

Import the no-attachment dashboard and E2E dashboard separately when
both JSON definitions are available.

------------------------------------------------------------------------

# 24. Troubleshooting

## Prometheus shows no k6 metrics

Check:

``` powershell
docker logs k6-prometheus
```

Confirm k6 uses:

``` text
-o experimental-prometheus-rw
```

Confirm:

``` text
K6_PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write
```

Then run a test again.

------------------------------------------------------------------------

## Prometheus is running but a custom metric is missing

First verify that the corresponding test code actually executes the
metric.

For example, if the test never reaches the inference call because upload
fails, an inference counter may not increase.

For E2E:

``` text
upload
 ↓
session_id
 ↓
inference
```

Therefore an upload failure can prevent inference metrics from being
generated.

------------------------------------------------------------------------

## Grafana shows no data

Check the following in order:

1.  Prometheus is running.
2.  k6 has executed.
3.  Prometheus contains the metric.
4.  Grafana datasource points to Prometheus.
5.  The dashboard query uses the exact metric name.
6.  Grafana time range includes the test execution time.

------------------------------------------------------------------------

## Prometheus configuration path error

The Prometheus container should mount the actual project file:

``` text
<project>\monitoring\prometheus.yml
    ↓
/etc/prometheus/prometheus.yml
```

Verify the mount:

``` powershell
docker inspect k6-prometheus --format '{{range .Mounts}}{{println .Source "->" .Destination}}{{end}}'
```

Verify the container command:

``` powershell
docker inspect k6-prometheus --format '{{.Args}}'
```

The configuration argument should reference:

``` text
/etc/prometheus/prometheus.yml
```

Do not create an accidental path such as:

``` text
<project>\monitoring\monitoring\prometheus.yml
```

------------------------------------------------------------------------

# 25. Stopping the Monitoring Stack

To stop Prometheus and Grafana:

``` powershell
docker compose -f monitoring/docker-compose.yml down
```

To stop and remove the containers without removing persistent volumes:

``` powershell
docker compose -f monitoring/docker-compose.yml down
```

If persistent Prometheus data must also be removed, review the Docker
Compose volumes before using volume-removal commands.

------------------------------------------------------------------------

# 26. Development Guidelines

Keep these responsibilities separated:

``` text
agent-file-upload.ts
        ↓
Upload responsibility

agent-inference.ts
        ↓
Shared attachment inference responsibility

agent-inference-no-attachment.ts
        ↓
No-attachment scenario

agent-only-inference-no-attachment.ts
        ↓
Independent no-attachment implementation

agent-e2e-upload-inference.ts
        ↓
Business-level E2E orchestration
```

Do not put upload logic directly into every inference test.

Do not mix the no-attachment metrics with attachment metrics.

Keep separate HTML reports.

Keep separate Grafana dashboards for the two major performance flows.

------------------------------------------------------------------------

# 27. Current Test Architecture

The intended architecture is:

``` text
                         K6 TEST FRAMEWORK
                                │
                ┌───────────────┴────────────────┐
                │                                │
                ▼                                ▼
       NO-ATTACHMENT FLOW                ATTACHMENT E2E FLOW
                │                                │
                ▼                                ▼
agent-inference-no-attachment.ts      agent-e2e-upload-inference.ts
                │                                │
                ▼                                ▼
          Inference only                agent-file-upload.ts
                                                 │
                                                 ▼
                                            session_id
                                                 │
                                                 ▼
                                      agent-inference.ts
                                                 │
                └────────────────┬───────────────┘
                                 ▼
                         Prometheus Remote Write
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
              HTML Reports              Grafana
                    │                         │
                    │                ┌────────┴────────┐
                    │                ▼                 ▼
                    │        No-Attachment       E2E Dashboard
                    │         Dashboard
                    ▼
              Test Evidence
```

------------------------------------------------------------------------

# 28. Final Recommended Workflow

For normal QA/performance execution:

``` text
1. Start Docker
2. Start Prometheus + Grafana
3. Verify Prometheus
4. Run no-attachment report
5. Review no-attachment HTML report
6. Review no-attachment Prometheus metrics
7. Run E2E report
8. Review E2E HTML report
9. Review upload metrics
10. Review inference metrics
11. Open Grafana
12. Review the corresponding dashboard
13. Compare p95/p99, success rate, errors, 429, 5xx and throughput
14. Record the performance result
```

------------------------------------------------------------------------

# 29. Quick Command Reference

## Start monitoring

``` powershell
docker compose -f monitoring/docker-compose.yml up -d
```

## Check containers

``` powershell
docker ps
```

## Run no-attachment test

``` powershell
k6 run tests/agent-inference/agent-inference-no-attachment.ts
```

## Run no-attachment report

``` powershell
./reports/run-agent-no-attachment-report.ps1
```

## Run E2E test

``` powershell
k6 run tests/agent-inference/agent-e2e-upload-inference.ts
```

## Run E2E report

``` powershell
./reports/run-agent-e2e-report.ps1
```

## Stop monitoring

``` powershell
docker compose -f monitoring/docker-compose.yml down
```

## Prometheus

``` text
http://localhost:9090
```

## Grafana

``` text
http://localhost:3000
```

------------------------------------------------------------------------

# 30. Summary

This framework separates performance testing into two primary paths:

``` text
NO ATTACHMENT
Inference only
     ↓
HTML report + Prometheus metrics + Grafana dashboard
```

and:

``` text
ATTACHMENT E2E
Upload → session_id → inference
     ↓
HTML report + Prometheus metrics + Grafana dashboard
```

The separation makes it possible to identify whether performance
problems originate from:

-   inference
-   document upload
-   session creation
-   HTTP errors
-   rate limiting
-   backend 5xx errors
-   response generation
-   overall end-to-end execution

The recommended operating model is to keep the two flows, report
scripts, HTML reports, metric namespaces, and Grafana dashboards
separate while using the same Prometheus/Grafana monitoring
infrastructure.
