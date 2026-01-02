export default function TwitchBuilds() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            TwitchBuilds
          </h1>
          
          <div className="text-xl text-center mb-12 text-gray-300">
            Where Twitch Chat becomes the Product Manager
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 text-purple-300">What is TwitchBuilds?</h2>
              <p className="text-gray-300 leading-relaxed">
                TwitchBuilds is an interactive live stream where the "Hive Mind" of Twitch Chat 
                collectively builds a software product. Instead of controlling a game character 
                (like TwitchPlaysPokemon), viewers act as the Product Manager, voting on prompts 
                that an autonomous AI agent turns into code in real-time.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 text-blue-300">How it Works</h2>
              <ul className="text-gray-300 space-y-2">
                <li>• Chat votes on feature requests and product decisions</li>
                <li>• AI agent interprets the collective will of chat</li>
                <li>• Code is generated and deployed live on stream</li>
                <li>• The product evolves based on community input</li>
              </ul>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 mb-8">
            <h2 className="text-3xl font-semibold mb-6 text-center text-yellow-300">The Experience</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-3">🗳️</div>
                <h3 className="text-lg font-semibold mb-2">Vote</h3>
                <p className="text-gray-400 text-sm">Participate in polls and decisions about what to build next</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">🤖</div>
                <h3 className="text-lg font-semibold mb-2">AI Builds</h3>
                <p className="text-gray-400 text-sm">Watch as AI interprets chat's vision and writes code live</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3"><span className="rocket-sway">🚀</span></div>
                <h3 className="text-lg font-semibold mb-2">Deploy</h3>
                <p className="text-gray-400 text-sm">See your collective creation come to life in real-time</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-400 mb-6">
              Join the experiment where thousands of minds collaborate to build something amazing
            </p>
            <div className="space-x-4">
              <a 
                href="https://google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition-colors inline-block"
              >
                Watch Live
              </a>
              <button className="border border-purple-400 hover:bg-purple-400/20 px-6 py-3 rounded-lg font-semibold transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
