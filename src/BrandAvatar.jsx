import ClaudeAvatar from '@lobehub/icons/es/Claude/components/Avatar';
import OpenAIAvatar from '@lobehub/icons/es/OpenAI/components/Avatar';
import GeminiAvatar from '@lobehub/icons/es/Gemini/components/Avatar';
import DeepSeekAvatar from '@lobehub/icons/es/DeepSeek/components/Avatar';
import QwenAvatar from '@lobehub/icons/es/Qwen/components/Avatar';
import KimiAvatar from '@lobehub/icons/es/Kimi/components/Avatar';
import ZAIAvatar from '@lobehub/icons/es/ZAI/components/Avatar';
import GrokAvatar from '@lobehub/icons/es/Grok/components/Avatar';
import MetaAvatar from '@lobehub/icons/es/Meta/components/Avatar';
import MistralAvatar from '@lobehub/icons/es/Mistral/components/Avatar';
import MinimaxAvatar from '@lobehub/icons/es/Minimax/components/Avatar';
import XiaomiAvatar from '@lobehub/icons/es/XiaomiMiMo/components/Avatar';
import NvidiaAvatar from '@lobehub/icons/es/Nvidia/components/Avatar';
// These are the exact components exposed as Claude.Avatar, OpenAI.Avatar, etc.
// Import only Avatar so unused wordmarks and color variants stay out of the Toy.
const avatars={anthropic:ClaudeAvatar,openai:OpenAIAvatar,google:GeminiAvatar,deepseek:DeepSeekAvatar,qwen:QwenAvatar,kimi:KimiAvatar,zai:ZAIAvatar,xai:GrokAvatar,meta:MetaAvatar,mistral:MistralAvatar,minimax:MinimaxAvatar,xiaomimimo:XiaomiAvatar,nvidia:NvidiaAvatar};
export default function BrandAvatar({icon}){
 const Avatar=avatars[icon];
 return Avatar?<Avatar size={30} shape="square" className="brand-avatar" style={{display:'flex',alignItems:'center',justifyContent:'center',borderRadius:6,boxShadow:'none'}}/>:null;
}
