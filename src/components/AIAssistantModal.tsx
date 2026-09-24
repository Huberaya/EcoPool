import React, { useState } from 'react';
import { useEcoPool } from '../context/EcoPoolContext';
import { queryEcoPoolAI, AIAssistantMode } from '../services/aiService';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  ShieldCheck, 
  Layers, 
  BarChart3, 
  ShoppingBag,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { AIAssistantMessage } from '../types';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCampaign: (campaignId: string) => void;
  onGoToAggregation: () => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  onSelectCampaign,
  onGoToAggregation
}) => {
  const { campaigns, groupingDemands, suppliers, currentBuyer } = useEcoPool();

  const [mode, setMode] = useState<AIAssistantMode>('achat');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<AIAssistantMessage[]>([
    {
      id: 'msg-01',
      role: 'assistant',
      content: `👋 Bonjour ! Je suis l'**Assistant d'Approvisionnement B2B EcoPool**, propulsé par Gemini 3.8 Flash.

Je vous accompagne pour débloquer les MOQ des fabricants industriels :
• **Assistant Achat** : Trouver la campagne idéale pour vos volumes
• **Assistant Sourcing** : Détecter les opportunités d'agrégation de commandes
• **Assistant Conformité** : Vérifier les certificats GRS, FSC, C2C et alertes d'expiration
• **Assistant Admin** : Analyser les risques de MOQ et KPIs de remplissage

Comment puis-je vous aider aujourd'hui ?`,
      timestamp: 'À l’instant'
    }
  ]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const queryText = textToSend || input;
    if (!queryText.trim() || isLoading) return;

    const userMsg: AIAssistantMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: queryText,
      timestamp: new Date().toLocaleTimeString().slice(0, 5)
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const result = await queryEcoPoolAI({
        mode,
        userMessage: queryText,
        context: {
          campaigns,
          demands: groupingDemands,
          suppliers,
          buyerCompanyName: currentBuyer.companyName
        }
      });

      const aiMsg: AIAssistantMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: result.reply,
        timestamp: new Date().toLocaleTimeString().slice(0, 5),
        matchedCampaignIds: result.matchedCampaignIds,
        actionRecommendation: result.suggestedAction
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          content: "Désolé, une anomalie temporaire s'est produite lors de l'analyse.",
          timestamp: new Date().toLocaleTimeString().slice(0, 5)
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (promptText: string, newMode?: AIAssistantMode) => {
    if (newMode) setMode(newMode);
    handleSendMessage(promptText);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                EcoPool AI • Assistant B2B
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Gemini 3.8 Flash
                </span>
              </h2>
              <p className="text-xs text-slate-400">Centrale d'achat, optimisation de MOQ et conformité documentaire</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Buttons */}
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-500 text-[11px] font-semibold shrink-0">Mode :</span>
          <button
            onClick={() => setMode('achat')}
            className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              mode === 'achat' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Assistant Achat
          </button>
          <button
            onClick={() => setMode('sourcing')}
            className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              mode === 'sourcing' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Assistant Sourcing & Groupage
          </button>
          <button
            onClick={() => setMode('conformite')}
            className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              mode === 'conformite' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Assistant Conformité
          </button>
          <button
            onClick={() => setMode('admin')}
            className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              mode === 'admin' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Assistant Admin Risques
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {messages.map(msg => (
            <div 
              key={msg.id} 
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-400 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-xl rounded-2xl p-4 space-y-3 leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-emerald-600 text-white ml-12 rounded-tr-none shadow-md' 
                  : 'bg-slate-800/80 border border-slate-700/80 text-slate-200 mr-12 rounded-tl-none shadow-md'
              }`}>
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Interactive Action Recommendation Button */}
                {msg.actionRecommendation && (
                  <div className="pt-2 border-t border-slate-700">
                    <button
                      onClick={() => {
                        onClose();
                        if (msg.actionRecommendation?.type === 'create_pool') {
                          onGoToAggregation();
                        } else if (msg.actionRecommendation?.targetId) {
                          onSelectCampaign(msg.actionRecommendation.targetId);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>{msg.actionRecommendation.label}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-700 text-slate-300 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 items-center text-xs text-slate-400">
              <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-400 flex items-center justify-center animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <span>Analyse des MOQ et des paliers de production en cours...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts Bar (From Section 24) */}
        <div className="px-6 py-2 bg-slate-950/40 border-t border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px]">
          <span className="text-slate-500 shrink-0">Exemples :</span>
          <button
            onClick={() => handleQuickPrompt("Je cherche 20 000 flacons de 250 ml recyclés pour une marque cosmétique.", 'achat')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap cursor-pointer transition-colors"
          >
            "Je cherche 20 000 flacons 250ml recyclés..."
          </button>
          <button
            onClick={() => handleQuickPrompt("Quelles sont les opportunités de groupage prêtes pour atteindre la MOQ ?", 'sourcing')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap cursor-pointer transition-colors"
          >
            "Opportunités de groupage MOQ..."
          </button>
          <button
            onClick={() => handleQuickPrompt("Quels certificats fournisseurs arrivent à expiration ou manquent ?", 'conformite')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap cursor-pointer transition-colors"
          >
            "Certificats expirés / risques..."
          </button>
          <button
            onClick={() => handleQuickPrompt("Quelles campagnes risquent de ne pas atteindre leur MOQ ?", 'admin')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap cursor-pointer transition-colors"
          >
            "Risques MOQ non atteinte..."
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            placeholder="Posez votre question sur les matières, volumes, paliers de prix ou conformité..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !input.trim()}
            className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-40 transition-colors cursor-pointer font-bold"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
