import { useConvexAuth, useQuery, useMutation, useAction } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { Id } from "../convex/_generated/dataModel";

// Brutalist color palette
const colors = {
  pink: "#FF006E",
  blue: "#3A86FF",
  lime: "#AAFF00",
  yellow: "#FFD60A",
  orange: "#FF9500",
};

const colorArray = [colors.pink, colors.blue, colors.lime, colors.yellow, colors.orange];

function getRandomColor(seed: number): string {
  return colorArray[seed % colorArray.length];
}

// Auth component
function AuthScreen() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signUp");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    try {
      await signIn("password", formData);
    } catch {
      setError(flow === "signIn" ? "Invalid credentials" : "Could not create account");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[100dvh] bg-[#F5F5F0] flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Decorative blocks */}
      <div className="absolute top-8 left-8 w-16 h-16 md:w-24 md:h-24 bg-[#FF006E] border-4 border-black transform rotate-12" />
      <div className="absolute bottom-16 right-8 w-20 h-20 md:w-32 md:h-32 bg-[#3A86FF] border-4 border-black transform -rotate-6" />
      <div className="absolute top-1/4 right-16 w-12 h-12 md:w-16 md:h-16 bg-[#AAFF00] border-4 border-black transform rotate-45" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 md:mb-12">
          <h1
            className="text-5xl md:text-7xl font-bold tracking-tighter text-black"
            style={{ fontFamily: "'VT323', monospace" }}
          >
            POP-GEN
          </h1>
          <p
            className="text-lg md:text-xl text-black mt-2 tracking-wide"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            AI VIDEO MAGIC FOR KIDS
          </p>
        </div>

        {/* Auth form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border-4 border-black p-6 md:p-8 shadow-[8px_8px_0_0_#000]"
        >
          <h2
            className="text-2xl md:text-3xl font-bold mb-6 text-black"
            style={{ fontFamily: "'VT323', monospace" }}
          >
            {flow === "signIn" ? "WELCOME BACK" : "JOIN THE FUN"}
          </h2>

          <input
            name="email"
            type="email"
            placeholder="EMAIL"
            required
            className="w-full p-4 border-4 border-black mb-4 text-lg bg-[#F5F5F0] placeholder-gray-500 focus:outline-none focus:bg-[#AAFF00]"
            style={{ fontFamily: "'Space Mono', monospace" }}
          />

          <input
            name="password"
            type="password"
            placeholder="PASSWORD"
            required
            className="w-full p-4 border-4 border-black mb-6 text-lg bg-[#F5F5F0] placeholder-gray-500 focus:outline-none focus:bg-[#AAFF00]"
            style={{ fontFamily: "'Space Mono', monospace" }}
          />

          <input name="flow" type="hidden" value={flow} />

          {error && (
            <p
              className="text-[#FF006E] mb-4 font-bold"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full p-4 bg-[#FF006E] text-white text-xl font-bold border-4 border-black shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
            style={{ fontFamily: "'VT323', monospace" }}
          >
            {loading ? "LOADING..." : flow === "signIn" ? "SIGN IN" : "CREATE ACCOUNT"}
          </button>

          <button
            type="button"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
            className="w-full mt-4 p-3 text-black text-lg underline hover:text-[#3A86FF] transition-colors"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            {flow === "signIn" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </form>

        {/* Anonymous login */}
        <button
          onClick={() => signIn("anonymous")}
          className="w-full mt-4 p-4 bg-[#3A86FF] text-white text-xl font-bold border-4 border-black shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          style={{ fontFamily: "'VT323', monospace" }}
        >
          CONTINUE AS GUEST
        </button>
      </div>
    </div>
  );
}

// Create post component
function CreatePost({ username }: { username: string }) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const createPost = useMutation(api.posts.create);
  const generateVideo = useAction(api.posts.generateVideo);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const postId = await createPost({ prompt: prompt.trim(), username });
      setPrompt("");
      // Start video generation in background
      generateVideo({ postId, prompt: prompt.trim() }).catch(console.error);
    } catch (err) {
      console.error("Failed to create post:", err);
    }
    setIsGenerating(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border-4 border-black p-4 md:p-6 shadow-[6px_6px_0_0_#000] mb-6 md:mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 md:w-12 md:h-12 bg-[#AAFF00] border-3 border-black flex items-center justify-center text-xl md:text-2xl font-bold"
          style={{ fontFamily: "'VT323', monospace" }}
        >
          {username.charAt(0).toUpperCase()}
        </div>
        <span
          className="text-lg md:text-xl font-bold text-black"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          @{username}
        </span>
      </div>

      <textarea
        ref={textareaRef}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="DESCRIBE YOUR VIDEO IDEA..."
        rows={3}
        className="w-full p-4 border-4 border-black text-base md:text-lg bg-[#F5F5F0] placeholder-gray-500 resize-none focus:outline-none focus:bg-[#FFD60A] transition-colors"
        style={{ fontFamily: "'Space Mono', monospace" }}
      />

      <div className="flex justify-between items-center mt-4">
        <span
          className="text-sm text-gray-600"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          {prompt.length}/200
        </span>
        <button
          type="submit"
          disabled={!prompt.trim() || isGenerating || prompt.length > 200}
          className="px-6 py-3 md:px-8 md:py-4 bg-[#FF006E] text-white text-lg md:text-xl font-bold border-4 border-black shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontFamily: "'VT323', monospace" }}
        >
          {isGenerating ? "POSTING..." : "CREATE VIDEO"}
        </button>
      </div>
    </form>
  );
}

