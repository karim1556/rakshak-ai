import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface EmergencyStep {
  id: string
  text: string
  imageUrl?: string
  completed: boolean
  timestamp: number
}

export interface Message {
  id: string
  role: 'user' | 'ai' | 'system' | 'dispatch'
  content: string
  timestamp: number
  audioUrl?: string
}

export interface EmergencySession {
  id: string
  status: 'active' | 'escalated' | 'connected' | 'resolved'
  type?: 'medical' | 'fire' | 'safety' | 'accident' | 'other'
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  summary?: string
  location?: { lat: number; lng: number; address?: string }
  messages: Message[]
  steps: EmergencyStep[]
  assignedResponder?: {
    id: string
    name: string
    role: string
    unit: string
  }
  createdAt: number
  escalatedAt?: number
}

interface EmergencyStore {
  // Current session
  session: EmergencySession | null
  isAgentActive: boolean
  isListening: boolean
  isSpeaking: boolean
  isEscalated: boolean
  isConnectedToDispatch: boolean
  
  // Actions
  startSession: () => void
  endSession: () => void
  setAgentActive: (active: boolean) => void
  setListening: (listening: boolean) => void
  setSpeaking: (speaking: boolean) => void
  
  addMessage: (role: Message['role'], content: string, audioUrl?: string) => void
  addStep: (text: string, imageUrl?: string) => void
  completeStep: (stepId: string) => void
  
  updateSessionInfo: (info: Partial<Pick<EmergencySession, 'type' | 'severity' | 'summary' | 'location'>>) => void
  
  escalateToDispatch: () => void
  connectWithDispatch: (responder: EmergencySession['assignedResponder']) => void
  resolveSession: () => void
  
  // History
  pastSessions: EmergencySession[]
}

export const useEmergencyStore = create<EmergencyStore>()(
  persist(
    (set, get) => ({
      session: null,
      isAgentActive: false,
      isListening: false,
      isSpeaking: false,
      isEscalated: false,
      isConnectedToDispatch: false,
      pastSessions: [],
      
      startSession: () => {
        const newSession: EmergencySession = {
          id: `EM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status: 'active',
          messages: [],
          steps: [],
          createdAt: Date.now(),
        }
        set({ 
          session: newSession, 
          isAgentActive: true,
          isEscalated: false,
          isConnectedToDispatch: false,
        })
      },
      
      endSession: () => {
        const { session, pastSessions } = get()
        if (session) {
          set({ 
            pastSessions: [...pastSessions, { ...session, status: 'resolved' }],
            session: null,
            isAgentActive: false,
            isListening: false,
            isSpeaking: false,
            isEscalated: false,
            isConnectedToDispatch: false,
          })
        }
      },
      
      setAgentActive: (active) => set({ isAgentActive: active }),
      setListening: (listening) => set({ isListening: listening }),
      setSpeaking: (speaking) => set({ isSpeaking: speaking }),
      
      addMessage: (role, content, audioUrl) => {
        const { session } = get()
        if (!session) return
        
        const newMessage: Message = {
          id: `msg-${Date.now()}`,
          role,
          content,
          timestamp: Date.now(),
          audioUrl,
        }
        
        set({
          session: {
            ...session,
            messages: [...session.messages, newMessage],
          },
        })
      },
      
      addStep: (text, imageUrl) => {
        const { session } = get()
        if (!session) return
        
        const newStep: EmergencyStep = {
          id: `step-${Date.now()}`,
          text,
          imageUrl,
          completed: false,
          timestamp: Date.now(),
        }
        
        set({
          session: {
            ...session,
            steps: [...session.steps, newStep],
          },
        })
      },
      
      completeStep: (stepId) => {
        const { session } = get()
        if (!session) return
        
        set({
          session: {
            ...session,
            steps: session.steps.map(s => 
              s.id === stepId ? { ...s, completed: true } : s
            ),
          },
        })
      },
      
      updateSessionInfo: (info) => {
        const { session } = get()
        if (!session) return
        
        set({
          session: {
            ...session,
            ...info,
          },
        })
      },
      
      escalateToDispatch: () => {
        const { session } = get()
        if (!session) return
        
        set({
          session: {
            ...session,
            status: 'escalated',
            escalatedAt: Date.now(),
          },
          isEscalated: true,
        })
      },
      
      connectWithDispatch: (responder) => {
        const { session } = get()
        if (!session) return
        
        set({
          session: {
            ...session,
            status: 'connected',
            assignedResponder: responder,
          },
          isConnectedToDispatch: true,
        })
      },
      
      resolveSession: () => {
        const { session, pastSessions } = get()
        if (!session) return
        
        set({
          pastSessions: [...pastSessions, { ...session, status: 'resolved' }],
          session: null,
          isAgentActive: false,
          isListening: false,
          isSpeaking: false,
          isEscalated: false,
          isConnectedToDispatch: false,
        })
      },
    }),
    {
      name: 'rakshak-emergency-store',
      partialize: (state) => ({ pastSessions: state.pastSessions }),
    }
  )
)
