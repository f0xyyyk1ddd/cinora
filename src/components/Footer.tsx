export default function Footer() {
  return (
    <footer className="w-full bg-[#0a0a0f] py-12 px-4 md:px-12 mt-10 border-t border-white/10 text-gray-500 text-sm">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
        <div className="flex flex-col gap-3">
          <a href="#" className="hover:text-white transition-colors">Частые вопросы</a>
          <a href="#" className="hover:text-white transition-colors">Связи с инвесторами</a>
          <a href="#" className="hover:text-white transition-colors">Способы просмотра</a>
          <a href="#" className="hover:text-white transition-colors">Корпоративная информация</a>
        </div>
        <div className="flex flex-col gap-3">
          <a href="#" className="hover:text-white transition-colors">Центр помощи</a>
          <a href="#" className="hover:text-white transition-colors">Вакансии</a>
          <a href="#" className="hover:text-white transition-colors">Условия использования</a>
          <a href="#" className="hover:text-white transition-colors">Свяжитесь с нами</a>
        </div>
        <div className="flex flex-col gap-3">
          <a href="#" className="hover:text-white transition-colors">Аккаунт</a>
          <a href="#" className="hover:text-white transition-colors">Подарочные карты</a>
          <a href="#" className="hover:text-white transition-colors">Конфиденциальность</a>
          <a href="#" className="hover:text-white transition-colors">Проверка скорости</a>
        </div>
        <div className="flex flex-col gap-3">
          <a href="#" className="hover:text-white transition-colors">Медиацентр</a>
          <a href="#" className="hover:text-white transition-colors">Купить подарочную карту</a>
          <a href="#" className="hover:text-white transition-colors">Настройки файлов cookie</a>
          <a href="#" className="hover:text-white transition-colors">Правовая информация</a>
        </div>
      </div>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <p>CINORA</p>
        <p className="text-xs">&copy; {new Date().getFullYear()} CINORA, Inc.</p>
      </div>
    </footer>
  )
}
