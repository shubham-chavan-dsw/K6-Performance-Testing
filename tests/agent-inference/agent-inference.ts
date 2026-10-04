import http from "k6/http";
import { check } from "k6";
import { Counter, Trend } from "k6/metrics";

const BASE_URL = "https://unifyai-demo.datasciencewizards.ai";
const API_KEY = "L8KGFG";
const BEARER_TOKEN =
	"eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJqXzJZdzZZTEJkNE9rN0dLcF9fQy1CLTQtNDFXMkRVTnZVSXl6aTAzbVcwIn0.eyJleHAiOjE3OTEwMzIzMTksImlhdCI6MTc5MTAzMjAxOSwiYXV0aF90aW1lIjoxNzkxMDMyMDE5LCJqdGkiOiJiNTA4NjQwZS05MmM4LTQxY2UtOWY5OS03Nzk4YTliN2VlZGUiLCJpc3MiOiJodHRwczovL3VuaWZ5YWktZGVtby5kYXRhc2NpZW5jZXdpemFyZHMuYWkvYXV0aC9yZWFsbXMvRFNXIiwiYXVkIjpbImtlc3RyYSIsInJlYWxtLW1hbmFnZW1lbnQiLCJjb3JlX2VuZ2luZSIsImxsbV9tZXRhZGF0YSIsImFnZW50X3Rlc3RpbmciLCJndWFyZHJhaWxzIiwiYWRrIiwibGxtX2ZpbmV0dW5pbmciLCJicm9rZXIiLCJhY2NvdW50Iiwib20iXSwic3ViIjoiNDc3NjZhZjQtZDIwYS00NmY1LTlhYzAtZjUxYzY1ZDBiM2Y5IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiZnJvbnRlbmQiLCJzaWQiOiJjMzliZjhiMS1iOTk0LTRjMGUtYWM3Mi1mOWM1YjFmYWQ1OWEiLCJhY3IiOiIxIiwiYWxsb3dlZC1vcmlnaW5zIjpbIioiXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtZHN3Iiwib2ZmbGluZV9hY2Nlc3MiLCJhZG1pbiIsInVtYV9hdXRob3JpemF0aW9uIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsia2VzdHJhIjp7InJvbGVzIjpbInVtYV9wcm90ZWN0aW9uIl19LCJyZWFsbS1tYW5hZ2VtZW50Ijp7InJvbGVzIjpbInZpZXctcmVhbG0iLCJ2aWV3LWlkZW50aXR5LXByb3ZpZGVycyIsIm1hbmFnZS1pZGVudGl0eS1wcm92aWRlcnMiLCJpbXBlcnNvbmF0aW9uIiwicmVhbG0tYWRtaW4iLCJjcmVhdGUtY2xpZW50IiwibWFuYWdlLXVzZXJzIiwicXVlcnktcmVhbG1zIiwidmlldy1hdXRob3JpemF0aW9uIiwicXVlcnktY2xpZW50cyIsInF1ZXJ5LXVzZXJzIiwibWFuYWdlLWV2ZW50cyIsIm1hbmFnZS1yZWFsbSIsInZpZXctZXZlbnRzIiwidmlldy11c2VycyIsInZpZXctY2xpZW50cyIsIm1hbmFnZS1hdXRob3JpemF0aW9uIiwibWFuYWdlLWNsaWVudHMiLCJxdWVyeS1ncm91cHMiXX0sImNvcmVfZW5naW5lIjp7InJvbGVzIjpbInVtYV9wcm90ZWN0aW9uIl19LCJsbG1fbWV0YWRhdGEiOnsicm9sZXMiOlsidW1hX3Byb3RlY3Rpb24iXX0sImFnZW50X3Rlc3RpbmciOnsicm9sZXMiOlsidW1hX3Byb3RlY3Rpb24iXX0sImd1YXJkcmFpbHMiOnsicm9sZXMiOlsidW1hX3Byb3RlY3Rpb24iXX0sImFkayI6eyJyb2xlcyI6WyJ1bWFfcHJvdGVjdGlvbiJdfSwibGxtX2ZpbmV0dW5pbmciOnsicm9sZXMiOlsidW1hX3Byb3RlY3Rpb24iXX0sImJyb2tlciI6eyJyb2xlcyI6WyJyZWFkLXRva2VuIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50Iiwidmlldy1hcHBsaWNhdGlvbnMiLCJ2aWV3LWNvbnNlbnQiLCJ2aWV3LWdyb3VwcyIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwiZGVsZXRlLWFjY291bnQiLCJtYW5hZ2UtY29uc2VudCIsInZpZXctcHJvZmlsZSJdfSwib20iOnsicm9sZXMiOlsiRGF0YVN0ZXdhcmQiXX19LCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJhZG1pbiBhZG1pbiIsInByZWZlcnJlZF91c2VybmFtZSI6ImFkbWluIiwiZ2l2ZW5fbmFtZSI6ImFkbWluIiwiZmFtaWx5X25hbWUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AYWRtaW4uY29tIn0.Uor83PWZIZ5LO8VNQsyYBo3y3bYaAi0LlwI_u6WyXwM6qwwO7RvL3jcLT_rpMpLFiI7oOFb8fSRRRKTxYo0JCgOOIwOKkCgu6mDP_mZUTmZMB3kT62yGsE_-OGe_PEQmkfKgMiGa32T0mOTPfBMrF5re2nkgEILQgdLAHwVm1C-V58dzx-Pz-HQqcn-ti0bRoDkLidfWzS2Vyxsw4rTTppnlo8JpPiLOE01iGfOpIE8R1WDcxHPGcZO42v7UTfIDcG57dja9By1eMKrUYIOqUTBgSvCSGh-IKgOiW1WcO1Xc2KJi_ZCmSW4yGS3QpGEDTlkQJYP-hEGt0qGnVD5HTg";
