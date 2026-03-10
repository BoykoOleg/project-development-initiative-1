export const SectionNoSystemMistake = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">
      80% начинающих трейдеров сливают депозит не потому, что не понимают анализ. А потому что торгуют хаотично — без правил, без плана, на эмоциях.
    </p>
    <div className="space-y-2">
      {[
        {
          mistake: "Вход «по ощущению»",
          fix: "Входить только при совпадении всех 3 факторов конфлюэнса",
          color: "text-red-400",
          border: "border-red-500/30",
        },
        {
          mistake: "Удвоение ставки после проигрыша",
          fix: "Фиксированная ставка 2% — всегда, независимо от предыдущего результата",
          color: "text-orange-400",
          border: "border-orange-500/30",
        },
        {
          mistake: "Торговля в нервном состоянии",
          fix: "Если устал или расстроен — платформа закрыта. Эмоции = убытки",
          color: "text-yellow-400",
          border: "border-yellow-500/30",
        },
        {
          mistake: "Игнорирование дневного стоп-лосса",
          fix: "3 проигрыша подряд = стоп на сегодня. Завтра рынок никуда не уйдёт",
          color: "text-purple-400",
          border: "border-purple-500/30",
        },
      ].map((item, i) => (
        <div key={i} className={`bg-zinc-900 border ${item.border} rounded-lg p-3`}>
          <div className={`font-orbitron text-xs font-bold mb-1 ${item.color}`}>✗ {item.mistake}</div>
          <div className="text-zinc-300 text-xs font-space-mono">→ {item.fix}</div>
        </div>
      ))}
    </div>

    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
      <div className="text-yellow-400 font-orbitron text-xs font-bold mb-2">Из жизни: история Джесси Ливермора</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Джесси Ливермор трижды зарабатывал и трижды терял многомиллионные состояния.
        Причина потерь каждый раз одна — он нарушал собственные правила: торговал на слухи, увеличивал позиции без оснований, игнорировал сигналы рынка.
        В своей книге «Воспоминания биржевого спекулянта» он признаёт: «Мои ошибки никогда не были ошибками анализа.
        Это были ошибки дисциплины». Самая дорогая наука в трейдинге — следовать своим же правилам.
      </p>
    </div>
  </div>
)
