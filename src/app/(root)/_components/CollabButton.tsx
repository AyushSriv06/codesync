"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, LogIn, X, Copy, Check } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const CollabButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState("");
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const createRoom = () => {
    const roomId = uuidv4();
    toast.success("Room created! Redirecting...");
    router.push(`/collab/${roomId}`);
    setIsOpen(false);
  };

  const joinRoom = () => {
    if (!joinRoomId.trim()) {
      toast.error("Please enter a room ID");
      return;
    }
    toast.success("Joining room...");
    router.push(`/collab/${joinRoomId.trim()}`);
    setIsOpen(false);
    setJoinRoomId("");
  };

  const copyCurrentUrl = async () => {
    const currentUrl = window.location.href;
    await navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    toast.success("URL copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative group flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-300 bg-gray-800/50 
          hover:bg-purple-500/10 border border-gray-800 hover:border-purple-500/50 transition-all duration-300 shadow-lg overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        <Users className="w-4 h-4 relative z-10 group-hover:rotate-3 transition-transform" />
        <span className="text-sm font-medium relative z-10 group-hover:text-white hidden sm:inline">
          Collaborate
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1e1e2e] rounded-xl p-6 w-full max-w-md border border-gray-800/50"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  Collaborate
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-300 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Create Room */}
                <div className="p-4 bg-[#262637] rounded-lg border border-gray-800/50">
                  <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-green-400" />
                    Create New Room
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Start a new collaborative coding session
                  </p>
                  <button
                    onClick={createRoom}
                    className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
                  >
                    Create Room
                  </button>
                </div>

                {/* Join Room */}
                <div className="p-4 bg-[#262637] rounded-lg border border-gray-800/50">
                  <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
                    <LogIn className="w-4 h-4 text-blue-400" />
                    Join Existing Room
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Enter a room ID to join a session
                  </p>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={joinRoomId}
                      onChange={(e) => setJoinRoomId(e.target.value)}
                      placeholder="Enter room ID..."
                      className="w-full px-3 py-2 bg-[#181825] border border-gray-700 rounded-lg text-white 
                        placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => e.key === "Enter" && joinRoom()}
                    />
                    <button
                      onClick={joinRoom}
                      disabled={!joinRoomId.trim()}
                      className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 
                        disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                    >
                      Join Room
                    </button>
                  </div>
                </div>

                {/* Share Current Session */}
                {window.location.pathname.includes('/collab/') && (
                  <div className="p-4 bg-[#262637] rounded-lg border border-gray-800/50">
                    <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
                      <Copy className="w-4 h-4 text-purple-400" />
                      Share This Session
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Copy the URL to invite others
                    </p>
                    <button
                      onClick={copyCurrentUrl}
                      className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg 
                        transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy URL
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CollabButton;