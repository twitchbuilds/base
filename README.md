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
| 2 | a high score leaderboard | @quietkeyboard | 6 |  |
| 1 | collectible coins | @ChonkyCat | 3 | [`4ef46e9`](https://github.com/twitchbuilds/base/commit/4ef46e904defc6c2bca3e474206fa3352f79771f) |

## Top contributors

1. **ChonkyCat**: 12 pts
2. **quietkeyboard**: 12 pts
3. **Glitchy**: 4 pts
4. **lagspike**: 4 pts
5. **sir_reload**: 3 pts

---
Run it yourself: `npm install && npm run dev`. Built with [Twitch Builds](https://github.com/twitchbuilds).
