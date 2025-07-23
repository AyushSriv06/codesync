import { currentUser } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import React from "react";
import { api } from "../../../../convex/_generated/api";
import Link from "next/link";
import { Blocks, Code2, UserCircle2, Users } from "lucide-react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import ThemeSelector from "./ThemeSelector";
import LanguageSelector from "./LanguageSelector";
import RunButton from "./RunButton";
import HeaderProfileBtn from "./HeaderProfileBtn";
import CollabButton from "./CollabButton";

async function Header() {
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  const user = await currentUser();
  await convex.query(api.users.getUser, {
    userId: user?.id || "",
  });

  return (
    <div className="relative z-10">
      <div
        className="flex flex-wrap items-center justify-between 
        bg-[#0a0a0f]/80 backdrop-blur-xl px-4 py-4 md:px-6 mb-4 rounded-lg"
      >
        {/* LEFT SECTION */}
        <div className="flex items-center gap-4 md:gap-8 mb-2 md:mb-0 w-full md:w-auto justify-between md:justify-start">
          {/* Logo + Text */}
          <Link href="/" className="flex items-center gap-3 group relative">
            <div
              className="absolute -inset-2 
              bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30 
              rounded-xl opacity-0 group-hover:opacity-100 
              transition-all duration-700 blur-2xl 
              group-hover:scale-105 group-hover:blur-3xl"
            />
            <div
              className="relative bg-gradient-to-br from-[#1a1a2e] to-[#0a0a0f] p-2 
              rounded-xl ring-1 ring-white/10 group-hover:ring-white/20 transition-all"
            >
              <Blocks className="size-6 text-blue-400 transform -rotate-6 group-hover:rotate-0 transition-transform duration-500" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="block text-lg font-semibold bg-gradient-to-r from-blue-400 via-blue-300 to-purple-400 text-transparent bg-clip-text">
                CodeSync
              </span>
              <span className="block text-xs text-blue-400/60 font-medium">
                Interactive Code Editor
              </span>
            </div>
          </Link>

          {/* Navigation Buttons */}
          <nav className="flex items-center gap-2">
            <Link
              href="/snippets"
              className="relative group flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-300 bg-gray-800/50 
                hover:bg-blue-500/10 border border-gray-800 hover:border-blue-500/50 transition-all duration-300 shadow-lg overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Code2 className="w-4 h-4 relative z-10 group-hover:rotate-3 transition-transform" />
              <span className="text-sm font-medium relative z-10 group-hover:text-white hidden sm:inline">
                Snippets
              </span>
            </Link>

            <Link
              href="/profile"
              className="relative group flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-300 bg-gray-800/50 
                hover:bg-blue-500/10 border border-gray-800 hover:border-blue-500/50 transition-all duration-300 shadow-lg overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <UserCircle2 className="w-4 h-4 relative z-10 group-hover:rotate-3 transition-transform" />
              <span className="text-sm font-medium relative z-10 group-hover:text-white hidden sm:inline">
                Profile
              </span>
            </Link>

            <CollabButton />
          </nav>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <ThemeSelector />
          <LanguageSelector />

          <SignedIn>
            <RunButton />
            <div className="pl-3 border-l border-gray-800">
              <HeaderProfileBtn />
            </div>
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </div>
  );
}

export default Header;
