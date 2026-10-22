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
| 4 | add speed powerups | @midnightmango | 4 |  |
| 3 | all enemies are cats | @NeonNinja | 6 | [`753a9c1`](https://github.com/twitchbuilds/base/commit/753a9c164b2bbbaa905127f2638dfac8c830e1ee) |
| 2 | a high score leaderboard | @quietkeyboard | 6 | [`cc3bfd5`](https://github.com/twitchbuilds/base/commit/cc3bfd5e3ea83c44afd622995b85b01e7001f006) |
| 1 | collectible coins | @ChonkyCat | 3 | [`4ef46e9`](https://github.com/twitchbuilds/base/commit/4ef46e904defc6c2bca3e474206fa3352f79771f) |

## Top contributors

1. **quietkeyboard**: 15 pts
2. **ChonkyCat**: 12 pts
3. **NeonNinja**: 12 pts
4. **midnightmango**: 10 pts
5. **lagspike**: 6 pts

---
Run it yourself: `npm install && npm run dev`. Built with [Twitch Builds](https://github.com/twitchbuilds).
