import http from "k6/http";
import { check } from "k6";
import { Counter, Trend } from "k6/metrics";

const BASE_URL = "https://demo-unifyai.datasciencewizards.ai";
const API_KEY = "L8KGFG";
const BEARER_TOKEN =
	"eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJqXzJZdzZZTEJkNE9rN0dLcF9fQy1CLTQtNDFXMkRVTnZVSXl6aTAzbVcwIn0.eyJleHAiOjE3OTEwMzIzMTksImlhdCI6MTc5MTAzMjAxOSwiYXV0aF90aW1lIjoxNzkxMDMyMDE5LCJqdGkiOiJiNTA4NjQwZS05MmM4LTQxY2UtOWY5OS03Nzk4YTliN2VlZGUiLCJpc3MiOiJodHRwczovL3VuaWZ5YWktZGVtby5kYXRhc2NpZW5jZXdpemFyZHMuYWkvYXV0aC9yZWFsbXMvRFNXIiwiYXVkIjpbImtlc3RyYSIsInJlYWxtLW1hbmFnZW1lbnQiLCJjb3JlX2VuZ2luZSIsImxsbV9tZXRhZGF0YSIsImFnZW50X3Rlc3RpbmciLCJndWFyZHJhaWxzIiwiYWRrIiwibGxtX2ZpbmV0dW5pbmciLCJicm9rZXIiLCJhY2NvdW50Iiwib20iXSwic3ViIjoiNDc3NjZhZjQtZDIwYS00NmY1LTlhYzAtZjUxYzY1ZDBiM2Y5IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiZnJvbnRlbmQiLCJzaWQiOiJjMzliZjhiMS1iOTk0LTRjMGUtYWM3Mi1mOWM1YjFmYWQ1OWEiLCJhY3IiOiIxIiwiYWxsb3dlZC1vcmlnaW5zIjpbIioiXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtZHN3Iiwib2ZmbGluZV9hY2Nlc3MiLCJhZG1pbiIsInVtYV9hdXRob3JpemF0aW9uIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsia2VzdHJhIjp7InJvbGVzIjpbInVtYV9wcm90ZWN0aW9uIl19LCJyZWFsbS1tYW5hZ2VtZW50Ijp7InJvbGVzIjpbInZpZXctcmVhbG0iLCJ2aWV3LWlkZW50aXR5LXByb3ZpZGVycyIsIm1hbmFnZS1pZGVudGl0eS1wcm92aWRlcnMiLCJpbXBlcnNvbmF0aW9uIiwicmVhbG0tYWRtaW4iLCJjcmVhdGUtY2xpZW50IiwibWFuYWdlLXVzZXJzIiwicXVlcnktcmVhbG1zIiwidmlldy1hdXRob3JpemF0aW9uIiwicXVlcnktY2xpZW50cyIsInF1ZXJ5LXVzZXJzIiwibWFuYWdlLWV2ZW50cyIsIm1hbmFnZS1yZWFsbSIsInZpZXctZXZlbnRzIiwidmlldy11c2VycyIsInZpZXctY2xpZW50cyIsIm1hbmFnZS1hdXRob3JpemF0aW9uIiwibWFuYWdlLWNsaWVudHMiLCJxdWVyeS1ncm91cHMiXX0sImNvcmVfZW5naW5lIjp7InJvbGVzIjpbInVtYV9wcm90ZWN0aW9uIl19LCJsbG1fbWV0YWRhdGEiOnsicm9sZXMiOlsidW1hX3Byb3RlY3Rpb24iXX0sImFnZW50X3Rlc3RpbmciOnsicm9sZXMiOlsidW1hX3Byb3RlY3Rpb24iXX0sImd1YXJkcmFpbHMiOnsicm9sZXMiOlsidW1hX3Byb3RlY3Rpb24iXX0sImFkayI6eyJyb2xlcyI6WyJ1bWFfcHJvdGVjdGlvbiJdfSwibGxtX2ZpbmV0dW5pbmciOnsicm9sZXMiOlsidW1hX3Byb3RlY3Rpb24iXX0sImJyb2tlciI6eyJyb2xlcyI6WyJyZWFkLXRva2VuIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50Iiwidmlldy1hcHBsaWNhdGlvbnMiLCJ2aWV3LWNvbnNlbnQiLCJ2aWV3LWdyb3VwcyIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwiZGVsZXRlLWFjY291bnQiLCJtYW5hZ2UtY29uc2VudCIsInZpZXctcHJvZmlsZSJdfSwib20iOnsicm9sZXMiOlsiRGF0YVN0ZXdhcmQiXX19LCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJhZG1pbiBhZG1pbiIsInByZWZlcnJlZF91c2VybmFtZSI6ImFkbWluIiwiZ2l2ZW5fbmFtZSI6ImFkbWluIiwiZmFtaWx5X25hbWUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AYWRtaW4uY29tIn0.Uor83PWZIZ5LO8VNQsyYBo3y3bYaAi0LlwI_u6WyXwM6qwwO7RvL3jcLT_rpMpLFiI7oOFb8fSRRRKTxYo0JCgOOIwOKkCgu6mDP_mZUTmZMB3kT62yGsE_-OGe_PEQmkfKgMiGa32T0mOTPfBMrF5re2nkgEILQgdLAHwVm1C-V58dzx-Pz-HQqcn-ti0bRoDkLidfWzS2Vyxsw4rTTppnlo8JpPiLOE01iGfOpIE8R1WDcxHPGcZO42v7UTfIDcG57dja9By1eMKrUYIOqUTBgSvCSGh-IKgOiW1WcO1Xc2KJi_ZCmSW4yGS3QpGEDTlkQJYP-hEGt0qGnVD5HTg";
const CURRENT_USER_ID = "003061f3-73d6-4ea7-849e-63e9ec054afd";

export const inferenceDuration = new Trend(
	"no_attachment_inference_duration",
	true,
);
export const inferenceSuccess = new Counter("no_attachment_inference_success");
export const inferenceFailure = new Counter("no_attachment_inference_failure");
export const inference4xx = new Counter("no_attachment_inference_4xx");
export const inference5xx = new Counter("no_attachment_inference_5xx");
export const inferenceTimeout = new Counter("no_attachment_inference_timeout");
export const inferenceOther = new Counter("no_attachment_inference_other");

export const options = {
	scenarios: {
		no_attachment_inference: {
			executor: "per-vu-iterations",
			vus: 300,
			iterations: 1,
			maxDuration: "3m",
		},
	},
};

export default function () {
	const body = JSON.stringify({
		agent_version: 1,
		input: "Hi",
		session_id: "",
		stream: true,
		include_llm_output: false,
	});
	const start = Date.now();
	const response = http.post(
		`${BASE_URL}/backend/agents/3e09add4-36f2-4bd3-a4e7-bf1fcaac1c10/inference?apikey=${API_KEY}&wait=true`,
		body,
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
	inferenceDuration.add(duration);
	const success = check(response, {
		"no attachment inference status is 2xx": (r) =>
			r.status >= 200 && r.status < 300,
	});
	if (success) inferenceSuccess.add(1);
	else {
		inferenceFailure.add(1);
		if (response.status === 0) inferenceTimeout.add(1);
		else if (response.status >= 400 && response.status < 500)
			inference4xx.add(1);
		else if (response.status >= 500) inference5xx.add(1);
		else inferenceOther.add(1);
	}
}
