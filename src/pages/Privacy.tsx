import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { useNavigate } from "react-router-dom";

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <Icon name="ArrowLeft" size={20} className="mr-2" />
            Назад
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Политика конфиденциальности</h1>

        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Общие положения</h2>
            <p>
              Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных
              пользователей сайта. Используя сайт, вы соглашаетесь с условиями данной Политики.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Какие данные мы собираем</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Имя и контактные данные (при заполнении форм на сайте)</li>
              <li>Номер телефона и адрес электронной почты</li>
              <li>Данные об использовании сайта (cookies, IP-адрес, тип браузера)</li>
              <li>Информация о заказах и предпочтениях</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Цели обработки данных</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Обработка заказов и предоставление услуг</li>
              <li>Связь с пользователями по вопросам заказов</li>
              <li>Улучшение качества обслуживания и работы сайта</li>
              <li>Аналитика посещаемости сайта</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Файлы cookie</h2>
            <p>
              Сайт использует файлы cookie для корректной работы, сохранения пользовательских настроек
              и сбора аналитических данных. Вы можете отключить cookie в настройках браузера,
              однако это может повлиять на функциональность сайта.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Защита данных</h2>
            <p>
              Мы принимаем необходимые организационные и технические меры для защиты персональных данных
              от несанкционированного доступа, изменения, раскрытия или уничтожения.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Передача данных третьим лицам</h2>
            <p>
              Персональные данные не передаются третьим лицам, за исключением случаев, предусмотренных
              законодательством Российской Федерации.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Права пользователя</h2>
            <p>
              Вы имеете право запросить информацию о хранимых персональных данных, потребовать их
              исправления или удаления, обратившись к нам через контактные данные, указанные на сайте.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Изменения политики</h2>
            <p>
              Мы оставляем за собой право вносить изменения в настоящую Политику конфиденциальности.
              Актуальная версия всегда доступна на данной странице.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
