import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { addToCart, getCart, getCartCount } from '@/lib/cart';

interface ProductDetails {
  id: number;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  pricePrefix?: string;
  images: string[];
  magnification: string;
  weight: string;
  fullDescription: string;
  specifications: {
    label: string;
    value: string;
  }[];
  package: string[];
}

const productsData: ProductDetails[] = [
  {
    id: 1,
    name: 'ProVision X3',
    description: 'Профессиональные бинокуляры с увеличением 3.5x и LED подсветкой',
    price: 89900,
    images: [
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/files/04e000fb-3d6f-472a-a8e7-258bf89f49dd.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/files/15c078bd-817b-4e48-8e88-7225f499093b.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/files/ff5e5d35-bc58-4373-abb8-5856e0b4feba.jpg'
    ],
    magnification: '3.5x',
    weight: '280г',
    fullDescription: 'ProVision X3 — это профессиональные стоматологические бинокуляры, разработанные для врачей, которые ценят точность и комфорт. Оптическая система высокого разрешения обеспечивает четкое изображение, а встроенная LED подсветка позволяет работать в любых условиях освещения. Эргономичная конструкция снижает нагрузку на шею и спину при длительной работе.',
    specifications: [
      { label: 'Увеличение', value: '3.5x' },
      { label: 'Рабочее расстояние', value: '340-420 мм' },
      { label: 'Поле зрения', value: '95 мм' },
      { label: 'Вес', value: '280 г' },
      { label: 'LED подсветка', value: 'Да, 5000K' },
      { label: 'Материал оправы', value: 'Алюминиевый сплав' },
      { label: 'Гарантия', value: '2 года' }
    ],
    package: [
      'Бинокуляры ProVision X3',
      'LED осветитель',
      'Защитный кейс',
      'Салфетка для чистки оптики',
      'Адаптер для крепления на очки',
      'Инструкция по эксплуатации'
    ]
  },
  {
    id: 2,
    name: 'MasterView Elite',
    description: 'Премиум бинокуляры с регулируемым углом и титановой оправой',
    price: 124900,
    images: [
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/files/15c078bd-817b-4e48-8e88-7225f499093b.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/files/ff5e5d35-bc58-4373-abb8-5856e0b4feba.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/files/04e000fb-3d6f-472a-a8e7-258bf89f49dd.jpg'
    ],
    magnification: '4.5x',
    weight: '245г',
    fullDescription: 'MasterView Elite — премиальное решение для взыскательных профессионалов. Титановая оправа обеспечивает минимальный вес при максимальной прочности. Уникальная система регулировки угла наклона позволяет найти идеальное положение для любого врача. Многослойное просветляющее покрытие линз гарантирует максимальную четкость и контрастность изображения.',
    specifications: [
      { label: 'Увеличение', value: '4.5x' },
      { label: 'Рабочее расстояние', value: '380-480 мм' },
      { label: 'Поле зрения', value: '105 мм' },
      { label: 'Вес', value: '245 г' },
      { label: 'LED подсветка', value: 'Да, регулируемая 4000-6000K' },
      { label: 'Материал оправы', value: 'Титановый сплав Grade 5' },
      { label: 'Регулировка угла', value: '0-60°' },
      { label: 'Гарантия', value: '3 года' }
    ],
    package: [
      'Бинокуляры MasterView Elite',
      'LED осветитель с регулировкой температуры',
      'Премиум кейс из карбона',
      'Набор для чистки оптики',
      'Два адаптера для крепления',
      'Запасные носовые упоры',
      'Инструкция и сертификат',
      'Расширенная гарантия 3 года'
    ]
  },
  {
    id: 4,
    name: 'Бинокулярные лупы Ergo Pro Max',
    description: 'Апохроматические линзы из оптического стекла. Немецкая оптика Schott',
    price: 119000,
    oldPrice: 140000,
    images: [
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/3b55f8aa-fa7d-4d46-b7a4-9c61403d5480.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/12174e7b-0e1f-494d-bf25-440d69141745.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/8c764786-55fd-4183-8882-8e8977c53595.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/27c8a966-c43a-4f62-a3df-a75be58344d7.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/93b3bd79-2836-4b7b-b6ed-777fe44001e3.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/c8d91b54-a68d-47b7-b308-ff51cb26fafd.jpg'
    ],
    magnification: '3.0х / 4.0х / 5.0х / 6.0х',
    weight: 'Зависит от конфигурации',
    fullDescription: 'Бинокулярные лупы Ergo Pro Max — профессиональное решение с апохроматическими линзами из немецкого оптического стекла Schott. Многослойное покрытие с антибликовым эффектом и защитой от запотевания и царапин. Конструкция бинокуляров, расположенная под углом, позволяет держать голову прямо, благодаря чему снижается нагрузка на спину. Асинхронная настройка межзрачкового расстояния. Высокая прочность и легкость за счет материала аэрокосмического класса. Высокое разрешение, чистое и четкое поле обзора без размытия и виньетирования. Возможность крепления осветительного прибора. Рекомендуем использовать в паре с «Беспроводной головной осветитель Pro Max»',
    specifications: [
      { label: 'Увеличение', value: '3.0х, 4.0х, 5.0х, 6.0х' },
      { label: 'Рабочее расстояние', value: '450-550 мм' },
      { label: 'Поле обзора', value: '50-105 мм' },
      { label: 'Глубина обзора', value: '55-135 мм' },
      { label: 'Оптика', value: 'Апохроматические линзы Schott' },
      { label: 'Покрытие', value: 'Многослойное антибликовое с защитой от запотевания' },
      { label: 'Материал', value: 'Аэрокосмический класс / Алюминиевый сплав' },
      { label: 'Настройка', value: 'Асинхронная регулировка межзрачкового расстояния' },
      { label: 'Эргономика', value: 'Угловая конструкция для прямой посадки головы' }
    ],
    package: [
      'Бинокулярные лупы',
      'Салфетка для чистки',
      'Ключ/Отвертка',
      'Шнурок',
      'Инструкции',
      'Кейс'
    ]
  },
  {
    id: 5,
    name: 'Беспроводной головной осветитель Pro Max',
    description: 'Беспроводной головной осветитель Pro Max обеспечивает непрерывную работу без необходимости подключения к кабелю. Высокое качество света, имеются два уровня яркости, переключаемые сенсорным нажатием',
    price: 59000,
    oldPrice: 65000,
    images: [
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/703a6f7a-c7ca-44c5-b547-29adc2572176.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/3ade518b-2925-43e8-9a71-9aa9b74dd03f.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/fdfd6c4c-386b-4e62-97b4-51c81ea5b332.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/2b4990d3-7f4d-44b4-b57f-be70f4c71730.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/80e79124-5a2f-49c9-8491-3eeba6300010.jpg'
    ],
    magnification: '35000 ЛК',
    weight: '10,8 г (осветитель), 19,2 г (аккумулятор)',
    fullDescription: 'Беспроводной головной осветитель Pro Max обеспечивает непрерывную работу без необходимости подключения к кабелю. Высокое качество света, имеются два уровня яркости, переключаемые сенсорным нажатием. Идеальное решение для профессионалов, работающих с бинокулярными лупами. Легкий вес и эргономичная конструкция обеспечивают комфорт при длительной работе.',
    specifications: [
      { label: 'Цветовая температура', value: '5700 K' },
      { label: 'Интенсивность', value: '35000 ЛК' },
      { label: 'Время зарядки', value: '1 ч' },
      { label: 'Время беспрерывной работы', value: '2 ч' },
      { label: 'Вес осветителя', value: '10,8 г' },
      { label: 'Вес аккумулятора', value: '19,2 г' },
      { label: 'Управление', value: 'Сенсорное, два уровня яркости' },
      { label: 'Тип питания', value: 'Аккумуляторный, 3 батареи в комплекте' }
    ],
    package: [
      'Осветитель 1 шт',
      'Аккумулятор 3 шт',
      'Зарядная площадка 1 шт',
      'Зарядное устройство 1 шт',
      'Кабель для зарядки 1 шт',
      'Желтый фильтр 1 шт',
      'Ключ/Отвертка 1 шт',
      'Руководство по эксплуатации 1 шт',
      'Кейс/Сумка 1 шт'
    ]
  },
  {
    id: 6,
    name: 'Бинокулярные лупы Individual Ergo Pro Max',
    description: '5 цветов оправы (на выбор). Апохроматические линзы из оптического стекла. Немецкая оптика Schott',
    price: 120000,
    pricePrefix: 'от',
    images: [
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/e3b98d1a-685a-46af-a35e-939c4ddf17a0.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/53468cd2-66a9-41ef-af6e-c07606ed7bc3.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/1af22c58-e01a-4a69-b30e-3e3e6fd43743.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/0d0fca71-5b7a-4bd8-aa46-c5f2590eed59.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/ecd41ed6-8aaf-48e0-8463-2d09ead9a80f.jpg'
    ],
    magnification: '3.0х / 4.0х / 5.0х / 6.0х',
    weight: 'Зависит от конфигурации',
    fullDescription: 'Бинокулярные лупы Individual Ergo Pro Max — профессиональное решение с апохроматическими линзами из немецкого оптического стекла Schott. Многослойное покрытие с антибликовым эффектом и защитой от запотевания и царапин. Конструкция бинокуляров, расположенная под углом, позволяет держать голову прямо, благодаря чему снижается нагрузка на спину. Высокая прочность и легкость оправы. Высокое разрешение, чистое и четкое поле обзора без размытия и виньетирования. Возможность крепления осветительного прибора. Рекомендуем использовать в паре с «Беспроводной головной осветитель Pro Max». Доступны 5 цветов оправы на выбор.',
    specifications: [
      { label: 'Увеличение', value: '3.0х, 4.0х, 5.0х, 6.0х' },
      { label: 'Рабочее расстояние', value: '450-550 мм' },
      { label: 'Поле обзора', value: '50-105 мм' },
      { label: 'Глубина обзора', value: '55-135 мм' },
      { label: 'Оптика', value: 'Апохроматические линзы Schott' },
      { label: 'Покрытие', value: 'Многослойное антибликовое с защитой от запотевания и царапин' },
      { label: 'Эргономика', value: 'Угловая конструкция для прямой посадки головы' },
      { label: 'Цвета оправы', value: '5 вариантов на выбор' },
      { label: 'Дополнительно', value: 'Возможность крепления осветителя' }
    ],
    package: [
      'Бинокулярные лупы',
      'Салфетка для чистки',
      'Шнурок',
      'Инструкции',
      'Кейс'
    ]
  },
  {
    id: 7,
    name: 'Универсальный Осветитель Беспроводной',
    description: 'Быстросъемные аккумуляторы на магнитном креплении. Универсальное крепление с прищепкой для бинокуляров и очков',
    price: 39000,
    oldPrice: 45000,
    images: [
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/77ad6c44-8add-474d-af5f-5e8f0d5edaf1.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/1d013ae6-8169-4c9f-99df-ab4d9f956655.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/f8b2e96e-aae6-48d3-8e9c-ccf1f66a2bef.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/8377fb17-715b-4d28-be2c-f9695173bbeb.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/87cdae99-d4e3-4196-8cfd-c57f4e3a2ae6.jpg'
    ],
    magnification: '20 000-60 000 Люкс',
    weight: '42 г',
    fullDescription: 'Универсальный Осветитель Беспроводной с быстросъемными аккумуляторами на магнитном креплении. Включение по нажатию: тач-пад позволяет быстро включать и выключать прибор. Универсальное крепление — данный осветитель для бинокуляров и очков оснащен удобной и надежной прищепкой, которая легко и прочно крепится на оправу. Осветитель создает однородное, четко очерченное световое пятно без засветов. Такой стоматологический свет обеспечивает отличную видимость рабочего поля. Оранжевый фильтр предотвращает преждевременное отверждение композита.',
    specifications: [
      { label: 'Вес', value: '42 г' },
      { label: 'Мощность источника света', value: '5 Вт' },
      { label: 'Интенсивность света', value: '20 000-60 000 Люкс' },
      { label: 'Время полной зарядки', value: '3 часа' },
      { label: 'Срок службы лампы', value: '10 000 часов' },
      { label: 'Входное напряжение', value: 'AC100-240V/50-60 Гц' },
      { label: 'Аккумулятор', value: '650 мАч × 2 / 3,7 В' },
      { label: 'Конфигурация батареи', value: 'Две батареи' },
      { label: 'Установка батареи', value: 'Магнитный тип' },
      { label: 'Управление', value: 'Тач-пад' },
      { label: 'Дополнительно', value: 'Оранжевый фильтр в комплекте' }
    ],
    package: [
      'Кейс/Сумка 1 шт',
      'Осветитель 1 шт',
      'Аккумулятор беспроводной 2 шт',
      'Зарядное устройство 1 шт',
      'Инструкция по эксплуатации 1 шт'
    ]
  },
  {
    id: 8,
    name: 'Бинокулярные лупы Ergo Pro',
    description: 'Апохроматические линзы из оптического стекла HOYA (Япония). Многослойное покрытие с антибликовым эффектом и защитой от запотевания и царапин',
    price: 91000,
    oldPrice: 120000,
    images: [
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/b04850ec-e298-4ab6-b105-a0dff8fafd12.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/5f7c42a3-77b2-4992-a9b1-845de077a326.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/7ed2c9b5-10e2-4b14-b729-5b9755a3e3d5.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/3cc5a160-0372-4fb4-86d1-26494f93cccd.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/7d4e301e-ed86-414a-9467-055515eff483.jpg'
    ],
    magnification: '4.0х / 5.0х / 6.0х',
    weight: 'Зависит от конфигурации',
    fullDescription: 'Бинокулярные лупы Ergo Pro — профессиональное решение с апохроматическими линзами из оптического стекла HOYA (Япония). Многослойное покрытие с антибликовым эффектом и защитой от запотевания и царапин. Конструкция бинокуляров, расположенная под углом, позволяет держать голову прямо, благодаря чему снижается нагрузка на спину. Асинхронная настройка межзрачкового расстояния. Высокая прочность и легкость за счет материала аэрокосмического класса. Высокое разрешение, чистое и четкое поле обзора без размытия и виньетирования. Возможность крепления осветительного прибора. Рекомендуем использовать в паре с «головной осветитель Pro»',
    specifications: [
      { label: 'Увеличение', value: '4.0х, 5.0х, 6.0х' },
      { label: 'Рабочее расстояние', value: '350-460 мм' },
      { label: 'Поле обзора', value: '50 мм' },
      { label: 'Оптика', value: 'Апохроматические линзы HOYA (Япония)' },
      { label: 'Покрытие', value: 'Многослойное антибликовое с защитой от запотевания и царапин' },
      { label: 'Материал', value: 'Аэрокосмический класс / Алюминиевый сплав' },
      { label: 'Настройка', value: 'Асинхронная регулировка межзрачкового расстояния' },
      { label: 'Эргономика', value: 'Угловая конструкция для прямой посадки головы' }
    ],
    package: [
      'Бинокулярные лупы',
      'Салфетка для чистки',
      'Ключ/Отвертка',
      'Шнурок',
      'Инструкции',
      'Кейс'
    ]
  },
  {
    id: 9,
    name: 'Осветитель Pro',
    description: 'Светодиодный стоматологический осветитель с цветовой температурой 5000 К и индексом цветопередачи CRI>90%',
    price: 29000,
    oldPrice: 40000,
    images: [
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/092db74a-716a-4f9c-8a1b-a5f3f372ea05.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/dfa24761-9aa5-4975-aec7-dfb9f9324097.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/53b3d756-3b34-42f7-877c-9c677c2464f5.jpg'
    ],
    magnification: '90 000 лк',
    weight: 'Не указан',
    fullDescription: 'Светодиодный стоматологический осветитель с цветовой температурой 5000 К, что соответствует качеству освещения в полдень, с индексом цветопередачи CRI>90%, воспроизводит реалистичные цвета, обеспечивает четкие круглые световые пятна и плавную регулировки яркости. Возможность крепления осветительного прибора. Рекомендуем использовать в паре с «Бинокулярные лупы Ergo Pro»',
    specifications: [
      { label: 'Мощность', value: '5 Вт' },
      { label: 'Емкость батареи', value: '3500 мАч' },
      { label: 'Цветовая температура', value: '5000 К' },
      { label: 'Уровни яркости', value: '4 уровня: 25%, 50%, 75%, 100%' },
      { label: 'Яркость на расстоянии 0 см', value: '90 000 лк (макс. мощность)' },
      { label: 'Индекс цветопередачи', value: 'CRI>90%' }
    ],
    package: [
      'Кейс/Сумка 1 шт',
      'Осветитель 1 шт',
      'Аккумулятор с прищепкой/фиксатором 1 шт',
      'Зарядное устройство 1 шт',
      'Инструкция по эксплуатации 1 шт'
    ]
  },
  {
    id: 10,
    name: 'Комплект Бинокулярные лупы Ergo + Осветитель',
    description: 'Эрго линзы из оптического стекла Glance (Корея). Конструкция бинокуляров, расположенная под углом, позволяет держать голову прямо',
    price: 64000,
    oldPrice: 80000,
    images: [
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/81e572ea-b705-4e77-984a-4c56607870d9.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/b73199be-cd7d-4859-9e01-c43913a3bad3.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/045026b8-219f-4644-b0c7-f023ce65202e.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/446a652e-52c5-456d-903a-3954e0be3a69.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/c0f53195-e80b-4266-ab1c-7ef8b583451e.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/6ec5aba3-eb77-48b2-ab8a-7f3701096c50.jpg'
    ],
    magnification: '5.0х',
    weight: 'Не указан',
    fullDescription: 'Эрго линзы из оптического стекла Glance (Корея). Конструкция бинокуляров, расположенная под углом, позволяет держать голову прямо, благодаря чему снижается нагрузка на спину и шею. Асинхронная настройка межзрачкового расстояния. Высокая прочность и легкость оправы + дополнительный адаптер для компенсирования диоптрий. Высокое разрешение, чистое и четкое поле обзора без размытия и виньетирования.',
    specifications: [
      { label: 'Увеличение', value: '5.0х' },
      { label: 'Рабочее расстояние', value: '350-550 мм регулируемое' },
      { label: 'Настройка', value: 'Асинхронная настройка межзрачкового расстояния' },
      { label: 'Мощность осветителя', value: '5 Вт' },
      { label: 'Емкость батареи', value: '3500 мАч' },
      { label: 'Цветовая температура', value: '5000 К' },
      { label: 'Яркость', value: 'Регулируемая' }
    ],
    package: [
      'Бинокулярные лупы с дополнительным адаптером для компенсирования диоптрий',
      'Осветитель-1',
      'Аккумулятор',
      'Зарядное устройство',
      'Салфетка для чистки',
      'Ключ/Отвертка',
      'Шнурок',
      'Инструкции',
      'Кейс'
    ]
  },
  {
    id: 11,
    name: 'Комплект Бинокулярные лупы Basic + Осветитель',
    description: 'Отличный комплект для начинающих специалистов, которые хотят начать работать с увеличением',
    price: 44000,
    oldPrice: 60000,
    images: [
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/3d7a85fe-13f4-4726-983f-1439c2d26d31.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/e75af239-f704-415a-894e-6dea2c126d58.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/5a3c934a-3d76-44d3-ab37-8fbd0fa349dd.jpg',
      'https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/590ead76-c917-407e-9605-31067b6e04f1.jpg'
    ],
    magnification: '3.5х',
    weight: '~300 г',
    fullDescription: 'Отличный комплект для начинающих специалистов, которые хотят начать работать с увеличением. Линзы из оптического стекла Glance (Корея). Асинхронная настройка межзрачкового расстояния. Высокая прочность и легкость оправы + дополнительный адаптер для компенсирования диоптрий. Высокое разрешение, чистое и четкое поле обзора без размытия и виньетирования.',
    specifications: [
      { label: 'Увеличение', value: '3.5х' },
      { label: 'Рабочее расстояние', value: '350-550 мм (регулируемое)' },
      { label: 'Настройка', value: 'Асинхронная регулировка межзрачкового расстояния' },
      { label: 'Оптика', value: 'Оптическое стекло Glance (Корея)' },
      { label: 'Мощность осветителя', value: '5 Вт' },
      { label: 'Емкость батареи', value: '3500 мАч' },
      { label: 'Цветовая температура', value: '5000 К' },
      { label: 'Яркость', value: 'Регулируемая' }
    ],
    package: [
      'Бинокулярные лупы с дополнительным адаптером для компенсирования диоптрий',
      'Осветитель',
      'Аккумулятор',
      'Зарядное устройство',
      'Салфетка для чистки',
      'Ключ/Отвертка',
      'Шнурок',
      'Инструкции',
      'Кейс'
    ]
  }
];

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [showScrollArrow, setShowScrollArrow] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    setCartCount(getCartCount(getCart()));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollArrow(window.scrollY < 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const product = productsData.find(p => p.id === Number(id));

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Товар не найден</h1>
          <Button onClick={() => navigate('/')}>Вернуться на главную</Button>
        </div>
      </div>
    );
  }

  const handleOrder = () => {
    navigate('/', { state: { scrollTo: 'purchase', productId: product.id } });
  };

  return (
    <>
    {showScrollArrow && (
      <div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1 cursor-pointer select-none"
        onClick={() => window.scrollBy({ top: 300, behavior: 'smooth' })}
      >
        <span className="text-2xl md:text-4xl font-bold text-primary tracking-widest uppercase">листай вниз</span>
        <div className="animate-bounce">
          <Icon name="ChevronDown" size={128} className="text-primary drop-shadow-lg" />
        </div>
      </div>
    )}
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/', { state: { scrollTo: 'catalog' } })}>
              <Icon name="ArrowLeft" size={20} className="mr-2" />
              Назад в каталог
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate('/cart')}
            >
              <Icon name="ShoppingCart" size={24} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 md:px-4 py-4 md:py-12">
        <div className="grid lg:grid-cols-2 gap-4 md:gap-12 mb-8 md:mb-12">
          <div className="space-y-3">
            <div 
              className="aspect-[4/3] md:aspect-square overflow-hidden rounded-lg bg-gray-100 relative group cursor-pointer"
              onClick={() => setIsFullscreen(true)}
            >
              <img 
                src={product.images[selectedImageIndex]} 
                alt={product.name} 
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <Icon name="Maximize2" size={48} className="text-white opacity-0 group-hover:opacity-70 transition-opacity" />
              </div>
              {product.images.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
                    onClick={() => setSelectedImageIndex(prev => prev === 0 ? product.images.length - 1 : prev - 1)}
                  >
                    <Icon name="ChevronLeft" size={24} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
                    onClick={() => setSelectedImageIndex(prev => prev === product.images.length - 1 ? 0 : prev + 1)}
                  >
                    <Icon name="ChevronRight" size={24} />
                  </Button>
                </>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 md:grid md:grid-cols-4 md:gap-3">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 md:w-auto md:h-auto md:aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                      selectedImageIndex === index 
                        ? 'border-primary shadow-lg' 
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img 
                      src={img} 
                      alt={`${product.name} ${index + 1}`} 
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 md:space-y-6">
            <div>
              <div className="flex gap-2 mb-3 md:mb-4">
                <Badge className="bg-primary text-white">В наличии</Badge>
                {product.oldPrice && <Badge className="bg-red-500 text-white">АКЦИЯ</Badge>}
              </div>
              <h1 className="text-2xl md:text-4xl font-display font-bold mb-3">{product.name}</h1>
              <div className="flex items-center gap-3 mb-4">
                <div className={`text-2xl md:text-4xl font-bold ${product.oldPrice ? 'text-red-600' : 'text-primary'}`}>
                  {product.pricePrefix && <span className="text-xl md:text-2xl mr-2">{product.pricePrefix}</span>}
                  {product.price.toLocaleString('ru-RU')} ₽
                </div>
                {product.oldPrice && (
                  <div className="text-lg md:text-2xl text-gray-400 line-through">
                    {product.oldPrice.toLocaleString('ru-RU')} ₽
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-gray-600">
                  {(product.id === 5 || product.id === 7 || product.id === 9) ? 'Интенсивность света:' : 'Увеличение:'}
                </span>
                <Badge variant="secondary" className="text-lg">{product.magnification}</Badge>
              </div>
            </div>

            <div className="space-y-3 pt-4 md:pt-6">
              <Button 
                size="lg" 
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => {
                  addToCart({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.images[0]
                  });
                  setCartCount(getCartCount(getCart()));
                  toast({
                    title: "Добавлено в корзину",
                    description: `${product.name} добавлен в корзину`,
                  });
                }}
              >
                <Icon name="ShoppingCart" size={20} className="mr-2" />
                Добавить в корзину
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/', { state: { scrollTo: 'testdrive' } })}
              >
                <Icon name="Calendar" size={20} className="mr-2" />
                Записаться на тест-драйв
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2 md:gap-4 pt-4 md:pt-6 border-t">
              <div className="text-center">
                <Icon name="Shield" size={24} className="mx-auto mb-2 text-primary" />
                <p className="text-sm text-gray-400">Гарантия качества</p>
              </div>
              <div className="text-center">
                <Icon name="Truck" size={24} className="mx-auto mb-2 text-primary" />
                <p className="text-sm text-gray-400">Доставка по РФ</p>
              </div>
              <div className="text-center">
                <Icon name="Wrench" size={24} className="mx-auto mb-2 text-primary" />
                <p className="text-sm text-gray-400">Сервисное обслуживание</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="description" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="description">Описание</TabsTrigger>
            <TabsTrigger value="specifications">Характеристики</TabsTrigger>
            <TabsTrigger value="package">Комплектация</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <p className="text-lg text-gray-300">{product.fullDescription}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specifications" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {product.specifications.map((spec, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                    >
                      <span className="font-medium text-gray-400">{spec.label}</span>
                      <span className="font-semibold">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="package" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  {product.package.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <Icon name="CheckCircle" size={20} className="text-primary mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>

    {isFullscreen && (
      <div 
        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
        onClick={() => setIsFullscreen(false)}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-white hover:bg-white/20"
          onClick={() => setIsFullscreen(false)}
        >
          <Icon name="X" size={32} />
        </Button>
        
        <div className="relative max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
          <img 
            src={product.images[selectedImageIndex]} 
            alt={product.name} 
            className="max-w-full max-h-[90vh] object-contain"
          />
          
          {product.images.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                onClick={() => setSelectedImageIndex(prev => prev === 0 ? product.images.length - 1 : prev - 1)}
              >
                <Icon name="ChevronLeft" size={24} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                onClick={() => setSelectedImageIndex(prev => prev === product.images.length - 1 ? 0 : prev + 1)}
              >
                <Icon name="ChevronRight" size={24} />
              </Button>
            </>
          )}
        </div>
      </div>
    )}
    </>
  );
}