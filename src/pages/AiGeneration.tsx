import { useState, useRef } from "react";
import Layout from "@/components/Layout";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getApiUrl } from "@/lib/api";
import { toast } from "sonner";

const IMAGE_SIZES = [
  { value: "1024x1024", label: "Квадрат 1:1 (логотип)" },
  { value: "1792x1024", label: "Широкий 16:9 (баннер)" },
  { value: "1024x1792", label: "Вертикальный 9:16 (сторис)" },
];

const IMAGE_MODELS = [
  { value: "dall-e-3", label: "DALL-E 3 (рекомендуется)" },
  { value: "dall-e-2", label: "DALL-E 2 (дешевле)" },
  { value: "gpt-image-1", label: "GPT Image 1 (новый)" },
  { value: "custom", label: "Другая модель..." },
];

const VIDEO_MODELS = [
  { value: "sora-2", label: "Sora 2", badge: "OpenAI", durations: ["5", "10", "20"], ratios: ["16:9", "9:16", "1:1"] },
  { value: "sora-1", label: "Sora 1", badge: "OpenAI", durations: ["5", "10", "20"], ratios: ["16:9", "9:16", "1:1"] },
  { value: "kling-v2-master", label: "Kling v2 Master", badge: "Топ", durations: ["5", "10"], ratios: ["16:9", "9:16", "1:1"] },
  { value: "kling-v1.5-pro", label: "Kling v1.5 Pro", badge: "Pro", durations: ["5", "10"], ratios: ["16:9", "9:16", "1:1"] },
  { value: "kling-v1-standard", label: "Kling v1 Standard", badge: "Быстро", durations: ["5", "10"], ratios: ["16:9", "9:16", "1:1"] },
  { value: "hailuo-01", label: "Hailuo (MiniMax)", badge: "6 сек", durations: ["6"], ratios: ["16:9", "9:16", "1:1"] },
];

const VIDEO_ASPECTS = [
  { value: "16:9", label: "16:9 — Горизонтальное" },
  { value: "9:16", label: "9:16 — Вертикальное (сторис)" },
  { value: "1:1", label: "1:1 — Квадрат" },
];

type Tab = "image" | "video";

