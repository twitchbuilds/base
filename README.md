# Twitch Builds a Game

> Chat designs it. The AI codes it. Everyone plays it.

This project is being built **live by Twitch chat**. Viewers suggest and vote on
ideas, and an AI coding agent builds the winner in a sandbox while everyone watches.
Every commit is one chat prompt, credited to the viewer who suggested it.



## How to take part

| In chat | What it does |
| --- | --- |
| `!build <idea>` | Add an idea. If it's already on the board, it counts as your vote. |
| `!<number>` | Vote for an idea on the board. |
| `!hint <tip>` | Backseat the AI while it builds. The best tip is sent every minute. |
| `!github <username>` | Get your commits on your GitHub profile (add `twitch.tv/<you>` to your GitHub bio first). |

## Shipped so far

| Round | Feature | Prompted by | Votes | Commit |
| --- | --- | --- | --- | --- |
| 3 | add a dark mode | @luna_codes | 5 |  |
| 2 | all enemies are cats | @cozy_otter | 5 | [`2be9756`](https://github.com/twitchbuilds/base/commit/2be9756363b0e6fdf678ad6c3e766ec25508116c) |
| 1 | a top-down space shooter | 🤖 the AI | 3 | [`e9bd1f3`](https://github.com/twitchbuilds/base/commit/e9bd1f354265df733d6520d1f99ffe53429a9ee8) |

## Top contributors

1. **cozy_otter**: 14 pts
2. **luna_codes**: 10 pts
3. **Glitchy**: 7 pts
4. **midnightmango**: 2 pts
5. **sir_reload**: 2 pts

---
Run it yourself: `npm install && npm run dev`. Built with [Twitch Builds](https://github.com/twitchbuilds).
