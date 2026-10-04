import { createInferenceMetrics, runInference } from "./agent-inference.ts";

export const options = {
	scenarios: {
		agent_inference_no_attachment: {
			executor: "per-vu-iterations",
			vus: 300,
			iterations: 1,
			maxDuration: "3m",
		},
	},
};

const inferenceMetrics = createInferenceMetrics("no_attachment");

export default function () {
	runInference("", inferenceMetrics);
}
