import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSaasSettings } from "@/hooks/useSaasSettings";
import { Activity, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function TrackingPixelsCard() {
  const { settings, updateSettings, isUpdating } = useSaasSettings();
  
  // Meta Pixel
  const [metaPixelId, setMetaPixelId] = useState("");
  const [metaAccessToken, setMetaAccessToken] = useState("");
  
  // Google
  const [googleTagId, setGoogleTagId] = useState("");
  const [googleConversionId, setGoogleConversionId] = useState("");
  
  // TikTok
  const [tiktokPixelId, setTiktokPixelId] = useState("");

  useEffect(() => {
    if (settings) {
      setMetaPixelId(settings.meta_pixel_id || "");
      setMetaAccessToken(settings.meta_access_token || "");
      setGoogleTagId(settings.google_tag_id || "");
      setGoogleConversionId(settings.google_conversion_id || "");
      setTiktokPixelId(settings.tiktok_pixel_id || "");
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings({
      meta_pixel_id: metaPixelId || null,
      meta_access_token: metaAccessToken || null,
      google_tag_id: googleTagId || null,
      google_conversion_id: googleConversionId || null,
      tiktok_pixel_id: tiktokPixelId || null,
    } as any);
  };

  const isConfigured = (value: string) => value.trim().length > 0;

  const StatusBadge = ({ configured }: { configured: boolean }) => (
    <Badge 
      variant="outline" 
      className={configured 
        ? "border-green-500/50 text-green-400 bg-green-500/10" 
        : "border-slate-600 text-slate-500 bg-slate-700/30"
      }
    >
      {configured ? (
        <>
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Configurado
        </>
      ) : (
        <>
          <XCircle className="h-3 w-3 mr-1" />
          Não configurado
        </>
      )}
    </Badge>
  );

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-600/20 text-cyan-400">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-white">Pixels de Rastreamento</CardTitle>
            <CardDescription className="text-slate-400">
              Configure os pixels para rastreamento de campanhas
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Meta Pixel */}
        <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">f</span>
              </div>
              <h4 className="text-white font-medium">Meta Pixel</h4>
            </div>
            <StatusBadge configured={isConfigured(metaPixelId)} />
          </div>
          <p className="text-slate-400 text-sm mb-3">Facebook, Instagram e Messenger</p>
          <div className="space-y-3">
            <div>
              <Label className="text-slate-400 text-sm">Pixel ID</Label>
              <Input
                value={metaPixelId}
                onChange={(e) => setMetaPixelId(e.target.value)}
                placeholder="123456789012345"
                className="bg-slate-900 border-slate-700 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-slate-400 text-sm">Access Token (opcional - API de Conversões)</Label>
              <Input
                value={metaAccessToken}
                onChange={(e) => setMetaAccessToken(e.target.value)}
                placeholder="EAAxxxxx..."
                type="password"
                className="bg-slate-900 border-slate-700 text-white mt-1"
              />
            </div>
          </div>
        </div>

        {/* Google */}
        <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#4285F4] flex items-center justify-center">
                <span className="text-white text-xs font-bold">G</span>
              </div>
              <h4 className="text-white font-medium">Google Ads / Analytics</h4>
            </div>
            <StatusBadge configured={isConfigured(googleTagId)} />
          </div>
          <p className="text-slate-400 text-sm mb-3">Google Tag Manager, Ads e Analytics</p>
          <div className="space-y-3">
            <div>
              <Label className="text-slate-400 text-sm">Tag ID (GT-XXXXX ou AW-XXXXX)</Label>
              <Input
                value={googleTagId}
                onChange={(e) => setGoogleTagId(e.target.value)}
                placeholder="GT-XXXXXXX ou AW-XXXXXXX"
                className="bg-slate-900 border-slate-700 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-slate-400 text-sm">Conversion ID (opcional)</Label>
              <Input
                value={googleConversionId}
                onChange={(e) => setGoogleConversionId(e.target.value)}
                placeholder="AW-XXXXXXX/XXXXXX"
                className="bg-slate-900 border-slate-700 text-white mt-1"
              />
            </div>
          </div>
        </div>

        {/* TikTok */}
        <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-black flex items-center justify-center border border-slate-600">
                <span className="text-white text-xs font-bold">T</span>
              </div>
              <h4 className="text-white font-medium">TikTok Pixel</h4>
            </div>
            <StatusBadge configured={isConfigured(tiktokPixelId)} />
          </div>
          <p className="text-slate-400 text-sm mb-3">TikTok Ads</p>
          <div>
            <Label className="text-slate-400 text-sm">Pixel ID</Label>
            <Input
              value={tiktokPixelId}
              onChange={(e) => setTiktokPixelId(e.target.value)}
              placeholder="XXXXXXXXXXXXXXXX"
              className="bg-slate-900 border-slate-700 text-white mt-1"
            />
          </div>
        </div>

        <Button 
          onClick={handleSave}
          disabled={isUpdating}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isUpdating ? "Salvando..." : "Salvar Pixels"}
        </Button>

        <p className="text-slate-500 text-xs text-center">
          Os pixels serão ativados automaticamente em todas as páginas públicas.
          Eventos de conversão serão disparados no cadastro (Lead) e na assinatura (Purchase).
        </p>
      </CardContent>
    </Card>
  );
}
