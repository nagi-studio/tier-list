// Brand logos from @lobehub/icons (MIT). We import only each brand's SVG and color constants and draw the
// rounded avatar ourselves — the package's own Avatar pulls in @lobehub/ui (~700 KB) just for a centered box.
import ClaudeIcon from '@lobehub/icons/es/Claude/components/Mono';
import * as ClaudeStyle from '@lobehub/icons/es/Claude/style';
import OpenAIIcon from '@lobehub/icons/es/OpenAI/components/Mono';
import * as OpenAIStyle from '@lobehub/icons/es/OpenAI/style';
import GeminiIcon from '@lobehub/icons/es/Gemini/components/Color';
import * as GeminiStyle from '@lobehub/icons/es/Gemini/style';
import DeepSeekIcon from '@lobehub/icons/es/DeepSeek/components/Mono';
import * as DeepSeekStyle from '@lobehub/icons/es/DeepSeek/style';
import QwenIcon from '@lobehub/icons/es/Qwen/components/Mono';
import * as QwenStyle from '@lobehub/icons/es/Qwen/style';
import KimiIcon from '@lobehub/icons/es/Kimi/components/Color';
import * as KimiStyle from '@lobehub/icons/es/Kimi/style';
import ZAIIcon from '@lobehub/icons/es/ZAI/components/Mono';
import * as ZAIStyle from '@lobehub/icons/es/ZAI/style';
import GrokIcon from '@lobehub/icons/es/Grok/components/Mono';
import * as GrokStyle from '@lobehub/icons/es/Grok/style';
import MetaIcon from '@lobehub/icons/es/Meta/components/Mono';
import * as MetaStyle from '@lobehub/icons/es/Meta/style';
import MistralIcon from '@lobehub/icons/es/Mistral/components/Mono';
import * as MistralStyle from '@lobehub/icons/es/Mistral/style';
import MinimaxIcon from '@lobehub/icons/es/Minimax/components/Mono';
import * as MinimaxStyle from '@lobehub/icons/es/Minimax/style';
import XiaomiMiMoIcon from '@lobehub/icons/es/XiaomiMiMo/components/Mono';
import * as XiaomiMiMoStyle from '@lobehub/icons/es/XiaomiMiMo/style';
import NvidiaIcon from '@lobehub/icons/es/Nvidia/components/Mono';
import * as NvidiaStyle from '@lobehub/icons/es/Nvidia/style';
import NovaIcon from '@lobehub/icons/es/Nova/components/Mono';
import * as NovaStyle from '@lobehub/icons/es/Nova/style';
import LingIcon from '@lobehub/icons/es/Ling/components/Mono';
import * as LingStyle from '@lobehub/icons/es/Ling/style';
import IBMIcon from '@lobehub/icons/es/IBM/components/Mono';
import * as IBMStyle from '@lobehub/icons/es/IBM/style';
import LiquidIcon from '@lobehub/icons/es/Liquid/components/Mono';
import * as LiquidStyle from '@lobehub/icons/es/Liquid/style';
import Ai2Icon from '@lobehub/icons/es/Ai2/components/Mono';
import * as Ai2Style from '@lobehub/icons/es/Ai2/style';
import UpstageIcon from '@lobehub/icons/es/Upstage/components/Mono';
import * as UpstageStyle from '@lobehub/icons/es/Upstage/style';
import Ai21Icon from '@lobehub/icons/es/Ai21/components/Mono';
import * as Ai21Style from '@lobehub/icons/es/Ai21/style';
import CohereIcon from '@lobehub/icons/es/Cohere/components/Mono';
import * as CohereStyle from '@lobehub/icons/es/Cohere/style';
import PerplexityIcon from '@lobehub/icons/es/Perplexity/components/Mono';
import * as PerplexityStyle from '@lobehub/icons/es/Perplexity/style';
import StepfunIcon from '@lobehub/icons/es/Stepfun/components/Inner';
import * as StepfunStyle from '@lobehub/icons/es/Stepfun/style';
import LGIcon from '@lobehub/icons/es/LG/components/Inner';
import * as LGStyle from '@lobehub/icons/es/LG/style';
import NousResearchIcon from '@lobehub/icons/es/NousResearch/components/Mono';
import * as NousResearchStyle from '@lobehub/icons/es/NousResearch/style';
import MicrosoftIcon from '@lobehub/icons/es/Microsoft/components/Mono';
import * as MicrosoftStyle from '@lobehub/icons/es/Microsoft/style';
import InceptionIcon from '@lobehub/icons/es/Inception/components/Mono';
import * as InceptionStyle from '@lobehub/icons/es/Inception/style';
import ByteDanceIcon from '@lobehub/icons/es/ByteDance/components/Mono';
import * as ByteDanceStyle from '@lobehub/icons/es/ByteDance/style';
import LongCatIcon from '@lobehub/icons/es/LongCat/components/Color';
import * as LongCatStyle from '@lobehub/icons/es/LongCat/style';
import HunyuanIcon from '@lobehub/icons/es/Hunyuan/components/Mono';
import * as HunyuanStyle from '@lobehub/icons/es/Hunyuan/style';
import WenxinIcon from '@lobehub/icons/es/Wenxin/components/Mono';
import * as WenxinStyle from '@lobehub/icons/es/Wenxin/style';
import RekaIcon from '@lobehub/icons/es/Reka/components/Mono';
import * as RekaStyle from '@lobehub/icons/es/Reka/style';
import KwaiKATIcon from '@lobehub/icons/es/KwaiKAT/components/Mono';
import * as KwaiKATStyle from '@lobehub/icons/es/KwaiKAT/style';
import ArceeIcon from '@lobehub/icons/es/Arcee/components/Mono';
import * as ArceeStyle from '@lobehub/icons/es/Arcee/style';
import TIIIcon from '@lobehub/icons/es/TII/components/Mono';
import * as TIIStyle from '@lobehub/icons/es/TII/style';
import DeepCogitoIcon from '@lobehub/icons/es/DeepCogito/components/Mono';
import * as DeepCogitoStyle from '@lobehub/icons/es/DeepCogito/style';
import SnowflakeIcon from '@lobehub/icons/es/Snowflake/components/Mono';
import * as SnowflakeStyle from '@lobehub/icons/es/Snowflake/style';
import OpenChatIcon from '@lobehub/icons/es/OpenChat/components/Mono';
import * as OpenChatStyle from '@lobehub/icons/es/OpenChat/style';
import DbrxIcon from '@lobehub/icons/es/Dbrx/components/Mono';
import * as DbrxStyle from '@lobehub/icons/es/Dbrx/style';