const AiGeneration = () => {
  const [activeTab, setActiveTab] = useState<Tab>("image");

  // --- Image state ---
  const [imgPrompt, setImgPrompt] = useState("");
  const [imgSize, setImgSize] = useState("1024x1024");
  const [imgModel, setImgModel] = useState("dall-e-3");
  const [imgCustomModel, setImgCustomModel] = useState("");
  const [imgGenerating, setImgGenerating] = useState(false);
  const [imgResult, setImgResult] = useState<{ url: string; prompt_used: string } | null>(null);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  // --- Video state ---
  const [vidPrompt, setVidPrompt] = useState("");
  const [vidModel, setVidModel] = useState("sora-2");
  const [vidAspect, setVidAspect] = useState("16:9");
  const [vidDuration, setVidDuration] = useState("5");
  const [vidGenerating, setVidGenerating] = useState(false);
  const [vidResult, setVidResult] = useState<{ url: string; prompt_used: string; model?: string } | null>(null);
  const vidInputRef = useRef<HTMLInputElement>(null);

  const currentVideoModel = VIDEO_MODELS.find(m => m.value === vidModel) || VIDEO_MODELS[0];

  const handleImgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImgPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };



  const handleGenerate = async () => {
    if (!imgPrompt.trim() && !imgFile) {
      toast.error("Введите промпт или загрузите фото");
      return;
    }
    setImgGenerating(true);
    setImgResult(null);
    try {
      const url = getApiUrl("image-generate");
      if (!url) { toast.error("Функция генерации не подключена"); return; }
      const body: Record<string, string> = {
        prompt: imgPrompt,
        size: imgSize,
        model: imgModel === "custom" ? imgCustomModel : imgModel,
      };
      if (imgFile) {
        const b64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            resolve(dataUrl.split(",")[1]);
          };
          reader.readAsDataURL(imgFile);
        });
        body.image_b64 = b64;
      }
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.url) {
        setImgResult(data);
        toast.success("Изображение сгенерировано!");
      } else {
        toast.error(data.error || "Ошибка генерации");
      }
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setImgGenerating(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!vidPrompt.trim()) {
      toast.error("Введите промпт для генерации видео");
      return;
    }
    setVidGenerating(true);
    setVidResult(null);
    try {
      const url = getApiUrl("video-generate");
      if (!url) { toast.error("Функция генерации видео не подключена"); return; }
      const body: Record<string, string> = {
        prompt: vidPrompt,
        model: vidModel,
        aspect_ratio: vidAspect,
        duration: vidDuration,
      };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.url) {
        setVidResult(data);
        toast.success("Видео сгенерировано!");
      } else {
        toast.error(data.error || "Ошибка генерации видео");
      }
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setVidGenerating(false);
    }
  };

  return (
    <Layout title="Генерация ИИ">
      <div className="max-w-2xl space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Генерация контента с помощью ИИ</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Создавайте изображения и видео по текстовому описанию или приложенному файлу
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab("image")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "image"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon name="ImagePlus" size={16} />
            Изображения
          </button>
          <button
            onClick={() => setActiveTab("video")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "video"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon name="Video" size={16} />
            Видео
          </button>
        </div>

        {/* Image tab */}
        {activeTab === "image" && (
          <div className="bg-white rounded-xl border border-border p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Icon name="ImagePlus" size={16} className="text-pink-600" />
              <h4 className="text-sm font-semibold text-foreground">Генерация изображений</h4>
            </div>
            <p className="text-xs text-muted-foreground">
              Создавайте логотипы, рекламные баннеры и изображения по описанию или фото-референсу
            </p>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Промпт</label>
                <Textarea
                  placeholder="Логотип автосервиса с синими цветами и гаечным ключом..."
                  value={imgPrompt}
                  onChange={(e) => setImgPrompt(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Формат</label>
                  <Select value={imgSize} onValueChange={setImgSize}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {IMAGE_SIZES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Модель</label>
                  <Select value={imgModel} onValueChange={setImgModel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {IMAGE_MODELS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {imgModel === "custom" && (
                    <Input
                      placeholder="Название модели..."
                      value={imgCustomModel}
                      onChange={(e) => setImgCustomModel(e.target.value)}
                      className="mt-1.5"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Фото-референс</label>
                <input
                  ref={imgInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImgFileChange}
                />
                <Button
                  variant="outline"
                  className="w-full justify-start text-sm"
                  onClick={() => imgInputRef.current?.click()}
                >
                  <Icon name="Upload" size={14} className="mr-2 text-muted-foreground" />
                  {imgFile ? imgFile.name.slice(0, 28) : "Загрузить фото"}
                </Button>
              </div>

              {imgPreview && (
                <div className="relative inline-block">
                  <img src={imgPreview} alt="Референс" className="h-20 w-20 object-cover rounded-lg border border-border" />
                  <button
                    className="absolute -top-1.5 -right-1.5 bg-white border border-border rounded-full p-0.5 text-muted-foreground hover:text-red-500"
                    onClick={() => { setImgFile(null); setImgPreview(null); }}
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={imgGenerating}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white"
              >
                {imgGenerating ? (
                  <><Icon name="Loader2" size={14} className="animate-spin mr-2" />Генерирую (15–30 сек)...</>
                ) : (
                  <><Icon name="Sparkles" size={14} className="mr-2" />Сгенерировать</>
                )}
              </Button>
            </div>

            {imgResult && (
              <div className="space-y-3 pt-2 border-t border-border">
                <img
                  src={imgResult.url}
                  alt="Результат"
                  className="w-full rounded-xl border border-border object-cover max-h-80"
                />
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Промпт:</span> {imgResult.prompt_used}
                </p>
                <a
                  href={imgResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                >
                  <Icon name="ExternalLink" size={13} />
                  Открыть в полном размере
                </a>
              </div>
            )}
          </div>
        )}

        {/* Video tab */}
        {activeTab === "video" && (
          <div className="bg-white rounded-xl border border-border p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Icon name="Video" size={16} className="text-violet-600" />
              <h4 className="text-sm font-semibold text-foreground">Генерация видео</h4>
              <span className="text-xs bg-violet-100 text-violet-700 font-medium px-2 py-0.5 rounded-full">Sora 2 · Kling · Hailuo</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Создавайте рекламные ролики и видео-контент по описанию. Выберите модель для сравнения результатов.
            </p>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Промпт</label>
                <Textarea
                  placeholder="Рекламное видео автосервиса — машина въезжает в чистый гараж, мастер встречает клиента..."
                  value={vidPrompt}
                  onChange={(e) => setVidPrompt(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Модель</label>
                <div className="grid grid-cols-2 gap-2">
                  {VIDEO_MODELS.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => {
                        setVidModel(m.value);
                        if (!m.durations.includes(vidDuration)) setVidDuration(m.durations[0]);
                      }}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition-colors text-left ${
                        vidModel === m.value
                          ? "border-violet-500 bg-violet-50 text-violet-700"
                          : "border-border text-foreground hover:border-violet-300"
                      }`}
                    >
                      <span>{m.label}</span>
                      <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        vidModel === m.value ? "bg-violet-200 text-violet-800" : "bg-muted text-muted-foreground"
                      }`}>{m.badge}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Формат</label>
                  <Select value={vidAspect} onValueChange={setVidAspect}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {VIDEO_ASPECTS.map((a) => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Длительность</label>
                  <Select value={vidDuration} onValueChange={setVidDuration}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {currentVideoModel.durations.map((d) => (
                        <SelectItem key={d} value={d}>{d} секунд</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <input ref={vidInputRef} type="file" accept="video/*" className="hidden" />

              <Button
                onClick={handleGenerateVideo}
                disabled={vidGenerating}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
              >
                {vidGenerating ? (
                  <><Icon name="Loader2" size={14} className="animate-spin mr-2" />Генерирую (1–3 минуты)...</>
                ) : (
                  <><Icon name="Sparkles" size={14} className="mr-2" />Сгенерировать видео</>
                )}
              </Button>
            </div>

            {vidResult && (
              <div className="space-y-3 pt-2 border-t border-border">
                <video
                  src={vidResult.url}
                  controls
                  className="w-full rounded-xl border border-border max-h-80"
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {vidResult.model && (
                    <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">{vidResult.model}</span>
                  )}
                  <span><span className="font-medium">Промпт:</span> {vidResult.prompt_used}</span>
                </div>
                <a
                  href={vidResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                >
                  <Icon name="ExternalLink" size={13} />
                  Скачать видео
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AiGeneration;