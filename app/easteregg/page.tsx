"use client";

import { useState, useEffect } from "react";

export default function EasterEgg() {
	const [konami, setKonami] = useState("");
	const [showSecret, setShowSecret] = useState(false);
	const [clicks, setClicks] = useState(0);
	const [burstEggs, setBurstEggs] = useState<Array<{id: number, x: number, y: number, vx: number, vy: number}>>([]);
	const [showEggWall, setShowEggWall] = useState(false);

	const konamiCode = "ArrowUpArrowUpArrowDownArrowDownArrowLeftArrowRightArrowLeftArrowRightKeyBKeyA";

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const newKonami = konami + e.code;
			setKonami(newKonami.slice(-konamiCode.length));
			
			if (newKonami.endsWith(konamiCode)) {
				setShowSecret(true);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [konami]);

	const handleEggClick = (e: React.MouseEvent) => {
		setClicks(prev => prev + 1);
		if (clicks >= 9) {
			setShowSecret(true);
			setShowEggWall(true);
		}

		// Create burst effect
		const rect = (e.target as HTMLElement).getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;
		
		const newEggs = Array.from({ length: 20 }, (_, i) => {
			const angle = (i / 20) * Math.PI * 2;
			const speed = 3 + Math.random() * 2;
			return {
				id: Date.now() + i,
				x: centerX,
				y: centerY,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed
			};
		});
		
		setBurstEggs(prev => [...prev, ...newEggs]);
		
		// Remove eggs after animation
		setTimeout(() => {
			setBurstEggs(prev => prev.filter(egg => !newEggs.some(newEgg => newEgg.id === egg.id)));
		}, 2000);
	};

	return (
		<div className="min-h-screen bg-black text-green-400 font-mono overflow-hidden relative">
			<div className="container mx-auto px-4 py-8 relative z-10">
				<div className="text-center mb-8">
					<h1 className="text-4xl font-bold mb-4 animate-pulse">
						🥚 EASTER EGG DISCOVERED! 🥚
					</h1>
					<p className="text-lg">You found the secret page!</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					<div className="space-y-4">
						<div className="border border-green-400 p-4 rounded">
							<h2 className="text-xl mb-2">🎮 Interactive Egg</h2>
							<button 
								className="text-6xl hover:scale-110 transition-transform inline-block bg-transparent border-none cursor-pointer"
								onClick={handleEggClick}
								aria-label={`Click the egg. ${clicks} out of 10 clicks completed.`}
							>
								🥚
							</button>
							<p className="text-sm mt-2">Clicks: {clicks}/10</p>
							{clicks >= 5 && clicks < 10 && (
								<p className="text-yellow-400">Keep clicking...</p>
							)}
						</div>

						<div className="border border-green-400 p-4 rounded">
							<h2 className="text-xl mb-2">🕹️ Konami Code</h2>
							<p className="text-sm">Try: ↑↑↓↓←→←→BA</p>
							<div className="mt-2 h-2 bg-gray-800 rounded">
								<div 
									className="h-full bg-green-400 rounded transition-all"
									style={{ width: `${(konami.length / konamiCode.length) * 100}%` }}
								/>
							</div>
						</div>
					</div>

					<div className="space-y-4">
						<div className="border border-green-400 p-4 rounded">
							<h2 className="text-xl mb-2">🎨 ASCII Art</h2>
							<pre className="text-xs leading-tight">
{`    ╭─────────────────╮
    │  TWITCHBUILDS   │
    │     ╭─────╮     │
    │     │ ◉ ◉ │     │
    │     │  ∀  │     │
    │     ╰─────╯     │
    │   HIVE MIND AI  │
    ╰─────────────────╯`}
							</pre>
						</div>

						<div className="border border-green-400 p-4 rounded">
							<h2 className="text-xl mb-2">📊 Stats</h2>
							<div className="space-y-1 text-sm">
								<div>Architects Connected: {Math.floor(Math.random() * 1000) + 500}</div>
								<div>Lines of Code: {Math.floor(Math.random() * 50000) + 10000}</div>
								<div>Bugs Created: {Math.floor(Math.random() * 100) + 42}</div>
								<div>Coffee Consumed: ∞</div>
							</div>
						</div>
					</div>
				</div>

				{showSecret && (
					<div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
						<div className="bg-green-900 border-2 border-green-400 p-8 rounded-lg text-center max-w-md">
							<h2 className="text-2xl font-bold mb-4">🎉 SECRET UNLOCKED! 🎉</h2>
							<p className="mb-4">You've discovered the ultimate easter egg!</p>
							<div className="text-4xl mb-4 animate-bounce">🚀</div>
							<p className="text-sm mb-4">
								"The hive mind is pleased with your curiosity."
							</p>
							<button 
								onClick={() => setShowSecret(false)}
								className="bg-green-400 text-black px-4 py-2 rounded hover:bg-green-300"
							>
								Close
							</button>
						</div>
					</div>
				)}

				<div className="text-center mt-8 text-sm opacity-70">
					<p>Psst... there might be more secrets hidden around here 👀</p>
				</div>
			</div>

			{/* Egg Wall Background */}
			{showEggWall && (
				<div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
					<div className="egg-wall">
						{Array.from({ length: 200 }, (_, i) => (
							<span key={i} className="egg-item">🥚</span>
						))}
					</div>
					<style jsx>{`
						.egg-wall {
							position: absolute;
							top: -150vh;
							left: 0;
							right: 0;
							height: 300vh;
							display: flex;
							flex-wrap: wrap;
							justify-content: space-around;
							align-content: flex-start;
							animation: eggFall 20s linear infinite;
						}
						.egg-item {
							font-size: 2rem;
							margin: 0.5rem;
							opacity: 0.7;
						}
						@keyframes eggFall {
							0% {
								transform: translateY(0);
							}
							100% {
								transform: translateY(150vh);
							}
						}
					`}</style>
				</div>
			)}

			{/* Burst eggs */}
			{burstEggs.map(egg => {
				const randomX = Math.random() * 400 - 200;
				const randomY = Math.random() * 400 - 200;
				const randomRotation = Math.random() * 720 + 360;
				
				return (
					<div
						key={egg.id}
						className="fixed pointer-events-none text-2xl z-40"
						style={{
							left: egg.x,
							top: egg.y,
							transform: 'translate(-50%, -50%)',
							animation: `eggBurst-${egg.id} 2s ease-out forwards`
						}}
					>
						🥚
						<style jsx>{`
							@keyframes eggBurst-${egg.id} {
								0% {
									transform: translate(-50%, -50%) scale(1) rotate(0deg);
									opacity: 1;
								}
								100% {
									transform: translate(-50%, -50%) translate(${randomX}px, ${randomY}px) scale(0.5) rotate(${randomRotation}deg);
									opacity: 0;
								}
							}
						`}</style>
					</div>
				);
			})}
		</div>
	);
}
