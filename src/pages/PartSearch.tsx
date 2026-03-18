import { useState } from "react";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { getApiUrl } from "@/lib/api";

interface Offer {
  brand: string;
  article: string;
  description: string;
  price: number;
  quantity: number;
  delivery_days: number | null;
  warehouse_name: string;
  warehouse_type: string;
  offer_id: string;
}

const deliveryLabel = (days: number | null) => {
  if (days === null || days === undefined) return { text: "Под заказ", color: "secondary" };
  if (days === 0) return { text: "Сегодня", color: "default" };
  if (days === 1) return { text: "Завтра", color: "default" };
  return { text: `${days} дн.`, color: days <= 3 ? "default" : "secondary" };
};

const PartSearch = () => {
  const [article, setArticle] = useState("");
  const [loading, setLoading] = useState(false);
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [searchedArticle, setSearchedArticle] = useState("");
  const [error, setError] = useState("");

  const handleSearch = async () => {
    const trimmed = article.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    setOffers(null);
    setSearchedArticle(trimmed);

    try {
      const url = getApiUrl("berg-search");
      const resp = await fetch(`${url}?article=${encodeURIComponent(trimmed)}`);
      const data = await resp.json();
      if (!resp.ok) {
        setError(data.error || "Ошибка запроса");
        return;
      }
      setOffers(data.offers || []);
    } catch {
      setError("Не удалось подключиться к серверу");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(price);

  return (
    <Layout title="Подбор запчастей">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9 text-base h-11"
                placeholder="Введите каталожный номер запчасти..."
                value={article}
                onChange={(e) => setArticle(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
            </div>
            <Button className="h-11 px-6" onClick={handleSearch} disabled={loading || !article.trim()}>
              {loading ? <Icon name="Loader2" size={18} className="animate-spin" /> : "Найти"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Поиск по базе поставщика Berg.ru — наличие, цены и сроки доставки в реальном времени
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
            <Icon name="AlertCircle" size={18} />
            <span>{error}</span>
          </div>
        )}

        {offers !== null && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-lg">
                  Результаты по артикулу <span className="text-blue-600">{searchedArticle}</span>
                </h2>
                <p className="text-sm text-muted-foreground">
                  {offers.length === 0 ? "Ничего не найдено" : `Найдено ${offers.length} предложений`}
                </p>
              </div>
            </div>

            {offers.length === 0 && (
              <div className="bg-white rounded-xl border border-border p-12 text-center">
                <Icon name="PackageX" size={48} className="text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">По данному артикулу предложений не найдено</p>
                <p className="text-sm text-muted-foreground mt-1">Проверьте правильность номера или попробуйте другой артикул</p>
              </div>
            )}

            {offers.length > 0 && (
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 text-xs font-medium text-muted-foreground border-b border-border px-4 py-3 bg-muted/30">
                  <span>Наименование</span>
                  <span className="text-right pr-6">Наличие</span>
                  <span className="text-right pr-6">Доставка</span>
                  <span className="text-right pr-6">Склад</span>
                  <span className="text-right">Цена</span>
                </div>

                <div className="divide-y divide-border">
                  {offers.map((offer, idx) => {
                    const delivery = deliveryLabel(offer.delivery_days);
                    return (
                      <div
                        key={offer.offer_id || idx}
                        className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 px-4 py-3 items-center hover:bg-muted/20 transition-colors"
                      >
                        <div className="min-w-0 pr-4">
                          <div className="font-medium text-sm">{offer.brand}</div>
                          <div className="text-xs text-muted-foreground truncate">{offer.description || offer.article}</div>
                        </div>

                        <div className="text-right pr-6">
                          <span className="text-sm font-medium">
                            {offer.quantity > 100 ? "100+" : offer.quantity} шт.
                          </span>
                        </div>

                        <div className="text-right pr-6">
                          <Badge variant={delivery.color === "default" ? "default" : "secondary"} className="text-xs">
                            {delivery.text}
                          </Badge>
                        </div>

                        <div className="text-right pr-6 max-w-[140px]">
                          <span className="text-xs text-muted-foreground truncate block" title={offer.warehouse_name}>
                            {offer.warehouse_name}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="font-semibold text-sm text-foreground">{formatPrice(offer.price)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {offers === null && !loading && !error && (
          <div className="bg-white rounded-xl border border-border p-12 text-center">
            <Icon name="Search" size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Введите каталожный номер для поиска</p>
            <p className="text-sm text-muted-foreground mt-1">Например: GFT0136, 026 121 005, K02189 и т.д.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PartSearch;
