# Guide cache

One JSON file per (job, make, model, year range, engine, fuel). Files are produced by
`npm run guide:generate` (Ollama on your machine), land as `status: "draft"` or
`"blocked"` (failed the figure check), and are shown to users only once a person has
read them and run `npm run guide:review -- --file <path> --by "<name>"`.

`front-brake-pads__ford__focus__2011-2018__1596__petrol.json` is the hand-written
reference guide for the demo car. It is marked reviewed so the flow works with no keys;
re-check it against a real car before relying on it.

The shared guide never contains one owner's MOT advisories; those are layered on at
render time from the owner's own record.
