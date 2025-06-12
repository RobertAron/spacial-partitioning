import { run, bench, summary } from "mitata";
import { createNearbyGraph } from "assemblyscript-spacial-partitioning";
import init, { create_nearby_graph } from "rust-spacial-partitioning";
import {createNearbyGraph as typescriptCreateNearbyGraph} from "typescript-spacial-partitioning";
import { input3 } from "../inputs.js";

await init();

summary(() =>
	bench("assembly", () => {
		createNearbyGraph(input3, 5);
	}),
);
summary(() =>
	bench("rust", () => {
		create_nearby_graph(input3, 5);
	}),
);
summary(() =>
	bench("typescript", () => {
		typescriptCreateNearbyGraph(input3, 5);
	}),
);

await run();