const CURRENT_USER_ID = "47766af4-d20a-46f5-9ac0-f51c65d0b3f9";

export type InferenceMetrics = {
	duration: Trend;
	successDuration: Trend;
	success: Counter;
	failure: Counter;
	responseReceived: Counter;
	emptyResponse: Counter;
	status400: Counter;
	status401: Counter;
	status403: Counter;
	status404: Counter;
	status409: Counter;
	status422: Counter;
	status429: Counter;
	status5xx: Counter;
	other: Counter;
	timeout: Counter;
};

export function createInferenceMetrics(prefix: string): InferenceMetrics {
	return {
		duration: new Trend(`${prefix}_inference_duration`, true),
		successDuration: new Trend(`${prefix}_inference_success_duration`, true),
		success: new Counter(`${prefix}_inference_success`),
		failure: new Counter(`${prefix}_inference_failure`),
		responseReceived: new Counter(`${prefix}_inference_response_received`),
		emptyResponse: new Counter(`${prefix}_inference_empty_response`),
		status400: new Counter(`${prefix}_inference_400`),
		status401: new Counter(`${prefix}_inference_401`),
		status403: new Counter(`${prefix}_inference_403`),
		status404: new Counter(`${prefix}_inference_404`),
		status409: new Counter(`${prefix}_inference_409`),
		status422: new Counter(`${prefix}_inference_422`),
		status429: new Counter(`${prefix}_inference_429`),
		status5xx: new Counter(`${prefix}_inference_5xx`),
		other: new Counter(`${prefix}_inference_other`),
		timeout: new Counter(`${prefix}_inference_timeout`),
	};
}

export function runInference(
	sessionId: string,
	metrics: InferenceMetrics,
): void {
	const inferenceBody = JSON.stringify({
		agent_version: 1,
		input: "Extract details",
		session_id: sessionId,
		stream: true,
		include_llm_output: false,
	});

	const start = Date.now();

	const inferenceRes = http.post(
		`${BASE_URL}/backend/agents/95782251-2adc-4813-82d9-6bacfe222835/inference?apikey=${API_KEY}&wait=true`,
		inferenceBody,
		{
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${BEARER_TOKEN}`,
				current_user_id: CURRENT_USER_ID,
			},
			timeout: "120s",
		},
	);

	const duration = Date.now() - start;
	metrics.duration.add(duration);

	const responseBody = inferenceRes.body;

	const hasResponseBody =
		responseBody !== null &&
		(typeof responseBody === "string" ?
			responseBody.length > 0
		:	responseBody.byteLength > 0);

	const responseSize =
		responseBody !== null ?
			typeof responseBody === "string" ?
				responseBody.length
			:	responseBody.byteLength
		:	0;

	const statusSuccess = check(inferenceRes, {
		"inference status is 2xx": (r) => r.status >= 200 && r.status < 300,
	});

	check(inferenceRes, { "inference response received": () => hasResponseBody });

	if (hasResponseBody) {
		metrics.responseReceived.add(1);
	} else {
		metrics.emptyResponse.add(1);
	}

	if (statusSuccess && hasResponseBody) {
		metrics.success.add(1);
		metrics.successDuration.add(duration);
	} else {
		metrics.failure.add(1);
	}

	if (inferenceRes.status === 0) {
		metrics.timeout.add(1);
	} else if (inferenceRes.status === 400) {
		metrics.status400.add(1);
	} else if (inferenceRes.status === 401) {
		metrics.status401.add(1);
	} else if (inferenceRes.status === 403) {
		metrics.status403.add(1);
	} else if (inferenceRes.status === 404) {
		metrics.status404.add(1);
	} else if (inferenceRes.status === 409) {
		metrics.status409.add(1);
	} else if (inferenceRes.status === 422) {
		metrics.status422.add(1);
	} else if (inferenceRes.status === 429) {
		metrics.status429.add(1);
	} else if (inferenceRes.status >= 500) {
		metrics.status5xx.add(1);
	} else if (inferenceRes.status < 200 || inferenceRes.status >= 300) {
		metrics.other.add(1);
	}

	console.log(
		`INFERENCE status=${inferenceRes.status} duration=${duration}ms response_received=${hasResponseBody} response_size=${responseSize} session_id=${sessionId}`,
	);
}
