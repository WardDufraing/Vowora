# Codex usage and quality measurement

The aim is to lower Codex credits per independently reviewed, merge-ready PR **without** increasing defects or weakening validation. This file is a reusable template; copy its row into a local tracker or PR handoff. Do not commit personal account balances, billing identifiers, credentials, or private usage exports.

| Task / PR | Implement model / effort | Implement credits | Review model / effort | Review credits | Rework credits | Total credits | CI | Independent verdict | Defects after merge |
| --- | --- | ---: | --- | ---: | ---: | ---: | --- | --- | --- |
| Example (not real data) | routine / medium | unknown | higher / high | unknown | unknown | unknown | pending | pending | unknown |

## How to record
1. Before implementation, note the current Codex credit usage/balance and model/reasoning setting if shown.
2. After the implementer stops and before reviewer starts, record the implementation delta.
3. Run independent review in a fresh session and record its separate delta.
4. Record any fix/re-review delta separately. If other sessions run concurrently, mark attribution **estimated** or **unknown**.
5. Add CI result and review verdict. Only call a PR complete after the owner merges it.
6. Review at least three comparable PRs before drawing conclusions. Check regression findings and post-merge defects alongside credit savings.

Do not imply that GitHub can read Codex plan credits, that credits map exactly to tokens, or that a specific savings percentage is guaranteed.
