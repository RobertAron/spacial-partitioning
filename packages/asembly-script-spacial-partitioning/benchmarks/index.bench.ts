import { run, bench, summary } from "mitata";
import { createNearbyGraph } from "../build/release.js";
import { input3 } from "../tests/inputs.js";

summary(() =>
	bench("nearbyGraph", () => {
		createNearbyGraph(input3, 5);
	}),
);

await run();
