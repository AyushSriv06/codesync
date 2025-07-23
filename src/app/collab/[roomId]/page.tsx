"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import { Editor } from "@monaco-editor/react";
import { defineMonacoThemes, LANGUAGE_CONFIG } from "@/app/(root)/_constants";
import { useCodeEditorStore } from "@/store/useCodeEditorStore";
import NavigationHeader from "@/components/NavigationHeader";
import { motion } from "framer-motion";
import { 
  Users, 
  Wifi, 
  WifiOff, 
  Copy, 
  Check, 
  Play, 
  RotateCcw, 
  Share,
  TypeIcon 
} from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

const CollabPage = () => {
  const params = useParams();
  const roomId = params.roomId as string;
  const { user } = useUser();
  
  const { language, theme, fontSize, setFontSize, runCode, isRunning, output, error } = useCodeEditorStore();
  const saveExecution = useMutation(api.codeExecutions.saveExecution);
  
  const [doc, setDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [binding, setBinding] = useState<MonacoBinding | null>(null);
  const [editor, setEditor] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [copied, setCopied] = useState(false);

  // Initialize Yjs document and WebSocket connection
  useEffect(() => {
    if (!roomId) return;

    const ydoc = new Y.Doc();
    const wsProvider = new WebsocketProvider(
      'ws://localhost:1234', 
      roomId, 
      ydoc,
      {
        connect: true,
        params: { room: roomId }
      }
    );

    // Handle connection status
    wsProvider.on('status', (event: any) => {
      setIsConnected(event.status === 'connected');
      if (event.status === 'connected') {
        toast.success('Connected to collaborative session');
      } else if (event.status === 'disconnected') {
        toast.error('Disconnected from session');
      }
    });

    // Handle awareness (user presence)
    wsProvider.awareness.on('change', () => {
      setConnectedUsers(wsProvider.awareness.getStates().size);
    });

    setDoc(ydoc);
    setProvider(wsProvider);

    return () => {
      wsProvider.destroy();
      ydoc.destroy();
    };
  }, [roomId]);

  // Set up Monaco binding when editor is ready
  const handleEditorDidMount = (editorInstance: any) => {
    if (!doc || !provider) return;

    setEditor(editorInstance);
    
    const yText = doc.getText('monaco');
    const monacoBinding = new MonacoBinding(
      yText,
      editorInstance.getModel()!,
      new Set([editorInstance]),
      provider.awareness
    );

    setBinding(monacoBinding);
  };

  // Handle code execution
  const handleRunCode = async () => {
    if (!editor) return;
    
    const code = editor.getValue();
    if (!code.trim()) {
      toast.error("Please enter some code");
      return;
    }

    try {
      const runtime = LANGUAGE_CONFIG[language].pistonRuntime;
      const response = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: runtime.language,
          version: runtime.version,
          files: [{ content: code }],
        }),
      });

      const data = await response.json();

      // Save execution to Convex if user is authenticated
      if (user) {
        await saveExecution({
          language,
          code,
          output: data.run?.output || undefined,
          error: data.compile?.stderr || data.run?.stderr || undefined,
        });
      }

      toast.success("Code executed successfully");
    } catch (error) {
      console.error("Error running code:", error);
      toast.error("Error executing code");
    }
  };

  // Copy room URL
  const copyRoomUrl = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Room URL copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Font size handler
  const handleFontSizeChange = (newSize: number) => {
    const size = Math.min(Math.max(newSize, 12), 24);
    setFontSize(size);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <NavigationHeader />
      
      <div className="max-w-[1800px] mx-auto p-4">
        {/* Collaboration Header */}
        <div className="mb-6 bg-[#12121a]/90 backdrop-blur rounded-xl border border-white/[0.05] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-white font-medium">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-400">
                <Users className="w-4 h-4" />
                <span>{connectedUsers} user{connectedUsers !== 1 ? 's' : ''} online</span>
              </div>
              
              <div className="text-gray-500 text-sm">
                Room: {roomId.slice(0, 8)}...
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={copyRoomUrl}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 
                  text-purple-400 rounded-lg transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span className="text-sm">{copied ? 'Copied!' : 'Share'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Editor Panel */}
          <div className="relative">
            <div className="relative bg-[#12121a]/90 backdrop-blur rounded-xl border border-white/[0.05] p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1e1e2e] ring-1 ring-white/5">
                    <Image src={`/${language}.png`} alt="Logo" width={24} height={24} />
                  </div>
                  <div>
                    <h2 className="text-sm font-medium text-white">Collaborative Editor</h2>
                    <p className="text-xs text-gray-500">Real-time code collaboration</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Font Size Slider */}
                  <div className="flex items-center gap-3 px-3 py-2 bg-[#1e1e2e] rounded-lg ring-1 ring-white/5">
                    <TypeIcon className="size-4 text-gray-400" />
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="12"
                        max="24"
                        value={fontSize}
                        onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
                        className="w-20 h-1 bg-gray-600 rounded-lg cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-400 min-w-[2rem] text-center">
                        {fontSize}
                      </span>
                    </div>
                  </div>

                  {/* Run Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleRunCode}
                    disabled={isRunning || !isConnected}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg overflow-hidden 
                      bg-gradient-to-r from-blue-500 to-blue-600 opacity-90 hover:opacity-100 
                      transition-opacity disabled:opacity-50"
                  >
                    <Play className="size-4 text-white" />
                    <span className="text-sm font-medium text-white">
                      {isRunning ? 'Running...' : 'Run'}
                    </span>
                  </motion.button>
                </div>
              </div>

              {/* Code Editor */}
              <div className="relative group rounded-xl overflow-hidden ring-1 ring-white/[0.05]">
                <Editor
                  height="600px"
                  language={LANGUAGE_CONFIG[language].monacoLanguage}
                  theme={theme}
                  beforeMount={defineMonacoThemes}
                  onMount={handleEditorDidMount}
                  options={{
                    minimap: { enabled: true },
                    fontSize,
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    padding: { top: 16, bottom: 16 },
                    renderWhitespace: "selection",
                    fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
                    fontLigatures: true,
                    cursorBlinking: "smooth",
                    smoothScrolling: true,
                    contextmenu: true,
                    renderLineHighlight: "all",
                    lineHeight: 1.6,
                    letterSpacing: 0.5,
                    roundedSelection: true,
                    scrollbar: {
                      verticalScrollbarSize: 8,
                      horizontalScrollbarSize: 8,
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Output Panel */}
          <div className="relative bg-[#181825] rounded-xl p-4 ring-1 ring-gray-800/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#1e1e2e] ring-1 ring-gray-800/50">
                  <Play className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-sm font-medium text-gray-300">Output</span>
              </div>
            </div>

            <div className="relative">
              <div className="relative bg-[#1e1e2e]/50 backdrop-blur-sm border border-[#313244] 
                rounded-xl p-4 h-[600px] overflow-auto font-mono text-sm">
                {output || error ? (
                  <div className="space-y-2">
                    <div className={`flex items-center gap-2 mb-3 ${error ? 'text-red-400' : 'text-emerald-400'}`}>
                      <div className="w-2 h-2 rounded-full bg-current" />
                      <span className="font-medium">
                        {error ? 'Execution Error' : 'Execution Successful'}
                      </span>
                    </div>
                    <pre className={`whitespace-pre-wrap ${error ? 'text-red-400/80' : 'text-gray-300'}`}>
                      {error || output}
                    </pre>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-800/50 ring-1 ring-gray-700/50 mb-4">
                      <Play className="w-6 h-6" />
                    </div>
                    <p className="text-center">Run your code to see the output here...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollabPage;