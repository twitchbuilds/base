# Twitch Builds a Startup

> Can chat build a real business? Every vote ships a feature.

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
| 2 | waitlist signup form | @ByteMe42 | 4 |  |
| 1 | a marketplace for renting out your cat | 🤖 the AI | 4 | [`bf785ad`](https://github.com/twitchbuilds/base/commit/bf785ad65a6bb98108ae50e88643608d5b732f75) |

## Top contributors

1. **ByteMe42**: 12 pts
2. **pastaqueen**: 8 pts
3. **cozy_otter**: 2 pts
4. **hydrohomie**: 2 pts
5. **stackunderflow**: 2 pts

---
Run it yourself: `npm install && npm run dev`. Built with [Twitch Builds](https://github.com/twitchbuilds).
