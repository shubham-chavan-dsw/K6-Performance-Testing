import { uploadFile } from "./agent-file-upload.ts";
import { createInferenceMetrics, runInference } from "./agent-inference.ts";

export const options = {
	scenarios: {
		agent_e2e_upload_inference: {
			executor: "per-vu-iterations",
			vus: 300,
			iterations: 1,
			maxDuration: "3m",
		},
	},
};

const inferenceMetrics = createInferenceMetrics("attachment");

export default function () {
	const sessionId = uploadFile();

	if (!sessionId) {
		return;
	}

	runInference(sessionId, inferenceMetrics);
}
