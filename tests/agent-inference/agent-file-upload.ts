import http from "k6/http";
import { check } from "k6";
import { Counter, Trend } from "k6/metrics";

const BASE_URL = "https://unifyai-demo.datasciencewizards.ai";
const API_KEY = "L8KGFG";
const BEARER_TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJqXzJZdzZZTEJkNE9rN0dLcF9fQy1CLTQtNDFXMkRVTnZVSXl6aTAzbVcwIn0.eyJleHAiOjE3OTEwMzIzMTksImlhdCI6MTc5MTAzMjAxOSwiYXV0aF90aW1lIjoxNzkxMDMyMDE5LCJqdGkiOiJiNTA4NjQwZS05MmM4LTQxY2UtOWY5OS03Nzk4YTliN2VlZGUiLCJpc3MiOiJodHRwczovL3VuaWZ5YWktZGVtby5kYXRhc2NpZW5jZXdpemFyZHMuYWkvYXV0aC9yZWFsbXMvRFNXIiwiYXVkIjpbImtlc3RyYSIsInJlYWxtLW1hbmFnZW1lbnQiLCJjb3JlX2VuZ2luZSIsImxsbV9tZXRhZGF0YSIsImFnZW50X3Rlc3RpbmciLCJndWFyZHJhaWxzIiwiYWRrIiwibGxtX2ZpbmV0dW5pbmciLCJicm9rZXIiLCJhY2NvdW50Iiwib20iXSwic3ViIjoiNDc3NjZhZjQtZDIwYS00NmY1LTlhYzAtZjUxYzY1ZDBiM2Y5IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiZnJvbnRlbmQiLCJzaWQiOiJjMzliZjhiMS1iOTk0LTRjMGUtYWM3Mi1mOWM1YjFmYWQ1OWEiLCJhY3IiOiIxIiwiYWxsb3dlZC1vcmlnaW5zIjpbIioiXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtZHN3Iiwib2ZmbGluZV9hY2Nlc3MiLCJhZG1pbiIsInVtYV9hdXRob3JpemF0aW9uIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsia2VzdHJhIjp7InJvbGVzIjpbInVtYV9wcm90ZWN0aW9uIl19LCJyZWFsbS1tYW5hZ2VtZW50Ijp7InJvbGVzIjpbInZpZXctcmVhbG0iLCJ2aWV3LWlkZW50aXR5LXByb3ZpZGVycyIsIm1hbmFnZS1pZGVudGl0eS1wcm92aWRlcnMiLCJpbXBlcnNvbmF0aW9uIiwicmVhbG0tYWRtaW4iLCJjcmVhdGUtY2xpZW50IiwibWFuYWdlLXVzZXJzIiwicXVlcnktcmVhbG1zIiwidmlldy1hdXRob3JpemF0aW9uIiwicXVlcnktY2xpZW50cyIsInF1ZXJ5LXVzZXJzIiwibWFuYWdlLWV2ZW50cyIsIm1hbmFnZS1yZWFsbSIsInZpZXctZXZlbnRzIiwidmlldy11c2VycyIsInZpZXctY2xpZW50cyIsIm1hbmFnZS1hdXRob3JpemF0aW9uIiwibWFuYWdlLWNsaWVudHMiLCJxdWVyeS1ncm91cHMiXX0sImNvcmVfZW5naW5lIjp7InJvbGVzIjpbInVtYV9wcm90ZWN0aW9uIl19LCJsbG1fbWV0YWRhdGEiOnsicm9sZXMiOlsidW1hX3Byb3RlY3Rpb24iXX0sImFnZW50X3Rlc3RpbmciOnsicm9sZXMiOlsidW1hX3Byb3RlY3Rpb24iXX0sImd1YXJkcmFpbHMiOnsicm9sZXMiOlsidW1hX3Byb3RlY3Rpb24iXX0sImFkayI6eyJyb2xlcyI6WyJ1bWFfcHJvdGVjdGlvbiJdfSwibGxtX2ZpbmV0dW5pbmciOnsicm9sZXMiOlsidW1hX3Byb3RlY3Rpb24iXX0sImJyb2tlciI6eyJyb2xlcyI6WyJyZWFkLXRva2VuIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50Iiwidmlldy1hcHBsaWNhdGlvbnMiLCJ2aWV3LWNvbnNlbnQiLCJ2aWV3LWdyb3VwcyIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwiZGVsZXRlLWFjY291bnQiLCJtYW5hZ2UtY29uc2VudCIsInZpZXctcHJvZmlsZSJdfSwib20iOnsicm9sZXMiOlsiRGF0YVN0ZXdhcmQiXX19LCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJhZG1pbiBhZG1pbiIsInByZWZlcnJlZF91c2VybmFtZSI6ImFkbWluIiwiZ2l2ZW5fbmFtZSI6ImFkbWluIiwiZmFtaWx5X25hbWUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AYWRtaW4uY29tIn0.Uor83PWZIZ5LO8VNQsyYBo3y3bYaAi0LlwI_u6WyXwM6qwwO7RvL3jcLT_rpMpLFiI7oOFb8fSRRRKTxYo0JCgOOIwOKkCgu6mDP_mZUTmZMB3kT62yGsE_-OGe_PEQmkfKgMiGa32T0mOTPfBMrF5re2nkgEILQgdLAHwVm1C-V58dzx-Pz-HQqcn-ti0bRoDkLidfWzS2Vyxsw4rTTppnlo8JpPiLOE01iGfOpIE8R1WDcxHPGcZO42v7UTfIDcG57dja9By1eMKrUYIOqUTBgSvCSGh-IKgOiW1WcO1Xc2KJi_ZCmSW4yGS3QpGEDTlkQJYP-hEGt0qGnVD5HTg";
const CURRENT_USER_ID = "47766af4-d20a-46f5-9ac0-f51c65d0b3f9";
const FILE = open("../../test-data/samplepolicy.pdf", "b");

export const uploadDuration = new Trend("attachment_upload_duration", true);
export const uploadSuccess = new Counter("attachment_upload_success");
export const uploadFailure = new Counter("attachment_upload_failure");

export function uploadFile(): string | null {
	const file = http.file(FILE, "samplepolicy.pdf", "application/pdf");
	const start = Date.now();

	const uploadRes = http.post(
		`${BASE_URL}/backend/sessions/upload?apiKey=${API_KEY}&apikey=${API_KEY}&wait=true`,
		{ files: file },
		{
			headers: {
				"x-api-key": API_KEY,
				Authorization: `Bearer ${BEARER_TOKEN}`,
				current_user_id: CURRENT_USER_ID,
			},
			timeout: "120s",
		},
	);

	const duration = Date.now() - start;
	uploadDuration.add(duration);

	let sessionId: string | null = null;

	try {
		const uploadBody = uploadRes.json() as { session_id?: string };
		sessionId = uploadBody.session_id ?? null;
	} catch (e) {
		console.log(
			`UPLOAD_INVALID_JSON status=${uploadRes.status} duration=${duration}ms body=${uploadRes.body}`,
		);
	}

	const success = check(uploadRes, {
		"upload status is 200": (r) => r.status === 200,
		"upload session_id exists": () => !!sessionId,
	});

	if (success) {
		uploadSuccess.add(1);
	} else {
		uploadFailure.add(1);
		console.log(
			`UPLOAD_FAILED status=${uploadRes.status} duration=${duration}ms body=${uploadRes.body}`,
		);
	}

	return sessionId;
}