type BrandStyle = {
  [K in keyof Pick<typeof ClaudeStyle, 'TITLE' | 'AVATAR_COLOR' | 'AVATAR_BACKGROUND' | 'AVATAR_ICON_MULTIPLE'>]: typeof ClaudeStyle[K] extends string ? string : number;
};
type BrandEntry = [typeof ClaudeIcon, BrandStyle, {multiple?: number; color?: string}?];
const brands: Record<string, BrandEntry> = {
  anthropic: [ClaudeIcon, ClaudeStyle],
  openai: [OpenAIIcon, OpenAIStyle],
  google: [GeminiIcon, GeminiStyle],
  deepseek: [DeepSeekIcon, DeepSeekStyle],
  qwen: [QwenIcon, QwenStyle],
  kimi: [KimiIcon, KimiStyle],
  zai: [ZAIIcon, ZAIStyle],
  xai: [GrokIcon, GrokStyle],
  meta: [MetaIcon, MetaStyle],
  mistral: [MistralIcon, MistralStyle],
  minimax: [MinimaxIcon, MinimaxStyle],
  xiaomimimo: [XiaomiMiMoIcon, XiaomiMiMoStyle],
  nvidia: [NvidiaIcon, NvidiaStyle],
  nova: [NovaIcon, NovaStyle],
  ling: [LingIcon, LingStyle],
  ibm: [IBMIcon, IBMStyle],
  liquid: [LiquidIcon, LiquidStyle],
  ai2: [Ai2Icon, Ai2Style],
  upstage: [UpstageIcon, UpstageStyle],
  ai21: [Ai21Icon, Ai21Style],
  cohere: [CohereIcon, CohereStyle],
  perplexity: [PerplexityIcon, PerplexityStyle],
  stepfun: [StepfunIcon, StepfunStyle],
  lg: [LGIcon, LGStyle, {multiple: 1, color: undefined}],
  nousresearch: [NousResearchIcon, NousResearchStyle],
  microsoft: [MicrosoftIcon, MicrosoftStyle],
  inception: [InceptionIcon, InceptionStyle],
  bytedance: [ByteDanceIcon, ByteDanceStyle],
  longcat: [LongCatIcon, LongCatStyle],
  hunyuan: [HunyuanIcon, HunyuanStyle],
  wenxin: [WenxinIcon, WenxinStyle],
  reka: [RekaIcon, RekaStyle],
  kwaikat: [KwaiKATIcon, KwaiKATStyle],
  arcee: [ArceeIcon, ArceeStyle],
  tii: [TIIIcon, TIIStyle],
  deepcogito: [DeepCogitoIcon, DeepCogitoStyle],
  snowflake: [SnowflakeIcon, SnowflakeStyle],
  openchat: [OpenChatIcon, OpenChatStyle],
  dbrx: [DbrxIcon, DbrxStyle],
};

export const brandKeys = Object.keys(brands);
export const isBrand = (key?: string) => key != null && Object.hasOwn(brands, key);

export default function BrandAvatar({icon, size = 30}: {icon?: string; size?: number}) {
  const entry = icon ? brands[icon] : undefined;
  if (!entry) return null;
  const [Icon, style, override = {}] = entry;
  const color = 'color' in override ? override.color : style.AVATAR_COLOR;
  return <span className="brand-avatar" role="img" aria-label={style.TITLE} style={{width: size, height: size, borderRadius: Math.round(size * .24), background: style.AVATAR_BACKGROUND, color}}>
    <Icon size={size} color={color} style={{transform: `scale(${override.multiple ?? style.AVATAR_ICON_MULTIPLE})`}}/>
  </span>;
}