// Video post component
function VideoPost({ post, index }: { post: {
  _id: Id<"posts">;
  username: string;
  prompt: string;
  videoUrl?: string;
  status: "generating" | "complete" | "failed";
  errorMessage?: string;
  createdAt: number;
  likes: number;
}; index: number }) {
  const toggleLike = useMutation(api.posts.toggleLike);
  const userLiked = useQuery(api.posts.userLikedPost, { postId: post._id });
  const [isLiking, setIsLiking] = useState(false);
  const accentColor = getRandomColor(index);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await toggleLike({ postId: post._id });
    } catch (err) {
      console.error("Failed to like:", err);
    }
    setIsLiking(false);
  };

  const timeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div
      className="bg-white border-4 border-black shadow-[6px_6px_0_0_#000] overflow-hidden animate-slideIn"
      style={{
        animationDelay: `${index * 0.1}s`,
        animationFillMode: "backwards"
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-3 md:p-4 border-b-4 border-black" style={{ backgroundColor: accentColor }}>
        <div
          className="w-10 h-10 md:w-12 md:h-12 bg-white border-3 border-black flex items-center justify-center text-xl md:text-2xl font-bold"
          style={{ fontFamily: "'VT323', monospace" }}
        >
          {post.username.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="font-bold text-black text-base md:text-lg truncate"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            @{post.username}
          </p>
          <p
            className="text-xs md:text-sm text-black/70"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            {timeAgo(post.createdAt)}
          </p>
        </div>
      </div>

      {/* Prompt */}
      <div className="p-3 md:p-4 border-b-4 border-black bg-[#F5F5F0]">
        <p
          className="text-base md:text-lg text-black"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          "{post.prompt}"
        </p>
      </div>

      {/* Video area */}
      <div className="aspect-video bg-black relative">
        {post.status === "generating" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#3A86FF] to-[#FF006E]">
            <div className="w-16 h-16 md:w-20 md:h-20 border-8 border-white border-t-transparent rounded-full animate-spin" />
            <p
              className="mt-4 text-white text-lg md:text-xl font-bold animate-pulse text-center px-4"
              style={{ fontFamily: "'VT323', monospace" }}
            >
              GENERATING PIXAR MAGIC...
            </p>
            <p
              className="text-white/70 text-xs md:text-sm mt-2 text-center px-4"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              This may take 1-2 minutes
            </p>
          </div>
        )}

        {post.status === "failed" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#FF006E] to-[#FF9500] p-4">
            <span className="text-4xl md:text-6xl mb-4">:(</span>
            <p
              className="text-white text-lg md:text-xl font-bold text-center"
              style={{ fontFamily: "'VT323', monospace" }}
            >
              VIDEO GENERATION FAILED
            </p>
            <p
              className="text-white/70 text-xs md:text-sm mt-2 text-center"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              {post.errorMessage || "Please try again"}
            </p>
          </div>
        )}

        {post.status === "complete" && post.videoUrl && (
          <video
            src={post.videoUrl}
            controls
            loop
            playsInline
            className="w-full h-full object-contain"
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between p-3 md:p-4 border-t-4 border-black">
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 border-4 border-black font-bold transition-all ${
            userLiked
              ? "bg-[#FF006E] text-white shadow-[2px_2px_0_0_#000]"
              : "bg-white text-black shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px]"
          }`}
          style={{ fontFamily: "'VT323', monospace" }}
        >
          <span className="text-xl md:text-2xl">{userLiked ? "+" : "+"}</span>
          <span className="text-lg md:text-xl">{post.likes}</span>
        </button>

        <div
          className="text-sm md:text-base text-gray-600"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          {post.status === "generating" && "GENERATING..."}
          {post.status === "complete" && "READY TO PLAY"}
          {post.status === "failed" && "FAILED"}
        </div>
      </div>
    </div>
  );
}

// Main feed component
function Feed() {
  const { signOut } = useAuthActions();
  const posts = useQuery(api.posts.list);
  const currentUser = useQuery(api.users.currentUser);
  const [username, setUsername] = useState("");
  const [showUsernameModal, setShowUsernameModal] = useState(false);

  useEffect(() => {
    // Generate a fun username for new users
    if (currentUser && !username) {
      const adjectives = ["Happy", "Silly", "Cool", "Super", "Mega", "Ultra", "Pixel", "Cosmic", "Magic", "Speedy"];
      const nouns = ["Penguin", "Dragon", "Robot", "Unicorn", "Ninja", "Wizard", "Artist", "Creator", "Star", "Hero"];
      const randomName = `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${Math.floor(Math.random() * 100)}`;
      setUsername(randomName);
    }
  }, [currentUser, username]);

  if (posts === undefined || currentUser === undefined) {
    return (
      <div className="min-h-[100dvh] bg-[#F5F5F0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-8 border-[#FF006E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p
            className="mt-6 text-2xl font-bold text-black"
            style={{ fontFamily: "'VT323', monospace" }}
          >
            LOADING...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#F5F5F0] relative">
      {/* Noise texture */}
      <div
        className="fixed inset-0 opacity-20 pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-black border-b-4 border-[#AAFF00]">
        <div className="max-w-2xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <h1
            className="text-3xl md:text-4xl font-bold text-white"
            style={{ fontFamily: "'VT323', monospace" }}
          >
            <span className="text-[#FF006E]">POP</span>
            <span className="text-[#AAFF00]">-</span>
            <span className="text-[#3A86FF]">GEN</span>
          </h1>

          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => setShowUsernameModal(true)}
              className="px-3 py-2 md:px-4 md:py-2 bg-[#3A86FF] text-white text-sm md:text-base font-bold border-3 border-white hover:bg-[#FF006E] transition-colors truncate max-w-[100px] md:max-w-none"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              @{username}
            </button>
            <button
              onClick={() => signOut()}
              className="px-3 py-2 md:px-4 md:py-2 bg-white text-black text-sm md:text-base font-bold border-3 border-black hover:bg-[#FF006E] hover:text-white hover:border-white transition-colors"
              style={{ fontFamily: "'VT323', monospace" }}
            >
              EXIT
            </button>
          </div>
        </div>
      </header>

      {/* Username modal */}
      {showUsernameModal && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0_0_#000] w-full max-w-sm">
            <h2
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: "'VT323', monospace" }}
            >
              CHANGE USERNAME
            </h2>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20))}
              className="w-full p-4 border-4 border-black text-lg bg-[#F5F5F0] focus:outline-none focus:bg-[#AAFF00]"
              style={{ fontFamily: "'Space Mono', monospace" }}
            />
            <button
              onClick={() => setShowUsernameModal(false)}
              className="w-full mt-4 p-4 bg-[#FF006E] text-white text-xl font-bold border-4 border-black shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              style={{ fontFamily: "'VT323', monospace" }}
            >
              SAVE
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 py-6 md:py-8">
        {/* Create post */}
        <CreatePost username={username} />

        {/* Feed */}
        <div className="space-y-6 md:space-y-8">
          {posts.length === 0 ? (
            <div className="text-center py-12 md:py-16">
              <p
                className="text-4xl md:text-6xl mb-4"
                style={{ fontFamily: "'VT323', monospace" }}
              >
                NO VIDEOS YET
              </p>
              <p
                className="text-lg md:text-xl text-gray-600"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                Be the first to create a Pixar-style video!
              </p>
            </div>
          ) : (
            posts.map((post: {
              _id: Id<"posts">;
              username: string;
              prompt: string;
              videoUrl?: string;
              status: "generating" | "complete" | "failed";
              errorMessage?: string;
              createdAt: number;
              likes: number;
            }, index: number) => (
              <VideoPost key={post._id} post={post} index={index} />
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t-4 border-black bg-black py-4 md:py-6 mt-8 md:mt-12">
        <p
          className="text-center text-gray-500 text-xs md:text-sm"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          Requested by @web-user · Built by @clonkbot
        </p>
      </footer>
    </div>
  );
}

// Main App component
export default function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#F5F5F0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-8 border-[#FF006E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p
            className="mt-6 text-2xl font-bold text-black"
            style={{ fontFamily: "'VT323', monospace" }}
          >
            LOADING...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return <Feed />;
}
